import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DepartamentoForm } from "../departamento-form";
import { FotosPanel } from "./fotos-panel";
import { InventarioPanel } from "./inventario-panel";
import { EstadoBadge } from "@/components/estado-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCLP } from "@/lib/format";

export const metadata = { title: "Departamento" };

export default async function DepartamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const depId = Number(id);
  const supabase = await createClient();
  const [{ data: dep }, { data: zonas }, { data: fotos }, { data: items }, { data: estado }] = await Promise.all([
    supabase.from("departamentos").select("*").eq("id", depId).single(),
    supabase.from("zonas").select("id, nombre").order("nombre"),
    supabase.from("departamento_fotos").select("*").eq("departamento_id", depId).order("es_portada", { ascending: false }).order("orden"),
    supabase.from("inventario_items").select("*").eq("departamento_id", depId).order("nombre"),
    supabase.rpc("estado_departamento_actual", { p_departamento: depId }),
  ]);
  if (!dep) notFound();

  const fotosConUrl = (fotos ?? []).map((f) => ({
    ...f,
    url: supabase.storage.from("departamentos").getPublicUrl(f.storage_path).data.publicUrl,
  }));
  const valorInventario = (items ?? []).reduce((acc, i) => acc + i.cantidad * Number(i.valor_unitario), 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/admin/departamentos" className="hover:underline">Departamentos</Link> / {dep.codigo}
          </p>
          <h1 className="text-2xl font-semibold">{dep.nombre}</h1>
        </div>
        <EstadoBadge estado={estado ?? "disponible"} className="text-sm" />
      </div>

      <nav className="flex gap-4 border-b text-sm">
        <a href="#datos" className="border-b-2 border-transparent pb-2 hover:border-foreground">Datos</a>
        <a href="#fotos" className="border-b-2 border-transparent pb-2 hover:border-foreground">Fotos ({fotos?.length ?? 0})</a>
        <a href="#inventario" className="border-b-2 border-transparent pb-2 hover:border-foreground">Inventario ({items?.length ?? 0})</a>
      </nav>

      <section id="datos" className="scroll-mt-20">
        <DepartamentoForm departamento={dep} zonas={zonas ?? []} />
      </section>

      <section id="fotos" className="scroll-mt-20">
        <Card>
          <CardHeader>
            <CardTitle>Fotografías</CardTitle>
            <CardDescription>La portada se muestra en el catálogo. Máximo 5 MB por imagen.</CardDescription>
          </CardHeader>
          <CardContent>
            <FotosPanel depId={depId} fotos={fotosConUrl} />
          </CardContent>
        </Card>
      </section>

      <section id="inventario" className="scroll-mt-20">
        <Card>
          <CardHeader>
            <CardTitle>Inventario valorizado</CardTitle>
            <CardDescription>Valor total: {formatCLP(valorInventario)}. Haz clic en un ítem para registrar altas, bajas, deterioros o reparaciones.</CardDescription>
          </CardHeader>
          <CardContent>
            <InventarioPanel depId={depId} items={items ?? []} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
