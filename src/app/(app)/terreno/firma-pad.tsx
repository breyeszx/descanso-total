"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

/** Lienzo de firma táctil. Guarda la imagen PNG (data URL) en un input oculto `firma`. */
export function FirmaPad({ name = "firma" }: { name?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dibujando = useRef(false);
  const [tieneTrazo, setTieneTrazo] = useState(false);

  useEffect(() => {
    const c = canvasRef.current!;
    const ratio = window.devicePixelRatio || 1;
    c.width = c.offsetWidth * ratio;
    c.height = c.offsetHeight * ratio;
    const ctx = c.getContext("2d")!;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111";
  }, []);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const inicio = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    dibujando.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    canvasRef.current!.setPointerCapture(e.pointerId);
  };
  const mover = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dibujando.current) return;
    e.preventDefault();
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setTieneTrazo(true);
  };
  const fin = () => {
    if (!dibujando.current) return;
    dibujando.current = false;
    if (inputRef.current) inputRef.current.value = canvasRef.current!.toDataURL("image/png");
  };
  const limpiar = () => {
    const c = canvasRef.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    if (inputRef.current) inputRef.current.value = "";
    setTieneTrazo(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <canvas
        ref={canvasRef}
        className="h-40 w-full touch-none rounded-lg border bg-white"
        onPointerDown={inicio}
        onPointerMove={mover}
        onPointerUp={fin}
        onPointerLeave={fin}
        onPointerCancel={fin}
        aria-label="Área de firma"
      />
      <input ref={inputRef} type="hidden" name={name} />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{tieneTrazo ? "Firma registrada" : "El cliente firma aquí con el dedo o lápiz"}</span>
        <Button type="button" variant="ghost" size="sm" onClick={limpiar}>Limpiar</Button>
      </div>
    </div>
  );
}
