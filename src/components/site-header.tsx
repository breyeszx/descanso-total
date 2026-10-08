import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-semibold tracking-tight">Descanso Total</Link>
        <nav className="flex items-center gap-2 text-sm">
          <ThemeToggle />
          <Link href="/departamentos" className="px-2 text-muted-foreground hover:text-foreground">Departamentos</Link>
          {user ? (
            <Button size="sm" variant="outline" render={<Link href="/dashboard" />}>Mi cuenta</Button>
          ) : (
            <>
              <Button size="sm" variant="ghost" render={<Link href="/login" />}>Iniciar sesión</Button>
              <Button size="sm" render={<Link href="/registro" />}>Crear cuenta</Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
