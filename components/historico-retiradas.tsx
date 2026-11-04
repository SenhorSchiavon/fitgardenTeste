"use client";
import { useEffect, useState } from "react";
import { agendaRequest } from "./retirada-agendamento";
import { Button } from "@/components/ui/button";
type Registro = { id: number; registradoEm: string; operadorId: number; agendamento: { pedidoId: number; pedido: { cliente: { nome: string } } } };
export function HistoricoRetiradas({ date }: { date: string }) {
  const [rows, setRows] = useState<Registro[]>([]), [erro, setErro] = useState(""), [loading, setLoading] = useState(true), [versao, setVersao] = useState(0);
  useEffect(() => { const controller = new AbortController(); setLoading(true); setErro("");
    agendaRequest(`/retiradas/historico?date=${date}`, { signal: controller.signal }).then(setRows).catch(e => { if (!controller.signal.aborted) setErro(e.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [date, versao]);
  return <div className="space-y-3 rounded-xl border bg-white p-5"><div className="flex items-center justify-between gap-2"><div><h3 className="font-semibold">Histórico de retiradas</h3><p className="text-sm text-muted-foreground">Retiradas registradas na data selecionada, com horário de Brasília.</p></div><Button variant="outline" disabled={loading} onClick={() => setVersao(v => v + 1)}>Atualizar</Button></div>
    {erro ? <p role="alert" className="text-red-700">{erro}</p> : loading ? <p role="status">Carregando…</p> : !rows.length ? <p className="py-8 text-center text-muted-foreground">Nenhuma retirada registrada neste dia.</p> : <div className="divide-y">{rows.map(r => <div key={r.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span><strong>{r.agendamento.pedido.cliente.nome}</strong> · Pedido #{r.agendamento.pedidoId}</span><span>{new Date(r.registradoEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} · Operador #{r.operadorId}</span></div>)}</div>}
  </div>;
}
