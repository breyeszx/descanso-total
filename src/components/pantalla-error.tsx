"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Props = {
  error: unknown;
  retry: () => void;
  /** Adónde volver si reintentar no sirve */
  inicio?: { href: string; label: string };
};

/** Contenido común de los archivos `error.tsx`: mensaje, reintento y salida. */
export function PantallaError({ error, retry, inicio = { href: "/", label: "Ir al inicio" } }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  const digest = error && typeof error === "object" && "digest" in error ? String(error.digest) : null;

  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
      <p className="text-sm font-medium text-peligro">Algo salió mal</p>
      <h1 className="text-2xl font-semibold">No pudimos cargar esta página</h1>
      <p className="text-sm text-muted-foreground">
        Puede ser un problema momentáneo de conexión. Vuelve a intentarlo; si sigue fallando, avísanos.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={() => retry()}>Reintentar</Button>
        <Button variant="outline" render={<Link href={inicio.href} />}>{inicio.label}</Button>
      </div>
      {digest && <p className="font-mono text-xs text-muted-foreground">Código del error: {digest}</p>}
    </div>
  );
}
