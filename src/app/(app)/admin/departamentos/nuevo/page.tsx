import { createClient } from "@/lib/supabase/server";
import { DepartamentoForm } from "../departamento-form";

export const metadata = { title: "Nuevo departamento" };

export default async function NuevoDepartamentoPage() {
  const supabase = await createClient();
  const { data: zonas } = await supabase.from("zonas").select("id, nombre").eq("activa", true).order("nombre");
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">Nuevo departamento</h1>
      <DepartamentoForm zonas={zonas ?? []} />
    </div>
  );
}
