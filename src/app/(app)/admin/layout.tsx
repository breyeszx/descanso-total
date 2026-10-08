import { requirePerfil } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requirePerfil(["admin"]);
  return <>{children}</>;
}
