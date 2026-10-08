import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EstadoBadge } from "@/components/estado-badge";
import { formatCLP, formatDate, hoyISO } from "@/lib/format";

export const metadata = { title: "Terreno" };

export default async function TerrenoPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const supabase = await createClient();
  const hoy = hoyISO();

  const base = () => supabase.from("vw_reservas").select("id, codigo, estado, fecha_inicio, fecha_fin, num_huespedes, saldo_pendiente, cliente_nombre, cliente_apellido, departamento_nombre, departamento_codigo, zona_nombre");
  const [{ data: llegadas }, { data: salidas }, { data: busqueda }] = await Promise.all([
    base().in("estado", ["confirmada", "pendiente_pago"]).lte("fecha_inicio", hoy).gte("fecha_fin", hoy).order("fecha_inicio"),
    base().eq("estado", "en_curso").order("fecha_fin"),
    q ? base().or(`codigo.ilike.%${q}%,cliente_nombre.ilike.%${q}%,cliente_apellido.ilike.%${q}%,cliente_rut.ilike.%${q}%`).in("estado", ["confirmada", "pendiente_pago", "en_curso"]).limit(10) : Promise.resolve({ data: null }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Operación en terreno</h1>
          <p className="text-sm text-muted-foreground">Hoy {formatDate(hoy)}</p>
        </div>
        <form className="flex gap-2">
          <Input name="q" placeholder="Buscar código, nombre o RUT" defaultValue={q} className="w-56" />
          <Button type="submit" variant="outline">Buscar</Button>
        </form>
      </div>

      {busqueda && (
        <Seccion titulo={`Resultados para "${q}"`} vacio="Sin reservas activas que coincidan.">
          {busqueda.map((r) => <Tarjeta key={r.id} r={r} />)}
        </Seccion>
      )}

      <Seccion titulo="Llegadas pendientes de check-in" vacio="No hay llegadas pendientes.">
        {llegadas?.map((r) => <Tarjeta key={r.id} r={r} />)}
      </Seccion>

      <Seccion titulo="Estadías en curso (check-out)" vacio="No hay departamentos ocupados.">
        {salidas?.map((r) => <Tarjeta key={r.id} r={r} hoy={hoy} />)}
      </Seccion>
    </div>
  );
}

function Seccion({ titulo, vacio, children }: { titulo: string; vacio: string; children: React.ReactNode }) {
  const lista = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{titulo}</h2>
      {lista.length ? <div className="grid gap-3 md:grid-cols-2">{children}</div> : <p className="rounded-xl border bg-background p-6 text-sm text-muted-foreground">{vacio}</p>}
    </section>
  );
}

type R = {
  id: number | null; codigo: string | null; estado: string | null; fecha_inicio: string | null; fecha_fin: string | null; num_huespedes: number | null;
  saldo_pendiente: number | null; cliente_nombre: string | null; cliente_apellido: string | null; departamento_nombre: string | null; departamento_codigo: string | null; zona_nombre: string | null;
};

function Tarjeta({ r, hoy }: { r: R; hoy?: string }) {
  const enCurso = r.estado === "en_curso";
  const href = enCurso ? `/terreno/${r.id}/check-out` : `/terreno/${r.id}/check-in`;
  const vence = hoy && r.fecha_fin && r.fecha_fin <= hoy;
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-background p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-xs text-muted-foreground">{r.codigo} · {r.departamento_codigo}</p>
          <p className="text-lg font-semibold">{r.departamento_nombre}</p>
          <p className="text-sm text-muted-foreground">{r.zona_nombre}</p>
        </div>
        <EstadoBadge estado={r.estado ?? ""} />
      </div>
      <div className="text-sm">
        <p className="font-medium">{r.cliente_nombre} {r.cliente_apellido ?? ""} · {r.num_huespedes} huésped(es)</p>
        <p className="text-muted-foreground">{formatDate(r.fecha_inicio)} → {formatDate(r.fecha_fin)}{vence ? " · Sale hoy" : ""}</p>
        {Number(r.saldo_pendiente) > 0 && <p className="text-amber-700 dark:text-amber-400">Saldo pendiente {formatCLP(r.saldo_pendiente)}</p>}
      </div>
      <Button size="lg" className="w-full" render={<Link href={href} />}>
        {enCurso ? "Hacer check-out" : "Hacer check-in"}
      </Button>
    </div>
  );
}
