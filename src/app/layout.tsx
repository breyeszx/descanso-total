import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: { default: "Descanso Total", template: "%s | Descanso Total" },
  description: "Arriendo de departamentos turísticos, transporte y tours.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={geist.variable}>
      <body className="font-sans antialiased">
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}
