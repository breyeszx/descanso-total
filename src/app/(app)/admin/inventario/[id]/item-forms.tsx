"use client";

import { useActionState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage, InputField, SelectField, SubmitButton } from "@/components/form/fields";
import type { Tables } from "@/lib/supabase/database.types";
import { guardarItem, registrarMovimiento } from "../../departamentos/actions";

export function ItemForms({ item }: { item: Tables<"inventario_items"> }) {
  const [editState, editAction] = useActionState(guardarItem.bind(null, item.departamento_id, item.id), undefined);
  const [movState, movAction] = useActionState(registrarMovimiento.bind(null, item.id), undefined);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form action={movAction}>
        <Card>
          <CardHeader><CardTitle>Registrar movimiento</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            <SelectField
              name="tipo"
              label="Tipo"
              state={movState}
              options={[
                { value: "alta", label: "Alta (ingreso de unidades)" },
                { value: "baja", label: "Baja (retiro de unidades)" },
                { value: "deterioro", label: "Deterioro" },
                { value: "reparacion", label: "Reparación (registra egreso si tiene costo)" },
              ]}
            />
            <InputField name="cantidad" label="Cantidad" type="number" min={1} defaultValue={1} state={movState} />
            <InputField name="costo" label="Costo (CLP)" type="number" min={0} defaultValue={0} state={movState} />
            <InputField name="descripcion" label="Descripción" state={movState} placeholder="Motivo, proveedor, reserva asociada..." />
          </CardContent>
          <CardFooter className="mt-4 flex items-center justify-between">
            <FormMessage state={movState} />
            <SubmitButton>Registrar</SubmitButton>
          </CardFooter>
        </Card>
      </form>

      <form action={editAction}>
        <Card>
          <CardHeader><CardTitle>Datos del ítem</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            <InputField name="nombre" label="Nombre" state={editState} defaultValue={item.nombre} required />
            <InputField name="categoria" label="Categoría" state={editState} defaultValue={item.categoria ?? ""} />
            <InputField name="cantidad" label="Cantidad" type="number" min={0} state={editState} defaultValue={item.cantidad} />
            <InputField name="valor_unitario" label="Valor unitario (CLP)" type="number" min={0} state={editState} defaultValue={item.valor_unitario} />
            <InputField name="fecha_adquisicion" label="Fecha adquisición" type="date" state={editState} defaultValue={item.fecha_adquisicion ?? ""} />
            <InputField name="descripcion" label="Descripción" state={editState} defaultValue={item.descripcion ?? ""} />
          </CardContent>
          <CardFooter className="mt-4 flex items-center justify-between">
            <FormMessage state={editState} />
            <SubmitButton variant="outline">Guardar</SubmitButton>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
