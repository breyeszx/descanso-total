/** Datos geográficos de las zonas de operación. La latitud ordena las zonas de norte a sur en la portada. */
export const ZONAS_INFO: Record<string, { latitud: number; destacado: string }> = {
  "San Pedro de Atacama": { latitud: 22.9, destacado: "Tour Valle de la Luna al atardecer" },
  "La Serena": { latitud: 29.9, destacado: "Tour Valle del Elqui y observatorio" },
  "Viña del Mar": { latitud: 33.0, destacado: "Playa y casino a pasos" },
  "Pucón": { latitud: 39.3, destacado: "Tour Termas Geométricas" },
  "Puerto Varas": { latitud: 41.3, destacado: "Tour Saltos del Petrohué" },
};

export function infoZona(nombre: string) {
  return ZONAS_INFO[nombre] ?? { latitud: Number.NaN, destacado: "" };
}

/** Latitud en formato chileno: 22,9° S */
export function formatLatitud(lat: number) {
  return `${lat.toFixed(1).replace(".", ",")}° S`;
}
