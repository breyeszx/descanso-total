import { hoyISO } from "./format.ts";

export type Periodo = "dia" | "semana" | "mes" | "anio" | "rango";

/** Convierte el período elegido en un rango de fechas ISO (inclusive). */
export function rangoPeriodo(periodo: Periodo, base?: string, hasta?: string) {
  const ref = base && /^\d{4}-\d{2}-\d{2}$/.test(base) ? base : hoyISO();
  const d = new Date(ref + "T12:00:00");
  const iso = (x: Date) => x.toISOString().slice(0, 10);
  switch (periodo) {
    case "dia":
      return { desde: ref, hasta: ref };
    case "semana": {
      const lunes = new Date(d);
      lunes.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      const dom = new Date(lunes);
      dom.setDate(lunes.getDate() + 6);
      return { desde: iso(lunes), hasta: iso(dom) };
    }
    case "anio":
      return { desde: `${ref.slice(0, 4)}-01-01`, hasta: `${ref.slice(0, 4)}-12-31` };
    case "rango":
      return { desde: ref, hasta: hasta && /^\d{4}-\d{2}-\d{2}$/.test(hasta) && hasta >= ref ? hasta : ref };
    default: {
      const fin = new Date(d.getFullYear(), d.getMonth() + 1, 0, 12);
      return { desde: ref.slice(0, 8) + "01", hasta: iso(fin) };
    }
  }
}

export const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
