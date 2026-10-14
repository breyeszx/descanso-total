"use client";

import { useActionState } from "react";
import { Switch } from "@/components/ui/switch";
import { FormMessage, InputField, SubmitButton } from "@/components/form/fields";
import { alternarActivo, guardarConductor, guardarVehiculo } from "../actions";

export function ActivoToggle({ tabla, id, activo }: { tabla: "vehiculos" | "conductores" | "servicios"; id: number; activo: boolean }) {
  return <Switch defaultChecked={activo} onCheckedChange={(v: boolean) => alternarActivo(tabla, id, v)} aria-label="Activo" />;
}

export function VehiculoForm() {
  const [state, action] = useActionState(guardarVehiculo, undefined);
  return (
    <form action={action} className="grid gap-2 rounded-lg border bg-muted/30 p-3 sm:grid-cols-4">
      <InputField name="patente" label="Patente" state={state} required />
      <InputField name="marca" label="Marca" state={state} />
      <InputField name="modelo" label="Modelo" state={state} />
      <InputField name="capacidad" label="Capacidad" type="number" min={1} defaultValue={4} state={state} />
      <div className="flex items-center gap-3 sm:col-span-4"><SubmitButton variant="outline">Agregar vehículo</SubmitButton><FormMessage state={state} /></div>
    </form>
  );
}

export function ConductorForm() {
  const [state, action] = useActionState(guardarConductor, undefined);
  return (
    <form action={action} className="grid gap-2 rounded-lg border bg-muted/30 p-3 sm:grid-cols-3">
      <InputField name="nombre" label="Nombre" state={state} required />
      <InputField name="telefono" label="Teléfono" type="tel" state={state} />
      <InputField name="licencia" label="Licencia" state={state} placeholder="A2, B..." />
      <div className="flex items-center gap-3 sm:col-span-3"><SubmitButton variant="outline">Agregar conductor</SubmitButton><FormMessage state={state} /></div>
    </form>
  );
}
