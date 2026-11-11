"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requirePerfil } from "@/lib/auth";
import { dbError, errorState, formToObject, zodError, type FormState } from "@/lib/form";
import { zEmail, zNombrePersona, zRutOpcional, zTelefonoOpcional } from "@/lib/contacto";

const schema = z.object({
  nombre: zNombrePersona("Ingresa el nombre"),
  apellido: zNombrePersona("Ingresa el apellido").optional(),
  rut: zRutOpcional,
  email: zEmail(),
  telefono: zTelefonoOpcional,
  direccion: z.string().trim().optional(),
  pais: z.string().trim().default("Chile"),
  notas: z.string().trim().optional(),
});

export async function guardarCliente(id: number | null, _: FormState, formData: FormData): Promise<FormState> {
  await requirePerfil(["admin"]);
  const parsed = schema.safeParse(formToObject(formData));
  if (!parsed.success) return zodError(parsed.error, formData);

  const supabase = await createClient();
  const datos = {
    ...parsed.data,
    apellido: parsed.data.apellido ?? null,
    telefono: parsed.data.telefono ?? null,
    direccion: parsed.data.direccion ?? null,
    notas: parsed.data.notas ?? null,
  };

  if (id === null) {
    const { data, error } = await supabase.from("clientes").insert(datos).select("id").single();
    if (error) return errorState(dbError(error.message), formData);
    revalidatePath("/admin/clientes");
    redirect(`/admin/clientes/${data.id}`);
  }

  const { error } = await supabase.from("clientes").update(datos).eq("id", id);
  if (error) return errorState(dbError(error.message), formData);
  revalidatePath("/admin/clientes");
  revalidatePath(`/admin/clientes/${id}`);
  return { ok: "Cliente actualizado" };
}
