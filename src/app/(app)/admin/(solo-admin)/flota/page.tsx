import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ActivoToggle, ConductorForm, VehiculoForm } from "./forms";

export const metadata = { title: "Flota" };

export default async function FlotaPage() {
  const supabase = await createClient();
  const [{ data: vehiculos }, { data: conductores }] = await Promise.all([
    supabase.from("vehiculos").select("*").order("patente"),
    supabase.from("conductores").select("*").order("nombre"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Flota y conductores</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Vehículos</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Patente</TableHead><TableHead>Vehículo</TableHead><TableHead>Cap.</TableHead><TableHead>Activo</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {vehiculos?.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono">{v.patente}</TableCell>
                    <TableCell>{[v.marca, v.modelo].filter(Boolean).join(" ") || "—"}</TableCell>
                    <TableCell>{v.capacidad}</TableCell>
                    <TableCell><ActivoToggle tabla="vehiculos" id={v.id} activo={v.activo} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <VehiculoForm />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Conductores</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Nombre</TableHead><TableHead>Teléfono</TableHead><TableHead>Licencia</TableHead><TableHead>Activo</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {conductores?.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.nombre}</TableCell>
                    <TableCell>{c.telefono ?? "—"}</TableCell>
                    <TableCell>{c.licencia ?? "—"}</TableCell>
                    <TableCell><ActivoToggle tabla="conductores" id={c.id} activo={c.activo} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <ConductorForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
