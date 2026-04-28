"use client";

import { useEffect, useState } from "react";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  CalendarIcon,
  FileText,
  MapPin,
  Phone,
  Trash,
  TruckIcon,
  User,
  CreditCard,
  ChevronDown,
  Download,
  FileDown,
  LayoutDashboard,
  Clock,
  Package,
  Wallet,
  CheckCircle2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Header } from "@/components/header";
import { NovoAgendamentoNovoLayout } from "./agendamento-cadastro";
import { useOpcoesDoCardapio } from "@/hooks/useOpcoesDoCardapio";
import { useClientes } from "@/hooks/useClientes";
import { useAgendamentos } from "@/hooks/useAgendamentos";
import { useCardapios } from "@/hooks/useCardapios";
import { toast } from "@/components/ui/use-toast";
import { useRelatorioPreparosDia } from "@/hooks/useRelatorioPreparosDia";
import { useRelatorioPedidosDia } from "@/hooks/useRelatorioPedidosDia";
import { usePreparosSelecionaveis } from "@/hooks/usePreparosSelecionaveis";
import { useSalgados } from "@/hooks/useSalgados";
type Agendamento = {
  id: string;
  numeroPedido: string;
  cliente: string;
  tipoEntrega: "ENTREGA" | "RETIRADA";
  faixaHorario: string;
  endereco: string;
  zona:
  | "CENTRO"
  | "ZONA SUL"
  | "ZONA NORTE"
  | "ZONA OESTE"
  | "ZONA LESTE"
  | "CAMBÉ"
  | "IBIPORÃ";
  telefone: string;
  quantidade: number;
  quantidadeLabel?: string;
  formaPagamento: string;
  entregador: string;
  observacoes?: string;

  valorPedido?: number;
  valorTaxa?: number;
  valorTotal?: number;
  valorDescontos?: number;
  valorTotalFinal?: number;

  itens: {
    id?: string;
    tipoItem?: string;
    salgadoId?: string;
    nome: string;
    tamanho: string;
    quantidade: number;
    usarPlano: boolean;
    destinatarioNome?: string;
    observacaoItem?: string;
    carbo?: string;
    proteina?: string;
    legume?: string;
    feijao?: string;
    trocas?: string;
  }[];
  _raw?: any;
};
export default function Agendamentos() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [cadastroOpen, setCadastroOpen] = useState(false);
  const {
    clientes,
    filteredClientes,
    loading: loadingClientes,
  } = useClientes();
  const { cardapios, loading: loadingCardapios } = useCardapios();
  const cardapioAtivo = cardapios.find((c) => c.ativo) ?? null;
  const {
    data: relatorioPreparos,
    loading: loadingRelatorioPreparos,
    downloading: downloadingPreparos,
    error: errorRelatorioPreparos,
    getRelatorio,
    downloadDocx: downloadPreparosDocx,
  } = useRelatorioPreparosDia();

  const {
    downloadDocx: downloadPedidosDocx,
    downloading: downloadingPedidos,
    error: errorPedidosDocx,
  } = useRelatorioPedidosDia();
  const { opcoes, loading: loadingOpcoes } = useOpcoesDoCardapio(
    cardapioAtivo?.id,
  );
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const {
    createAgendamento,
    updateAgendamento,
    getAgendamentos,
    deleteAgendamento,
    integrarEntregasDoDia,
    baixarXlsxImportEntregasDoDia,
    loading,
    error,
    utils,
  } = useAgendamentos();

  const [agendamentoSelecionado, setAgendamentoSelecionado] =
    useState<Agendamento | null>(null);
  const [detalhesDialogOpen, setDetalhesDialogOpen] = useState(false);
  const [producaoSheetOpen, setProducaoSheetOpen] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [agendamentoEditandoId, setAgendamentoEditandoId] = useState<
    number | null
  >(null);
  const [dadosEdicao, setDadosEdicao] = useState<any>(null);

  const { preparos, loading: loadingPreparos } = usePreparosSelecionaveis();
  const { salgados } = useSalgados();
  const [preparoSheetOpen, setPreparoSheetOpen] = useState(false);
  const handleShowDetalhes = (agendamento: Agendamento) => {
    setAgendamentoSelecionado(agendamento);
    setDetalhesDialogOpen(true);
  };

  function mapApiToUi(row: any): Agendamento {
    const numeroPedido = `#${row.pedidoId ?? row.pedido?.id ?? row.id}`;

    const zonaMap: Record<string, any> = {
      CENTRO: "CENTRO",
      ZONA_SUL: "ZONA SUL",
      ZONA_NORTE: "ZONA NORTE",
      ZONA_LESTE: "ZONA LESTE",
      ZONA_OESTE: "ZONA OESTE",
      CAMBE: "CAMBÉ",
      IBIPORA: "IBIPORÃ",
    };

    const itensUi =
      (row.pedido?.itens ?? row.itens ?? []).map((it: any) => {
        const trocas = [
          it.trocaCarbo?.nome ? `Troca Carbo: ${it.trocaCarbo.nome}` : null,
          it.trocaProteina?.nome ? `Troca Prot.: ${it.trocaProteina.nome}` : null,
          it.trocaLegume?.nome ? `Troca Leg.: ${it.trocaLegume.nome}` : null,
          it.zerarLegume ? "Sem Legumes" : null,
          it.adicionarFeijao ? "Com Feijão" : null,
        ].filter(Boolean).join(", ");

        return {
          id: String(it.id),
          tipoItem: it.tipoItem,
          salgadoId: it.salgadoId != null ? String(it.salgadoId) : undefined,
          nome:
            it.salgado?.nome ??
            (it.salgadoId != null
              ? salgados.find((s) => String(s.id) === String(it.salgadoId))?.nome
              : undefined) ??
            it.opcao?.nome ??
            it.nome ??
            "-",
          tamanho: it.tipoItem === "SALGADO"
            ? "Salgado"
            : it.tamanho?.pesagemGramas
            ? `${it.tamanho.pesagemGramas}g`
            : (it.tamanhoLabel ?? "-"),
          quantidade: Number(it.quantidade ?? 0),
          usarPlano: it.usarPlano,
          destinatarioNome: it.destinatarioNome || "",
          observacaoItem: it.observacaoItem || "",
          carbo: it.carbo?.nome || it.carboNome || "",
          proteina: it.proteina?.nome || it.proteinaNome || "",
          legume: it.legume?.nome || it.legumeNome || "",
          feijao: it.feijao?.nome || it.feijaoNome || "",
          trocas: [
            it.trocaCarbo?.nome || it.trocaCarboNome,
            it.trocaProteina?.nome || it.trocaProteinaNome,
            it.trocaLegume?.nome || it.trocaLegumeNome
          ].filter(Boolean).join(" • "),
        };
      }) ?? [];

  const quantidade = itensUi.reduce(
      (acc: number, it: any) => acc + it.quantidade,
      0,
    );

    const qtdSalgados = itensUi
      .filter((it: any) => it.tipoItem === "SALGADO")
      .reduce((acc: number, it: any) => acc + it.quantidade, 0);
    const qtdMarmitas = quantidade - qtdSalgados;
    const quantidadeLabel =
      qtdSalgados > 0 && qtdMarmitas === 0
        ? `${qtdSalgados} salgado${qtdSalgados === 1 ? "" : "s"}`
        : qtdMarmitas > 0 && qtdSalgados === 0
          ? `${qtdMarmitas} marmita${qtdMarmitas === 1 ? "" : "s"}`
          : `${quantidade} itens`;

    const valorPedido = Number(row.pedido?.valorPedido ?? row.valorPedido ?? 0);
    const valorTotalOriginal = Number(row.pedido?.valorTotal ?? row.valorTotal ?? 0);

    // 1. Calcula desconto baseado nos itens marcados como plano
    const itens = row.pedido?.itens ?? row.itens ?? [];
    const valorDescontoItens = itens
      .filter((it: any) => it.usarPlano)
      .reduce((acc: number, it: any) => acc + Number(it.valor || 0), 0);

    // 2. Calcula desconto baseado em pagamentos registrados (backup/consistência)
    const pagamentos = row.pedido?.pagamentos ?? row.pagamentos ?? [];
    const valorDescontoPagamentos = pagamentos
      .filter((p: any) => p.forma === "PLANO" && p.status === "CONFIRMADO")
      .reduce((acc: number, p: any) => acc + Number(p.valor || 0), 0);

    // Usamos o maior valor de desconto encontrado para garantir que o plano seja aplicado
    const valorDescontos = Math.max(valorDescontoItens, valorDescontoPagamentos);

    const valorTaxa = Number(row.pedido?.valorTaxa ?? row.valorTaxa ?? 0);
    const valorTotalFinal = Math.max(0, valorTotalOriginal - valorDescontos);

    return {
      id: String(row.id),
      numeroPedido,
      cliente: row.pedido?.cliente?.nome ?? row.cliente?.nome ?? "-",
      telefone: row.pedido?.cliente?.telefone ?? row.cliente?.telefone ?? "-",
      tipoEntrega: row.pedido?.tipo ?? row.tipo ?? "ENTREGA",
      faixaHorario: row.faixaHorario,
      endereco: row.endereco ?? "-",
      zona: zonaMap[row.regiao] ?? "CENTRO",
      quantidade,
      quantidadeLabel,
      formaPagamento:
        row.pedido?.pagamentos?.[0]?.forma ?? row.formaPagamento ?? "-",
      entregador: row.entregador ?? "-",
      valorPedido,
      valorTaxa,
      valorTotal: valorTotalOriginal,
      valorDescontos,
      valorTotalFinal,
      observacoes: row.pedido?.observacoes ?? row.observacoes ?? undefined,
      itens: itensUi,
      _raw: row,
    };
  }

  useEffect(() => {
    async function load() {
      const date = utils.toISODateOnly(selectedDate);
      const res = await getAgendamentos({ date, page: 1, pageSize: 200 });

      setAgendamentos((res.rows || []).map(mapApiToUi));
    }

    load();
  }, [selectedDate, getAgendamentos, utils]);

  function formatEndereco(e: {
    logradouro?: string | null;
    numero?: string | null;
    complemento?: string | null;
    bairro?: string | null;
    cidade?: string | null;
    uf?: string | null;
    cep?: string | null;
  }) {
    const linha1 = [e.logradouro, e.numero].filter(Boolean).join(", ");
    const linha1c = [linha1, e.complemento].filter(Boolean).join(" - ");
    const linha2 = [e.bairro, [e.cidade, e.uf].filter(Boolean).join("/")]
      .filter(Boolean)
      .join(" - ");
    const linha3 = e.cep ? `CEP ${e.cep}` : "";

    return [linha1c, linha2, linha3].filter(Boolean).join(" — ");
  }

  const handleDeleteAgendamento = async (id: string) => {
    await deleteAgendamento(Number(id));

    const date = utils.toISODateOnly(selectedDate);
    const res = await getAgendamentos({ date, page: 1, pageSize: 200 });
    setAgendamentos((res.rows || []).map(mapApiToUi));

    setDetalhesDialogOpen(false);
  };

  const calcularProducaoDoDia = () => {
    const producao: Record<string, number> = {};

    agendamentos.forEach((agendamento) => {
      agendamento.itens.forEach((item) => {
        const key = `${item.nome} (${item.tamanho})`;
        if (!producao[key]) {
          producao[key] = 0;
        }
        producao[key] += item.quantidade;
      });
    });

    return producao;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };


  const tamanhos = (opcoes ?? []).reduce((acc: any[], opcao: any) => {
    (opcao.tamanhos ?? []).forEach((t: any) => {
      const jaExiste = acc.some(
        (item) => String(item.id) === String(t.tamanhoId),
      );

      if (!jaExiste) {
        acc.push({
          id: String(t.tamanhoId),
          nome: t.tamanhoLabel,
          valorUnitario: Number(t.valorUnitario ?? 0),
          valor10: Number(t.valor10 ?? 0),
          valor20: Number(t.valor20 ?? 0),
          valor40: Number(t.valor40 ?? 0),
        });
      }
    });

    return acc;
  }, []);

  const normalizarCategoria = (categoria?: string | null) => {
    return (categoria ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toUpperCase();
  };
  const opcoesPadrao = (opcoes ?? []).map((o: any) => ({
    id: String(o.id),
    nome: o.nome,
  }));
  const carboidratos = preparos
    .filter((p) => p.tipo === "CARBOIDRATO")
    .map((p) => ({
      id: String(p.id),
      nome: p.nome,
      tipo: "CARBOIDRATO" as const,
    }));

  const proteinas = preparos
    .filter((p) => p.tipo === "PROTEINA")
    .map((p) => ({
      id: String(p.id),
      nome: p.nome,
      tipo: "PROTEINA" as const,
    }));

  const legumes = preparos
    .filter((p) => p.tipo === "LEGUMES")
    .map((p) => ({
      id: String(p.id),
      nome: p.nome,
      tipo: "LEGUME" as const,
    }));
  const feijoes = (opcoes ?? [])
    .filter((o: any) => {
      const categoria = (o.categoria ?? "").toUpperCase();
      return categoria === "FEIJAO" || categoria === "FEIJÃO";
    })
    .map((o: any) => ({
      id: String(o.id),
      nome: o.nome,
      tipo: "FEIJAO" as const,
    }));
  console.log("=== DEBUG CARDAPIO ATIVO ===");
  console.log("cardapioAtivo:", cardapioAtivo);
  console.log("opcoes brutas:", opcoes);

  console.log(
    "categorias brutas:",
    (opcoes ?? []).map((o: any) => ({
      id: o.id,
      nome: o.nome,
      categoriaOriginal: o.categoria,
      categoriaNormalizada: normalizarCategoria(o.categoria),
    }))
  );

  console.log("tamanhos:", tamanhos);
  console.log("opcoesPadrao:", opcoesPadrao);
  console.log("carboidratos:", carboidratos);
  console.log("proteinas:", proteinas);
  console.log("legumes:", legumes);
  return (
    <div className="container mx-auto p-6">
      <Header
        title="Agendamentos"
        subtitle="Gerencie os agendamentos de pedidos"
      />

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-50 p-2 rounded-lg">
            <CalendarIcon className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 leading-tight">{formatDate(selectedDate)}</h2>
            <p className="text-xs text-slate-500 font-medium">{agendamentos.length} agendamentos programados</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 rounded-xl border-slate-200 hover:bg-slate-50 gap-2">
                <FileDown className="h-4 w-4 text-slate-500" />
                <span className="hidden sm:inline">Relatórios e Exportação</span>
                <span className="sm:hidden">Relatórios</span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl p-2">
              <DropdownMenuItem 
                className="rounded-lg cursor-pointer gap-2 py-2.5"
                onClick={() => {
                  const dateISO = utils.toISODateOnly(selectedDate);
                  downloadPedidosDocx({ data: dateISO });
                }}
                disabled={downloadingPedidos}
              >
                <FileText className="h-4 w-4 text-blue-500" />
                <div className="flex flex-col">
                  <span className="font-medium text-sm">Relatório de Pedidos</span>
                  <span className="text-[10px] text-slate-500">Documento DOCX</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem 
                className="rounded-lg cursor-pointer gap-2 py-2.5"
                onClick={async () => {
                  const dateISO = utils.toISODateOnly(selectedDate);
                  await getRelatorio({ data: dateISO });
                  setPreparoSheetOpen(true);
                }}
                disabled={loadingRelatorioPreparos}
              >
                <LayoutDashboard className="h-4 w-4 text-amber-500" />
                <div className="flex flex-col">
                  <span className="font-medium text-sm">Painel de Preparo</span>
                  <span className="text-[10px] text-slate-500">Visualizar insumos</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem 
                className="rounded-lg cursor-pointer gap-2 py-2.5"
                onClick={() => setProducaoSheetOpen(true)}
              >
                <Download className="h-4 w-4 text-emerald-500" />
                <div className="flex flex-col">
                  <span className="font-medium text-sm">Produção do Dia</span>
                  <span className="text-[10px] text-slate-500">Lista consolidada</span>
                </div>
              </DropdownMenuItem>

              <div className="h-px bg-slate-100 my-1 mx-1" />

              <DropdownMenuItem 
                className="rounded-lg cursor-pointer gap-2 py-2.5"
                onClick={async () => {
                  const dateISO = utils.toISODateOnly(selectedDate);
                  await baixarXlsxImportEntregasDoDia(dateISO);
                }}
              >
                <FileDown className="h-4 w-4 text-slate-600" />
                <div className="flex flex-col">
                  <span className="font-medium text-sm">Planilha Logística</span>
                  <span className="text-[10px] text-slate-500">Importar no Leva Certo</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            className="h-10 rounded-xl bg-emerald-700 hover:bg-emerald-800 shadow-md shadow-emerald-100 border-none px-6 gap-2"
            onClick={() => setCadastroOpen(true)}
            disabled={loadingOpcoes}
          >
            <Plus className="h-4 w-4" />
            <span>Novo Agendamento</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6">
        <Card className="h-fit w-fit">
          <CardHeader>
            <CardTitle>Calendário</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={ptBR}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-100 overflow-hidden">
          <CardHeader className="bg-slate-50/50 py-4 px-6 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold text-slate-700 flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Agendamentos para {formatDate(selectedDate)}
            </CardTitle>
            <Badge variant="secondary" className="bg-white border-slate-200 text-slate-600 font-bold px-3">
              {agendamentos.length} pedidos
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-320px)]">
              <div className="p-6 space-y-4">
                {agendamentos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <CheckCircle2 className="h-12 w-12 mb-4 opacity-20" />
                    <p className="font-medium">Nenhum agendamento para hoje</p>
                    <p className="text-sm">Os pedidos aparecerão aqui conforme forem agendados</p>
                  </div>
                ) : (
                  agendamentos.map((agendamento) => {
                    return (
                      <div
                        key={agendamento.id}
                        className="group relative bg-white border border-slate-200 rounded-2xl overflow-hidden cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all duration-200"
                        onClick={() => handleShowDetalhes(agendamento)}
                      >
                        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{agendamento.numeroPedido}</span>
                              <h3 className="text-base font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">{agendamento.cliente}</h3>
                            </div>

                            <div className="flex flex-wrap items-center gap-y-2 gap-x-4">
                              <div className="flex items-center text-sm text-slate-500 gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                <span className="font-medium">{agendamento.faixaHorario}h</span>
                              </div>

                              <div className="flex items-center text-sm text-slate-500 gap-1.5">
                                <Package className="h-3.5 w-3.5 text-slate-400" />
                                <span className="font-medium">{(agendamento as any).quantidadeLabel ?? `${agendamento.quantidade} itens`}</span>
                              </div>

                              <div className="flex items-center text-sm text-slate-500 gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                <span className="font-medium truncate max-w-[200px]">{agendamento.endereco}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-none border-slate-50">
                            <Badge 
                              variant={agendamento.tipoEntrega === "ENTREGA" ? "default" : "outline"}
                              className={agendamento.tipoEntrega === "ENTREGA" ? "bg-slate-800 text-white" : "border-slate-200 text-slate-600"}
                            >
                              {agendamento.tipoEntrega}
                            </Badge>

                            <div className="flex flex-col items-end">
                              <div className="flex items-center text-xs font-bold text-slate-700 gap-1">
                                <Wallet className="h-3 w-3 text-slate-400" />
                                {agendamento.formaPagamento}
                              </div>
                              {agendamento.valorTotalFinal > 0 && (
                                <span className="text-sm font-black text-emerald-700">R$ {agendamento.valorTotalFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Dialog open={detalhesDialogOpen} onOpenChange={setDetalhesDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 border-none shadow-2xl rounded-2xl">
          <DialogHeader className="p-6 pb-2 bg-slate-950 text-white rounded-t-2xl">
            <DialogTitle className="text-2xl font-bold flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-light opacity-80 mb-1">Pedido {agendamentoSelecionado?.numeroPedido}</span>
                <span className="truncate">{agendamentoSelecionado?.cliente}</span>
              </div>
              <Badge className="bg-white/20 text-white border-white/40 hover:bg-white/30 text-xs px-3 py-1">
                {agendamentoSelecionado?.tipoEntrega}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Lado Esquerdo: Info Geral */}
              <div className="md:col-span-5 space-y-6">
                <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                    <User className="h-3 w-3 mr-1" /> Logística & Contato
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="bg-emerald-100 p-2 rounded-lg mr-3">
                        <Phone className="h-4 w-4 text-emerald-700" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Telefone</p>
                        <p className="text-sm font-medium">{agendamentoSelecionado?.telefone || "Não informado"}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="bg-blue-100 p-2 rounded-lg mr-3">
                        <CalendarIcon className="h-4 w-4 text-blue-700" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Horário Previsto</p>
                        <p className="text-sm font-medium text-blue-800">{agendamentoSelecionado?.faixaHorario}h</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="bg-rose-100 p-2 rounded-lg mr-3">
                        <MapPin className="h-4 w-4 text-rose-700" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Endereço de Entrega</p>
                        <p className="text-sm font-medium leading-tight">{agendamentoSelecionado?.endereco}</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                    <CreditCard className="h-3 w-3 mr-1" /> Pagamento
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm text-slate-600">Forma</span>
                      <Badge variant="outline" className="font-semibold text-slate-700">
                        {agendamentoSelecionado?.formaPagamento}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm text-slate-600">Subtotal</span>
                      <span className="text-sm font-medium">R$ {(agendamentoSelecionado?.valorPedido ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-100 pb-3">
                      <span className="text-sm text-slate-600">Entrega</span>
                      <span className="text-sm font-medium">
                         {agendamentoSelecionado?.tipoEntrega === "ENTREGA" 
                          ? `R$ ${(agendamentoSelecionado?.valorTaxa ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : "Grátis"}
                      </span>
                    </div>
                    {agendamentoSelecionado?.valorDescontos && agendamentoSelecionado.valorDescontos > 0 ? (
                      <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-100 pb-3">
                        <span className="text-sm text-emerald-600 font-medium">Desconto Plano</span>
                        <span className="text-sm font-bold text-emerald-600">- R$ {agendamentoSelecionado.valorDescontos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-base font-bold text-slate-800">Total a Pagar</span>
                      <span className="text-xl font-black text-emerald-700">
                        R$ {(agendamentoSelecionado?.valorTotalFinal ?? agendamentoSelecionado?.valorTotal ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </section>

                {agendamentoSelecionado?.observacoes && (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-xs font-bold text-amber-800 uppercase mb-1">Observações do Pedido</p>
                    <p className="text-sm text-amber-900 leading-relaxed italic">"{agendamentoSelecionado.observacoes}"</p>
                  </div>
                )}
              </div>

              {/* Lado Direito: Itens */}
              <div className="md:col-span-7 flex flex-col gap-4">
                <h3 className="text-sm font-bold text-slate-700 flex items-center sticky top-0 bg-slate-50/50 py-2">
                  Itens do Pedido 
                  <span className="ml-2 bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full">{agendamentoSelecionado?.itens.length}</span>
                </h3>
                <div className="space-y-3">
                  {agendamentoSelecionado?.itens.map((item, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-emerald-200 transition-all group overflow-hidden relative">
                      {item.usarPlano && (
                        <div className="absolute top-0 right-0">
                          <div className="bg-emerald-600 text-white text-[10px] font-black px-3 py-1 rounded-bl-lg uppercase tracking-tighter">
                            PLANO
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-bold mr-3">
                            {item.quantidade}x
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 leading-tight">{item.nome}</h4>
                            {item.tipoItem === "SALGADO" ? (
                              <p className="text-[10px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded w-fit mt-1 uppercase tracking-tight">
                                Salgado
                              </p>
                            ) : (
                              <p className="text-[10px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded w-fit mt-1 uppercase tracking-tight">
                                Tamanho: {item.tamanho}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Detalhes da Montagem/Destinatário */}
                      <div className="mt-3 grid grid-cols-1 gap-2 pt-3 border-t border-slate-50">
                        {item.destinatarioNome && (
                          <div className="flex items-center text-xs text-slate-600">
                            <User className="h-3 w-3 mr-2 text-slate-400" />
                            Para: <span className="font-bold text-slate-800 ml-1">{item.destinatarioNome}</span>
                          </div>
                        )}
                        
                        {(item.carbo || item.proteina || item.legume || item.feijao) && (
                          <div className="bg-slate-50 p-2 rounded-lg grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                            {item.carbo && <div className="text-slate-500">• {item.carbo}</div>}
                            {item.proteina && <div className="text-slate-500">• {item.proteina}</div>}
                            {item.legume && <div className="text-slate-500">• {item.legume}</div>}
                            {item.feijao && <div className="text-slate-500">• {item.feijao}</div>}
                          </div>
                        )}

                        {item.trocas && (
                          <div className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md font-medium">
                            Modificações: {item.trocas}
                          </div>
                        )}

                        {item.observacaoItem && (
                          <div className="text-[11px] text-slate-600 italic bg-amber-50/50 p-2 rounded border-l-2 border-amber-300">
                            "{item.observacaoItem}"
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between rounded-b-2xl">
             <Button
              variant="destructive"
              className="rounded-xl px-6"
              onClick={() => agendamentoSelecionado && handleDeleteAgendamento(agendamentoSelecionado.id)}
            >
              <Trash className="mr-2 h-4 w-4" /> Excluir
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" className="rounded-xl px-6" onClick={() => setDetalhesDialogOpen(false)}>
                Fechar
              </Button>
              <Button
                className="bg-emerald-700 hover:bg-emerald-800 rounded-xl px-8 shadow-lg shadow-emerald-100"
                onClick={() => {
                  if (!agendamentoSelecionado) return;
                  setModoEdicao(true);
                  setAgendamentoEditandoId(Number(agendamentoSelecionado.id));
                  setDadosEdicao(agendamentoSelecionado._raw);
                  setDetalhesDialogOpen(false);
                  setCadastroOpen(true);
                }}
              >
                Editar Pedido
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Sheet open={preparoSheetOpen} onOpenChange={setPreparoSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Relatório de Preparo - {formatDate(selectedDate)}</SheetTitle>
          </SheetHeader>

          <div className="py-6">
            {errorRelatorioPreparos ? (
              <div className="text-sm text-destructive">{errorRelatorioPreparos}</div>
            ) : (
              <Tabs defaultValue="lista1" className="w-full">
                <TabsList className="w-full grid grid-cols-2 text-xs">
                  <TabsTrigger value="lista1">Total Preparado</TabsTrigger>
                  <TabsTrigger value="lista2">Ingredientes Crus</TabsTrigger>
                </TabsList>
                
                <TabsContent value="lista1" className="mt-4">
                  <ScrollArea className="h-[60vh]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Preparo</TableHead>
                          <TableHead className="text-right">Peso Pronto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(relatorioPreparos?.prontos ?? []).length > 0 ? (
                          <>
                            {relatorioPreparos!.prontos.map((row) => (
                              <TableRow key={row.preparoId}>
                                <TableCell>{row.nome}</TableCell>
                                <TableCell className="text-right font-medium">
                                  {Number(row.kgPronto ?? 0).toFixed(3)} kg
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow>
                              <TableCell className="font-bold text-slate-800">TOTAL</TableCell>
                              <TableCell className="text-right font-black text-slate-800">
                                {(
                                  relatorioPreparos!.prontos.reduce((acc, r) => acc + Number(r.kgPronto ?? 0), 0)
                                ).toFixed(3)} kg
                              </TableCell>
                            </TableRow>
                          </>
                        ) : (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">Nenhum dado encontrado</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="lista2" className="mt-4">
                  <ScrollArea className="h-[60vh]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ingrediente (Ref. Cru)</TableHead>
                          <TableHead className="text-right">Peso Cru</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(relatorioPreparos?.crus ?? []).length > 0 ? (
                          <>
                            {relatorioPreparos!.crus.map((row) => (
                              <TableRow key={row.ingredienteId}>
                                <TableCell>{row.nome}</TableCell>
                                <TableCell className="text-right font-medium text-emerald-700">
                                  {Number(row.kgCru ?? 0).toFixed(3)} kg
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow>
                              <TableCell className="font-bold text-slate-800">TOTAL</TableCell>
                              <TableCell className="text-right font-black text-slate-800">
                                {(
                                  relatorioPreparos!.crus.reduce((acc, r) => acc + Number(r.kgCru ?? 0), 0)
                                ).toFixed(3)} kg
                              </TableCell>
                            </TableRow>
                          </>
                        ) : (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">Nenhum dado encontrado</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            )}
            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                disabled={downloadingPreparos}
                className="bg-green-800 text-white"
                onClick={async () => {
                  const dateISO = utils.toISODateOnly(selectedDate);
                  const ok = await downloadPreparosDocx({ data: dateISO });
                  if (!ok) toast({ title: "Falha ao baixar DOCX", variant: "destructive" });
                }}
              >
                Baixar DOCX
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <Sheet open={producaoSheetOpen} onOpenChange={setProducaoSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              Produção do Dia - {formatDate(selectedDate)}
            </SheetTitle>
          </SheetHeader>
          <div className="py-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(calcularProducaoDoDia()).map(
                  ([item, quantidade]) => (
                    <TableRow key={item}>
                      <TableCell>{item}</TableCell>
                      <TableCell className="text-right">{quantidade}</TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>

          </div>
        </SheetContent>
      </Sheet>

      <NovoAgendamentoNovoLayout
        open={cadastroOpen}
        onOpenChange={(open) => {
          setCadastroOpen(open);

          if (!open) {
            setModoEdicao(false);
            setAgendamentoEditandoId(null);
            setDadosEdicao(null);
          }
        }}
        clientes={clientes.map((c) => {
          const enderecoPrincipal =
            c.enderecos?.find((e) => e.principal) ?? c.enderecos?.[0];

          const enderecoTexto =
            enderecoPrincipal?.endereco ||
            (enderecoPrincipal ? formatEndereco(enderecoPrincipal) : "");

          return {
            id: String(c.id),
            nome: c.nome,
            telefone: c.telefone,
            enderecoPrincipal: enderecoTexto,
            planos: c.planos,
          };
        })}
        tamanhos={tamanhos.map((t) => ({
          id: String(t.id),
          nome: t.nome,
          valorUnitario: Number(t.valorUnitario ?? 0),
          valor10: Number(t.valor10 ?? 0),
          valor20: Number(t.valor20 ?? 0),
          valor40: Number(t.valor40 ?? 0),
        }))}
        opcoesPadrao={opcoesPadrao}
        carboidratos={carboidratos}
        proteinas={proteinas}
        legumes={legumes}
        feijoes={feijoes}
        salgados={salgados.map((s) => ({
          id: String(s.id),
          nome: s.nome,
          preco: Number(s.preco || 0),
        }))}
        initialData={dadosEdicao}
        onSubmit={async (payload) => {
          if (modoEdicao && agendamentoEditandoId) {
            await updateAgendamento(agendamentoEditandoId, {
              tipo: payload.tipo,
              data: payload.data,
              faixaHorario: payload.faixaHorario,
              endereco: payload.endereco,
              observacoes: payload.observacoes ?? null,
              formaPagamento: payload.formaPagamento,
              itens: payload.itens.map((it: any) => ({
                tipoItem: it.tipoItem,
                destinatarioNome: it.destinatarioNome,
                tamanhoId: it.tamanhoId ? Number(it.tamanhoId) : null,
                salgadoId: it.salgadoId ? Number(it.salgadoId) : null,
                quantidade: Number(it.quantidade),

                opcaoId: it.opcaoId ? Number(it.opcaoId) : null,
                carboId: it.carboId ? Number(it.carboId) : null,
                proteinaId: it.proteinaId ? Number(it.proteinaId) : null,
                legumeId: it.legumeId ? Number(it.legumeId) : null,
                feijaoId: it.feijaoId ? Number(it.feijaoId) : null,

                zerarLegume: !!it.zerarLegume,
                adicionarFeijao: !!it.adicionarFeijao,
                carboGramas: Number(it.carboGramas || 0),
                proteinaGramas: Number(it.proteinaGramas || 0),
                legumeGramas: Number(it.legumeGramas || 0),
                feijaoGramas: Number(it.feijaoGramas || 0),
                observacaoItem: it.observacaoItem ?? "",
                precoUnit: Number(it.precoUnit ?? 0),
                usarPlano: !!it.usarPlano,
              })),
            });
          } else {
            await createAgendamento({
              clienteId: Number(payload.clienteId),
              tipo: payload.tipo,
              data: payload.data,
              faixaHorario: payload.faixaHorario,
              endereco: payload.endereco,
              observacoes: payload.observacoes ?? null,
              formaPagamento: payload.formaPagamento,
              itens: payload.itens.map((it: any) => ({
                tipoItem: it.tipoItem,
                destinatarioNome: it.destinatarioNome,
                tamanhoId: it.tamanhoId ? Number(it.tamanhoId) : null,
                salgadoId: it.salgadoId ? Number(it.salgadoId) : null,
                quantidade: Number(it.quantidade),

                opcaoId: it.opcaoId ? Number(it.opcaoId) : null,
                carboId: it.carboId ? Number(it.carboId) : null,
                proteinaId: it.proteinaId ? Number(it.proteinaId) : null,
                legumeId: it.legumeId ? Number(it.legumeId) : null,
                feijaoId: it.feijaoId ? Number(it.feijaoId) : null,

                zerarLegume: !!it.zerarLegume,
                adicionarFeijao: !!it.adicionarFeijao,
                carboGramas: Number(it.carboGramas || 0),
                proteinaGramas: Number(it.proteinaGramas || 0),
                legumeGramas: Number(it.legumeGramas || 0),
                feijaoGramas: Number(it.feijaoGramas || 0),
                observacaoItem: it.observacaoItem ?? "",
                precoUnit: Number(it.precoUnit ?? 0),
                usarPlano: !!it.usarPlano,
              })),
            });
          }

          const date = utils.toISODateOnly(selectedDate);
          const res = await getAgendamentos({ date, page: 1, pageSize: 200 });
          setAgendamentos((res.rows || []).map(mapApiToUi));

          setCadastroOpen(false);
        }}
      />
    </div>
  );
}
