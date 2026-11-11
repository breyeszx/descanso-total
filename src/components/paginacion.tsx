import Link from "next/link";
import { Button } from "@/components/ui/button";
import { POR_PAGINA, totalPaginas, urlPagina } from "@/lib/paginacion";

type Props = {
  /** Ruta del listado, sin parámetros */
  ruta: string;
  /** Filtros vigentes, para conservarlos al cambiar de página */
  params?: Record<string, string | undefined>;
  pagina: number;
  total: number;
  porPagina?: number;
};

/** Pie de un listado paginado: cuántos registros se ven y enlaces a la página anterior y siguiente. */
export function Paginacion({ ruta, params = {}, pagina, total, porPagina = POR_PAGINA }: Props) {
  if (total === 0) return null;
  const paginas = totalPaginas(total, porPagina);
  const href = (p: number) => urlPagina(ruta, params, p);
  const primero = (pagina - 1) * porPagina + 1;
  const ultimo = Math.min(pagina * porPagina, total);

  return (
    <nav aria-label="Paginación" className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
      <p>
        {primero}–{ultimo} de {total.toLocaleString("es-CL")}
      </p>
      {paginas > 1 && (
        <div className="flex items-center gap-2">
          {pagina > 1 ? (
            <Button size="sm" variant="outline" render={<Link href={href(pagina - 1)} />}>Anterior</Button>
          ) : (
            <Button size="sm" variant="outline" disabled>Anterior</Button>
          )}
          <span>
            Página {pagina} de {paginas}
          </span>
          {pagina < paginas ? (
            <Button size="sm" variant="outline" render={<Link href={href(pagina + 1)} />}>Siguiente</Button>
          ) : (
            <Button size="sm" variant="outline" disabled>Siguiente</Button>
          )}
        </div>
      )}
    </nav>
  );
}
