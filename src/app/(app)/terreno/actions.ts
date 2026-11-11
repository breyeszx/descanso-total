"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zDocumento, zNombrePersona } from "@/lib/contacto";
import { requirePerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dbError, errorState, formToObject, zodError, type FormState } from "@/lib/form";
import type { ChecklistItem } from "@/lib/pdf/acta";
import { emitirActaPdf } from "@/lib/actas";
import { enviarPendientesEnSegundoPlano } from "@/lib/notificaciones";

const baseSchema = z.object({
  observaciones: z.string().trim().max(2000).optional(),
  conformidad: z.preprocess((v) => v === "on", z.boolean()),
  cobro_monto: z.coerce.number().int("Monto inválido").min(0, "Monto inválido").default(0),
  cobro_medio: z.enum(["efectivo", "transferencia", "webpay"]).default("efectivo"),
  multa_monto: z.coerce.number().int("Monto inválido").min(0, "Monto inválido").default(0),
  multa_descripcion: z.string().trim().max(300).optional(),
  // PNG en data URL del lienzo de firma; el tope evita cargas enormes
  firma: z.string().max(700_000, "La firma es demasiado grande, vuelve a firmar").optional(),
});

const ESTADOS_ITEM = ["bueno", "danado", "faltante"] as const;

/** Lee el checklist desde los campos `item_<id>_estado`, `item_<id>_obs` e `item_<id>_cargo` de los ítems del departamento. */
function leerChecklist(formData: FormData, items: { id: number; nombre: string }[]): ChecklistItem[] {
  return items
    .filter((i) => formData.has(`item_${i.id}_estado`))
    .map((i) => {
      const crudo = String(formData.get(`item_${i.id}_estado`));
      const estado = ESTADOS_ITEM.find((e) => e === crudo) ?? "bueno";
      const observacion = String(formData.get(`item_${i.id}_obs`) ?? "").trim().slice(0, 300) || undefined;
      const cargo = Math.trunc(Number(formData.get(`item_${i.id}_cargo`) ?? 0)) || 0;
      return { item_id: i.id, nombre: i.nombre, estado, observacion, cargo: cargo > 0 ? cargo : undefined };
    });
}

/**
 * Registra el acta de check-in o check-out. Cobro, acta, cargos e inventario se guardan en una sola
 * transacción (RPC `registrar_acta`): si algo falla no queda nada a medias. El PDF se genera después;
 * si falla, el acta queda registrada igual y el PDF se regenera al abrirlo (`/api/actas/[id]`).
 */
async function registrarActa(tipo: "check_in" | "check_out", reservaId: number, formData: FormData): Promise<FormState> {
  await requirePerfil(["funcionario", "admin"]);
  const parsed = baseSchema.safeParse(formToObject(formData));
  if (!parsed.success) return zodError(parsed.error, formData);
  const d = parsed.data;
  if (tipo === "check_in" && !d.conformidad) return errorState("El cliente debe firmar conformidad para entregar el departamento", formData);

  const supabase = await createClient();
  const { data: r } = await supabase.from("reservas").select("departamento_id").eq("id", reservaId).single();
  if (!r) return errorState("Reserva no encontrada", formData);
  const { data: items } = await supabase.from("inventario_items").select("id, nombre").eq("departamento_id", r.departamento_id).neq("estado", "baja");

  const { data: actaId, error } = await supabase.rpc("registrar_acta", {
    p_reserva: reservaId,
    p_tipo: tipo,
    p_checklist: leerChecklist(formData, items ?? []),
    p_observaciones: d.observaciones,
    p_conformidad: d.conformidad,
    p_cobro_monto: d.cobro_monto,
    p_cobro_medio: d.cobro_medio,
    p_multa_monto: tipo === "check_out" ? d.multa_monto : 0,
    p_multa_descripcion: d.multa_descripcion,
  });
  if (error) return errorState(dbError(error.message), formData);

  try {
    await emitirActaPdf(actaId, d.firma);
  } catch (e) {
    console.error("acta pdf:", e);
  }

  enviarPendientesEnSegundoPlano();
  revalidarTodo(reservaId);
  redirect(`/terreno/${reservaId}/listo?acta=${actaId}`);
}

export async function registrarCheckIn(reservaId: number, _: FormState, formData: FormData): Promise<FormState> {
  return registrarActa("check_in", reservaId, formData);
}

export async function registrarCheckOut(reservaId: number, _: FormState, formData: FormData): Promise<FormState> {
  return registrarActa("check_out", reservaId, formData);
}

const acompSchema = z.object({ nombre: zNombrePersona("Nombre requerido"), documento: zDocumento });

export async function agregarAcompananteTerreno(reservaId: number, _: FormState, formData: FormData): Promise<FormState> {
  await requirePerfil(["funcionario", "admin"]);
  const parsed = acompSchema.safeParse(formToObject(formData));
  if (!parsed.success) return zodError(parsed.error, formData);
  const supabase = await createClient();
  const { error } = await supabase.from("acompanantes").insert({ reserva_id: reservaId, ...parsed.data });
  if (error) return errorState(dbError(error.message), formData);
  revalidatePath(`/terreno/${reservaId}/check-in`);
  return { ok: "Acompañante agregado" };
}

function revalidarTodo(id: number) {
  revalidatePath("/terreno");
  revalidatePath(`/admin/reservas/${id}`);
  revalidatePath(`/mis-reservas/${id}`);
  revalidatePath("/dashboard");
}
