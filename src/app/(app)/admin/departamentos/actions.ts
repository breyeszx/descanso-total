"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
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
const MAX_FOTO = 5 * 1024 * 1024;

export async function subirFoto(depId: number, _: FormState, formData: FormData): Promise<FormState> {
  const archivos = formData.getAll("fotos").filter((f): f is File => f instanceof File && f.size > 0);
  if (!archivos.length) return { error: "Selecciona al menos una imagen" };
  const supabase = await createClient();
  const { count } = await supabase.from("departamento_fotos").select("id", { count: "exact", head: true }).eq("departamento_id", depId);
  let orden = count ?? 0;
  for (const f of archivos) {
    if (!f.type.startsWith("image/")) return { error: `"${f.name}" no es una imagen` };
    if (f.size > MAX_FOTO) return { error: `"${f.name}" supera 5 MB` };
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${depId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: upErr } = await supabase.storage.from("departamentos").upload(path, f, { contentType: f.type });
    if (upErr) return { error: "No se pudo subir la imagen: " + upErr.message };
    const { error } = await supabase
      .from("departamento_fotos")
      .insert({ departamento_id: depId, storage_path: path, orden: orden++, es_portada: orden === 1 });
    if (error) return errorState(dbError(error.message), formData);
  }
  revalidarDep(depId);
  return { ok: `${archivos.length} foto(s) subida(s)` };
}

export async function eliminarFoto(fotoId: number, depId: number) {
  const supabase = await createClient();
  const { data: foto } = await supabase.from("departamento_fotos").select("storage_path").eq("id", fotoId).single();
  if (!foto) return;
  await supabase.storage.from("departamentos").remove([foto.storage_path]);
  await supabase.from("departamento_fotos").delete().eq("id", fotoId);
  revalidarDep(depId);
}

export async function marcarPortada(fotoId: number, depId: number) {
  const supabase = await createClient();
  await supabase.from("departamento_fotos").update({ es_portada: false }).eq("departamento_id", depId);
  await supabase.from("departamento_fotos").update({ es_portada: true }).eq("id", fotoId);
  revalidarDep(depId);
}

// ---------------- Inventario ----------------
const itemSchema = z.object({
  nombre: z.string().trim().min(2, "Ingresa el nombre del ítem"),
  categoria: z.string().trim().optional(),
  descripcion: z.string().trim().optional(),
  cantidad: z.coerce.number().int().min(0),
  valor_unitario: z.coerce.number().int().min(0, "Valor inválido"),
  fecha_adquisicion: z.string().optional(),
});

export async function guardarItem(depId: number, itemId: number | null, _: FormState, formData: FormData): Promise<FormState> {
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
  const parsed = movSchema.safeParse(formToObject(formData));
  if (!parsed.success) return zodError(parsed.error, formData);
  const { tipo, cantidad, costo, descripcion } = parsed.data;
  const supabase = await createClient();
  const { data: item } = await supabase.from("inventario_items").select("id, departamento_id, cantidad, nombre").eq("id", itemId).single();
  if (!item) return { error: "Ítem no encontrado" };

  const { error: movErr } = await supabase
    .from("inventario_movimientos")
    .insert({ item_id: itemId, tipo, cantidad, costo, descripcion: descripcion ?? null });
  if (movErr) return errorState(dbError(movErr.message), formData);

  const nuevaCantidad = tipo === "alta" ? item.cantidad + cantidad : tipo === "baja" ? Math.max(0, item.cantidad - cantidad) : item.cantidad;
  const estado = tipo === "deterioro" ? "deteriorado" : tipo === "reparacion" ? "bueno" : nuevaCantidad === 0 ? "baja" : "bueno";
  const { error } = await supabase.from("inventario_items").update({ cantidad: nuevaCantidad, estado }).eq("id", itemId);
  if (error) return errorState(dbError(error.message), formData);

  if (tipo === "reparacion" && costo > 0) {
    await supabase.from("movimientos_financieros").insert({
      tipo: "egreso",
      categoria: "reparacion",
      monto: costo,
      descripcion: `Reparación: ${item.nombre}${descripcion ? " – " + descripcion : ""}`,
      departamento_id: item.departamento_id,
    });
  }
  revalidarDep(item.departamento_id);
  revalidatePath(`/admin/inventario/${itemId}`);
  return { ok: "Movimiento registrado" };
}
