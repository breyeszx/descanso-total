import { cn } from "@/lib/utils";

/** Esqueleto genérico mientras el servidor arma la página: un título y bloques de contenido. */
export function Cargando({ className }: { className?: string }) {
  return (
    <div role="status" aria-live="polite" className={cn("flex animate-pulse flex-col gap-6", className)}>
      <span className="sr-only">Cargando…</span>
      <div className="flex flex-col gap-2">
        <div className="h-7 w-56 max-w-full rounded-lg bg-muted" />
        <div className="h-4 w-80 max-w-full rounded-lg bg-muted" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-muted" />
    </div>
  );
}
