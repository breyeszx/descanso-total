import { requirePerfil } from "@/lib/auth";

export default async function SoloAdminLayout({ children }: { children: React.ReactNode }) {
  await requirePerfil(["admin"]);
  return <>{children}</>;
}
