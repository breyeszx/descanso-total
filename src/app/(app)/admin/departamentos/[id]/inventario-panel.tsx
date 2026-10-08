"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FormMessage, InputField, SubmitButton } from "@/components/form/fields";
import { EstadoBadge } from "@/components/estado-badge";
import { formatCLP } from "@/lib/format";
import type { Tables } from "@/lib/supabase/database.types";
import { guardarItem } from "../actions";

export function InventarioPanel({ depId, items }: { depId: number; items: Tables<"inventario_items">[] }) {
  const [abierto, setAbierto] = useState(false);
  const [state, formAction] = useActionState(guardarItem.bind(null, depId, null), undefined);

  return (
    <div className="space-y-4">
      {items.length > 0 && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ítem</TableHead>
                <TableHead className="hidden sm:table-cell">Categoría</TableHead>
                <TableHead className="text-right">Cant.</TableHead>
                <TableHead className="hidden sm:table-cell text-right">Valor unit.</TableHead>
                <TableHead className="text-right">Valorizado</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>
                    <Link href={`/admin/inventario/${i.id}`} className="font-medium hover:underline">{i.nombre}</Link>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{i.categoria ?? "—"}</TableCell>
                  <TableCell className="text-right">{i.cantidad}</TableCell>
                  <TableCell className="hidden sm:table-cell text-right">{formatCLP(i.valor_unitario)}</TableCell>
                  <TableCell className="text-right">{formatCLP(i.cantidad * Number(i.valor_unitario))}</TableCell>
                  <TableCell><EstadoBadge estado={i.estado} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {abierto ? (
        <form action={formAction} className="grid gap-3 rounded-lg border bg-muted/30 p-4 sm:grid-cols-3">
          <InputField name="nombre" label="Nombre" state={state} required autoFocus />
          <InputField name="categoria" label="Categoría" state={state} placeholder="Mobiliario, Electro, Menaje" />
          <InputField name="fecha_adquisicion" label="Fecha adquisición" type="date" state={state} />
          <InputField name="cantidad" label="Cantidad" type="number" min={0} defaultValue={1} state={state} />
          <InputField name="valor_unitario" label="Valor unitario (CLP)" type="number" min={0} state={state} required />
          <InputField name="descripcion" label="Descripción" state={state} />
          <div className="flex items-center gap-2 sm:col-span-3">
            <SubmitButton>Agregar ítem</SubmitButton>
            <Button type="button" variant="ghost" onClick={() => setAbierto(false)}>Cancelar</Button>
            <FormMessage state={state} />
          </div>
        </form>
      ) : (
        <Button variant="outline" onClick={() => setAbierto(true)}>Agregar ítem</Button>
      )}
    </div>
  );
}
