/**
 * Colores de marca en hexadecimal para los medios que no leen las variables CSS (correos y PDF).
 * Son los tokens del tema claro de `src/app/globals.css` convertidos desde oklch; si cambia la paleta, cambiar ambos.
 */
export const MARCA = {
  /** --primary: Pacífico profundo */
  primario: "#004f6d",
  /** --foreground: pizarra volcánica */
  texto: "#192834",
  /** --muted-foreground */
  tenue: "#566670",
  /** --border */
  borde: "#d4dce0",
  /** --muted: espuma */
  superficie: "#e7eef0",
  /** --background: sal de mar */
  fondo: "#f8f7f4",
} as const;
