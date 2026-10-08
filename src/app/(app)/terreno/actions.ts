"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dbError, errorState, formToObject, zodError, type FormState } from "@/lib/form";
import { generarActaPdf, type ActaData, type ChecklistItem } from "@/lib/pdf/acta";
import { enviarPendientesSilencioso } from "@/app/(app)/pagos/actions";

const baseSchema = z.object({
  observaciones: z.string().trim().max(2000).optional(),
  conformidad: z.preprocess((v) => v === "on", z.boolean()),
  cobro_monto: z.coerce.number().int().min(0).default(0),
  cobro_medio: z.enum(["efectivo", "transferencia", "webpay"]).default("efectivo"),
  firma: z.string().optional(),
});

/** Lee el checklist desde campos `item_<id>_estado`, `item_<id>_obs`, `item_<id>_cargo`, más `item_<nombre>` para ítems libres. */
function leerChecklist(formData: FormData, nombres: Map<number, string>): ChecklistItem[] {
  const out: ChecklistItem[] = [];
  for (const [id, nombre] of nombres) {
    const estado = (formData.get(`item_${id}_estado`) as ChecklistItem["estado"]) ?? "bueno";
    const observacion = String(formData.get(`item_${id}_obs`) ?? "").trim() || undefined;
    const cargo = Number(formData.get(`item_${id}_cargo`) ?? 0) || 0;
    out.push({ item_id: id, nombre, estado, observacion, cargo: cargo > 0 ? cargo : undefined });
  }
  return out;
}

async function cargarContexto(reservaId: number) {
  const supabase = await createClient();
  const [{ data: r }, { data: items }, { data: acomp }, { data: cargos }] = await Promise.all([
    supabase.from("vw_reservas").select("*").eq("id", reservaId).single(),
    supabase.from("inventario_items").select("id, nombre").neq("estado", "baja"),
    supabase.from("acompanantes").select("nombre, documento").eq("reserva_id", reservaId),
    supabase.from("reserva_cargos").select("descripcion, monto").eq("reserva_id", reservaId),
  ]);
  return { supabase, r, items: items ?? [], acomp: acomp ?? [], cargos: cargos ?? [] };
}

async function subirFirmaYPdf(reservaCodigo: string, tipo: "check_in" | "check_out", firma: string | undefined, data: ActaData) {
  const admin = createAdminClient();
  let firmaPath: string | null = null;
  if (firma?.startsWith("data:image/png;base64,")) {
    firmaPath = `${reservaCodigo}/${tipo}.png`;
    const buf = Buffer.from(firma.split(",")[1], "base64");
    await admin.storage.from("firmas").upload(firmaPath, buf, { contentType: "image/png", upsert: true });
  }
  const pdf = await generarActaPdf(data);
  const pdfPath = `${reservaCodigo}/acta-${tipo.replace("_", "")}.pdf`;
  const { error } = await admin.storage.from("actas").upload(pdfPath, pdf, { contentType: "application/pdf", upsert: true });
  if (error) throw new Error("No se pudo guardar el PDF: " + error.message);
  return { firmaPath, pdfPath };
}

export async function registrarCheckIn(reservaId: number, _: FormState, formData: FormData): Promise<FormState> {
  const perfil = await requirePerfil(["funcionario", "admin"]);
  const parsed = baseSchema.safeParse(formToObject(formData));
  if (!parsed.success) return zodError(parsed.error, formData);
  const { supabase, r, items, acomp, cargos } = await cargarContexto(reservaId);
  if (!r || !["confirmada", "pendiente_pago"].includes(r.estado!)) return { error: "La reserva no está en condiciones de check-in" };
  if (!parsed.data.conformidad) return errorState("El cliente debe firmar conformidad para entregar el departamento", formData);

  const nombres = new Map(items.filter((i) => formData.has(`item_${i.id}_estado`)).map((i) => [i.id, i.nombre]));
  const checklist = leerChecklist(formData, nombres);

  // 1) Cobro del saldo (o anticipo pendiente)
  const cobro = Math.min(parsed.data.cobro_monto, Number(r.saldo_pendiente));
  if (cobro > 0) {
    const { error } = await supabase.from("pagos").insert({
      reserva_id: reservaId, concepto: r.estado === "pendiente_pago" ? "anticipo" : "saldo", medio: parsed.data.cobro_medio,
      monto: cobro, estado: "aprobado", pagado_at: new Date().toISOString(), registrado_por: perfil.id, notas: "Cobrado en check-in",
    });
    if (error) return errorState(dbError(error.message), formData);
  }

  // 2) Acta (el trigger pasa la reserva a en_curso)
  const { data: acta, error: actaErr } = await supabase
    .from("actas")
    .insert({ reserva_id: reservaId, tipo: "check_in", funcionario_id: perfil.id, checklist, observaciones: parsed.data.observaciones ?? null, firma_conformidad: true, monto_cobrado: cobro })
    .select("id, fecha")
    .single();
  if (actaErr) return errorState(dbError(actaErr.message), formData);

  // 3) PDF + firma
  try {
    const data: ActaData = {
      tipo: "check_in", codigo: r.codigo!, fecha: acta.fecha,
      departamento: { nombre: r.departamento_nombre!, direccion: "", zona: r.zona_nombre! },
      cliente: { nombre: `${r.cliente_nombre} ${r.cliente_apellido ?? ""}`.trim(), rut: r.cliente_rut, email: r.cliente_email!, telefono: r.cliente_telefono },
      estadia: { inicio: r.fecha_inicio!, fin: r.fecha_fin!, noches: r.noches!, huespedes: r.num_huespedes! },
      acompanantes: acomp, checklist, cargos,
      liquidacion: { total: Number(r.monto_total), pagadoAntes: Number(r.monto_pagado), cobradoAhora: cobro, saldo: Number(r.saldo_pendiente) - cobro },
      observaciones: parsed.data.observaciones ?? null, funcionario: perfil.nombre, firmaDataUrl: parsed.data.firma || null, conformidad: true,
    };
    const { data: dep } = await supabase.from("departamentos").select("direccion").eq("id", r.departamento_id!).single();
    data.departamento.direccion = dep?.direccion ?? "";
    const { firmaPath, pdfPath } = await subirFirmaYPdf(r.codigo!, "check_in", parsed.data.firma, data);
    await supabase.from("actas").update({ firma_path: firmaPath, pdf_path: pdfPath }).eq("id", acta.id);
  } catch (e) {
    console.error("acta pdf:", e);
  }

  await enviarPendientesSilencioso();
  revalidarTodo(reservaId);
  redirect(`/terreno/${reservaId}/listo?acta=${acta.id}`);
}

export async function registrarCheckOut(reservaId: number, _: FormState, formData: FormData): Promise<FormState> {
  const perfil = await requirePerfil(["funcionario", "admin"]);
  const parsed = baseSchema.safeParse(formToObject(formData));
  if (!parsed.success) return zodError(parsed.error, formData);
  const { supabase, r, items, acomp } = await cargarContexto(reservaId);
  if (!r || r.estado !== "en_curso") return { error: "La reserva no está en curso" };

  const nombres = new Map(items.filter((i) => formData.has(`item_${i.id}_estado`)).map((i) => [i.id, i.nombre]));
  const checklist = leerChecklist(formData, nombres);
  const multa = Number(formData.get("multa_monto") ?? 0) || 0;
  const multaDesc = String(formData.get("multa_descripcion") ?? "").trim();

  // 1) Acta (el trigger finaliza la reserva)
  const { data: acta, error: actaErr } = await supabase
    .from("actas")
    .insert({ reserva_id: reservaId, tipo: "check_out", funcionario_id: perfil.id, checklist, observaciones: parsed.data.observaciones ?? null, firma_conformidad: parsed.data.conformidad, monto_cobrado: 0 })
    .select("id, fecha")
    .single();
  if (actaErr) return errorState(dbError(actaErr.message), formData);

  // 2) Cargos por daños / faltantes / multas (recalculan el total vía trigger)
  const nuevosCargos: { descripcion: string; monto: number }[] = [];
  for (const c of checklist) {
    if (c.cargo && c.cargo > 0) {
      nuevosCargos.push({ descripcion: `${c.estado === "faltante" ? "Faltante" : "Daño"}: ${c.nombre}${c.observacion ? ` (${c.observacion})` : ""}`, monto: c.cargo });
      await supabase.from("reserva_cargos").insert({ reserva_id: reservaId, acta_id: acta.id, inventario_item_id: c.item_id, tipo: "dano", descripcion: nuevosCargos.at(-1)!.descripcion, monto: c.cargo, registrado_por: perfil.id });
      if (c.item_id) {
        await supabase.from("inventario_movimientos").insert({ item_id: c.item_id, tipo: c.estado === "faltante" ? "baja" : "deterioro", cantidad: 1, costo: 0, descripcion: `Check-out ${r.codigo}`, reserva_id: reservaId, registrado_por: perfil.id });
        await supabase.from("inventario_items").update({ estado: c.estado === "faltante" ? "baja" : "deteriorado" }).eq("id", c.item_id);
      }
    }
  }
  if (multa > 0) {
    nuevosCargos.push({ descripcion: `Multa: ${multaDesc || "sin detalle"}`, monto: multa });
    await supabase.from("reserva_cargos").insert({ reserva_id: reservaId, acta_id: acta.id, tipo: "multa", descripcion: nuevosCargos.at(-1)!.descripcion, monto: multa, registrado_por: perfil.id });
  }

  // 3) Cobro final sobre el saldo actualizado
  const { data: actual } = await supabase.from("reservas").select("monto_total, monto_pagado, saldo_pendiente").eq("id", reservaId).single();
  const saldo = Number(actual?.saldo_pendiente ?? 0);
  const cobro = Math.min(parsed.data.cobro_monto, saldo);
  if (cobro > 0) {
    const { error } = await supabase.from("pagos").insert({
      reserva_id: reservaId, concepto: nuevosCargos.length ? "cargo" : "saldo", medio: parsed.data.cobro_medio, monto: cobro,
      estado: "aprobado", pagado_at: new Date().toISOString(), registrado_por: perfil.id, notas: "Cobrado en check-out",
    });
    if (error) return errorState(dbError(error.message), formData);
    await supabase.from("actas").update({ monto_cobrado: cobro }).eq("id", acta.id);
  }

  // 4) PDF + firma
  try {
    const { data: cargosTodos } = await supabase.from("reserva_cargos").select("descripcion, monto").eq("reserva_id", reservaId);
    const { data: dep } = await supabase.from("departamentos").select("direccion").eq("id", r.departamento_id!).single();
    const data: ActaData = {
      tipo: "check_out", codigo: r.codigo!, fecha: acta.fecha,
      departamento: { nombre: r.departamento_nombre!, direccion: dep?.direccion ?? "", zona: r.zona_nombre! },
      cliente: { nombre: `${r.cliente_nombre} ${r.cliente_apellido ?? ""}`.trim(), rut: r.cliente_rut, email: r.cliente_email!, telefono: r.cliente_telefono },
      estadia: { inicio: r.fecha_inicio!, fin: r.fecha_fin!, noches: r.noches!, huespedes: r.num_huespedes! },
      acompanantes: acomp, checklist, cargos: (cargosTodos ?? []).map((c) => ({ descripcion: c.descripcion, monto: Number(c.monto) })),
      liquidacion: { total: Number(actual?.monto_total ?? r.monto_total), pagadoAntes: Number(actual?.monto_pagado ?? r.monto_pagado), cobradoAhora: cobro, saldo: saldo - cobro },
      observaciones: parsed.data.observaciones ?? null, funcionario: perfil.nombre, firmaDataUrl: parsed.data.firma || null, conformidad: parsed.data.conformidad,
    };
    const { firmaPath, pdfPath } = await subirFirmaYPdf(r.codigo!, "check_out", parsed.data.firma, data);
    await supabase.from("actas").update({ firma_path: firmaPath, pdf_path: pdfPath }).eq("id", acta.id);
  } catch (e) {
    console.error("acta pdf:", e);
  }

  await enviarPendientesSilencioso();
  revalidarTodo(reservaId);
  redirect(`/terreno/${reservaId}/listo?acta=${acta.id}`);
}

const acompSchema = z.object({ nombre: z.string().trim().min(2, "Nombre requerido"), documento: z.string().trim().min(5, "Documento requerido") });

export async function agregarAcompananteTerreno(reservaId: number, _: FormState, formData: FormData): Promise<FormState> {
  await requirePerfil(["funcionario", "admin"]);
  const parsed = acompSchema.safeParse(formToObject(formData));
  if (!parsed.success) return zodError(parsed.error, formData);
  const supabase = await createClient();
  const { error } = await supabase.from("acompanantes").insert({ reserva_id: reservaId, ...parsed.data });
  if (error) return errorState(dbError(error.message), formData);
  revalidatePath(`/terreno/${reservaId}/check-in`);
  return { ok: "Acompañante agregado" };
}

function revalidarTodo(id: number) {
  revalidatePath("/terreno");
  revalidatePath(`/admin/reservas/${id}`);
  revalidatePath(`/mis-reservas/${id}`);
  revalidatePath("/dashboard");
}
