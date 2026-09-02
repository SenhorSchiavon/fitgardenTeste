"use client";

import { useCallback, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardCheck, RefreshCw, RotateCcw, Minus, PackagePlus, Plus, Save, Search, Warehouse, X } from "lucide-react";
import { Header } from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { apiFetch } from "@/hooks/api";
import { Congelada, CongeladaMovimentoTipo, useCongeladas } from "@/hooks/useCongeladas";
import { useOpcoes } from "@/hooks/useOpcoes";

type FormState = {
  nome: string;
  tamanhoGramas: "200" | "300" | "400";
  quantidade: string;
};

const TAMANHOS_CONGELADAS = [200, 300, 400] as const;

type MovimentoState = {
  item: Congelada | null;
  tipo: CongeladaMovimentoTipo;
  quantidade: string;
};

type ReservaEstoqueItem = {
  congeladaId?: number;
  salgadoId?: number;
  nome: string;
  tamanhoGramas?: number;
  quantidade: number;
};

type PedidoComReserva = {
  id: number;
  nome?: string | null;
  telefone?: string | null;
  origem?: string | null;
  createdAt?: string | null;
  itens?: {
    congeladas?: ReservaEstoqueItem[];
    salgados?: ReservaEstoqueItem[];
    estoqueReservado?: boolean;
  } | null;
  cliente?: {
    nome?: string | null;
    telefone?: string | null;
  } | null;
};

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api").replace(/\/+$/, "");

export default function CongeladasPage() {
  const {
    congeladas,
    loading,
    saving,
    fetchCongeladas,
    createCongelada,
    movimentarCongelada,
  } = useCongeladas();
  const { opcoes, loading: loadingOpcoes } = useOpcoes();

  const [buscas, setBuscas] = useState<Record<number, string>>({ 200: "", 300: "", 400: "" });
  const [opcaoBusca, setOpcaoBusca] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>({ nome: "", tamanhoGramas: "300", quantidade: "0" });
  const [movimento, setMovimento] = useState<MovimentoState>({
    item: null,
    tipo: "ENTRADA",
    quantidade: "1",
  });
  const [conferenciaAtiva, setConferenciaAtiva] = useState(false);
  const [contagensConferencia, setContagensConferencia] = useState<Record<number, string>>({});
  const [conferidos, setConferidos] = useState<number[]>([]);
  const [salvandoConferencia, setSalvandoConferencia] = useState(false);
  const [buscaConferencia, setBuscaConferencia] = useState("");
  const [reservasOpen, setReservasOpen] = useState(false);
  const [reservas, setReservas] = useState<PedidoComReserva[]>([]);
  const [carregandoReservas, setCarregandoReservas] = useState(false);
  const [selecionadasReservas, setSelecionadasReservas] = useState<number[]>([]);
  const [buscaReservas, setBuscaReservas] = useState("");
  const [motivoLiberacao, setMotivoLiberacao] = useState("Pedido pendente sem uso do estoque reservado");
  const [liberandoReservas, setLiberandoReservas] = useState(false);

  const listasPorTamanho = useMemo(
    () => TAMANHOS_CONGELADAS.map((tamanho) => ({
      tamanho,
      itens: congeladas.filter((item) =>
        item.tamanhoGramas === tamanho && item.nome.toLowerCase().includes((buscas[tamanho] || "").trim().toLowerCase()),
      ),
    })),
    [congeladas, buscas],
  );

  const opcoesMarmita = useMemo(() => {
    const busca = opcaoBusca.trim().toLowerCase();
    return opcoes
      .filter((opcao) => opcao.tipo === "MARMITA" && (!busca || opcao.nome.toLowerCase().includes(busca)))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [opcoes, opcaoBusca]);

  const totalEstoque = useMemo(
    () => congeladas.reduce((total, item) => total + item.quantidade, 0),
    [congeladas],
  );
  const congeladasConferencia = useMemo(
    () => [...congeladas].sort((a, b) => a.tamanhoGramas - b.tamanhoGramas || a.nome.localeCompare(b.nome, "pt-BR")),
    [congeladas],
  );
  const idsConferidos = useMemo(() => new Set(conferidos), [conferidos]);
  const naoConferidas = useMemo(
    () => congeladasConferencia.filter((item) => !idsConferidos.has(item.id)),
    [congeladasConferencia, idsConferidos],
  );
  const congeladasConferenciaFiltradas = useMemo(() => {
    const busca = buscaConferencia.trim().toLowerCase();
    if (!busca) return congeladasConferencia;
    return congeladasConferencia.filter((item) =>
      [item.nome, `${item.tamanhoGramas}g`].some((value) => value.toLowerCase().includes(busca)),
    );
  }, [buscaConferencia, congeladasConferencia]);
  const reservasFiltradas = useMemo(() => {
    const busca = buscaReservas.trim().toLowerCase();
    if (!busca) return reservas;
    return reservas.filter((pedido) => {
      const itens = [
        ...(pedido.itens?.congeladas || []),
        ...(pedido.itens?.salgados || []),
      ];
      return [
        String(pedido.id),
        pedido.nome,
        pedido.telefone,
        pedido.cliente?.nome,
        pedido.cliente?.telefone,
        ...itens.map((item) => item.nome),
      ].some((value) => String(value || "").toLowerCase().includes(busca));
    });
  }, [reservas, buscaReservas]);
  const idsReservasFiltradas = useMemo(() => reservasFiltradas.map((pedido) => pedido.id), [reservasFiltradas]);
  const selecionadasSet = useMemo(() => new Set(selecionadasReservas), [selecionadasReservas]);
  const todasReservasSelecionadas = idsReservasFiltradas.length > 0 && idsReservasFiltradas.every((id) => selecionadasSet.has(id));

  const carregarReservas = useCallback(async () => {
    setCarregandoReservas(true);
    try {
      const url = new URL(`${API_URL}/pedidos-publicos`);
      url.searchParams.set("status", "PENDENTE");
      url.searchParams.set("estoqueReservado", "true");

      const res = await apiFetch(url.toString(), { cache: "no-store" });
      if (!res.ok) throw new Error("Falha ao carregar reservas pendentes");
      const data = await res.json();
      const pedidos = Array.isArray(data) ? data : [];
      setReservas(pedidos);
      setSelecionadasReservas((atuais) => atuais.filter((id) => pedidos.some((pedido: PedidoComReserva) => pedido.id === id)));
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Erro ao carregar reservas pendentes");
    } finally {
      setCarregandoReservas(false);
    }
  }, []);

  const resetForm = () => {
    setForm({ nome: "", tamanhoGramas: "300", quantidade: "0" });
    setOpcaoBusca("");
  };

  const handleNew = () => {
    resetForm();
    setFormOpen(true);
  };

  const abrirReservas = () => {
    setReservasOpen(true);
    void carregarReservas();
  };

  const alternarReserva = (id: number, checked: boolean) => {
    setSelecionadasReservas((atuais) => (
      checked ? [...new Set([...atuais, id])] : atuais.filter((item) => item !== id)
    ));
  };

  const alternarTodasReservas = (checked: boolean) => {
    setSelecionadasReservas((atuais) => (
      checked
        ? [...new Set([...atuais, ...idsReservasFiltradas])]
        : atuais.filter((id) => !idsReservasFiltradas.includes(id))
    ));
  };

  const totalItensReserva = (pedido: PedidoComReserva) => [
    ...(pedido.itens?.congeladas || []),
    ...(pedido.itens?.salgados || []),
  ].reduce((total, item) => total + Number(item.quantidade || 0), 0);

  const liberarReservasSelecionadas = async () => {
    const motivo = motivoLiberacao.trim();
    if (!selecionadasReservas.length) {
      toast.error("Selecione ao menos um pedido");
      return;
    }
    if (!motivo) {
      toast.error("Informe o motivo da liberação");
      return;
    }

    setLiberandoReservas(true);
    try {
      const res = await apiFetch(`${API_URL}/pedidos-publicos/lote/liberar-reservas`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selecionadasReservas, motivo }),
      });
      if (!res.ok) {
        const erro = await res.json().catch(() => null);
        throw new Error(erro?.message || erro?.error || "Falha ao liberar reservas");
      }
      const data = await res.json();
      toast.success(`${Number(data?.liberados || 0)} pedido(s) com estoque liberado`);
      setSelecionadasReservas([]);
      await Promise.all([carregarReservas(), fetchCongeladas()]);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Erro ao liberar reservas");
    } finally {
      setLiberandoReservas(false);
    }
  };

  const iniciarConferencia = () => {
    setContagensConferencia(Object.fromEntries(congeladas.map((item) => [item.id, String(item.quantidade)])));
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

  const ajustarConferencia = (item: Congelada, delta: number) => {
    const atual = Number(contagensConferencia[item.id] ?? item.quantidade);
    marcarConferido(item.id, String(Math.max(0, atual + delta)));
  };

  const salvarConferencia = async () => {
    const itensConferidos = congeladasConferencia.filter((item) => idsConferidos.has(item.id));
    if (!itensConferidos.length) {
      toast.error("Nenhum item conferido");
      return;
    }

    const invalidos = itensConferidos.filter((item) => {
      const valor = Number(contagensConferencia[item.id] ?? item.quantidade);
      return !Number.isInteger(valor) || valor < 0;
    });
    if (invalidos.length) {
      toast.error("Confira as quantidades digitadas");
      return;
    }

    const alterados = itensConferidos
      .map((item) => ({
        item,
        quantidade: Number(contagensConferencia[item.id] ?? item.quantidade),
      }))
      .filter(({ item, quantidade }) => quantidade !== item.quantidade);

    setSalvandoConferencia(true);
    try {
      for (const { item, quantidade } of alterados) {
        await movimentarCongelada(item.id, {
          tipo: "AJUSTE",
          quantidade,
          observacao: "Ajuste por modo conferencia",
        });
      }
      toast.success(
        alterados.length
          ? `Conferência salva: ${alterados.length} item(ns) ajustado(s).`
          : "Conferência salva sem alteração de estoque.",
      );
      cancelarConferencia();
    } finally {
      setSalvandoConferencia(false);
    }
  };

  const handleSave = async () => {
    if (!form.nome.trim()) {
      toast.error("Nome e obrigatorio");
      return;
    }

    const quantidade = Number(form.quantidade || 0);
    if (!Number.isInteger(quantidade) || quantidade < 0) {
      toast.error("Quantidade invalida");
      return;
    }

    const tamanhoGramas = Number(form.tamanhoGramas) as 200 | 300 | 400;
    await createCongelada({ nome: form.nome, tamanhoGramas, quantidade });

    setFormOpen(false);
    resetForm();
  };

  const openMovimento = (item: Congelada, tipo: CongeladaMovimentoTipo) => {
    setMovimento({
      item,
      tipo,
      quantidade: "1",
    });
  };

  const handleMovimento = async () => {
    if (!movimento.item) return;

    const quantidade = Number(movimento.quantidade || 0);
    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      toast.error("Informe uma quantidade maior que zero");
      return;
    }

    await movimentarCongelada(movimento.item.id, {
      tipo: movimento.tipo,
      quantidade,
    });

    setMovimento({ item: null, tipo: "ENTRADA", quantidade: "1" });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Header
        title="Congeladas"
        subtitle="Controle o estoque das marmitas congeladas dos freezers da recepcao"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="border-gray-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total no freezer</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <span className="text-3xl font-bold text-gray-900">{totalEstoque}</span>
            <Warehouse className="h-8 w-8 text-blue-500" />
          </CardContent>
        </Card>
        <Card className="border-gray-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Tipos cadastrados</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <span className="text-3xl font-bold text-gray-900">{congeladas.length}</span>
            <PackagePlus className="h-8 w-8 text-emerald-500" />
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" onClick={abrirReservas} disabled={loading || saving}>
          <RotateCcw className="mr-2 h-4 w-4" /> Reservas pendentes
        </Button>
        {conferenciaAtiva ? (
          <Button variant="outline" onClick={cancelarConferencia} disabled={salvandoConferencia || saving}>
            <X className="mr-2 h-4 w-4" /> Sair da conferência
          </Button>
        ) : (
          <Button variant="outline" onClick={iniciarConferencia} disabled={loading || saving}>
            <ClipboardCheck className="mr-2 h-4 w-4" /> Modo Conferência
          </Button>
        )}
        <Button onClick={handleNew} className="bg-blue-600 text-white hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Nova Congelada
        </Button>
      </div>

      {conferenciaAtiva ? (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="sticky top-0 z-10 border-b border-blue-100 bg-blue-50/95 pb-4 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <ClipboardCheck className="h-5 w-5 text-blue-700" /> Conferência de estoque
                </CardTitle>
                <p className="mt-1 text-sm text-blue-800">
                  Lance a quantidade contada no freezer. Use Manter quando o saldo físico bate com o sistema, ou Zerar quando não veio na lista.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => naoConferidas.forEach((item) => marcarConferido(item.id, "0"))} disabled={salvandoConferencia || saving || !naoConferidas.length}>
                  Zerar pendentes
                </Button>
                <Button onClick={salvarConferencia} disabled={salvandoConferencia || saving}>
                  <Save className="mr-2 h-4 w-4" /> {salvandoConferencia ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <div className="grid gap-3 md:grid-cols-[1fr_140px_140px_140px]">
              <div className="relative rounded-md border bg-white">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={buscaConferencia}
                  onChange={(event) => setBuscaConferencia(event.target.value)}
                  placeholder="Buscar por nome ou tamanho"
                  className="h-full min-h-16 border-0 pl-9 text-base"
                />
              </div>
              <div className="rounded-md border bg-white p-3">
                <p className="text-xs font-semibold uppercase text-gray-500">Cadastrados</p>
                <p className="text-2xl font-bold text-gray-900">{congeladasConferencia.length}</p>
              </div>
              <div className="rounded-md border bg-white p-3">
                <p className="text-xs font-semibold uppercase text-gray-500">Conferidos</p>
                <p className="text-2xl font-bold text-emerald-700">{conferidos.length}</p>
              </div>
              <div className="rounded-md border bg-white p-3">
                <p className="text-xs font-semibold uppercase text-gray-500">Sem conferência</p>
                <p className="text-2xl font-bold text-amber-700">{naoConferidas.length}</p>
              </div>
            </div>
            <div className="grid gap-2">
              {congeladasConferenciaFiltradas.map((item) => {
                const conferido = idsConferidos.has(item.id);
                const contagem = contagensConferencia[item.id] ?? String(item.quantidade);
                const mudou = Number(contagem) !== item.quantidade;
                return (
                  <div key={item.id} className={`grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_110px_220px_140px] md:items-center ${conferido ? "border-emerald-200 bg-white" : "border-amber-200 bg-amber-50"}`}>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-gray-900">{item.nome}</p>
                        <Badge variant="secondary">{item.tamanhoGramas}g</Badge>
                        {conferido ? <Badge className="bg-emerald-600"><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Conferido</Badge> : null}
                        {mudou ? <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-800">Vai ajustar</Badge> : null}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">Sistema: {item.quantidade} un.</p>
                    </div>
                    <div className="flex items-center gap-1 md:justify-center">
                      <Button size="icon" variant="outline" className="h-9 w-9" onClick={() => ajustarConferencia(item, -1)} disabled={salvandoConferencia || saving}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="outline" className="h-9 w-9" onClick={() => ajustarConferencia(item, 1)} disabled={salvandoConferencia || saving}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      value={contagem}
                      onChange={(event) => marcarConferido(item.id, event.target.value)}
                      onFocus={(event) => marcarConferido(item.id, event.target.value)}
                      className="h-12 text-center text-xl font-black"
                    />
                    <div className="flex gap-2 md:justify-end">
                      <Button variant="outline" className="flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 md:flex-none" onClick={() => marcarConferido(item.id, String(item.quantidade))} disabled={salvandoConferencia || saving}>
                        Manter
                      </Button>
                      <Button variant="outline" className="flex-1 border-red-200 text-red-700 hover:bg-red-50 md:flex-none" onClick={() => marcarConferido(item.id, "0")} disabled={salvandoConferencia || saving}>
                        Zerar
                      </Button>
                    </div>
                  </div>
                );
              })}
              {!congeladasConferenciaFiltradas.length ? (
                <div className="rounded-md border border-dashed bg-white p-8 text-center text-sm text-gray-500">
                  Nenhuma congelada encontrada para essa busca.
                </div>
              ) : null}
            </div>
            {naoConferidas.length ? (
              <div className="rounded-md border border-amber-300 bg-white p-4">
                <p className="mb-2 flex items-center gap-2 font-bold text-amber-800">
                  <AlertTriangle className="h-4 w-4" /> Itens ainda não conferidos
                </p>
                <div className="flex flex-wrap gap-2">
                  {naoConferidas.map((item) => (
                    <Badge key={item.id} variant="outline" className="border-amber-300 bg-amber-50 text-amber-900">
                      {item.tamanhoGramas}g · {item.nome} · atual {item.quantidade}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 font-semibold text-emerald-800">
                Todos os itens cadastrados foram conferidos.
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {!conferenciaAtiva ? <div className="flex flex-col gap-6">
        {listasPorTamanho.map(({ tamanho, itens }) => (
          <Card key={tamanho} className="min-w-0 border-gray-200 bg-white">
            <CardHeader className="border-b border-gray-100 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-gray-800">Congeladas {tamanho}g</CardTitle>
                  <Badge variant="secondary">{itens.reduce((total, item) => total + item.quantidade, 0)} un.</Badge>
                </div>
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    value={buscas[tamanho] || ""}
                    onChange={(event) => setBuscas((atual) => ({ ...atual, [tamanho]: event.target.value }))}
                    placeholder={`Buscar nas marmitas de ${tamanho}g`}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <p className="p-5 text-sm text-gray-500">Carregando congeladas...</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 hover:bg-gray-50">
                        <TableHead className="text-gray-700">Marmita</TableHead>
                        <TableHead className="w-24 text-center text-gray-700">Estoque</TableHead>
                        <TableHead className="w-44 text-right text-gray-700">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itens.map((item) => {
                        return (
                          <TableRow key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <TableCell className="text-gray-800">
                              <div className="font-medium">{item.nome}</div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="inline-flex min-w-12 justify-center rounded-md bg-gray-100 px-2 py-1 text-lg font-bold text-gray-900">
                                {item.quantidade}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button size="icon" title="Adicionar" className="h-8 w-8 bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => openMovimento(item, "ENTRADA")} disabled={saving}>
                                  <Plus className="h-4 w-4" />
                                </Button>
                                <Button size="icon" title="Remover" variant="outline" className="h-8 w-8 border-red-200 text-red-700 hover:bg-red-50" onClick={() => openMovimento(item, "SAIDA")} disabled={saving || item.quantidade === 0}>
                                  <Minus className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {itens.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="py-8 text-center text-sm text-gray-500">
                            Nenhuma congelada de {tamanho}g cadastrada.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div> : null}

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-800">
              Nova Congelada
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-gray-700">Tamanho da marmita</Label>
              <div className="grid grid-cols-3 gap-2">
                {TAMANHOS_CONGELADAS.map((tamanho) => (
                  <Button
                    key={tamanho}
                    type="button"
                    variant={form.tamanhoGramas === String(tamanho) ? "default" : "outline"}
                    className={form.tamanhoGramas === String(tamanho) ? "bg-blue-600 text-white hover:bg-blue-700" : "border-gray-200"}
                    onClick={() => setForm((prev) => ({ ...prev, tamanhoGramas: String(tamanho) as FormState["tamanhoGramas"] }))}
                  >
                    {tamanho}g
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nome-busca" className="text-gray-700">Nome da marmita</Label>
              <Input
                id="nome-busca"
                value={opcaoBusca}
                onChange={(e) => { setOpcaoBusca(e.target.value); setForm((prev) => ({ ...prev, nome: "" })); }}
                className="border-gray-200"
                placeholder="Busque uma marmita cadastrada"
              />
              <div className="max-h-52 overflow-y-auto rounded-md border border-gray-200">
                {opcoesMarmita.map((opcao) => {
                  const repetida = congeladas.some((item) => item.tamanhoGramas === Number(form.tamanhoGramas) && item.nome.toLowerCase() === opcao.nome.toLowerCase());
                  return (
                    <button
                      key={opcao.id}
                      type="button"
                      disabled={repetida}
                      onClick={() => { setForm((prev) => ({ ...prev, nome: opcao.nome })); setOpcaoBusca(opcao.nome); }}
                      className={`block w-full border-b px-3 py-2 text-left text-sm last:border-b-0 ${form.nome === opcao.nome ? "bg-blue-50 font-semibold text-blue-700" : "hover:bg-gray-50"} disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400`}
                    >
                      {opcao.nome}{repetida ? ` (já cadastrada em ${form.tamanhoGramas}g)` : ""}
                    </button>
                  );
                })}
                {!loadingOpcoes && opcoesMarmita.length === 0 && <p className="p-3 text-sm text-gray-500">Nenhuma marmita ativa encontrada.</p>}
              </div>
            </div>
                <div className="space-y-2">
                  <Label htmlFor="quantidade" className="text-gray-700">Quantidade inicial</Label>
                  <Input
                    id="quantidade"
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={form.quantidade}
                    onChange={(e) => setForm((prev) => ({ ...prev, quantidade: e.target.value }))}
                    className="border-gray-200"
                  />
                </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                onClick={() => setFormOpen(false)}
                className="border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button onClick={handleSave} className="bg-blue-600 text-white hover:bg-blue-700" disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(movimento.item)}
        onOpenChange={(open) => {
          if (!open) setMovimento({ item: null, tipo: "ENTRADA", quantidade: "1" });
        }}
      >
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-800">
              {movimento.tipo === "SAIDA" ? "Remover do estoque" : "Adicionar ao estoque"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
              <span className="font-medium">{movimento.item?.nome}</span>
              <Badge variant="outline" className="ml-2">{movimento.item?.tamanhoGramas}g</Badge>
              <span className="ml-2 text-gray-500">Estoque atual: {movimento.item?.quantidade ?? 0}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="movimento-quantidade" className="text-gray-700">Quantidade</Label>
              <Input
                id="movimento-quantidade"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={movimento.quantidade}
                onChange={(e) => setMovimento((prev) => ({ ...prev, quantidade: e.target.value }))}
                className="border-gray-200"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                onClick={() => setMovimento({ item: null, tipo: "ENTRADA", quantidade: "1" })}
                className="border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleMovimento}
                className={movimento.tipo === "SAIDA" ? "bg-red-600 text-white hover:bg-red-700" : "bg-emerald-600 text-white hover:bg-emerald-700"}
                disabled={saving}
              >
                {saving ? "Salvando..." : movimento.tipo === "SAIDA" ? "Remover" : "Adicionar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={reservasOpen}
        onOpenChange={(open) => {
          setReservasOpen(open);
          if (open) {
            void carregarReservas();
          } else {
            setBuscaReservas("");
            setSelecionadasReservas([]);
          }
        }}
      >
        <DialogContent className="flex max-h-[86vh] max-w-5xl flex-col overflow-hidden bg-white p-0">
          <DialogHeader className="border-b px-6 py-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <DialogTitle className="text-gray-900">Reservas pendentes de estoque</DialogTitle>
                <p className="mt-1 text-sm text-gray-500">
                  Libera congeladas reservadas por pedidos públicos pendentes sem descartar o pedido.
                </p>
              </div>
              <Button variant="outline" onClick={carregarReservas} disabled={carregandoReservas || liberandoReservas}>
                <RefreshCw className={`mr-2 h-4 w-4 ${carregandoReservas ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
            </div>
          </DialogHeader>

          <div className="grid gap-3 border-b bg-gray-50 px-6 py-4 md:grid-cols-[1fr_180px_180px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={buscaReservas}
                onChange={(event) => setBuscaReservas(event.target.value)}
                placeholder="Buscar por pedido, cliente, telefone ou marmita"
                className="pl-9"
              />
            </div>
            <div className="rounded-md border bg-white px-3 py-2">
              <p className="text-xs font-semibold uppercase text-gray-500">Pedidos filtrados</p>
              <p className="text-xl font-bold text-gray-900">{reservasFiltradas.length}</p>
            </div>
            <div className="rounded-md border bg-white px-3 py-2">
              <p className="text-xs font-semibold uppercase text-gray-500">Selecionados</p>
              <p className="text-xl font-bold text-emerald-700">{selecionadasReservas.length}</p>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center gap-3 border-b px-6 py-3">
              <Checkbox
                checked={todasReservasSelecionadas}
                onCheckedChange={(checked) => alternarTodasReservas(Boolean(checked))}
                disabled={!idsReservasFiltradas.length || carregandoReservas || liberandoReservas}
              />
              <span className="text-sm font-medium text-gray-700">Selecionar pedidos visíveis</span>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              {carregandoReservas ? (
                <div className="rounded-md border border-dashed p-8 text-center text-sm text-gray-500">
                  Carregando reservas pendentes...
                </div>
              ) : reservasFiltradas.length ? (
                <div className="space-y-3">
                  {reservasFiltradas.map((pedido) => {
                    const congeladasReservadas = pedido.itens?.congeladas || [];
                    const salgadosReservados = pedido.itens?.salgados || [];
                    const selecionado = selecionadasSet.has(pedido.id);
                    return (
                      <div key={pedido.id} className={`rounded-md border p-4 ${selecionado ? "border-emerald-300 bg-emerald-50" : "border-gray-200 bg-white"}`}>
                        <div className="flex flex-wrap items-start gap-3">
                          <Checkbox
                            checked={selecionado}
                            onCheckedChange={(checked) => alternarReserva(pedido.id, Boolean(checked))}
                            disabled={liberandoReservas}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-gray-900">Pedido #{pedido.id}</span>
                              <Badge className="bg-amber-600">Estoque reservado</Badge>
                              <Badge variant="outline">{totalItensReserva(pedido)} item(ns)</Badge>
                            </div>
                            <p className="mt-1 text-sm text-gray-600">
                              {pedido.nome || pedido.cliente?.nome || "Cliente sem nome"}
                              {pedido.telefone || pedido.cliente?.telefone ? ` - ${pedido.telefone || pedido.cliente?.telefone}` : ""}
                            </p>
                            {pedido.createdAt ? (
                              <p className="text-xs text-gray-400">
                                Criado em {new Date(pedido.createdAt).toLocaleString("pt-BR")}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <div className="mt-3 grid gap-2 pl-8">
                          {congeladasReservadas.map((item, index) => (
                            <div key={`congelada-${pedido.id}-${item.congeladaId || index}`} className="rounded-md bg-white px-3 py-2 text-sm text-gray-800">
                              <span className="font-bold">{item.quantidade}x</span> {item.nome}
                              {item.tamanhoGramas ? <Badge variant="secondary" className="ml-2">{item.tamanhoGramas}g</Badge> : null}
                            </div>
                          ))}
                          {salgadosReservados.map((item, index) => (
                            <div key={`salgado-${pedido.id}-${item.salgadoId || index}`} className="rounded-md bg-white px-3 py-2 text-sm text-gray-800">
                              <span className="font-bold">{item.quantidade}x</span> {item.nome}
                              <Badge variant="outline" className="ml-2">Salgado</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-md border border-dashed p-8 text-center text-sm text-gray-500">
                  Nenhum pedido pendente com estoque reservado encontrado.
                </div>
              )}
            </div>
          </div>

          <div className="border-t bg-white px-6 py-4">
            <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
              <div className="space-y-2">
                <Label htmlFor="motivo-liberacao" className="text-gray-700">Motivo da liberação</Label>
                <Textarea
                  id="motivo-liberacao"
                  value={motivoLiberacao}
                  onChange={(event) => setMotivoLiberacao(event.target.value)}
                  className="min-h-20 border-gray-200"
                  placeholder="Ex.: cliente não confirmou, pedido antigo, ajuste operacional..."
                />
              </div>
              <Button
                onClick={liberarReservasSelecionadas}
                disabled={!selecionadasReservas.length || !motivoLiberacao.trim() || liberandoReservas}
                className="bg-emerald-700 text-white hover:bg-emerald-800"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                {liberandoReservas ? "Liberando..." : "Liberar selecionados"}
              </Button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              O pedido continua pendente. Apenas o estoque reservado volta para as congeladas/salgados.
            </p>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
