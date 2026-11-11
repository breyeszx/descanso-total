"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { zEmail, zNombrePersona } from "@/lib/contacto";

const loginSchema = z.object({
  email: zEmail(),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").max(72, "La contraseña es demasiado larga"),
});

const registroSchema = loginSchema.extend({
  nombre: zNombrePersona("Ingresa tu nombre completo"),
});

export type AuthState = { error?: string; ok?: string } | undefined;

export async function login(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Correo o contraseña incorrectos" };

  const next = (formData.get("next") as string) || "/dashboard";
  // Solo rutas internas: "//sitio.com" o "/\\sitio.com" llevarían a otro dominio
  redirect(/^\/(?![\/\\])/.test(next) ? next : "/dashboard");
}

export async function registro(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registroSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { nombre: parsed.data.nombre } },
  });
  if (error) return { error: "No se pudo crear la cuenta. Intenta con otro correo." };
  return { ok: "Cuenta creada. Revisa tu correo para confirmarla." };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
