import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatearRut } from "@/lib/rut";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Clientes" };

export default async function ClientesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const supabase = await createClient();
  let query = supabase
    .from("clientes")
    .select("id, nombre, apellido, rut, email, telefono, created_at, profile_id")
    .order("created_at", { ascending: false })
    .limit(100);
  if (q) {
    const term = `%${q}%`;
    query = query.or(`nombre.ilike.${term},apellido.ilike.${term},email.ilike.${term},rut.ilike.${term}`);
  }
  const { data: clientes } = await query;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <Button render={<Link href="/admin/clientes/nuevo" />}>Nuevo cliente</Button>
      </div>
      <form className="flex gap-2">
        <Input name="q" placeholder="Buscar por nombre, RUT o correo" defaultValue={q} className="max-w-sm" />
        <Button type="submit" variant="outline">Buscar</Button>
      </form>
      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>RUT</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead className="hidden md:table-cell">Teléfono</TableHead>
              <TableHead className="hidden md:table-cell">Cuenta</TableHead>
              <TableHead className="hidden md:table-cell">Registrado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes?.length ? (
              clientes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/admin/clientes/${c.id}`} className="font-medium hover:underline">
                      {c.nombre} {c.apellido ?? ""}
                    </Link>
                  </TableCell>
                  <TableCell>{formatearRut(c.rut)}</TableCell>
                  <TableCell>{c.email}</TableCell>
                  <TableCell className="hidden md:table-cell">{c.telefono ?? "—"}</TableCell>
                  <TableCell className="hidden md:table-cell">{c.profile_id ? "Sí" : "No"}</TableCell>
                  <TableCell className="hidden md:table-cell">{formatDate(c.created_at)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  {q ? "Sin resultados para la búsqueda." : "Aún no hay clientes registrados."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
