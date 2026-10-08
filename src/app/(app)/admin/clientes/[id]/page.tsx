import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClienteForm } from "../cliente-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EstadoBadge } from "@/components/estado-badge";
import { formatCLP, formatDate } from "@/lib/format";

export const metadata = { title: "Cliente" };

export default async function ClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: cliente }, { data: reservas }] = await Promise.all([
    supabase.from("clientes").select("*").eq("id", Number(id)).single(),
    supabase
      .from("reservas")
      .select("id, codigo, fecha_inicio, fecha_fin, estado, monto_total, departamentos(nombre)")
      .eq("cliente_id", Number(id))
      .order("fecha_inicio", { ascending: false })
      .limit(20),
  ]);
  if (!cliente) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {cliente.nombre} {cliente.apellido ?? ""}
        </h1>
        <p className="text-sm text-muted-foreground">
          Cliente desde {formatDate(cliente.created_at)} · {reservas?.length ?? 0} reservas
          {cliente.profile_id ? " · Tiene cuenta web" : ""}
        </p>
      </div>
      <ClienteForm cliente={cliente} />
      <Card>
        <CardHeader>
          <CardTitle>Historial de reservas</CardTitle>
        </CardHeader>
        <CardContent>
          {reservas?.length ? (
            <ul className="divide-y">
              {reservas.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                  <span className="font-medium">{r.codigo}</span>
                  <span>{r.departamentos?.nombre}</span>
                  <span>
                    {formatDate(r.fecha_inicio)} → {formatDate(r.fecha_fin)}
                  </span>
                  <span>{formatCLP(r.monto_total)}</span>
                  <EstadoBadge estado={r.estado} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Sin reservas registradas.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
