import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Buscador } from "@/components/buscador";
import { DepartamentoCard } from "@/components/departamento-card";
import { buscarDepartamentos } from "@/lib/catalogo";

export default async function HomePage() {
  const supabase = await createClient();
  const [{ data: zonas }, destacados] = await Promise.all([
    supabase.from("zonas").select("id, nombre").eq("activa", true).order("nombre"),
    buscarDepartamentos({}),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-6 rounded-2xl bg-primary px-6 py-12 text-primary-foreground">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Tu descanso, en las mejores zonas turísticas de Chile</h1>
          <p className="mt-3 text-primary-foreground/80">
            Departamentos equipados en Viña del Mar, La Serena, Pucón, Puerto Varas y San Pedro de Atacama. Reserva en línea con anticipo y suma traslados y tours.
          </p>
        </div>
        <Buscador zonas={zonas ?? []} />
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Nuestros departamentos</h2>
          <Link href="/departamentos" className="text-sm text-muted-foreground hover:underline">Ver todos</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {destacados.slice(0, 8).map((d) => (
            <DepartamentoCard key={d.id} dep={d} />
          ))}
        </div>
      </section>
    </div>
  );
}
