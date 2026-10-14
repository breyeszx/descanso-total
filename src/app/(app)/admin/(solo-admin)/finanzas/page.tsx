import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCLP, formatDate, hoyISO } from "@/lib/format";
import { MovimientoForm } from "./movimiento-form";

export const metadata = { title: "Finanzas" };

export default async function FinanzasPage({ searchParams }: { searchParams: Promise<{ desde?: string; hasta?: string; tipo?: string }> }) {
  const sp = await searchParams;
  const hoy = hoyISO();
  const desde = sp.desde || hoy.slice(0, 8) + "01";
  const hasta = sp.hasta || hoy;
  const supabase = await createClient();
  let q = supabase.from("movimientos_financieros").select("*, departamentos(codigo), reservas(codigo)").gte("fecha", desde).lte("fecha", hasta).order("fecha", { ascending: false }).order("id", { ascending: false }).limit(300);
  if (sp.tipo === "ingreso" || sp.tipo === "egreso") q = q.eq("tipo", sp.tipo);
  const [{ data: movs }, { data: deps }] = await Promise.all([q, supabase.from("departamentos").select("id, codigo, nombre").order("codigo")]);
  const ingresos = (movs ?? []).filter((m) => m.tipo === "ingreso").reduce((a, m) => a + Number(m.monto), 0);
  const egresos = (movs ?? []).filter((m) => m.tipo === "egreso").reduce((a, m) => a + Number(m.monto), 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Flujos de dinero</h1>
          <p className="text-sm text-muted-foreground">Ingresos {formatCLP(ingresos)} · Egresos {formatCLP(egresos)} · Resultado <strong>{formatCLP(ingresos - egresos)}</strong></p>
        </div>
        <form className="flex flex-wrap items-end gap-2">
          <Input name="desde" type="date" defaultValue={desde} className="w-40" aria-label="Desde" />
          <Input name="hasta" type="date" defaultValue={hasta} className="w-40" aria-label="Hasta" />
          <select name="tipo" defaultValue={sp.tipo ?? ""} className="h-9 rounded-lg border border-input bg-background px-3 text-sm">
            <option value="">Ingresos y egresos</option><option value="ingreso">Solo ingresos</option><option value="egreso">Solo egresos</option>
          </select>
          <Button type="submit" variant="outline">Filtrar</Button>
          <Button variant="ghost" render={<Link href="/admin/reportes" />}>Reportes</Button>
        </form>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registrar movimiento</CardTitle>
          <CardDescription>Arriendos, servicios, reparaciones y mantenciones se registran solos. Usa esto para dividendos, contribuciones, gastos generales u otros.</CardDescription>
        </CardHeader>
        <CardContent><MovimientoForm departamentos={deps ?? []} /></CardContent>
      </Card>

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Tipo</TableHead><TableHead>Categoría</TableHead><TableHead>Descripción</TableHead><TableHead className="hidden md:table-cell">Depto. / Reserva</TableHead><TableHead className="text-right">Monto</TableHead></TableRow></TableHeader>
          <TableBody>
            {movs?.length ? movs.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="whitespace-nowrap">{formatDate(m.fecha)}</TableCell>
                <TableCell className={m.tipo === "ingreso" ? "text-green-700 dark:text-green-400" : "text-destructive"}>{m.tipo}</TableCell>
                <TableCell className="capitalize">{m.categoria.replace("_", " ")}</TableCell>
                <TableCell>{m.descripcion ?? "—"}</TableCell>
                <TableCell className="hidden md:table-cell font-mono text-xs">{m.departamentos?.codigo ?? ""} {m.reservas?.codigo ?? ""}</TableCell>
                <TableCell className="text-right">{m.tipo === "egreso" ? "-" : ""}{formatCLP(m.monto)}</TableCell>
              </TableRow>
            )) : <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Sin movimientos en el período.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
