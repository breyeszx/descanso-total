"use client";

import { useActionState } from "react";
import { FormMessage, InputField, SelectField, SubmitButton } from "@/components/form/fields";
import { hoyISO } from "@/lib/format";
import { registrarMovimiento } from "../actions";

const CATEGORIAS = ["arriendo", "servicio_extra", "cargo", "reembolso", "reparacion", "mantencion", "dividendo", "contribucion", "transporte", "otro"];

export function MovimientoForm({ departamentos }: { departamentos: { id: number; codigo: string; nombre: string }[] }) {
  const [state, action] = useActionState(registrarMovimiento, undefined);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <SelectField name="tipo" label="Tipo" state={state} defaultValue="egreso" options={[{ value: "ingreso", label: "Ingreso" }, { value: "egreso", label: "Egreso" }]} />
      <SelectField name="categoria" label="Categoría" state={state} defaultValue="otro" options={CATEGORIAS.map((c) => ({ value: c, label: c.replace("_", " ") }))} />
      <InputField name="monto" label="Monto (CLP)" type="number" min={1} state={state} required />
      <InputField name="fecha" label="Fecha" type="date" defaultValue={hoyISO()} state={state} required />
      <SelectField name="departamento_id" label="Departamento" state={state} options={[{ value: "", label: "General" }, ...departamentos.map((d) => ({ value: String(d.id), label: `${d.codigo} ${d.nombre}` }))]} />
      <InputField name="descripcion" label="Descripción" state={state} />
      <div className="flex items-center gap-3 sm:col-span-3 lg:col-span-6"><SubmitButton>Registrar</SubmitButton><FormMessage state={state} /></div>
    </form>
  );
}
