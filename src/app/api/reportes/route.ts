import { NextResponse, type NextRequest } from "next/server";
import { requirePerfil } from "@/lib/auth";
import { cargarReporte, rangoPeriodo, type Periodo } from "@/lib/reportes";
import { generarReportePdf } from "@/lib/pdf/reporte";

export const dynamic = "force-dynamic";

/** Exporta el reporte del período en PDF (RF22). Solo admin. */
export async function GET(request: NextRequest) {
  await requirePerfil(["admin"]);
  const p = request.nextUrl.searchParams;
  const { desde, hasta } = rangoPeriodo((p.get("periodo") as Periodo) ?? "mes", p.get("fecha") ?? undefined, p.get("hasta") ?? undefined);
  const pdf = await generarReportePdf(await cargarReporte(desde, hasta));
  return new NextResponse(new Uint8Array(pdf), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="reporte-${desde}-${hasta}.pdf"` },
  });
}
