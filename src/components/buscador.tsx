import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hoyISO } from "@/lib/format";

type Props = {
  zonas: { id: number; nombre: string }[];
  valores?: { inicio?: string; fin?: string; zona?: string; huespedes?: string };
  compacto?: boolean;
};

export function Buscador({ zonas, valores = {}, compacto }: Props) {
  const hoy = hoyISO();
  return (
    <form action="/departamentos" className={compacto ? "grid gap-3 text-foreground sm:grid-cols-5" : "grid gap-3 rounded-xl border bg-background p-4 text-foreground shadow-sm sm:grid-cols-5"}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="zona">Zona</Label>
        <select id="zona" name="zona" defaultValue={valores.zona ?? ""} className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground">
          <option value="">Todas</option>
          {zonas.map((z) => (
            <option key={z.id} value={z.id}>{z.nombre}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="inicio">Llegada</Label>
        <Input id="inicio" name="inicio" type="date" min={hoy} defaultValue={valores.inicio} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fin">Salida</Label>
        <Input id="fin" name="fin" type="date" min={hoy} defaultValue={valores.fin} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="huespedes">Huéspedes</Label>
        <Input id="huespedes" name="huespedes" type="number" min={1} max={12} defaultValue={valores.huespedes ?? "2"} />
      </div>
      <div className="flex items-end">
        <Button type="submit" className="w-full">Buscar</Button>
      </div>
    </form>
  );
}
