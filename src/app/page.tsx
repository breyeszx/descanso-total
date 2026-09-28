import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Descanso Total</h1>
      <p className="max-w-md text-muted-foreground">
        Departamentos turísticos, transporte y tours en un solo lugar. El catálogo
        público estará disponible en la Fase 3.
      </p>
      <div className="flex gap-3">
        <Button render={<Link href="/login" />}>Iniciar sesión</Button>
        <Button variant="outline" render={<Link href="/registro" />}>
          Crear cuenta
        </Button>
      </div>
    </main>
  );
}
