import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EstadoBadge } from "@/components/estado-badge";
import { formatCLP, formatDate } from "@/lib/format";
import { EstadoMantencion, MantencionForm } from "./forms";

export const metadata = { title: "Mantenciones" };

export default async function MantencionesPage() {
  const supabase = await createClient();
  const [{ data: mantenciones }, { data: deps }] = await Promise.all([
    supabase.from("mantenciones").select("*, departamentos(codigo, nombre)").order("fecha_inicio", { ascending: false }).limit(100),
    supabase.from("departamentos").select("id, codigo, nombre").eq("activo", true).order("codigo"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Mantenciones</h1>
      <Card>
        <CardHeader>
          <CardTitle>Programar mantención</CardTitle>
          <CardDescription>Las fechas quedan bloqueadas para reservas. No se puede programar sobre reservas activas.</CardDescription>
        </CardHeader>
        <CardContent><MantencionForm departamentos={deps ?? []} /></CardContent>
      </Card>
      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Departamento</TableHead><TableHead>Título</TableHead><TableHead>Fechas</TableHead><TableHead className="text-right">Costo</TableHead><TableHead>Estado</TableHead><TableHead /></TableRow>
          </TableHeader>
          <TableBody>
            {mantenciones?.length ? mantenciones.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{m.departamentos?.codigo} · {m.departamentos?.nombre}</TableCell>
                <TableCell>{m.titulo}{m.responsable ? <span className="block text-xs text-muted-foreground">{m.responsable}</span> : null}</TableCell>
                <TableCell className="whitespace-nowrap">{formatDate(m.fecha_inicio)} → {formatDate(m.fecha_fin)}</TableCell>
                <TableCell className="text-right">{formatCLP(m.costo)}</TableCell>
                <TableCell><EstadoBadge estado={m.estado} /></TableCell>
                <TableCell><EstadoMantencion id={m.id} estado={m.estado} costo={Number(m.costo)} /></TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Sin mantenciones registradas.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
