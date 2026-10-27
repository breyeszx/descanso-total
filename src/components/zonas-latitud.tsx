import Link from "next/link";
import Image from "next/image";
import { formatLatitud } from "@/lib/zonas";

export type ZonaLatitud = {
  id: number;
  nombre: string;
  region: string | null;
  latitud: number;
  destacado: string;
  cantidad: number;
  foto_url: string | null;
};

/** Banda de zonas ordenadas de norte a sur, con una regla de latitud a escala. */
export function ZonasLatitud({ zonas }: { zonas: ZonaLatitud[] }) {
  const ordenadas = [...zonas].sort((a, b) => a.latitud - b.latitud);
  const conLat = ordenadas.filter((z) => Number.isFinite(z.latitud));
  const min = Math.min(...conLat.map((z) => z.latitud));
  const max = Math.max(...conLat.map((z) => z.latitud));
  const pos = (lat: number) => (max === min ? 50 : 3 + ((lat - min) / (max - min)) * 94);

  return (
    <section id="zonas" className="banda-zonas scroll-mt-16">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-14">
        <div className="mb-7 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h2 className="text-3xl font-semibold sm:text-4xl">
            {conLat.length >= 2
              ? `${conLat.length} zonas, de los ${Math.round(min)}° a los ${Math.round(max)}° de latitud sur`
              : "Nuestras zonas"}
          </h2>
          <p className="max-w-md text-[15px] opacity-80">
            Ordenadas como en el mapa, del norte al sur. Cada zona tiene sus departamentos y sus tours propios.
          </p>
        </div>

        {conLat.length >= 2 && (
          <div aria-hidden className="relative mb-5 hidden h-14 lg:block">
            <div className="absolute inset-x-0 top-[26px] h-0.5 bg-current opacity-40" />
            {conLat.map((z) => (
              <div
                key={z.id}
                className="absolute top-0 flex -translate-x-1/2 flex-col items-center gap-1 font-heading text-sm font-semibold whitespace-nowrap tabular-nums"
                style={{ left: `${pos(z.latitud)}%` }}
              >
                {formatLatitud(z.latitud)}
                <span className="size-2.5 rounded-full bg-current" />
              </div>
            ))}
            <span className="absolute top-9 left-0 text-xs opacity-70">Norte</span>
            <span className="absolute top-9 right-0 text-xs opacity-70">Sur</span>
          </div>
        )}

        <ul className="grid grid-cols-2 gap-3.5 lg:grid-cols-5">
          {ordenadas.map((z, i) => (
            <li key={z.id} className={i === ordenadas.length - 1 && ordenadas.length % 2 === 1 ? "col-span-2 lg:col-span-1" : undefined}>
              <Link href={`/departamentos?zona=${z.id}`} className="group flex flex-col gap-2.5 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                <div className="relative aspect-video overflow-hidden rounded-xl bg-black/10 lg:aspect-4/5">
                  {z.foto_url ? (
                    <Image src={z.foto_url} alt={z.nombre} fill unoptimized sizes="(min-width: 1024px) 20vw, 50vw" className="object-cover transition-transform duration-300 motion-safe:group-hover:scale-[1.03]" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm opacity-70">Sin foto</div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold leading-tight">{z.nombre}</h3>
                  <p className="text-sm opacity-80">
                    {z.region ? `${z.region}. ` : ""}
                    {z.cantidad} {z.cantidad === 1 ? "departamento" : "departamentos"}.
                  </p>
                  {z.destacado && <p className="text-sm opacity-80">{z.destacado}.</p>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
