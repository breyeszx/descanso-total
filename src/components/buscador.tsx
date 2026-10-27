import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hoyISO } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  zonas: { id: number; nombre: string }[];
  valores?: { inicio?: string; fin?: string; zona?: string; huespedes?: string };
  /** Versión en una fila para la página de resultados */
  compacto?: boolean;
};

export function Buscador({ zonas, valores = {}, compacto }: Props) {
  const hoy = hoyISO();
  return (
    <form
      action="/departamentos"
      className={cn(
        "grid gap-3 text-foreground",
        compacto
          ? "rounded-xl border bg-card p-3 sm:grid-cols-[1.4fr_1fr_1fr_.8fr_auto] sm:items-end"
          : "rounded-2xl border bg-card p-4 shadow-xs sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_.8fr]",
      )}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="zona">Zona</Label>
        <select
          id="zona"
          name="zona"
          defaultValue={valores.zona ?? ""}
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">Todas las zonas</option>
          {zonas.map((z) => (
            <option key={z.id} value={z.id}>{z.nombre}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="inicio">Llegada</Label>
        <Input id="inicio" name="inicio" type="date" min={hoy} defaultValue={valores.inicio} className="h-10" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fin">Salida</Label>
        <Input id="fin" name="fin" type="date" min={hoy} defaultValue={valores.fin} className="h-10" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="huespedes">Huéspedes</Label>
        <Input id="huespedes" name="huespedes" type="number" min={1} max={12} defaultValue={valores.huespedes ?? "2"} className="h-10" />
      </div>
      <Button type="submit" size="lg" className={cn("h-11 text-[15px]", compacto ? "sm:h-10" : "sm:col-span-2 lg:col-span-4")}>
        Buscar disponibilidad
      </Button>
    </form>
  );
}
