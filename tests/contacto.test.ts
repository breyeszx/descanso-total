import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatearTelefono,
  normalizarDocumento,
  normalizarEmail,
  normalizarTelefono,
  zDocumento,
  zEmail,
  zNombrePersona,
  zRutOpcional,
  zTelefonoOpcional,
} from "../src/lib/contacto.ts";

test("teléfonos: normaliza chilenos e internacionales", () => {
  assert.equal(normalizarTelefono("+56 9 1234 5678"), "+56912345678");
  assert.equal(normalizarTelefono("9 1234 5678"), "+56912345678");
  assert.equal(normalizarTelefono("912345678"), "+56912345678");
  assert.equal(normalizarTelefono("56912345678"), "+56912345678");
  assert.equal(normalizarTelefono("(2) 2345 6789"), "+56223456789"); // fijo con código de área
  assert.equal(normalizarTelefono("23456789"), "+56223456789"); // fijo antiguo de 8 dígitos
  assert.equal(normalizarTelefono("+54 11 4321-9876"), "+541143219876");
  assert.equal(normalizarTelefono("0054 11 4321 9876"), "+541143219876");
  assert.equal(normalizarTelefono("1234"), null);
  assert.equal(normalizarTelefono("12345678901234567"), null);
  assert.equal(normalizarTelefono("abc"), null);
  assert.equal(normalizarTelefono("+56 9 1234 56x8"), null);
  assert.equal(normalizarTelefono(""), null);
  assert.equal(formatearTelefono("+56912345678"), "+56 9 1234 5678");
  assert.equal(formatearTelefono("+56223456789"), "+56 2 2345 6789");
  assert.equal(formatearTelefono("+541143219876"), "+541143219876");
  assert.equal(formatearTelefono(null), "—");
});

test("correo: normaliza y valida", () => {
  assert.equal(normalizarEmail("  Ana.Perez@Gmail.COM "), "ana.perez@gmail.com");
  const e = zEmail();
  assert.equal(e.parse(" Ana@Dominio.cl "), "ana@dominio.cl");
  assert.equal(e.safeParse("ana@dominio").success, false);
  assert.equal(e.safeParse("ana dominio.cl").success, false);
  assert.equal(e.safeParse("").success, false);
});

test("documento: RUT con dígito verificador o pasaporte", () => {
  assert.deepEqual(normalizarDocumento("12.345.678-5"), { tipo: "rut", valor: "12345678-5" });
  assert.deepEqual(normalizarDocumento("123456785"), { tipo: "rut", valor: "12345678-5" });
  assert.equal(normalizarDocumento("12.345.678-9"), null); // DV incorrecto
  assert.deepEqual(normalizarDocumento("AB123456"), { tipo: "pasaporte", valor: "AB123456" });
  assert.deepEqual(normalizarDocumento("pa-1234 567"), { tipo: "pasaporte", valor: "PA1234567" });
  assert.equal(normalizarDocumento("ab1"), null);
  assert.equal(normalizarDocumento("@@@@@"), null);
  assert.equal(zDocumento.parse("12.345.678-5"), "12345678-5");
  const mal = zDocumento.safeParse("12345678-9");
  assert.equal(mal.success, false);
  assert.match(mal.error!.issues[0].message, /dígito verificador/);
});

test("RUT opcional: vacío es null, inválido es error", () => {
  assert.equal(zRutOpcional.parse(undefined), null);
  assert.equal(zRutOpcional.parse("11.111.111-1"), "11111111-1");
  assert.equal(zRutOpcional.safeParse("11111111-2").success, false);
});

test("teléfono opcional y nombre de persona", () => {
  assert.equal(zTelefonoOpcional.parse(undefined), undefined);
  assert.equal(zTelefonoOpcional.parse("9 8765 4321"), "+56987654321");
  assert.equal(zTelefonoOpcional.safeParse("123").success, false);
  const n = zNombrePersona();
  assert.equal(n.parse("  María José O'Higgins-Pérez "), "María José O'Higgins-Pérez");
  assert.equal(n.safeParse("A").success, false);
  assert.equal(n.safeParse("Juan123").success, false);
  assert.equal(n.safeParse("<script>").success, false);
});
