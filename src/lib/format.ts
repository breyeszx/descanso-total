const TZ = "America/Santiago";

export function formatCLP(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
}

export function formatDate(value: string | Date | null | undefined, opts: Intl.DateTimeFormatOptions = {}) {
  if (!value) return "—";
  const d = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(value + "T12:00:00") : new Date(value);
  return new Intl.DateTimeFormat("es-CL", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric", ...opts }).format(d);
}

export function formatDateTime(value: string | Date | null | undefined) {
  return formatDate(value, { hour: "2-digit", minute: "2-digit" });
}

/** Fecha de hoy en Chile en formato YYYY-MM-DD */
export function hoyISO() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}
