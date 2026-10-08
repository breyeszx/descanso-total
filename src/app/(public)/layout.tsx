import { SiteHeader } from "@/components/site-header";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      <footer className="border-t bg-background py-6 text-center text-xs text-muted-foreground">
        Descanso Total S.A. · Arriendo de departamentos turísticos en Chile
      </footer>
    </div>
  );
}
