import Link from "next/link";
import { requirePerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { EstadoBadge } from "@/components/estado-badge";
import { formatCLP, formatDate } from "@/lib/format";

export const metadata = { title: "Mis reservas" };

export default async function MisReservasPage() {
  const perfil = await requirePerfil(["cliente"]);
  const supabase = await createClient();
  const { data: reservas } = await supabase
    .from("reservas")
    .select("id, codigo, fecha_inicio, fecha_fin, estado, monto_total, saldo_pendiente, monto_anticipo, monto_pagado, departamentos(nombre, zonas(nombre))")
    .order("fecha_inicio", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Mis reservas</h1>
          <p className="text-sm text-muted-foreground">Hola, {perfil.nombre}</p>
        </div>
        <Button render={<Link href="/departamentos" />}>Nueva reserva</Button>
      </div>

      {reservas?.length ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {reservas.map((r) => (
            <li key={r.id}>
              <Link href={`/mis-reservas/${r.id}`} className="flex flex-col gap-2 rounded-xl border bg-background p-4 transition hover:shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{r.codigo}</span>
                  <EstadoBadge estado={r.estado} />
                </div>
                <p className="font-semibold">{r.departamentos?.nombre}</p>
                <p className="text-sm text-muted-foreground">{r.departamentos?.zonas?.nombre} · {formatDate(r.fecha_inicio)} → {formatDate(r.fecha_fin)}</p>
                <div className="flex justify-between text-sm">
                  <span>Total {formatCLP(r.monto_total)}</span>
                  <span className={Number(r.saldo_pendiente) > 0 ? "text-amber-700" : "text-green-700"}>
                    {r.estado === "pendiente_pago" ? `Anticipo pendiente ${formatCLP(r.monto_anticipo)}` : `Saldo ${formatCLP(r.saldo_pendiente)}`}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border bg-background p-10 text-center text-muted-foreground">
          Aún no tienes reservas. <Link href="/departamentos" className="underline">Explora los departamentos</Link>.
        </div>
      )}
    </div>
  );
}
