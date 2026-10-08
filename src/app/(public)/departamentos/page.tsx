import { createClient } from "@/lib/supabase/server";
import { Buscador } from "@/components/buscador";
import { DepartamentoCard } from "@/components/departamento-card";
import { buscarDepartamentos, busquedaQuery, busquedaValida, type Busqueda } from "@/lib/catalogo";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Departamentos" };

export default async function DepartamentosPage({ searchParams }: { searchParams: Promise<Busqueda> }) {
  const b = await searchParams;
  const supabase = await createClient();
  const [{ data: zonas }, deps] = await Promise.all([
    supabase.from("zonas").select("id, nombre").eq("activa", true).order("nombre"),
    buscarDepartamentos(b),
  ]);
  const conFechas = busquedaValida(b);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Departamentos</h1>
      <Buscador zonas={zonas ?? []} valores={b} />
      <p className="text-sm text-muted-foreground">
        {conFechas
          ? `${deps.length} disponible(s) del ${formatDate(b.inicio)} al ${formatDate(b.fin)}`
          : `${deps.length} departamento(s). Ingresa fechas para ver disponibilidad real.`}
      </p>
      {deps.length === 0 ? (
        <div className="rounded-xl border bg-background p-10 text-center text-muted-foreground">
          No hay departamentos disponibles para esa búsqueda. Prueba con otras fechas o zona.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {deps.map((d) => (
            <DepartamentoCard key={d.id} dep={d} query={busquedaQuery(b)} />
          ))}
        </div>
      )}
    </div>
  );
}
