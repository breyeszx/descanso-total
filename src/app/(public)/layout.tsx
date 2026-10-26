import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <p className="font-heading text-lg font-semibold">Descanso Total</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Arriendo de departamentos turísticos en Chile, con traslados y tours coordinados por nuestro equipo.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm">
            <Link href="/departamentos" className="text-muted-foreground hover:text-foreground">Departamentos</Link>
            <Link href="/#zonas" className="text-muted-foreground hover:text-foreground">Zonas</Link>
            <Link href="/#como-reservar" className="text-muted-foreground hover:text-foreground">Cómo se reserva</Link>
            <Link href="/login" className="text-muted-foreground hover:text-foreground">Iniciar sesión</Link>
          </div>
        </div>
        <div className="border-t">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:justify-between">
            <span>Descanso Total S.A.</span>
            <span>Precios en pesos chilenos, por noche. Horario de Chile continental.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
