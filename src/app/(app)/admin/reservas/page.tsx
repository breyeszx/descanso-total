import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EstadoBadge, estadoLabel } from "@/components/estado-badge";
import { formatCLP, formatDate } from "@/lib/format";
import type { Database } from "@/lib/supabase/database.types";

export const metadata = { title: "Reservas" };

type Estado = Database["public"]["Enums"]["estado_reserva"];
const ESTADOS: Estado[] = ["pendiente_pago", "confirmada", "en_curso", "finalizada", "cancelada", "no_show"];

export default async function ReservasAdminPage({ searchParams }: { searchParams: Promise<{ q?: string; estado?: string }> }) {
  const { q, estado } = await searchParams;
  const supabase = await createClient();
  let query = supabase.from("vw_reservas").select("*").order("fecha_inicio", { ascending: false }).limit(100);
  if (estado && ESTADOS.includes(estado as Estado)) query = query.eq("estado", estado as Estado);
  if (q) query = query.or(`codigo.ilike.%${q}%,cliente_nombre.ilike.%${q}%,cliente_apellido.ilike.%${q}%,cliente_email.ilike.%${q}%,departamento_nombre.ilike.%${q}%`);
  const { data: reservas } = await query;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Reservas</h1>
        <Button variant="outline" render={<Link href="/departamentos" />}>Reservar para un cliente</Button>
      </div>
      <form className="flex flex-wrap gap-2">
        <Input name="q" placeholder="Código, cliente o departamento" defaultValue={q} className="max-w-xs" />
        <select name="estado" defaultValue={estado ?? ""} className="h-9 rounded-lg border border-input bg-background px-3 text-sm">
          <option value="">Todos los estados</option>
          {ESTADOS.map((e) => (
            <option key={e} value={e}>{estadoLabel(e)}</option>
          ))}
        </select>
        <Button type="submit" variant="outline">Filtrar</Button>
      </form>
      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="hidden md:table-cell">Departamento</TableHead>
              <TableHead>Fechas</TableHead>
              <TableHead className="hidden md:table-cell text-right">Total</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reservas?.length ? (
              reservas.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link href={`/admin/reservas/${r.id}`} className="font-mono text-xs font-medium hover:underline">{r.codigo}</Link>
                  </TableCell>
                  <TableCell>{r.cliente_nombre} {r.cliente_apellido ?? ""}</TableCell>
                  <TableCell className="hidden md:table-cell">{r.departamento_nombre}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(r.fecha_inicio)} → {formatDate(r.fecha_fin)}</TableCell>
                  <TableCell className="hidden md:table-cell text-right">{formatCLP(r.monto_total)}</TableCell>
                  <TableCell className="text-right">{formatCLP(r.saldo_pendiente)}</TableCell>
                  <TableCell><EstadoBadge estado={r.estado!} /></TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Sin reservas para el filtro.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
