export const POR_PAGINA = 50;

/** Número de página desde el parámetro de la URL; cualquier valor inválido es la página 1. */
export function paginaActual(valor: string | null | undefined) {
  const n = Number(valor);
  return Number.isInteger(n) && n >= 1 ? Math.min(n, 100_000) : 1;
}

/** Índices inclusivos de la primera y última fila de la página, para `.range()`. */
export function rangoPagina(pagina: number, porPagina = POR_PAGINA): [number, number] {
  const desde = (pagina - 1) * porPagina;
  return [desde, desde + porPagina - 1];
}

export function totalPaginas(total: number, porPagina = POR_PAGINA) {
  return Math.max(1, Math.ceil(total / porPagina));
}

/** URL de una página del listado conservando los filtros vigentes. La página 1 no lleva parámetro. */
export function urlPagina(ruta: string, params: Record<string, string | undefined> = {}, pagina = 1) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
  if (pagina > 1) sp.set("pagina", String(pagina));
  const s = sp.toString();
  return s ? `${ruta}?${s}` : ruta;
}

/**
 * Junta todas las filas de una consulta pidiéndola por tramos. Sirve para sumar sobre el conjunto completo
 * y no solo sobre la página visible. Avanza según lo que devuelve el servidor y corta en el primer tramo vacío,
 * así no depende de cuál sea su tope de filas por respuesta.
 */
export async function todasLasFilas<T>(traer: (desde: number, hasta: number) => Promise<T[] | null | undefined>, porTramo = 1000, maximo = 200_000): Promise<T[]> {
  const filas: T[] = [];
  while (filas.length < maximo) {
    const tramo = await traer(filas.length, filas.length + porTramo - 1);
    if (!tramo?.length) break;
    filas.push(...tramo);
  }
  return filas;
}
