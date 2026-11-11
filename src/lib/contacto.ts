import { z } from "zod";
import { normalizarRut, validarRut } from "./rut.ts";

/** Reglas compartidas para correo, teléfono y documento de identidad. */

/** Correo en minúsculas, sin espacios alrededor. */
export function normalizarEmail(valor: string) {
  return valor.trim().toLowerCase();
}

/**
 * Normaliza un teléfono a formato internacional compacto (+56912345678).
 * Acepta espacios, guiones y paréntesis. Sin prefijo asume Chile: 9 dígitos (celular o fijo con código de área)
 * o 8 dígitos (fijo antiguo de Santiago, se le antepone el 2). Devuelve null si no es un número usable.
 */
export function normalizarTelefono(valor: string): string | null {
  const limpio = valor.trim();
  if (!limpio) return null;
  if (!/^[+\d(][\d\s().-]*$/.test(limpio)) return null;
  const internacional = limpio.startsWith("+") || limpio.startsWith("00");
  let digitos = limpio.replace(/\D/g, "");
  if (limpio.startsWith("00")) digitos = digitos.slice(2);
  if (internacional) {
    if (digitos.length < 8 || digitos.length > 15) return null;
    return `+${digitos}`;
  }
  if (digitos.startsWith("56") && digitos.length === 11) return `+${digitos}`;
  if (digitos.length === 9) return `+56${digitos}`;
  if (digitos.length === 8) return `+562${digitos}`;
  return null;
}

export function telefonoValido(valor: string) {
  return normalizarTelefono(valor) !== null;
}

/** Teléfono para mostrar: +56 9 1234 5678 para celulares chilenos, el resto tal cual. */
export function formatearTelefono(valor: string | null | undefined) {
  if (!valor) return "—";
  const m = valor.match(/^\+569(\d{4})(\d{4})$/);
  if (m) return `+56 9 ${m[1]} ${m[2]}`;
  const f = valor.match(/^\+56(\d)(\d{4})(\d{4})$/);
  if (f) return `+56 ${f[1]} ${f[2]} ${f[3]}`;
  return valor;
}

export type Documento = { tipo: "rut" | "pasaporte"; valor: string };

/**
 * Documento de identidad: si parece un RUT (solo dígitos y K) se exige dígito verificador correcto y se normaliza;
 * si no, se acepta como pasaporte alfanumérico de 5 a 20 caracteres. Devuelve null si no sirve.
 */
export function normalizarDocumento(valor: string): Documento | null {
  const limpio = valor.trim();
  if (!limpio) return null;
  const pareceRut = /^[\d.\s]+-?\s*[\dkK]$/.test(limpio) && limpio.replace(/\D/g, "").length >= 7;
  if (pareceRut) return validarRut(limpio) ? { tipo: "rut", valor: normalizarRut(limpio) } : null;
  const pasaporte = limpio.replace(/[\s-]/g, "").toUpperCase();
  if (!/^[A-Z0-9]{5,20}$/.test(pasaporte)) return null;
  return { tipo: "pasaporte", valor: pasaporte };
}

// ---------------- Esquemas zod reutilizables ----------------

export const zEmail = (mensaje = "Ingresa un correo válido") => z.string().trim().toLowerCase().pipe(z.email(mensaje)).pipe(z.string().max(254, "El correo es demasiado largo"));

/** Teléfono opcional; si viene, debe ser válido y se guarda normalizado. */
export const zTelefonoOpcional = z
  .string()
  .trim()
  .optional()
  .transform((v, ctx) => {
    if (!v) return undefined;
    const n = normalizarTelefono(v);
    if (!n) ctx.addIssue({ code: "custom", message: "Ingresa un teléfono válido, por ejemplo +56 9 1234 5678" });
    return n ?? undefined;
  });

/** RUT opcional con dígito verificador; se guarda como 12345678-9 o null. */
export const zRutOpcional = z
  .string()
  .trim()
  .optional()
  .transform((v, ctx) => {
    if (!v) return null;
    if (!validarRut(v)) {
      ctx.addIssue({ code: "custom", message: "El RUT no es válido. Revisa el dígito verificador" });
      return null;
    }
    return normalizarRut(v);
  });

/** RUT o pasaporte obligatorio, normalizado. */
export const zDocumento = z
  .string()
  .trim()
  .min(1, "Ingresa el RUT o pasaporte")
  .transform((v, ctx) => {
    const d = normalizarDocumento(v);
    if (!d) {
      ctx.addIssue({ code: "custom", message: /^[\d.\s-]+[\dkK]$/.test(v) ? "El RUT no es válido. Revisa el dígito verificador" : "Ingresa un RUT válido o un pasaporte de 5 a 20 letras y números" });
      return v;
    }
    return d.valor;
  });

/** Nombre de persona: al menos dos caracteres con letras, sin números ni símbolos raros. */
export const zNombrePersona = (mensaje = "Ingresa el nombre") =>
  z
    .string()
    .trim()
    .min(2, mensaje)
    .max(120, "El nombre es demasiado largo")
    .regex(/^[\p{L}][\p{L}\p{M}\s'’.-]*$/u, "El nombre solo puede tener letras, espacios, apóstrofes y guiones");
