import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EstadoBadge } from "@/components/estado-badge";
import { formatCLP, formatDate, formatDateTime, hoyISO } from "@/lib/format";
import { AcompanantesPanel, CancelarPanel, ModificarPanel } from "./paneles";

export const metadata = { title: "Detalle de reserva" };

export default async function ReservaPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ nueva?: string }> }) {
  const [{ id }, { nueva }] = await Promise.all([params, searchParams]);
  await requirePerfil(["cliente"]);
  const reservaId = Number(id);
  const supabase = await createClient();
  const [{ data: r }, { data: acomp }, { data: servicios }, { data: pagos }, { data: cargos }, { data: config }] = await Promise.all([
    supabase.from("reservas").select("*, departamentos(nombre, direccion, capacidad_max, zonas(nombre))").eq("id", reservaId).single(),
    supabase.from("acompanantes").select("*").eq("reserva_id", reservaId).order("id"),
    supabase.from("reserva_servicios").select("id, cantidad, precio_unitario, subtotal, estado, servicios(nombre)").eq("reserva_id", reservaId),
    supabase.from("pagos").select("id, concepto, medio, monto, estado, pagado_at").eq("reserva_id", reservaId).order("id"),
    supabase.from("reserva_cargos").select("id, tipo, descripcion, monto").eq("reserva_id", reservaId),
    supabase.from("configuracion").select("clave, valor").in("clave", ["dias_cancelacion_sin_costo", "hora_checkin", "hora_checkout"]),
  ]);
  if (!r) notFound();
  const cfg = Object.fromEntries((config ?? []).map((c) => [c.clave, c.valor as string | number]));
  const diasCancelacion = Number(cfg.dias_cancelacion_sin_costo ?? 7);
  const activa = r.estado === "pendiente_pago" || r.estado === "confirmada";
  const diasParaLlegada = Math.round((new Date(r.fecha_inicio).getTime() - new Date(hoyISO()).getTime()) / 86400000);
  const faltanAcomp = Math.max(0, r.num_huespedes - 1 - (acomp?.length ?? 0));

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      {nueva && r.estado === "pendiente_pago" && (
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm">
          <p className="font-medium">¡Recibimos tu reserva {r.codigo}!</p>
          <p>Para confirmarla paga el anticipo de {formatCLP(r.monto_anticipo)}. Te enviamos un correo con el detalle.</p>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/mis-reservas" className="hover:underline">Mis reservas</Link> / {r.codigo}
          </p>
          <h1 className="text-2xl font-semibold">{r.departamentos?.nombre}</h1>
          <p className="text-sm text-muted-foreground">{r.departamentos?.zonas?.nombre} · {r.departamentos?.direccion}</p>
        </div>
        <EstadoBadge estado={r.estado} className="text-sm" />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Estadía</CardTitle>
            <CardDescription>
              {formatDate(r.fecha_inicio)} (desde {String(cfg.hora_checkin ?? "15:00")}) → {formatDate(r.fecha_fin)} (hasta {String(cfg.hora_checkout ?? "11:00")}) · {r.noches} noche(s) · {r.num_huespedes} huésped(es)
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between"><span>Arriendo ({r.noches} × {formatCLP(r.tarifa_noche_aplicada)})</span><span>{formatCLP(r.monto_arriendo)}</span></div>
            {servicios?.map((s) => (
              <div key={s.id} className="flex justify-between text-muted-foreground">
                <span>{s.servicios?.nombre} × {s.cantidad}</span><span>{formatCLP(s.subtotal)}</span>
              </div>
            ))}
            {cargos?.map((c) => (
              <div key={c.id} className="flex justify-between text-destructive">
                <span>{c.descripcion}</span><span>{formatCLP(c.monto)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t pt-2 font-semibold"><span>Total</span><span>{formatCLP(r.monto_total)}</span></div>
            <div className="flex justify-between"><span>Pagado</span><span>{formatCLP(r.monto_pagado)}</span></div>
            <div className="flex justify-between font-medium"><span>Saldo pendiente</span><span>{formatCLP(r.saldo_pendiente)}</span></div>
            {r.notas && <p className="pt-2 text-xs text-muted-foreground">Comentarios: {r.notas}</p>}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Pago</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            {r.estado === "pendiente_pago" ? (
              <>
                <p>Anticipo requerido: <strong>{formatCLP(r.monto_anticipo)}</strong></p>
                <Button disabled className="w-full">Pagar con Webpay (próximamente)</Button>
                <p className="text-xs text-muted-foreground">El pago en línea se habilita en la siguiente fase. Mientras tanto, el equipo puede registrar tu anticipo por transferencia.</p>
              </>
            ) : (
              <p className="text-muted-foreground">{pagos?.length ? "Historial de pagos:" : "Sin pagos registrados."}</p>
            )}
            {pagos?.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border px-2 py-1.5 text-xs">
                <span className="capitalize">{p.concepto.replace("_", " ")} · {p.medio}</span>
                <span>{formatCLP(p.monto)}</span>
                <EstadoBadge estado={p.estado} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Acompañantes</CardTitle>
          <CardDescription>
            Registra a todas las personas que se alojarán antes del check-in.
            {faltanAcomp > 0 && activa ? ` Faltan ${faltanAcomp}.` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AcompanantesPanel reservaId={reservaId} acompanantes={acomp ?? []} editable={activa} />
        </CardContent>
      </Card>

      {activa && (
        <div className="grid gap-6 md:grid-cols-2">
          <ModificarPanel reservaId={reservaId} inicio={r.fecha_inicio} fin={r.fecha_fin} huespedes={r.num_huespedes} capacidad={r.departamentos?.capacidad_max ?? 1} diasCancelacion={diasCancelacion} diasParaLlegada={diasParaLlegada} />
          <CancelarPanel reservaId={reservaId} pagado={Number(r.monto_pagado)} diasCancelacion={diasCancelacion} diasParaLlegada={diasParaLlegada} />
        </div>
      )}

      {r.estado === "cancelada" && (
        <p className="text-sm text-muted-foreground">
          Cancelada el {formatDateTime(r.cancelada_at)}{r.motivo_cancelacion ? ` · Motivo: ${r.motivo_cancelacion}` : ""}.
        </p>
      )}
    </div>
  );
}
