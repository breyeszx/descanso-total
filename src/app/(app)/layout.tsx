import Link from "next/link";
import { requirePerfil } from "@/lib/auth";
import { logout } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const NAV: Record<string, { href: string; label: string }[]> = {
  admin: [
    { href: "/dashboard", label: "Panel" },
    { href: "/admin/clientes", label: "Clientes" },
    { href: "/admin/departamentos", label: "Departamentos" },
  ],
  funcionario: [
    { href: "/dashboard", label: "Panel" },
    { href: "/terreno", label: "Check-in / Check-out" },
  ],
  cliente: [
    { href: "/mis-reservas", label: "Mis reservas" },
    { href: "/departamentos", label: "Buscar departamentos" },
  ],
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const perfil = await requirePerfil();
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href={perfil.rol === "cliente" ? "/" : "/dashboard"} className="font-semibold">
              Descanso Total
            </Link>
            <nav className="flex gap-4 text-sm">
              {NAV[perfil.rol].map((i) => (
                <Link
                  key={i.href}
                  href={i.href}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {i.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm sm:inline">{perfil.nombre}</span>
            <Badge variant="secondary">{perfil.rol}</Badge>
            <form action={logout}>
              <Button variant="outline" size="sm">
                Salir
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4">{children}</main>
    </div>
  );
}
