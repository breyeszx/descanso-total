import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ItemForms } from "./item-forms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EstadoBadge } from "@/components/estado-badge";
import { formatCLP, formatDateTime } from "@/lib/format";

export const metadata = { title: "Ítem de inventario" };

const TIPO: Record<string, string> = { alta: "Alta", baja: "Baja", deterioro: "Deterioro", reparacion: "Reparación" };

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const itemId = Number(id);
  const supabase = await createClient();
  const [{ data: item }, { data: movs }] = await Promise.all([
    supabase.from("inventario_items").select("*, departamentos(id, nombre)").eq("id", itemId).single(),
    supabase.from("inventario_movimientos").select("*").eq("item_id", itemId).order("created_at", { ascending: false }),
  ]);
  if (!item) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/admin/departamentos" className="hover:underline">Departamentos</Link> /{" "}
          <Link href={`/admin/departamentos/${item.departamento_id}#inventario`} className="hover:underline">{item.departamentos?.nombre}</Link> / Inventario
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{item.nombre}</h1>
          <EstadoBadge estado={item.estado} />
        </div>
        <p className="text-sm text-muted-foreground">
          {item.cantidad} unidad(es) · {formatCLP(item.valor_unitario)} c/u · Valorizado {formatCLP(item.cantidad * Number(item.valor_unitario))}
        </p>
      </div>

      <ItemForms item={item} />

      <Card>
        <CardHeader><CardTitle>Historial de movimientos</CardTitle></CardHeader>
        <CardContent>
          {movs?.length ? (
            <ul className="divide-y text-sm">
              {movs.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="font-medium">{TIPO[m.tipo]}</span>
                  <span>{m.cantidad} ud.</span>
                  <span className="text-muted-foreground">{m.descripcion ?? "—"}</span>
                  <span>{Number(m.costo) > 0 ? formatCLP(m.costo) : ""}</span>
                  <span className="text-muted-foreground">{formatDateTime(m.created_at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Sin movimientos registrados.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
