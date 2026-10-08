"use client";

import { useActionState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { FormMessage, InputField, SubmitButton, TextareaField } from "@/components/form/fields";
import type { Tables } from "@/lib/supabase/database.types";
import { guardarCliente } from "./actions";

export function ClienteForm({ cliente }: { cliente?: Tables<"clientes"> }) {
  const action = guardarCliente.bind(null, cliente?.id ?? null);
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction}>
      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <InputField name="nombre" label="Nombre" state={state} defaultValue={cliente?.nombre} required />
          <InputField name="apellido" label="Apellido" state={state} defaultValue={cliente?.apellido ?? ""} />
          <InputField name="rut" label="RUT" state={state} defaultValue={cliente?.rut ?? ""} placeholder="12345678-9" />
          <InputField name="email" label="Correo electrónico" type="email" state={state} defaultValue={cliente?.email} required />
          <InputField name="telefono" label="Teléfono" type="tel" state={state} defaultValue={cliente?.telefono ?? ""} placeholder="+56 9 1234 5678" />
          <InputField name="pais" label="País" state={state} defaultValue={cliente?.pais ?? "Chile"} />
          <InputField name="direccion" label="Dirección" state={state} defaultValue={cliente?.direccion ?? ""} className="sm:col-span-2" />
          <TextareaField name="notas" label="Notas internas" state={state} defaultValue={cliente?.notas ?? ""} className="sm:col-span-2" />
        </CardContent>
        <CardFooter className="mt-4 flex items-center justify-between">
          <FormMessage state={state} />
          <SubmitButton>{cliente ? "Guardar cambios" : "Crear cliente"}</SubmitButton>
        </CardFooter>
      </Card>
    </form>
  );
}
