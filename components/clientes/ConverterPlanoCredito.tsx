"use client";
import { useState } from "react";
import { apiFetch } from "@/hooks/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Memoria = { total: number; convertido: boolean; itens: { descricao: string; quantidade: number; valorUnitario: number; subtotal: number }[] };
const moeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function ConverterPlanoCredito({ clienteId, planoId, onSuccess }: { clienteId: number | string; planoId: number; onSuccess: () => Promise<unknown> }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [memoria, setMemoria] = useState<Memoria | null>(null);
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api"}/clientes/${clienteId}/planos/${planoId}/conversao`;

  async function abrir() {
    setOpen(true); setBusy(true); setErro(""); setMemoria(null); setSenha("");
    try {
      const response = await apiFetch(url);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setMemoria(data);
    } catch (error) { setErro(error instanceof Error ? error.message : "Falha ao consultar o saldo."); }
    finally { setBusy(false); }
  }

  async function converter() {
    setBusy(true); setErro("");
    try {
      const response = await apiFetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ senhaExclusao: senha, valorEsperado: memoria?.total }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setOpen(false);
      await onSuccess();
    } catch (error) { setErro(error instanceof Error ? error.message : "Falha ao converter o saldo."); }
    finally { setBusy(false); }
  }

  return <>
    <Button size="sm" variant="outline" onClick={() => void abrir()}>Excluir e converter saldo</Button>
    <Dialog open={open} onOpenChange={value => { if (!busy) setOpen(value); }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>Converter saldo do plano</DialogTitle><DialogDescription>Confira o cálculo. O plano será encerrado e o valor ficará disponível como crédito no cadastro do cliente.</DialogDescription></DialogHeader>
        {memoria && <div className="space-y-3">{memoria.itens.map((item, index) => <div key={index} className="border-b pb-2 text-sm"><strong>{item.descricao}</strong><div>{item.quantidade} × {moeda(item.valorUnitario)} = {moeda(item.subtotal)}</div></div>)}<p className="font-semibold">Crédito gerado {moeda(memoria.total)}</p></div>}
        <label className="space-y-1 text-sm">Senha de exclusão<Input type="password" disabled={busy} value={senha} onChange={e => setSenha(e.target.value)} /></label>
        {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}
        <Button disabled={busy || !memoria || memoria.convertido || !senha} onClick={() => void converter()}>{busy ? "Aguarde…" : "Confirmar conversão em crédito"}</Button>
      </DialogContent>
    </Dialog>
  </>;
}
