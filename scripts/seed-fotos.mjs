// Sube las fotos de muestra de seed/fotos al bucket "departamentos" y las registra en departamento_fotos.
// Requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local o en el entorno. Es idempotente: omite las fotos ya subidas.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// Lee .env.local si existe; si no (p. ej. entorno en la nube), usa las variables de entorno del proceso.
const env = { ...process.env };
if (existsSync(".env.local")) {
  for (const l of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    if (!l.includes("=") || l.startsWith("#")) continue;
    const i = l.indexOf("=");
    env[l.slice(0, i).trim()] = l.slice(i + 1).trim();
  }
}
if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY (en .env.local o como variables de entorno)");
  process.exit(1);
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const base = join("seed", "fotos");
const { fotos } = JSON.parse(readFileSync(join(base, "manifest.json"), "utf8"));

const { data: deps, error: depErr } = await sb.from("departamentos").select("id, codigo");
if (depErr) { console.error(depErr.message); process.exit(1); }
const idPorCodigo = new Map(deps.map((d) => [d.codigo, d.id]));

let subidas = 0, omitidas = 0;
for (const f of fotos) {
  const depId = idPorCodigo.get(f.codigo);
  if (!depId) { console.warn(`Departamento ${f.codigo} no existe; se omite ${f.archivo}`); omitidas++; continue; }
  const storagePath = `${depId}/${f.archivo.split("/").pop()}`;
  const { data: existente } = await sb.from("departamento_fotos").select("id").eq("storage_path", storagePath).maybeSingle();
  if (existente) { omitidas++; continue; }
  const buf = readFileSync(join(base, f.archivo));
  const { error: upErr } = await sb.storage.from("departamentos").upload(storagePath, buf, { contentType: "image/jpeg", upsert: true });
  if (upErr) { console.error(`Error subiendo ${f.archivo}: ${upErr.message}`); process.exit(1); }
  const { error: insErr } = await sb.from("departamento_fotos")
    .insert({ departamento_id: depId, storage_path: storagePath, orden: f.orden, es_portada: f.orden === 0 });
  if (insErr) { console.error(`Error registrando ${f.archivo}: ${insErr.message}`); process.exit(1); }
  subidas++;
  console.log(`${f.codigo} ← ${f.archivo} (${f.descripcion})`);
}
console.log(`Listo: ${subidas} fotos subidas, ${omitidas} omitidas.`);
