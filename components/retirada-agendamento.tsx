"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
export function RetiradaAgendamento({ id, retiradoEm, onSuccess }: { id: number; retiradoEm?: string | null; onSuccess: (data: string) => void }) {
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  return <span onClick={e => e.stopPropagation()}>
    {retiradoEm ? <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">Retirado · {new Date(retiradoEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</span>
      : <Button size="sm" variant="outline" className="h-auto whitespace-normal border-amber-400 bg-amber-100 text-amber-950 hover:bg-amber-200" onClick={() => setOpen(true)}>⚠ Retirada não confirmada · corrigir</Button>}
    <Dialog open={open} onOpenChange={v => { if (!busy) { setOpen(v); setError(""); } }}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Confirmar retirada</DialogTitle><DialogDescription>Marque somente após entregar o pedido ao cliente. A data, o horário exato e o operador serão registrados no histórico. Esta ação não confirma o pagamento.</DialogDescription></DialogHeader>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <Button disabled={busy} onClick={async () => { setBusy(true); setError(""); try { const result = await agendaRequest(`/${id}/retirada`, { method: "POST" }); onSuccess(result.retiradoEm); setOpen(false); } catch (e) { setError(e instanceof Error ? e.message : "Falha ao confirmar retirada."); } finally { setBusy(false); } }}>{busy ? "Registrando…" : "Marcar como retirado"}</Button>
    </DialogContent></Dialog>
  </span>;
}
