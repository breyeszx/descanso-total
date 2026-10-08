"use client";

import { useActionState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormMessage, SubmitButton } from "@/components/form/fields";
import type { Tables } from "@/lib/supabase/database.types";
import { eliminarFoto, marcarPortada, subirFoto } from "../actions";

type Foto = Tables<"departamento_fotos"> & { url: string };

export function FotosPanel({ depId, fotos }: { depId: number; fotos: Foto[] }) {
  const [state, formAction] = useActionState(subirFoto.bind(null, depId), undefined);

  return (
    <div className="space-y-4">
      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <Input type="file" name="fotos" accept="image/*" multiple className="max-w-xs" required />
        <SubmitButton variant="outline">Subir</SubmitButton>
        <FormMessage state={state} />
      </form>
      {fotos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin fotografías todavía.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {fotos.map((f) => (
            <figure key={f.id} className="group relative overflow-hidden rounded-lg border">
              <Image src={f.url} alt="" width={400} height={300} className="aspect-4/3 w-full object-cover" unoptimized />
              {f.es_portada && (
                <span className="absolute top-2 left-2 rounded bg-background/90 px-2 py-0.5 text-xs font-medium">Portada</span>
              )}
              <figcaption className="flex justify-between gap-1 p-1.5">
                {!f.es_portada && (
                  <Button size="sm" variant="ghost" onClick={() => marcarPortada(f.id, depId)}>Portada</Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-auto text-destructive"
                  onClick={() => { if (confirm("¿Eliminar esta foto?")) eliminarFoto(f.id, depId); }}
                >
                  Eliminar
                </Button>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
