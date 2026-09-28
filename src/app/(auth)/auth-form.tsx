"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AuthState } from "./actions";

type Props = {
  modo: "login" | "registro";
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
  next?: string;
};

export function AuthForm({ modo, action, next }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const esLogin = modo === "login";

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{esLogin ? "Iniciar sesión" : "Crear cuenta"}</CardTitle>
        <CardDescription>
          {esLogin
            ? "Accede a Descanso Total con tu correo y contraseña."
            : "Regístrate para reservar departamentos y servicios."}
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          {next && <input type="hidden" name="next" value={next} />}
          {!esLogin && (
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre completo</Label>
              <Input id="nombre" name="nombre" autoComplete="name" required />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={esLogin ? "current-password" : "new-password"}
              required
            />
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          {state?.ok && <p className="text-sm text-green-600">{state.ok}</p>}
        </CardContent>
        <CardFooter className="mt-4 flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Procesando..." : esLogin ? "Ingresar" : "Registrarme"}
          </Button>
          <p className="text-sm text-muted-foreground">
            {esLogin ? (
              <>
                ¿No tienes cuenta?{" "}
                <Link href="/registro" className="underline">Regístrate</Link>
              </>
            ) : (
              <>
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="underline">Inicia sesión</Link>
              </>
            )}
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
