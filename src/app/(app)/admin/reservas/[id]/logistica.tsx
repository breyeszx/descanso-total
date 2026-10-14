"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage, InputField, SelectField, SubmitButton } from "@/components/form/fields";
import { EstadoBadge } from "@/components/estado-badge";
import { formatCLP, formatDateTime } from "@/lib/format";
import { agregarServicioReserva, cambiarEstadoTransporte, programarTransporte } from "../actions";

type Transporte = { id: number; tipo: string; fecha_hora: string; origen: string | null; destino: string | null; pasajeros: number; estado: string; vehiculos: { patente: string } | null; conductores: { nombre: string; telefono: string | null } | null };
type Props = {
  reservaId: number;
  editable: boolean;
  transportes: Transporte[];
  vehiculos: { id: number; patente: string; capacidad: number }[];
  conductores: { id: number; nombre: string }[];
  servicios: { id: number; nombre: string; tipo: string; precio: number }[];
};

const TIPO: Record<string, string> = { llegada: "Llegada", salida: "Salida", tour: "Tour" };

export function LogisticaPanel({ reservaId, editable, transportes, vehiculos, conductores, servicios }: Props) {
  const [tState, tAction] = useActionState(programarTransporte.bind(null, reservaId), undefined);
  const [sState, sAction] = useActionState(agregarServicioReserva.bind(null, reservaId), undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transporte y servicios</CardTitle>
        <CardDescription>Los traslados se incluyen en el correo de coordinación 48 h antes de la llegada.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {transportes.length ? (
          <ul className="divide-y text-sm">
            {transportes.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="font-medium">{TIPO[t.tipo] ?? t.tipo} · {formatDateTime(t.fecha_hora)}</span>
                <span className="text-muted-foreground">{[t.origen, t.destino].filter(Boolean).join(" → ") || "Sin ruta"} · {t.pasajeros} pax</span>
                <span className="text-muted-foreground">{t.vehiculos?.patente ?? "Sin vehículo"} · {t.conductores?.nombre ?? "Sin conductor"}</span>
                <EstadoBadge estado={t.estado === "programado" ? "programada" : t.estado === "completado" ? "completada" : t.estado === "cancelado" ? "cancelada" : t.estado} />
                {editable && t.estado === "programado" && (
                  <span className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => cambiarEstadoTransporte(t.id, reservaId, "completado")}>Completado</Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => cambiarEstadoTransporte(t.id, reservaId, "cancelado")}>Cancelar</Button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Sin traslados programados.</p>
        )}

        {editable && (
          <>
            <form action={tAction} className="grid gap-2 rounded-lg border bg-muted/30 p-3 sm:grid-cols-3">
              <SelectField name="tipo" label="Traslado" state={tState} options={[{ value: "llegada", label: "Llegada" }, { value: "salida", label: "Salida" }, { value: "tour", label: "Tour" }]} />
              <InputField name="fecha_hora" label="Fecha y hora" type="datetime-local" state={tState} required />
              <InputField name="pasajeros" label="Pasajeros" type="number" min={1} defaultValue={1} state={tState} />
              <InputField name="origen" label="Origen" state={tState} placeholder="Aeropuerto, terminal..." />
              <InputField name="destino" label="Destino" state={tState} placeholder="Departamento, tour..." />
              <SelectField name="vehiculo_id" label="Vehículo" state={tState} options={[{ value: "", label: "Por asignar" }, ...vehiculos.map((v) => ({ value: String(v.id), label: `${v.patente} (${v.capacidad})` }))]} />
              <SelectField name="conductor_id" label="Conductor" state={tState} options={[{ value: "", label: "Por asignar" }, ...conductores.map((c) => ({ value: String(c.id), label: c.nombre }))]} />
              <div className="flex items-end gap-3 sm:col-span-2"><SubmitButton variant="outline">Programar traslado</SubmitButton><FormMessage state={tState} /></div>
            </form>

            <form action={sAction} className="grid gap-2 rounded-lg border bg-muted/30 p-3 sm:grid-cols-3">
              <SelectField name="servicio_id" label="Vender servicio / tour" state={sState} options={servicios.map((s) => ({ value: String(s.id), label: `${s.nombre} · ${formatCLP(s.precio)}` }))} />
              <InputField name="cantidad" label="Cantidad" type="number" min={1} defaultValue={1} state={sState} />
              <div className="flex items-end gap-3"><SubmitButton variant="outline">Agregar a la reserva</SubmitButton><FormMessage state={sState} /></div>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  );
}
