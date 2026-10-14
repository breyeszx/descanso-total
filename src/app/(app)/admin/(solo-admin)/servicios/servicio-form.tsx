"use client";

import { useActionState } from "react";
import { Label } from "@/components/ui/label";
import { FormMessage, InputField, SelectField, SubmitButton, TextareaField } from "@/components/form/fields";
import type { Tables } from "@/lib/supabase/database.types";
import { guardarServicio } from "../actions";

export function ServicioForm({ servicio: s }: { servicio?: Tables<"servicios"> }) {
  const [state, action] = useActionState(guardarServicio, undefined);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-3">
      {s && <input type="hidden" name="id" value={s.id} />}
      <InputField name="nombre" label="Nombre" state={state} defaultValue={s?.nombre} required />
      <SelectField name="tipo" label="Tipo" state={state} defaultValue={s?.tipo ?? "tour"} options={[{ value: "tour", label: "Tour" }, { value: "transporte", label: "Transporte" }, { value: "equipamiento", label: "Equipamiento" }, { value: "otro", label: "Otro" }]} />
      <InputField name="precio" label="Precio (CLP)" type="number" min={0} state={state} defaultValue={s?.precio} required />
      <InputField name="duracion_horas" label="Duración (horas)" type="number" min={0} step={0.5} state={state} defaultValue={s?.duracion_horas ?? ""} />
      <InputField name="cupo_max" label="Cupo máximo" type="number" min={1} state={state} defaultValue={s?.cupo_max ?? ""} />
      <div className="flex items-center gap-2 self-end pb-2">
        <input id="requiere_transporte" name="requiere_transporte" type="checkbox" defaultChecked={s?.requiere_transporte ?? false} className="size-4 accent-primary" />
        <Label htmlFor="requiere_transporte">Requiere traslado</Label>
      </div>
      <TextareaField name="descripcion" label="Descripción" state={state} defaultValue={s?.descripcion ?? ""} className="sm:col-span-3" />
      <div className="flex items-center gap-3 sm:col-span-3"><SubmitButton>{s ? "Guardar cambios" : "Crear servicio"}</SubmitButton><FormMessage state={state} /></div>
    </form>
  );
}
