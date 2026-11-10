"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { apiFetch } from "@/hooks/api";

export const agendaApi = () => {
  const base = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api").replace(/\/+$/, "");
  return `${base.endsWith("/api") ? base : `${base}/api`}/agendamentos`;
};
export async function agendaRequest(path: string, options?: RequestInit) {
  const res = await apiFetch(`${agendaApi()}${path}`, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Não foi possível concluir a operação.");
  return data;
}

export function formatarRetirada(retiradoEm: string) {
  return new Date(retiradoEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

const formas = [
  ["DINHEIRO", "Dinheiro"], ["CREDITO", "Cartão de crédito"], ["DEBITO", "Cartão de débito"],
  ["VALE_ALIMENTACAO", "Vale alimentação"], ["VALE_REFEICAO", "Vale refeição"],
  ["PIX", "Pix"], ["LINK", "Link de pagamento"], ["VOUCHER", "Voucher"],
  ["TROCA", "Troca"], ["BONIFICACAO", "Bonificação"],
] as const;

type PedidoRetirada = { status: string; pagamentos: { status: string; forma: string; valor: string | number }[] };

export function RetiradaAgendamento({ id, retiradoEm, onSuccess }: { id: number; retiradoEm?: string | null; onSuccess: (data: string) => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pedido, setPedido] = useState<PedidoRetirada | null>(null);
  const [forma, setForma] = useState("");
  const [senha, setSenha] = useState("");
  const [pagamentoConfirmado, setPagamentoConfirmado] = useState(false);
  const pendentes = pedido?.pagamentos.filter(p => p.status === "PENDENTE") ?? [];
  const temPagamento = pedido?.status === "ABERTO" && pendentes.length > 0;
  const formasPendentes = new Set(pendentes.map(p => p.forma));
  const pagamentoComposto = formasPendentes.size > 1 || formasPendentes.has("PLANO");
  const requerSenha = forma === "TROCA" || forma === "BONIFICACAO";

  async function abrir() {
    setOpen(true);
    setBusy(true);
    setError("");
    setPedido(null);
    setSenha("");
    setPagamentoConfirmado(false);
    try {
      const dados = await agendaRequest(`/${id}`);
      const atual: PedidoRetirada = dados.pedido;
      const prevista = atual.pagamentos.find(p => p.status === "PENDENTE")?.forma;
      setForma(formas.some(([valor]) => valor === prevista) ? prevista! : "");
      setPedido(atual);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao consultar o pedido.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmar() {
    setBusy(true);
    setError("");
    let pago = pagamentoConfirmado;
    try {
      if (temPagamento) {
        await agendaRequest(`/${id}/finalizar-pagamento`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ formaPagamento: forma, senhaAutorizacao: senha.trim() || undefined }),
        });
        pago = true;
        setPagamentoConfirmado(true);
        setPedido(atual => atual && { ...atual, status: "PAGO" });
      }
      const result = await agendaRequest(`/${id}/retirada`, { method: "POST" });
      onSuccess(result.retiradoEm);
      setOpen(false);
    } catch (e) {
      const mensagem = e instanceof Error ? e.message : "Falha ao confirmar retirada.";
      setError(pago ? `Pagamento confirmado. Tente registrar a retirada novamente. ${mensagem}` : mensagem);
    } finally {
      setBusy(false);
    }
  }

  return <span onClick={e => e.stopPropagation()}>
    {retiradoEm ? <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">Retirado · {formatarRetirada(retiradoEm)}</span>
      : <Button size="sm" variant="outline" className="h-auto whitespace-normal border-amber-400 bg-amber-100 text-amber-950 hover:bg-amber-200" onClick={() => void abrir()}>Confirmar Retirada</Button>}
    <Dialog open={open} onOpenChange={v => { if (!busy) setOpen(v); }}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Confirmar Retirada</DialogTitle><DialogDescription>Marque somente após entregar o pedido ao cliente. A data, o horário exato e o operador serão registrados no histórico.</DialogDescription></DialogHeader>
      {pedido?.status === "PAGO" && <p className="text-sm text-emerald-800">Pagamento confirmado.</p>}
      {temPagamento && (pagamentoComposto ? <p className="text-sm text-amber-900">Este pedido tem pagamento composto ou por plano. Confira o pagamento em Pedidos em Aberto antes de registrar a retirada.</p> :
        <div className="space-y-3">
          <p className="text-sm font-semibold">Valor em aberto: {pendentes.reduce((total, p) => total + Number(p.valor), 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
          <label className="block space-y-1 text-sm font-medium">
            Forma de pagamento recebida
            <select className="block h-10 w-full rounded-md border bg-background px-3" disabled={busy} value={forma} onChange={e => setForma(e.target.value)}>
              <option value="" disabled>Selecione a forma de pagamento</option>
              {formas.map(([valor, nome]) => <option key={valor} value={valor}>{nome}</option>)}
            </select>
          </label>
          {requerSenha && <label className="block space-y-1 text-sm font-medium">Senha de autorização
            <Input type="password" value={senha} disabled={busy} onChange={e => setSenha(e.target.value)} />
          </label>}
        </div>)}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <Button disabled={busy || !pedido || pedido.status === "CANCELADO" || (temPagamento && (pagamentoComposto || !forma || (requerSenha && !senha.trim())))} onClick={() => void confirmar()}>
        {busy ? "Aguarde…" : temPagamento ? "Confirmar pagamento e retirada" : "Confirmar retirada"}
      </Button>
    </DialogContent></Dialog>
  </span>;
}
