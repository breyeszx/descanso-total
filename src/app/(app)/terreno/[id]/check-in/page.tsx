import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TerrenoForm } from "../terreno-form";

export const metadata = { title: "Check-in" };

export default async function CheckInPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reservaId = Number(id);
  const supabase = await createClient();
  const [{ data: r }, { data: acomp }] = await Promise.all([
    supabase.from("vw_reservas").select("*").eq("id", reservaId).single(),
    supabase.from("acompanantes").select("id, nombre, documento").eq("reserva_id", reservaId).order("id"),
  ]);
  if (!r) notFound();
  if (r.estado === "en_curso") redirect(`/terreno/${reservaId}/check-out`);
  if (!["confirmada", "pendiente_pago"].includes(r.estado!)) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border bg-background p-8 text-center">
        <p>Esta reserva está <strong>{r.estado}</strong> y no admite check-in.</p>
        <Link href="/terreno" className="mt-3 inline-block text-sm underline">Volver a terreno</Link>
      </div>
    );
  }
  const { data: items } = await supabase.from("inventario_items").select("id, nombre, categoria, cantidad, valor_unitario").eq("departamento_id", r.departamento_id!).neq("estado", "baja").order("categoria").order("nombre");

  return <TerrenoForm modo="check_in" reserva={r} acompanantes={acomp ?? []} items={(items ?? []).map((i) => ({ ...i, valor_unitario: Number(i.valor_unitario) }))} />;
}
