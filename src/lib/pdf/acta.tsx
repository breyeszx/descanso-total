import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { formatCLP, formatDate, formatDateTime } from "@/lib/format";

export type ChecklistItem = { item_id: number | null; nombre: string; estado: "bueno" | "danado" | "faltante"; observacion?: string; cargo?: number };

export type ActaData = {
  tipo: "check_in" | "check_out";
  codigo: string;
  fecha: string;
  departamento: { nombre: string; direccion: string; zona: string };
  cliente: { nombre: string; rut: string | null; email: string; telefono: string | null };
  estadia: { inicio: string; fin: string; noches: number; huespedes: number };
  acompanantes: { nombre: string; documento: string }[];
  checklist: ChecklistItem[];
  cargos: { descripcion: string; monto: number }[];
  liquidacion: { total: number; pagadoAntes: number; cobradoAhora: number; saldo: number };
  observaciones: string | null;
  funcionario: string;
  firmaDataUrl: string | null;
  conformidad: boolean;
};

const s = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica", color: "#18181b" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottom: "2 solid #0f766e", paddingBottom: 8, marginBottom: 14 },
  brand: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#0f766e" },
  title: { fontSize: 13, fontFamily: "Helvetica-Bold" },
  section: { marginBottom: 10 },
  h2: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 4, color: "#0f766e" },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  grid: { flexDirection: "row", gap: 16 },
  col: { flex: 1 },
  muted: { color: "#71717a" },
  table: { border: "1 solid #e4e4e7", borderRadius: 4 },
  tr: { flexDirection: "row", borderBottom: "1 solid #e4e4e7", paddingVertical: 3, paddingHorizontal: 4 },
  th: { fontFamily: "Helvetica-Bold", backgroundColor: "#f4f4f5" },
  c1: { flex: 3 },
  c2: { flex: 1.2 },
  c3: { flex: 3 },
  c4: { flex: 1.2, textAlign: "right" },
  total: { fontFamily: "Helvetica-Bold", fontSize: 11 },
  firmaBox: { marginTop: 14, flexDirection: "row", gap: 24 },
  firma: { width: 200, height: 70, borderBottom: "1 solid #18181b" },
  footer: { position: "absolute", bottom: 24, left: 36, right: 36, fontSize: 8, color: "#71717a", textAlign: "center" },
});

const ESTADO: Record<ChecklistItem["estado"], string> = { bueno: "Bueno", danado: "Dañado", faltante: "Faltante" };

export function ActaDocument({ d }: { d: ActaData }) {
  const esIn = d.tipo === "check_in";
  return (
    <Document title={`Acta ${esIn ? "Check-in" : "Check-out"} ${d.codigo}`} author="Descanso Total">
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.brand}>Descanso Total</Text>
            <Text style={s.muted}>Arriendo de departamentos turísticos</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.title}>ACTA DE {esIn ? "CHECK-IN" : "CHECK-OUT"}</Text>
            <Text>Reserva {d.codigo}</Text>
            <Text style={s.muted}>{formatDateTime(d.fecha)}</Text>
          </View>
        </View>

        <View style={[s.section, s.grid]}>
          <View style={s.col}>
            <Text style={s.h2}>Departamento</Text>
            <Text>{d.departamento.nombre}</Text>
            <Text style={s.muted}>{d.departamento.direccion}</Text>
            <Text style={s.muted}>{d.departamento.zona}</Text>
          </View>
          <View style={s.col}>
            <Text style={s.h2}>Cliente</Text>
            <Text>{d.cliente.nombre}</Text>
            <Text style={s.muted}>{d.cliente.rut ?? "Sin RUT"} · {d.cliente.email}</Text>
            {d.cliente.telefono ? <Text style={s.muted}>{d.cliente.telefono}</Text> : null}
          </View>
          <View style={s.col}>
            <Text style={s.h2}>Estadía</Text>
            <Text>{formatDate(d.estadia.inicio)} al {formatDate(d.estadia.fin)}</Text>
            <Text style={s.muted}>{d.estadia.noches} noche(s) · {d.estadia.huespedes} huésped(es)</Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.h2}>Huéspedes</Text>
          <Text>{d.cliente.nombre} (titular)</Text>
          {d.acompanantes.map((a, i) => (
            <Text key={i}>{a.nombre} · {a.documento}</Text>
          ))}
        </View>

        <View style={s.section}>
          <Text style={s.h2}>Estado del departamento e inventario</Text>
          <View style={s.table}>
            <View style={[s.tr, s.th]}>
              <Text style={s.c1}>Ítem</Text>
              <Text style={s.c2}>Estado</Text>
              <Text style={s.c3}>Observación</Text>
              {!esIn ? <Text style={s.c4}>Cargo</Text> : null}
            </View>
            {d.checklist.map((c, i) => (
              <View key={i} style={s.tr}>
                <Text style={s.c1}>{c.nombre}</Text>
                <Text style={s.c2}>{ESTADO[c.estado]}</Text>
                <Text style={s.c3}>{c.observacion ?? ""}</Text>
                {!esIn ? <Text style={s.c4}>{c.cargo ? formatCLP(c.cargo) : ""}</Text> : null}
              </View>
            ))}
            {d.checklist.length === 0 ? (
              <View style={s.tr}><Text style={s.muted}>Sin ítems de inventario registrados.</Text></View>
            ) : null}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.h2}>Liquidación</Text>
          {d.cargos.map((c, i) => (
            <View key={i} style={s.row}><Text>{c.descripcion}</Text><Text>{formatCLP(c.monto)}</Text></View>
          ))}
          <View style={s.row}><Text>Total de la estadía</Text><Text>{formatCLP(d.liquidacion.total)}</Text></View>
          <View style={s.row}><Text>Pagado previamente</Text><Text>{formatCLP(d.liquidacion.pagadoAntes)}</Text></View>
          <View style={s.row}><Text>Cobrado en este acto</Text><Text>{formatCLP(d.liquidacion.cobradoAhora)}</Text></View>
          <View style={[s.row, s.total]}><Text>Saldo pendiente</Text><Text>{formatCLP(d.liquidacion.saldo)}</Text></View>
        </View>

        {d.observaciones ? (
          <View style={s.section}>
            <Text style={s.h2}>Observaciones</Text>
            <Text>{d.observaciones}</Text>
          </View>
        ) : null}

        <View style={s.section}>
          <Text>
            {d.conformidad
              ? `El cliente declara su conformidad con el estado del departamento ${esIn ? "al momento de la entrega" : "al momento de la devolución"} y con la liquidación indicada.`
              : "El cliente NO firmó conformidad. Ver observaciones."}
          </Text>
        </View>

        <View style={s.firmaBox}>
          <View>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- Image de react-pdf no admite alt */}
            {d.firmaDataUrl ? <Image src={d.firmaDataUrl} style={s.firma} /> : <View style={s.firma} />}
            <Text style={s.muted}>Firma cliente · {d.cliente.nombre}</Text>
          </View>
          <View>
            <View style={s.firma} />
            <Text style={s.muted}>Funcionario · {d.funcionario}</Text>
          </View>
        </View>

        <Text style={s.footer}>Descanso Total S.A. · Documento generado electrónicamente el {formatDateTime(d.fecha)} · Hora oficial de Chile Continental</Text>
      </Page>
    </Document>
  );
}

export async function generarActaPdf(d: ActaData): Promise<Buffer> {
  return renderToBuffer(<ActaDocument d={d} />);
}
