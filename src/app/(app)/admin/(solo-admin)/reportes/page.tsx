import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCLP, formatDate, hoyISO } from "@/lib/format";
import { cargarReporte, MESES, rangoPeriodo, type Periodo } from "@/lib/reportes";

export const metadata = { title: "Reportes" };

const PERIODOS: { value: Periodo; label: string }[] = [
  { value: "dia", label: "Día" }, { value: "semana", label: "Semana" }, { value: "mes", label: "Mes" }, { value: "anio", label: "Año" }, { value: "rango", label: "Rango" },
];

export default async function ReportesPage({ searchParams }: { searchParams: Promise<{ periodo?: Periodo; fecha?: string; hasta?: string }> }) {
  const sp = await searchParams;
  const periodo = PERIODOS.some((p) => p.value === sp.periodo) ? sp.periodo! : "mes";
  const { desde, hasta } = rangoPeriodo(periodo, sp.fecha, sp.hasta);
  const r = await cargarReporte(desde, hasta);
  const maxMes = Math.max(1, ...r.mensual.map((m) => m.ingresos));
  const qs = `periodo=${periodo}&fecha=${desde}&hasta=${hasta}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Reportes y estadísticas</h1>
          <p className="text-sm text-muted-foreground">{formatDate(desde)} → {formatDate(hasta)} · {r.dias} día(s)</p>
        </div>
        <form className="flex flex-wrap items-end gap-2">
          <select name="periodo" defaultValue={periodo} className="h-9 rounded-lg border border-input bg-background px-3 text-sm">
            {PERIODOS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <Input name="fecha" type="date" defaultValue={sp.fecha ?? hoyISO()} className="w-40" aria-label="Fecha base" />
          <Input name="hasta" type="date" defaultValue={sp.hasta ?? ""} className="w-40" aria-label="Hasta (solo rango)" />
          <Button type="submit" variant="outline">Ver</Button>
          <Button render={<a href={`/api/reportes?${qs}`} target="_blank" rel="noopener" />}>Exportar PDF</Button>
        </form>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi t="Ingresos" v={formatCLP(r.totales.ingresos)} />
        <Kpi t="Egresos" v={formatCLP(r.totales.egresos)} />
        <Kpi t="Resultado" v={formatCLP(r.totales.resultado)} />
        <Kpi t="Reservas (llegadas)" v={String(r.totales.reservas)} />
        <Kpi t="Ocupación" v={`${r.totales.ocupacion}%`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Por zona</CardTitle><CardDescription>Rentabilidad y ocupación por zona turística.</CardDescription></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Zona</TableHead><TableHead className="text-right">Reservas</TableHead><TableHead className="text-right">Noches</TableHead><TableHead className="text-right">Ingresos</TableHead><TableHead className="text-right">Resultado</TableHead></TableRow></TableHeader>
              <TableBody>
                {r.zonas.map((z) => (
                  <TableRow key={z.zona}><TableCell>{z.zona}</TableCell><TableCell className="text-right">{z.reservas}</TableCell><TableCell className="text-right">{z.noches}</TableCell><TableCell className="text-right">{formatCLP(z.ingresos)}</TableCell><TableCell className="text-right">{formatCLP(z.ingresos - z.egresos)}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Servicios más contratados</CardTitle><CardDescription>Tours y equipamiento en reservas con llegada en el período.</CardDescription></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Servicio</TableHead><TableHead>Tipo</TableHead><TableHead className="text-right">Cant.</TableHead><TableHead className="text-right">Monto</TableHead></TableRow></TableHeader>
              <TableBody>
                {r.servicios.length ? r.servicios.map((s) => (
                  <TableRow key={s.servicio}><TableCell>{s.servicio}</TableCell><TableCell className="capitalize">{s.tipo}</TableCell><TableCell className="text-right">{s.cantidad}</TableCell><TableCell className="text-right">{formatCLP(s.monto)}</TableCell></TableRow>
                )) : <TableRow><TableCell colSpan={4} className="py-6 text-center text-muted-foreground">Sin servicios en el período.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Por departamento</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Depto.</TableHead><TableHead className="hidden md:table-cell">Zona</TableHead><TableHead className="text-right">Reservas</TableHead><TableHead className="text-right">Noches</TableHead><TableHead className="text-right">Ocupación</TableHead><TableHead className="text-right">Ingresos</TableHead><TableHead className="text-right">Egresos</TableHead></TableRow></TableHeader>
            <TableBody>
              {r.departamentos.map((d) => (
                <TableRow key={d.departamento_id}>
                  <TableCell><span className="font-mono text-xs text-muted-foreground">{d.codigo}</span> {d.departamento}</TableCell>
                  <TableCell className="hidden md:table-cell">{d.zona}</TableCell>
                  <TableCell className="text-right">{d.reservas}</TableCell>
                  <TableCell className="text-right">{d.noches}</TableCell>
                  <TableCell className="text-right">{d.ocupacion}%</TableCell>
                  <TableCell className="text-right">{formatCLP(d.ingresos)}</TableCell>
                  <TableCell className="text-right">{formatCLP(d.egresos)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Temporadas {desde.slice(0, 4)}</CardTitle><CardDescription>Ingresos y ocupación mensual. Identifica los meses de mayor demanda.</CardDescription></CardHeader>
        <CardContent className="flex flex-col gap-1.5">
          {r.mensual.map((m) => (
            <div key={m.mes} className="grid grid-cols-[3rem_1fr_7rem_4rem] items-center gap-2 text-sm">
              <span className="text-muted-foreground">{MESES[m.mes - 1]}</span>
              <div className="h-5 rounded bg-muted"><div className="h-5 rounded bg-primary" style={{ width: `${Math.round((m.ingresos / maxMes) * 100)}%` }} /></div>
              <span className="text-right">{formatCLP(m.ingresos)}</span>
              <span className="text-right text-muted-foreground">{m.ocupacion}%</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ t, v }: { t: string; v: string }) {
  return (
    <Card><CardHeader className="pb-1"><CardDescription>{t}</CardDescription><CardTitle className="text-xl">{v}</CardTitle></CardHeader></Card>
  );
}
