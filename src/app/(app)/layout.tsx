import { requirePerfil } from "@/lib/auth";
import { logout } from "@/app/(auth)/actions";
import { AppNav, type NavItem } from "@/components/app-nav";

const NAV: Record<string, NavItem[]> = {
  admin: [
    { href: "/dashboard", label: "Panel" },
    { href: "/admin/reservas", label: "Reservas" },
    { href: "/admin/clientes", label: "Clientes" },
    { href: "/admin/departamentos", label: "Departamentos" },
    { href: "/admin/mantenciones", label: "Mantenciones" },
    { href: "/admin/servicios", label: "Servicios" },
    { href: "/admin/flota", label: "Flota" },
    { href: "/admin/finanzas", label: "Finanzas" },
    { href: "/admin/reportes", label: "Reportes" },
    { href: "/terreno", label: "Terreno" },
  ],
  funcionario: [
    { href: "/terreno", label: "Terreno" },
    { href: "/admin/reservas", label: "Reservas" },
  ],
  cliente: [
    { href: "/mis-reservas", label: "Mis reservas" },
    { href: "/departamentos", label: "Buscar departamentos" },
  ],
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const perfil = await requirePerfil();
  const usuario = { nombre: perfil.nombre, email: perfil.email, rol: perfil.rol, inicio: perfil.rol === "cliente" ? "/" : "/dashboard" };
  return (
    <div className="flex min-h-screen flex-col">
      <AppNav items={NAV[perfil.rol]} usuario={usuario} logout={logout} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
