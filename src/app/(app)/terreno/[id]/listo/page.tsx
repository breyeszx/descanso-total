import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { formatCLP } from "@/lib/format";

export const metadata = { title: "Acta emitida" };

export default async function ListoPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ acta?: string }> }) {
  const [{ id }, { acta: actaId }] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const [{ data: acta }, { data: r }] = await Promise.all([
    supabase.from("actas").select("id, tipo, pdf_path, monto_cobrado").eq("id", Number(actaId)).single(),
    supabase.from("vw_reservas").select("codigo, estado, saldo_pendiente, departamento_nombre").eq("id", Number(id)).single(),
  ]);
  if (!acta || !r) notFound();
  const esIn = acta.tipo === "check_in";

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-xl border bg-background p-8 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-2xl text-primary">✓</div>
      <h1 className="text-xl font-semibold">{esIn ? "Check-in completado" : "Check-out completado"}</h1>
      <p className="text-sm text-muted-foreground">
        Reserva {r.codigo} · {r.departamento_nombre}. {Number(acta.monto_cobrado) > 0 ? `Se cobraron ${formatCLP(acta.monto_cobrado)}. ` : ""}
        {Number(r.saldo_pendiente) > 0 ? `Saldo pendiente: ${formatCLP(r.saldo_pendiente)}.` : "Sin saldo pendiente."}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {acta.pdf_path ? (
          <Button render={<a href={`/api/actas/${acta.id}`} target="_blank" rel="noopener" />}>Abrir acta PDF</Button>
        ) : (
          <p className="text-sm text-destructive">El PDF no pudo generarse. Puedes reintentarlo desde la reserva.</p>
        )}
        <Button variant="outline" render={<Link href="/terreno" />}>Volver a terreno</Button>
      </div>
    </div>
  );
}
