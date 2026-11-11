import { createClient } from "@/lib/supabase/server";
import { todasLasFilas } from "@/lib/paginacion";

type Filtro = { desde: string; hasta?: string; tipo?: "ingreso" | "egreso" };

/**
 * Ingresos y egresos de un período sumados sobre todos los movimientos, no solo los de la página visible.
 * Trae únicamente tipo y monto, por tramos. Si el volumen crece mucho conviene pasar la suma a una función SQL.
 */
export async function totalesMovimientos({ desde, hasta, tipo }: Filtro) {
  const supabase = await createClient();
  const filas = await todasLasFilas(async (a, b) => {
    let q = supabase.from("movimientos_financieros").select("tipo, monto").gte("fecha", desde).order("id").range(a, b);
    if (hasta) q = q.lte("fecha", hasta);
    if (tipo) q = q.eq("tipo", tipo);
    return (await q).data;
  });
  let ingresos = 0;
  let egresos = 0;
  for (const m of filas) {
    if (m.tipo === "ingreso") ingresos += Number(m.monto);
    else egresos += Number(m.monto);
  }
  return { ingresos, egresos, resultado: ingresos - egresos, movimientos: filas.length };
}
