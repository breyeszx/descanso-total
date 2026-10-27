import Link from "next/link";
import { Marca } from "@/components/app-nav";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <Marca href="/" />
      {children}
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">Volver al sitio</Link>
    </main>
  );
}
