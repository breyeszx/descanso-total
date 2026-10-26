import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/actions";
import { AppNav, type NavItem, type NavUsuario } from "@/components/app-nav";

const PUBLICO: NavItem[] = [
  { href: "/", label: "Inicio" },
  { href: "/departamentos", label: "Departamentos" },
  { href: "/#zonas", label: "Zonas" },
];

/** Barra del sitio público. Si hay sesión muestra el menú de usuario con acceso a su área. */
export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let usuario: NavUsuario | null = null;
  if (user) {
    const { data: perfil } = await supabase.from("profiles").select("nombre, email, rol").eq("id", user.id).maybeSingle();
    if (perfil) {
      usuario = { nombre: perfil.nombre, email: perfil.email, rol: perfil.rol, inicio: "/" };
    }
  }

  const items = usuario?.rol === "cliente" ? [...PUBLICO, { href: "/mis-reservas", label: "Mis reservas" }] : PUBLICO;
  return <AppNav items={items} usuario={usuario} logout={logout} invitado />;
}
