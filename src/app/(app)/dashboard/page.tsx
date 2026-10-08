import Link from "next/link";
import { requirePerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EstadoBadge } from "@/components/estado-badge";
import { formatCLP, formatDate, hoyISO } from "@/lib/format";

export const metadata = { title: "Panel" };

export default async function DashboardPage() {
  const perfil = await requirePerfil();
  if (perfil.rol !== "admin") {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Hola, {perfil.nombre}</h1>
        <Card>
          <CardHeader>
            <CardTitle>Panel de {perfil.rol}</CardTitle>
            <CardDescription>Los módulos de este perfil se habilitarán en las próximas fases.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const supabase = await createClient();
  const hoy = hoyISO();
  const [{ data: deps }, { count: clientes }, { data: proximas }, { data: ingresosMes }] = await Promise.all([
    supabase.from("vw_departamentos").select("id, codigo, nombre, zona_nombre, estado_actual, foto_portada").order("codigo"),
    supabase.from("clientes").select("id", { count: "exact", head: true }),
    supabase
      .from("reservas")
      .select("id, codigo, fecha_inicio, fecha_fin, estado, monto_total, departamentos(nombre), clientes(nombre, apellido)")
      .in("estado", ["confirmada", "pendiente_pago", "en_curso"])
      .gte("fecha_fin", hoy)
      .order("fecha_inicio")
      .limit(8),
    supabase.from("movimientos_financieros").select("monto").eq("tipo", "ingreso").gte("fecha", hoy.slice(0, 8) + "01"),
  ]);

  const conteo: Record<string, number> = {};
  for (const d of deps ?? []) conteo[d.estado_actual ?? "disponible"] = (conteo[d.estado_actual ?? "disponible"] ?? 0) + 1;
  const totalIngresos = (ingresosMes ?? []).reduce((a, m) => a + Number(m.monto), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Panel de administración</h1>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi titulo="Departamentos disponibles hoy" valor={`${conteo.disponible ?? 0} / ${deps?.length ?? 0}`} />
        <Kpi titulo="Ocupados / reservados" valor={String((conteo.ocupado ?? 0) + (conteo.reservado ?? 0))} />
        <Kpi titulo="Ingresos del mes" valor={formatCLP(totalIngresos)} />
        <Kpi titulo="Clientes registrados" valor={String(clientes ?? 0)} />
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Estado de departamentos ({formatDate(hoy)})</h2>
          <Link href="/admin/departamentos" className="text-sm text-muted-foreground hover:underline">Gestionar</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {deps?.map((d) => (
            <Link key={d.id} href={`/admin/departamentos/${d.id}`} className="rounded-lg border bg-background p-3 transition hover:shadow-sm">
              <p className="font-mono text-xs text-muted-foreground">{d.codigo}</p>
              <p className="truncate font-medium">{d.nombre}</p>
              <p className="truncate text-xs text-muted-foreground">{d.zona_nombre}</p>
              <EstadoBadge estado={d.estado_actual ?? "disponible"} className="mt-2" />
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Próximas llegadas y estadías</h2>
        <Card>
          <CardContent className="p-0">
            {proximas?.length ? (
              <ul className="divide-y text-sm">
                {proximas.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
                    <span className="font-medium">{r.codigo}</span>
                    <span>{r.clientes?.nombre} {r.clientes?.apellido ?? ""}</span>
                    <span>{r.departamentos?.nombre}</span>
                    <span>{formatDate(r.fecha_inicio)} → {formatDate(r.fecha_fin)}</span>
                    <span>{formatCLP(r.monto_total)}</span>
                    <EstadoBadge estado={r.estado} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-4 text-sm text-muted-foreground">No hay reservas próximas. El módulo de reservas llega en la Fase 3.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Kpi({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardDescription>{titulo}</CardDescription>
        <CardTitle className="text-2xl">{valor}</CardTitle>
      </CardHeader>
    </Card>
  );
}
