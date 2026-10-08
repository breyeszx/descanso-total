import { requirePerfil } from "@/lib/auth";

export default async function TerrenoLayout({ children }: { children: React.ReactNode }) {
  await requirePerfil(["funcionario", "admin"]);
  return <>{children}</>;
}
