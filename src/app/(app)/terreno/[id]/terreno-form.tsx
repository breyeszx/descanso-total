"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage, InputField, SelectField, SubmitButton, TextareaField } from "@/components/form/fields";
import { EstadoBadge } from "@/components/estado-badge";
import { FirmaPad } from "../firma-pad";
import { formatCLP, formatDate } from "@/lib/format";
import { formatearRut } from "@/lib/rut";
import type { Database } from "@/lib/supabase/database.types";
import { agregarAcompananteTerreno, registrarCheckIn, registrarCheckOut } from "../actions";

type Reserva = Database["public"]["Views"]["vw_reservas"]["Row"];
type Item = { id: number; nombre: string; categoria: string | null; cantidad: number; valor_unitario: number };
type Props = {
  modo: "check_in" | "check_out";
  reserva: Reserva;
  acompanantes: { id: number; nombre: string; documento: string }[];
  items: Item[];
  estadoEntrada?: Record<number, string>;
};

export function TerrenoForm({ modo, reserva: r, acompanantes, items, estadoEntrada = {} }: Props) {
  const esIn = modo === "check_in";
  const accion = esIn ? registrarCheckIn : registrarCheckOut;
  const [state, formAction] = useActionState(accion.bind(null, r.id!), undefined);
  const [acState, acAction] = useActionState(agregarAcompananteTerreno.bind(null, r.id!), undefined);
  const [cargos, setCargos] = useState<Record<number, number>>({});
  const [multa, setMulta] = useState(0);
  const [cobro, setCobro] = useState<number>(Number(r.saldo_pendiente));

  const saldoBase = Number(r.saldo_pendiente);
  const totalCargos = useMemo(() => Object.values(cargos).reduce((a, b) => a + b, 0) + multa, [cargos, multa]);
  const saldoFinal = saldoBase + (esIn ? 0 : totalCargos);
  const faltan = Math.max(0, (r.num_huespedes ?? 1) - 1 - acompanantes.length);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/terreno" className="hover:underline">Terreno</Link> / {r.codigo}
          </p>
          <h1 className="text-2xl font-semibold">{esIn ? "Check-in" : "Check-out"} · {r.departamento_nombre}</h1>
          <p className="text-sm text-muted-foreground">
            {r.cliente_nombre} {r.cliente_apellido ?? ""} · {formatearRut(r.cliente_rut)} · {formatDate(r.fecha_inicio)} → {formatDate(r.fecha_fin)} · {r.num_huespedes} huésped(es)
          </p>
        </div>
        <EstadoBadge estado={r.estado!} className="text-sm" />
      </div>

      {esIn && (
        <Card>
          <CardHeader>
            <CardTitle>Huéspedes</CardTitle>
            <CardDescription>{faltan > 0 ? `Faltan ${faltan} acompañante(s) por registrar. Regístralos antes de entregar.` : "Todos los huéspedes están registrados."}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <p className="font-medium">{r.cliente_nombre} {r.cliente_apellido ?? ""} <span className="text-muted-foreground">(titular)</span></p>
            {acompanantes.map((a) => (
              <p key={a.id}>{a.nombre} <span className="text-muted-foreground">· {a.documento}</span></p>
            ))}
            {faltan > 0 && (
              <form action={acAction} className="grid gap-2 rounded-lg border bg-muted/30 p-3 sm:grid-cols-3">
                <InputField name="nombre" label="Nombre" state={acState} required />
                <InputField name="documento" label="RUT / pasaporte" state={acState} required />
                <div className="flex items-end gap-2">
                  <SubmitButton variant="outline">Agregar</SubmitButton>
                  <FormMessage state={acState} />
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      <form action={formAction} className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{esIn ? "Estado del departamento al entregar" : "Revisión de salida"}</CardTitle>
            <CardDescription>
              {esIn ? "Confirma el estado de cada ítem con el cliente." : "Marca daños o faltantes y el cargo a aplicar. El valor de reposición sugerido es el del inventario."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {items.length === 0 && <p className="text-sm text-muted-foreground">Este departamento no tiene inventario cargado.</p>}
            {items.map((i) => (
              <div key={i.id} className="grid items-center gap-2 rounded-lg border p-2 sm:grid-cols-[1fr_140px_1fr_120px]">
                <div>
                  <p className="text-sm font-medium">{i.nombre}</p>
                  <p className="text-xs text-muted-foreground">{i.categoria ?? "General"} · {i.cantidad} ud. · {formatCLP(i.valor_unitario)}{estadoEntrada[i.id] ? ` · Entrada: ${estadoEntrada[i.id]}` : ""}</p>
                </div>
                <select
                  name={`item_${i.id}_estado`}
                  defaultValue="bueno"
                  className="h-10 rounded-lg border border-input bg-background px-2 text-sm"
                  onChange={(e) => {
                    if (esIn) return;
                    const v = e.target.value;
                    setCargos((c) => ({ ...c, [i.id]: v === "bueno" ? 0 : c[i.id] || i.valor_unitario }));
                    const inp = e.target.form?.elements.namedItem(`item_${i.id}_cargo`) as HTMLInputElement | null;
                    if (inp) inp.value = v === "bueno" ? "0" : String(inp.value && inp.value !== "0" ? inp.value : i.valor_unitario);
                  }}
                >
                  <option value="bueno">Bueno</option>
                  <option value="danado">Dañado</option>
                  <option value="faltante">Faltante</option>
                </select>
                <Input name={`item_${i.id}_obs`} placeholder="Observación" className="h-10" />
                {!esIn ? (
                  <Input
                    name={`item_${i.id}_cargo`}
                    type="number"
                    min={0}
                    defaultValue={0}
                    className="h-10"
                    aria-label="Cargo"
                    onChange={(e) => setCargos((c) => ({ ...c, [i.id]: Number(e.target.value) || 0 }))}
                  />
                ) : (
                  <span />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {!esIn && (
          <Card>
            <CardHeader>
              <CardTitle>Multa adicional</CardTitle>
              <CardDescription>Ruido, salida tardía, limpieza extraordinaria u otros incumplimientos.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <InputField name="multa_descripcion" label="Detalle" state={state} />
              <InputField name="multa_monto" label="Monto (CLP)" type="number" min={0} defaultValue={0} state={state} onChange={(e) => setMulta(Number(e.target.value) || 0)} />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Liquidación y cobro</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between"><span>Total actual de la reserva</span><span>{formatCLP(r.monto_total)}</span></div>
            <div className="flex justify-between"><span>Pagado</span><span>{formatCLP(r.monto_pagado)}</span></div>
            {!esIn && totalCargos > 0 && <div className="flex justify-between text-destructive"><span>Cargos de esta revisión</span><span>{formatCLP(totalCargos)}</span></div>}
            <div className="flex justify-between font-semibold"><span>Saldo a cobrar</span><span>{formatCLP(saldoFinal)}</span></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cobro_monto">Monto cobrado ahora</Label>
                <Input id="cobro_monto" name="cobro_monto" type="number" min={0} value={cobro} onChange={(e) => setCobro(Number(e.target.value) || 0)} />
              </div>
              <SelectField name="cobro_medio" label="Medio de pago" state={state} options={[{ value: "efectivo", label: "Efectivo" }, { value: "transferencia", label: "Transferencia" }, { value: "webpay", label: "Webpay (POS / enlace)" }]} />
            </div>
            {saldoFinal - cobro > 0 && <p className="text-xs text-amber-700 dark:text-amber-400">Quedará un saldo pendiente de {formatCLP(saldoFinal - cobro)}.</p>}
            <Button type="button" variant="ghost" size="sm" className="w-fit" onClick={() => setCobro(saldoFinal)}>Cobrar saldo completo</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Observaciones y firma</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <TextareaField name="observaciones" label="Observaciones" state={state} rows={3} />
            <FirmaPad />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="conformidad" defaultChecked className="size-4 accent-primary" />
              {esIn ? "El cliente recibe el departamento conforme al estado descrito." : "El cliente firma en conformidad con la revisión y los cargos."}
            </label>
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <FormMessage state={state} />
            <SubmitButton className="min-w-48">{esIn ? "Entregar y emitir acta" : "Cerrar estadía y emitir acta"}</SubmitButton>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
