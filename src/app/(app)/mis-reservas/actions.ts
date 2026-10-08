"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { dbError, errorState, formToObject, zodError, type FormState } from "@/lib/form";
import { enviarPendientesSilencioso } from "@/app/(app)/pagos/actions";

const acompananteSchema = z.object({
  nombre: z.string().trim().min(2, "Ingresa el nombre"),
  documento: z.string().trim().min(5, "Ingresa RUT o pasaporte"),
  fecha_nacimiento: z.string().optional(),
  telefono: z.string().trim().optional(),
});

export async function agregarAcompanante(reservaId: number, _: FormState, formData: FormData): Promise<FormState> {
  const parsed = acompananteSchema.safeParse(formToObject(formData));
  if (!parsed.success) return zodError(parsed.error, formData);
  const supabase = await createClient();
  const { error } = await supabase.from("acompanantes").insert({
    reserva_id: reservaId,
    nombre: parsed.data.nombre,
    documento: parsed.data.documento,
    fecha_nacimiento: parsed.data.fecha_nacimiento || null,
    telefono: parsed.data.telefono ?? null,
  });
  if (error) return errorState(dbError(error.message), formData);
  revalidatePath(`/mis-reservas/${reservaId}`);
  return { ok: "Acompañante registrado" };
}

export async function eliminarAcompanante(id: number, reservaId: number) {
  const supabase = await createClient();
  await supabase.from("acompanantes").delete().eq("id", id);
  revalidatePath(`/mis-reservas/${reservaId}`);
}

export async function cancelarReserva(reservaId: number, _: FormState, formData: FormData): Promise<FormState> {
  const motivo = String(formData.get("motivo") ?? "").trim();
  if (formData.get("confirmar") !== "on") return { error: "Confirma que deseas cancelar la reserva" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancelar_reserva", { p_reserva: reservaId, p_motivo: motivo || undefined });
  if (error) return { error: dbError(error.message) };
  await enviarPendientesSilencioso();
  revalidatePath(`/mis-reservas/${reservaId}`);
  revalidatePath("/mis-reservas");
  return { ok: "Reserva cancelada" };
}

const modificarSchema = z.object({
  inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  huespedes: z.coerce.number().int().min(1),
});

export async function modificarReserva(reservaId: number, _: FormState, formData: FormData): Promise<FormState> {
  const parsed = modificarSchema.safeParse(formToObject(formData));
  if (!parsed.success) return zodError(parsed.error, formData);
  const supabase = await createClient();
  const { error } = await supabase.rpc("modificar_reserva", {
    p_reserva: reservaId,
    p_inicio: parsed.data.inicio,
    p_fin: parsed.data.fin,
    p_huespedes: parsed.data.huespedes,
  });
  if (error) return errorState(dbError(error.message), formData);
  revalidatePath(`/mis-reservas/${reservaId}`);
  revalidatePath("/mis-reservas");
  return { ok: "Fechas actualizadas" };
}
