"use client";

import { useActionState, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FormMessage, InputField, SubmitButton, TextareaField } from "@/components/form/fields";
import { formatCLP, formatDate } from "@/lib/format";
import { crearReserva } from "../actions";

type Servicio = { id: number; nombre: string; tipo: string; descripcion: string | null; precio: number };
type Props = {
  dep: { id: number; nombre: string; zona: string; direccion: string };
  inicio: string;
  fin: string;
  huespedes: number;
  capacidad: number;
  cotizacion: { noches: number; arriendo: number; anticipo: number };
  servicios: Servicio[];
  politica: { porcentajeAnticipo: number; diasCancelacion: number; checkin: string; checkout: string };
};

const TIPO: Record<string, string> = { tour: "Tours", transporte: "Transporte", equipamiento: "Equipamiento", otro: "Otros" };

export function ReservarForm({ dep, inicio, fin, huespedes, capacidad, cotizacion, servicios, politica }: Props) {
  const [state, formAction] = useActionState(crearReserva, undefined);
  const [cantidades, setCantidades] = useState<Record<number, number>>({});
  const totalServicios = servicios.reduce((acc, s) => acc + (cantidades[s.id] ?? 0) * s.precio, 0);
  const total = cotizacion.arriendo + totalServicios;

  const grupos = servicios.reduce<Record<string, Servicio[]>>((acc, s) => ((acc[s.tipo] ??= []).push(s), acc), {});

  return (
    <form action={formAction} className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-3">
      <input type="hidden" name="departamento_id" value={dep.id} />
      <input type="hidden" name="inicio" value={inicio} />
      <input type="hidden" name="fin" value={fin} />

      <div className="flex flex-col gap-6 lg:col-span-2">
        <div>
          <h1 className="text-2xl font-semibold">Confirmar reserva</h1>
          <p className="text-sm text-muted-foreground">{dep.nombre} · {dep.zona} · {dep.direccion}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Estadía</CardTitle>
            <CardDescription>Check-in desde las {politica.checkin}, check-out hasta las {politica.checkout}.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1"><Label>Llegada</Label><p className="text-sm">{formatDate(inicio)}</p></div>
            <div className="flex flex-col gap-1"><Label>Salida</Label><p className="text-sm">{formatDate(fin)}</p></div>
            <InputField name="huespedes" label={`Huéspedes (máx. ${capacidad})`} type="number" min={1} max={capacidad} defaultValue={huespedes} state={state} />
          </CardContent>
        </Card>

        {Object.entries(grupos).map(([tipo, lista]) => (
          <Card key={tipo}>
            <CardHeader>
              <CardTitle>{TIPO[tipo] ?? tipo}</CardTitle>
              <CardDescription>Opcional. Puedes agregar servicios ahora o más adelante desde tu reserva.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {lista.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{s.nombre}</p>
                    {s.descripcion && <p className="truncate text-xs text-muted-foreground">{s.descripcion}</p>}
                    <p className="text-xs text-muted-foreground">{formatCLP(s.precio)} c/u</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`servicio_${s.id}`} className="sr-only">Cantidad</Label>
                    <Input
                      id={`servicio_${s.id}`}
                      name={`servicio_${s.id}`}
                      type="number"
                      min={0}
                      max={20}
                      defaultValue={0}
                      className="w-20"
                      onChange={(e) => setCantidades((c) => ({ ...c, [s.id]: Number(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardContent>
            <TextareaField name="notas" label="Comentarios para el equipo (opcional)" state={state} placeholder="Hora estimada de llegada, necesidades especiales..." />
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit lg:sticky lg:top-4">
        <CardHeader>
          <CardTitle>Resumen</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between"><span>{cotizacion.noches} noche(s)</span><span>{formatCLP(cotizacion.arriendo)}</span></div>
          <div className="flex justify-between"><span>Servicios extra</span><span>{formatCLP(totalServicios)}</span></div>
          <div className="flex justify-between border-t pt-2 font-semibold"><span>Total estadía</span><span>{formatCLP(total)}</span></div>
          <div className="flex justify-between rounded-lg bg-primary/10 p-2 font-medium">
            <span>Anticipo ({politica.porcentajeAnticipo}%)</span>
            <span>{formatCLP(cotizacion.anticipo)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            El anticipo confirma tu reserva y se paga en línea con Webpay. El saldo se cancela al momento del check-in.
            Puedes cancelar sin costo hasta {politica.diasCancelacion} días antes de la llegada.
          </p>
          <label className="flex items-start gap-2 text-xs">
            <input type="checkbox" name="acepta" className="mt-0.5 accent-primary" />
            <span>Acepto las políticas de reserva, cancelación y el tratamiento de mis datos personales (Ley 19.628).</span>
          </label>
          <FormMessage state={state} />
        </CardContent>
        <CardFooter>
          <SubmitButton className="w-full">Confirmar y continuar al pago</SubmitButton>
        </CardFooter>
      </Card>
    </form>
  );
}
