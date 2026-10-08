import type { ZodError } from "zod";

export type FormState =
  | { error?: string; ok?: string; fields?: Record<string, string>; values?: Record<string, string> }
  | undefined;

/** Convierte un FormData en objeto plano; los campos vacíos pasan a undefined. */
export function formToObject(formData: FormData) {
  const obj: Record<string, unknown> = {};
  for (const [k, v] of formData.entries()) {
    if (v instanceof File) continue;
    obj[k] = v === "" ? undefined : v;
  }
  return obj;
}

/** Valores de texto del formulario, para repoblarlo tras un error. */
export function formValues(formData: FormData) {
  const values: Record<string, string> = {};
  for (const [k, v] of formData.entries()) if (typeof v === "string") values[k] = v;
  return values;
}

export function errorState(message: string, formData?: FormData): FormState {
  return { error: message, values: formData ? formValues(formData) : undefined };
}

export function zodError(e: ZodError, formData?: FormData): FormState {
  const fields: Record<string, string> = {};
  for (const issue of e.issues) {
    const key = issue.path.join(".");
    if (!fields[key]) fields[key] = issue.message;
  }
  return { error: e.issues[0]?.message ?? "Datos inválidos", fields, values: formData ? formValues(formData) : undefined };
}

/** Mensaje amigable para errores de Postgres/Supabase (RNF07). */
export function dbError(message: string): string {
  if (message.includes("reservas_sin_solape")) return "El departamento ya tiene una reserva en esas fechas.";
  if (message.includes("clientes_rut_key")) return "Ya existe un cliente con ese RUT.";
  if (message.includes("clientes_email_idx")) return "Ya existe un cliente con ese correo.";
  if (message.includes("departamentos_codigo_key")) return "Ya existe un departamento con ese código.";
  if (message.includes("row-level security")) return "No tienes permisos para realizar esta acción.";
  if (message.startsWith("P0001") || /mantenci[oó]n|reservas activas/i.test(message)) return message.replace(/^P0001:\s*/, "");
  return "Ocurrió un error al guardar. Intenta nuevamente.";
}
