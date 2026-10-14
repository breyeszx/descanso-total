"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormMessage, InputField, SelectField, SubmitButton, TextareaField } from "@/components/form/fields";
import { hoyISO } from "@/lib/format";
import { cambiarEstadoMantencion, crearMantencion } from "../actions";

export function MantencionForm({ departamentos }: { departamentos: { id: number; codigo: string; nombre: string }[] }) {
  const [state, action] = useActionState(crearMantencion, undefined);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-3">
      <SelectField name="departamento_id" label="Departamento" state={state} options={[{ value: "", label: "Selecciona..." }, ...departamentos.map((d) => ({ value: String(d.id), label: `${d.codigo} · ${d.nombre}` }))]} required />
      <InputField name="titulo" label="Título" state={state} placeholder="Pintura, gasfitería..." required />
      <InputField name="responsable" label="Responsable / proveedor" state={state} />
      <InputField name="fecha_inicio" label="Inicio" type="date" min={hoyISO()} state={state} required />
      <InputField name="fecha_fin" label="Término" type="date" min={hoyISO()} state={state} required />
      <InputField name="costo" label="Costo estimado (CLP)" type="number" min={0} defaultValue={0} state={state} />
      <TextareaField name="descripcion" label="Descripción" state={state} className="sm:col-span-3" rows={2} />
      <div className="flex items-center gap-3 sm:col-span-3"><SubmitButton>Programar</SubmitButton><FormMessage state={state} /></div>
    </form>
  );
}

export function EstadoMantencion({ id, estado, costo }: { id: number; estado: string; costo: number }) {
  if (estado === "completada" || estado === "cancelada") return null;
  return (
    <div className="flex justify-end gap-1">
      {estado === "programada" && <Button size="sm" variant="outline" onClick={() => cambiarEstadoMantencion(id, "en_curso")}>Iniciar</Button>}
      <Button
        size="sm"
        onClick={() => {
          const v = prompt("Costo final de la mantención (CLP). Se registrará como egreso:", String(costo));
          if (v !== null) cambiarEstadoMantencion(id, "completada", Math.max(0, Number(v) || 0));
        }}
      >
        Completar
      </Button>
      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm("¿Cancelar esta mantención?")) cambiarEstadoMantencion(id, "cancelada"); }}>Cancelar</Button>
    </div>
  );
}
