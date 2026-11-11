import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Tonos semánticos definidos en globals.css; se adaptan solos al modo oscuro. */
const TONO = {
  exito: "border-exito/25 bg-exito/10 text-exito",
  aviso: "border-aviso/30 bg-aviso/10 text-aviso",
  info: "border-primary/25 bg-primary/10 text-primary",
  taller: "border-taller/25 bg-taller/10 text-taller",
  peligro: "border-peligro/25 bg-peligro/10 text-peligro",
  neutro: "border-border bg-muted text-muted-foreground",
} as const;

const ESTADOS: Record<string, { label: string; tono: keyof typeof TONO }> = {
  // departamentos
  disponible: { label: "Disponible", tono: "exito" },
  reservado: { label: "Reservado", tono: "info" },
  ocupado: { label: "Ocupado", tono: "aviso" },
  en_mantencion: { label: "En mantención", tono: "taller" },
  inactivo: { label: "Inactivo", tono: "neutro" },
  // reservas
  pendiente_pago: { label: "Pendiente de pago", tono: "aviso" },
  confirmada: { label: "Confirmada", tono: "info" },
  en_curso: { label: "En curso", tono: "exito" },
  finalizada: { label: "Finalizada", tono: "neutro" },
  cancelada: { label: "Cancelada", tono: "peligro" },
  no_show: { label: "No se presentó", tono: "peligro" },
  // pagos
  pendiente: { label: "Pendiente", tono: "aviso" },
  aprobado: { label: "Aprobado", tono: "exito" },
  rechazado: { label: "Rechazado", tono: "peligro" },
  anulado: { label: "Anulado", tono: "neutro" },
  // inventario
  bueno: { label: "Bueno", tono: "exito" },
  deteriorado: { label: "Deteriorado", tono: "aviso" },
  en_reparacion: { label: "En reparación", tono: "taller" },
  baja: { label: "Dado de baja", tono: "neutro" },
  // mantenciones
  programada: { label: "Programada", tono: "info" },
  completada: { label: "Completada", tono: "neutro" },
};

export function estadoLabel(estado: string) {
  return ESTADOS[estado]?.label ?? estado;
}

export function EstadoBadge({ estado, className }: { estado: string; className?: string }) {
  const e = ESTADOS[estado];
  return (
    <Badge variant="outline" className={cn("font-medium", e && TONO[e.tono], className)}>
      {e?.label ?? estado}
    </Badge>
  );
}
