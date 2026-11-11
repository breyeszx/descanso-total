"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { dbError, errorState, formToObject, zodError, type FormState } from "@/lib/form";
import type { Resultado } from "@/lib/aviso";
import { enviarPendientesEnSegundoPlano } from "@/lib/notificaciones";
import { refinarEstadia, zFecha, zFechaNacimiento } from "@/lib/fechas";
import { zDocumento, zNombrePersona, zTelefonoOpcional } from "@/lib/contacto";

const acompananteSchema = z.object({
  nombre: zNombrePersona("Ingresa el nombre"),
  documento: zDocumento,
  fecha_nacimiento: zFechaNacimiento,
  telefono: zTelefonoOpcional,
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

export async function eliminarAcompanante(id: number, reservaId: number): Promise<Resultado> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("acompanantes").delete().eq("id", id).eq("reserva_id", reservaId).select("id");
  if (error) return { error: dbError(error.message) };
  // RLS no devuelve error: simplemente no borra si la reserva ya no admite cambios
  if (!data?.length) return { error: "No se pudo quitar al acompañante: la reserva ya no admite cambios" };
  revalidatePath(`/mis-reservas/${reservaId}`);
}

export async function cancelarReserva(reservaId: number, _: FormState, formData: FormData): Promise<FormState> {
  const motivo = String(formData.get("motivo") ?? "").trim();
  if (formData.get("confirmar") !== "on") return { error: "Confirma que deseas cancelar la reserva" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancelar_reserva", { p_reserva: reservaId, p_motivo: motivo || undefined });
  if (error) return { error: dbError(error.message) };
  enviarPendientesEnSegundoPlano();
  revalidatePath(`/mis-reservas/${reservaId}`);
  revalidatePath("/mis-reservas");
  return { ok: "Reserva cancelada" };
}

const modificarSchema = z.object({
  inicio: zFecha("Ingresa una fecha de llegada válida"),
  fin: zFecha("Ingresa una fecha de salida válida"),
  huespedes: z.coerce.number().int().min(1, "Mínimo 1 huésped").max(20, "Máximo 20 huéspedes"),
}).superRefine(refinarEstadia);

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
