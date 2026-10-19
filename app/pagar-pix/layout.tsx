import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pagar com Pix | FitGarden",
  description: "Copie o Pix ou escaneie o QR Code para pagar seu pedido FitGarden.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function PagamentoLayout({ children }: { children: React.ReactNode }) { return children; }
