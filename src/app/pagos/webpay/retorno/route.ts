import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { appUrl, webpayTransaction } from "@/lib/webpay";
import { procesarNotificacionesPendientes } from "@/lib/notificaciones";

export const dynamic = "force-dynamic";

/**
 * Retorno de Webpay Plus. Transbank vuelve por POST (y a veces GET) con:
 *  - token_ws: flujo normal => confirmar con commit()
 *  - TBK_TOKEN + TBK_ORDEN_COMPRA: el usuario abortó en el formulario de pago
 *  - solo TBK_ORDEN_COMPRA / TBK_ID_SESION: timeout en el formulario
 * Esta ruta es pública (las cookies no viajan en el POST cross-site), por eso usa el cliente admin.
 */
async function manejar(params: URLSearchParams) {
  const supabase = createAdminClient();
  const tokenWs = params.get("token_ws");
  const tbkToken = params.get("TBK_TOKEN");
  const tbkOrden = params.get("TBK_ORDEN_COMPRA");

  const buscarPago = async (filtro: { webpay_token?: string; webpay_buy_order?: string }) => {
    let q = supabase.from("pagos").select("id, reserva_id, estado, monto");
    if (filtro.webpay_token) q = q.eq("webpay_token", filtro.webpay_token);
    if (filtro.webpay_buy_order) q = q.eq("webpay_buy_order", filtro.webpay_buy_order);
    const { data } = await q.single();
    return data;
  };

  // Abortado o timeout
  if (!tokenWs) {
    const pago = tbkToken ? await buscarPago({ webpay_token: tbkToken }) : tbkOrden ? await buscarPago({ webpay_buy_order: tbkOrden }) : null;
    if (pago && pago.estado === "pendiente") {
      await supabase.from("pagos").update({ estado: "anulado", notas: tbkToken ? "Pago abortado por el usuario" : "Tiempo de espera agotado en Webpay" }).eq("id", pago.id);
    }
    return NextResponse.redirect(appUrl(pago ? `/mis-reservas/${pago.reserva_id}?pago=anulado` : "/mis-reservas?pago=anulado"), 303);
  }

  const pago = await buscarPago({ webpay_token: tokenWs });
  if (!pago) return NextResponse.redirect(appUrl("/mis-reservas?pago=error"), 303);
  if (pago.estado !== "pendiente") return NextResponse.redirect(appUrl(`/mis-reservas/${pago.reserva_id}?pago=${pago.estado}`), 303);

  try {
    const res = await webpayTransaction().commit(tokenWs);
    const aprobado = res.status === "AUTHORIZED" && res.response_code === 0 && Number(res.amount) === Number(pago.monto);
    await supabase
      .from("pagos")
      .update({
        estado: aprobado ? "aprobado" : "rechazado",
        webpay_authorization_code: res.authorization_code ?? null,
        webpay_response: JSON.parse(JSON.stringify(res)),
        pagado_at: aprobado ? new Date().toISOString() : null,
      })
      .eq("id", pago.id);
    if (aprobado) await procesarNotificacionesPendientes(5).catch(() => undefined);
    return NextResponse.redirect(appUrl(`/mis-reservas/${pago.reserva_id}?pago=${aprobado ? "ok" : "rechazado"}`), 303);
  } catch (e) {
    console.error("webpay commit:", e);
    await supabase.from("pagos").update({ estado: "rechazado", notas: "Error al confirmar con Transbank" }).eq("id", pago.id);
    return NextResponse.redirect(appUrl(`/mis-reservas/${pago.reserva_id}?pago=error`), 303);
  }
}

export async function GET(request: NextRequest) {
  return manejar(request.nextUrl.searchParams);
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const params = new URLSearchParams();
  form.forEach((v, k) => params.set(k, String(v)));
  return manejar(params);
}
