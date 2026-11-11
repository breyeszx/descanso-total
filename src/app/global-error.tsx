"use client";

import { useEffect } from "react";
import { MARCA } from "@/lib/marca";

/**
 * Último recurso: falló el layout raíz. Este archivo reemplaza el documento completo y no recibe
 * los estilos globales ni el tema, por eso lleva su propio html/body y estilos en línea.
 */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="es">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: MARCA.fondo, color: MARCA.texto, fontFamily: "system-ui, sans-serif" }}>
        <main role="alert" style={{ maxWidth: 420, padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>Descanso Total no está disponible</h1>
          <p style={{ fontSize: 14, color: MARCA.tenue, margin: "0 0 20px" }}>Ocurrió un error inesperado. Vuelve a intentarlo en unos segundos.</p>
          <button
            onClick={() => retry()}
            style={{ background: MARCA.primario, color: "#fff", border: 0, borderRadius: 8, padding: "10px 18px", fontSize: 14, cursor: "pointer" }}
          >
            Reintentar
          </button>
        </main>
      </body>
    </html>
  );
}
