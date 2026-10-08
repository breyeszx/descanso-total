/** Normaliza un RUT chileno a formato 12345678-9 (sin puntos, DV en mayúscula). */
export function normalizarRut(input: string) {
  const limpio = input.replace(/[^0-9kK]/g, "").toUpperCase();
  if (limpio.length < 2) return "";
  return `${limpio.slice(0, -1)}-${limpio.slice(-1)}`;
}

export function validarRut(input: string) {
  const rut = normalizarRut(input);
  const m = rut.match(/^(\d{7,8})-([0-9K])$/);
  if (!m) return false;
  let suma = 0;
  let mul = 2;
  for (const c of m[1].split("").reverse()) {
    suma += Number(c) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const resto = 11 - (suma % 11);
  const dv = resto === 11 ? "0" : resto === 10 ? "K" : String(resto);
  return dv === m[2];
}

export function formatearRut(rut: string | null | undefined) {
  if (!rut) return "—";
  const [num, dv] = normalizarRut(rut).split("-");
  if (!num) return rut;
  return `${Number(num).toLocaleString("es-CL")}-${dv}`;
}
