import { test } from "node:test";
import assert from "node:assert/strict";
import { filtroBusqueda, terminoBusqueda } from "../src/lib/busqueda.ts";
import { paginaActual, rangoPagina, todasLasFilas, totalPaginas, urlPagina } from "../src/lib/paginacion.ts";

test("terminoBusqueda: quita la sintaxis de PostgREST y los comodines", () => {
  assert.equal(terminoBusqueda("  Pérez, Ana  "), "Pérez Ana");
  assert.equal(terminoBusqueda('a(b)"c\\d*e%f'), "a b c d e f");
  assert.equal(terminoBusqueda("12.345.678-9"), "12.345.678-9");
  assert.equal(terminoBusqueda(",,()"), "");
  assert.equal(terminoBusqueda(undefined), "");
  assert.equal(terminoBusqueda("x".repeat(200)).length, 60);
});

test("filtroBusqueda: arma el filtro or entre comillas o devuelve null", () => {
  assert.equal(filtroBusqueda("ana", ["nombre", "email"]), 'nombre.ilike."%ana%",email.ilike."%ana%"');
  assert.equal(filtroBusqueda("Pérez, Ana", ["nombre"]), 'nombre.ilike."%Pérez Ana%"');
  assert.equal(filtroBusqueda("  ", ["nombre"]), null);
  assert.equal(filtroBusqueda("),estado.eq.cancelada", ["codigo"]), 'codigo.ilike."%estado.eq.cancelada%"');
});

test("paginación: página, rango, total y URL", () => {
  assert.equal(paginaActual(undefined), 1);
  assert.equal(paginaActual("3"), 3);
  for (const v of ["0", "-2", "abc", "1.5", ""]) assert.equal(paginaActual(v), 1);
  assert.deepEqual(rangoPagina(1), [0, 49]);
  assert.deepEqual(rangoPagina(3, 20), [40, 59]);
  assert.equal(totalPaginas(0), 1);
  assert.equal(totalPaginas(50), 1);
  assert.equal(totalPaginas(51), 2);
  assert.equal(urlPagina("/admin/reservas", { q: "ana", estado: undefined }), "/admin/reservas?q=ana");
  assert.equal(urlPagina("/admin/reservas", { q: "ana pérez" }, 2), "/admin/reservas?q=ana+p%C3%A9rez&pagina=2");
  assert.equal(urlPagina("/admin/clientes"), "/admin/clientes");
});

test("todasLasFilas: recorre todos los tramos aunque el servidor entregue menos de lo pedido", async () => {
  const datos = Array.from({ length: 2500 }, (_, i) => i);
  const pedidos: [number, number][] = [];
  // Servidor con tope de 700 filas por respuesta, menor al tramo pedido
  const filas = await todasLasFilas(async (a, b) => {
    pedidos.push([a, b]);
    return datos.slice(a, Math.min(b + 1, a + 700));
  }, 1000);
  assert.equal(filas.length, 2500);
  assert.equal(filas.reduce((x, y) => x + y, 0), (2499 * 2500) / 2);
  assert.deepEqual(pedidos.at(-1), [2500, 3499]);
  assert.deepEqual(await todasLasFilas(async () => null), []);
  assert.equal((await todasLasFilas(async () => [1, 2, 3], 3, 7)).length, 9); // corta en el máximo aunque el origen no termine
});
