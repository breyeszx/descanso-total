import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EstadoBadge, estadoLabel } from "@/components/estado-badge";
import { formatCLP, formatDate } from "@/lib/format";
import { filtroBusqueda, terminoBusqueda } from "@/lib/busqueda";
import { paginaActual, rangoPagina, urlPagina } from "@/lib/paginacion";
import { Paginacion } from "@/components/paginacion";
import type { Database } from "@/lib/supabase/database.types";

export const metadata = { title: "Reservas" };

type Estado = Database["public"]["Enums"]["estado_reserva"];
const ESTADOS: Estado[] = ["pendiente_pago", "confirmada", "en_curso", "finalizada", "cancelada", "no_show"];

export default async function ReservasAdminPage({ searchParams }: { searchParams: Promise<{ q?: string; estado?: string; pagina?: string }> }) {
  const sp = await searchParams;
  const q = terminoBusqueda(sp.q);
  const estado = ESTADOS.find((e) => e === sp.estado);
  const pagina = paginaActual(sp.pagina);
  const filtros = { q, estado };

  const supabase = await createClient();
  let query = supabase
    .from("vw_reservas")
    .select("*", { count: "exact" })
    .order("fecha_inicio", { ascending: false })
    .order("id", { ascending: false })
    .range(...rangoPagina(pagina));
  if (estado) query = query.eq("estado", estado);
  const busqueda = filtroBusqueda(q, ["codigo", "cliente_nombre", "cliente_apellido", "cliente_email", "departamento_nombre"]);
  if (busqueda) query = query.or(busqueda);
  const { data: reservas, count } = await query;
  if (pagina > 1 && !reservas?.length) redirect(urlPagina("/admin/reservas", filtros));

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
      <Paginacion ruta="/admin/reservas" params={filtros} pagina={pagina} total={count ?? 0} />
    </div>
  );
}
