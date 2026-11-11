import { createAdminClient } from "@/lib/supabase/admin";
import { generarActaPdf, type ActaData, type ChecklistItem } from "@/lib/pdf/acta";

const FIRMA_PREFIJO = "data:image/png;base64,";

/**
 * Genera el PDF de un acta ya registrada, lo guarda en Storage y anota las rutas en el acta.
 * Todo se lee de la base, así que sirve tanto al emitir el acta como para regenerar un PDF que falló.
 * Usa el cliente admin: quien llama debe haber verificado antes que el usuario puede ver el acta.
 * Al regenerar más tarde, la liquidación refleja los montos actuales de la reserva.
 */
export async function emitirActaPdf(actaId: number, firmaDataUrl?: string | null): Promise<string> {
  const admin = createAdminClient();
  const { data: acta } = await admin.from("actas").select("*, profiles(nombre)").eq("id", actaId).single();
  if (!acta) throw new Error("Acta no encontrada");
  const [{ data: r }, { data: acomp }, { data: cargos }] = await Promise.all([
    admin.from("vw_reservas").select("*").eq("id", acta.reserva_id).single(),
    admin.from("acompanantes").select("nombre, documento").eq("reserva_id", acta.reserva_id).order("id"),
    admin.from("reserva_cargos").select("descripcion, monto").eq("reserva_id", acta.reserva_id).order("id"),
  ]);
  if (!r) throw new Error("Reserva no encontrada");
  const { data: dep } = await admin.from("departamentos").select("direccion").eq("id", r.departamento_id!).single();

  // Firma: la recién capturada se guarda; si no viene, se reutiliza la ya guardada
  let firma = firmaDataUrl?.startsWith(FIRMA_PREFIJO) ? firmaDataUrl : null;
  let firmaPath = acta.firma_path;
  if (firma) {
    firmaPath = `${r.codigo}/${acta.tipo}.png`;
    const { error } = await admin.storage.from("firmas").upload(firmaPath, Buffer.from(firma.slice(FIRMA_PREFIJO.length), "base64"), { contentType: "image/png", upsert: true });
    if (error) throw new Error("No se pudo guardar la firma: " + error.message);
  } else if (firmaPath) {
    const { data: blob } = await admin.storage.from("firmas").download(firmaPath);
    if (blob) firma = FIRMA_PREFIJO + Buffer.from(await blob.arrayBuffer()).toString("base64");
  }

  const cobrado = Number(acta.monto_cobrado);
  const data: ActaData = {
    tipo: acta.tipo,
    codigo: r.codigo!,
    fecha: acta.fecha,
    departamento: { nombre: r.departamento_nombre!, direccion: dep?.direccion ?? "", zona: r.zona_nombre! },
    cliente: { nombre: `${r.cliente_nombre} ${r.cliente_apellido ?? ""}`.trim(), rut: r.cliente_rut, email: r.cliente_email!, telefono: r.cliente_telefono },
    estadia: { inicio: r.fecha_inicio!, fin: r.fecha_fin!, noches: r.noches!, huespedes: r.num_huespedes! },
    acompanantes: acomp ?? [],
    checklist: (acta.checklist ?? []) as ChecklistItem[],
    cargos: (cargos ?? []).map((c) => ({ descripcion: c.descripcion, monto: Number(c.monto) })),
    liquidacion: { total: Number(r.monto_total), pagadoAntes: Number(r.monto_pagado) - cobrado, cobradoAhora: cobrado, saldo: Number(r.saldo_pendiente) },
    observaciones: acta.observaciones,
    funcionario: acta.profiles?.nombre ?? "Funcionario",
    firmaDataUrl: firma,
    conformidad: acta.firma_conformidad,
  };

  const pdfPath = `${r.codigo}/acta-${acta.tipo.replace("_", "")}.pdf`;
  const { error } = await admin.storage.from("actas").upload(pdfPath, await generarActaPdf(data), { contentType: "application/pdf", upsert: true });
  if (error) throw new Error("No se pudo guardar el PDF: " + error.message);
  await admin.from("actas").update({ firma_path: firmaPath, pdf_path: pdfPath }).eq("id", actaId);
  return pdfPath;
}
