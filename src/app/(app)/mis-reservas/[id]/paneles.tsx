"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage, InputField, SubmitButton, TextareaField } from "@/components/form/fields";
import { formatDate, hoyISO } from "@/lib/format";
import type { Tables } from "@/lib/supabase/database.types";
import { agregarAcompanante, cancelarReserva, eliminarAcompanante, modificarReserva } from "../actions";

export function AcompanantesPanel({ reservaId, acompanantes, editable }: { reservaId: number; acompanantes: Tables<"acompanantes">[]; editable: boolean }) {
  const [state, formAction] = useActionState(agregarAcompanante.bind(null, reservaId), undefined);
  return (
    <div className="flex flex-col gap-4">
      {acompanantes.length > 0 ? (
        <ul className="divide-y text-sm">
          {acompanantes.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span className="font-medium">{a.nombre}</span>
              <span className="text-muted-foreground">{a.documento}</span>
              <span className="text-muted-foreground">{a.fecha_nacimiento ? formatDate(a.fecha_nacimiento) : ""}</span>
              {editable && (
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => eliminarAcompanante(a.id, reservaId)}>Quitar</Button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Sin acompañantes registrados.</p>
      )}
      {editable && (
        <form action={formAction} className="grid gap-3 rounded-lg border bg-muted/30 p-4 sm:grid-cols-4">
          <InputField name="nombre" label="Nombre completo" state={state} required />
          <InputField name="documento" label="RUT o pasaporte" state={state} required />
          <InputField name="fecha_nacimiento" label="Fecha de nacimiento" type="date" state={state} />
          <InputField name="telefono" label="Teléfono" type="tel" state={state} />
          <div className="flex items-center gap-3 sm:col-span-4">
            <SubmitButton variant="outline">Agregar acompañante</SubmitButton>
            <FormMessage state={state} />
          </div>
        </form>
      )}
    </div>
  );
}

type ModProps = { reservaId: number; inicio: string; fin: string; huespedes: number; capacidad: number; diasCancelacion: number; diasParaLlegada: number };

export function ModificarPanel({ reservaId, inicio, fin, huespedes, capacidad, diasCancelacion, diasParaLlegada }: ModProps) {
  const [state, formAction] = useActionState(modificarReserva.bind(null, reservaId), undefined);
  const permitido = diasParaLlegada >= diasCancelacion;
  return (
    <form action={formAction}>
      <Card>
        <CardHeader>
          <CardTitle>Reprogramar</CardTitle>
          <CardDescription>
            {permitido
              ? `Puedes cambiar las fechas hasta ${diasCancelacion} días antes de la llegada. El valor se recalcula según la temporada.`
              : `Ya no es posible reprogramar: faltan menos de ${diasCancelacion} días para la llegada. Contáctanos si necesitas ayuda.`}
          </CardDescription>
        </CardHeader>
        {permitido && (
          <>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <InputField name="inicio" label="Llegada" type="date" min={hoyISO()} defaultValue={inicio} state={state} required />
              <InputField name="fin" label="Salida" type="date" min={hoyISO()} defaultValue={fin} state={state} required />
              <InputField name="huespedes" label={`Huéspedes (máx. ${capacidad})`} type="number" min={1} max={capacidad} defaultValue={huespedes} state={state} />
            </CardContent>
            <CardFooter className="mt-2 flex items-center justify-between">
              <FormMessage state={state} />
              <SubmitButton variant="outline">Guardar fechas</SubmitButton>
            </CardFooter>
          </>
        )}
      </Card>
    </form>
  );
}

export function CancelarPanel({ reservaId, pagado, diasCancelacion, diasParaLlegada }: { reservaId: number; pagado: number; diasCancelacion: number; diasParaLlegada: number }) {
  const [state, formAction] = useActionState(cancelarReserva.bind(null, reservaId), undefined);
  const [abierto, setAbierto] = useState(false);
  const conMulta = pagado > 0 && diasParaLlegada < diasCancelacion;
  return (
    <form action={formAction}>
      <Card>
        <CardHeader>
          <CardTitle>Cancelar reserva</CardTitle>
          <CardDescription>
            {conMulta
              ? `Faltan menos de ${diasCancelacion} días para la llegada: el anticipo pagado se retiene como multa según la política.`
              : `Sin costo si cancelas con al menos ${diasCancelacion} días de anticipación.`}
          </CardDescription>
        </CardHeader>
        {abierto ? (
          <>
            <CardContent className="flex flex-col gap-3">
              <TextareaField name="motivo" label="Motivo (opcional)" state={state} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="confirmar" className="accent-primary" /> Entiendo y deseo cancelar esta reserva
              </label>
            </CardContent>
            <CardFooter className="mt-2 flex items-center justify-between">
              <FormMessage state={state} />
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => setAbierto(false)}>Volver</Button>
                <SubmitButton variant="destructive">Cancelar reserva</SubmitButton>
              </div>
            </CardFooter>
          </>
        ) : (
          <CardFooter>
            <Button type="button" variant="outline" onClick={() => setAbierto(true)}>Quiero cancelar</Button>
          </CardFooter>
        )}
      </Card>
    </form>
  );
}
