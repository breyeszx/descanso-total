import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { formatCLP } from "@/lib/format";

export type DepCard = {
  id: number;
  nombre: string;
  zona_nombre: string | null;
  capacidad_max: number;
  dormitorios: number;
  banos: number;
  tarifa_base: number;
  amenidades: string[];
  foto_url: string | null;
};

export function DepartamentoCard({ dep, query }: { dep: DepCard; query?: string }) {
  return (
    <Link href={`/departamentos/${dep.id}${query ?? ""}`} className="group flex flex-col overflow-hidden rounded-xl border bg-background transition hover:shadow-md">
      <div className="relative aspect-4/3 bg-muted">
        {dep.foto_url ? (
          <Image src={dep.foto_url} alt={dep.nombre} fill unoptimized className="object-cover transition group-hover:scale-[1.02]" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Sin foto</div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <p className="text-xs text-muted-foreground">{dep.zona_nombre}</p>
          <h3 className="font-semibold">{dep.nombre}</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          {dep.capacidad_max} huéspedes · {dep.dormitorios} dorm. · {dep.banos} baño{dep.banos === 1 ? "" : "s"}
        </p>
        <div className="flex flex-wrap gap-1">
          {dep.amenidades.slice(0, 3).map((a) => (
            <Badge key={a} variant="secondary" className="capitalize">{a}</Badge>
          ))}
        </div>
        <p className="mt-auto pt-2 text-sm">
          <span className="text-lg font-semibold">{formatCLP(dep.tarifa_base)}</span> <span className="text-muted-foreground">/ noche</span>
        </p>
      </div>
    </Link>
  );
}
