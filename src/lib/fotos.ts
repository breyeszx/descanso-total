/** Reglas de las fotos de departamentos. El bucket aplica los mismos límites en Storage (migración 0008). */
export const MAX_FOTO_BYTES = 5 * 1024 * 1024;
export const MAX_FOTOS_POR_SUBIDA = 12;
export const TIPOS_FOTO: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
/** Ruta dentro del bucket: <departamento>/<nombre>.<ext> */
export const RUTA_FOTO = /^(\d+)\/[a-z0-9-]+\.(jpg|png|webp)$/;

/** Devuelve el problema de un archivo o null si se puede subir. */
export function problemaFoto(f: { name: string; type: string; size: number }): string | null {
  if (!TIPOS_FOTO[f.type]) return `"${f.name}" no es una imagen JPG, PNG o WebP`;
  if (f.size > MAX_FOTO_BYTES) return `"${f.name}" supera 5 MB`;
  if (f.size === 0) return `"${f.name}" está vacío`;
  return null;
}
