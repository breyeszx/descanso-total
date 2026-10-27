"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon, LogOutIcon, UserRoundIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";

export type NavItem = { href: string; label: string };
export type NavUsuario = { nombre: string; email: string; rol: "admin" | "funcionario" | "cliente"; inicio: string };

const ROL_LABEL = { admin: "Administrador", funcionario: "Funcionario", cliente: "Cliente" } as const;

function activo(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function iniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  return ((partes[0]?.[0] ?? "") + (partes[1]?.[0] ?? "")).toUpperCase() || "DT";
}

export function Marca({ href }: { href: string }) {
  return (
    <Link href={href} className="flex shrink-0 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
      <span aria-hidden className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 17c2.5-2.5 5-2.5 7.5 0s5 2.5 7.5 0 3-1.5 3-1.5" />
          <path d="M6 12l6-7 6 7" />
        </svg>
      </span>
      <span className="font-heading text-lg font-semibold tracking-tight whitespace-nowrap">Descanso Total</span>
    </Link>
  );
}

type Props = {
  items: NavItem[];
  usuario: NavUsuario | null;
  logout?: () => Promise<void>;
  /** Enlaces de la derecha cuando no hay sesión */
  invitado?: boolean;
};

/** Barra de navegación compartida por el sitio público y el área privada. */
export function AppNav({ items, usuario, logout, invitado }: Props) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const inicio = usuario?.inicio ?? "/";

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Marca href={inicio} />
          <nav aria-label="Secciones" className="hidden min-w-0 items-center gap-0.5 overflow-x-auto py-1 [scrollbar-width:none] lg:flex [&::-webkit-scrollbar]:hidden">
            {items.map((i) => {
              const act = activo(pathname, i.href);
              return (
                <Link
                  key={i.href}
                  href={i.href}
                  aria-current={act ? "page" : undefined}
                  className={cn(
                    "shrink-0 rounded-lg px-2 py-1.5 text-sm whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    act ? "bg-secondary font-medium text-secondary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {i.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <ThemeToggle />
          {usuario ? (
            <>
              {logout && (
                <form ref={formRef} action={logout} className="hidden" aria-hidden>
                  <button type="submit" tabIndex={-1} />
                </form>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button variant="ghost" className="h-9 gap-2 rounded-full pr-3 pl-1" aria-label="Menú de usuario" />}
                >
                  <Avatar>
                    <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">{iniciales(usuario.nombre)}</AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-32 truncate text-sm sm:inline lg:hidden 2xl:inline">{usuario.nombre}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <div className="flex flex-col gap-0.5 px-2 py-1.5">
                    <span className="truncate text-sm font-medium">{usuario.nombre}</span>
                    <span className="truncate text-xs text-muted-foreground">{usuario.email}</span>
                    <span className="mt-1 w-fit rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">{ROL_LABEL[usuario.rol]}</span>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem render={<Link href={usuario.rol === "cliente" ? "/mis-reservas" : "/dashboard"} />} className="px-2 py-1.5">
                    <UserRoundIcon /> {usuario.rol === "cliente" ? "Mis reservas" : "Panel"}
                  </DropdownMenuItem>
                  {usuario.rol !== "cliente" && (
                    <DropdownMenuItem render={<Link href="/" />} className="px-2 py-1.5">
                      Ver sitio público
                    </DropdownMenuItem>
                  )}
                  {logout && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="px-2 py-1.5" onClick={() => formRef.current?.requestSubmit()}>
                        <LogOutIcon /> Cerrar sesión
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : invitado ? (
            <div className="hidden items-center gap-1.5 sm:flex">
              <Button variant="ghost" render={<Link href="/login" />}>Iniciar sesión</Button>
              <Button render={<Link href="/registro" />}>Crear cuenta</Button>
            </div>
          ) : null}

          <Sheet open={abierto} onOpenChange={setAbierto}>
            <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menú" />}>
              <MenuIcon />
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <SheetTitle className="sr-only">Menú</SheetTitle>
              <div className="border-b px-4 py-3">
                <Marca href={inicio} />
              </div>
              <nav aria-label="Secciones" className="flex flex-col gap-0.5 p-2">
                {items.map((i) => {
                  const act = activo(pathname, i.href);
                  return (
                    <Link
                      key={i.href}
                      href={i.href}
                      onClick={() => setAbierto(false)}
                      aria-current={act ? "page" : undefined}
                      className={cn(
                        "rounded-lg px-3 py-2.5 text-[15px] outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                        act ? "bg-secondary font-medium text-secondary-foreground" : "text-foreground hover:bg-muted",
                      )}
                    >
                      {i.label}
                    </Link>
                  );
                })}
              </nav>
              {!usuario && invitado && (
                <div className="mt-auto flex flex-col gap-2 border-t p-4">
                  <Button variant="outline" size="lg" render={<Link href="/login" onClick={() => setAbierto(false)} />}>Iniciar sesión</Button>
                  <Button size="lg" render={<Link href="/registro" onClick={() => setAbierto(false)} />}>Crear cuenta</Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
