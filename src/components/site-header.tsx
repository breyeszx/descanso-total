import { perfilActual } from "@/lib/auth";
import { logout } from "@/app/(auth)/actions";
import { AppNav, type NavItem, type NavUsuario } from "@/components/app-nav";

const PUBLICO: NavItem[] = [
  { href: "/", label: "Inicio" },
  { href: "/departamentos", label: "Departamentos" },
  { href: "/#zonas", label: "Zonas" },
];

/** Barra del sitio público. Si hay sesión muestra el menú de usuario con acceso a su área. */
export async function SiteHeader() {
  const perfil = await perfilActual();
  const usuario: NavUsuario | null = perfil ? { nombre: perfil.nombre, email: perfil.email, rol: perfil.rol, inicio: "/" } : null;

  const items = usuario?.rol === "cliente" ? [...PUBLICO, { href: "/mis-reservas", label: "Mis reservas" }] : PUBLICO;
  return <AppNav items={items} usuario={usuario} logout={logout} invitado />;
}
