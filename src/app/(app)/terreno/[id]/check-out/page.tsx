import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TerrenoForm } from "../terreno-form";

export const metadata = { title: "Check-out" };

export default async function CheckOutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reservaId = Number(id);
  const supabase = await createClient();
  const [{ data: r }, { data: acomp }, { data: actaIn }] = await Promise.all([
    supabase.from("vw_reservas").select("*").eq("id", reservaId).single(),
    supabase.from("acompanantes").select("id, nombre, documento").eq("reserva_id", reservaId).order("id"),
    supabase.from("actas").select("checklist").eq("reserva_id", reservaId).eq("tipo", "check_in").maybeSingle(),
  ]);
  if (!r) notFound();
  if (r.estado !== "en_curso") {
    return (
      <div className="mx-auto max-w-lg rounded-xl border bg-background p-8 text-center">
        <p>Esta reserva está <strong>{r.estado}</strong>. El check-out requiere una estadía en curso.</p>
        <Link href="/terreno" className="mt-3 inline-block text-sm underline">Volver a terreno</Link>
      </div>
    );
  }
  const { data: items } = await supabase.from("inventario_items").select("id, nombre, categoria, cantidad, valor_unitario").eq("departamento_id", r.departamento_id!).neq("estado", "baja").order("categoria").order("nombre");
  const checklistIn = (actaIn?.checklist as { item_id: number | null; estado: string; observacion?: string }[] | null) ?? [];

  return (
    <TerrenoForm
      modo="check_out"
      reserva={r}
      acompanantes={acomp ?? []}
      items={(items ?? []).map((i) => ({ ...i, valor_unitario: Number(i.valor_unitario) }))}
      estadoEntrada={Object.fromEntries(checklistIn.filter((c) => c.item_id).map((c) => [c.item_id!, c.estado + (c.observacion ? ` – ${c.observacion}` : "")]))}
    />
  );
}
