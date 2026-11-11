"use client";

import { useActionState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { FormMessage, InputField, SelectField, SubmitButton, TextareaField } from "@/components/form/fields";
import type { Tables } from "@/lib/supabase/database.types";
import { guardarDepartamento } from "./actions";

type Props = { departamento?: Tables<"departamentos">; zonas: Pick<Tables<"zonas">, "id" | "nombre">[] };

export function DepartamentoForm({ departamento: d, zonas }: Props) {
  const [state, formAction] = useActionState(guardarDepartamento.bind(null, d?.id ?? null), undefined);
  return (
    <form action={formAction}>
      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <InputField name="codigo" label="Código" state={state} defaultValue={d?.codigo} placeholder="DT-11" required />
          <InputField name="nombre" label="Nombre" state={state} defaultValue={d?.nombre} required />
          <SelectField
            name="zona_id"
            label="Zona"
            state={state}
            defaultValue={d?.zona_id ?? ""}
            options={[{ value: "", label: "Selecciona una zona" }, ...zonas.map((z) => ({ value: String(z.id), label: z.nombre }))]}
            required
          />
          <InputField name="tarifa_base" label="Tarifa base por noche (CLP)" type="number" min={0} state={state} defaultValue={d?.tarifa_base} required />
          <InputField name="direccion" label="Dirección" state={state} defaultValue={d?.direccion} className="sm:col-span-2" required />
          <div className="grid grid-cols-3 gap-3 sm:col-span-2">
            <InputField name="capacidad_max" label="Capacidad" type="number" min={1} state={state} defaultValue={d?.capacidad_max ?? 2} />
            <InputField name="dormitorios" label="Dormitorios" type="number" min={0} state={state} defaultValue={d?.dormitorios ?? 1} />
            <InputField name="banos" label="Baños" type="number" min={0} state={state} defaultValue={d?.banos ?? 1} />
          </div>
          <TextareaField name="descripcion" label="Descripción" state={state} defaultValue={d?.descripcion ?? ""} className="sm:col-span-2" />
          <InputField
            name="amenidades"
            label="Amenidades (separadas por coma)"
            state={state}
            defaultValue={d?.amenidades?.join(", ") ?? ""}
            placeholder="wifi, estacionamiento, piscina"
            className="sm:col-span-2"
          />
          <div className="flex items-center gap-2 sm:col-span-2">
            <input id="activo" name="activo" type="checkbox" defaultChecked={d?.activo ?? true} className="size-4 accent-primary" />
            <Label htmlFor="activo">Departamento activo (visible en el portal)</Label>
          </div>
        </CardContent>
        <CardFooter className="mt-4 flex items-center justify-between">
          <FormMessage state={state} />
          <SubmitButton>{d ? "Guardar cambios" : "Crear departamento"}</SubmitButton>
        </CardFooter>
      </Card>
    </form>
  );
}
