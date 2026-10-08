import { NextResponse, type NextRequest } from "next/server";
import { ejecutarCronNotificaciones } from "@/lib/notificaciones";

export const dynamic = "force-dynamic";

/** Vercel Cron (ver vercel.json) o llamada manual con `Authorization: Bearer $CRON_SECRET`. */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const resultado = await ejecutarCronNotificaciones();
    return NextResponse.json({ ok: true, ...resultado });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
