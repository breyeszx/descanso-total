"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requirePerfil } from "@/lib/auth";
import { dbError, errorState, formToObject, zodError, type FormState } from "@/lib/form";
import { enviarPendientesSilencioso } from "@/app/(app)/pagos/actions";

const pagoSchema = z.object({
  concepto: z.enum(["anticipo", "saldo", "servicio_extra", "cargo", "reembolso"]),
  medio: z.enum(["transferencia", "efectivo", "webpay"]),
  monto: z.coerce.number().int().positive("Ingresa un monto mayor a 0"),
  notas: z.string().trim().optional(),
});

/** Registra un pago presencial (transferencia/efectivo) ya recibido. Dispara confirmación e ingreso vía triggers. */
export async function registrarPagoManual(reservaId: number, _: FormState, formData: FormData): Promise<FormState> {
  const perfil = await requirePerfil(["admin", "funcionario"]);
  const parsed = pagoSchema.safeParse(formToObject(formData));
  if (!parsed.success) return zodError(parsed.error, formData);
  const supabase = await createClient();
  const { error } = await supabase.from("pagos").insert({
    reserva_id: reservaId,
    concepto: parsed.data.concepto,
    medio: parsed.data.medio,
    monto: parsed.data.monto,
    estado: "aprobado",
    pagado_at: new Date().toISOString(),
    registrado_por: perfil.id,
    notas: parsed.data.notas ?? null,
  });
  if (error) return errorState(dbError(error.message), formData);
  await enviarPendientesSilencioso();
  revalidarReserva(reservaId);
  return { ok: "Pago registrado" };
}

export async function cancelarReservaAdmin(reservaId: number, _: FormState, formData: FormData): Promise<FormState> {
  await requirePerfil(["admin", "funcionario"]);
  const motivo = String(formData.get("motivo") ?? "").trim();
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancelar_reserva", { p_reserva: reservaId, p_motivo: motivo || undefined });
  if (error) return { error: dbError(error.message) };
  await enviarPendientesSilencioso();
  revalidarReserva(reservaId);
  return { ok: "Reserva cancelada" };
}

export async function marcarNoShow(reservaId: number) {
  await requirePerfil(["admin", "funcionario"]);
  const supabase = await createClient();
  await supabase.from("reservas").update({ estado: "no_show" }).eq("id", reservaId).in("estado", ["confirmada", "pendiente_pago"]);
  revalidarReserva(reservaId);
}

export async function reenviarNotificaciones() {
  await requirePerfil(["admin"]);
  await enviarPendientesSilencioso();
  revalidatePath("/admin/reservas");
}

function revalidarReserva(id: number) {
  revalidatePath(`/admin/reservas/${id}`);
  revalidatePath("/admin/reservas");
  revalidatePath(`/mis-reservas/${id}`);
  revalidatePath("/dashboard");
}
