"use client";

import { QRCodeSVG } from "qrcode.react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function PixCopiaECola({ codigo }: { codigo: string }) {
  return <>
    <div className="mx-auto rounded-xl bg-white p-4"><QRCodeSVG value={codigo} size={240} marginSize={4} /></div>
    <textarea aria-label="Pix Copia e Cola" readOnly value={codigo} className="h-24 w-full rounded-md border p-3 font-mono text-xs" />
    <Button type="button" onClick={async () => {
      try { await navigator.clipboard.writeText(codigo); toast.success("Pix copiado"); }
      catch { toast.error("Não foi possível copiar. Selecione o código acima."); }
    }}><Copy className="mr-2 h-4 w-4" />Copiar Pix</Button>
  </>;
}
