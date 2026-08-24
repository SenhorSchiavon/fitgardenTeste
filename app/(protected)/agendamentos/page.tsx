"use client";

import { useEffect, useMemo, useState } from "react";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  FileDown,
  LayoutDashboard,
  Clock,
  Package,
  Wallet,
  CheckCircle2,
  Send,
  Check,
  MessageCircle,
  Copy,
  Printer,
  Search,
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
import { toast as sonnerToast } from "sonner";
import { useRelatorioPreparosDia } from "@/hooks/useRelatorioPreparosDia";
import { useRelatorioPedidosDia } from "@/hooks/useRelatorioPedidosDia";
import { useRelatorioMontadoresRotas } from "@/hooks/useRelatorioMontadoresRotas";
import { usePreparosSelecionaveis } from "@/hooks/usePreparosSelecionaveis";
import { useSalgados } from "@/hooks/useSalgados";
import { apiFetch } from "@/hooks/api";
import { useCongeladas } from "@/hooks/useCongeladas";
import { usePlanosCliente } from "@/hooks/usePlanosCliente";
import { useRegrasPersonalizadas } from "@/hooks/useRegrasPersonalizadas";
type Agendamento = {
  id: string;
  pedidoId?: number | string;
  numeroPedido: string;
  cliente: string;
  tipoEntrega: "NAO_DEFINIR" | "ENTREGA" | "RETIRADA" | "CONGELAR";
  congelarSubtipo?: "ENTREGA" | "RETIRADA" | null;
  data?: string;
  dataEntregaCongelada?: string | null;
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
  formaPagamentoTaxaVoucher?: string | null;
  taxaVoucherPaga?: boolean;
  voucherCodigo?: string;
  entregador: string;
  observacoes?: string;
  precisaTroco?: boolean;
  trocoPara?: number | null;

  valorPedido?: number;
  valorPedidoProporcional?: number;
  valorTaxa?: number;
  cobrarTaxaEntrega?: boolean;
  valorTotal?: number;
  valorDescontos?: number;
  valorDescontoPlanoItens?: number;
  valorDescontoVoucher?: number;
  valorDescontoManual?: number;
  motivoDescontoManual?: string | null;
  valorTotalFinal?: number;
  valorPlanosComprados?: number;
  valorPlanosCompradosPendente?: number;
  planosComprados?: { id?: number; nome: string; valor: number; valorPlano: number; valorTaxas: number; pago: boolean }[];
  taxaEntregaAbatidaPlano?: boolean;
  usouPlano?: boolean;
  saldoMarmitasAposPedido?: number | null;
  planosAtivos?: { tamanho: string; saldo: number }[];
  saldoTaxasEntrega?: number;
  adicionaisConsumidosPlano?: number;
  saldoAdicionaisPlano?: number;

  itens: {
    id?: string;
    groupId?: string;
    tipoItem?: string;
    salgadoId?: string;
    nome: string;
    tamanho: string;
    quantidade: number;
    valor?: number;
    usarPlano: boolean;
    destinatarioNome?: string;
    observacaoItem?: string;
    carbo?: string;
    carboGramas?: number;
    proteina?: string;
    proteinaGramas?: number;
    legume?: string;
    legumeGramas?: number;
    feijao?: string;
    feijaoGramas?: number;
    complemento?: string;
    complementoGramas?: number;
    adicionarFeijao?: boolean;
    adicionarPure?: boolean;
    adicionarLegumes?: boolean;
    adicionarArroz?: boolean;
    trocaCarbo?: string;
    trocaProteina?: string;
    trocaLegume?: string;
    zerarLegume?: boolean;
    trocas?: string;
  }[];
  _raw?: any;
};

const ROTAS_ENTREGA = [
  { id: 1, label: "ROTA 1", intervalo: "13:00-15:00", start: 13 * 60, end: 15 * 60, color: "#ef4444" },
  { id: 2, label: "ROTA 2", intervalo: "15:00-17:00", start: 15 * 60, end: 17 * 60, color: "#f97316" },
  { id: 3, label: "ROTA 3", intervalo: "17:00-18:00", start: 17 * 60, end: 18 * 60, color: "#22c55e" },
  { id: 4, label: "ROTA 4", intervalo: "18:00-20:30", start: 18 * 60, end: 20 * 60 + 30, color: "#3b82f6" },
];

function horarioInicioEmMinutos(faixaHorario: string) {
  const inicio = String(faixaHorario || "").split("-")[0] || "";
  const [h, m] = inicio.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

function horarioFimEmMinutos(faixaHorario: string) {
  const fim = String(faixaHorario || "").split("-")[1] || "";
  const [h, m] = fim.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return Number.MAX_SAFE_INTEGER;
  return h * 60 + m;
}

function getRotaAgendamento(agendamento: Agendamento) {
  if (agendamento.tipoEntrega === "CONGELAR") {
    return ROTAS_ENTREGA[ROTAS_ENTREGA.length - 1];
  }
  const inicio = horarioInicioEmMinutos(agendamento.faixaHorario);
  if (inicio == null) return null;
  const rota = ROTAS_ENTREGA.find((item) => inicio >= item.start && inicio < item.end);
  if (rota) return rota;
  if (agendamento.tipoEntrega === "RETIRADA") {
    if (inicio < ROTAS_ENTREGA[0].start) return ROTAS_ENTREGA[0];
    return ROTAS_ENTREGA[ROTAS_ENTREGA.length - 1];
  }
  return null;
}

function getWhatsappUrl(telefone: string, mensagem: string) {
  const digits = String(telefone || "").replace(/\D/g, "");
  if (!digits) return null;
  const phone = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(mensagem)}`;
}

function getLabelPagamento(forma: string, agendamento?: any) {
  const voucherCodigo = agendamento?.voucherCodigo ? String(agendamento.voucherCodigo).trim() : "";
  const isVoucher = forma === "VOUCHER" || forma?.startsWith("VOUCHER_") || agendamento?.formaPagamento === "VOUCHER";

  if (isVoucher) {
    const sufixoCodigo = voucherCodigo ? ` #${voucherCodigo}` : "";
    const taxaForma = agendamento?.formaPagamentoTaxaVoucher || (forma === "VOUCHER_TAXA_PIX" ? "PIX" : forma === "VOUCHER_TAXA_DINHEIRO" ? "DINHEIRO" : forma === "VOUCHER_TAXA_CARTAO" ? "CREDITO" : null);
    const sufixoTaxa = taxaForma && taxaForma !== "A_DEFINIR" ? ` + ${taxaForma === "CREDITO" ? "Cartão" : taxaForma}` : "";
    return `VOUCHER${sufixoCodigo}${sufixoTaxa}`;
  }

  const labels: Record<string, string> = {
    A_DEFINIR: "Não definido",
    DINHEIRO: "Dinheiro",
    CREDITO: "Cartão de crédito",
    DEBITO: "Cartão de débito",
    VALE_ALIMENTACAO: "Vale Alimentação",
    VALE_REFEICAO: "Vale Refeição",
    PIX: "PIX",
    LINK: "Link de pagamento",
    VOUCHER: "Voucher",
    PLANO: "Plano",
    TROCA: "Troca",
    BONIFICACAO: "Bonificação",
    VOUCHER_TAXA_DINHEIRO: "Voucher + Dinheiro",
    VOUCHER_TAXA_CARTAO: "Voucher + Cartão",
    VOUCHER_TAXA_PIX: "Voucher + PIX",
  };
  return labels[forma] || forma || "-";
}

function getLabelPagamentoConfirmacao(agendamento: Agendamento) {
  if (agendamento.formaPagamento !== "VOUCHER" && !Number(agendamento.valorDescontoVoucher || 0)) {
    return getLabelPagamento(agendamento.formaPagamento);
  }
  const taxa = agendamento.formaPagamentoTaxaVoucher || "A_DEFINIR";
  const labelsTaxa: Record<string, string> = {
    A_DEFINIR: "Taxa não definida",
    PIX: agendamento.taxaVoucherPaga ? "Taxa PIX — PAGA" : "Taxa PIX — A PAGAR",
    DINHEIRO: "Taxa em dinheiro",
    CREDITO: "Taxa cartão de crédito",
    DEBITO: "Taxa cartão de débito",
    VALE_ALIMENTACAO: "Taxa no Vale Alimentação",
    VALE_REFEICAO: "Taxa no Vale Refeição",
  };
  return `Voucher / ${labelsTaxa[taxa] || "Taxa não definida"}`;
}

function ordenarAgendamentosRota(rows: Agendamento[]) {
  return [...rows].sort((a, b) => {
    const prioridadeTipo = (agendamento: Agendamento) => agendamento.tipoEntrega === "RETIRADA" ? 0 : 1;
    const diffTipo = prioridadeTipo(a) - prioridadeTipo(b);
    if (diffTipo !== 0) return diffTipo;
    return horarioFimEmMinutos(a.faixaHorario) - horarioFimEmMinutos(b.faixaHorario);
  });
}

function montarDadosEdicaoAgendamento(agendamento: Agendamento) {
  const raw = agendamento._raw || {};
  const pedido = raw.pedido || {};
  const pagamentos = pedido.pagamentos ?? raw.pagamentos ?? [];
  const voucherCodigo =
    String(agendamento.voucherCodigo || "").trim() ||
    String(pagamentos.find((pagamento: any) => String(pagamento.voucherCodigo || "").trim())?.voucherCodigo || "").trim();
  const formaPagamento = agendamento.formaPagamento || "A_DEFINIR";
  const formaPagamentoTaxaVoucher = pedido.formaPagamentoTaxaVoucher ?? raw.formaPagamentoTaxaVoucher ?? null;
  const formaCobranca = formaPagamento === "VOUCHER" ? formaPagamentoTaxaVoucher : formaPagamento;
  const pagamentoJaRealizado = (formaCobranca === "PIX" || formaCobranca === "LINK") &&
    pagamentos.some((pagamento: any) => pagamento.forma === formaCobranca && pagamento.status === "CONFIRMADO");
  return {
    ...raw,
    clienteId: pedido.clienteId ?? raw.clienteId,
    pedido: {
      ...pedido,
      clienteId: pedido.clienteId ?? raw.clienteId,
      itens: pedido.itens ?? raw.itens ?? [],
    },
    tipoEntrega: agendamento.tipoEntrega,
    tipo: agendamento.tipoEntrega,
    data: raw.data ?? agendamento.data,
    dataEntregaCongelada: raw.dataEntregaCongelada ?? agendamento.dataEntregaCongelada ?? null,
    congelarSubtipo: raw.congelarSubtipo ?? agendamento.congelarSubtipo ?? null,
    faixaHorario: agendamento.faixaHorario,
    endereco: raw.endereco ?? agendamento.endereco,
    regiao: raw.regiao ?? agendamento.zona ?? null,
    observacoes: pedido.observacoes ?? agendamento.observacoes ?? "",
    precisaTroco: pedido.precisaTroco ?? agendamento.precisaTroco ?? false,
    trocoPara: pedido.trocoPara ?? agendamento.trocoPara ?? null,
    formaPagamento,
    formaPagamentoTaxaVoucher,
    voucherCodigo,
    pagamentoJaRealizado,
    planosCompradosExibidos: agendamento.planosComprados ?? [],
    itens: pedido.itens ?? raw.itens ?? [],
  };
}

function getLabelTipoEntrega(tipo: string) {
  const labels: Record<string, string> = {
    NAO_DEFINIR: "Não definido",
    ENTREGA: "Entrega",
    RETIRADA: "Retirada",
    CONGELAR: "Congelar",
  };
  return labels[tipo] || tipo || "-";
}

function moneyBr(value: number) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function normalizarBusca(value: string) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function toast({
  title,
  description,
  variant,
}: {
  title: string;
  description?: string;
  variant?: "destructive";
}) {
  if (variant === "destructive") {
    return sonnerToast.error(title, { description });
  }
  return sonnerToast.success(title, { description });
}

function escaparHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default function Agendamentos() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [cadastroOpen, setCadastroOpen] = useState(false);
  const {
    clientes,
    filteredClientes,
    loading: loadingClientes,
    saving: savingClientes,
    createCliente,
    updateCliente,
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
    downloadCozinhaDocx: downloadPedidosCozinhaDocx,
    downloading: downloadingPedidos,
    error: errorPedidosDocx,
  } = useRelatorioPedidosDia();
  const {
    abrirCupomElgin,
    downloading: downloadingMontadoresRotas,
    error: errorMontadoresRotas,
  } = useRelatorioMontadoresRotas();
  const { opcoes, loading: loadingOpcoes } = useOpcoesDoCardapio(
    cardapioAtivo?.id,
  );
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [buscaAgendamento, setBuscaAgendamento] = useState("");
  const {
    createAgendamento,
    updateAgendamento,
    getAgendamentos,
    getAgendamentoById,
    deleteAgendamento,
    integrarEntregasDoDia,
    baixarXlsxImportEntregasDoDia,
    loading,
    error,
    utils,
  } = useAgendamentos();
  const {
    listPlanosNaoPagos,
    marcarPlanoComoPago,
    saving: savingPlanoCliente,
  } = usePlanosCliente();
  const [planosNaoPagos, setPlanosNaoPagos] = useState<any[]>([]);
  const [loadingPlanosNaoPagos, setLoadingPlanosNaoPagos] = useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] =
    useState<Agendamento | null>(null);
  const [detalhesDialogOpen, setDetalhesDialogOpen] = useState(false);
  const [producaoSheetOpen, setProducaoSheetOpen] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [agendamentoEditandoId, setAgendamentoEditandoId] = useState<
    number | null
  >(null);
  const [dadosEdicao, setDadosEdicao] = useState<any>(null);
  const [modoOrcamento, setModoOrcamento] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("orcamento") !== "1") return;
    setModoOrcamento(true);
    setModoEdicao(false);
    setAgendamentoEditandoId(null);
    setDadosEdicao(null);
    setCadastroOpen(true);
  }, []);

  useEffect(() => {
    const raw = sessionStorage.getItem("fitgarden:pedido-publico-agendamento");
    if (!raw) return;
    try {
      const pedidoRecebido = JSON.parse(raw);
      setModoEdicao(false);
      setAgendamentoEditandoId(null);
      setDadosEdicao(pedidoRecebido);
      setCadastroOpen(true);
    } finally {
      sessionStorage.removeItem("fitgarden:pedido-publico-agendamento");
    }
  }, []);

  const { preparos, loading: loadingPreparos } = usePreparosSelecionaveis();
  const { salgados } = useSalgados();
  const { congeladas } = useCongeladas();
  const { regras } = useRegrasPersonalizadas();
  const [preparoSheetOpen, setPreparoSheetOpen] = useState(false);
  const loadPlanosNaoPagos = async () => {
    setLoadingPlanosNaoPagos(true);
    try {
      const data = await listPlanosNaoPagos();
      setPlanosNaoPagos(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPlanosNaoPagos(false);
    }
  };

  const planosNaoPagosDoDia = useMemo(() => {
    const selected = utils.toISODateOnly(selectedDate);
    return planosNaoPagos.filter((plano) => {
      if (!plano.createdAt) return false;
      return utils.toISODateOnly(new Date(plano.createdAt)) === selected;
    });
  }, [planosNaoPagos, selectedDate, utils]);

  const agendamentosFiltrados = useMemo(() => {
    const termos = normalizarBusca(buscaAgendamento).split(/\s+/).filter(Boolean);
    if (!termos.length) return agendamentos;
    return agendamentos.filter((agendamento) => {
      const texto = normalizarBusca([
        agendamento.cliente,
        agendamento.telefone,
        agendamento.numeroPedido,
        agendamento.endereco,
      ].join(" "));
      return termos.every((termo) => texto.includes(termo));
    });
  }, [agendamentos, buscaAgendamento]);

  const agendamentosPorRota = useMemo(() => {
    const contarMarmitas = (lista: Agendamento[]) => lista.reduce((total, agendamento) => (
      total + agendamento.itens
        .filter((item) => item.tipoItem !== "SALGADO")
        .reduce((subtotal, item) => subtotal + Number(item.quantidade || 0), 0)
    ), 0);
    const grupos = ROTAS_ENTREGA.map((rota) => {
      const agendamentosRota = ordenarAgendamentosRota(
        agendamentosFiltrados.filter((agendamento) => getRotaAgendamento(agendamento)?.id === rota.id),
      );
      return {
        ...rota,
        agendamentos: agendamentosRota,
        totalMarmitas: contarMarmitas(agendamentosRota),
      };
    }).filter((grupo) => grupo.agendamentos.length > 0);
    const semRota = ordenarAgendamentosRota(
      agendamentosFiltrados.filter((agendamento) => !getRotaAgendamento(agendamento)),
    );
    if (semRota.length > 0) {
      grupos.push({
        id: 0,
        label: "SEM ROTA",
        intervalo: "Fora das janelas",
        start: 0,
        end: 0,
        color: "#94a3b8",
        agendamentos: semRota,
        totalMarmitas: contarMarmitas(semRota),
      });
    }
    return grupos;
  }, [agendamentosFiltrados]);

  const totalMarmitasAgendadas = useMemo(() => {
    return agendamentos.reduce((total, agendamento) => {
      return total + agendamento.itens
        .filter((item) => item.tipoItem !== "SALGADO")
        .reduce((subtotal, item) => subtotal + Number(item.quantidade || 0), 0);
    }, 0);
  }, [agendamentos]);

  const handleShowDetalhes = (agendamento: Agendamento) => {
    setAgendamentoSelecionado(agendamento);
    setDetalhesDialogOpen(true);
  };

  const formatIngrediente = (nome?: string, gramas?: number | null, isPersonalizada?: boolean) => {
    if (!nome) return "";
    const qtd = Number(gramas || 0);
    if (isPersonalizada && qtd <= 0) return "";
    return qtd > 0 ? `${nome} ${qtd}g` : nome;
  };

  const formatarDataAgendamento = (valor?: string | null) => {
    const partes = String(valor || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!partes) return "A DEFINIR";

    const [, ano, mes, dia] = partes;
    const dataLocal = new Date(Number(ano), Number(mes) - 1, Number(dia));
    const diaDaSemana = new Intl.DateTimeFormat("pt-BR", { weekday: "long" })
      .format(dataLocal)
      .toUpperCase();

    return `${diaDaSemana} - ${dia}/${mes}/${ano.slice(-2)}`;
  };

  const montarMensagemConfirmacao = (agendamento: Agendamento) => {
    const faixaHorario = String(agendamento.faixaHorario || "").trim();
    const horarioFormatado = faixaHorario.includes("-")
      ? faixaHorario.split("-").map((parte) => parte.trim()).filter(Boolean).join(" às ")
      : faixaHorario;
    const grupos = new Map<string, { titulo: string; linhas: string[]; totalMarmitas: number; subtotal: number }>();
    agendamento.itens.forEach((item) => {
      const personalizada = item.tipoItem === "PERSONALIZADA";
      const detalhes = personalizada
        ? [
            [item.carbo, item.carboGramas],
            [item.proteina, item.proteinaGramas],
            [item.legume, item.legumeGramas],
            [item.feijao, item.feijaoGramas],
            [item.complemento, item.complementoGramas],
          ].filter(([nome, gramas]) => !!nome && Number(gramas || 0) > 0).map(([nome]) => nome)
        : [item.carbo, item.proteina, item.legume, item.feijao, item.complemento].filter(Boolean);
      const descricaoBase = detalhes.length ? detalhes.join(" + ") : item.nome;
      const descricao = [
        descricaoBase,
        item.adicionarFeijao && item.tipoItem !== "PERSONALIZADA" ? "FEIJÃO ADICIONAL" : null,
        item.adicionarPure && item.tipoItem !== "PERSONALIZADA" ? "PURÊ ADICIONAL" : null,
        item.adicionarLegumes && item.tipoItem !== "PERSONALIZADA" ? "LEGUMES ADICIONAIS" : null,
      ].filter(Boolean).join(" + ");
      const descricaoComArroz = item.adicionarArroz && item.tipoItem !== "PERSONALIZADA"
        ? `${descricao} + ARROZ ADICIONAL`
        : descricao;
      const substituicoes = personalizada
        ? []
        : [
            item.trocaCarbo ? `TROCA DE CARBOIDRATO: ${item.trocaCarbo}` : null,
            item.trocaProteina ? `TROCA DE PROTEÍNA: ${item.trocaProteina}` : null,
            item.zerarLegume
              ? "RETIRAR LEGUMES"
              : item.trocaLegume
                ? `TROCA DE LEGUMES/PURÊ: ${item.trocaLegume}`
                : null,
          ].filter((linha): linha is string => !!linha);
      const pesagens = personalizada
        ? [
            [item.carbo, item.carboGramas],
            [item.proteina, item.proteinaGramas],
            [item.legume, item.legumeGramas],
            [item.feijao, item.feijaoGramas],
            [item.complemento, item.complementoGramas],
          ]
            .filter(([nome, gramas]) => !!nome && Number(gramas || 0) > 0)
            .map(([, gramas]) => Number(gramas))
            .join("/")
        : "";
      const tituloTamanho = personalizada
        ? `PERSONALIZADO${pesagens ? ` ${pesagens}` : ""}`
        : item.tipoItem === "CONGELADA"
        ? `CONGELADAS ${item.tamanho || ""}`.trim()
        : item.tamanho || "Itens";
      const grupo = [tituloTamanho, item.destinatarioNome]
        .filter(Boolean)
        .join(" - ");
      const chaveGrupo = item.groupId || item.id || grupo;
      const dadosGrupo = grupos.get(chaveGrupo) || { titulo: grupo, linhas: [], totalMarmitas: 0, subtotal: 0 };
      dadosGrupo.linhas.push(`    ${item.quantidade}x ${descricaoComArroz}`.toUpperCase());
      substituicoes.forEach((substituicao) => dadosGrupo.linhas.push(`      ↳ ${substituicao}`.toUpperCase()));
      dadosGrupo.subtotal += Number(item.valor || 0);
      if (item.tipoItem !== "SALGADO") {
        dadosGrupo.totalMarmitas += Number(item.quantidade || 0);
      }
      grupos.set(chaveGrupo, dadosGrupo);
    });
    const itens = Array.from(grupos.entries())
      .flatMap(([, dados], indice) => [
        grupos.size > 1 ? `*PEDIDO ${indice + 1} - ${dados.titulo}*` : `*${dados.titulo}*`,
        dados.totalMarmitas > 0 ? `*Total de marmitas:* ${dados.totalMarmitas}` : null,
        `*Subtotal do pedido:* ${moneyBr(dados.subtotal)}`,
        ...dados.linhas,
      ].filter((linha): linha is string => !!linha))
      .join("\n");
    const planos = agendamento.planosAtivos || [];
    const saldoTaxasEntrega = Number(agendamento.saldoTaxasEntrega || 0);
    const valorBasePlanosComprados = (agendamento.planosComprados || [])
      .reduce((total, plano) => total + Number(plano.valorPlano || 0), 0);
    const valorTaxasPlanosComprados = (agendamento.planosComprados || [])
      .reduce((total, plano) => total + Number(plano.valorTaxas || 0), 0);
    const valorTotalAdicionais = agendamento.itens
      .filter((item) => item.tipoItem === "PADRAO" || item.tipoItem === "PERSONALIZADA")
      .reduce((total, item) => {
        const quantidade = Math.max(1, Number(item.quantidade || 1));
        const quantidadeTrocas = [
          item.trocaCarbo,
          item.trocaProteina,
          !item.zerarLegume ? item.trocaLegume : null,
        ].filter(Boolean).length;
        const adicionaisUnitarios =
          quantidadeTrocas * 2 +
          (item.adicionarFeijao ? 2 : 0) +
          (item.adicionarPure ? 2 : 0) +
          (item.adicionarLegumes ? 2 : 0) +
          (item.adicionarArroz ? 2 : 0);
        return total + adicionaisUnitarios * quantidade;
      }, 0);
    const valorAdicionaisForaDoPlano = Math.max(
      0,
      valorTotalAdicionais - Number(agendamento.adicionaisConsumidosPlano || 0) * 2,
    );
    const tipoConfirmacao = agendamento.tipoEntrega === "CONGELAR"
      ? [
          "CONGELAR",
          (agendamento.congelarSubtipo || "A DEFINIR").toUpperCase(),
          formatarDataAgendamento(agendamento.dataEntregaCongelada),
        ].join(" - ")
      : getLabelTipoEntrega(agendamento.tipoEntrega).toUpperCase();
    const linhas = [
      `🔔 *Pedido Confirmado ${agendamento.numeroPedido}*`,
      `*Agendado para:* ${formatarDataAgendamento(agendamento.data)}`,
      "",
      `*Cliente:* ${agendamento.cliente.toUpperCase()}`,
      `*Telefone:* ${agendamento.telefone}`,
      `*Tipo:* ${tipoConfirmacao}`,
      `*Horário:* ${horarioFormatado || "A DEFINIR"}`,
      agendamento.tipoEntrega === "ENTREGA" ? `*Endereço:* ${agendamento.endereco.toUpperCase()}` : null,
      "",
      "*Itens:*",
      itens,
      "",
      agendamento.valorPlanosComprados && agendamento.valorPlanosComprados > 0
        ? `*Valor do plano adquirido:* ${moneyBr(valorBasePlanosComprados)}`
        : `*Subtotal:* ${moneyBr(Math.max(Number(agendamento.valorPedido || 0), Number(agendamento.valorDescontoPlanoItens || 0)))}`,
      agendamento.valorPlanosComprados && agendamento.valorPlanosComprados > 0
        ? valorTaxasPlanosComprados > 0
          ? `*Entrega incluída no plano:* ${moneyBr(valorTaxasPlanosComprados)}`
          : null
        : `*Taxa de Entrega:* ${moneyBr(agendamento.valorTaxa || 0)}`,
      agendamento.valorDescontoVoucher && agendamento.valorDescontoVoucher > 0
        ? `*Desconto Voucher:* - ${moneyBr(agendamento.valorDescontoVoucher)}`
        : null,
      agendamento.valorDescontoManual && agendamento.valorDescontoManual > 0
        ? `*Desconto${agendamento.motivoDescontoManual ? ` (${agendamento.motivoDescontoManual})` : ""}:* - ${moneyBr(agendamento.valorDescontoManual)}`
        : null,
      (!agendamento.valorPlanosComprados || agendamento.valorPlanosComprados <= 0) &&
      agendamento.valorDescontoPlanoItens && agendamento.valorDescontoPlanoItens > 0
        ? `*Desconto do Plano:* - ${moneyBr(agendamento.valorDescontoPlanoItens)}`
        : null,
      valorAdicionaisForaDoPlano > 0
        ? `*Adicionais a pagar:* ${moneyBr(valorAdicionaisForaDoPlano)}`
        : null,
      Number(agendamento.adicionaisConsumidosPlano || 0) > 0
        ? `*Adicionais usados do plano:* ${agendamento.adicionaisConsumidosPlano}`
        : null,
      `*Total:* ${moneyBr(agendamento.valorPlanosComprados && agendamento.valorPlanosComprados > 0
        ? Math.max(0, Math.max(Number(agendamento.valorPedido || 0), Number(agendamento.valorDescontoPlanoItens || 0)) - Number(agendamento.valorDescontoPlanoItens || 0)) -
          Number(agendamento.adicionaisConsumidosPlano || 0) * 2 +
          (agendamento.taxaEntregaAbatidaPlano ? 0 : Number(agendamento.valorTaxa || 0)) +
          Number(agendamento.valorPlanosComprados) - Number(agendamento.valorDescontoManual || 0)
        : agendamento.valorTotalFinal ?? agendamento.valorTotal ?? 0)}`,
      "",
      ...(agendamento.planosComprados?.length
        ? ["*Plano adquirido:*", ...agendamento.planosComprados.map((plano) =>
            plano.valorTaxas > 0
              ? `${plano.nome} - ${moneyBr(plano.valorPlano)} + ${moneyBr(plano.valorTaxas)} de entrega = ${moneyBr(plano.valor)}`
              : `${plano.nome} - ${moneyBr(plano.valor)}`,
          ), ""]
        : []),
      `*Forma de Pagamento:* ${getLabelPagamentoConfirmacao(agendamento)}`,
      agendamento.formaPagamento === "DINHEIRO"
        ? agendamento.precisaTroco && Number(agendamento.trocoPara || 0) > 0
          ? `*Troco para:* ${moneyBr(Number(agendamento.trocoPara))}`
          : "*Troco:* Não precisa"
        : null,
      ...(planos.length || saldoTaxasEntrega > 0
        ? [
            "",
            "*Planos ativos — saldo restante:*",
            ...planos.map((plano) => `${plano.saldo} unidades - ${plano.tamanho}`),
            `${saldoTaxasEntrega} taxa${saldoTaxasEntrega === 1 ? "" : "s"} de entrega`,
          ]
        : []),
    ];

    return linhas.filter((linha) => linha !== null && linha !== undefined).join("\n");
  };

  const copiarResumoPedido = async (agendamento: Agendamento) => {
    const resumo = montarMensagemConfirmacao(agendamento);
    try {
      await navigator.clipboard.writeText(resumo);
      toast({ title: "Resumo copiado", description: "O resumo do pedido está pronto para enviar ao cliente." });
    } catch {
      const area = document.createElement("textarea");
      area.value = resumo;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const copiou = document.execCommand("copy");
      area.remove();
      toast({
        title: copiou ? "Resumo copiado" : "Não foi possível copiar o resumo",
        description: copiou ? "O resumo do pedido está pronto para enviar ao cliente." : "Use o botão do WhatsApp para enviar.",
        variant: copiou ? undefined : "destructive",
      });
    }
  };

  const abrirImpressaoPedidos = (pedidos: Agendamento[]) => {
    const janela = window.open("", "_blank");
    if (!janela) {
      toast({ title: "Pop-up bloqueado", description: "Permita pop-ups para imprimir os cupons.", variant: "destructive" });
      return;
    }
    const cupons = pedidos.map((pedido) => {
      const rota = getRotaAgendamento(pedido)?.label || "SEM ROTA";
      const gruposItens = new Map<string, { destinatario: string; tamanho: string; itens: Agendamento["itens"] }>();
      pedido.itens.forEach((item) => {
        const destinatario = item.destinatarioNome?.trim() || pedido.cliente;
        const tamanho = item.tipoItem === "CONGELADA" ? `CONGELADAS ${item.tamanho || ""}`.trim() : item.tamanho || "ITENS";
        const chave = item.groupId || item.id || `${destinatario.toUpperCase()}|${tamanho.toUpperCase()}`;
        const grupo = gruposItens.get(chave) || { destinatario, tamanho, itens: [] };
        grupo.itens.push(item);
        gruposItens.set(chave, grupo);
      });
      const itens = Array.from(gruposItens.values()).map((grupo, indice) => {
        const titulo = gruposItens.size > 1
          ? `PEDIDO ${indice + 1} - ${grupo.tamanho} - ${grupo.destinatario}`
          : `${grupo.tamanho} - ${grupo.destinatario}`;
        const linhas = grupo.itens.map((item) => {
        const descricao = [item.carbo, item.proteina, item.legume, item.feijao, item.complemento].filter(Boolean).join(" + ") || item.nome;
          return `<div class="item">${escaparHtml(`${item.quantidade}x ${descricao}`.toUpperCase())}</div>`;
        }).join("");
        return `<div class="subpedido"><div class="subpedido-titulo">${escaparHtml(titulo.toUpperCase())}</div>${linhas}</div>`;
      }).join("");
      const observacoesItens = pedido.itens.map((item) => item.observacaoItem).filter(Boolean).join(" / ");
      const observacao = [pedido.observacoes, observacoesItens].filter(Boolean).join(" / ");
      const tamanhos = Array.from(new Set(pedido.itens.map((item) => item.tamanho).filter(Boolean))).join(" / ");
      const temPlanoAdquirido = Number(pedido.valorPlanosComprados || 0) > 0;
      const subtotalPedido = Math.max(Number(pedido.valorPedido || 0), Number(pedido.valorDescontoPlanoItens || 0));
      const valorBasePlanosComprados = (pedido.planosComprados || [])
        .reduce((total, plano) => total + Number(plano.valorPlano || 0), 0);
      const valorTaxasPlanosComprados = (pedido.planosComprados || [])
        .reduce((total, plano) => total + Number(plano.valorTaxas || 0), 0);
      const totalCupom = temPlanoAdquirido
        ? Math.max(0, subtotalPedido - Number(pedido.valorDescontoPlanoItens || 0)) +
          (pedido.taxaEntregaAbatidaPlano ? 0 : Number(pedido.valorTaxa || 0)) +
          Number(pedido.valorPlanosComprados || 0) - Number(pedido.valorDescontoManual || 0)
        : Number(pedido.valorTotalFinal ?? pedido.valorTotal ?? 0);
      const linhasFinanceiras = [
        temPlanoAdquirido ? ["PLANO ADQUIRIDO", valorBasePlanosComprados, false] : ["SUBTOTAL", subtotalPedido, false],
        temPlanoAdquirido && valorTaxasPlanosComprados > 0
          ? ["ENTREGA INCLUIDA NO PLANO", valorTaxasPlanosComprados, false]
          : !temPlanoAdquirido ? ["TAXA DE ENTREGA", Number(pedido.valorTaxa || 0), false] : null,
        Number(pedido.valorDescontoVoucher || 0) > 0 ? ["DESCONTO VOUCHER", Number(pedido.valorDescontoVoucher), true] : null,
        Number(pedido.valorDescontoManual || 0) > 0
          ? [`DESCONTO${pedido.motivoDescontoManual ? ` (${pedido.motivoDescontoManual})` : ""}`, Number(pedido.valorDescontoManual), true]
          : null,
        !temPlanoAdquirido && Number(pedido.valorDescontoPlanoItens || 0) > 0
          ? ["DESCONTO DO PLANO", Number(pedido.valorDescontoPlanoItens), true]
          : null,
      ].filter(Boolean) as Array<[string, number, boolean]>;
      const resumoFinanceiro = `${linhasFinanceiras.map(([label, valor, desconto]) =>
        `<div class="valor-linha"><span>${escaparHtml(label)}:</span><b>${desconto ? "- " : ""}${escaparHtml(moneyBr(valor))}</b></div>`,
      ).join("")}<div class="valor-linha valor-total"><span>TOTAL:</span><b>${escaparHtml(moneyBr(totalCupom))}</b></div>`;
      return `<section class="cupom">
        <header><strong>FIT GARDEN COMIDAS SAUDÁVEIS</strong><br>AV URUGUAI, 1020 - LONDRINA/PR<br>CNPJ: 37.864.396/0001-25<br>TEL: (43) 3324-4706 - WHATS: (43) 99696-1573<br>AGRADECEMOS SUA PREFERÊNCIA!<br>DATA: ${escaparHtml(formatDate(selectedDate))}</header>
        <div class="rota">${escaparHtml(rota)}</div>
        <h1>CONFERÊNCIA DO PEDIDO ${escaparHtml(pedido.numeroPedido)}</h1>
        ${observacao ? `<p><b>OBSERVAÇÃO:</b> ${escaparHtml(observacao)}</p>` : ""}
        ${itens}
        <h1>DADOS DO CLIENTE</h1>
        <p><b>CLIENTE:</b> ${escaparHtml(pedido.cliente.toUpperCase())}</p>
        <p><b>HORÁRIO ESTIMADO:</b> ${escaparHtml(`${getLabelTipoEntrega(pedido.tipoEntrega)} ${pedido.faixaHorario}`.toUpperCase())}</p>
        <p><b>${pedido.endereco ? "ENDEREÇO / TELEFONE" : "TELEFONE"}:</b> ${escaparHtml(pedido.endereco ? `${pedido.endereco} / ${pedido.telefone}` : pedido.telefone)}</p>
        <p><b>CONFERÊNCIA PAGAMENTO:</b> ${escaparHtml(getLabelPagamento(pedido.formaPagamento).toUpperCase())}</p>
        <div class="valores">${resumoFinanceiro}</div>
        <p><b>TAMANHO DAS MARMITAS (G):</b> ${escaparHtml(tamanhos)}</p>
      </section>`;
    }).join("");
    janela.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Cupons Fit Garden</title><style>
      @page { size: 80mm auto; margin: 3mm; } * { box-sizing: border-box; }
      body { margin: 0; color: #000; font-family: Arial, sans-serif; font-size: 11px; }
      .cupom { width: 74mm; padding: 1mm 0 4mm; break-inside: avoid-page; page-break-inside: avoid; break-after: page; page-break-after: always; }
      header { text-align: center; line-height: 1.45; margin-bottom: 4mm; }
      .rota { text-align: center; font-size: 12px; font-weight: 700; margin-bottom: 2mm; }
      .subpedido { margin: 3mm 0; }
      .subpedido-titulo { border-bottom: 1px dashed #000; padding-bottom: 1.5mm; margin-bottom: 2mm; font-size: 12px; font-weight: 700; }
      .valores { margin: 2mm 0; padding: 1.5mm 0; border-top: 1px dashed #000; border-bottom: 1px dashed #000; }
      .valor-linha { display: flex; justify-content: space-between; gap: 3mm; margin: 1mm 0; }
      .valor-total { margin-top: 1.5mm; padding-top: 1.5mm; border-top: 1px solid #000; font-size: 13px; }
      h1 { margin: 3mm 0 2mm; padding: 1mm 0; text-align: center; font-size: 13px; border-top: 1px solid #000; border-bottom: 1px solid #000; }
      p { margin: 1.5mm 0; line-height: 1.35; } .item { margin: 1.8mm 0; font-size: 12px; line-height: 1.25; }
    </style></head><body>${cupons}<script>window.addEventListener('load',()=>setTimeout(()=>window.print(),150));<\/script></body></html>`);
    janela.document.close();
  };

  const handleEnviarConfirmacao = (agendamento: Agendamento) => {
    const url = getWhatsappUrl(agendamento.telefone, montarMensagemConfirmacao(agendamento));
    if (!url) {
      toast({
        title: "Telefone nao informado",
        description: "Cadastre um telefone para abrir a confirmacao no WhatsApp.",
        variant: "destructive",
      });
      return;
    }
    void copiarResumoPedido(agendamento);
    window.open(url, "_blank");
  };

  function getPrecoUnitPorQuantidade(tamanho: any, quantidade: number) {
    const qtd = Math.max(1, Number(quantidade || 1));
    if (qtd >= 40 && tamanho?.valor40 != null) return Number(tamanho.valor40 || 0);
    if (qtd >= 20 && tamanho?.valor20 != null) return Number(tamanho.valor20 || 0);
    if (qtd >= 10 && tamanho?.valor10 != null) return Number(tamanho.valor10 || 0);
    return Number(tamanho?.valorUnitario || 0);
  }

  function contarTrocasItem(it: any) {
    return [
      it.trocaCarboId ?? it.trocaCarbo?.id ?? it.trocaCarboNome,
      it.trocaProteinaId ?? it.trocaProteina?.id ?? it.trocaProteinaNome,
      (it.trocaLegumeId ?? it.trocaLegume?.id ?? it.trocaLegumeNome) && !it.zerarLegume
        ? it.trocaLegumeId ?? it.trocaLegume?.id ?? it.trocaLegumeNome
        : null,
    ].filter(Boolean).length;
  }

  function calcularValorPedidoAtual(itens: any[]) {
    const totalMarmitas = itens
      .filter((it) => it.tipoItem !== "SALGADO")
      .reduce((acc, it) => acc + Math.max(1, Number(it.quantidade || 1)), 0);
    const totalSalgados = itens
      .filter((it) => it.tipoItem === "SALGADO")
      .reduce((acc, it) => acc + Math.max(1, Number(it.quantidade || 1)), 0);
    const regraSalgado = regras
      .filter((r) => r.tipo === "VOLUME_SALGADOS" && totalSalgados >= Number(r.limite))
      .sort((a, b) => Number(b.limite) - Number(a.limite))[0];
    const precoSalgadoVolume = regraSalgado ? Number(regraSalgado.preco) : null;

    const valores = itens.map((it) => {
      const qtd = Math.max(1, Number(it.quantidade || 1));
      const adicionalTrocas = it.tipoItem === "PADRAO" ? contarTrocasItem(it) * 2 + (it.adicionarFeijao ? 2 : 0) + (it.adicionarPure ? 2 : 0) + (it.adicionarLegumes ? 2 : 0) + (it.adicionarArroz ? 2 : 0) : 0;
      if (it.usarPlano) return { tipoItem: it.tipoItem, valor: adicionalTrocas * qtd };

      if (it.tipoItem === "PADRAO") {
        const unitBase = getPrecoUnitPorQuantidade(it.tamanho, totalMarmitas || 1) || Number(it.valor || 0) / qtd;
        return {
          tipoItem: it.tipoItem,
          valor: (unitBase + adicionalTrocas) * qtd,
        };
      }

      if (it.tipoItem === "SALGADO") {
        const precoCadastro = it.salgado?.preco ?? salgados.find((s) => Number(s.id) === Number(it.salgadoId))?.preco;
        const unit = precoSalgadoVolume != null ? precoSalgadoVolume : Number(precoCadastro ?? 0);
        return { tipoItem: it.tipoItem, valor: unit * qtd };
      }

      if (it.tipoItem === "PERSONALIZADA") {
        const totalGramas =
          Number(it.carboGramas || 0) +
          Number(it.proteinaGramas || 0) +
          Number(it.legumeGramas || 0) +
          Number(it.feijaoGramas || 0) +
          Number(it.complementoGramas || 0);
        const proteinaGramas = Number(it.proteinaGramas || 0);
        const regrasProteina = regras
          .filter((r) => r.tipo === "PROTEINA")
          .sort((a, b) => Number(a.limite) - Number(b.limite));
        const regrasPeso = regras
          .filter((r) => r.tipo === "PESO_TOTAL")
          .sort((a, b) => Number(a.limite) - Number(b.limite));
        const precoFaixa = (faixas: typeof regrasProteina, valor: number) => {
          if (!faixas.length) return 0;
          return Number((faixas.find((r) => valor <= Number(r.limite)) || faixas[faixas.length - 1]).preco);
        };
        const tiposCount = [
          Number(it.carboGramas || 0) > 0,
          Number(it.proteinaGramas || 0) > 0,
          Number(it.legumeGramas || 0) > 0,
          Number(it.feijaoGramas || 0) > 0,
          Number(it.complementoGramas || 0) > 0,
        ].filter(Boolean).length;
        const regraAjuste = regras.find(
          (r) => r.tipo === "QUANTIDADE_INGREDIENTES" && Number(r.limite) === tiposCount,
        );
        const unit = Math.max(
          precoFaixa(regrasProteina, proteinaGramas),
          precoFaixa(regrasPeso, totalGramas),
        ) + Number(regraAjuste?.preco || 0);
        return {
          tipoItem: it.tipoItem,
          valor: (unit > 0 ? unit : Number(it.valor || 0) / qtd) * qtd,
        };
      }

      return { tipoItem: it.tipoItem, valor: Number(it.valor || 0) };
    });

    const totalBrutoMarmitas = valores
      .filter((it) => it.tipoItem !== "SALGADO")
      .reduce((acc, it) => acc + it.valor, 0);
    const totalBrutoSalgados = valores
      .filter((it) => it.tipoItem === "SALGADO")
      .reduce((acc, it) => acc + it.valor, 0);
    const regraVolume = regras
      .filter((r) => r.tipo === "VOLUME_TOTAL" && totalMarmitas >= Number(r.limite))
      .sort((a, b) => Number(b.limite) - Number(a.limite))[0];
    const descontoVolume = regraVolume ? totalBrutoMarmitas * (Number(regraVolume.preco) / 100) : 0;

    return Math.max(0, totalBrutoMarmitas - descontoVolume + totalBrutoSalgados);
  }

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
        const isSalgado = it.tipoItem === "SALGADO";
        const isCongelada = it.tipoItem === "CONGELADA";
        const isPersonalizada = it.tipoItem === "PERSONALIZADA";
        const trocas = [
          it.trocaCarbo?.nome ? `Troca Carbo: ${it.trocaCarbo.nome}` : null,
          it.trocaProteina?.nome ? `Troca Prot.: ${it.trocaProteina.nome}` : null,
          it.trocaLegume?.nome ? `Troca Leg.: ${it.trocaLegume.nome}` : null,
          it.zerarLegume ? "Sem Legumes" : null,
          it.adicionarFeijao ? "Com Feijão" : null,
          it.adicionarPure ? "Com Purê" : null,
          it.adicionarLegumes ? "Com legumes adicionais" : null,
        ].filter(Boolean).join(", ");

        return {
          id: String(it.id),
          groupId: String(it.grupoPedido || `item:${it.id}`),
          tipoItem: it.tipoItem,
          salgadoId: it.salgadoId != null ? String(it.salgadoId) : undefined,
          congeladaId: it.congeladaId != null ? String(it.congeladaId) : undefined,
          nome:
            it.congelada?.nome ??
            it.congeladaNome ??
            it.salgado?.nome ??
            (it.salgadoId != null
              ? salgados.find((s) => String(s.id) === String(it.salgadoId))?.nome
              : undefined) ??
            it.opcao?.nome ??
            (isPersonalizada ? "Personalizada" : undefined) ??
            (isCongelada ? "Congelada" : undefined) ??
            it.nome ??
            "-",
          tamanho: isCongelada
            ? it.congelada?.tamanhoGramas
              ? `${it.congelada.tamanhoGramas}g`
              : "Congelada"
            : isSalgado
            ? "Salgado"
            : isPersonalizada
            ? "Personalizado"
            : it.tamanho?.pesagemGramas
            ? `${it.tamanho.pesagemGramas}g`
            : (it.tamanhoLabel ?? "-"),
          quantidade: Number(it.quantidade ?? 0),
          valor: Number(it.valor ?? 0),
          usarPlano: it.usarPlano,
          destinatarioNome: it.destinatarioNome || "",
          observacaoItem: it.observacaoItem || "",
          carbo: it.carbo?.nome || it.carboNome || "",
          carboGramas: Number(it.carboGramas || 0),
          proteina: it.proteina?.nome || it.proteinaNome || "",
          proteinaGramas: Number(it.proteinaGramas || 0),
          legume: it.legume?.nome || it.legumeNome || "",
          legumeGramas: Number(it.legumeGramas || 0),
          feijao: it.feijao?.nome || it.feijaoNome || "",
          feijaoGramas: Number(it.feijaoGramas || 0),
          complemento: it.complemento?.nome || it.complementoNome || "",
          complementoGramas: Number(it.complementoGramas || 0),
          adicionarFeijao: !!it.adicionarFeijao,
          adicionarPure: !!it.adicionarPure,
          adicionarLegumes: !!it.adicionarLegumes,
          adicionarArroz: !!it.adicionarArroz,
          trocaCarbo: it.trocaCarbo?.nome || it.trocaCarboNome || "",
          trocaProteina: it.trocaProteina?.nome || it.trocaProteinaNome || "",
          trocaLegume: it.trocaLegume?.nome || it.trocaLegumeNome || "",
          zerarLegume: !!it.zerarLegume,
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

    // 1. Calcula desconto baseado nos itens marcados como plano
    const itens = row.pedido?.itens ?? row.itens ?? [];
    const valorPedidoCalculado = calcularValorPedidoAtual(itens);
    const valorPedido = Number(row.pedido?.valorPedido ?? row.valorPedido ?? valorPedidoCalculado);
    const valorTaxa = Number(row.pedido?.valorTaxa ?? row.valorTaxa ?? 0);
    const valorTotalOriginal = valorPedido + valorTaxa;
    const valorDescontoItens = itens
      .filter((it: any) => it.usarPlano)
      .reduce((acc: number, it: any) => {
        const valorItem = Number(it.valor || 0);
        if (it.tipoItem !== "PADRAO") return acc + valorItem;

        const quantidade = Math.max(1, Number(it.quantidade || 1));
        const quantidadeTrocas = [
          it.trocaCarboId || it.trocaCarbo?.id || it.trocaCarboNome,
          it.trocaProteinaId || it.trocaProteina?.id || it.trocaProteinaNome,
          !it.zerarLegume && (it.trocaLegumeId || it.trocaLegume?.id || it.trocaLegumeNome),
        ].filter(Boolean).length;
        const valorAdicionais = (quantidadeTrocas * 2 + (it.adicionarFeijao ? 2 : 0) + (it.adicionarPure ? 2 : 0) + (it.adicionarLegumes ? 2 : 0) + (it.adicionarArroz ? 2 : 0)) * quantidade;
        return acc + Math.max(0, valorItem - valorAdicionais);
      }, 0);

    // 2. Calcula desconto baseado em pagamentos registrados (backup/consistência)
    const pagamentos = row.pedido?.pagamentos ?? row.pagamentos ?? [];
    const formasSemCobranca = new Set(["TROCA", "BONIFICACAO"]);
    const isPagamentoCobrancaReal = (p: any) =>
      p.forma !== "PLANO" &&
      p.forma !== "VOUCHER" &&
      !formasSemCobranca.has(String(p.forma)) &&
      !p.voucherId &&
      Number(p.valor || 0) > 0;
    const valorPendentePagamentos = pagamentos
      .filter((p: any) => p.status === "PENDENTE" && isPagamentoCobrancaReal(p))
      .reduce((acc: number, p: any) => acc + Number(p.valor || 0), 0);
    const valorPlanoUnidadesRegistrado = pagamentos
      .filter(
        (p: any) =>
          p.forma === "PLANO" &&
          p.status === "CONFIRMADO" &&
          Number(p.consumoUnidades || 0) > 0,
      )
      .reduce((acc: number, p: any) => acc + Number(p.valor || 0), 0);
    const adicionaisConsumidosPlano = pagamentos
      .filter((pagamento: any) => pagamento.forma === "PLANO" && Number(pagamento.consumoAdicionais || 0) > 0)
      .reduce((total: number, pagamento: any) => total + Number(pagamento.consumoAdicionais || 0), 0);
    const valorPlanoAdicionaisRegistrado = adicionaisConsumidosPlano * 2;
    const pagamentosCompraPlanoAtuais = pagamentos.filter(
      (p: any) =>
        p.planoClienteId &&
        Number(p.consumoUnidades || 0) === 0 &&
        Number(p.consumoEntregas || 0) === 0 &&
        Number(p.consumoAdicionais || 0) === 0 &&
        Number(p.valor || 0) > 0,
    );
    const pagamentosCompraPlano = pagamentosCompraPlanoAtuais;
    const valorPlanosComprados = pagamentosCompraPlano
      .reduce((acc: number, p: any) => acc + Number(p.valor || 0), 0);
    const planosComprados = pagamentosCompraPlano.map((p: any) => ({
      id: Number(p.planoClienteId),
      nome: String(p.planoCliente?.plano?.nome || `Plano #${p.planoClienteId}`),
      valor: Number(p.valor || 0),
      valorPlano: Number(p.planoCliente?.plano?.valor || p.valor || 0),
      valorTaxas: Math.max(0, Number(p.valor || 0) - Number(p.planoCliente?.plano?.valor || p.valor || 0)),
      pago: p.status === "CONFIRMADO" || p.planoCliente?.pago === true,
    }));

    const planosClienteAtivos = row.pedido?.cliente?.planos ?? row.cliente?.planos ?? [];
    const planosCompradosNoPedido = pagamentosCompraPlano
      .map((pagamento: any) => pagamento.planoCliente)
      .filter(Boolean);
    const planosCliente = Array.from(
      new Map(
        [...planosClienteAtivos, ...planosCompradosNoPedido].map((plano: any) => [Number(plano.id), plano]),
      ).values(),
    );

    const valorPlanosNaoPagosCliente = planosCliente
      .filter((plano: any) => !plano.pago)
      .reduce((acc: number, plano: any) => {
        const valorPlano = Number(plano.plano?.valor || plano.valor || 0);
        const valorTaxas = Number(plano.valorTaxaEntrega || 0) * Number(plano.taxasEntregaCompradas || 0);
        return acc + valorPlano + valorTaxas;
      }, 0);

    const valorPlanosCompradosPendente = Math.max(
      pagamentosCompraPlano
        .filter((p: any) => p.status === "PENDENTE" || p.planoCliente?.pago === false)
        .reduce((acc: number, p: any) => acc + Number(p.valor || 0), 0),
      valorPlanosNaoPagosCliente,
    );

    const valorPlanoProporcional = valorPlanoUnidadesRegistrado > 0
      ? valorPlanoUnidadesRegistrado
      : valorDescontoItens;
    const valorPedidoProporcional = Math.max(
      0,
      valorPedido - valorDescontoItens + valorPlanoProporcional,
    );
    const valorDescontoVoucher = pagamentos
      .filter((p: any) => p.forma === "VOUCHER" && p.status === "CONFIRMADO")
      .reduce((acc: number, p: any) => acc + Number(p.valor || 0), 0);
    const formaTaxaVoucherAtual = row.pedido?.formaPagamentoTaxaVoucher ?? row.formaPagamentoTaxaVoucher ?? null;
    const taxaVoucherPaga = !!formaTaxaVoucherAtual && pagamentos.some(
      (p: any) => p.forma === formaTaxaVoucherAtual && p.status === "CONFIRMADO" && !p.voucherId,
    );
    const valorDescontoManual = Number(row.pedido?.valorDescontoManual ?? row.valorDescontoManual ?? 0);
    const motivoDescontoManual = row.pedido?.motivoDescontoManual ?? row.motivoDescontoManual ?? null;

    const taxaEntregaAbatidaPlano = pagamentos.some(
      (p: any) =>
        p.forma === "PLANO" &&
        p.status === "CONFIRMADO" &&
        Number(p.consumoEntregas || 0) > 0,
    );

    // O registro financeiro guarda o custo histórico da unidade do plano. Para o
    // total devido, porém, um item consumido cobre integralmente seu valor atual.
    const temItensMarcadosComoPlano = itens.some((it: any) => !!it.usarPlano);
    const valorItensCobertosPlano = temItensMarcadosComoPlano
      ? valorDescontoItens
      : valorPlanoUnidadesRegistrado;
    const valorEntregaCobertaPlano = taxaEntregaAbatidaPlano ? valorTaxa : 0;
    const valorDescontos = valorItensCobertosPlano + valorEntregaCobertaPlano + valorPlanoAdicionaisRegistrado;

    // O backend já reconcilia o pagamento pendente ao editar o pedido. Esse é o
    // valor efetivamente devido e precisa prevalecer, inclusive quando for zero.
    const valorTotalFinalApi = row.pedido?.valorTotalFinal ?? row.valorTotalFinal;
    const temValorTotalFinalApi =
      valorTotalFinalApi !== null &&
      valorTotalFinalApi !== undefined &&
      Number.isFinite(Number(valorTotalFinalApi));
    const temPagamentoPendente = pagamentos.some((p: any) => p.status === "PENDENTE" && isPagamentoCobrancaReal(p));
    const valorTotalPelaCoberturaAtual = Math.max(
      0,
      valorTotalOriginal - valorDescontos - valorDescontoVoucher - valorDescontoManual,
    );
    const usouPlano =
      itens.some((it: any) => !!it.usarPlano) ||
      pagamentos.some((p: any) => p.forma === "PLANO");
    const candidatosTotal = [
      ...(temValorTotalFinalApi ? [Number(valorTotalFinalApi)] : []),
      ...(temPagamentoPendente ? [valorPendentePagamentos] : []),
      valorTotalPelaCoberturaAtual,
    ];
    const valorTotalFinal = usouPlano
      ? valorTotalPelaCoberturaAtual + valorPlanosCompradosPendente
      : Math.max(0, Math.min(...candidatosTotal) + valorPlanosCompradosPendente);
    const saldosPorTamanho = new Map<string, number>();
    planosCliente.forEach((plano: any) => {
      (plano.itens || []).forEach((saldo: any) => {
        const gramas = saldo.planoItem?.tamanho?.pesagemGramas ?? saldo.planoItem?.pesoPersonalizadoGramas;
        if (!gramas || Number(saldo.saldoUnidades || 0) <= 0) return;
        const tamanho = `${gramas}g`;
        saldosPorTamanho.set(tamanho, (saldosPorTamanho.get(tamanho) || 0) + Number(saldo.saldoUnidades || 0));
      });
    });
    const planosAtivos = Array.from(saldosPorTamanho.entries())
      .map(([tamanho, saldo]) => ({ tamanho, saldo }))
      .sort((a, b) => Number(a.tamanho.replace(/\D/g, "")) - Number(b.tamanho.replace(/\D/g, "")));
    const saldoTaxasEntrega = planosCliente.reduce(
      (total: number, plano: any) => total + Math.max(0, Number(plano.saldoEntregas || 0)),
      0,
    );
    const saldoAdicionaisPlano = planosCliente.reduce(
      (total: number, plano: any) => total + Math.max(0, Number(plano.saldoAdicionais || 0)),
      0,
    );
    const saldoMarmitasAposPedido = usouPlano
      ? planosCliente.length > 0
        ? planosCliente.reduce((acc: number, plano: any) => acc + Number(plano.saldoUnidades || 0), 0)
        : pagamentos
          .filter((p: any) => p.forma === "PLANO" && p.planoCliente)
          .reduce((acc: number, p: any) => acc + Number(p.planoCliente.saldoUnidades || 0), 0)
      : null;
    const pagamentoNaoPlanoRelevante = pagamentos.find(
      (p: any) => isPagamentoCobrancaReal(p) || (p.status === "CONFIRMADO" && p.forma !== "A_DEFINIR" && isPagamentoCobrancaReal(p)),
    );
    const formaFallback = row.formaPagamento && row.formaPagamento !== "-" ? row.formaPagamento : "A_DEFINIR";
    const formaPagamentoExibida =
      valorDescontoVoucher > 0
        ? "VOUCHER"
        : pagamentoNaoPlanoRelevante?.forma
        ? pagamentoNaoPlanoRelevante.forma
        : valorPlanosCompradosPendente > 0
        ? pagamentosCompraPlano.find((pagamento: any) => pagamento.status === "PENDENTE")?.forma || "PLANO"
        : usouPlano && valorTotalFinal <= 0
        ? "PLANO"
        : pagamentos.find((p: any) => p.forma === "PLANO")?.forma ??
          formaFallback;

    return {
      id: String(row.id),
      numeroPedido,
      cliente: row.pedido?.cliente?.nome ?? row.cliente?.nome ?? "-",
      telefone: row.pedido?.cliente?.telefone ?? row.cliente?.telefone ?? "-",
      tipoEntrega: row.pedido?.tipo ?? row.tipo ?? "ENTREGA",
      data: row.data ?? null,
      dataEntregaCongelada: row.dataEntregaCongelada ?? null,
      congelarSubtipo: row.congelarSubtipo ?? null,
      faixaHorario: row.faixaHorario,
      endereco: row.endereco ?? "-",
      zona: zonaMap[row.regiao] ?? "CENTRO",
      quantidade,
      quantidadeLabel,
      formaPagamento: formaPagamentoExibida,
      formaPagamentoTaxaVoucher: row.pedido?.formaPagamentoTaxaVoucher ?? row.formaPagamentoTaxaVoucher ?? null,
      taxaVoucherPaga,
      voucherCodigo:
        pagamentos.find((p: any) => String(p.voucherCodigo || "").trim())?.voucherCodigo ??
        row.voucherCodigo ??
        undefined,
      entregador: row.entregador ?? "-",
      valorPedido,
      valorPedidoProporcional,
      valorTaxa,
      cobrarTaxaEntrega: row.pedido?.cobrarTaxaEntrega ?? row.cobrarTaxaEntrega ?? valorTaxa > 0,
      valorTotal: valorTotalOriginal,
      valorDescontos,
      valorDescontoPlanoItens: valorItensCobertosPlano,
      valorDescontoVoucher,
      valorDescontoManual,
      motivoDescontoManual,
      valorTotalFinal,
      valorPlanosComprados,
      valorPlanosCompradosPendente,
      planosComprados,
      taxaEntregaAbatidaPlano,
      usouPlano,
      saldoMarmitasAposPedido,
      planosAtivos,
      saldoTaxasEntrega,
      adicionaisConsumidosPlano,
      saldoAdicionaisPlano,
      observacoes: row.pedido?.observacoes ?? row.observacoes ?? undefined,
      precisaTroco: !!(row.pedido?.precisaTroco ?? row.precisaTroco),
      trocoPara: row.pedido?.trocoPara != null ? Number(row.pedido.trocoPara) : row.trocoPara != null ? Number(row.trocoPara) : null,
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
    loadPlanosNaoPagos();
  }, [selectedDate, getAgendamentos, utils, regras, salgados]);

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
    const senhaExclusao = window.prompt("Informe a senha para excluir este pedido:") || "";
    if (!senhaExclusao.trim()) return;
    await deleteAgendamento(Number(id), senhaExclusao);

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
  const formatKg = (value: number) => Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });


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
    categoria: o.categoria ?? null,
    preparos: o.preparos ?? [],
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
  const feijoes = preparos.map((preparo) => ({ ...preparo, categoria: preparo.tipo }))
    .filter((o: any) => {
      const categoria = (o.categoria ?? "").toUpperCase();
      return categoria === "FEIJAO" || categoria === "FEIJÃO";
    })
    .map((o: any) => ({
      id: String(o.id),
      nome: o.nome,
      tipo: "FEIJAO" as const,
    }));
  const complementos = preparos
    .filter((p) => p.tipo === "COMPLEMENTO")
    .map((p) => ({
      id: String(p.id),
      nome: p.nome,
      tipo: "COMPLEMENTO" as const,
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
        searchValue={buscaAgendamento}
        onSearchChange={setBuscaAgendamento}
      />

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-50 p-2 rounded-lg">
            <CalendarIcon className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 leading-tight">{formatDate(selectedDate)}</h2>
            <p className="text-xs text-slate-500 font-medium">{agendamentos.length} agendamentos programados</p>
            <p className="text-xs text-slate-500 font-medium">{totalMarmitasAgendadas} marmitas agendadas</p>
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
                  downloadPedidosDocx({
                    data: dateISO,
                    valoresExibidos: Object.fromEntries(agendamentos.map((agendamento) => [
                      String(agendamento.pedidoId || agendamento.id),
                      {
                        valorTotalFinal: Number(agendamento.valorTotalFinal ?? agendamento.valorTotal ?? 0),
                        formaPagamento: String(agendamento.formaPagamento || "-"),
                      },
                    ])),
                  });
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
                onClick={() => {
                  const dateISO = utils.toISODateOnly(selectedDate);
                  downloadPedidosCozinhaDocx({ data: dateISO });
                }}
                disabled={downloadingPedidos}
              >
                <FileText className="h-4 w-4 text-emerald-600" />
                <div className="flex flex-col">
                  <span className="font-medium text-sm">Relatório da Cozinha</span>
                  <span className="text-[10px] text-slate-500">Versão compacta para montagem</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="rounded-lg cursor-pointer gap-2 py-2.5"
                onClick={async () => {
                  const dateISO = utils.toISODateOnly(selectedDate);
                  const ok = await abrirCupomElgin({ data: dateISO, formato: "a4" });
                  if (!ok) toast({ title: "Falha ao abrir cupom Elgin", variant: "destructive" });
                }}
                disabled={downloadingMontadoresRotas}
              >
                <FileDown className="h-4 w-4 text-emerald-600" />
                <div className="flex flex-col">
                  <span className="font-medium text-sm">Rotas de Montagem — A4</span>
                  <span className="text-[10px] text-slate-500">Layout horizontal atual</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="rounded-lg cursor-pointer gap-2 py-2.5"
                onClick={async () => {
                  const dateISO = utils.toISODateOnly(selectedDate);
                  const ok = await abrirCupomElgin({ data: dateISO, formato: "bobina" });
                  if (!ok) toast({ title: "Falha ao abrir impressão em bobina", variant: "destructive" });
                }}
                disabled={downloadingMontadoresRotas}
              >
                <Printer className="h-4 w-4 text-emerald-600" />
                <div className="flex flex-col">
                  <span className="font-medium text-sm">Rotas de Montagem — Bobina</span>
                  <span className="text-[10px] text-slate-500">Layout vertical para impressora Elgin</span>
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

        <Tabs defaultValue="agendamentos" className="min-w-0">
          <TabsList className="hidden">
            <TabsTrigger value="agendamentos">Agendamentos ({agendamentos.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="agendamentos" className="mt-0">
        <Card className="shadow-sm border-slate-100 overflow-hidden">
          <CardHeader className="bg-slate-50/50 py-4 px-6 border-b border-slate-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg font-bold text-slate-700 flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Agendamentos para {formatDate(selectedDate)}
            </CardTitle>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={buscaAgendamento}
                  onChange={(event) => setBuscaAgendamento(event.target.value)}
                  placeholder="Cliente, telefone, nº ou rua"
                  className="h-9 bg-white pl-9"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={agendamentosPorRota.length === 0}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimir por rota
                    <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl p-2">
                  {agendamentosPorRota.map((grupo) => (
                    <DropdownMenuItem
                      key={grupo.id}
                      className="cursor-pointer rounded-lg py-2.5"
                      onClick={() => abrirImpressaoPedidos(grupo.agendamentos)}
                    >
                      <Printer className="mr-2 h-4 w-4 text-slate-500" />
                      <div className="flex flex-1 items-center justify-between gap-3">
                        <span className="font-medium">{grupo.label}</span>
                        <span className="text-right text-xs text-slate-400">
                          <span className="block">{grupo.agendamentos.length} pedido{grupo.agendamentos.length === 1 ? "" : "s"}</span>
                          <span className="block">{grupo.totalMarmitas} marmita{grupo.totalMarmitas === 1 ? "" : "s"}</span>
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Badge variant="secondary" className="bg-white border-slate-200 text-slate-600 font-bold px-3">
                {agendamentos.length} pedidos
              </Badge>
              <Badge variant="secondary" className="bg-white border-slate-200 text-slate-600 font-bold px-3">
                {totalMarmitasAgendadas} marmitas
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-320px)]">
              <div className="p-6 space-y-4">
                {agendamentosFiltrados.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <CheckCircle2 className="h-12 w-12 mb-4 opacity-20" />
                    <p className="font-medium">{buscaAgendamento ? "Nenhum agendamento encontrado" : "Nenhum agendamento para hoje"}</p>
                    <p className="text-sm">{buscaAgendamento ? "Tente buscar por outro nome, telefone, número ou endereço" : "Os pedidos aparecerão aqui conforme forem agendados"}</p>
                  </div>
                ) : (
                  agendamentosPorRota.map((grupo) => (
                    <section key={grupo.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: grupo.color }} />
                          <h3 className="text-sm font-black uppercase tracking-widest text-slate-600">{grupo.label}</h3>
                          <span className="text-xs text-slate-400">{grupo.intervalo}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-slate-200 text-slate-500">
                            {grupo.agendamentos.length} pedido{grupo.agendamentos.length === 1 ? "" : "s"}
                          </Badge>
                          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                            {grupo.totalMarmitas} marmita{grupo.totalMarmitas === 1 ? "" : "s"}
                          </Badge>
                        </div>
                      </div>

                      {grupo.agendamentos.map((agendamento) => (
                        <div
                          key={agendamento.id}
                          className={`group relative bg-white border border-l-4 rounded-2xl overflow-hidden cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all duration-200 ${
                            agendamento.tipoEntrega === "NAO_DEFINIR" || agendamento.formaPagamento === "A_DEFINIR"
                              ? "border-red-300 bg-red-50/80"
                              : "border-slate-200"
                          }`}
                          style={{ borderLeftColor: grupo.color }}
                          onClick={() => handleShowDetalhes(agendamento)}
                        >
                          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{agendamento.numeroPedido}</span>
                                <h3 className="text-base font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                                  {agendamento.cliente}
                                  {agendamento.telefone && agendamento.telefone !== "-" ? ` - ${agendamento.telefone}` : ""}
                                </h3>
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
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                title="Copiar resumo do pedido"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void copiarResumoPedido(agendamento);
                                }}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 border-slate-200 text-slate-700 hover:bg-slate-50"
                                title="Imprimir cupom"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  abrirImpressaoPedidos([agendamento]);
                                }}
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                              <Badge
                                variant={agendamento.tipoEntrega === "ENTREGA" ? "default" : "outline"}
                                className={
                                  agendamento.tipoEntrega === "NAO_DEFINIR"
                                    ? "border-red-300 bg-red-100 text-red-700 hover:bg-red-100"
                                    : agendamento.tipoEntrega === "ENTREGA"
                                      ? "bg-slate-800 text-white"
                                      : "border-slate-200 text-slate-600"
                                }
                              >
                                {getLabelTipoEntrega(agendamento.tipoEntrega)}
                              </Badge>

                              <div className="flex flex-col items-end">
                                <div className={`flex items-center text-xs font-bold gap-1 ${
                                  agendamento.formaPagamento === "A_DEFINIR" ? "text-red-700" : "text-slate-700"
                                }`}>
                                  <Wallet className="h-3 w-3 text-slate-400" />
                                  {getLabelPagamento(agendamento.formaPagamento, agendamento)}
                                </div>
                                {(agendamento.valorTotalFinal ?? 0) > 0 && (
                                  <span className="text-sm font-black text-emerald-700">R$ {(agendamento.valorTotalFinal ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </section>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="planos" className="mt-0">
            <Card className="shadow-sm border-slate-100 overflow-hidden">
              <CardHeader className="bg-slate-50/50 py-4 px-6 border-b border-slate-100 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold text-slate-700 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Planos contratados em {formatDate(selectedDate)}
                </CardTitle>
                <Badge variant="secondary" className="bg-white border-slate-200 text-slate-600 font-bold px-3">
                  {planosNaoPagosDoDia.length} pendente{planosNaoPagosDoDia.length === 1 ? "" : "s"}
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-320px)]">
                  <div className="p-6 space-y-3">
                    {loadingPlanosNaoPagos ? (
                      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <p className="font-medium">Carregando planos...</p>
                      </div>
                    ) : planosNaoPagosDoDia.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <CheckCircle2 className="h-12 w-12 mb-4 opacity-20" />
                        <p className="font-medium">Nenhum plano pendente nesse dia</p>
                        <p className="text-sm">Planos contratados e ainda não pagos aparecerão aqui.</p>
                      </div>
                    ) : (
                      planosNaoPagosDoDia.map((plano) => {
                        const nomePlano = plano.plano?.nome || "Plano";
                        const gramas = plano.plano?.tamanho?.pesagemGramas ? ` - ${plano.plano.tamanho.pesagemGramas}g` : "";
                        const telefone = plano.cliente?.telefone || "";
                        const qtdTaxas = Number(plano.taxasEntregaCompradas || 0);
                        const valorTaxaUnit = Number(plano.valorTaxaEntrega || 0);
                        const valorTaxas = qtdTaxas * valorTaxaUnit;
                        const valorPlano = Number(plano.plano?.valor || 0);
                        const valorTotal = valorPlano + valorTaxas;
                        const primeiroNome = String(plano.cliente?.nome || "").split(" ")[0] || "cliente";
                        const msgCobranca = `Olá ${primeiroNome}! Tudo bem? O pagamento do seu plano ${nomePlano}${gramas}${valorTotal > 0 ? ` no valor de ${moneyBr(valorTotal)}` : ""} ainda não foi identificado. Assim que realizar o pagamento, por favor envie o comprovante por aqui. Obrigado(a)!`;
                        const whatsappUrl = getWhatsappUrl(telefone, msgCobranca);

                        return (
                          <div
                            key={plano.id}
                            className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 sm:p-5 shadow-sm"
                          >
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0 space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-black uppercase tracking-widest text-amber-700">Plano pendente</span>
                                  <Badge variant="outline" className="border-amber-300 bg-white text-amber-700">
                                    {plano.createdAt ? new Date(plano.createdAt).toLocaleDateString("pt-BR") : ""}
                                  </Badge>
                                </div>
                                <div>
                                  <h3 className="text-base font-bold text-slate-800">{plano.cliente?.nome || "Cliente"}</h3>
                                  <p className="text-sm text-slate-600">{nomePlano}{gramas}</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                                  <span>{telefone || "Sem telefone"}</span>
                                  <span>{Number(plano.plano?.unidades || 0)} unidades</span>
                                  {qtdTaxas > 0 && <span>{qtdTaxas} taxa{qtdTaxas === 1 ? "" : "s"} de entrega</span>}
                                </div>
                              </div>

                              <div className="flex flex-col items-stretch gap-2 sm:items-end">
                                {valorTotal > 0 && (
                                  <span className="text-right text-lg font-black text-emerald-700">{moneyBr(valorTotal)}</span>
                                )}
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={!whatsappUrl}
                                    onClick={() => whatsappUrl && window.open(whatsappUrl, "_blank")}
                                  >
                                    <MessageCircle className="mr-2 h-4 w-4" />
                                    Cobrar
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    disabled={savingPlanoCliente}
                                    onClick={async () => {
                                      await marcarPlanoComoPago(plano.id);
                                      await loadPlanosNaoPagos();
                                    }}
                                  >
                                    <Check className="mr-2 h-4 w-4" />
                                    Marcar pago
                                  </Button>
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
          </TabsContent>
        </Tabs>
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
                {getLabelTipoEntrega(agendamentoSelecionado?.tipoEntrega || "")}
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
                      <Badge
                        variant="outline"
                        className={
                          agendamentoSelecionado?.formaPagamento === "A_DEFINIR"
                            ? "border-red-300 bg-red-50 font-semibold text-red-700"
                            : "font-semibold text-slate-700"
                        }
                      >
                        {getLabelPagamento(agendamentoSelecionado?.formaPagamento || "", agendamentoSelecionado)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm text-slate-600">Subtotal</span>
                      <span className="text-sm font-medium">R$ {Math.max(Number(agendamentoSelecionado?.valorPedido || 0), Number(agendamentoSelecionado?.valorDescontoPlanoItens || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-100 pb-3">
                      <span className="text-sm text-slate-600">Entrega</span>
                      <span className="text-sm font-medium">
                         {agendamentoSelecionado?.tipoEntrega === "ENTREGA"
                          ? agendamentoSelecionado?.taxaEntregaAbatidaPlano
                            ? `R$ ${(agendamentoSelecionado?.valorTaxa ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (abatida pelo plano)`
                            : `R$ ${(agendamentoSelecionado?.valorTaxa ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : "Grátis"}
                      </span>
                    </div>
                    {agendamentoSelecionado?.valorPlanosComprados && agendamentoSelecionado.valorPlanosComprados > 0 ? (
                      <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-100 pb-3">
                        <span className="text-sm font-medium text-slate-700">Plano adquirido</span>
                        <span className="text-sm font-bold text-slate-900">
                          R$ {agendamentoSelecionado.valorPlanosComprados.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ) : null}
                    {agendamentoSelecionado?.valorDescontoPlanoItens && agendamentoSelecionado.valorDescontoPlanoItens > 0 ? (
                      <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-100 pb-3">
                        <span className="text-sm text-emerald-600 font-medium">Desconto Plano (marmitas)</span>
                        <span className="text-sm font-bold text-emerald-600">- R$ {agendamentoSelecionado.valorDescontoPlanoItens.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    ) : null}
                    {Number(agendamentoSelecionado?.adicionaisConsumidosPlano || 0) > 0 ? (
                      <div className="flex justify-between items-center py-1 border-b border-dashed border-blue-100 pb-3">
                        <span className="text-sm text-blue-700 font-medium">
                          Adicionais usados do plano ({agendamentoSelecionado?.adicionaisConsumidosPlano})
                        </span>
                        <span className="text-sm font-bold text-blue-700">
                          - R$ {(Number(agendamentoSelecionado?.adicionaisConsumidosPlano || 0) * 2).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ) : null}
                    {agendamentoSelecionado?.valorDescontoManual && agendamentoSelecionado.valorDescontoManual > 0 ? (
                      <div className="flex justify-between items-center gap-3 py-1 border-b border-dashed border-amber-100 pb-3">
                        <span className="text-sm text-amber-700 font-medium">
                          Desconto{agendamentoSelecionado.motivoDescontoManual ? ` (${agendamentoSelecionado.motivoDescontoManual})` : ""}
                        </span>
                        <span className="shrink-0 text-sm font-bold text-amber-700">
                          - R$ {agendamentoSelecionado.valorDescontoManual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ) : null}
                    {agendamentoSelecionado?.usouPlano && agendamentoSelecionado.saldoMarmitasAposPedido != null ? (
                      <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-100 pb-3">
                        <span className="text-sm text-slate-600">Marmitas após pedido</span>
                        <span className="text-sm font-bold text-slate-800">{agendamentoSelecionado.saldoMarmitasAposPedido}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-base font-bold text-slate-800">Total a Pagar</span>
                      <span className="text-xl font-black text-emerald-700">
                        R$ {(agendamentoSelecionado?.valorTotalFinal ?? agendamentoSelecionado?.valorTotal ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    {agendamentoSelecionado?.formaPagamento === "DINHEIRO" && (
                      <div className="flex justify-between items-center border-t border-dashed border-slate-100 pt-3">
                        <span className="text-sm text-slate-600">Troco</span>
                        <span className="text-sm font-bold text-slate-800">
                          {agendamentoSelecionado.precisaTroco && Number(agendamentoSelecionado.trocoPara || 0) > 0
                            ? `Para ${moneyBr(Number(agendamentoSelecionado.trocoPara))}`
                            : "Não precisa"}
                        </span>
                      </div>
                    )}
                  </div>
                </section>

                {agendamentoSelecionado?.observacoes && (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-xs font-bold text-amber-800 uppercase mb-1">Comentário interno</p>
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
                        
                        {((item.carbo && (item.tipoItem !== "PERSONALIZADA" || Number(item.carboGramas || 0) > 0)) ||
                          (item.proteina && (item.tipoItem !== "PERSONALIZADA" || Number(item.proteinaGramas || 0) > 0)) ||
                          (item.legume && (item.tipoItem !== "PERSONALIZADA" || Number(item.legumeGramas || 0) > 0)) ||
                          (item.feijao && (item.tipoItem !== "PERSONALIZADA" || Number(item.feijaoGramas || 0) > 0)) ||
                          (item.complemento && (item.tipoItem !== "PERSONALIZADA" || Number(item.complementoGramas || 0) > 0))) && (
                          <div className="bg-slate-50 p-2 rounded-lg grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                            {item.carbo && (item.tipoItem !== "PERSONALIZADA" || Number(item.carboGramas || 0) > 0) && (
                              <div className="text-slate-500">• {formatIngrediente(item.carbo, item.carboGramas, item.tipoItem === "PERSONALIZADA")}</div>
                            )}
                            {item.proteina && (item.tipoItem !== "PERSONALIZADA" || Number(item.proteinaGramas || 0) > 0) && (
                              <div className="text-slate-500">• {formatIngrediente(item.proteina, item.proteinaGramas, item.tipoItem === "PERSONALIZADA")}</div>
                            )}
                            {item.legume && (item.tipoItem !== "PERSONALIZADA" || Number(item.legumeGramas || 0) > 0) && (
                              <div className="text-slate-500">• {formatIngrediente(item.legume, item.legumeGramas, item.tipoItem === "PERSONALIZADA")}</div>
                            )}
                            {item.feijao && (item.tipoItem !== "PERSONALIZADA" || Number(item.feijaoGramas || 0) > 0) && (
                              <div className="text-slate-500">• {formatIngrediente(item.feijao, item.feijaoGramas, item.tipoItem === "PERSONALIZADA")}</div>
                            )}
                            {item.complemento && (item.tipoItem !== "PERSONALIZADA" || Number(item.complementoGramas || 0) > 0) && (
                              <div className="text-slate-500">• {formatIngrediente(item.complemento, item.complementoGramas, item.tipoItem === "PERSONALIZADA")}</div>
                            )}
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
              <Button
                variant="outline"
                className="rounded-xl px-4 border-amber-200 text-amber-700 hover:bg-amber-50"
                onClick={async () => {
                  if (!agendamentoSelecionado) return;
                  const comentario = window.prompt("Comentário interno do pedido:", agendamentoSelecionado.observacoes || "");
                  if (comentario === null) return;
                  try {
                    const agendamentoId = Number(agendamentoSelecionado._raw?.agendamentoId ?? agendamentoSelecionado.id);
                    await apiFetch(`/agendamentos/${agendamentoId}/comentario`, {
                      method: "PATCH",
                      body: JSON.stringify({ observacoes: comentario }),
                    });
                    const observacoes = comentario.trim() || undefined;
                    setAgendamentos((atuais) => atuais.map((item) => item.id === agendamentoSelecionado.id ? { ...item, observacoes } : item));
                    setAgendamentoSelecionado((atual) => atual ? { ...atual, observacoes } : atual);
                    toast({ title: "Comentário salvo" });
                  } catch (erro: any) {
                    toast({ title: "Não foi possível salvar", description: erro?.message, variant: "destructive" });
                  }
                }}
              >
                <MessageCircle className="mr-2 h-4 w-4" /> Comentário interno
              </Button>
              <Button
                variant="outline"
                className="rounded-xl px-6 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                onClick={() => agendamentoSelecionado && handleEnviarConfirmacao(agendamentoSelecionado)}
              >
                <Send className="mr-2 h-4 w-4" /> Enviar confirmação
              </Button>
              <Button variant="outline" className="rounded-xl px-6" onClick={() => setDetalhesDialogOpen(false)}>
                Fechar
              </Button>
              <Button
                className="bg-emerald-700 hover:bg-emerald-800 rounded-xl px-8 shadow-lg shadow-emerald-100"
                onClick={async () => {
                  if (!agendamentoSelecionado) return;
                  try {
                    const agendamentoId = Number(
                      agendamentoSelecionado._raw?.agendamentoId ?? agendamentoSelecionado.id,
                    );
                    const agendamentoCompleto = await getAgendamentoById<any>(agendamentoId);
                    setModoEdicao(true);
                    setAgendamentoEditandoId(agendamentoId);
                    setDadosEdicao(
                      montarDadosEdicaoAgendamento({
                        ...agendamentoSelecionado,
                        _raw: agendamentoCompleto || agendamentoSelecionado._raw,
                      }),
                    );
                    setDetalhesDialogOpen(false);
                    setCadastroOpen(true);
                  } catch (erro: any) {
                    toast({
                      title: "Não foi possível abrir a edição",
                      description: erro?.message || "Falha ao carregar os dados completos do pedido.",
                      variant: "destructive",
                    });
                  }
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
                                  {formatKg(Number(row.kgPronto ?? 0))} kg
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow>
                              <TableCell className="font-bold text-slate-800">TOTAL</TableCell>
                              <TableCell className="text-right font-black text-slate-800">
                                {formatKg(relatorioPreparos!.prontos.reduce((acc, r) => acc + Number(r.kgPronto ?? 0), 0))} kg
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
                                  {formatKg(Number(row.kgCru ?? 0))} kg
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow>
                              <TableCell className="font-bold text-slate-800">TOTAL</TableCell>
                              <TableCell className="text-right font-black text-slate-800">
                                {formatKg(relatorioPreparos!.crus.reduce((acc, r) => acc + Number(r.kgCru ?? 0), 0))} kg
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
        modoOrcamento={modoOrcamento}
        open={cadastroOpen}
        onOpenChange={(open) => {
          setCadastroOpen(open);

          if (!open) {
            if (modoOrcamento) {
              setModoOrcamento(false);
              window.history.replaceState({}, "", "/agendamentos");
            }
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
            valorTaxaEntregaManual: c.valorTaxaEntregaManual,
            enderecoPrincipal: enderecoTexto,
            enderecos: c.enderecos,
            tags: c.tags,
            planos: c.planos || [],
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
        complementos={complementos}
        salgados={salgados.map((s) => ({
          id: String(s.id),
          nome: s.nome,
          preco: Number(s.preco || 0),
        }))}
        congeladas={congeladas.map((c) => ({
          id: String(c.id),
          nome: c.nome,
          tamanhoGramas: c.tamanhoGramas,
          quantidade: Number(c.quantidade || 0),
        }))}
        initialData={dadosEdicao}
        savingCliente={savingClientes}
        onCreateCliente={createCliente}
        onUpdateCliente={updateCliente}
        onSubmit={async (payload) => {
          if (modoOrcamento) {
            const resumo = payload.orcamentoResumo || {};
            const dinheiro = (valor: number) => Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
            const linhasItens = (resumo.itens || []).map((item: any) =>
              `• ${item.quantidade}x ${item.nome}${item.detalhe ? ` — ${item.detalhe}` : ""}: ${dinheiro(item.valor)}`,
            );
            const mensagem = [
              `Olá, ${String(resumo.clienteNome || "cliente").split(" ")[0]}! Segue o orçamento solicitado:`,
              "",
              ...linhasItens,
              "",
              `Subtotal: ${dinheiro(resumo.subtotal)}`,
              Number(resumo.taxaEntrega || 0) > 0 ? `Taxa de entrega: ${dinheiro(resumo.taxaEntrega)}` : null,
              Number(resumo.desconto || 0) > 0 ? `Desconto: - ${dinheiro(resumo.desconto)}` : null,
              `*Total: ${dinheiro(resumo.total)}*`,
              "",
              "Este orçamento não reserva data nem estoque. Para confirmar, responda esta mensagem.",
            ].filter((linha): linha is string => linha !== null).join("\n");
            await navigator.clipboard.writeText(mensagem);
            toast({ title: "Orçamento copiado", description: "A mensagem está pronta para enviar ao cliente." });
            setModoOrcamento(false);
            window.history.replaceState({}, "", "/agendamentos");
            return;
          }
          let pedidoCriadoId: number | null = null;
          let agendamentoCriadoId: number | null = null;
          let agendamentoAtualizadoApi: any = null;
          if (modoEdicao && agendamentoEditandoId) {
            agendamentoAtualizadoApi = await updateAgendamento(agendamentoEditandoId, {
              planosCompradosIds: payload.planosCompradosIds,
              tipo: payload.tipo,
              data: payload.data,
              dataEntregaCongelada: payload.dataEntregaCongelada,
              congelarSubtipo: payload.congelarSubtipo,
              faixaHorario: payload.faixaHorario,
              endereco: payload.endereco,
              entregaLatitude: payload.entregaLatitude,
              entregaLongitude: payload.entregaLongitude,
              observacoes: payload.observacoes ?? null,
              precisaTroco: payload.precisaTroco,
              trocoPara: payload.trocoPara,
              formaPagamento: payload.formaPagamento,
              voucherCodigo: payload.voucherCodigo,
              formaPagamentoTaxaVoucher: payload.formaPagamentoTaxaVoucher,
              pagamentoJaRealizado: payload.pagamentoJaRealizado,
              valorDescontoManual: payload.valorDescontoManual,
              motivoDescontoManual: payload.motivoDescontoManual,
              senhaAutorizacao: payload.senhaAutorizacao,
              cobrarTaxaEntrega: payload.cobrarTaxaEntrega,
              abaterTaxaEntregaPlano: payload.abaterTaxaEntregaPlano,
              itens: payload.itens.map((it: any) => ({
                tipoItem: it.tipoItem,
                destinatarioNome: it.destinatarioNome,
                grupoPedido: it.grupoPedido,
                tamanhoId: it.tamanhoId ? Number(it.tamanhoId) : null,
                salgadoId: it.salgadoId ? Number(it.salgadoId) : null,
                congeladaId: it.congeladaId ? Number(it.congeladaId) : null,
                quantidade: Number(it.quantidade),

                opcaoId: it.opcaoId ? Number(it.opcaoId) : null,
                carboId: it.carboId ? Number(it.carboId) : null,
                proteinaId: it.proteinaId ? Number(it.proteinaId) : null,
                legumeId: it.legumeId ? Number(it.legumeId) : null,
                feijaoId: it.feijaoId ? Number(it.feijaoId) : null,
                complementoId: it.complementoId ? Number(it.complementoId) : null,
                trocaCarboId: it.trocaCarboId ? Number(it.trocaCarboId) : null,
                trocaProteinaId: it.trocaProteinaId ? Number(it.trocaProteinaId) : null,
                trocaLegumeId: it.trocaLegumeId ? Number(it.trocaLegumeId) : null,

                zerarLegume: !!it.zerarLegume,
                adicionarFeijao: !!it.adicionarFeijao,
                adicionarPure: !!it.adicionarPure,
                adicionarLegumes: !!it.adicionarLegumes,
                adicionarArroz: !!it.adicionarArroz,
                carboGramas: Number(it.carboGramas || 0),
                proteinaGramas: Number(it.proteinaGramas || 0),
                legumeGramas: Number(it.legumeGramas || 0),
                feijaoGramas: Number(it.feijaoGramas || 0),
                complementoGramas: Number(it.complementoGramas || 0),
                observacaoItem: it.observacaoItem ?? "",
                precoUnit: Number(it.precoUnit ?? 0),
                usarPlano: !!it.usarPlano,
              })),
            });
            if (agendamentoAtualizadoApi) {
              const atualizadoUi = mapApiToUi(agendamentoAtualizadoApi);
              const dataSelecionadaAtual = utils.toISODateOnly(selectedDate);
              const dataAtualizada = String(atualizadoUi.data || "").slice(0, 10);
              setAgendamentos((atuais) => {
                const semAntigo = atuais.filter((item) => item.id !== atualizadoUi.id);
                return dataAtualizada === dataSelecionadaAtual ? [...semAntigo, atualizadoUi] : semAntigo;
              });
              setAgendamentoSelecionado((atual) => atual?.id === atualizadoUi.id ? atualizadoUi : atual);
            }
            const pedidosPublicosImportadosIds = Array.from(new Set([
              ...(Array.isArray(payload.pedidosPublicosIds) ? payload.pedidosPublicosIds : []),
              ...(Array.isArray(dadosEdicao?.pedidosPublicosIds) ? dadosEdicao.pedidosPublicosIds : []),
              ...(dadosEdicao?.pedidoPublicoId ? [dadosEdicao.pedidoPublicoId] : []),
            ].map(Number).filter(Boolean)));
            await Promise.all(pedidosPublicosImportadosIds.map((pedidoPublicoImportadoId) =>
              apiFetch(`${String(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api").replace(/\/+$/, "")}/pedidos-publicos/${pedidoPublicoImportadoId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  clienteId: Number(payload.clienteId),
                  status: "AGENDADO",
                  agendamentoId: agendamentoEditandoId,
                }),
              })
            ));
          } else {
            const criado = await createAgendamento({
              clienteId: Number(payload.clienteId),
              pedidosPublicosIds: Array.from(new Set([
                ...(Array.isArray(payload.pedidosPublicosIds) ? payload.pedidosPublicosIds : []),
                ...(Array.isArray(dadosEdicao?.pedidosPublicosIds) ? dadosEdicao.pedidosPublicosIds : []),
                ...(dadosEdicao?.pedidoPublicoId ? [dadosEdicao.pedidoPublicoId] : []),
              ].map(Number).filter(Boolean))),
              planosCompradosIds: payload.planosCompradosIds,
              tipo: payload.tipo,
              data: payload.data,
              dataEntregaCongelada: payload.dataEntregaCongelada,
              congelarSubtipo: payload.congelarSubtipo,
              faixaHorario: payload.faixaHorario,
              endereco: payload.endereco,
              entregaLatitude: payload.entregaLatitude,
              entregaLongitude: payload.entregaLongitude,
              observacoes: payload.observacoes ?? null,
              precisaTroco: payload.precisaTroco,
              trocoPara: payload.trocoPara,
              formaPagamento: payload.formaPagamento,
              senhaAutorizacao: payload.senhaAutorizacao,
              voucherCodigo: payload.voucherCodigo,
              formaPagamentoTaxaVoucher: payload.formaPagamentoTaxaVoucher,
              pagamentoJaRealizado: payload.pagamentoJaRealizado,
              valorDescontoManual: payload.valorDescontoManual,
              motivoDescontoManual: payload.motivoDescontoManual,
              cobrarTaxaEntrega: payload.cobrarTaxaEntrega,
              abaterTaxaEntregaPlano: payload.abaterTaxaEntregaPlano,
              itens: payload.itens.map((it: any) => ({
                tipoItem: it.tipoItem,
                destinatarioNome: it.destinatarioNome,
                grupoPedido: it.grupoPedido,
                tamanhoId: it.tamanhoId ? Number(it.tamanhoId) : null,
                salgadoId: it.salgadoId ? Number(it.salgadoId) : null,
                congeladaId: it.congeladaId ? Number(it.congeladaId) : null,
                quantidade: Number(it.quantidade),

                opcaoId: it.opcaoId ? Number(it.opcaoId) : null,
                carboId: it.carboId ? Number(it.carboId) : null,
                proteinaId: it.proteinaId ? Number(it.proteinaId) : null,
                legumeId: it.legumeId ? Number(it.legumeId) : null,
                feijaoId: it.feijaoId ? Number(it.feijaoId) : null,
                complementoId: it.complementoId ? Number(it.complementoId) : null,
                trocaCarboId: it.trocaCarboId ? Number(it.trocaCarboId) : null,
                trocaProteinaId: it.trocaProteinaId ? Number(it.trocaProteinaId) : null,
                trocaLegumeId: it.trocaLegumeId ? Number(it.trocaLegumeId) : null,

                zerarLegume: !!it.zerarLegume,
                adicionarFeijao: !!it.adicionarFeijao,
                adicionarPure: !!it.adicionarPure,
                adicionarLegumes: !!it.adicionarLegumes,
                adicionarArroz: !!it.adicionarArroz,
                carboGramas: Number(it.carboGramas || 0),
                proteinaGramas: Number(it.proteinaGramas || 0),
                legumeGramas: Number(it.legumeGramas || 0),
                feijaoGramas: Number(it.feijaoGramas || 0),
                complementoGramas: Number(it.complementoGramas || 0),
                observacaoItem: it.observacaoItem ?? "",
                precoUnit: Number(it.precoUnit ?? 0),
                usarPlano: !!it.usarPlano,
              })),
            });
            pedidoCriadoId = Number(criado.pedidoId);
            agendamentoCriadoId = Number(criado.agendamentoId);

            const pedidosPublicosImportadosIds = Array.from(new Set([
              ...(Array.isArray(payload.pedidosPublicosIds) ? payload.pedidosPublicosIds : []),
              ...(Array.isArray(dadosEdicao?.pedidosPublicosIds) ? dadosEdicao.pedidosPublicosIds : []),
              ...(dadosEdicao?.pedidoPublicoId ? [dadosEdicao.pedidoPublicoId] : []),
            ].map(Number).filter(Boolean)));
            await Promise.all(pedidosPublicosImportadosIds.map((pedidoPublicoImportadoId) =>
              apiFetch(`${String(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api").replace(/\/+$/, "")}/pedidos-publicos/${pedidoPublicoImportadoId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  clienteId: Number(payload.clienteId),
                  status: "AGENDADO",
                  agendamentoId: Number(criado.agendamentoId),
                }),
              })
            ));
          }

          const date = utils.toISODateOnly(selectedDate);
          const res = await getAgendamentos({ date, page: 1, pageSize: 200 });
          const agendamentosAtualizados = (res.rows || []).map(mapApiToUi);
          setAgendamentos(agendamentosAtualizados);

          if (pedidoCriadoId != null) {
            let novoPedido = agendamentosAtualizados.find(
              (agendamento) =>
                (agendamentoCriadoId != null && agendamento.id === String(agendamentoCriadoId)) ||
                agendamento.numeroPedido === `#${pedidoCriadoId}`,
            );

            if (!novoPedido && agendamentoCriadoId != null) {
              const agendamentoCriado = await getAgendamentoById(agendamentoCriadoId);
              novoPedido = mapApiToUi(agendamentoCriado);
            }

            if (novoPedido) {
              await copiarResumoPedido(novoPedido);
            } else {
              toast({
                title: "Pedido criado",
                description: "O pedido foi salvo, mas não foi possível copiar o resumo automaticamente.",
                variant: "destructive",
              });
            }
          }

          setCadastroOpen(false);
        }}
      />
    </div>
  );
}
