import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FitGarden - Sistema de Gestão",
  description: "Sistema de gestão para marmitas fit",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50`}>
        {children}
        <Toaster position="top-right" richColors className="z-[10000]" />
      </body>
    </html>
  );
}
