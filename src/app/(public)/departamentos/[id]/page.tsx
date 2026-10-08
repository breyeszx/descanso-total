import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { busquedaValida, type Busqueda } from "@/lib/catalogo";
import { formatCLP, formatDate, hoyISO } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("departamentos").select("nombre").eq("id", Number(id)).single();
  return { title: data?.nombre ?? "Departamento" };
}

export default async function DepartamentoPublicoPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Busqueda> }) {
  const [{ id }, b] = await Promise.all([params, searchParams]);
  const depId = Number(id);
  const supabase = await createClient();
  const [{ data: dep }, { data: fotos }, { data: servicios }] = await Promise.all([
    supabase.from("vw_departamentos").select("*").eq("id", depId).eq("activo", true).single(),
    supabase.from("departamento_fotos").select("storage_path, es_portada").eq("departamento_id", depId).order("es_portada", { ascending: false }).order("orden"),
    supabase.from("servicios").select("id, nombre, tipo, precio").eq("activo", true).order("tipo"),
  ]);
  if (!dep) notFound();

  const urls = (fotos ?? []).map((f) => supabase.storage.from("departamentos").getPublicUrl(f.storage_path).data.publicUrl);
  const huespedes = Math.min(Math.max(1, Number(b.huespedes) || 2), dep.capacidad_max!);
  let cotizacion: { noches: number; monto_arriendo: number; monto_anticipo: number; disponible: boolean } | null = null;
  if (busquedaValida(b)) {
    const { data } = await supabase.rpc("cotizar_reserva", { p_departamento: depId, p_inicio: b.inicio!, p_fin: b.fin! }).single();
    if (data) cotizacion = { noches: data.noches!, monto_arriendo: Number(data.monto_arriendo), monto_anticipo: Number(data.monto_anticipo), disponible: !!data.disponible };
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/departamentos" className="hover:underline">Departamentos</Link> / {dep.zona_nombre}
        </p>
        <h1 className="text-2xl font-semibold sm:text-3xl">{dep.nombre}</h1>
        <p className="text-sm text-muted-foreground">{dep.direccion}</p>
      </div>

      {urls.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-3">
          {urls.slice(0, 3).map((u, i) => (
            <div key={u} className={i === 0 ? "relative aspect-4/3 sm:col-span-2 sm:row-span-2" : "relative aspect-4/3"}>
              <Image src={u} alt={dep.nombre ?? ""} fill unoptimized className="rounded-xl object-cover" />
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <p className="text-sm text-muted-foreground">
            {dep.capacidad_max} huéspedes · {dep.dormitorios} dormitorio(s) · {dep.banos} baño(s)
          </p>
          <p className="leading-relaxed">{dep.descripcion ?? "Departamento completamente equipado."}</p>
          {dep.amenidades?.length ? (
            <div className="flex flex-wrap gap-1.5">
              {dep.amenidades.map((a) => (
                <Badge key={a} variant="secondary" className="capitalize">{a}</Badge>
              ))}
            </div>
          ) : null}
          {servicios?.length ? (
            <div>
              <h2 className="mb-2 font-semibold">Servicios que puedes sumar a tu reserva</h2>
              <ul className="grid gap-1 text-sm sm:grid-cols-2">
                {servicios.map((s) => (
                  <li key={s.id} className="flex justify-between rounded-lg border bg-background px-3 py-2">
                    <span>{s.nombre}</span>
                    <span className="text-muted-foreground">{formatCLP(s.precio)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <Card className="h-fit lg:sticky lg:top-4">
          <CardHeader>
            <CardTitle>
              {formatCLP(dep.tarifa_base)} <span className="text-sm font-normal text-muted-foreground">/ noche</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={`/departamentos/${depId}`} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="inicio">Llegada</Label>
                  <Input id="inicio" name="inicio" type="date" min={hoyISO()} defaultValue={b.inicio} required />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="fin">Salida</Label>
                  <Input id="fin" name="fin" type="date" min={hoyISO()} defaultValue={b.fin} required />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="huespedes">Huéspedes (máx. {dep.capacidad_max})</Label>
                <Input id="huespedes" name="huespedes" type="number" min={1} max={dep.capacidad_max!} defaultValue={huespedes} />
              </div>
              <Button type="submit" variant="outline">Ver disponibilidad</Button>
            </form>

            {cotizacion && (
              <div className="mt-4 flex flex-col gap-2 border-t pt-4 text-sm">
                <div className="flex justify-between">
                  <span>{formatDate(b.inicio)} → {formatDate(b.fin)}</span>
                  <span>{cotizacion.noches} noche(s)</span>
                </div>
                <div className="flex justify-between"><span>Arriendo</span><span>{formatCLP(cotizacion.monto_arriendo)}</span></div>
                <div className="flex justify-between font-medium"><span>Anticipo para confirmar</span><span>{formatCLP(cotizacion.monto_anticipo)}</span></div>
                {cotizacion.disponible ? (
                  <Button className="mt-2 w-full" render={<Link href={`/reservar/${depId}?inicio=${b.inicio}&fin=${b.fin}&huespedes=${huespedes}`} />}>
                    Reservar
                  </Button>
                ) : (
                  <p className="rounded-lg bg-destructive/10 p-2 text-center text-destructive">No disponible en esas fechas</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
