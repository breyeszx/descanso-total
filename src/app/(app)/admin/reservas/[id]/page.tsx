import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EstadoBadge } from "@/components/estado-badge";
import { formatCLP, formatDate, formatDateTime } from "@/lib/format";
import { formatearRut } from "@/lib/rut";
import { PagoManualForm, AccionesReserva } from "./paneles";

export const metadata = { title: "Reserva" };

export default async function ReservaAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reservaId = Number(id);
  const supabase = await createClient();
  const [{ data: r }, { data: acomp }, { data: servicios }, { data: pagos }, { data: cargos }, { data: notifs }] = await Promise.all([
    supabase.from("vw_reservas").select("*").eq("id", reservaId).single(),
    supabase.from("acompanantes").select("*").eq("reserva_id", reservaId).order("id"),
    supabase.from("reserva_servicios").select("id, cantidad, subtotal, estado, servicios(nombre)").eq("reserva_id", reservaId),
    supabase.from("pagos").select("*").eq("reserva_id", reservaId).order("id"),
    supabase.from("reserva_cargos").select("id, tipo, descripcion, monto").eq("reserva_id", reservaId),
    supabase.from("notificaciones").select("id, tipo, estado, programada_para, enviada_at, error").eq("reserva_id", reservaId).order("id"),
  ]);
  if (!r) notFound();
  const activa = r.estado === "pendiente_pago" || r.estado === "confirmada";
  const anticipoPendiente = Math.max(0, Number(r.monto_anticipo) - Number(r.monto_pagado));

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/admin/reservas" className="hover:underline">Reservas</Link> / {r.codigo}
          </p>
          <h1 className="text-2xl font-semibold">{r.departamento_nombre} · {formatDate(r.fecha_inicio)} → {formatDate(r.fecha_fin)}</h1>
          <p className="text-sm text-muted-foreground">
            <Link href={`/admin/clientes/${r.cliente_id}`} className="hover:underline">{r.cliente_nombre} {r.cliente_apellido ?? ""}</Link>
            {" · "}{formatearRut(r.cliente_rut)} · {r.cliente_email}{r.cliente_telefono ? ` · ${r.cliente_telefono}` : ""} · Origen {r.origen}
          </p>
        </div>
        <EstadoBadge estado={r.estado!} className="text-sm" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Detalle económico</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between"><span>Arriendo ({r.noches} noches × {formatCLP(r.tarifa_noche_aplicada)})</span><span>{formatCLP(r.monto_arriendo)}</span></div>
              {servicios?.map((s) => (
                <div key={s.id} className="flex justify-between text-muted-foreground"><span>{s.servicios?.nombre} × {s.cantidad}</span><span>{formatCLP(s.subtotal)}</span></div>
              ))}
              {cargos?.map((c) => (
                <div key={c.id} className="flex justify-between text-destructive"><span>{c.descripcion}</span><span>{formatCLP(c.monto)}</span></div>
              ))}
              <div className="flex justify-between border-t pt-2 font-semibold"><span>Total</span><span>{formatCLP(r.monto_total)}</span></div>
              <div className="flex justify-between"><span>Anticipo requerido</span><span>{formatCLP(r.monto_anticipo)}</span></div>
              <div className="flex justify-between"><span>Pagado</span><span>{formatCLP(r.monto_pagado)}</span></div>
              <div className="flex justify-between font-medium"><span>Saldo pendiente</span><span>{formatCLP(r.saldo_pendiente)}</span></div>
              {r.notas && <p className="pt-2 text-xs text-muted-foreground">Comentarios del cliente: {r.notas}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Pagos</CardTitle></CardHeader>
            <CardContent>
              {pagos?.length ? (
                <ul className="divide-y text-sm">
                  {pagos.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <span className="capitalize">{p.concepto.replace("_", " ")} · {p.medio}</span>
                      <span>{formatCLP(p.monto)}</span>
                      <span className="text-xs text-muted-foreground">{p.webpay_authorization_code ? `Aut. ${p.webpay_authorization_code} · ` : ""}{formatDateTime(p.pagado_at ?? p.created_at)}</span>
                      <EstadoBadge estado={p.estado} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Sin pagos registrados.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Huéspedes ({1 + (acomp?.length ?? 0)} de {r.num_huespedes})</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="font-medium">{r.cliente_nombre} {r.cliente_apellido ?? ""} <span className="text-muted-foreground">(titular)</span></p>
              {acomp?.map((a) => (
                <p key={a.id}>{a.nombre} <span className="text-muted-foreground">· {a.documento}{a.telefono ? ` · ${a.telefono}` : ""}</span></p>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notificaciones</CardTitle>
              <CardDescription>Correos generados para esta reserva.</CardDescription>
            </CardHeader>
            <CardContent>
              {notifs?.length ? (
                <ul className="divide-y text-sm">
                  {notifs.map((n) => (
                    <li key={n.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <span>{n.tipo.replace(/_/g, " ")}</span>
                      <span className="text-xs text-muted-foreground">{n.enviada_at ? formatDateTime(n.enviada_at) : formatDateTime(n.programada_para)}</span>
                      <EstadoBadge estado={n.estado === "enviada" ? "aprobado" : n.estado === "fallida" ? "rechazado" : "pendiente"} />
                      {n.error && <span className="w-full text-xs text-destructive">{n.error}</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Sin notificaciones.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          {(activa || r.estado === "en_curso") && Number(r.saldo_pendiente) > 0 && (
            <PagoManualForm reservaId={reservaId} sugerido={r.estado === "pendiente_pago" ? anticipoPendiente : Number(r.saldo_pendiente)} conceptoSugerido={r.estado === "pendiente_pago" ? "anticipo" : "saldo"} />
          )}
          {activa && <AccionesReserva reservaId={reservaId} fechaInicio={r.fecha_inicio!} />}
        </div>
      </div>
    </div>
  );
}
