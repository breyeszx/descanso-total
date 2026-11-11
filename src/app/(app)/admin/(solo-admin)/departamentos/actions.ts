"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { zFechaNoFutura } from "@/lib/fechas";
import { createClient } from "@/lib/supabase/server";
import { requirePerfil } from "@/lib/auth";
import { MAX_FOTOS_POR_SUBIDA, RUTA_FOTO } from "@/lib/fotos";
import type { Resultado } from "@/lib/aviso";
import { dbError, errorState, formToObject, zodError, type FormState } from "@/lib/form";

const depSchema = z.object({
  codigo: z.string().trim().min(2, "Ingresa el código").toUpperCase(),
  nombre: z.string().trim().min(2, "Ingresa el nombre"),
  zona_id: z.coerce.number().int().positive("Selecciona una zona"),
  direccion: z.string().trim().min(3, "Ingresa la dirección"),
  descripcion: z.string().trim().optional(),
  capacidad_max: z.coerce.number().int().min(1, "Mínimo 1 huésped"),
  dormitorios: z.coerce.number().int().min(0),
  banos: z.coerce.number().int().min(0),
  tarifa_base: z.coerce.number().int().min(0, "Tarifa inválida"),
  amenidades: z.string().trim().optional(),
  activo: z.preprocess((v) => v === "on" || v === "true", z.boolean()),
});

function revalidarDep(id?: number) {
  revalidatePath("/admin/departamentos");
  revalidatePath("/dashboard");
  if (id) revalidatePath(`/admin/departamentos/${id}`);
}

export async function guardarDepartamento(id: number | null, _: FormState, formData: FormData): Promise<FormState> {
  await requirePerfil(["admin"]);
  const parsed = depSchema.safeParse(formToObject(formData));
  if (!parsed.success) return zodError(parsed.error, formData);
  const { amenidades, ...rest } = parsed.data;
  const datos = {
    ...rest,
    descripcion: rest.descripcion ?? null,
    amenidades: amenidades ? amenidades.split(",").map((a) => a.trim()).filter(Boolean) : [],
  };
  const supabase = await createClient();
  if (id === null) {
    const { data, error } = await supabase.from("departamentos").insert(datos).select("id").single();
    if (error) return errorState(dbError(error.message), formData);
    revalidarDep();
    redirect(`/admin/departamentos/${data.id}`);
  }
  const { error } = await supabase.from("departamentos").update(datos).eq("id", id);
  if (error) return errorState(dbError(error.message), formData);
  revalidarDep(id);
  return { ok: "Departamento actualizado" };
}

// ---------------- Fotos ----------------
/**
 * Registra fotos que el navegador ya subió directo al bucket "departamentos".
 * Los archivos no pasan por esta acción: las Server Actions aceptan 1 MB por defecto y Vercel corta en 4,5 MB.
 */
export async function registrarFotos(depId: number, paths: string[]): Promise<FormState> {
  await requirePerfil(["admin"]);
  if (!Array.isArray(paths) || paths.length === 0) return { error: "Selecciona al menos una imagen" };
  if (paths.length > MAX_FOTOS_POR_SUBIDA) return { error: `Máximo ${MAX_FOTOS_POR_SUBIDA} fotos por subida` };
  if (paths.some((p) => typeof p !== "string" || RUTA_FOTO.exec(p)?.[1] !== String(depId))) return { error: "Ruta de foto inválida" };

  const supabase = await createClient();
  const { count } = await supabase.from("departamento_fotos").select("id", { count: "exact", head: true }).eq("departamento_id", depId);
  const base = count ?? 0;
  const { error } = await supabase
    .from("departamento_fotos")
    .insert(paths.map((storage_path, i) => ({ departamento_id: depId, storage_path, orden: base + i, es_portada: base + i === 0 })));
  if (error) {
    await supabase.storage.from("departamentos").remove(paths); // no dejar archivos huérfanos
    return { error: dbError(error.message) };
  }
  revalidarDep(depId);
  return { ok: paths.length === 1 ? "Foto subida" : `${paths.length} fotos subidas` };
}

export async function eliminarFoto(fotoId: number, depId: number): Promise<Resultado> {
  await requirePerfil(["admin"]);
  const supabase = await createClient();
  const { data: foto, error } = await supabase.from("departamento_fotos").delete().eq("id", fotoId).eq("departamento_id", depId).select("storage_path, es_portada").maybeSingle();
  if (error) return { error: dbError(error.message) };
  if (!foto) return { error: "La foto ya no existe" };
  // Primero la fila, después el archivo: si falla el borrado en Storage solo queda un archivo sin uso
  await supabase.storage.from("departamentos").remove([foto.storage_path]);
  if (foto.es_portada) {
    const { data: sig } = await supabase.from("departamento_fotos").select("id").eq("departamento_id", depId).order("orden").limit(1).maybeSingle();
    if (sig) await supabase.from("departamento_fotos").update({ es_portada: true }).eq("id", sig.id);
  }
  revalidarDep(depId);
}

export async function marcarPortada(fotoId: number, depId: number): Promise<Resultado> {
  await requirePerfil(["admin"]);
  const supabase = await createClient();
  const { data: foto } = await supabase.from("departamento_fotos").select("id").eq("id", fotoId).eq("departamento_id", depId).maybeSingle();
  if (!foto) return { error: "La foto ya no existe" };
  // Se marca la nueva antes de desmarcar el resto: nunca queda el departamento sin portada
  const { error } = await supabase.from("departamento_fotos").update({ es_portada: true }).eq("id", fotoId);
  if (error) return { error: dbError(error.message) };
  await supabase.from("departamento_fotos").update({ es_portada: false }).eq("departamento_id", depId).neq("id", fotoId);
  revalidarDep(depId);
}

// ---------------- Inventario ----------------
const itemSchema = z.object({
  nombre: z.string().trim().min(2, "Ingresa el nombre del ítem"),
  categoria: z.string().trim().optional(),
  descripcion: z.string().trim().optional(),
  cantidad: z.coerce.number().int().min(0),
  valor_unitario: z.coerce.number().int().min(0, "Valor inválido"),
  fecha_adquisicion: zFechaNoFutura("La fecha de adquisición"),
});

export async function guardarItem(depId: number, itemId: number | null, _: FormState, formData: FormData): Promise<FormState> {
  await requirePerfil(["admin"]);
  const parsed = itemSchema.safeParse(formToObject(formData));
  if (!parsed.success) return zodError(parsed.error, formData);
  const datos = {
    ...parsed.data,
    categoria: parsed.data.categoria ?? null,
    descripcion: parsed.data.descripcion ?? null,
    fecha_adquisicion: parsed.data.fecha_adquisicion || null,
  };
  const supabase = await createClient();
  const q = itemId === null
    ? supabase.from("inventario_items").insert({ ...datos, departamento_id: depId })
    : supabase.from("inventario_items").update(datos).eq("id", itemId);
  const { error } = await q;
  if (error) return errorState(dbError(error.message), formData);
  revalidarDep(depId);
  if (itemId) revalidatePath(`/admin/inventario/${itemId}`);
  return { ok: itemId ? "Ítem actualizado" : "Ítem agregado" };
}

const movSchema = z.object({
  tipo: z.enum(["alta", "baja", "deterioro", "reparacion"]),
  cantidad: z.coerce.number().int().min(1, "Cantidad mínima 1"),
  costo: z.coerce.number().int().min(0).default(0),
  descripcion: z.string().trim().optional(),
});

export async function registrarMovimiento(itemId: number, _: FormState, formData: FormData): Promise<FormState> {
  await requirePerfil(["admin"]);
  const parsed = movSchema.safeParse(formToObject(formData));
  if (!parsed.success) return zodError(parsed.error, formData);
  const { tipo, cantidad, costo, descripcion } = parsed.data;
  // Movimiento, stock, estado y egreso por reparación se guardan en una sola transacción
  const supabase = await createClient();
  const { data: depId, error } = await supabase.rpc("registrar_movimiento_inventario", { p_item: itemId, p_tipo: tipo, p_cantidad: cantidad, p_costo: costo, p_descripcion: descripcion });
  if (error) return errorState(dbError(error.message), formData);
  revalidarDep(depId);
  revalidatePath(`/admin/inventario/${itemId}`);
  revalidatePath("/admin/finanzas");
  return { ok: "Movimiento registrado" };
}
