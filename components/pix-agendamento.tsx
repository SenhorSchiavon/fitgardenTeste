"use client";

import { useState } from "react";
import { PixCopiaECola } from "@/components/pix-copia-e-cola";
import { QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { gerarPixAgendamento, type PixAgendamento as Pix } from "@/lib/pix-agendamento";

export function PixAgendamento({ agendamentoId, compacto = false }: { agendamentoId: number; compacto?: boolean }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pix, setPix] = useState<Pix[]>([]);
  const [erro, setErro] = useState("");
  async function gerar() {
    setOpen(true); setLoading(true); setErro(""); setPix([]);
    try {
      const resultado = await gerarPixAgendamento(agendamentoId, { usarCodigoSalvo: true });
      setPix(resultado);
    }
    catch (error) { setErro(error instanceof Error ? error.message : "Não foi possível gerar o Pix"); }
    finally { setLoading(false); }
  }
  return <span onClick={event => event.stopPropagation()}>
    <Button type="button" variant="outline" size={compacto ? "icon" : "default"} className={compacto ? "h-9 w-9 border-emerald-200 text-emerald-700 hover:bg-emerald-50" : "w-full"} title="Ver Pix" aria-label="Ver Pix" disabled={loading} onClick={event => { event.preventDefault(); event.stopPropagation(); void gerar(); }}><QrCode className={compacto ? "h-4 w-4" : "mr-2 h-4 w-4"} />{!compacto && "Ver Pix"}</Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90dvh] max-w-md overflow-y-auto"><DialogHeader><DialogTitle>Pix do agendamento</DialogTitle><DialogDescription>Confira o valor e o destinatário no aplicativo do banco antes de pagar.</DialogDescription></DialogHeader>
      {loading ? <p role="status" className="py-6 text-center text-sm">Preparando Pix no Sicredi…</p> : erro ? <div role="alert" className="space-y-3 text-sm text-red-700"><p>{erro}</p><Button type="button" variant="outline" onClick={() => void gerar()}>Tentar novamente</Button></div> : !pix.length ? <p className="py-4 text-sm text-muted-foreground">Este pedido não possui pagamentos Pix pendentes. Confira a forma de pagamento do agendamento.</p> : <>
        {pix.map(item => <section key={item.pagamentoId} className="grid gap-3 rounded-lg border p-3"><p className="text-center font-semibold">{item.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p><PixCopiaECola codigo={item.codigo} /></section>)}
      </>}
    </DialogContent></Dialog>
  </span>;
}
