import { z } from "zod";
import { hoyISO } from "./format.ts";

/** Reglas de fechas compartidas por formularios y Server Actions. Todas las fechas van en ISO (YYYY-MM-DD) y en hora de Chile. */

export const ISO_FECHA = /^\d{4}-\d{2}-\d{2}$/;
export const ISO_FECHA_HORA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;

/** Límites de negocio para estadías. */
export const MAX_NOCHES = 30;
export const MAX_ANTICIPACION_DIAS = 365;
/** Nadie registrado puede tener más de esta edad. */
export const EDAD_MAXIMA = 120;

/** Fecha ISO con formato correcto y que exista en el calendario (rechaza 2026-02-30). */
export function fechaValida(valor: unknown): valor is string {
  if (typeof valor !== "string" || !ISO_FECHA.test(valor)) return false;
  const [y, m, d] = valor.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const fecha = new Date(Date.UTC(y, m - 1, d));
  return fecha.getUTCFullYear() === y && fecha.getUTCMonth() === m - 1 && fecha.getUTCDate() === d;
}

/** Fecha y hora como la entrega un input datetime-local (YYYY-MM-DDTHH:MM). */
export function fechaHoraValida(valor: unknown): valor is string {
  if (typeof valor !== "string" || !ISO_FECHA_HORA.test(valor)) return false;
  if (!fechaValida(valor.slice(0, 10))) return false;
  const [h, min] = valor.slice(11).split(":").map(Number);
  return h >= 0 && h <= 23 && min >= 0 && min <= 59;
}

/** Diferencia en ms entre la hora de Chile y UTC en un instante dado (negativa: Chile va detrás de UTC). */
function desfaseChile(instante: number) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: "America/Santiago", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
      .formatToParts(new Date(instante))
      .map((x) => [x.type, Number(x.value)])
  );
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(instante / 1000) * 1000;
}

/**
 * Convierte una fecha y hora local de Chile (como la entrega un input datetime-local) al instante UTC en ISO.
 * No depende de la zona horaria del servidor (Vercel corre en UTC) y respeta el cambio de hora.
 */
export function fechaHoraChileAISO(local: string) {
  const [fecha, hora] = local.split("T");
  const [y, m, d] = fecha.split("-").map(Number);
  const [h, min, s = 0] = hora.split(":").map(Number);
  const comoUtc = Date.UTC(y, m - 1, d, h, min, s);
  let instante = comoUtc - desfaseChile(comoUtc);
  instante = comoUtc - desfaseChile(instante); // segundo ajuste por si el primero cruzó un cambio de hora
  return new Date(instante).toISOString();
}

export function sumarDias(iso: string, dias: number) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + dias)).toISOString().slice(0, 10);
}

export function sumarAnios(iso: string, anios: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const fecha = new Date(Date.UTC(y + anios, m - 1, 1));
  const ultimoDia = new Date(Date.UTC(y + anios, m, 0)).getUTCDate();
  fecha.setUTCDate(Math.min(d, ultimoDia));
  return fecha.toISOString().slice(0, 10);
}

/** Días de diferencia entre dos fechas ISO (b - a). */
export function diasEntre(a: string, b: string) {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000);
}

/** Fecha mínima aceptable como nacimiento (hoy menos la edad máxima). */
export function fechaMinimaNacimiento(hoy = hoyISO()) {
  return sumarAnios(hoy, -EDAD_MAXIMA);
}

/** Último día en que puede empezar una estadía. */
export function fechaMaximaReserva(hoy = hoyISO()) {
  return sumarDias(hoy, MAX_ANTICIPACION_DIAS);
}

export type ProblemaEstadia = { campo: "inicio" | "fin"; mensaje: string };

/**
 * Valida un rango de estadía. Devuelve el problema o null si es válido.
 * Reglas: fechas reales, llegada no anterior a hoy, salida posterior a la llegada,
 * máximo MAX_NOCHES noches y hasta MAX_ANTICIPACION_DIAS días de anticipación.
 */
export function validarEstadia(inicio: unknown, fin: unknown, hoy = hoyISO()): ProblemaEstadia | null {
  if (!fechaValida(inicio)) return { campo: "inicio", mensaje: "Ingresa una fecha de llegada válida" };
  if (!fechaValida(fin)) return { campo: "fin", mensaje: "Ingresa una fecha de salida válida" };
  if (inicio < hoy) return { campo: "inicio", mensaje: "La fecha de llegada no puede ser anterior a hoy" };
  if (fin <= inicio) return { campo: "fin", mensaje: "La fecha de salida debe ser posterior a la de llegada" };
  if (diasEntre(inicio, fin) > MAX_NOCHES) return { campo: "fin", mensaje: `La estadía no puede superar ${MAX_NOCHES} noches` };
  if (inicio > fechaMaximaReserva(hoy)) return { campo: "inicio", mensaje: "Solo se puede reservar con hasta un año de anticipación" };
  return null;
}

/** Fecha de nacimiento: real, no futura y dentro de una edad posible. */
export function validarFechaNacimiento(valor: unknown, hoy = hoyISO()): string | null {
  if (!fechaValida(valor)) return "Ingresa una fecha de nacimiento válida";
  if (valor > hoy) return "La fecha de nacimiento no puede ser futura";
  if (valor < fechaMinimaNacimiento(hoy)) return `La fecha de nacimiento no puede ser de hace más de ${EDAD_MAXIMA} años`;
  return null;
}

/** Fecha de un hecho ya ocurrido (compra, movimiento contable): real y no futura. */
export function validarFechaNoFutura(valor: unknown, etiqueta = "La fecha", hoy = hoyISO()): string | null {
  if (!fechaValida(valor)) return `${etiqueta} no es válida`;
  if (valor > hoy) return `${etiqueta} no puede ser futura`;
  return null;
}

/** Rango de fechas inclusivo para programar algo a futuro (mantenciones). */
export function validarRangoFuturo(inicio: unknown, fin: unknown, hoy = hoyISO()): ProblemaEstadia | null {
  if (!fechaValida(inicio)) return { campo: "inicio", mensaje: "Ingresa una fecha de inicio válida" };
  if (!fechaValida(fin)) return { campo: "fin", mensaje: "Ingresa una fecha de término válida" };
  if (inicio < hoy) return { campo: "inicio", mensaje: "La fecha de inicio no puede ser anterior a hoy" };
  if (fin < inicio) return { campo: "fin", mensaje: "La fecha de término debe ser igual o posterior al inicio" };
  return null;
}

// ---------------- Esquemas zod reutilizables ----------------

/** Fecha ISO real. */
export const zFecha = (mensaje = "Fecha inválida") => z.string().refine(fechaValida, mensaje);

/** Fecha de nacimiento opcional (el formulario puede dejarla vacía). */
export const zFechaNacimiento = z
  .string()
  .optional()
  .superRefine((v, ctx) => {
    if (v === undefined) return;
    const e = validarFechaNacimiento(v);
    if (e) ctx.addIssue({ code: "custom", message: e });
  });

/** Fecha opcional que no puede ser futura. */
export const zFechaNoFutura = (etiqueta: string) =>
  z
    .string()
    .optional()
    .superRefine((v, ctx) => {
      if (v === undefined) return;
      const e = validarFechaNoFutura(v, etiqueta);
      if (e) ctx.addIssue({ code: "custom", message: e });
    });

/** Agrega a `ctx` el problema de estadía, en el campo que corresponde. */
export function refinarEstadia(d: { inicio: string; fin: string }, ctx: z.RefinementCtx) {
  const p = validarEstadia(d.inicio, d.fin);
  if (p) ctx.addIssue({ code: "custom", message: p.mensaje, path: [p.campo] });
}
