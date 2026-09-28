import { requirePerfil } from "@/lib/auth";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Panel" };

export default async function DashboardPage() {
  const perfil = await requirePerfil();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Hola, {perfil.nombre}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Panel de {perfil.rol}</CardTitle>
          <CardDescription>
            Los módulos de este perfil se habilitarán en las próximas fases.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
