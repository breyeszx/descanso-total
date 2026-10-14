import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCLP } from "@/lib/format";
import { ActivoToggle } from "../flota/forms";
import { ServicioForm } from "./servicio-form";

export const metadata = { title: "Servicios y tours" };

export default async function ServiciosPage({ searchParams }: { searchParams: Promise<{ editar?: string }> }) {
  const { editar } = await searchParams;
  const supabase = await createClient();
  const { data: servicios } = await supabase.from("servicios").select("*").order("tipo").order("nombre");
  const enEdicion = servicios?.find((s) => s.id === Number(editar));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Servicios y tours</h1>
      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Servicio</TableHead><TableHead>Tipo</TableHead><TableHead className="text-right">Precio</TableHead><TableHead className="hidden md:table-cell">Duración / cupo</TableHead><TableHead>Transporte</TableHead><TableHead>Activo</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {servicios?.map((s) => (
              <TableRow key={s.id}>
                <TableCell><a href={`?editar=${s.id}`} className="font-medium hover:underline">{s.nombre}</a></TableCell>
                <TableCell className="capitalize">{s.tipo}</TableCell>
                <TableCell className="text-right">{formatCLP(s.precio)}</TableCell>
                <TableCell className="hidden md:table-cell">{s.duracion_horas ? `${s.duracion_horas} h` : "—"} / {s.cupo_max ?? "—"}</TableCell>
                <TableCell>{s.requiere_transporte ? "Sí" : "No"}</TableCell>
                <TableCell><ActivoToggle tabla="servicios" id={s.id} activo={s.activo} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{enEdicion ? `Editar: ${enEdicion.nombre}` : "Nuevo servicio o tour"}</CardTitle>
          <CardDescription>Los servicios activos aparecen en el portal y se pueden vender presencialmente desde una reserva.</CardDescription>
        </CardHeader>
        <CardContent>
          <ServicioForm key={enEdicion?.id ?? "nuevo"} servicio={enEdicion} />
        </CardContent>
      </Card>
    </div>
  );
}
