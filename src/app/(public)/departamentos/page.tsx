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
  const zonaNombre = b.zona ? zonas?.find((z) => String(z.id) === b.zona)?.nombre : undefined;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-semibold sm:text-4xl">{zonaNombre ? `Departamentos en ${zonaNombre}` : "Departamentos"}</h1>
        <p className="mt-1.5 text-muted-foreground">
          {conFechas
            ? `${deps.length} ${deps.length === 1 ? "disponible" : "disponibles"} del ${formatDate(b.inicio)} al ${formatDate(b.fin)}`
            : `${deps.length} ${deps.length === 1 ? "departamento" : "departamentos"}. Ingresa fechas para ver la disponibilidad real.`}
        </p>
      </div>
      <Buscador zonas={zonas ?? []} valores={b} compacto />
      {deps.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
          No hay departamentos disponibles para esa búsqueda. Prueba con otras fechas u otra zona.
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
