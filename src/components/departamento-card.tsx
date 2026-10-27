import Link from "next/link";
import Image from "next/image";
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

function plural(n: number, uno: string, varios: string) {
  return `${n} ${n === 1 ? uno : varios}`;
}

export function DepartamentoCard({ dep, query }: { dep: DepCard; query?: string }) {
  return (
    <Link
      href={`/departamentos/${dep.id}${query ?? ""}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground outline-none transition-colors hover:border-ring/60 focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="relative aspect-4/3 overflow-hidden bg-secondary">
        {dep.foto_url ? (
          <Image
            src={dep.foto_url}
            alt={dep.nombre}
            fill
            unoptimized
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 motion-safe:group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Sin foto</div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <p className="text-[13px] text-muted-foreground">{dep.zona_nombre}</p>
          <h3 className="text-xl font-semibold leading-tight">{dep.nombre}</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {plural(dep.capacidad_max, "huésped", "huéspedes")}, {plural(dep.dormitorios, "dormitorio", "dormitorios")}, {plural(dep.banos, "baño", "baños")}
        </p>
        {dep.amenidades.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {dep.amenidades.slice(0, 3).map((a) => (
              <li key={a} className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">{a}</li>
            ))}
          </ul>
        )}
        <p className="mt-auto flex items-baseline gap-1.5 pt-2">
          <span className="font-heading text-2xl font-semibold tabular-nums">{formatCLP(dep.tarifa_base)}</span>
          <span className="text-[13px] text-muted-foreground">por noche</span>
        </p>
      </div>
    </Link>
  );
}
