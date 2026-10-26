"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, PlugZap, RefreshCw, Save, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/hooks/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Config = { ativa: boolean; apiUrl: string; tenantId: string; entregadorId: string;
  rotaIds: string[]; tokenConfigurado: boolean; token: string };
type Opcoes = { tenant: { id: string; nome: string }; entregadores: { id: string; nome: string }[];
  rotas: { id: string; nome: string }[]; entregadorPadraoId: string | null };
const ROTAS = [
  { nome: "PRIMEIRA ROTA", horario: "13h às 15h" }, { nome: "SEGUNDA ROTA", horario: "15h às 17h" },
  { nome: "TERCEIRA ROTA", horario: "17h às 18h" }, { nome: "QUARTA ROTA", horario: "18h às 20h30" },
];
const base = `${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4444/api").replace(/\/+$/, "")}/integracoes/levacerto`;
async function request<T>(path = "", options?: RequestInit): Promise<T> {
  const response = await apiFetch(`${base}${path}`, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Não foi possível concluir a operação");
  return data;
}
const selectClass = "h-11 w-full rounded-md border bg-background px-3 text-sm disabled:opacity-60";

export default function IntegracaoLevaCertoPage() {
  const [form, setForm] = useState<Config | null>(null);
  const [original, setOriginal] = useState("");
  const [opcoes, setOpcoes] = useState<Opcoes | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"salvar" | "testar" | null>(null);
  const [error, setError] = useState("");
  const [connection, setConnection] = useState("");

  async function carregar() {
    setLoading(true); setError("");
    try {
      const data = await request<Omit<Config, "token">>();
      const next = { ...data, token: "" };
      setForm(next); setOriginal(JSON.stringify(next)); setOpcoes(null); setConnection("");
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { void carregar(); }, []);
  const alterada = Boolean(form && JSON.stringify(form) !== original);

  function alterar(values: Partial<Config>, limparOpcoes = false) {
    setForm(current => current ? { ...current, ...values } : current);
    setConnection(""); setError("");
    if (limparOpcoes) setOpcoes(null);
  }
  async function testar() {
    if (!form) return;
    setBusy("testar"); setError(""); setConnection(""); setOpcoes(null);
    try {
      const result = await request<Opcoes>("/testar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setOpcoes(result); setConnection(`Conectado à conta ${result.tenant.nome}`);
      setForm(current => current ? { ...current,
        entregadorId: current.entregadorId || result.entregadorPadraoId || "",
        rotaIds: current.rotaIds.map((id, index) => id || result.rotas.find(rota => rota.nome.toUpperCase() === ROTAS[index].nome)?.id || ""),
      } : current);
      toast.success("Conexão verificada", { description: "Rotas e entregadores ativos carregados." });
    } catch (e: any) { setError(e.message); toast.error("Falha ao verificar a conexão", { description: e.message }); }
    finally { setBusy(null); }
  }
  async function salvar(event: React.FormEvent) {
    event.preventDefault(); if (!form) return;
    setBusy("salvar"); setError("");
    try {
      const data = await request<Omit<Config, "token">>("", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const next = { ...data, token: "" };
      setForm(next); setOriginal(JSON.stringify(next));
      toast.success("Configuração salva", { description: "As mudanças serão usadas nos próximos envios." });
    } catch (e: any) { setError(e.message); toast.error("Não foi possível salvar", { description: e.message }); }
    finally { setBusy(null); }
  }

  if (loading) return <div className="flex min-h-64 items-center justify-center gap-3 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Carregando integração…</div>;
  if (!form) return <div className="p-6"><p role="alert" className="mb-4 text-destructive">{error}</p><Button onClick={carregar}>Tentar novamente</Button></div>;

  return <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-700"><PlugZap className="h-4 w-4" />Integrações</div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">FitGarden + LevaCerto</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">Envie os agendamentos de entrega para a conta e as rotas da sua operação.</p></div>
      <span className={`rounded-full px-3 py-1 text-xs font-medium ${alterada ? "bg-amber-100 text-amber-800" : form.ativa ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`}>
        {alterada ? "Alterações não salvas" : form.ativa ? "Envio automático habilitado" : "Envio automático pausado"}</span>
    </header>
    <form onSubmit={salvar} className="space-y-6">
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5" />Envio de entregas</CardTitle>
        <CardDescription>O envio acontece ao salvar um novo agendamento completo com entrega.</CardDescription></CardHeader>
        <CardContent><label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border p-4">
          <span><span className="block text-sm font-medium">Enviar automaticamente ao LevaCerto</span><span className="mt-1 block text-xs text-muted-foreground">Retiradas ficam fora desse fluxo. Entregas existentes não são alteradas.</span></span>
          <input type="checkbox" checked={form.ativa} disabled={!!busy} onChange={e => alterar({ ativa: e.target.checked })} className="h-5 w-5 accent-emerald-600" />
        </label></CardContent></Card>

      <Card><CardHeader><CardTitle>Conexão com o LevaCerto</CardTitle><CardDescription>A credencial deve autorizar a conta indicada abaixo.</CardDescription></CardHeader>
        <CardContent className="space-y-5"><div className="space-y-2"><Label htmlFor="apiUrl">Endereço da API</Label><Input id="apiUrl" value={form.apiUrl} onChange={e => alterar({ apiUrl: e.target.value }, true)} disabled={!!busy} required />
          <p className="text-xs text-muted-foreground">API de produção: https://api.levacerto.com.br</p></div>
          <div className="grid gap-5 md:grid-cols-2"><div className="space-y-2"><Label htmlFor="tenantId">ID da conta (tenant)</Label><Input id="tenantId" value={form.tenantId} onChange={e => alterar({ tenantId: e.target.value }, true)} disabled={!!busy} required={form.ativa} /></div>
            <div className="space-y-2"><Label htmlFor="token">Credencial da integração</Label><Input id="token" type="password" autoComplete="new-password" maxLength={1024} value={form.token} onChange={e => alterar({ token: e.target.value }, true)} disabled={!!busy} placeholder={form.tokenConfigurado ? "Configurada — deixe vazio para manter" : "Informe a credencial"} />
              <p className="flex items-center gap-1 text-xs text-muted-foreground"><ShieldCheck className="h-3 w-3" />{form.tokenConfigurado ? "Credencial protegida. O valor atual não é exibido." : "A mesma credencial deve estar configurada no LevaCerto."}</p></div></div>
          <Button type="button" variant="outline" onClick={testar} disabled={!!busy}>{busy === "testar" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}Verificar conexão e carregar opções</Button>
          {connection && <p role="status" className="flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 className="h-4 w-4" />{connection}</p>}
        </CardContent></Card>

      <Card><CardHeader><CardTitle>Entregador e rotas</CardTitle><CardDescription>Verifique a conexão para escolher entre os cadastros ativos dessa conta.</CardDescription></CardHeader>
        <CardContent className="space-y-6"><div className="max-w-md space-y-2"><Label htmlFor="entregador">Entregador das novas entregas</Label>
          <select id="entregador" className={selectClass} value={form.entregadorId} disabled={!opcoes || !!busy} onChange={e => alterar({ entregadorId: e.target.value })}>
            <option value="">Padrão do LevaCerto: AISLAN</option>
            {form.entregadorId && !opcoes?.entregadores.some(e => e.id === form.entregadorId) && <option value={form.entregadorId}>Configurado: {form.entregadorId}</option>}
            {opcoes?.entregadores.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
          </select></div>
          <div className="grid gap-4 md:grid-cols-2">{ROTAS.map((rota, index) => <div key={rota.nome} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-2"><Label htmlFor={`rota-${index}`}>Rota {index + 1} do FitGarden</Label><span className="text-xs text-muted-foreground">{rota.horario}</span></div>
            <select id={`rota-${index}`} className={selectClass} value={form.rotaIds[index]} disabled={!opcoes || !!busy} onChange={e => alterar({ rotaIds: form.rotaIds.map((id, i) => i === index ? e.target.value : id) })}>
              <option value="">Padrão: {rota.nome}</option>
              {form.rotaIds[index] && !opcoes?.rotas.some(r => r.id === form.rotaIds[index]) && <option value={form.rotaIds[index]}>Configurada: {form.rotaIds[index]}</option>}
              {opcoes?.rotas.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
            </select></div>)}</div>
          <p className="text-xs text-muted-foreground">Congeladas com entrega usam a data de entrega e a rota 4.</p>
        </CardContent></Card>
      {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-background p-4">
        <p className="text-xs text-muted-foreground">Salvar não envia pedidos antigos nem cria entregas de teste.</p>
        <Button type="submit" disabled={!!busy || !alterada}>{busy === "salvar" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Salvar configuração</Button>
      </div>
    </form>
  </div>;
}
