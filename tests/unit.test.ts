import { test } from "node:test";
import assert from "node:assert/strict";
import { formatearRut, normalizarRut, validarRut } from "../src/lib/rut.ts";
import { rangoPeriodo } from "../src/lib/periodo.ts";
import { dbError } from "../src/lib/form.ts";

test("RUT: normaliza, valida dígito verificador y formatea", () => {
  assert.equal(normalizarRut("12.345.678-5"), "12345678-5");
  assert.equal(validarRut("12.345.678-5"), true);
  assert.equal(validarRut("12345678-9"), false);
  assert.equal(validarRut("11111111-1"), true);
  assert.equal(validarRut("abc"), false);
  assert.equal(formatearRut("12345678-5"), "12.345.678-5");
});

test("rangoPeriodo: mes, semana, año y rango", () => {
  assert.deepEqual(rangoPeriodo("mes", "2026-02-10"), { desde: "2026-02-01", hasta: "2026-02-28" });
  assert.deepEqual(rangoPeriodo("semana", "2026-10-14"), { desde: "2026-10-12", hasta: "2026-10-18" }); // miércoles -> lunes a domingo
  assert.deepEqual(rangoPeriodo("anio", "2026-05-05"), { desde: "2026-01-01", hasta: "2026-12-31" });
  assert.deepEqual(rangoPeriodo("dia", "2026-05-05"), { desde: "2026-05-05", hasta: "2026-05-05" });
  assert.deepEqual(rangoPeriodo("rango", "2026-05-05", "2026-05-01"), { desde: "2026-05-05", hasta: "2026-05-05" }); // hasta < desde se corrige
});

test("dbError: traduce errores de BD a mensajes de usuario", () => {
  assert.match(dbError('conflicting key value violates exclusion constraint "reservas_sin_solape"'), /ya tiene una reserva/);
  assert.equal(dbError("Existen reservas activas en el rango de la mantención"), "Existen reservas activas en el rango de la mantención");
  assert.match(dbError("new row violates row-level security policy"), /permisos/);
  assert.match(dbError("algo interno raro"), /Ocurrió un error/);
});
