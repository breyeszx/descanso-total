"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormMessage, SubmitButton } from "@/components/form/fields";
import { formatCLP } from "@/lib/format";
import { iniciarPagoWebpay } from "@/app/(app)/pagos/actions";

type Props = { reservaId: number; estado: string; anticipoPendiente: number; saldo: number; resultado?: string };

const MENSAJES: Record<string, { texto: string; ok: boolean }> = {
  ok: { texto: "Pago aprobado. Te enviamos el comprobante por correo.", ok: true },
  rechazado: { texto: "El pago fue rechazado por Transbank. Puedes intentarlo nuevamente.", ok: false },
  anulado: { texto: "Cancelaste el pago en Webpay. Tu reserva sigue pendiente.", ok: false },
  error: { texto: "Ocurrió un error al confirmar el pago. Si se cobró, contáctanos con tu código de reserva.", ok: false },
};

export function PagoPanel({ reservaId, estado, anticipoPendiente, saldo, resultado }: Props) {
  const concepto = estado === "pendiente_pago" ? "anticipo" : "saldo";
  const monto = concepto === "anticipo" ? anticipoPendiente : saldo;
  const [state, formAction] = useActionState(async () => iniciarPagoWebpay(reservaId, concepto), undefined);
  const msg = resultado ? MENSAJES[resultado] : undefined;
  const puedePagar = (concepto === "anticipo" || estado === "confirmada" || estado === "en_curso") && monto > 0;

  return (
    <div className="flex flex-col gap-3 text-sm">
      {msg && (
        <p className={msg.ok ? "rounded-lg bg-green-100 p-2 text-green-800 dark:bg-green-900/30 dark:text-green-200" : "rounded-lg bg-destructive/10 p-2 text-destructive"} role="status">
          {msg.texto}
        </p>
      )}
      {puedePagar ? (
        <form action={formAction} className="flex flex-col gap-2">
          <p>
            {concepto === "anticipo" ? "Anticipo para confirmar" : "Saldo pendiente"}: <strong>{formatCLP(monto)}</strong>
          </p>
          <SubmitButton className="w-full">Pagar con Webpay</SubmitButton>
          <FormMessage state={state} />
          <p className="text-xs text-muted-foreground">Pago seguro con tarjetas de crédito, débito y prepago a través de Transbank.</p>
        </form>
      ) : (
        <p className="text-muted-foreground">{monto <= 0 ? "No tienes pagos pendientes." : "El pago en línea no está disponible para esta reserva."}</p>
      )}
      {concepto === "saldo" && monto > 0 && (
        <Button variant="ghost" size="sm" disabled className="justify-start px-0 text-xs text-muted-foreground">
          También puedes pagar el saldo en el check-in.
        </Button>
      )}
    </div>
  );
}
