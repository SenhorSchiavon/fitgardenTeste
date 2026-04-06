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
} from "lucide-react";
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
  const [rotasSheetOpen, setRotasSheetOpen] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [agendamentoEditandoId, setAgendamentoEditandoId] = useState<
    number | null
  >(null);
  const [dadosEdicao, setDadosEdicao] = useState<any>(null);

  const { preparos, loading: loadingPreparos } = usePreparosSelecionaveis();
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
          nome: it.opcao?.nome ?? it.nome ?? "-",
          tamanho: it.tamanho?.pesagemGramas
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

  const getZonaColor = (zona: string) => {
    switch (zona) {
      case "CENTRO":
        return "bg-purple-500";
      case "ZONA SUL":
        return "bg-yellow-500";
      case "ZONA NORTE":
        return "bg-pink-500";
      case "ZONA LESTE":
        return "bg-emerald-500";
      case "ZONA OESTE":
        return "bg-cyan-500";
      case "CAMBÉ":
        return "bg-indigo-500";
      case "IBIPORÃ":
        return "bg-amber-500";
      default:
        return "bg-gray-500";
    }
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

  const calcularRotasMontagem = () => {
    const rotas: Record<string, Record<string, number>> = {
      CENTRO: {},
      "ZONA SUL": {},
      "ZONA NORTE": {},
      "ZONA LESTE": {},
      "ZONA OESTE": {},
      CAMBÉ: {},
      IBIPORÃ: {},
    };

    agendamentos.forEach((agendamento) => {
      if (agendamento.tipoEntrega === "ENTREGA") {
        agendamento.itens.forEach((item) => {
          if (!rotas[agendamento.zona][item.nome]) {
            rotas[agendamento.zona][item.nome] = 0;
          }
          rotas[agendamento.zona][item.nome] += item.quantidade;
        });
      }
    });

    return rotas;
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

      <div className="flex items-center justify-end mb-6">
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            onClick={() => {
              const dateISO = utils.toISODateOnly(selectedDate);
              downloadPedidosDocx({ data: dateISO });
            }}
            disabled={downloadingPedidos}
          >
            {downloadingPedidos ? "Gerando..." : "Baixar relatório de pedidos (DOCX)"}
          </Button>

          {errorPedidosDocx && (
            <div className="text-xs text-red-600 mt-2">{errorPedidosDocx}</div>
          )}

          {error && <div className="text-xs text-red-600 mt-2">{error}</div>}
          <Button
            className="w-full sm:w-auto"
            variant="outline"
            onClick={async () => {
              try {
                const dateISO = utils.toISODateOnly(selectedDate);
                const res = await getRelatorio({ data: dateISO });

                if (!res) {
                  toast({
                    title: "Não foi possível gerar o relatório",
                    description: errorRelatorioPreparos ?? "Tente novamente",
                    variant: "destructive",
                  });
                  return;
                }

                setPreparoSheetOpen(true);
              } catch (e: any) {
                console.error(e);
                toast({
                  title: "Erro ao gerar relatório de preparo",
                  description: e?.message ?? "Tente novamente",
                  variant: "destructive",
                });
              }
            }}
            disabled={loadingRelatorioPreparos}
          >
            <FileText className="mr-2 h-4 w-4" />
            Relatório de Preparo
          </Button>
          <Button className="w-full sm:w-auto" variant="outline" onClick={() => setProducaoSheetOpen(true)}>
            <FileText className="mr-2 h-4 w-4" /> Produção do Dia
          </Button>
          <Button className="w-full sm:w-auto"
            variant="outline"
            onClick={async () => {
              try {
                const dateISO = utils.toISODateOnly(selectedDate);
                await baixarXlsxImportEntregasDoDia(dateISO);
              } catch (e: any) {
                console.error(e);
              }
            }}
          >
            Baixar planilha para importar
          </Button>

          <Button className="w-full sm:w-auto"
            onClick={() => setCadastroOpen(true)}
            disabled={loadingOpcoes}
          >
            <Plus className="mr-2 h-4 w-4" /> Novo Agendamento
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

        <Card>
          <CardHeader className="flex flex-row items-center">
            <CardTitle>Agendamentos para {formatDate(selectedDate)}</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-4">
                {agendamentos.map((agendamento) => (
                  <div
                    key={agendamento.id}
                    className="flex flex-col border rounded-lg overflow-hidden cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleShowDetalhes(agendamento)}
                  >
                    <div className="flex items-center p-4 bg-muted/40">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="font-medium">
                            {agendamento.numeroPedido}
                          </span>
                          <span className="mx-2">-</span>
                          <span>{agendamento.cliente}</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Badge
                            variant={
                              agendamento.tipoEntrega === "ENTREGA"
                                ? "default"
                                : "outline"
                            }
                          >
                            {agendamento.tipoEntrega}
                          </Badge>
                          <span className="mx-2">•</span>
                          <span>{agendamento.faixaHorario}h</span>
                          <span className="mx-2">•</span>
                          <span>{agendamento.quantidade} itens</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {agendamento.formaPagamento}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex h-1 w-full">
                      <div
                        className={`h-1 w-full ${getZonaColor(agendamento.zona)}`}
                      />
                    </div>
                  </div>
                ))}
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
                        <Badge variant="secondary" className="mt-2 text-[10px] uppercase bg-slate-100 text-slate-600">
                          Zona: {agendamentoSelecionado?.zona}
                        </Badge>
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
                  Marmitas do Pedido 
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
                            <p className="text-[10px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded w-fit mt-1 uppercase tracking-tight">
                              Tamanho: {item.tamanho}
                            </p>
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

      <Sheet open={rotasSheetOpen} onOpenChange={setRotasSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              Rotas de Montagem - {formatDate(selectedDate)}
            </SheetTitle>
          </SheetHeader>
          <div className="py-6">
            <Tabs defaultValue="CENTRO">
              <TabsList className="flex flex-wrap h-auto gap-1 mb-4">
                <TabsTrigger value="CENTRO">Centro</TabsTrigger>
                <TabsTrigger value="ZONA SUL">Zona Sul</TabsTrigger>
                <TabsTrigger value="ZONA OESTE">Zona Oeste</TabsTrigger>
                <TabsTrigger value="ZONA NORTE">Zona Norte</TabsTrigger>
                <TabsTrigger value="ZONA LESTE">Zona Leste</TabsTrigger>
                <TabsTrigger value="CAMBÉ">Cambé</TabsTrigger>
                <TabsTrigger value="IBIPORÃ">Ibiporã</TabsTrigger>
              </TabsList>

              {Object.entries(calcularRotasMontagem()).map(([zona, itens]) => (
                <TabsContent key={zona} value={zona}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Quantidade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(itens).length > 0 ? (
                        Object.entries(itens).map(([item, quantidade]) => (
                          <TableRow key={item}>
                            <TableCell>{item}</TableCell>
                            <TableCell className="text-right">
                              {quantidade}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center">
                            Nenhum item para esta região
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
              ))}
            </Tabs>
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
                tamanhoId: Number(it.tamanhoId),
                quantidade: Number(it.quantidade),

                opcaoId: it.opcaoId ? Number(it.opcaoId) : null,
                carboId: it.carboId ? Number(it.carboId) : null,
                proteinaId: it.proteinaId ? Number(it.proteinaId) : null,
                legumeId: it.legumeId ? Number(it.legumeId) : null,
                feijaoId: it.feijaoId ? Number(it.feijaoId) : null,

                zerarLegume: !!it.zerarLegume,
                adicionarFeijao: !!it.adicionarFeijao,
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
                tamanhoId: Number(it.tamanhoId),
                quantidade: Number(it.quantidade),

                opcaoId: it.opcaoId ? Number(it.opcaoId) : null,
                carboId: it.carboId ? Number(it.carboId) : null,
                proteinaId: it.proteinaId ? Number(it.proteinaId) : null,
                legumeId: it.legumeId ? Number(it.legumeId) : null,
                feijaoId: it.feijaoId ? Number(it.feijaoId) : null,

                zerarLegume: !!it.zerarLegume,
                adicionarFeijao: !!it.adicionarFeijao,
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
