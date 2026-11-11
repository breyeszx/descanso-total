import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { emitirActaPdf } from "@/lib/actas";

/** Descarga del acta en PDF. RLS decide quién puede verla (staff o el cliente dueño de la reserva). */
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: acta } = await supabase.from("actas").select("id, tipo, pdf_path, reservas(codigo)").eq("id", Number(id)).single();
  if (!acta) return NextResponse.json({ error: "Acta no encontrada" }, { status: 404 });

  // Si el PDF no se pudo generar al emitir el acta, se genera ahora con los datos guardados
  let pdfPath = acta.pdf_path;
  if (!pdfPath) {
    try {
      pdfPath = await emitirActaPdf(acta.id);
    } catch (e) {
      console.error("acta pdf:", e);
      return NextResponse.json({ error: "No se pudo generar el PDF del acta" }, { status: 500 });
    }
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage.from("actas").download(pdfPath);
  if (error || !data) return NextResponse.json({ error: "No se pudo leer el PDF" }, { status: 500 });

  const nombre = `acta-${acta.tipo.replace("_", "")}-${acta.reservas?.codigo ?? acta.id}.pdf`;
  return new NextResponse(await data.arrayBuffer(), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${nombre}"`,
      "Cache-Control": "private, max-age=0",
    },
  });
}
