"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage, InputField, SelectField, SubmitButton, TextareaField } from "@/components/form/fields";
import { hoyISO } from "@/lib/format";
import { cancelarReservaAdmin, marcarNoShow, registrarPagoManual } from "../actions";

export function PagoManualForm({ reservaId, sugerido, conceptoSugerido }: { reservaId: number; sugerido: number; conceptoSugerido: "anticipo" | "saldo" }) {
  const [state, formAction] = useActionState(registrarPagoManual.bind(null, reservaId), undefined);
  return (
    <form action={formAction}>
      <Card>
        <CardHeader>
          <CardTitle>Registrar pago recibido</CardTitle>
          <CardDescription>Transferencias o efectivo recibidos fuera de Webpay. Un anticipo confirma la reserva automáticamente.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <SelectField
            name="concepto"
            label="Concepto"
            state={state}
            defaultValue={conceptoSugerido}
            options={[
              { value: "anticipo", label: "Anticipo" },
              { value: "saldo", label: "Saldo" },
              { value: "servicio_extra", label: "Servicio extra" },
              { value: "cargo", label: "Cargo / multa" },
              { value: "reembolso", label: "Reembolso (devolución)" },
            ]}
          />
          <SelectField
            name="medio"
            label="Medio"
            state={state}
            options={[
              { value: "transferencia", label: "Transferencia" },
              { value: "efectivo", label: "Efectivo" },
            ]}
          />
          <InputField name="monto" label="Monto (CLP)" type="number" min={1} defaultValue={sugerido} state={state} required />
          <InputField name="notas" label="Referencia / comentario" state={state} placeholder="N° de transferencia, quien recibió..." />
        </CardContent>
        <CardFooter className="mt-2 flex items-center justify-between">
          <FormMessage state={state} />
          <SubmitButton>Registrar</SubmitButton>
        </CardFooter>
      </Card>
    </form>
  );
}

export function AccionesReserva({ reservaId, fechaInicio }: { reservaId: number; fechaInicio: string }) {
  const [state, formAction] = useActionState(cancelarReservaAdmin.bind(null, reservaId), undefined);
  const llegadaPasada = fechaInicio <= hoyISO();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Acciones</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <form action={formAction} className="flex flex-col gap-2">
          <TextareaField name="motivo" label="Motivo de cancelación" state={state} rows={2} />
          <div className="flex items-center justify-between">
            <FormMessage state={state} />
            <SubmitButton variant="destructive">Cancelar reserva</SubmitButton>
          </div>
        </form>
        {llegadaPasada && (
          <Button variant="outline" onClick={() => { if (confirm("¿Marcar la reserva como no presentada (no show)?")) marcarNoShow(reservaId); }}>
            Marcar no show
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
