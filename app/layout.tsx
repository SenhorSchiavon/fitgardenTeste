import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FitGarden - Sistema de Gestão",
  description: "Sistema de gestão para marmitas fit",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50`}>
        <div className="flex min-h-screen">
          <Sidebar className="hidden md:flex w-64 flex-col" />
          <div className="flex-1 flex flex-col">
            <main className="flex-1 p-6">{children}</main>
          </div>
        </div>
        <Toaster position="top-right" richColors className="z-[10000]" />
      </body>
    </html>
  );
}
