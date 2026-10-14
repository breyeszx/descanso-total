import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { formatCLP, formatDate, formatDateTime } from "@/lib/format";
import { MESES, type Reporte } from "@/lib/reportes";

const s = StyleSheet.create({
  page: { padding: 36, fontSize: 9, fontFamily: "Helvetica", color: "#18181b" },
  header: { flexDirection: "row", justifyContent: "space-between", borderBottom: "2 solid #0f766e", paddingBottom: 8, marginBottom: 12 },
  brand: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#0f766e" },
  title: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  h2: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0f766e", marginTop: 10, marginBottom: 4 },
  kpis: { flexDirection: "row", gap: 8 },
  kpi: { flex: 1, border: "1 solid #e4e4e7", borderRadius: 4, padding: 6 },
  kpiV: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  muted: { color: "#71717a" },
  tr: { flexDirection: "row", borderBottom: "1 solid #e4e4e7", paddingVertical: 3 },
  th: { fontFamily: "Helvetica-Bold", backgroundColor: "#f4f4f5" },
  c: { flex: 1, paddingHorizontal: 3 },
  cw: { flex: 2, paddingHorizontal: 3 },
  r: { textAlign: "right" },
  footer: { position: "absolute", bottom: 24, left: 36, right: 36, fontSize: 8, color: "#71717a", textAlign: "center" },
});

const Fila = ({ cells, head, wide = 0 }: { cells: (string | number)[]; head?: boolean; wide?: number }) => (
  <View style={head ? [s.tr, s.th] : s.tr}>
    {cells.map((c, i) => (
      <Text key={i} style={[i === wide ? s.cw : s.c, i > wide ? s.r : {}]}>{String(c)}</Text>
    ))}
  </View>
);

export function ReporteDocument({ r }: { r: Reporte }) {
  return (
    <Document title={`Reporte ${r.desde} a ${r.hasta}`} author="Descanso Total">
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View><Text style={s.brand}>Descanso Total</Text><Text style={s.muted}>Informe de reservas, ganancias y ocupación</Text></View>
          <View style={{ alignItems: "flex-end" }}><Text style={s.title}>{formatDate(r.desde)} al {formatDate(r.hasta)}</Text><Text style={s.muted}>{r.dias} día(s) · emitido {formatDateTime(new Date())}</Text></View>
        </View>

        <View style={s.kpis}>
          {[["Ingresos", formatCLP(r.totales.ingresos)], ["Egresos", formatCLP(r.totales.egresos)], ["Resultado", formatCLP(r.totales.resultado)], ["Reservas", String(r.totales.reservas)], ["Ocupación", `${r.totales.ocupacion}%`]].map(([t, v]) => (
            <View key={t} style={s.kpi}><Text style={s.muted}>{t}</Text><Text style={s.kpiV}>{v}</Text></View>
          ))}
        </View>

        <Text style={s.h2}>Por zona</Text>
        <Fila head cells={["Zona", "Reservas", "Noches", "Ingresos", "Egresos", "Resultado"]} />
        {r.zonas.map((z) => <Fila key={z.zona} cells={[z.zona, z.reservas, z.noches, formatCLP(z.ingresos), formatCLP(z.egresos), formatCLP(z.ingresos - z.egresos)]} />)}

        <Text style={s.h2}>Por departamento</Text>
        <Fila head cells={["Departamento", "Reservas", "Noches", "Ocupación", "Ingresos", "Egresos"]} />
        {r.departamentos.map((d) => <Fila key={d.departamento_id} cells={[`${d.codigo} ${d.departamento}`, d.reservas, d.noches, `${d.ocupacion}%`, formatCLP(d.ingresos), formatCLP(d.egresos)]} />)}

        <Text style={s.h2}>Servicios más contratados</Text>
        {r.servicios.length ? (
          <>
            <Fila head cells={["Servicio", "Tipo", "Cantidad", "Monto"]} />
            {r.servicios.map((x) => <Fila key={x.servicio} cells={[x.servicio, x.tipo, x.cantidad, formatCLP(x.monto)]} />)}
          </>
        ) : <Text style={s.muted}>Sin servicios en el período.</Text>}

        <Text style={s.h2}>Temporadas {r.desde.slice(0, 4)}</Text>
        <Fila head cells={["Mes", "Ingresos", "Egresos", "Noches", "Ocupación"]} wide={0} />
        {r.mensual.map((m) => <Fila key={m.mes} cells={[MESES[m.mes - 1], formatCLP(m.ingresos), formatCLP(m.egresos), m.noches, `${m.ocupacion}%`]} />)}

        <Text style={s.footer}>Descanso Total S.A. · Montos en pesos chilenos (CLP) · Hora oficial de Chile Continental</Text>
      </Page>
    </Document>
  );
}

export const generarReportePdf = (r: Reporte) => renderToBuffer(<ReporteDocument r={r} />);
