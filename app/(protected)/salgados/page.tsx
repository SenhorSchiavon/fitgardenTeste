"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardCheck, Cookie, ExternalLink, Minus, PackagePlus, Pencil, Plus, Save, Search, Trash, Warehouse, X } from "lucide-react";
import { Header } from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Salgado, useSalgados } from "@/hooks/useSalgados";
import { toast } from "sonner";

function moneyBr(value: number) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type MovimentoState = { item: Salgado | null; tipo: "ENTRADA" | "SAIDA"; quantidade: string };

export default function SalgadosPage() {
  const { salgados, loading, saving, createSalgado, updateSalgado, deleteSalgado } = useSalgados();
  const [busca, setBusca] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState({ nome: "", preco: "", quantidade: "" });
  const [movimento, setMovimento] = useState<MovimentoState>({ item: null, tipo: "ENTRADA", quantidade: "1" });
  const [conferenciaAtiva, setConferenciaAtiva] = useState(false);
  const [contagensConferencia, setContagensConferencia] = useState<Record<number, string>>({});
  const [conferidos, setConferidos] = useState<number[]>([]);
  const [salvandoConferencia, setSalvandoConferencia] = useState(false);
  const [buscaConferencia, setBuscaConferencia] = useState("");

  const salgadosOrdenados = useMemo(() => [...salgados].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")), [salgados]);
  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return salgadosOrdenados;
    return salgadosOrdenados.filter((s) => [String(s.id), s.nome, String(s.preco)].some((v) => v.toLowerCase().includes(q)));
  }, [salgadosOrdenados, busca]);
  const idsConferidos = useMemo(() => new Set(conferidos), [conferidos]);
  const naoConferidos = useMemo(() => salgadosOrdenados.filter((item) => !idsConferidos.has(item.id)), [salgadosOrdenados, idsConferidos]);
  const conferenciaFiltrada = useMemo(() => {
    const q = buscaConferencia.trim().toLowerCase();
    if (!q) return salgadosOrdenados;
    return salgadosOrdenados.filter((item) => item.nome.toLowerCase().includes(q));
  }, [salgadosOrdenados, buscaConferencia]);
  const totalEstoque = useMemo(() => salgados.reduce((total, item) => total + Number(item.quantidade || 0), 0), [salgados]);

  const resetForm = () => {
    setForm({ nome: "", preco: "", quantidade: "" });
    setEditandoId(null);
  };

  const quantidadeValida = (valor: string) => {
    const quantidade = Number(valor || 0);
    return Number.isInteger(quantidade) && quantidade >= 0 ? quantidade : null;
  };

  const handleSave = async () => {
    if (!form.nome.trim()) return toast.error("Nome é obrigatório");
    const preco = Number(String(form.preco || 0).replace(",", "."));
    if (!Number.isFinite(preco) || preco < 0) return toast.error("Preço inválido");
    const quantidade = quantidadeValida(form.quantidade);
    if (quantidade == null) return toast.error("Estoque inválido");

    if (editandoId) await updateSalgado(editandoId, { nome: form.nome, preco, quantidade });
    else await createSalgado({ nome: form.nome, preco, quantidade });
    setDialogOpen(false);
    resetForm();
  };

  const handleEdit = (salgado: Salgado) => {
    setEditandoId(salgado.id);
    setForm({ nome: salgado.nome, preco: String(Number(salgado.preco || 0)), quantidade: String(Number(salgado.quantidade || 0)) });
    setDialogOpen(true);
  };

  const handleMovimento = async () => {
    if (!movimento.item) return;
    const quantidade = quantidadeValida(movimento.quantidade);
    if (quantidade == null || quantidade <= 0) return toast.error("Informe uma quantidade maior que zero");
    const atual = Number(movimento.item.quantidade || 0);
    const novaQuantidade = movimento.tipo === "ENTRADA" ? atual + quantidade : atual - quantidade;
    if (novaQuantidade < 0) return toast.error("Estoque insuficiente");
    await updateSalgado(movimento.item.id, { nome: movimento.item.nome, preco: movimento.item.preco, quantidade: novaQuantidade });
    setMovimento({ item: null, tipo: "ENTRADA", quantidade: "1" });
  };

  const iniciarConferencia = () => {
    setContagensConferencia(Object.fromEntries(salgados.map((item) => [item.id, String(item.quantidade)])));
    setConferidos([]);
    setBuscaConferencia("");
    setConferenciaAtiva(true);
  };

  const cancelarConferencia = () => {
    setConferenciaAtiva(false);
    setContagensConferencia({});
    setConferidos([]);
    setBuscaConferencia("");
  };

  const marcarConferido = (id: number, valor: string) => {
    setContagensConferencia((atual) => ({ ...atual, [id]: valor }));
    setConferidos((atuais) => (atuais.includes(id) ? atuais : [...atuais, id]));
  };

  const ajustarConferencia = (item: Salgado, delta: number) => {
    const atual = Number(contagensConferencia[item.id] ?? item.quantidade);
    marcarConferido(item.id, String(Math.max(0, atual + delta)));
  };

  const salvarConferencia = async () => {
    const itensConferidos = salgadosOrdenados.filter((item) => idsConferidos.has(item.id));
    if (!itensConferidos.length) return toast.error("Nenhum item conferido");
    if (itensConferidos.some((item) => quantidadeValida(contagensConferencia[item.id] ?? String(item.quantidade)) == null)) {
      return toast.error("Confira as quantidades digitadas");
    }
    const alterados = itensConferidos
      .map((item) => ({ item, quantidade: Number(contagensConferencia[item.id] ?? item.quantidade) }))
      .filter(({ item, quantidade }) => quantidade !== item.quantidade);

    setSalvandoConferencia(true);
    try {
      for (const { item, quantidade } of alterados) {
        await updateSalgado(item.id, { nome: item.nome, preco: item.preco, quantidade });
      }
      toast.success(alterados.length ? `Conferência salva: ${alterados.length} salgado(s) ajustado(s).` : "Conferência salva sem alteração de estoque.");
      cancelarConferencia();
    } finally {
      setSalvandoConferencia(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await deleteSalgado(deleteId);
    setDeleteOpen(false);
    setDeleteId(null);
  };

  return (
    <div className="container mx-auto space-y-6 p-6">
      <Header title="Salgados" subtitle="Controle o estoque dos salgados para venda no site" searchValue={!conferenciaAtiva ? busca : ""} onSearchChange={!conferenciaAtiva ? setBusca : undefined} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="border-gray-200 bg-white"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Total em estoque</CardTitle></CardHeader><CardContent className="flex items-end justify-between"><span className="text-3xl font-bold text-gray-900">{totalEstoque}</span><Warehouse className="h-8 w-8 text-blue-500" /></CardContent></Card>
        <Card className="border-gray-200 bg-white"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Tipos cadastrados</CardTitle></CardHeader><CardContent className="flex items-end justify-between"><span className="text-3xl font-bold text-gray-900">{salgados.length}</span><PackagePlus className="h-8 w-8 text-emerald-500" /></CardContent></Card>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" asChild><a href="/salgados-da-semana" target="_blank" rel="noreferrer">Página pública <ExternalLink className="ml-2 h-4 w-4" /></a></Button>
        {conferenciaAtiva ? <Button variant="outline" onClick={cancelarConferencia} disabled={salvandoConferencia || saving}><X className="mr-2 h-4 w-4" /> Sair da conferência</Button> : <Button variant="outline" onClick={iniciarConferencia} disabled={loading || saving}><ClipboardCheck className="mr-2 h-4 w-4" /> Modo Conferência</Button>}
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="bg-blue-600 text-white hover:bg-blue-700"><Plus className="mr-2 h-4 w-4" /> Novo Salgado</Button>
      </div>

      {conferenciaAtiva ? (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="sticky top-0 z-10 border-b border-blue-100 bg-blue-50/95 pb-4 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><CardTitle className="flex items-center gap-2 text-gray-900"><ClipboardCheck className="h-5 w-5 text-blue-700" /> Conferência de salgados</CardTitle><p className="mt-1 text-sm text-blue-800">Lance a contagem física. Use Manter quando bate com o sistema, ou Zerar quando não veio na lista.</p></div>
              <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => naoConferidos.forEach((item) => marcarConferido(item.id, "0"))} disabled={salvandoConferencia || saving || !naoConferidos.length}>Zerar pendentes</Button><Button onClick={salvarConferencia} disabled={salvandoConferencia || saving}><Save className="mr-2 h-4 w-4" /> {salvandoConferencia ? "Salvando..." : "Salvar"}</Button></div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <div className="grid gap-3 md:grid-cols-[1fr_140px_140px_140px]">
              <div className="relative rounded-md border bg-white"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><Input value={buscaConferencia} onChange={(e) => setBuscaConferencia(e.target.value)} placeholder="Buscar salgado" className="h-full min-h-16 border-0 pl-9 text-base" /></div>
              <div className="rounded-md border bg-white p-3"><p className="text-xs font-semibold uppercase text-gray-500">Cadastrados</p><p className="text-2xl font-bold">{salgadosOrdenados.length}</p></div>
              <div className="rounded-md border bg-white p-3"><p className="text-xs font-semibold uppercase text-gray-500">Conferidos</p><p className="text-2xl font-bold text-emerald-700">{conferidos.length}</p></div>
              <div className="rounded-md border bg-white p-3"><p className="text-xs font-semibold uppercase text-gray-500">Pendentes</p><p className="text-2xl font-bold text-amber-700">{naoConferidos.length}</p></div>
            </div>
            <div className="grid gap-2">
              {conferenciaFiltrada.map((item) => {
                const conferido = idsConferidos.has(item.id);
                const contagem = contagensConferencia[item.id] ?? String(item.quantidade);
                const mudou = Number(contagem) !== item.quantidade;
                return (
                  <div key={item.id} className={`grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_110px_220px_140px] md:items-center ${conferido ? "border-emerald-200 bg-white" : "border-amber-200 bg-amber-50"}`}>
                    <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-bold text-gray-900">{item.nome}</p><Badge variant="secondary">{moneyBr(item.preco)}</Badge>{conferido ? <Badge className="bg-emerald-600"><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Conferido</Badge> : null}{mudou ? <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-800">Vai ajustar</Badge> : null}</div><p className="mt-1 text-sm text-gray-500">Sistema: {item.quantidade} un.</p></div>
                    <div className="flex items-center gap-1 md:justify-center"><Button size="icon" variant="outline" className="h-9 w-9" onClick={() => ajustarConferencia(item, -1)} disabled={salvandoConferencia || saving}><Minus className="h-4 w-4" /></Button><Button size="icon" variant="outline" className="h-9 w-9" onClick={() => ajustarConferencia(item, 1)} disabled={salvandoConferencia || saving}><Plus className="h-4 w-4" /></Button></div>
                    <Input type="number" min="0" step="1" inputMode="numeric" value={contagem} onChange={(e) => marcarConferido(item.id, e.target.value)} onFocus={(e) => marcarConferido(item.id, e.target.value)} className="h-12 text-center text-xl font-black" />
                    <div className="flex gap-2 md:justify-end"><Button variant="outline" className="flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 md:flex-none" onClick={() => marcarConferido(item.id, String(item.quantidade))} disabled={salvandoConferencia || saving}>Manter</Button><Button variant="outline" className="flex-1 border-red-200 text-red-700 hover:bg-red-50 md:flex-none" onClick={() => marcarConferido(item.id, "0")} disabled={salvandoConferencia || saving}>Zerar</Button></div>
                  </div>
                );
              })}
            </div>
            {naoConferidos.length ? <div className="rounded-md border border-amber-300 bg-white p-4"><p className="mb-2 flex items-center gap-2 font-bold text-amber-800"><AlertTriangle className="h-4 w-4" /> Salgados ainda não conferidos</p><div className="flex flex-wrap gap-2">{naoConferidos.map((item) => <Badge key={item.id} variant="outline" className="border-amber-300 bg-amber-50 text-amber-900">{item.nome} · atual {item.quantidade}</Badge>)}</div></div> : <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 font-semibold text-emerald-800">Todos os salgados foram conferidos.</div>}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-gray-200 bg-white">
          <CardHeader><CardTitle className="text-gray-800">Salgados cadastrados</CardTitle></CardHeader>
          <CardContent className="p-0">
            {loading ? <p className="p-5 text-sm text-gray-500">Carregando salgados...</p> : <div className="overflow-x-auto"><Table><TableHeader><TableRow className="bg-gray-50 hover:bg-gray-50"><TableHead className="text-gray-700">Salgado</TableHead><TableHead className="w-28 text-center text-gray-700">Preço</TableHead><TableHead className="w-24 text-center text-gray-700">Estoque</TableHead><TableHead className="w-56 text-right text-gray-700">Ações</TableHead></TableRow></TableHeader><TableBody>{filtrados.map((salgado) => <TableRow key={salgado.id} className="border-b border-gray-100 hover:bg-gray-50"><TableCell className="text-gray-800"><div className="flex items-center gap-2"><Cookie className="h-4 w-4 text-amber-600" /><span className="font-medium">{salgado.nome}</span></div></TableCell><TableCell className="text-center font-semibold text-gray-700">{moneyBr(salgado.preco)}</TableCell><TableCell className="text-center"><span className="inline-flex min-w-12 justify-center rounded-md bg-gray-100 px-2 py-1 text-lg font-bold text-gray-900">{salgado.quantidade}</span></TableCell><TableCell className="text-right"><div className="flex items-center justify-end gap-1"><Button size="icon" title="Adicionar" className="h-8 w-8 bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => setMovimento({ item: salgado, tipo: "ENTRADA", quantidade: "1" })} disabled={saving}><Plus className="h-4 w-4" /></Button><Button size="icon" title="Remover" variant="outline" className="h-8 w-8 border-red-200 text-red-700 hover:bg-red-50" onClick={() => setMovimento({ item: salgado, tipo: "SAIDA", quantidade: "1" })} disabled={saving || salgado.quantidade === 0}><Minus className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:bg-blue-50 hover:text-blue-600" onClick={() => handleEdit(salgado)} disabled={saving}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:bg-red-50 hover:text-red-600" onClick={() => { setDeleteId(salgado.id); setDeleteOpen(true); }} disabled={saving}><Trash className="h-4 w-4" /></Button></div></TableCell></TableRow>)}{filtrados.length === 0 && !loading ? <TableRow><TableCell colSpan={4} className="py-8 text-center text-sm text-gray-500">Nenhum salgado cadastrado.</TableCell></TableRow> : null}</TableBody></Table></div>}
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="bg-white"><DialogHeader><DialogTitle className="text-gray-800">{editandoId ? "Editar Salgado" : "Novo Salgado"}</DialogTitle></DialogHeader><div className="space-y-4 py-2"><div className="space-y-2"><Label htmlFor="nome" className="text-gray-700">Nome</Label><Input id="nome" value={form.nome} onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))} className="border-gray-200" /></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="preco" className="text-gray-700">Preço</Label><Input id="preco" type="number" step="0.01" inputMode="decimal" value={form.preco} onChange={(e) => setForm((p) => ({ ...p, preco: e.target.value }))} className="border-gray-200" /></div><div className="space-y-2"><Label htmlFor="quantidade" className="text-gray-700">Estoque</Label><Input id="quantidade" type="number" min="0" step="1" inputMode="numeric" value={form.quantidade} onChange={(e) => setForm((p) => ({ ...p, quantidade: e.target.value }))} className="border-gray-200" /></div></div><div className="flex justify-end gap-2 pt-4"><Button onClick={() => setDialogOpen(false)} className="border border-gray-200 bg-white text-gray-700 hover:bg-gray-50" disabled={saving}>Cancelar</Button><Button onClick={handleSave} className="bg-blue-600 text-white hover:bg-blue-700" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button></div></div></DialogContent>
      </Dialog>

      <Dialog open={Boolean(movimento.item)} onOpenChange={(open) => { if (!open) setMovimento({ item: null, tipo: "ENTRADA", quantidade: "1" }); }}>
        <DialogContent className="bg-white"><DialogHeader><DialogTitle className="text-gray-800">{movimento.tipo === "SAIDA" ? "Remover do estoque" : "Adicionar ao estoque"}</DialogTitle></DialogHeader><div className="space-y-4 py-2"><div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700"><span className="font-medium">{movimento.item?.nome}</span><span className="ml-2 text-gray-500">Estoque atual: {movimento.item?.quantidade ?? 0}</span></div><div className="space-y-2"><Label htmlFor="movimento-quantidade" className="text-gray-700">Quantidade</Label><Input id="movimento-quantidade" type="number" min="1" step="1" inputMode="numeric" value={movimento.quantidade} onChange={(e) => setMovimento((prev) => ({ ...prev, quantidade: e.target.value }))} className="border-gray-200" /></div><div className="flex justify-end gap-2 pt-4"><Button onClick={() => setMovimento({ item: null, tipo: "ENTRADA", quantidade: "1" })} className="border border-gray-200 bg-white text-gray-700 hover:bg-gray-50" disabled={saving}>Cancelar</Button><Button onClick={handleMovimento} className={movimento.tipo === "SAIDA" ? "bg-red-600 text-white hover:bg-red-700" : "bg-emerald-600 text-white hover:bg-emerald-700"} disabled={saving}>{saving ? "Salvando..." : movimento.tipo === "SAIDA" ? "Remover" : "Adicionar"}</Button></div></div></DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={(open) => { setDeleteOpen(open); if (!open) setDeleteId(null); }}>
        <AlertDialogContent className="bg-white"><AlertDialogHeader><AlertDialogTitle className="text-gray-800">Excluir salgado?</AlertDialogTitle><AlertDialogDescription className="text-gray-600">O salgado será ocultado de novos pedidos, mas pedidos antigos continuam preservados.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="border-gray-200 text-gray-700 hover:bg-gray-50" disabled={saving}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-red-600 text-white hover:bg-red-700" disabled={saving}>{saving ? "Excluindo..." : "Excluir"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
