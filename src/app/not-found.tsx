import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Marca } from "@/components/app-nav";

export const metadata = { title: "Página no encontrada" };

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-16">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <Marca href="/" />
        <p className="mt-4 font-heading text-6xl font-semibold text-primary">404</p>
        <h1 className="text-2xl font-semibold">No encontramos esta página</h1>
        <p className="text-sm text-muted-foreground">
          El enlace puede estar mal escrito, o la reserva o el departamento que buscas ya no existe.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button render={<Link href="/" />}>Ir al inicio</Button>
          <Button variant="outline" render={<Link href="/departamentos" />}>Ver departamentos</Button>
        </div>
      </div>
    </main>
  );
}
