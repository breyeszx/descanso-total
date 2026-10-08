"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

export function AutoSubmit({ url, token }: { url: string; token: string }) {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const t = setTimeout(() => ref.current?.submit(), 800);
    return () => clearTimeout(t);
  }, []);
  return (
    <form ref={ref} method="POST" action={url}>
      <input type="hidden" name="token_ws" value={token} />
      <Button type="submit">Ir a Webpay</Button>
    </form>
  );
}
