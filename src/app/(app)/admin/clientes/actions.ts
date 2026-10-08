"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { dbError, errorState, formToObject, zodError, type FormState } from "@/lib/form";
import { normalizarRut, validarRut } from "@/lib/rut";

const schema = z.object({
  nombre: z.string().trim().min(2, "Ingresa el nombre"),
  apellido: z.string().trim().optional(),
  rut: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? normalizarRut(v) : null))
    .refine((v) => v === null || validarRut(v), "RUT inválido"),
  email: z.string().trim().email("Correo inválido"),
  telefono: z.string().trim().optional(),
  direccion: z.string().trim().optional(),
  pais: z.string().trim().default("Chile"),
  notas: z.string().trim().optional(),
});

export async function guardarCliente(id: number | null, _: FormState, formData: FormData): Promise<FormState> {
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
