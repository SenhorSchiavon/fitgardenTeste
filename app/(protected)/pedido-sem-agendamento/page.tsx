"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Plus,
  Minus,
  Trash,
  CreditCard,
  Send,
  Search,
  Snowflake,
  UtensilsCrossed,
  User,
  Check,
  ChevronsUpDown,
  ShoppingBag,
} from "lucide-react";
import { Header } from "@/components/header";
import { useClientes } from "@/hooks/useClientes";
import { useCardapios } from "@/hooks/useCardapios";
import { useOpcoesDoCardapio } from "@/hooks/useOpcoesDoCardapio";
import { useCongeladas } from "@/hooks/useCongeladas";
import { useTamanhos } from "@/hooks/useTamanhos";
import { FormaPagamento, usePedidosSemAgendamento } from "@/hooks/usePedidosSemAgendamento";
import { cn } from "@/lib/utils";

type ItemCarrinho = {
  id: string;
  origem: "CARDAPIO" | "CONGELADA";
  opcaoId?: number;
  congeladaId?: number;
  tamanhoId?: number;
  nome: string;
  tamanhoLabel: string;
  tamanhoGramas?: number;
  quantidade: number;
  precoUnit: number;
  estoqueMax?: number;
  usarPlano?: boolean;
};

function getPrecoUnitPorQuantidade(tamanho: any, quantidade: number) {
  const qtd = Math.max(1, Number(quantidade || 1));
  if (qtd >= 40 && tamanho?.valor40 != null) return Number(tamanho.valor40 || 0);
  if (qtd >= 20 && tamanho?.valor20 != null) return Number(tamanho.valor20 || 0);
  if (qtd >= 10 && tamanho?.valor10 != null) return Number(tamanho.valor10 || 0);
  return Number(tamanho?.valorUnitario || 0);
}

function getQuantidadePorTamanho(carrinho: ItemCarrinho[], tamanhoId?: number) {
  return carrinho
    .filter((item) => Number(item.tamanhoId || 0) === Number(tamanhoId || 0))
    .reduce((total, item) => total + Number(item.quantidade || 0), 0);
}

export default function PedidoSemAgendamento() {
  const { clientes } = useClientes();
  const { cardapios } = useCardapios();
  const cardapioAtivo = cardapios.find((c) => c.ativo) ?? null;
  const { opcoes } = useOpcoesDoCardapio(cardapioAtivo?.id);
  const { congeladas } = useCongeladas();
  const { tamanhos } = useTamanhos();

  const {
    createPedido,
    finalizarPagamento: finalizarPagamentoApi,
    loading,
  } = usePedidosSemAgendamento();

  // Estado do formulário principal
  const [clienteId, setClienteId] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>("DINHEIRO");
  const [voucherCodigo, setVoucherCodigo] = useState("");
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);

  // Filtros da vitrine de marmitas
  const [origemFiltro, setOrigemFiltro] = useState<"TODAS" | "CARDAPIO" | "CONGELADA">("TODAS");
  const [tamanhoFiltro, setTamanhoFiltro] = useState<string>("");
  const [busca, setBusca] = useState("");
  const [clienteComboboxOpen, setClienteComboboxOpen] = useState(false);

  // Seleções de tamanho para os cards do Cardápio da Semana
  const [tamanhoSelecionadoPorOpcao, setTamanhoSelecionadoPorOpcao] = useState<Record<number, string>>({});

  // Modais de Checkout
  const [pagamentoDialogOpen, setPagamentoDialogOpen] = useState(false);
  const [confirmacaoDialogOpen, setConfirmacaoDialogOpen] = useState(false);
  const [pedidoCriadoId, setPedidoCriadoId] = useState<number | null>(null);

  // Cliente Selecionado
  const clienteSelecionado = useMemo(() => {
    return (clientes || []).find((c: any) => String(c.id) === String(clienteId)) ?? null;
  }, [clienteId, clientes]);

  // Lista única de tamanhos disponíveis (Gramas ou Labels)
  const tamanhosDisponiveis = useMemo(() => {
    const setTamanhos = new Set<string>();

    // Tamanhos das congeladas (gramas)
    (congeladas || []).forEach((c) => {
      if (Number(c.quantidade || 0) > 0) setTamanhos.add(`${c.tamanhoGramas}g`);
    });

    // Tamanhos do cardápio ativo
    (opcoes || []).forEach((o: any) => {
      (o.tamanhos || []).forEach((t: any) => {
        if (t.tamanhoLabel) setTamanhos.add(String(t.tamanhoLabel));
      });
    });

    return Array.from(setTamanhos).sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }));
  }, [congeladas, opcoes]);

  // Item da congelada normalizado
  const congeladasFiltradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return (congeladas || []).filter((c) => {
      if (Number(c.quantidade || 0) <= 0) return false;
      if (origemFiltro === "CARDAPIO") return false;
      if (tamanhoFiltro && `${c.tamanhoGramas}g` !== tamanhoFiltro && String(c.tamanhoGramas) !== tamanhoFiltro) return false;
      if (q && !c.nome.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [congeladas, origemFiltro, tamanhoFiltro, busca]);

  // Opções do cardápio da semana normalizadas
  const opcoesCardapioFiltradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return (opcoes || []).filter((o: any) => {
      if (origemFiltro === "CONGELADA") return false;
      if (q && !o.nome.toLowerCase().includes(q)) return false;
      if (tamanhoFiltro) {
        const temTamanho = (o.tamanhos || []).some((t: any) =>
          String(t.tamanhoLabel).toLowerCase() === tamanhoFiltro.toLowerCase() ||
          `${t.tamanhoLabel}g`.toLowerCase() === tamanhoFiltro.toLowerCase()
        );
        if (!temTamanho) return false;
      }
      return true;
    });
  }, [opcoes, origemFiltro, tamanhoFiltro, busca]);

  // Modificar quantidade do carrinho
  const setQuantidadeCarrinho = (itemKey: string, delta: number, itemBase?: any) => {
    setCarrinho((prev) => {
      const idx = prev.findIndex((i) => i.id === itemKey);
      if (idx >= 0) {
        const atual = prev[idx];
        const novaQtd = Math.max(0, atual.quantidade + delta);
        if (atual.estoqueMax != null && novaQtd > atual.estoqueMax) {
          return prev;
        }
        if (novaQtd === 0) {
          return prev.filter((_, i) => i !== idx);
        }
        const updated = [...prev];
        updated[idx] = { ...atual, quantidade: novaQtd };
        return updated;
      }

      if (delta > 0 && itemBase) {
        return [...prev, { ...itemBase, quantidade: delta }];
      }
      return prev;
    });
  };

  const totalMarmitas = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
  const resumoValores = useMemo(() => {
    const subtotal = carrinho.reduce((acc, item) => acc + item.precoUnit * item.quantidade, 0);
    const totalComDesconto = carrinho.reduce((acc, item) => {
      const tamanho = tamanhos.find((t: any) => Number(t.id) === Number(item.tamanhoId));
      const quantidadeDoTamanho = getQuantidadePorTamanho(carrinho, item.tamanhoId);
      return acc + getPrecoUnitPorQuantidade(tamanho, quantidadeDoTamanho) * item.quantidade;
    }, 0);
    const descontoTabela = Math.max(0, subtotal - totalComDesconto);
    const valorPlano = carrinho
      .filter((item) => item.usarPlano)
      .reduce((acc, item) => {
        const tamanho = tamanhos.find((t: any) => Number(t.id) === Number(item.tamanhoId));
        const quantidadeDoTamanho = getQuantidadePorTamanho(carrinho, item.tamanhoId);
        return acc + getPrecoUnitPorQuantidade(tamanho, quantidadeDoTamanho) * item.quantidade;
      }, 0);
    return {
      subtotal,
      descontoTabela,
      totalComDesconto,
      valorPlano,
      totalAPagar: Math.max(0, totalComDesconto - valorPlano),
    };
  }, [carrinho, tamanhos]);

  const clientePlanos = (clienteSelecionado as any)?.planos || [];
  const saldoPlanoPorTamanho = useMemo(() => {
    const saldos = new Map<number, number>();
    for (const plano of clientePlanos) {
      for (const item of plano.itens || []) {
        const tamanhoId = Number(item.planoItem?.tamanho?.id || 0);
        if (!tamanhoId) continue;
        saldos.set(tamanhoId, (saldos.get(tamanhoId) || 0) + Math.max(0, Number(item.saldoUnidades || 0)));
      }
    }
    return saldos;
  }, [clientePlanos]);

  const quantidadePlanoMarcadaPorTamanho = (tamanhoId?: number, ignorarId?: string) =>
    carrinho
      .filter((item) => item.usarPlano && item.id !== ignorarId && Number(item.tamanhoId || 0) === Number(tamanhoId || 0))
      .reduce((total, item) => total + Number(item.quantidade || 0), 0);

  const podeUsarPlano = (item: ItemCarrinho) => {
    if (!clienteSelecionado || !item.tamanhoId) return false;
    const saldo = saldoPlanoPorTamanho.get(Number(item.tamanhoId)) || 0;
    return saldo >= quantidadePlanoMarcadaPorTamanho(item.tamanhoId, item.id) + item.quantidade;
  };

  const alternarPlanoCarrinho = (itemId: string) => {
    setCarrinho((prev) => prev.map((item) => {
      if (item.id !== itemId) return item;
      if (item.usarPlano) return { ...item, usarPlano: false };
      return podeUsarPlano(item) ? { ...item, usarPlano: true } : item;
    }));
  };

  const marcarTodosCompativeisComPlano = () => {
    setCarrinho((prev) => {
      const consumoPorTamanho = new Map<number, number>();
      return prev.map((item) => {
        if (!item.tamanhoId) return { ...item, usarPlano: false };
        const tamanhoId = Number(item.tamanhoId);
        const saldo = saldoPlanoPorTamanho.get(tamanhoId) || 0;
        const jaConsumido = consumoPorTamanho.get(tamanhoId) || 0;
        const usarPlano = saldo >= jaConsumido + item.quantidade;
        if (usarPlano) consumoPorTamanho.set(tamanhoId, jaConsumido + item.quantidade);
        return { ...item, usarPlano };
      });
    });
  };

  const limparItensComPlano = () => {
    setCarrinho((prev) => prev.map((item) => item.usarPlano ? { ...item, usarPlano: false } : item));
  };

  const handleFinalizarPagamento = async () => {
    if (!clienteId) return;
    if (carrinho.length === 0) return;

    try {
      const isVoucher = formaPagamento === "VOUCHER" || formaPagamento.startsWith("VOUCHER_");
      if (isVoucher && !voucherCodigo.trim()) {
        alert("Informe o código do voucher para prosseguir.");
        return;
      }

      const itensInput = carrinho.map((it) => {
        const tamanhoId = it.tamanhoId || (tamanhos[0]?.id ? Number(tamanhos[0].id) : 1);
        return {
          opcaoId: it.origem === "CARDAPIO" ? Number(it.opcaoId) : undefined,
          tamanhoId: Number(tamanhoId),
          quantidade: it.quantidade,
          usarPlano: !!it.usarPlano,
          tipoItem: it.origem === "CONGELADA" ? "CONGELADA" : "PADRAO",
          congeladaId: it.origem === "CONGELADA" ? it.congeladaId : undefined,
        };
      });

      const result = await createPedido({
        clienteId: Number(clienteId),
        tipo: "RETIRADA",
        observacoes,
        formaPagamento,
        voucherCodigo: isVoucher ? voucherCodigo.trim() : undefined,
        itens: itensInput,
      });

      setPedidoCriadoId(result.pedidoId);

      // 2) finaliza pagamento
      const formaFinal =
        formaPagamento === "A_DEFINIR"
          ? "DINHEIRO"
          : formaPagamento;

      await finalizarPagamentoApi(result.pedidoId, {
        formaPagamento: formaFinal as any,
      });

      setPagamentoDialogOpen(false);
      setConfirmacaoDialogOpen(true);
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleLimparPedido = () => {
    setConfirmacaoDialogOpen(false);
    setPedidoCriadoId(null);
    setClienteId("");
    setObservacoes("");
    setFormaPagamento("DINHEIRO");
    setVoucherCodigo("");
    setCarrinho([]);
  };

  return (
    <div className="container mx-auto p-3 sm:p-5 space-y-4">
      <Header
        title="Pedido sem Agendamento"
        subtitle="Vendas rápidas de marmitas do cardápio da semana e congeladas em estoque"
      />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-4">
        {/* ESQUERDA: CATALOGO DE MARMITAS */}
        <div className="space-y-4 min-w-0">
          {/* CLIENTE & DADOS */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-primary">
                <User className="h-4 w-4 text-secondary" />
                Dados do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 lg:grid-cols-2">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Popover open={clienteComboboxOpen} onOpenChange={setClienteComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={clienteComboboxOpen}
                      className="w-full justify-between bg-background h-10"
                    >
                      <span className="truncate font-medium">
                        {clienteSelecionado ? clienteSelecionado.nome : "Selecione o cliente"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[320px] p-0" align="start">
                    <Command filter={(value, search) => {
                      const query = search.toLowerCase();
                      const client = clientes.find((c: any) => String(c.id) === value);
                      if (!client) return 0;
                      const name = client.nome.toLowerCase();
                      const phone = (client.telefone || "").replace(/\D/g, "");
                      const searchPhone = query.replace(/\D/g, "");
                      if (name.includes(query) || (searchPhone && phone.includes(searchPhone))) {
                        return 1;
                      }
                      return 0;
                    }}>
                      <CommandInput placeholder="Pesquisar por nome ou telefone..." />
                      <CommandList>
                        <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                        <CommandGroup>
                          {clientes.map((c: any) => (
                            <CommandItem
                              key={c.id}
                              value={String(c.id)}
                              onSelect={(currentValue) => {
                                setClienteId(currentValue === clienteId ? "" : currentValue);
                                setClienteComboboxOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  clienteId === String(c.id) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-bold">{c.nome}</span>
                                <span className="text-xs text-muted-foreground">{c.telefone || "Sem telefone"}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Observações do pedido</Label>
                <Input
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Ex.: Sem talheres, cliente retira às 12h..."
                  className="h-10 bg-background"
                />
              </div>
            </CardContent>
          </Card>

          {/* VITRINE / FILTROS */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-primary">
                  <ShoppingBag className="h-4 w-4 text-secondary" />
                  Catálogo de Marmitas
                </CardTitle>

                {/* Filtro Origem: Todas / Cardápio / Congeladas */}
                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
                  <Button
                    type="button"
                    variant={origemFiltro === "TODAS" ? "default" : "ghost"}
                    size="sm"
                    className="h-8 rounded-lg text-xs font-bold"
                    onClick={() => setOrigemFiltro("TODAS")}
                  >
                    Todas
                  </Button>
                  <Button
                    type="button"
                    variant={origemFiltro === "CARDAPIO" ? "default" : "ghost"}
                    size="sm"
                    className="h-8 rounded-lg text-xs font-bold gap-1.5"
                    onClick={() => setOrigemFiltro("CARDAPIO")}
                  >
                    <UtensilsCrossed className="h-3.5 w-3.5" />
                    Cardápio
                  </Button>
                  <Button
                    type="button"
                    variant={origemFiltro === "CONGELADA" ? "default" : "ghost"}
                    size="sm"
                    className="h-8 rounded-lg text-xs font-bold gap-1.5"
                    onClick={() => setOrigemFiltro("CONGELADA")}
                  >
                    <Snowflake className="h-3.5 w-3.5" />
                    Congeladas
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Barra de Pesquisa + Filtros de Tamanho */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar marmita por nome..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-9 h-11 bg-background"
                  />
                </div>

                {/* Filtro por Tamanho */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs font-bold text-muted-foreground mr-1">Tamanho:</span>
                  <Button
                    type="button"
                    variant={tamanhoFiltro === "" ? "default" : "outline"}
                    size="sm"
                    className="h-7 rounded-lg text-xs font-bold"
                    onClick={() => setTamanhoFiltro("")}
                  >
                    Todos os tamanhos
                  </Button>
                  {tamanhosDisponiveis.map((tam) => (
                    <Button
                      key={tam}
                      type="button"
                      variant={tamanhoFiltro === tam ? "default" : "outline"}
                      size="sm"
                      className="h-7 rounded-lg text-xs font-bold"
                      onClick={() => setTamanhoFiltro(tam)}
                    >
                      {tam}
                    </Button>
                  ))}
                </div>
              </div>

              {/* LISTAGEM DOS ITENS (CARDÁPIO + CONGELADAS) */}
              <div className="space-y-4 pt-2">
                {/* MARMITAS CONGELADAS */}
                {congeladasFiltradas.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-700">
                      <Snowflake className="h-3.5 w-3.5" />
                      Marmitas Congeladas em Estoque ({congeladasFiltradas.length})
                    </div>
                    <div className="grid grid-cols-1 2xl:grid-cols-2 gap-3">
                      {congeladasFiltradas.map((c) => {
                        const itemKey = `CONGELADA_${c.id}`;
                        const itemCarrinho = carrinho.find((i) => i.id === itemKey);
                        const qtdNoCarrinho = itemCarrinho?.quantidade || 0;
                        // preço base estimado ou por tamanho
                        const tamObj = (tamanhos || []).find((t: any) => Number(t.pesagemGramas) === Number(c.tamanhoGramas));
                        const precoUnit = tamObj ? Number(tamObj.valorUnitario || 0) : 0;

                        const itemBase: ItemCarrinho = {
                          id: itemKey,
                          origem: "CONGELADA",
                          congeladaId: Number(c.id),
                          tamanhoId: tamObj ? Number(tamObj.id) : undefined,
                          nome: c.nome,
                          tamanhoLabel: `${c.tamanhoGramas}g`,
                          tamanhoGramas: Number(c.tamanhoGramas),
                          quantidade: 1,
                          precoUnit,
                          estoqueMax: Number(c.quantidade),
                        };

                        return (
                          <div
                            key={c.id}
                            className="flex items-center justify-between p-3.5 rounded-xl border border-sky-100 bg-sky-50/40 hover:bg-sky-50 transition-colors"
                          >
                            <div className="min-w-0 pr-2 space-y-0.5">
                              <div className="flex items-start gap-1.5">
                                <Badge variant="outline" className="text-[9px] h-4 border-sky-300 bg-sky-100 text-sky-800 font-bold shrink-0">
                                  CONGELADA
                                </Badge>
                                <span className="font-bold text-sm leading-snug break-words text-slate-800">{c.nome}</span>
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-2">
                                <span>{c.tamanhoGramas}g</span>
                                <span>•</span>
                                <span className="font-medium text-sky-800">Estoque: {c.quantidade}</span>
                                {precoUnit > 0 && (
                                  <>
                                    <span>•</span>
                                    <span className="font-bold text-emerald-700">R$ {precoUnit.toFixed(2)}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* BOTOES DE ADICIONAR (+ / -) */}
                            <div className="flex items-center gap-1.5 shrink-0 bg-background border rounded-lg p-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-md"
                                onClick={() => setQuantidadeCarrinho(itemKey, -1)}
                                disabled={qtdNoCarrinho <= 0}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-6 text-center text-xs font-black">{qtdNoCarrinho}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-md"
                                onClick={() => setQuantidadeCarrinho(itemKey, 1, itemBase)}
                                disabled={qtdNoCarrinho >= Number(c.quantidade)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* MARMITAS DO CARDÁPIO DA SEMANA */}
                {opcoesCardapioFiltradas.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
                      <UtensilsCrossed className="h-3.5 w-3.5" />
                      Cardápio da Semana ({opcoesCardapioFiltradas.length})
                    </div>
                    <div className="grid grid-cols-1 2xl:grid-cols-2 gap-3">
                      {opcoesCardapioFiltradas.map((o: any) => {
                        const tamanhosOpcao = o.tamanhos || [];
                        const tamSelId = tamanhoSelecionadoPorOpcao[o.id] || (tamanhosOpcao[0]?.tamanhoId ? String(tamanhosOpcao[0].tamanhoId) : "");
                        const tamObj = tamanhosOpcao.find((t: any) => String(t.tamanhoId) === tamSelId) || tamanhosOpcao[0];
                        const precoUnit = Number(tamObj?.preco ?? 0);

                        const itemKey = `CARDAPIO_${o.id}_${tamObj?.tamanhoId || "0"}`;
                        const itemCarrinho = carrinho.find((i) => i.id === itemKey);
                        const qtdNoCarrinho = itemCarrinho?.quantidade || 0;

                        const itemBase: ItemCarrinho = {
                          id: itemKey,
                          origem: "CARDAPIO",
                          opcaoId: Number(o.id),
                          tamanhoId: Number(tamObj?.tamanhoId || 0),
                          nome: o.nome,
                          tamanhoLabel: tamObj?.tamanhoLabel || "-",
                          quantidade: 1,
                          precoUnit,
                        };

                        return (
                          <div
                            key={o.id}
                            className="flex flex-col justify-between p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/30 hover:bg-emerald-50/60 transition-colors space-y-3"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <Badge variant="outline" className="text-[9px] h-4 border-emerald-300 bg-emerald-100 text-emerald-800 font-bold shrink-0">
                                  CARDÁPIO
                                </Badge>
                                <span className="font-bold text-sm text-emerald-900">R$ {precoUnit.toFixed(2)}</span>
                              </div>
                              <p className="font-bold text-sm text-slate-800">{o.nome}</p>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-emerald-100/60">
                              {/* SELETOR DE TAMANHO PARA O CARDÁPIO */}
                              {tamanhosOpcao.length > 1 ? (
                                <Select
                                  value={tamSelId}
                                  onValueChange={(val) => setTamanhoSelecionadoPorOpcao((prev) => ({ ...prev, [o.id]: val }))}
                                >
                                  <SelectTrigger className="h-7 text-xs font-bold w-28 bg-background">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {tamanhosOpcao.map((t: any) => (
                                      <SelectItem key={t.tamanhoId} value={String(t.tamanhoId)}>
                                        {t.tamanhoLabel}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <span className="text-xs font-bold text-muted-foreground">{tamObj?.tamanhoLabel || "-"}</span>
                              )}

                              {/* BOTOES DE ADICIONAR (+ / -) */}
                              <div className="flex items-center gap-1.5 shrink-0 bg-background border rounded-lg p-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-md"
                                  onClick={() => setQuantidadeCarrinho(itemKey, -1)}
                                  disabled={qtdNoCarrinho <= 0}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-6 text-center text-xs font-black">{qtdNoCarrinho}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-md"
                                  onClick={() => setQuantidadeCarrinho(itemKey, 1, itemBase)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {congeladasFiltradas.length === 0 && opcoesCardapioFiltradas.length === 0 && (
                  <div className="text-center py-12 border border-dashed rounded-2xl p-6 text-muted-foreground space-y-1">
                    <p className="font-bold text-slate-700">Nenhuma marmita encontrada</p>
                    <p className="text-xs">Tente ajustar o termo de pesquisa ou os filtros de tamanho acima.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* DIREITA: RESUMO DO PEDIDO / CARRINHO */}
        <div className="space-y-6">
          <Card className="border-border/60 shadow-sm sticky top-6">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold flex items-center justify-between text-primary">
                <span>Resumo do Pedido</span>
                <Badge variant="secondary" className="font-bold">
                  {totalMarmitas} marmita(s)
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {clienteSelecionado && carrinho.length > 0 && (
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" className="h-8 flex-1 text-xs font-bold" onClick={marcarTodosCompativeisComPlano}>
                    Abater planos
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="h-8 text-xs font-bold" onClick={limparItensComPlano}>
                    Limpar
                  </Button>
                </div>
              )}
              {/* ITENS SELECIONADOS NO CARRINHO */}
              <div className="divide-y max-h-[360px] overflow-y-auto pr-1">
                {carrinho.map((item) => {
                  const tamanho = tamanhos.find((t: any) => Number(t.id) === Number(item.tamanhoId));
                  const quantidadeDoTamanho = getQuantidadePorTamanho(carrinho, item.tamanhoId);
                  const precoEfetivo = getPrecoUnitPorQuantidade(tamanho, quantidadeDoTamanho);
                  const temPrecoEscalonado = Math.abs(precoEfetivo - item.precoUnit) > 0.001;

                  return (
                    <div key={item.id} className="py-3 flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-xs text-primary">{item.quantidade}x</span>
                          <span className="font-bold text-sm break-words leading-snug">{item.nome}</span>
                        </div>
                        <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-[8px] h-3.5 px-1 font-bold">
                            {item.tamanhoLabel}
                          </Badge>
                          <span>R$ {precoEfetivo.toFixed(2)} un.</span>
                          {temPrecoEscalonado && <span className="text-emerald-700">tabela quantidade</span>}
                        </div>
                        <Button
                          type="button"
                          variant={item.usarPlano ? "default" : "outline"}
                          size="sm"
                          className="mt-1 h-7 text-[11px] font-bold"
                          disabled={!item.usarPlano && !podeUsarPlano(item)}
                          onClick={() => alternarPlanoCarrinho(item.id)}
                        >
                          {item.usarPlano ? "Plano aplicado" : "Usar plano"}
                        </Button>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={cn("font-extrabold text-sm", item.usarPlano ? "text-emerald-700" : "text-emerald-800")}>
                          {item.usarPlano ? "- " : ""}R$ {(precoEfetivo * item.quantidade).toFixed(2)}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                          onClick={() => setQuantidadeCarrinho(item.id, -item.quantidade)}
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {carrinho.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground space-y-2">
                    <ShoppingBag className="h-8 w-8 mx-auto opacity-30" />
                    <p className="text-sm font-medium">Seu carrinho está vazio</p>
                    <p className="text-xs">Selecione as marmitas no catálogo ao lado.</p>
                  </div>
                )}
              </div>

              {/* VALORES E TOTAL */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span>R$ {resumoValores.subtotal.toFixed(2)}</span>
                </div>
                {resumoValores.descontoTabela > 0 && (
                  <div className="flex justify-between text-sm text-emerald-700">
                    <span>Desconto por quantidade</span>
                    <span>- R$ {resumoValores.descontoTabela.toFixed(2)}</span>
                  </div>
                )}
                {resumoValores.valorPlano > 0 && (
                  <div className="flex justify-between text-sm text-emerald-700">
                    <span>Abatido do plano</span>
                    <span>- R$ {resumoValores.valorPlano.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-extrabold text-primary pt-1">
                  <span>Total</span>
                  <span className="text-xl text-emerald-700">R$ {resumoValores.totalAPagar.toFixed(2)}</span>
                </div>
              </div>

              {/* BOTAO PAGAMENTO */}
              <Button
                className="w-full h-12 text-base font-bold bg-secondary hover:bg-secondary/90 text-white shadow-lg"
                onClick={() => setPagamentoDialogOpen(true)}
                disabled={carrinho.length === 0 || !clienteId || loading}
              >
                <CreditCard className="mr-2 h-5 w-5" />
                Finalizar Pagamento
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* MODAL DE FINALIZAR PAGAMENTO */}
      <Dialog open={pagamentoDialogOpen} onOpenChange={setPagamentoDialogOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-primary">Forma de Pagamento</DialogTitle>
          </DialogHeader>

          <div className="py-2 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Escolha a Forma</Label>
              <RadioGroup
                value={formaPagamento}
                onValueChange={(value) => setFormaPagamento(value as FormaPagamento)}
                className="grid grid-cols-2 gap-3"
              >
                <div className="flex items-center space-x-2 border rounded-xl p-3 hover:bg-slate-50 cursor-pointer">
                  <RadioGroupItem value="DINHEIRO" id="DINHEIRO" />
                  <Label htmlFor="DINHEIRO" className="cursor-pointer font-bold text-sm">Dinheiro</Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-xl p-3 hover:bg-slate-50 cursor-pointer">
                  <RadioGroupItem value="PIX" id="PIX" />
                  <Label htmlFor="PIX" className="cursor-pointer font-bold text-sm">PIX</Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-xl p-3 hover:bg-slate-50 cursor-pointer">
                  <RadioGroupItem value="CREDITO" id="CREDITO" />
                  <Label htmlFor="CREDITO" className="cursor-pointer font-bold text-sm">Cartão Crédito</Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-xl p-3 hover:bg-slate-50 cursor-pointer">
                  <RadioGroupItem value="DEBITO" id="DEBITO" />
                  <Label htmlFor="DEBITO" className="cursor-pointer font-bold text-sm">Cartão Débito</Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-xl p-3 hover:bg-slate-50 cursor-pointer">
                  <RadioGroupItem value="VOUCHER" id="VOUCHER" />
                  <Label htmlFor="VOUCHER" className="cursor-pointer font-bold text-sm">Voucher</Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-xl p-3 hover:bg-slate-50 cursor-pointer">
                  <RadioGroupItem value="VALE_REFEICAO" id="VALE_REFEICAO" />
                  <Label htmlFor="VALE_REFEICAO" className="cursor-pointer font-bold text-sm">Vale Refeição</Label>
                </div>
              </RadioGroup>
            </div>

            {(formaPagamento === "VOUCHER" || formaPagamento.startsWith("VOUCHER_")) && (
              <div className="space-y-1.5 rounded-xl border border-blue-200 bg-blue-50/60 p-3">
                <Label htmlFor="voucher-codigo" className="text-xs font-bold text-blue-900">
                  Número do Voucher *
                </Label>
                <Input
                  id="voucher-codigo"
                  placeholder="Ex.: 12345"
                  value={voucherCodigo}
                  onChange={(e) => setVoucherCodigo(e.target.value)}
                  className="bg-background h-10 font-bold"
                />
              </div>
            )}

            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 flex items-center justify-between">
              <span className="font-bold text-slate-700">Total do Pedido:</span>
              <span className="text-2xl font-black text-emerald-800">R$ {resumoValores.totalAPagar.toFixed(2)}</span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setPagamentoDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              onClick={handleFinalizarPagamento}
              disabled={!clienteId || carrinho.length === 0 || loading}
            >
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE CONFIRMAÇÃO DO PEDIDO CRIADO */}
      <Dialog open={confirmacaoDialogOpen} onOpenChange={setConfirmacaoDialogOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-primary flex items-center gap-2">
              <Check className="h-6 w-6 text-emerald-600" />
              Pedido Finalizado!
            </DialogTitle>
          </DialogHeader>

          <div className="py-3 space-y-3">
            <div className="rounded-xl border bg-muted/20 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Número do Pedido:</span>
                <span className="font-bold">#{pedidoCriadoId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cliente:</span>
                <span className="font-bold">{clienteSelecionado?.nome ?? "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Pago:</span>
                <span className="font-bold text-emerald-700">R$ {resumoValores.totalAPagar.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Forma de Pagamento:</span>
                <span className="font-bold">{formaPagamento}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleLimparPedido} className="w-full font-bold">
              Concluir e Novo Pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
