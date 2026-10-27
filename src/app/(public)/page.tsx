import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Buscador } from "@/components/buscador";
import { DepartamentoCard } from "@/components/departamento-card";
import { ZonasLatitud, type ZonaLatitud } from "@/components/zonas-latitud";
import { buscarDepartamentos } from "@/lib/catalogo";
import { infoZona } from "@/lib/zonas";

const PASOS = [
  {
    titulo: "Elige fechas y zona",
    texto: "El buscador muestra solo los departamentos libres para esas noches y esa cantidad de huéspedes.",
  },
  {
    titulo: "Confirma con el 30 % de anticipo",
    texto: "Pagas por Webpay y recibes la confirmación al correo. Puedes agregar acompañantes, traslados y tours.",
  },
  {
    titulo: "Paga el saldo al llegar",
    texto: "En el check-in firmas el acta en tablet y pagas el resto en efectivo, transferencia o tarjeta.",
  },
];

export default async function HomePage() {
  const supabase = await createClient();
  const [{ data: zonas }, departamentos] = await Promise.all([
    supabase.from("zonas").select("id, nombre, region").eq("activa", true).order("nombre"),
    buscarDepartamentos({}),
  ]);

  const portada = departamentos.find((d) => d.foto_url && d.nombre === "Lago Pucón") ?? departamentos.find((d) => d.foto_url) ?? null;

  const zonasBanda: ZonaLatitud[] = (zonas ?? []).map((z) => {
    const deZona = departamentos.filter((d) => d.zona_nombre === z.nombre);
    const info = infoZona(z.nombre);
    return {
      id: z.id,
      nombre: z.nombre,
      region: z.region,
      latitud: info.latitud,
      destacado: info.destacado,
      cantidad: deZona.length,
      foto_url: deZona.find((d) => d.foto_url)?.foto_url ?? null,
    };
  });

  return (
    <>
      <section className="mx-auto grid max-w-6xl gap-8 px-4 pt-6 pb-12 lg:grid-cols-[1.05fr_1fr] lg:items-stretch lg:pt-10 lg:pb-14">
        <figure className="relative m-0 aspect-16/10 overflow-hidden rounded-2xl bg-secondary lg:aspect-auto lg:min-h-[440px]">
          {portada?.foto_url && (
            <Image src={portada.foto_url} alt={portada.nombre} fill unoptimized priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          )}
          {portada && (
            <figcaption className="absolute bottom-3.5 left-4 rounded-md bg-background/85 px-2.5 py-1 text-[13px] text-foreground backdrop-blur">
              {portada.nombre}, {portada.zona_nombre}
            </figcaption>
          )}
        </figure>
        <div className="flex min-w-0 flex-col justify-center gap-6">
          <h1 className="text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl">Del desierto a los lagos, un departamento para tu descanso.</h1>
          <p className="max-w-[46ch] text-lg text-muted-foreground">
            {departamentos.length} departamentos equipados en {zonasBanda.length} zonas de Chile. Reservas en línea con un anticipo del 30 % y sumas traslados y tours en la misma reserva.
          </p>
          <Buscador zonas={zonas ?? []} />
        </div>
      </section>

      <ZonasLatitud zonas={zonasBanda} />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-14">
        <div className="mb-6 flex items-baseline justify-between gap-4">
          <h2 className="text-3xl font-semibold sm:text-4xl">Los departamentos</h2>
          <Link href="/departamentos" className="text-[15px] text-muted-foreground hover:text-foreground">Ver todos</Link>
        </div>
        {departamentos.length === 0 ? (
          <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
            Aún no hay departamentos publicados. Vuelve pronto.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {departamentos.slice(0, 8).map((d) => (
              <DepartamentoCard key={d.id} dep={d} />
            ))}
          </div>
        )}
      </section>

      <section id="como-reservar" className="scroll-mt-16 border-y bg-card">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-14">
          <h2 className="mb-7 text-3xl font-semibold sm:text-4xl">Cómo se reserva</h2>
          <ol className="grid gap-6 md:grid-cols-3">
            {PASOS.map((p, i) => (
              <li key={p.titulo} className="grid grid-cols-[44px_1fr] items-start gap-3.5">
                <span aria-hidden className="grid size-11 place-items-center rounded-full bg-primary font-heading text-xl font-semibold text-primary-foreground">{i + 1}</span>
                <div>
                  <h3 className="text-xl font-semibold leading-tight">{p.titulo}</h3>
                  <p className="mt-1.5 max-w-[34ch] text-[15px] text-muted-foreground">{p.texto}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
