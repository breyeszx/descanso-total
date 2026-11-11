/**
 * Limpia el texto de un buscador para usarlo en un filtro `or` de PostgREST.
 * Coma, paréntesis, comillas y barra invertida son sintaxis del filtro; `*` y `%` son comodines de LIKE.
 * Se cambian por espacios para que una búsqueda como "Pérez, Ana" no rompa la consulta.
 */
export function terminoBusqueda(q: string | null | undefined) {
  return (q ?? "").replace(/[,()"\\*%]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
}

/**
 * Filtro para `.or()`: el término contenido en cualquiera de las columnas, sin distinguir mayúsculas.
 * Devuelve null si no queda nada que buscar. El valor va entre comillas para admitir puntos y espacios.
 */
export function filtroBusqueda(q: string | null | undefined, columnas: string[]) {
  const termino = terminoBusqueda(q);
  if (!termino) return null;
  return columnas.map((c) => `${c}.ilike."%${termino}%"`).join(",");
}
