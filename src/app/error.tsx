"use client";

import { PantallaError } from "@/components/pantalla-error";

/** Errores del sitio público y de las pantallas de acceso. */
export default function RootError({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center">
      <PantallaError error={error} retry={retry} />
    </main>
  );
}
