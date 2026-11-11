import { ClienteForm } from "../cliente-form";

export const metadata = { title: "Nuevo cliente" };

export default function NuevoClientePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">Nuevo cliente</h1>
      <ClienteForm />
    </div>
  );
}
