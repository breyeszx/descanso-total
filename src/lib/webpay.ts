import { Environment, IntegrationApiKeys, IntegrationCommerceCodes, Options, WebpayPlus } from "transbank-sdk";

/**
 * Transacción Webpay Plus. Sin WEBPAY_COMMERCE_CODE/WEBPAY_API_KEY usa el ambiente de integración
 * de Transbank (tarjetas de prueba, sin dinero real).
 */
export function webpayTransaction() {
  const code = process.env.WEBPAY_COMMERCE_CODE;
  const key = process.env.WEBPAY_API_KEY;
  const options =
    code && key
      ? new Options(code, key, Environment.Production)
      : new Options(IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY, Environment.Integration);
  return new WebpayPlus.Transaction(options);
}

export const webpayEsIntegracion = !(process.env.WEBPAY_COMMERCE_CODE && process.env.WEBPAY_API_KEY);

export function appUrl(path = "") {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return base + path;
}
