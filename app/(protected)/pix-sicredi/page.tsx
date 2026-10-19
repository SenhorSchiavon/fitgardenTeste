"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Copy, RefreshCw, Search, QrCode, Link2, CheckCircle2, Clock, Wallet } from "lucide-react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiFetch } from "@/hooks/api";
import { getStoredUser } from "@/lib/auth-permissions";

type Pagamento = {
  id: number; pedidoId: number; valor: string; status: string; conciliado: boolean;
  pagoEm: string | null; pixTxid: string | null; pixEndToEndId: string | null;
  pixStatus: string | null; pixCopiaECola: string | null; pixConsultadoEm: string | null;
  createdAt: string; pedido: { status: string; cliente: { nome: string } };
};
type Recebido = {
  endToEndId: string; txid?: string; valor: string; horario: string; chave?: string;
  infoPagador?: string; devolucoes?: unknown[];
  pagamento: { id: number; pedidoId: number; pedido: { cliente: { nome: string } } } | null;
};
type Lista = { pagamentos: Pagamento[]; total: number; paginas: number;
  totais: { status: string; _sum: { valor: string | null }; _count: number }[] };
type Extrato = { recebidos: Recebido[]; paginas: number; total: number | null };
const brl = (valor: string | number | null) => Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dataHora = (valor: string | null | undefined) => valor ? new Date(valor).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—";
const hoje = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
const apiBase = () => {
  const base = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api").replace(/\/+$/, "");
  return `${base.endsWith("/api") ? base : `${base}/api`}/pix-sicredi`;
};
async function request<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const response = await apiFetch(`${apiBase()}${path}`, {
    signal, ...(body !== undefined ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Não foi possível concluir a operação");
  return result;
}
const message = (error: unknown) => error instanceof Error ? error.message : "Falha ao carregar os dados";

export default function PixSicrediPage() {
  const [aba, setAba] = useState<"pagamentos" | "recebidos">("pagamentos");
  const [inicio, setInicio] = useState(hoje);
  const [fim, setFim] = useState(hoje);
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("");
  const [filtros, setFiltros] = useState(() => ({ inicio: hoje(), fim: hoje(), busca: "", status: "" }));
  const [pagina, setPagina] = useState(1);
  const [lista, setLista] = useState<Lista | null>(null);
  const [extrato, setExtrato] = useState<Extrato | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState("");
  const [atualizado, setAtualizado] = useState<string | null>(null);
  const [copia, setCopia] = useState<{ codigo: string; pedido: number } | null>(null);
  const [recebido, setRecebido] = useState<Recebido | null>(null);
  const [admin, setAdmin] = useState(false);
  const [webhooks, setWebhooks] = useState(false);
  const activeRequest = useRef<AbortController | null>(null);

  useEffect(() => { setAdmin(Boolean(getStoredUser()?.isAdmin)); }, []);
  const carregar = useCallback(async (silencioso = false) => {
    activeRequest.current?.abort();
    const controller = new AbortController(); activeRequest.current = controller;
    if (!silencioso) setLoading(true);
    setErro("");
    try {
      const params = new URLSearchParams({ ...filtros, pagina: String(pagina) });
      if (aba === "pagamentos") setLista(await request<Lista>(`/pagamentos?${params}`, undefined, controller.signal));
      else setExtrato(await request<Extrato>(`/recebidos?${params}`, undefined, controller.signal));
      if (!controller.signal.aborted) setAtualizado(new Date().toISOString());
    } catch (error) { if (!controller.signal.aborted) setErro(message(error)); }
    finally { if (!controller.signal.aborted) setLoading(false); }
  }, [aba, filtros, pagina]);
  useEffect(() => {
    void carregar();
    // Atualiza os status locais; não faz consultas bancárias em segundo plano.
    const timer = aba === "pagamentos" ? setInterval(() => { if (!document.hidden) void carregar(true); }, 30000) : null;
    return () => { if (timer) clearInterval(timer); activeRequest.current?.abort(); };
  }, [carregar, aba]);

  async function operar(pagamento: Pagamento, acao: "gerar" | "consultar") {
    setOcupado(`${acao}-${pagamento.id}`);
    try {
      const result = await request<{ pixCopiaECola?: string; pago?: boolean }>(`/pagamentos/${pagamento.id}/${acao}`, {});
      if (acao === "gerar") {
        if (result.pixCopiaECola) setCopia({ codigo: result.pixCopiaECola, pedido: pagamento.pedidoId });
        else toast.info("Cobrança criada, mas o Sicredi não retornou o Pix Copia e Cola. Consulte a cobrança.");
      } else toast.success(result.pago ? "Pagamento confirmado pelo Sicredi" : "Consulta concluída: Pix ainda não recebido");
      await carregar(true);
    } catch (error) { toast.error(message(error)); }
    finally { setOcupado(""); }
  }
  async function cadastrarWebhooks() {
    setOcupado("webhooks");
    try {
      const result = await request<{ cadastros: { chave: string }[] }>("/webhooks", {});
      toast.success(`Webhook cadastrado em ${result.cadastros.length} chave(s)`); setWebhooks(false);
    } catch (error) { toast.error(message(error)); }
    finally { setOcupado(""); }
  }
  function filtrar(event: FormEvent) {
    event.preventDefault(); setPagina(1); setLista(null); setExtrato(null);
    setFiltros({ inicio, fim, busca: busca.trim(), status });
  }
  const paginas = aba === "pagamentos" ? lista?.paginas || 0 : extrato?.paginas || 0;
  const pendentes = lista?.totais.find(item => item.status === "PENDENTE");
  const confirmados = lista?.totais.find(item => item.status === "CONFIRMADO");

  return <div className="mx-auto max-w-7xl space-y-5">
    <Header title="Pix Sicredi" subtitle="Acompanhe cobranças, recebimentos e a baixa dos pedidos." searchValue={busca} onSearchChange={setBusca} />
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Tipo de acompanhamento">
        <Button variant={aba === "pagamentos" ? "default" : "outline"} onClick={() => { setAba("pagamentos"); setPagina(1); }}>Pagamentos dos pedidos</Button>
        <Button variant={aba === "recebidos" ? "default" : "outline"} onClick={() => { setAba("recebidos"); setPagina(1); }}>Recebidos no Sicredi</Button>
      </div>
      <div className="flex gap-2">
        {admin && <Button variant="outline" disabled={Boolean(ocupado)} onClick={() => setWebhooks(true)}>Configurar webhooks</Button>}
        <Button variant="outline" disabled={loading || Boolean(ocupado)} onClick={() => void carregar()}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />Atualizar</Button>
      </div>
    </div>
    <Card><CardContent className="pt-5">
      <form onSubmit={filtrar} className="flex flex-wrap items-end gap-3">
        <label className="space-y-1 text-sm">De<Input aria-label="Data inicial" type="date" value={inicio} onChange={e => setInicio(e.target.value)} required /></label>
        <label className="space-y-1 text-sm">Até<Input aria-label="Data final" type="date" value={fim} onChange={e => setFim(e.target.value)} required /></label>
        {aba === "pagamentos" && <>
          <label className="min-w-48 flex-1 space-y-1 text-sm">Cliente ou pedido<Input placeholder="Nome, pedido ou identificador Pix" value={busca} onChange={e => setBusca(e.target.value)} /></label>
          <label className="space-y-1 text-sm">Status<select className="flex h-10 w-full rounded-md border bg-background px-3 text-sm" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">Todos</option><option value="PENDENTE">Pendentes</option><option value="CONFIRMADO">Confirmados</option><option value="CANCELADO">Cancelados</option><option value="ESTORNADO">Estornados</option>
          </select></label>
        </>}
        <Button type="submit" disabled={loading}><Search className="mr-2 h-4 w-4" />Filtrar</Button>
      </form>
      <p className="mt-3 text-xs text-muted-foreground">Período de até 31 dias. {aba === "pagamentos" ? "Filtro pela criação do pagamento. A lista atualiza a cada 30 segundos." : "Filtro pela data de recebimento, consultado diretamente no banco. Inclui Pix avulsos disponibilizados pelo Sicredi para esta conta."}</p>
    </CardContent></Card>
    {aba === "pagamentos" && <div className="grid gap-3 sm:grid-cols-3">
      {[{ label: "Pagamentos no filtro", value: String(lista?.total || 0), icon: Wallet },
        { label: `${pendentes?._count || 0} pendentes`, value: brl(pendentes?._sum.valor || 0), icon: Clock },
        { label: `${confirmados?._count || 0} confirmados`, value: brl(confirmados?._sum.valor || 0), icon: CheckCircle2 }].map(item => <Card key={item.label}><CardContent className="flex items-center justify-between pt-5"><div><p className="text-sm text-muted-foreground">{item.label}</p><p className="mt-1 text-2xl font-bold text-primary">{item.value}</p></div><item.icon className="h-7 w-7 text-emerald-600" /></CardContent></Card>)}
    </div>}
    {erro && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{erro}<Button variant="outline" className="ml-3" onClick={() => void carregar()}>Tentar novamente</Button></div>}
    <Card><CardContent className="p-0">
      {loading ? <p className="p-10 text-center text-muted-foreground" role="status">Carregando {aba === "recebidos" ? "recebimentos no Sicredi" : "pagamentos"}…</p>
        : erro ? <p className="p-8 text-center text-muted-foreground">Não foi possível atualizar os dados. Tente novamente.</p>
        : aba === "pagamentos" ? <Table><TableHeader><TableRow><TableHead>Pedido / cliente</TableHead><TableHead>Valor</TableHead><TableHead>Pagamento</TableHead><TableHead>Sicredi</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader><TableBody>
          {!lista?.pagamentos.length && <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">Nenhum pagamento Pix neste filtro. Amplie o período ou ajuste a busca.</TableCell></TableRow>}
          {lista?.pagamentos.map(p => <TableRow key={p.id}>
            <TableCell><div className="font-medium">Pedido #{p.pedidoId} · {p.pedido.cliente.nome}</div><div className="text-xs text-muted-foreground">Pagamento #{p.id} · {dataHora(p.createdAt)}</div></TableCell>
            <TableCell className="whitespace-nowrap font-semibold">{brl(p.valor)}</TableCell>
            <TableCell><Badge variant={p.status === "CONFIRMADO" ? "default" : "secondary"}>{p.status === "CONFIRMADO" ? "Confirmado" : p.status === "PENDENTE" ? "Pendente" : p.status}</Badge><div className="mt-1 text-xs text-muted-foreground">{p.pagoEm ? dataHora(p.pagoEm) : p.status === "PENDENTE" ? "Aguardando pagamento" : "Sem data de recebimento"}{p.conciliado ? " · Conciliado" : ""}</div></TableCell>
            <TableCell><span className="text-sm">{p.pixStatus || "Sem cobrança"}</span><div className="max-w-52 break-all text-xs text-muted-foreground">{p.pixEndToEndId || p.pixTxid || "—"}</div><div className="text-xs text-muted-foreground">Consulta: {dataHora(p.pixConsultadoEm)}</div></TableCell>
            <TableCell><div className="flex justify-end gap-2">
              {p.status === "PENDENTE" && p.pedido.status !== "CANCELADO" && <Button size="sm" variant="outline" disabled={Boolean(ocupado)} onClick={() => p.pixCopiaECola ? setCopia({ codigo: p.pixCopiaECola, pedido: p.pedidoId }) : void operar(p, "gerar")}><QrCode className="mr-1 h-4 w-4" />{ocupado === `gerar-${p.id}` ? "Gerando…" : p.pixCopiaECola ? "Ver Pix" : "Gerar Pix"}</Button>}
              {(p.pixTxid || p.pixEndToEndId) && ["PENDENTE", "CONFIRMADO"].includes(p.status) && <Button size="sm" variant="outline" disabled={Boolean(ocupado)} onClick={() => void operar(p, "consultar")}>{ocupado === `consultar-${p.id}` ? "Consultando…" : "Consultar banco"}</Button>}
            </div></TableCell>
          </TableRow>)}
        </TableBody></Table> : <Table><TableHeader><TableRow><TableHead>Recebido em</TableHead><TableHead>Valor / chave</TableHead><TableHead>Identificação bancária</TableHead><TableHead>Vínculo</TableHead><TableHead className="text-right">Ação</TableHead></TableRow></TableHeader><TableBody>
          {!extrato?.recebidos.length && <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">Nenhum Pix recebido no período consultado.</TableCell></TableRow>}
          {extrato?.recebidos.map(r => <TableRow key={r.endToEndId}>
            <TableCell className="whitespace-nowrap">{dataHora(r.horario)}</TableCell><TableCell><div className="font-semibold">{brl(r.valor)}</div><div className="text-xs text-muted-foreground">{r.chave || "Chave não informada pelo banco"}</div></TableCell>
            <TableCell><div className="max-w-64 break-all font-mono text-xs">{r.endToEndId}</div><div className="text-xs text-muted-foreground">{r.txid && r.txid !== "***" ? `Txid: ${r.txid}` : "Pix avulso"}</div>{r.infoPagador && <div className="max-w-64 text-xs">{r.infoPagador}</div>}{Boolean(r.devolucoes?.length) && <Badge variant="secondary">Com devolução</Badge>}</TableCell>
            <TableCell>{r.pagamento ? <><Badge>Vinculado</Badge><div className="mt-1 text-xs">Pedido #{r.pagamento.pedidoId} · {r.pagamento.pedido.cliente.nome}</div></> : <Badge variant="secondary">Sem vínculo</Badge>}</TableCell>
            <TableCell className="text-right">{!r.pagamento && !r.devolucoes?.length && <Button size="sm" variant="outline" onClick={() => setRecebido(r)}><Link2 className="mr-1 h-4 w-4" />Vincular e dar baixa</Button>}</TableCell>
          </TableRow>)}
        </TableBody></Table>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4 text-xs text-muted-foreground">
        <span>Atualizado: {dataHora(atualizado)} · {aba === "recebidos" ? "Origem: API Sicredi" : "Origem: pagamentos dos pedidos"}</span>
        <div className="flex items-center gap-3"><Button size="sm" variant="outline" disabled={loading || pagina <= 1} onClick={() => setPagina(p => p - 1)}>Anterior</Button><span>Página {pagina} de {Math.max(1, paginas)}</span><Button size="sm" variant="outline" disabled={loading || pagina >= paginas} onClick={() => setPagina(p => p + 1)}>Próxima</Button></div>
      </div>
    </CardContent></Card>
    <Dialog open={Boolean(copia)} onOpenChange={open => { if (!open) setCopia(null); }}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Pix do pedido #{copia?.pedido}</DialogTitle><DialogDescription>Confira o valor e o destinatário no aplicativo do banco antes de pagar.</DialogDescription></DialogHeader>
      {copia && <><div className="mx-auto rounded-xl bg-white p-4"><QRCodeSVG value={copia.codigo} size={240} marginSize={4} /></div><textarea aria-label="Pix Copia e Cola" readOnly value={copia.codigo} className="h-24 w-full rounded-md border p-3 font-mono text-xs" /><Button onClick={async () => { try { await navigator.clipboard.writeText(copia.codigo); toast.success("Pix copiado"); } catch { toast.error("Não foi possível copiar. Selecione o código acima."); } }}><Copy className="mr-2 h-4 w-4" />Copiar Pix</Button></>}
    </DialogContent></Dialog>
    <Dialog open={webhooks} onOpenChange={open => { if (!ocupado) setWebhooks(open); }}><DialogContent><DialogHeader><DialogTitle>Configurar webhooks</DialogTitle><DialogDescription>Cadastre a URL configurada no servidor para todas as chaves Pix. Esta ação atualiza o endereço de notificações no Sicredi.</DialogDescription></DialogHeader><Button disabled={Boolean(ocupado)} onClick={() => void cadastrarWebhooks()}>{ocupado ? "Cadastrando…" : "Cadastrar para todas as chaves"}</Button></DialogContent></Dialog>
    {recebido && <VincularDialog recebido={recebido} onClose={() => setRecebido(null)} onSuccess={() => { setRecebido(null); void carregar(); }} />}
  </div>;
}

function VincularDialog({ recebido, onClose, onSuccess }: { recebido: Recebido; onClose: () => void; onSuccess: () => void }) {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("");
  const [pagina, setPagina] = useState(1);
  const [paginas, setPaginas] = useState(1);
  const [candidatos, setCandidatos] = useState<Pagamento[]>([]);
  const [selecionado, setSelecionado] = useState<Pagamento | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setErro(""); setSelecionado(null); setCandidatos([]);
    const params = new URLSearchParams({ valor: Number(recebido.valor).toFixed(2), busca: filtro, pagina: String(pagina) });
    request<{ pagamentos: Pagamento[]; paginas: number }>(`/candidatos?${params}`, undefined, controller.signal)
      .then(result => { setCandidatos(result.pagamentos); setPaginas(result.paginas); })
      .catch(error => { if (!controller.signal.aborted) setErro(message(error)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [recebido.valor, filtro, pagina]);
  async function vincular() {
    if (!selecionado) return;
    setSaving(true); setErro("");
    try { await request(`/recebidos/${encodeURIComponent(recebido.endToEndId)}/vincular`, { pagamentoId: selecionado.id }); toast.success("Pix vinculado e pagamento confirmado"); onSuccess(); }
    catch (error) { setErro(message(error)); }
    finally { setSaving(false); }
  }
  return <Dialog open onOpenChange={open => { if (!open && !saving) onClose(); }}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Vincular Pix de {brl(recebido.valor)}</DialogTitle><DialogDescription>Recebido em {dataHora(recebido.horario)}. Selecione o pagamento correto; o valor sozinho não identifica o cliente.</DialogDescription></DialogHeader>
    <div className="break-all rounded-md bg-muted p-3 font-mono text-xs">{recebido.endToEndId}</div>
    <form className="flex gap-2" onSubmit={event => { event.preventDefault(); setFiltro(busca.trim()); setPagina(1); }}><Input aria-label="Buscar pagamento para vincular" placeholder="Cliente, pedido ou pagamento" value={busca} onChange={event => setBusca(event.target.value)} /><Button disabled={saving} type="submit">Buscar</Button></form>
    <p className="text-xs text-muted-foreground">Pagamentos Pix pendentes com o mesmo valor, de qualquer data.</p>
    {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}
    <div className="max-h-64 space-y-2 overflow-y-auto">
      {loading ? <p className="p-4 text-center text-sm">Buscando pagamentos…</p> : !erro && !candidatos.length ? <p className="p-4 text-sm">Nenhum pagamento pendente desse valor. Confira o pedido e a forma de pagamento.</p> : candidatos.map(p => <label key={p.id} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${selecionado?.id === p.id ? "border-primary bg-primary/5" : ""}`}><input type="radio" name="pagamento" disabled={saving} checked={selecionado?.id === p.id} onChange={() => setSelecionado(p)} /><span className="text-sm"><strong>Pedido #{p.pedidoId} · {p.pedido.cliente.nome}</strong><br />Pagamento #{p.id} · {brl(p.valor)} · {dataHora(p.createdAt)}</span></label>)}
    </div>
    <div className="flex items-center justify-between"><Button variant="outline" disabled={loading || saving || pagina <= 1} onClick={() => setPagina(p => p - 1)}>Anterior</Button><span className="text-xs">{pagina} / {Math.max(1, paginas)}</span><Button variant="outline" disabled={loading || saving || pagina >= paginas} onClick={() => setPagina(p => p + 1)}>Próxima</Button></div>
    {selecionado && <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">Ao confirmar, o Pix será vinculado ao pedido #{selecionado.pedidoId} de {selecionado.pedido.cliente.nome} e o pagamento #{selecionado.id} receberá baixa.</p>}
    <Button disabled={!selecionado || loading || saving} onClick={() => void vincular()}>{saving ? "Conferindo no banco…" : "Confirmar vínculo e dar baixa"}</Button>
  </DialogContent></Dialog>;
}
