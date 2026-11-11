import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

import type { Database } from "@/lib/supabase/database.types";

export type Rol = Database["public"]["Enums"]["rol_usuario"];

export type Perfil = {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
};

/**
 * Perfil del usuario de la petición actual, o null si no hay sesión.
 * `cache` de React hace que layout, página y cabecera compartan el resultado en un mismo render
 * en vez de repetir las dos consultas cada uno.
 */
export const perfilActual = cache(async (): Promise<Perfil | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: perfil } = await supabase.from("profiles").select("id, email, nombre, rol").eq("id", user.id).maybeSingle();
  return perfil;
});

/** Devuelve el perfil del usuario autenticado o redirige a /login. Con `roles`, redirige al panel si el rol no está permitido. */
export async function requirePerfil(roles?: Rol[]): Promise<Perfil> {
  const perfil = await perfilActual();
  if (!perfil) redirect("/login");
  if (roles && !roles.includes(perfil.rol)) redirect("/dashboard");
  return perfil;
}
