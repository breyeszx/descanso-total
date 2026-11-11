"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormMessage } from "@/components/form/fields";
import { createClient } from "@/lib/supabase/client";
import { MAX_FOTOS_POR_SUBIDA, problemaFoto, TIPOS_FOTO } from "@/lib/fotos";
import type { FormState } from "@/lib/form";
import type { Tables } from "@/lib/supabase/database.types";
import { eliminarFoto, marcarPortada, registrarFotos } from "../actions";

type Foto = Tables<"departamento_fotos"> & { url: string };

export function FotosPanel({ depId, fotos }: { depId: number; fotos: Foto[] }) {
  const [state, setState] = useState<FormState>(undefined);
  const [subiendo, startSubida] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  /** Sube cada archivo directo a Storage con la sesión del admin y luego registra las rutas en la base. */
  function subir(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const archivos = Array.from(inputRef.current?.files ?? []);
    if (!archivos.length) return setState({ error: "Selecciona al menos una imagen" });
    if (archivos.length > MAX_FOTOS_POR_SUBIDA) return setState({ error: `Máximo ${MAX_FOTOS_POR_SUBIDA} fotos por subida` });
    const problema = archivos.map(problemaFoto).find(Boolean);
    if (problema) return setState({ error: problema });

    startSubida(async () => {
      const storage = createClient().storage.from("departamentos");
      const subidas: string[] = [];
      for (const f of archivos) {
        const path = `${depId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${TIPOS_FOTO[f.type]}`;
        const { error } = await storage.upload(path, f, { contentType: f.type });
        if (error) {
          if (subidas.length) await storage.remove(subidas);
          return setState({ error: `No se pudo subir "${f.name}": ${error.message}` });
        }
        subidas.push(path);
      }
      setState(await registrarFotos(depId, subidas));
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <div className="space-y-4">
      <form onSubmit={subir} className="flex flex-wrap items-center gap-2">
        <Input ref={inputRef} type="file" name="fotos" accept="image/jpeg,image/png,image/webp" multiple className="max-w-xs" required />
        <Button type="submit" variant="outline" disabled={subiendo}>{subiendo ? "Subiendo..." : "Subir"}</Button>
        <FormMessage state={state} />
      </form>
      <p className="text-xs text-muted-foreground">JPG, PNG o WebP de hasta 5 MB cada una.</p>
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
