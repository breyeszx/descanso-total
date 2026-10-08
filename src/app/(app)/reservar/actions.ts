"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { dbError, errorState, formToObject, zodError, type FormState } from "@/lib/form";
import { enviarPendientesSilencioso } from "@/app/(app)/pagos/actions";

const schema = z.object({
  departamento_id: z.coerce.number().int().positive(),
  inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha de llegada inválida"),
  fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha de salida inválida"),
  huespedes: z.coerce.number().int().min(1, "Mínimo 1 huésped"),
  notas: z.string().trim().max(500).optional(),
  acepta: z.literal("on", { error: "Debes aceptar las políticas de reserva" }),
});

export async function crearReserva(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = schema.safeParse(formToObject(formData));
  if (!parsed.success) return zodError(parsed.error, formData);

  // servicios: campos "servicio_<id>" con la cantidad
  const servicios: { servicio_id: number; cantidad: number }[] = [];
  for (const [k, v] of formData.entries()) {
    const m = k.match(/^servicio_(\d+)$/);
    if (m && Number(v) > 0) servicios.push({ servicio_id: Number(m[1]), cantidad: Number(v) });
  }

  const supabase = await createClient();
  const { data: id, error } = await supabase.rpc("crear_reserva", {
    p_departamento: parsed.data.departamento_id,
    p_inicio: parsed.data.inicio,
    p_fin: parsed.data.fin,
    p_huespedes: parsed.data.huespedes,
    p_servicios: servicios,
    p_notas: parsed.data.notas ?? undefined,
  });
  if (error) return errorState(dbError(error.message), formData);
  await enviarPendientesSilencioso();
  redirect(`/mis-reservas/${id}?nueva=1`);
}
