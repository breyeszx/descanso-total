import { toast } from "sonner";

export type Resultado = { error?: string } | void;

/** Ejecuta una Server Action lanzada desde un botón y muestra el error (o el éxito) como aviso. */
export async function conAviso(accion: Promise<Resultado>, exito?: string) {
  try {
    const r = await accion;
    if (r?.error) toast.error(r.error);
    else if (exito) toast.success(exito);
  } catch {
    toast.error("No se pudo completar la acción. Intenta nuevamente.");
  }
}
