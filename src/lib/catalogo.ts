import { createClient } from "@/lib/supabase/server";
import type { DepCard } from "@/components/departamento-card";

export type Busqueda = { inicio?: string; fin?: string; zona?: string; huespedes?: string };

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export function busquedaValida(b: Busqueda) {
  return !!(b.inicio && b.fin && ISO.test(b.inicio) && ISO.test(b.fin) && b.fin > b.inicio);
}

export function busquedaQuery(b: Busqueda) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(b)) if (v) p.set(k, v);
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** Catálogo público: todos los activos o solo los disponibles para la búsqueda. */
export async function buscarDepartamentos(b: Busqueda): Promise<DepCard[]> {
  const supabase = await createClient();
  const huespedes = Math.max(1, Number(b.huespedes) || 1);
  const zona = b.zona ? Number(b.zona) : null;

  let ids: number[] | null = null;
  if (busquedaValida(b)) {
    const { data } = await supabase.rpc("departamentos_disponibles", {
      p_inicio: b.inicio!,
      p_fin: b.fin!,
      p_zona: zona ?? undefined,
      p_huespedes: huespedes,
    });
    ids = (data ?? []).map((d) => d.id);
    if (ids.length === 0) return [];
  }

  let q = supabase
    .from("vw_departamentos")
    .select("id, nombre, zona_nombre, capacidad_max, dormitorios, banos, tarifa_base, amenidades, foto_portada")
    .eq("activo", true)
    .gte("capacidad_max", huespedes)
    .order("zona_id")
    .order("nombre");
  if (zona) q = q.eq("zona_id", zona);
  if (ids) q = q.in("id", ids);
  const { data } = await q;

  return (data ?? []).map((d) => ({
    id: d.id!,
    nombre: d.nombre!,
    zona_nombre: d.zona_nombre,
    capacidad_max: d.capacidad_max!,
    dormitorios: d.dormitorios!,
    banos: d.banos!,
    tarifa_base: Number(d.tarifa_base),
    amenidades: d.amenidades ?? [],
    foto_url: d.foto_portada ? supabase.storage.from("departamentos").getPublicUrl(d.foto_portada).data.publicUrl : null,
  }));
}
