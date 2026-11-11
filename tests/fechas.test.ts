import { test } from "node:test";
import assert from "node:assert/strict";
import {
  diasEntre,
  fechaHoraChileAISO,
  fechaHoraValida,
  fechaMinimaNacimiento,
  fechaValida,
  MAX_NOCHES,
  sumarAnios,
  sumarDias,
  validarEstadia,
  validarFechaNacimiento,
  validarFechaNoFutura,
  validarRangoFuturo,
} from "../src/lib/fechas.ts";

const HOY = "2026-11-09";

test("fechaValida: formato y calendario real", () => {
  assert.equal(fechaValida("2026-02-28"), true);
  assert.equal(fechaValida("2028-02-29"), true); // bisiesto
  assert.equal(fechaValida("2026-02-29"), false);
  assert.equal(fechaValida("2026-02-30"), false);
  assert.equal(fechaValida("2026-13-01"), false);
  assert.equal(fechaValida("2026-1-1"), false);
  assert.equal(fechaValida("09/11/2026"), false);
  assert.equal(fechaValida(""), false);
  assert.equal(fechaValida(undefined), false);
});

test("fechaHoraValida: datetime-local", () => {
  assert.equal(fechaHoraValida("2026-11-09T15:30"), true);
  assert.equal(fechaHoraValida("2026-11-09T15:30:00"), true);
  assert.equal(fechaHoraValida("2026-11-09T24:00"), false);
  assert.equal(fechaHoraValida("2026-02-30T10:00"), false);
  assert.equal(fechaHoraValida("2026-11-09"), false);
});

test("aritmética de fechas", () => {
  assert.equal(sumarDias("2026-12-31", 1), "2027-01-01");
  assert.equal(sumarDias("2026-03-01", -1), "2026-02-28");
  assert.equal(diasEntre("2026-12-18", "2026-12-23"), 5);
  assert.equal(sumarAnios("2024-02-29", -120), "1904-02-29");
  assert.equal(sumarAnios("2024-02-29", 1), "2025-02-28");
  assert.equal(fechaMinimaNacimiento(HOY), "1906-11-09");
});

test("validarEstadia: reglas de reserva", () => {
  assert.equal(validarEstadia("2026-12-18", "2026-12-23", HOY), null);
  assert.equal(validarEstadia(HOY, sumarDias(HOY, 1), HOY), null); // llegar hoy se permite
  assert.equal(validarEstadia("2026-11-08", "2026-11-10", HOY)?.campo, "inicio"); // ayer
  assert.match(validarEstadia("2026-11-08", "2026-11-10", HOY)!.mensaje, /anterior a hoy/);
  assert.equal(validarEstadia("2026-12-18", "2026-12-18", HOY)?.campo, "fin"); // cero noches
  assert.equal(validarEstadia("2026-12-18", "2026-12-10", HOY)?.campo, "fin"); // invertidas
  assert.equal(validarEstadia("2026-12-01", sumarDias("2026-12-01", MAX_NOCHES), HOY), null);
  assert.match(validarEstadia("2026-12-01", sumarDias("2026-12-01", MAX_NOCHES + 1), HOY)!.mensaje, /30 noches/);
  assert.match(validarEstadia("2027-11-10", "2027-11-12", HOY)!.mensaje, /un año/);
  assert.equal(validarEstadia("2027-11-09", "2027-11-12", HOY), null); // justo en el límite
  assert.equal(validarEstadia("2026-02-30", "2026-03-02", HOY)?.campo, "inicio");
  assert.equal(validarEstadia(undefined, undefined, HOY)?.campo, "inicio");
});

test("validarFechaNacimiento: no futura ni imposible", () => {
  assert.equal(validarFechaNacimiento("1990-05-20", HOY), null);
  assert.equal(validarFechaNacimiento(HOY, HOY), null); // recién nacido
  assert.match(validarFechaNacimiento("2026-11-10", HOY)!, /futura/);
  assert.match(validarFechaNacimiento("1900-01-01", HOY)!, /120 años/);
  assert.match(validarFechaNacimiento("1990-02-30", HOY)!, /válida/);
});

test("validarFechaNoFutura y validarRangoFuturo", () => {
  assert.equal(validarFechaNoFutura(HOY, "La fecha", HOY), null);
  assert.match(validarFechaNoFutura("2026-11-10", "La fecha de compra", HOY)!, /no puede ser futura/);
  assert.equal(validarRangoFuturo(HOY, HOY, HOY), null); // un solo día, hoy
  assert.equal(validarRangoFuturo("2026-11-08", HOY, HOY)?.campo, "inicio");
  assert.equal(validarRangoFuturo("2026-11-12", "2026-11-11", HOY)?.campo, "fin");
});

test("esquemas zod: zFechaNacimiento y refinarEstadia", async () => {
  const { z } = await import("zod");
  const { zFechaNacimiento, zFecha, refinarEstadia } = await import("../src/lib/fechas.ts");
  assert.equal(zFechaNacimiento.safeParse(undefined).success, true);
  assert.equal(zFechaNacimiento.safeParse("1990-05-20").success, true);
  assert.equal(zFechaNacimiento.safeParse("2999-01-01").success, false);
  const estadia = z.object({ inicio: zFecha(), fin: zFecha() }).superRefine(refinarEstadia);
  const mal = estadia.safeParse({ inicio: "2000-01-05", fin: "2000-01-04" });
  assert.equal(mal.success, false);
  assert.deepEqual(mal.error?.issues[0].path, ["inicio"]); // la llegada ya pasó, se reporta primero
});

test("fechaHoraChileAISO: hora de Chile a UTC sin depender del servidor", () => {
  assert.equal(fechaHoraChileAISO("2026-11-20T15:30"), "2026-11-20T18:30:00.000Z"); // verano, UTC-3
  assert.equal(fechaHoraChileAISO("2026-07-10T15:30"), "2026-07-10T19:30:00.000Z"); // invierno, UTC-4
  assert.equal(fechaHoraChileAISO("2026-12-31T22:00:00"), "2027-01-01T01:00:00.000Z"); // cruza de día y de año
});
