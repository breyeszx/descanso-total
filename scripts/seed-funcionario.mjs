// Crea un usuario funcionario de prueba (correo confirmado). Credenciales en .env.local: SEED_FUNCIONARIO_EMAIL / SEED_FUNCIONARIO_PASSWORD
import { createClient } from "@supabase/supabase-js";
import { readFileSync, appendFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
let email = env.SEED_FUNCIONARIO_EMAIL, password = env.SEED_FUNCIONARIO_PASSWORD;
if (!email || !password) {
  email = "funcionario@descansototal.cl";
  password = "Fun-" + randomBytes(9).toString("base64url");
  appendFileSync(".env.local", `\nSEED_FUNCIONARIO_EMAIL=${email}\nSEED_FUNCIONARIO_PASSWORD=${password}\n`);
  console.log("Credenciales de funcionario guardadas en .env.local");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: list } = await sb.auth.admin.listUsers();
let user = list.users.find((u) => u.email === email);
if (!user) {
  const { data, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { nombre: "Funcionario Terreno" } });
  if (error) { console.error(error.message); process.exit(1); }
  user = data.user; console.log("Usuario cliente creado");
} else {
  await sb.auth.admin.updateUserById(user.id, { password, email_confirm: true });
  console.log("Usuario cliente ya existía; contraseña sincronizada");
}
const { data: c } = await sb.from("clientes").select("id, email").eq("profile_id", user.id).single();
console.log("Ficha cliente:", c);
await sb.from("profiles").update({ rol: "funcionario" }).eq("id", user.id);
console.log("Rol funcionario asignado");
