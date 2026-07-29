"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Eye, Phone, RefreshCw, Search, ShoppingBasket, Trash2, UserPlus } from "lucide-react";
import { Header } from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/hooks/api";
import { ClienteFormDialog } from "@/components/clientes/ClienteFormDialog";
import { useClientes } from "@/hooks/useClientes";

type Escolha = { opcaoId: number; nome: string; quantidade: number; adicionarFeijao?: boolean };
type PedidoPublico = {
  id: number;
  nome: string;
  telefone: string;
  origem: "PRINCIPAL" | "ALTERNATIVO";
  tamanhoLabel: string;
  tamanhoId?: number | null;
  observacoes?: string | null;
  cep?: string | null;
  uf?: string | null;
  cidade?: string | null;
  bairro?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  status: "PENDENTE" | "AGENDADO" | "DESCARTADO";
  agendamentoId?: number | null;
  motivoDescarte?: string | null;
  itens: { escolhas?: Escolha[]; personalizada?: Record<string, string> | null };
  cliente?: { id: number; nome: string; telefone: string } | null;
  cardapio: { id: number; nome: string };
  createdAt: string;
};

const apiBase = () => String(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api").replace(/\/+$/, "");

export default function PedidosClientesPage() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<PedidoPublico[]>([]);
  const [selecionado, setSelecionado] = useState<PedidoPublico | null>(null);
  const [status, setStatus] = useState("PENDENTE");
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [descartando, setDescartando] = useState<PedidoPublico | null>(null);
  const [motivoDescarte, setMotivoDescarte] = useState("");
  const [clienteDialogOpen, setClienteDialogOpen] = useState(false);
  const [pedidoParaCliente, setPedidoParaCliente] = useState<PedidoPublico | null>(null);
  const { createCliente, saving: savingCliente } = useClientes();

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro("");
    try {
      const query = new URLSearchParams({ status, ...(busca.trim() ? { q: busca.trim() } : {}) });
      const res = await apiFetch(`${apiBase()}/pedidos-publicos?${query}`, { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Erro ao carregar pedidos.");
      setPedidos(data || []);
    } catch (e: any) {
      setErro(e?.message || "Erro ao carregar pedidos.");
    } finally {
      setLoading(false);
    }
  }, [busca, status]);

  useEffect(() => { carregar(); }, [carregar]);

  const totalMarmitas = (pedido: PedidoPublico) =>
    (pedido.itens?.escolhas || []).reduce((total, item) => total + Number(item.quantidade || 0), 0);

  const iniciarAgendamento = (pedido: PedidoPublico) => {
    const personalizada = pedido.itens?.personalizada || {};
    const customizado = pedido.tamanhoLabel === "PERSONALIZADO";
    const payload = {
      pedidoPublicoId: pedido.id,
      clienteId: pedido.cliente?.id || "",
      observacoes: [
        pedido.observacoes,
      ].filter(Boolean).join("\n"),
      formaPagamento: "A_DEFINIR",
      tipo: "NAO_DEFINIR",
      itens: (pedido.itens?.escolhas || []).map((item) => ({
        tipoItem: customizado ? "PERSONALIZADA" : "PADRAO",
        opcaoId: item.opcaoId,
        nome: item.nome,
        quantidade: item.quantidade,
        tamanhoId: pedido.tamanhoId || null,
        tamanhoLabel: pedido.tamanhoLabel,
        destinatarioNome: pedido.nome,
        adicionarFeijao: !!item.adicionarFeijao,
        carboGramas: Number(personalizada.carboGramas || 0),
        proteinaGramas: Number(personalizada.proteinaGramas || 0),
        feijaoGramas: Number(personalizada.feijaoGramas || 0),
        legumeGramas: Number(personalizada.legumeGramas || 0),
      })),
    };
    sessionStorage.setItem("fitgarden:pedido-publico-agendamento", JSON.stringify(payload));
    router.push(`/agendamentos?pedidoPublico=${pedido.id}`);
  };

  const descartarPedido = async () => {
    if (!descartando || !motivoDescarte.trim()) return;
    const res = await apiFetch(`${apiBase()}/pedidos-publicos/${descartando.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "DESCARTADO", motivoDescarte: motivoDescarte.trim() }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.message || "Não foi possível descartar o pedido.");
    setDescartando(null);
    setMotivoDescarte("");
    setSelecionado(null);
    await carregar();
  };

  const abrirCadastroCliente = (pedido: PedidoPublico) => {
    setPedidoParaCliente(pedido);
    setClienteDialogOpen(true);
  };

  const resumo = useMemo(() => ({
    pendentes: pedidos.filter((p) => p.status === "PENDENTE").length,
    semCliente: pedidos.filter((p) => !p.cliente).length,
    marmitas: pedidos.reduce((total, pedido) => total + totalMarmitas(pedido), 0),
  }), [pedidos]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header title="Pedidos de clientes" subtitle="Pedidos enviados pelos cardápios principal e alternativo" />
      <main className="space-y-5 p-4 md:p-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Pedidos exibidos</p><p className="text-2xl font-bold">{pedidos.length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Sem cliente vinculado</p><p className="text-2xl font-bold text-amber-600">{resumo.semCliente}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Marmitas exibidas</p><p className="text-2xl font-bold text-emerald-700">{resumo.marmitas}</p></CardContent></Card>
        </div>

        <Card><CardContent className="flex flex-col gap-3 p-4 sm:flex-row">
          <div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou telefone" className="pl-9" /></div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-md border bg-white px-3 text-sm"><option value="PENDENTE">Pendentes</option><option value="AGENDADO">Agendados</option><option value="DESCARTADO">Descartados</option><option value="TODOS">Todos</option></select>
          <Button variant="outline" onClick={carregar}><RefreshCw className="mr-2 h-4 w-4" />Atualizar</Button>
        </CardContent></Card>

        {erro ? <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">{erro}</div> : null}
        <div className="grid gap-3">
          {pedidos.map((pedido) => (
            <Card key={pedido.id} className="cursor-pointer transition hover:border-emerald-300 hover:shadow-sm" onClick={() => setSelecionado(pedido)}>
              <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_180px_180px_auto] md:items-center">
                <div><div className="flex flex-wrap items-center gap-2"><p className="font-bold">#{pedido.id} · {pedido.nome}</p><Badge variant={pedido.origem === "ALTERNATIVO" ? "secondary" : "default"}>{pedido.origem === "ALTERNATIVO" ? "Alternativo" : "Principal"}</Badge>{pedido.status === "DESCARTADO" ? <Badge variant="destructive">Descartado</Badge> : !pedido.cliente ? <Badge variant="destructive">Cliente não encontrado</Badge> : <Badge className="bg-emerald-600">{pedido.cliente.nome}</Badge>}</div><p className="mt-1 text-sm text-muted-foreground"><Phone className="mr-1 inline h-3.5 w-3.5" />{pedido.telefone} · {pedido.cardapio.nome}</p>{pedido.motivoDescarte ? <p className="mt-1 text-sm font-medium text-red-700">Motivo: {pedido.motivoDescarte}</p> : null}</div>
                <div className="text-sm"><ShoppingBasket className="mr-1 inline h-4 w-4" /><strong>{totalMarmitas(pedido)}</strong> marmitas · {pedido.tamanhoLabel}</div>
                <div className="text-sm text-muted-foreground">{new Date(pedido.createdAt).toLocaleString("pt-BR")}</div>
                <Button size="sm" variant="outline"><Eye className="mr-2 h-4 w-4" />Abrir</Button>
              </CardContent>
            </Card>
          ))}
          {!loading && !pedidos.length ? <div className="rounded-md border border-dashed bg-white p-10 text-center text-muted-foreground">Nenhum pedido encontrado.</div> : null}
          {loading ? <div className="p-8 text-center text-muted-foreground">Carregando pedidos...</div> : null}
        </div>
      </main>

      <Dialog open={!!selecionado} onOpenChange={(open) => !open && setSelecionado(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Pedido #{selecionado?.id} · {selecionado?.nome}</DialogTitle></DialogHeader>
          {selecionado ? <div className="space-y-4">
            <div className="grid gap-3 rounded-md bg-slate-50 p-4 sm:grid-cols-2"><div><p className="text-xs text-muted-foreground">Telefone</p><p className="font-medium">{selecionado.telefone}</p></div><div><p className="text-xs text-muted-foreground">Cliente no sistema</p><p className="font-medium">{selecionado.cliente?.nome || "Não encontrado — selecione ou cadastre no agendamento"}</p></div></div>
            {!selecionado.cliente && selecionado.status === "PENDENTE" ? <Button variant="outline" className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50" onClick={() => abrirCadastroCliente(selecionado)}><UserPlus className="mr-2 h-4 w-4" />Cadastrar cliente com os dados deste pedido</Button> : null}
            <div className="divide-y rounded-md border">{(selecionado.itens?.escolhas || []).map((item) => <div key={item.opcaoId} className="flex justify-between p-3"><span>{item.nome}{item.adicionarFeijao ? " + feijão" : ""}</span><strong>{item.quantidade}x</strong></div>)}</div>
            {selecionado.observacoes ? <div><p className="text-xs text-muted-foreground">Observações</p><p className="whitespace-pre-wrap">{selecionado.observacoes}</p></div> : null}
            {selecionado.motivoDescarte ? <div className="rounded-md border border-red-200 bg-red-50 p-3"><p className="text-xs font-bold uppercase text-red-700">Motivo do descarte</p><p className="mt-1 text-red-900">{selecionado.motivoDescarte}</p></div> : null}
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => iniciarAgendamento(selecionado)} disabled={selecionado.status !== "PENDENTE"}><CalendarPlus className="mr-2 h-4 w-4" />Levar para o agendamento</Button>
            {selecionado.status === "PENDENTE" ? <Button variant="destructive" className="w-full" onClick={() => { setDescartando(selecionado); setSelecionado(null); }}><Trash2 className="mr-2 h-4 w-4" />Descartar pedido</Button> : null}
          </div> : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!descartando} onOpenChange={(open) => { if (!open) { setDescartando(null); setMotivoDescarte(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Descartar pedido #{descartando?.id}</DialogTitle></DialogHeader>
          <Textarea value={motivoDescarte} onChange={(event) => setMotivoDescarte(event.target.value)} placeholder="Informe obrigatoriamente o motivo do descarte" />
          <Button variant="destructive" disabled={!motivoDescarte.trim()} onClick={() => void descartarPedido()}>Confirmar descarte</Button>
        </DialogContent>
      </Dialog>

      <ClienteFormDialog
        open={clienteDialogOpen}
        onOpenChange={setClienteDialogOpen}
        title="Cadastrar cliente do pedido"
        saving={savingCliente}
        initialValue={pedidoParaCliente ? {
          nome: pedidoParaCliente.nome,
          telefone: pedidoParaCliente.telefone,
          cep: pedidoParaCliente.cep || "",
          uf: pedidoParaCliente.uf || "PR",
          cidade: pedidoParaCliente.cidade || "",
          bairro: pedidoParaCliente.bairro || "",
          logradouro: pedidoParaCliente.logradouro || "",
          numero: pedidoParaCliente.numero || "",
          complemento: pedidoParaCliente.complemento || "",
        } : null}
        onSubmit={createCliente}
        onCreated={async (cliente) => {
          if (!pedidoParaCliente || !cliente?.id) return;
          const res = await apiFetch(`${apiBase()}/pedidos-publicos/${pedidoParaCliente.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clienteId: Number(cliente.id) }),
          });
          const pedidoAtualizado = await res.json().catch(() => null);
          if (!res.ok) throw new Error(pedidoAtualizado?.message || "Não foi possível vincular o cliente ao pedido.");
          setSelecionado((atual) => atual?.id === pedidoParaCliente.id
            ? { ...atual, cliente: { id: Number(cliente.id), nome: cliente.nome, telefone: cliente.telefone } }
            : atual);
          setPedidoParaCliente(null);
          await carregar();
        }}
      />
    </div>
  );
}
