"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requirePerfil } from "@/lib/auth";
import { dbError, errorState, formToObject, zodError, type FormState } from "@/lib/form";

const vehiculoSchema = z.object({
  patente: z.string().trim().min(4, "Patente inválida").toUpperCase(),
  marca: z.string().trim().optional(),
  modelo: z.string().trim().optional(),
  capacidad: z.coerce.number().int().min(1),
});

export async function guardarVehiculo(_: FormState, formData: FormData): Promise<FormState> {
  await requirePerfil(["admin"]);
  const parsed = vehiculoSchema.safeParse(formToObject(formData));
  if (!parsed.success) return zodError(parsed.error, formData);
  const supabase = await createClient();
  const { error } = await supabase.from("vehiculos").insert({ ...parsed.data, marca: parsed.data.marca ?? null, modelo: parsed.data.modelo ?? null });
  if (error) return errorState(dbError(error.message), formData);
  revalidatePath("/admin/flota");
  return { ok: "Vehículo agregado" };
}

const conductorSchema = z.object({
  nombre: z.string().trim().min(2, "Ingresa el nombre"),
  telefono: z.string().trim().optional(),
  licencia: z.string().trim().optional(),
});

export async function guardarConductor(_: FormState, formData: FormData): Promise<FormState> {
  await requirePerfil(["admin"]);
  const parsed = conductorSchema.safeParse(formToObject(formData));
  if (!parsed.success) return zodError(parsed.error, formData);
  const supabase = await createClient();
  const { error } = await supabase.from("conductores").insert({ ...parsed.data, telefono: parsed.data.telefono ?? null, licencia: parsed.data.licencia ?? null });
  if (error) return errorState(dbError(error.message), formData);
  revalidatePath("/admin/flota");
  return { ok: "Conductor agregado" };
}

export async function alternarActivo(tabla: "vehiculos" | "conductores" | "servicios", id: number, activo: boolean) {
  await requirePerfil(["admin"]);
  const supabase = await createClient();
  await supabase.from(tabla).update({ activo }).eq("id", id);
  revalidatePath(tabla === "servicios" ? "/admin/servicios" : "/admin/flota");
}

const servicioSchema = z.object({
  id: z.coerce.number().int().optional(),
  nombre: z.string().trim().min(2, "Ingresa el nombre"),
  tipo: z.enum(["tour", "equipamiento", "transporte", "otro"]),
  descripcion: z.string().trim().optional(),
  precio: z.coerce.number().int().min(0),
  duracion_horas: z.coerce.number().min(0).optional(),
  cupo_max: z.coerce.number().int().min(1).optional(),
  requiere_transporte: z.preprocess((v) => v === "on", z.boolean()),
});

export async function guardarServicio(_: FormState, formData: FormData): Promise<FormState> {
  await requirePerfil(["admin"]);
  const parsed = servicioSchema.safeParse(formToObject(formData));
  if (!parsed.success) return zodError(parsed.error, formData);
  const { id, ...rest } = parsed.data;
  const datos = { ...rest, descripcion: rest.descripcion ?? null, duracion_horas: rest.duracion_horas ?? null, cupo_max: rest.cupo_max ?? null };
  const supabase = await createClient();
  const { error } = id ? await supabase.from("servicios").update(datos).eq("id", id) : await supabase.from("servicios").insert(datos);
  if (error) return errorState(dbError(error.message), formData);
  revalidatePath("/admin/servicios");
  return { ok: id ? "Servicio actualizado" : "Servicio creado" };
}

const mantencionSchema = z.object({
  departamento_id: z.coerce.number().int().positive("Selecciona un departamento"),
  titulo: z.string().trim().min(3, "Ingresa el título"),
  descripcion: z.string().trim().optional(),
  fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  fecha_fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  costo: z.coerce.number().int().min(0).default(0),
  responsable: z.string().trim().optional(),
});

export async function crearMantencion(_: FormState, formData: FormData): Promise<FormState> {
  await requirePerfil(["admin"]);
  const parsed = mantencionSchema.safeParse(formToObject(formData));
  if (!parsed.success) return zodError(parsed.error, formData);
  if (parsed.data.fecha_fin < parsed.data.fecha_inicio) return errorState("La fecha de término debe ser igual o posterior al inicio", formData);
  const supabase = await createClient();
  const { error } = await supabase.from("mantenciones").insert({ ...parsed.data, descripcion: parsed.data.descripcion ?? null, responsable: parsed.data.responsable ?? null });
  if (error) return errorState(dbError(error.message), formData);
  revalidatePath("/admin/mantenciones");
  revalidatePath("/dashboard");
  return { ok: "Mantención programada. Las fechas quedan bloqueadas para reservas." };
}

export async function cambiarEstadoMantencion(id: number, estado: "programada" | "en_curso" | "completada" | "cancelada", costo?: number) {
  await requirePerfil(["admin"]);
  const supabase = await createClient();
  await supabase.from("mantenciones").update(costo === undefined ? { estado } : { estado, costo }).eq("id", id);
  revalidatePath("/admin/mantenciones");
  revalidatePath("/dashboard");
}

const movimientoSchema = z.object({
  tipo: z.enum(["ingreso", "egreso"]),
  categoria: z.enum(["arriendo", "servicio_extra", "cargo", "reembolso", "reparacion", "mantencion", "dividendo", "contribucion", "transporte", "otro"]),
  monto: z.coerce.number().int().positive("Monto mayor a 0"),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  departamento_id: z.coerce.number().int().optional(),
  descripcion: z.string().trim().optional(),
});

export async function registrarMovimiento(_: FormState, formData: FormData): Promise<FormState> {
  const perfil = await requirePerfil(["admin"]);
  const parsed = movimientoSchema.safeParse(formToObject(formData));
  if (!parsed.success) return zodError(parsed.error, formData);
  const supabase = await createClient();
  const { error } = await supabase.from("movimientos_financieros").insert({ ...parsed.data, departamento_id: parsed.data.departamento_id ?? null, descripcion: parsed.data.descripcion ?? null, registrado_por: perfil.id });
  if (error) return errorState(dbError(error.message), formData);
  revalidatePath("/admin/finanzas");
  revalidatePath("/dashboard");
  return { ok: "Movimiento registrado" };
}
