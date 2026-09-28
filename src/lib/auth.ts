import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Rol = "admin" | "funcionario" | "cliente";

export type Perfil = {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
};

/** Devuelve el perfil del usuario autenticado o redirige a /login. */
export async function requirePerfil(roles?: Rol[]): Promise<Perfil> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("profiles")
    .select("id, email, nombre, rol")
    .eq("id", user.id)
    .single();
  if (!perfil) redirect("/login");
  if (roles && !roles.includes(perfil.rol)) redirect("/dashboard");
  return perfil as Perfil;
}
