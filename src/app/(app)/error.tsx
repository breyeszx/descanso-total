"use client";

import { PantallaError } from "@/components/pantalla-error";

/** Errores dentro del área privada: la barra de navegación sigue visible. */
export default function AppError({ error, retry }: { error: unknown; retry: () => void }) {
  return <PantallaError error={error} retry={retry} inicio={{ href: "/dashboard", label: "Ir al panel" }} />;
}
