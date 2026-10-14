import { createClient } from "@/lib/supabase/server";
import { hoyISO } from "@/lib/format";

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

export async function cargarReporte(desde: string, hasta: string) {
  const supabase = await createClient();
  const [{ data: deps }, { data: servicios }, { data: mensual }] = await Promise.all([
    supabase.rpc("reporte_departamentos", { p_desde: desde, p_hasta: hasta }),
    supabase.rpc("reporte_servicios", { p_desde: desde, p_hasta: hasta }),
    supabase.rpc("reporte_mensual", { p_anio: Number(desde.slice(0, 4)) }),
  ]);
  const filas = (deps ?? []).map((d) => ({ ...d, ingresos: Number(d.ingresos), egresos: Number(d.egresos), ocupacion: Number(d.ocupacion) }));
  const totales = filas.reduce(
    (a, d) => ({ reservas: a.reservas + Number(d.reservas), noches: a.noches + d.noches, ingresos: a.ingresos + d.ingresos, egresos: a.egresos + d.egresos }),
    { reservas: 0, noches: 0, ingresos: 0, egresos: 0 }
  );
  const dias = Math.round((new Date(hasta).getTime() - new Date(desde).getTime()) / 86400000) + 1;
  const ocupacion = filas.length ? Math.round((totales.noches * 1000) / (filas.length * dias)) / 10 : 0;

  const zonasMap = new Map<string, { zona: string; reservas: number; noches: number; ingresos: number; egresos: number }>();
  for (const d of filas) {
    const z = zonasMap.get(d.zona) ?? { zona: d.zona, reservas: 0, noches: 0, ingresos: 0, egresos: 0 };
    z.reservas += Number(d.reservas); z.noches += d.noches; z.ingresos += d.ingresos; z.egresos += d.egresos;
    zonasMap.set(d.zona, z);
  }
  return {
    desde, hasta, dias,
    totales: { ...totales, ocupacion, resultado: totales.ingresos - totales.egresos },
    departamentos: filas,
    zonas: [...zonasMap.values()].sort((a, b) => b.ingresos - a.ingresos),
    servicios: (servicios ?? []).map((s) => ({ ...s, cantidad: Number(s.cantidad), monto: Number(s.monto) })),
    mensual: (mensual ?? []).map((m) => ({ ...m, ingresos: Number(m.ingresos), egresos: Number(m.egresos), ocupacion: Number(m.ocupacion) })),
  };
}

export type Reporte = Awaited<ReturnType<typeof cargarReporte>>;
export const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
