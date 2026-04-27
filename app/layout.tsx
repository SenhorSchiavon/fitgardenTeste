import type { Metadata } from "next";
import { Inter, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans",
});

const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "FitGarden - Sistema de Gestão",
  description: "Sistema de gestão para marmitas fit",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${inter.variable} ${dmSerif.variable}`}>
      <body className="bg-background font-sans antialiased">
        {children}
        <Toaster position="top-right" richColors className="z-[10000]" />
      </body>
    </html>
  );
}
