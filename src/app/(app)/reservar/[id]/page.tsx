import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requirePerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { busquedaValida, type Busqueda } from "@/lib/catalogo";
import { ReservarForm } from "./reservar-form";

export const metadata = { title: "Reservar" };

export default async function ReservarPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Busqueda> }) {
  const [{ id }, b] = await Promise.all([params, searchParams]);
  const perfil = await requirePerfil();
  if (perfil.rol !== "cliente") redirect("/dashboard");
  const depId = Number(id);
  if (!busquedaValida(b)) redirect(`/departamentos/${depId}`);

  const supabase = await createClient();
  const [{ data: dep }, { data: cot }, { data: servicios }, { data: config }] = await Promise.all([
    supabase.from("vw_departamentos").select("id, nombre, zona_nombre, capacidad_max, direccion").eq("id", depId).eq("activo", true).single(),
    supabase.rpc("cotizar_reserva", { p_departamento: depId, p_inicio: b.inicio!, p_fin: b.fin! }).single(),
    supabase.from("servicios").select("id, nombre, tipo, descripcion, precio").eq("activo", true).order("tipo").order("nombre"),
    supabase.from("configuracion").select("clave, valor").in("clave", ["porcentaje_anticipo", "dias_cancelacion_sin_costo", "hora_checkin", "hora_checkout"]),
  ]);
  if (!dep || !cot) notFound();
  if (!cot.disponible) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border bg-background p-8 text-center">
        <p className="font-medium">El departamento ya no está disponible en esas fechas.</p>
        <Link href={`/departamentos/${depId}`} className="mt-3 inline-block text-sm underline">Elegir otras fechas</Link>
      </div>
    );
  }
  const cfg = Object.fromEntries((config ?? []).map((c) => [c.clave, c.valor as string | number]));
  const huespedes = Math.min(Math.max(1, Number(b.huespedes) || 1), dep.capacidad_max!);

  return (
    <ReservarForm
      dep={{ id: dep.id!, nombre: dep.nombre!, zona: dep.zona_nombre ?? "", direccion: dep.direccion ?? "" }}
      inicio={b.inicio!}
      fin={b.fin!}
      huespedes={huespedes}
      capacidad={dep.capacidad_max!}
      cotizacion={{ noches: cot.noches!, arriendo: Number(cot.monto_arriendo), anticipo: Number(cot.monto_anticipo) }}
      servicios={(servicios ?? []).map((s) => ({ ...s, precio: Number(s.precio) }))}
      politica={{ porcentajeAnticipo: Number(cfg.porcentaje_anticipo ?? 30), diasCancelacion: Number(cfg.dias_cancelacion_sin_costo ?? 7), checkin: String(cfg.hora_checkin ?? "15:00"), checkout: String(cfg.hora_checkout ?? "11:00") }}
    />
  );
}
