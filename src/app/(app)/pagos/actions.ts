"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePerfil } from "@/lib/auth";
import { appUrl, webpayTransaction } from "@/lib/webpay";
import { procesarNotificacionesPendientes } from "@/lib/notificaciones";
import { dbError, type FormState } from "@/lib/form";

/**
 * Inicia un pago Webpay Plus para el anticipo o el saldo de una reserva y redirige al formulario de Transbank.
 * El cliente debe ser dueño de la reserva (RLS lo garantiza al leerla).
 */
export async function iniciarPagoWebpay(reservaId: number, concepto: "anticipo" | "saldo"): Promise<FormState> {
  const perfil = await requirePerfil();
  const supabase = await createClient();
  const { data: r } = await supabase.from("reservas").select("id, codigo, estado, monto_anticipo, monto_pagado, saldo_pendiente").eq("id", reservaId).single();
  if (!r) return { error: "Reserva no encontrada" };

  let monto = 0;
  if (concepto === "anticipo") {
    if (r.estado !== "pendiente_pago") return { error: "La reserva ya no requiere anticipo" };
    monto = Math.max(0, Number(r.monto_anticipo) - Number(r.monto_pagado));
  } else {
    if (!["confirmada", "en_curso"].includes(r.estado)) return { error: "La reserva no admite pago de saldo" };
    monto = Number(r.saldo_pendiente);
  }
  if (monto <= 0) return { error: "No hay monto pendiente por pagar" };

  // La reserva ya fue validada como propia vía RLS; el pago lo crea el servidor.
  const admin = createAdminClient();
  const { data: pago, error } = await admin
    .from("pagos")
    .insert({ reserva_id: reservaId, concepto, medio: "webpay", monto, estado: "pendiente", registrado_por: perfil.id })
    .select("id")
    .single();
  if (error) return { error: dbError(error.message) };

  const buyOrder = `${r.codigo}-${pago.id}`.replace(/[^A-Za-z0-9-]/g, "").slice(0, 26);
  try {
    const tx = webpayTransaction();
    const { token, url } = await tx.create(buyOrder, perfil.id.slice(0, 61), monto, appUrl("/pagos/webpay/retorno"));
    await admin.from("pagos").update({ webpay_token: token, webpay_buy_order: buyOrder, webpay_response: { url } }).eq("id", pago.id);
    redirect(`/pagos/webpay/iniciar/${pago.id}`);
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e; // redirect() de Next
    await admin.from("pagos").update({ estado: "anulado", notas: "Error al crear transacción Webpay" }).eq("id", pago.id);
    return { error: "No se pudo conectar con Webpay. Intenta nuevamente en unos minutos." };
  }
}

/** Reenvía las notificaciones pendientes tras una acción del usuario (sin bloquear el flujo si falla). */
export async function enviarPendientesSilencioso() {
  try {
    await procesarNotificacionesPendientes(10);
  } catch (e) {
    console.error("notificaciones:", e);
  }
}
