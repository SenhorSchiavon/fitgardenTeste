"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, QrCode } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { gerarPixAgendamento, mensagemPixAgendamento, type PixAgendamento as Pix } from "@/lib/pix-agendamento";

export function PixAgendamento({ agendamentoId, compacto = false, onGerado }: { agendamentoId: number; compacto?: boolean; onGerado?: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pix, setPix] = useState<Pix[]>([]);
  const [erro, setErro] = useState("");
  async function gerar() {
    setOpen(true); setLoading(true); setErro(""); setPix([]);
    try {
      const resultado = await gerarPixAgendamento(agendamentoId, compacto);
      setPix(resultado);
      if (resultado.length) onGerado?.();
    }
    catch (error) { setErro(error instanceof Error ? error.message : "Não foi possível gerar o Pix"); }
    finally { setLoading(false); }
  }
  return <span onClick={event => event.stopPropagation()}>
    <Button type="button" variant="outline" size={compacto ? "icon" : "default"} className={compacto ? "h-9 w-9 border-emerald-200 text-emerald-700 hover:bg-emerald-50" : "w-full"} title="Gerar / copiar Pix" aria-label="Gerar / copiar Pix" disabled={loading} onClick={() => void gerar()}><QrCode className={compacto ? "h-4 w-4" : "mr-2 h-4 w-4"} />{!compacto && "Gerar / copiar Pix"}</Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90dvh] max-w-md overflow-y-auto"><DialogHeader><DialogTitle>Pix do agendamento</DialogTitle><DialogDescription>{compacto ? "Gera o Pix do saldo pendente e altera sua forma de pagamento para Pix. Pagamentos de plano, voucher e valores já pagos são preservados." : "Somente os pagamentos Pix pendentes deste pedido. O código também acompanha a mensagem de confirmação copiada."}</DialogDescription></DialogHeader>
      {loading ? <p role="status" className="py-6 text-center text-sm">Preparando Pix no Sicredi…</p> : erro ? <div role="alert" className="space-y-3 text-sm text-red-700"><p>{erro}</p><Button variant="outline" onClick={() => void gerar()}>Tentar novamente</Button></div> : !pix.length ? <p className="py-4 text-sm text-muted-foreground">Este pedido não possui pagamentos Pix pendentes. Confira a forma de pagamento do agendamento.</p> : <>
        {pix.map(item => <section key={item.pagamentoId} className="space-y-3 rounded-lg border p-3"><p className="text-center font-semibold">{item.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p><div className="flex justify-center rounded-md bg-white p-2"><QRCodeSVG value={item.codigo} size={220} marginSize={4} /></div><textarea className="h-24 w-full rounded-md border p-2 font-mono text-xs" aria-label={`Pix do pagamento ${item.pagamentoId}`} readOnly value={item.codigo} /><Button className="w-full" onClick={async () => { try { await navigator.clipboard.writeText(item.codigo); toast.success("Pix copiado"); } catch { toast.error("Selecione e copie o código no campo acima."); } }}><Copy className="mr-2 h-4 w-4" />Copiar código Pix</Button></section>)}
        {pix.length > 1 && <Button variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(mensagemPixAgendamento(pix)); toast.success("Todos os códigos Pix copiados com seus valores"); } catch { toast.error("Copie os códigos nos campos acima."); } }}>Copiar todos com os valores</Button>}
      </>}
    </DialogContent></Dialog>
  </span>;
}
