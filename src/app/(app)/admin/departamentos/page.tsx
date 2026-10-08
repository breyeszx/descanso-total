import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EstadoBadge } from "@/components/estado-badge";
import { formatCLP } from "@/lib/format";

export const metadata = { title: "Departamentos" };

export default async function DepartamentosPage() {
  const supabase = await createClient();
  const { data: deps } = await supabase
    .from("vw_departamentos")
    .select("id, codigo, nombre, zona_nombre, capacidad_max, tarifa_base, activo, estado_actual")
    .order("codigo");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Departamentos</h1>
        <Button render={<Link href="/admin/departamentos/nuevo" />}>Nuevo departamento</Button>
      </div>
      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden md:table-cell">Zona</TableHead>
              <TableHead className="hidden md:table-cell">Capacidad</TableHead>
              <TableHead>Tarifa base</TableHead>
              <TableHead>Estado hoy</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deps?.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-mono text-xs">{d.codigo}</TableCell>
                <TableCell>
                  <Link href={`/admin/departamentos/${d.id}`} className="font-medium hover:underline">{d.nombre}</Link>
                </TableCell>
                <TableCell className="hidden md:table-cell">{d.zona_nombre}</TableCell>
                <TableCell className="hidden md:table-cell">{d.capacidad_max} pers.</TableCell>
                <TableCell>{formatCLP(d.tarifa_base)}</TableCell>
                <TableCell><EstadoBadge estado={d.estado_actual ?? "disponible"} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
