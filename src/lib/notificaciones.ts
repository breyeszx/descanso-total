import { createAdminClient } from "@/lib/supabase/admin";
import { enviarCorreo, plantilla } from "@/lib/email";
import { formatCLP, formatDate, formatDateTime } from "@/lib/format";
import { appUrl } from "@/lib/webpay";
import type { Tables } from "@/lib/supabase/database.types";

type Payload = Record<string, unknown>;
const str = (v: unknown) => (v == null ? "" : String(v));

function fila(label: string, valor: string) {
  return `<tr><td style="padding:6px 0;color:#71717a">${label}</td><td style="padding:6px 0;text-align:right;font-weight:bold">${valor}</td></tr>`;
}
const tabla = (filas: string) => `<table role="presentation" width="100%" style="font-size:14px;margin:12px 0">${filas}</table>`;
const boton = (href: string, texto: string) =>
  `<p style="margin:20px 0"><a href="${href}" style="background:#0f766e;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;display:inline-block">${texto}</a></p>`;

/** Construye asunto + HTML según el tipo de notificación. */
export function renderNotificacion(n: Tables<"notificaciones">): { subject: string; html: string } {
  const p = (n.payload ?? {}) as Payload;
  const codigo = str(p.codigo);
  const link = n.reserva_id ? appUrl(`/mis-reservas/${n.reserva_id}`) : appUrl("/mis-reservas");

  switch (n.tipo) {
    case "confirmacion_reserva":
      return {
        subject: n.asunto,
        html: plantilla(`Recibimos tu reserva ${codigo}`, `
          <p>Gracias por reservar con Descanso Total. Para confirmarla, paga el anticipo en línea.</p>
          ${tabla(fila("Departamento", str(p.departamento)) + fila("Llegada", formatDate(str(p.inicio))) + fila("Salida", formatDate(str(p.fin))) + fila("Anticipo", formatCLP(Number(p.anticipo))))}
          ${boton(link, "Pagar anticipo")}
          <p style="font-size:13px;color:#71717a">Recuerda registrar a tus acompañantes antes del check-in.</p>`),
      };
    case "comprobante_pago":
      return {
        subject: n.asunto,
        html: plantilla("Comprobante de pago", `
          <p>Registramos tu pago correctamente.</p>
          ${tabla(fila("Reserva", codigo) + fila("Departamento", str(p.departamento)) + fila("Concepto", str(p.concepto).replace("_", " ")) + fila("Medio", str(p.medio)) + fila("Monto", formatCLP(Number(p.monto))) + (p.autorizacion ? fila("Código autorización", str(p.autorizacion)) : "") + fila("Saldo pendiente", formatCLP(Number(p.saldo))))}
          ${boton(link, "Ver mi reserva")}`),
      };
    case "coordinacion_transporte": {
      const transportes = (Array.isArray(p.transportes) ? p.transportes : []) as Payload[];
      const lista = transportes.length
        ? `<ul>${transportes.map((t) => `<li><strong>${str(t.tipo)}</strong> · ${formatDateTime(str(t.fecha_hora))}${t.origen ? ` · desde ${str(t.origen)}` : ""}${t.destino ? ` hasta ${str(t.destino)}` : ""}${t.conductor ? ` · Conductor: ${str(t.conductor)}${t.telefono ? ` (${str(t.telefono)})` : ""}` : ""}${t.vehiculo ? ` · Vehículo ${str(t.vehiculo)}` : ""}</li>`).join("")}</ul>`
        : `<p>No tienes traslados contratados. Si necesitas transporte, contáctanos o agrégalo desde tu reserva.</p>`;
      return {
        subject: n.asunto,
        html: plantilla(`Tu llegada es el ${formatDate(str(p.fecha_inicio))}`, `
          <p>Te esperamos en <strong>${str(p.departamento)}</strong>, ${str(p.direccion)}. Check-in desde las ${str(p.hora_checkin) || "15:00"}.</p>
          <h3 style="font-size:15px">Traslados coordinados</h3>${lista}
          ${boton(link, "Ver mi reserva")}`),
      };
    }
    case "recordatorio_checkout":
      return {
        subject: n.asunto,
        html: plantilla(`Tu check-out es el ${formatDate(str(p.fecha_fin))}`, `
          <p>Mañana termina tu estadía en <strong>${str(p.departamento)}</strong>. El check-out es hasta las ${str(p.hora_checkout) || "11:00"}.</p>
          ${Number(p.saldo) > 0 ? `<p>Tienes un saldo pendiente de <strong>${formatCLP(Number(p.saldo))}</strong> que puedes pagar en línea o en el check-out.</p>` : ""}
          <p>Nuestro funcionario revisará el departamento contigo y emitirá el acta de salida.</p>
          ${boton(link, "Ver mi reserva")}`),
      };
    case "cancelacion_reserva":
      return {
        subject: n.asunto,
        html: plantilla(`Reserva ${codigo} cancelada`, `
          <p>Tu reserva fue cancelada.</p>
          ${Number(p.multa) > 0 ? `<p>Se aplicó una multa por cancelación fuera de plazo de <strong>${formatCLP(Number(p.multa))}</strong>.</p>` : "<p>No se aplicaron cargos.</p>"}
          <p>Esperamos verte pronto. ${boton(appUrl("/departamentos"), "Buscar otra fecha")}</p>`),
      };
    case "alerta_mantencion":
    default:
      return { subject: n.asunto, html: plantilla(n.asunto, `<pre style="font-size:13px">${JSON.stringify(p, null, 2)}</pre>`) };
  }
}

/** Envía las notificaciones pendientes cuya hora programada ya pasó. Devuelve el resumen. */
export async function procesarNotificacionesPendientes(limite = 50) {
  const supabase = createAdminClient();
  const { data: pendientes } = await supabase
    .from("notificaciones")
    .select("*")
    .eq("estado", "pendiente")
    // Tolerancia de 5 min por posible desfase de reloj entre este servidor y Postgres
    .lte("programada_para", new Date(Date.now() + 5 * 60_000).toISOString())
    .order("programada_para")
    .limit(limite);

  let enviadas = 0;
  let fallidas = 0;
  for (const n of pendientes ?? []) {
    const { subject, html } = renderNotificacion(n);
    const r = await enviarCorreo({ to: n.destinatario, subject, html });
    if (r.ok) {
      enviadas++;
      await supabase.from("notificaciones").update({ estado: "enviada", enviada_at: new Date().toISOString(), proveedor_id: r.id, error: null }).eq("id", n.id);
    } else {
      fallidas++;
      await supabase.from("notificaciones").update({ estado: "fallida", error: r.error }).eq("id", n.id);
    }
  }
  return { enviadas, fallidas };
}

/** Encola avisos programados (transporte / check-out) y procesa la cola. */
export async function ejecutarCronNotificaciones() {
  const supabase = createAdminClient();
  const { data: encoladas, error } = await supabase.rpc("encolar_notificaciones_programadas");
  if (error) throw new Error(error.message);
  const resultado = await procesarNotificacionesPendientes();
  return { encoladas: encoladas ?? 0, ...resultado };
}
