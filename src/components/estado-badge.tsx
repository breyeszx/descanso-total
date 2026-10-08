import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ESTADOS: Record<string, { label: string; className: string }> = {
  // departamentos
  disponible: { label: "Disponible", className: "bg-green-100 text-green-800 border-green-200" },
  reservado: { label: "Reservado", className: "bg-blue-100 text-blue-800 border-blue-200" },
  ocupado: { label: "Ocupado", className: "bg-amber-100 text-amber-800 border-amber-200" },
  en_mantencion: { label: "En mantención", className: "bg-purple-100 text-purple-800 border-purple-200" },
  inactivo: { label: "Inactivo", className: "bg-gray-100 text-gray-700 border-gray-200" },
  // reservas
  pendiente_pago: { label: "Pendiente de pago", className: "bg-amber-100 text-amber-800 border-amber-200" },
  confirmada: { label: "Confirmada", className: "bg-blue-100 text-blue-800 border-blue-200" },
  en_curso: { label: "En curso", className: "bg-green-100 text-green-800 border-green-200" },
  finalizada: { label: "Finalizada", className: "bg-gray-100 text-gray-700 border-gray-200" },
  cancelada: { label: "Cancelada", className: "bg-red-100 text-red-800 border-red-200" },
  no_show: { label: "No se presentó", className: "bg-red-100 text-red-800 border-red-200" },
  // pagos
  pendiente: { label: "Pendiente", className: "bg-amber-100 text-amber-800 border-amber-200" },
  aprobado: { label: "Aprobado", className: "bg-green-100 text-green-800 border-green-200" },
  rechazado: { label: "Rechazado", className: "bg-red-100 text-red-800 border-red-200" },
  anulado: { label: "Anulado", className: "bg-gray-100 text-gray-700 border-gray-200" },
  // inventario
  bueno: { label: "Bueno", className: "bg-green-100 text-green-800 border-green-200" },
  deteriorado: { label: "Deteriorado", className: "bg-amber-100 text-amber-800 border-amber-200" },
  en_reparacion: { label: "En reparación", className: "bg-purple-100 text-purple-800 border-purple-200" },
  baja: { label: "Dado de baja", className: "bg-gray-100 text-gray-700 border-gray-200" },
  // mantenciones
  programada: { label: "Programada", className: "bg-blue-100 text-blue-800 border-blue-200" },
  completada: { label: "Completada", className: "bg-gray-100 text-gray-700 border-gray-200" },
};

export function estadoLabel(estado: string) {
  return ESTADOS[estado]?.label ?? estado;
}

export function EstadoBadge({ estado, className }: { estado: string; className?: string }) {
  const e = ESTADOS[estado] ?? { label: estado, className: "" };
  return (
    <Badge variant="outline" className={cn("font-medium", e.className, className)}>
      {e.label}
    </Badge>
  );
}
