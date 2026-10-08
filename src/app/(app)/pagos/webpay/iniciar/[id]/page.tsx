import { notFound } from "next/navigation";
import { requirePerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatCLP } from "@/lib/format";
import { webpayEsIntegracion } from "@/lib/webpay";
import { AutoSubmit } from "./auto-submit";

export const metadata = { title: "Redirigiendo a Webpay" };

export default async function IniciarWebpayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePerfil();
  const supabase = await createClient();
  const { data: pago } = await supabase.from("pagos").select("id, monto, estado, webpay_token, webpay_response").eq("id", Number(id)).single();
  const url = (pago?.webpay_response as { url?: string } | null)?.url;
  if (!pago || pago.estado !== "pendiente" || !pago.webpay_token || !url) notFound();

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-xl border bg-background p-8 text-center">
      <h1 className="text-xl font-semibold">Redirigiendo a Webpay Plus</h1>
      <p className="text-sm text-muted-foreground">Vas a pagar {formatCLP(pago.monto)}. Si no avanzas automáticamente, usa el botón.</p>
      {webpayEsIntegracion && (
        <p className="rounded-lg bg-amber-100 p-2 text-xs text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
          Ambiente de pruebas de Transbank. Tarjeta de prueba: 4051 8856 0044 6623, CVV 123, cualquier fecha. RUT 11.111.111-1, clave 123.
        </p>
      )}
      <AutoSubmit url={url} token={pago.webpay_token} />
    </div>
  );
}
