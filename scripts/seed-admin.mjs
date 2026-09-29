// Crea (o actualiza) el usuario administrador de prueba.
// Credenciales: SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD en .env.local (se generan si faltan).
import { createClient } from "@supabase/supabase-js";
import { readFileSync, appendFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
if (!env.SUPABASE_SERVICE_ROLE_KEY) { console.error("Falta SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }

let email = env.SEED_ADMIN_EMAIL, password = env.SEED_ADMIN_PASSWORD;
if (!email || !password) {
  email = "admin@descansototal.cl";
  password = "Adm-" + randomBytes(9).toString("base64url");
  appendFileSync(".env.local", `SEED_ADMIN_EMAIL=${email}\nSEED_ADMIN_PASSWORD=${password}\n`);
  console.log("Credenciales de admin guardadas en .env.local");
}

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data: list, error: le } = await sb.auth.admin.listUsers();
if (le) { console.error(le.message); process.exit(1); }
let user = list.users.find((u) => u.email === email);
if (!user) {
  const { data, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { nombre: "Administrador" } });
  if (error) { console.error(error.message); process.exit(1); }
  user = data.user; console.log("Usuario admin creado");
} else {
  await sb.auth.admin.updateUserById(user.id, { password, email_confirm: true });
  console.log("Usuario admin ya existía; contraseña sincronizada");
}
const { error: pe } = await sb.from("profiles").update({ rol: "admin", nombre: "Administrador" }).eq("id", user.id);
if (pe) { console.error("profiles:", pe.message); process.exit(1); }
const { data: p } = await sb.from("profiles").select("email, rol").eq("id", user.id).single();
console.log("Perfil:", p);
