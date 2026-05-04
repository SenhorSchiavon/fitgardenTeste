"use client";

import { useEffect, useMemo, useState } from "react";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
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
import { cn } from "@/lib/utils";
import {
  Plus,
  Trash,
  CalendarIcon,
  User,
  MapPin,
  Send,
  Minus,
  Check,
  ChevronsUpDown,
  Pencil,
  Cookie,
  Package,
} from "lucide-react";

import { useRegrasPersonalizadas } from "@/hooks/useRegrasPersonalizadas";
import { toast } from "sonner";
import { useAgendamentos } from "@/hooks/useAgendamentos";
import { PlanoCatalogo, usePlanosCliente } from "@/hooks/usePlanosCliente";

type PedidoTipo = "ENTREGA" | "RETIRADA" | "CONGELAR";
type FormaPagamento =
  | "DINHEIRO"
  | "PIX"
  | "CARTAO"
  | "VOUCHER"
  | "PLANO"
  | "VOUCHER_TAXA_DINHEIRO"
  | "VOUCHER_TAXA_CARTAO"
  | "VOUCHER_TAXA_PIX"
  | "TROCA"
  | "BONIFICACAO";

function isVoucherForma(forma: FormaPagamento) {
  return (
    forma === "VOUCHER" ||
    forma === "VOUCHER_TAXA_DINHEIRO" ||
    forma === "VOUCHER_TAXA_CARTAO" ||
    forma === "VOUCHER_TAXA_PIX"
  );
}

type ClienteOption = {
  id: string;
  nome: string;
  telefone?: string | null;
  enderecoPrincipal?: string | null;
  planos?: any[];
};

type TamanhoOption = {
  id: string;
  nome: string;
  valorUnitario: number;
  valor10?: number;
  valor20?: number;
  valor40?: number;
};

type OpcaoCardapio = {
  id: string;
  nome: string;
  tipo?: "PRATO" | "CARBOIDRATO" | "PROTEINA" | "LEGUME" | "FEIJAO";
};

type SalgadoOption = {
  id: string;
  nome: string;
  preco: number;
};

type NovoPedidoItem = {
  id: string;
  tipoItem: "PADRAO" | "PERSONALIZADA" | "SALGADO";
  destinatarioNome: string;
  tamanhoId: string;
  tamanhoLabel: string;
  quantidade: number;

  opcaoId?: string;
  opcaoNome?: string;
  salgadoId?: string;
  salgadoNome?: string;

  carboId?: string;
  carboNome?: string;

  proteinaId?: string;
  proteinaNome?: string;

  legumeId?: string;
  legumeNome?: string;

  feijaoId?: string;
  feijaoNome?: string;

  zerarLegume: boolean;
  adicionarFeijao: boolean;
  observacaoItem: string;

  precoUnit: number;

  trocaCarboId?: string;
  trocaCarboNome?: string;

  trocaProteinaId?: string;
  trocaProteinaNome?: string;

  trocaLegumeId?: string;
  trocaLegumeNome?: string;

  carboGramas?: number;
  proteinaGramas?: number;
  legumeGramas?: number;
  feijaoGramas?: number;
  groupId?: string;
  usarPlano?: boolean;
};

type Props = {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  clientes: ClienteOption[];
  tamanhos: TamanhoOption[];
  opcoesPadrao: OpcaoCardapio[];
  carboidratos: OpcaoCardapio[];
  proteinas: OpcaoCardapio[];
  legumes: OpcaoCardapio[];
  feijoes?: OpcaoCardapio[];
  salgados?: SalgadoOption[];
  initialData?: any;
  onSubmit?: (payload: any) => Promise<void> | void;
};

type HorarioIntervalo = {
  inicio: string;
  fim: string;
};

function toMin(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function fromMin(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function gerarHorarios30({ start, end }: { start: string; end: string }) {
  const ini = toMin(start);
  const fim = toMin(end);
  const arr: string[] = [];
  for (let t = ini; t <= fim; t += 30) {
    arr.push(fromMin(t));
  }
  return arr;
}

function getPrecoUnitPorQuantidade(tamanho: TamanhoOption, quantidade: number) {
  const qtd = Math.max(1, Number(quantidade || 1));

  if (qtd >= 40 && tamanho.valor40 != null) return tamanho.valor40;
  if (qtd >= 20 && tamanho.valor20 != null) return tamanho.valor20;
  if (qtd >= 10 && tamanho.valor10 != null) return tamanho.valor10;

  return tamanho.valorUnitario;
}

function currency(value: number) {
  return Number(value || 0).toFixed(2);
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getDefaultAgendamentoDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
}

function toISODateOnlyLocal(date?: Date | null) {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateBR(date?: Date | string | null) {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("pt-BR");
}

export function NovoAgendamentoNovoLayout({
  open,
  onOpenChange,
  clientes,
  tamanhos,
  opcoesPadrao,
  carboidratos,
  proteinas,
  legumes,
  feijoes = [],
  salgados = [],
  onSubmit,
  initialData,
}: Props) {
  const { regras } = useRegrasPersonalizadas();
  const { estimarTaxaEntrega, getAgendamentos } = useAgendamentos();
  const { listPlanos, vincularPlano, saving: savingPlano } = usePlanosCliente();
  const [valorTaxa, setValorTaxa] = useState(0);
  const [agendamentoDuplicado, setAgendamentoDuplicado] = useState<any | null>(null);
  const [checandoDuplicidade, setChecandoDuplicidade] = useState(false);
  const [incluirTaxaEntrega, setIncluirTaxaEntrega] = useState(true);
  const [clienteId, setClienteId] = useState("");
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [tipo, setTipo] = useState<PedidoTipo>("ENTREGA");
  const [data, setData] = useState<Date | undefined>(() => getDefaultAgendamentoDate());
  const [dataEntregaCongelada, setDataEntregaCongelada] = useState<Date | undefined>(() => getDefaultAgendamentoDate());
  const [horario, setHorario] = useState<HorarioIntervalo>({
    inicio: "11:00",
    fim: "11:30",
  });
  const [endereco, setEndereco] = useState("");
  const [observacoesPedido, setObservacoesPedido] = useState("");
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>("PIX");
  const [voucherCodigo, setVoucherCodigo] = useState("");

  const [currentGroupId, setCurrentGroupId] = useState("");
  const [modalNovoPedidoOpen, setModalNovoPedidoOpen] = useState(false);
  const [modalEscolhaPedidoOpen, setModalEscolhaPedidoOpen] = useState(false);
  const [modalPlanoOpen, setModalPlanoOpen] = useState(false);
  const [modalTrocasOpen, setModalTrocasOpen] = useState(false);
  const [itens, setItens] = useState<NovoPedidoItem[]>([]);
  const [planosCatalogo, setPlanosCatalogo] = useState<PlanoCatalogo[]>([]);
  const [planoSelecionadoId, setPlanoSelecionadoId] = useState("");
  const [planoPago, setPlanoPago] = useState(false);
  const [incluirTaxaPlano, setIncluirTaxaPlano] = useState(true);
  const [quantidadeTaxasPlano, setQuantidadeTaxasPlano] = useState(1);

  const [formItem, setFormItem] = useState<NovoPedidoItem>({
    id: "",
    tipoItem: "PADRAO",
    destinatarioNome: "",
    tamanhoId: "",
    tamanhoLabel: "",
    quantidade: 1,

    opcaoId: "",
    opcaoNome: "",
    salgadoId: "",
    salgadoNome: "",

    carboId: "",
    carboNome: "",

    proteinaId: "",
    proteinaNome: "",

    legumeId: "",
    legumeNome: "",

    feijaoId: "",
    feijaoNome: "",

    zerarLegume: false,
    adicionarFeijao: false,
    observacaoItem: "",
    trocaCarboId: "",
    trocaCarboNome: "",

    trocaProteinaId: "",
    trocaProteinaNome: "",

    trocaLegumeId: "",
    trocaLegumeNome: "",

    precoUnit: 0,
    usarPlano: false,
    carboGramas: 0,
    proteinaGramas: 0,
    legumeGramas: 0,
    feijaoGramas: 0,
  });

  const clienteSelecionado = useMemo(
    () => clientes.find((c) => c.id === clienteId) || null,
    [clientes, clienteId]
  );

  const horarios = useMemo(
    () => gerarHorarios30({ start: "06:00", end: "22:00" }),
    []
  );

  const horariosFimDisponiveis = useMemo(() => {
    const ini = toMin(horario.inicio);
    return horarios.filter((h) => toMin(h) > ini);
  }, [horario.inicio, horarios]);

  useEffect(() => {
    const ini = toMin(horario.inicio);
    const fim = toMin(horario.fim);

    if (fim > ini) return;

    const prox = horarios.find((h) => toMin(h) > ini) || "11:30";
    setHorario((prev) => ({ ...prev, fim: prox }));
  }, [horario.inicio, horario.fim, horarios]);

  useEffect(() => {
    if (open && initialData) {
      setClienteId(String(initialData.pedido?.clienteId || initialData.clienteId || ""));
      setTipo(initialData.tipoEntrega || initialData.tipo || "ENTREGA");
      setData(initialData.data ? new Date(initialData.data) : getDefaultAgendamentoDate());
      setDataEntregaCongelada(initialData.dataEntregaCongelada ? new Date(initialData.dataEntregaCongelada) : getDefaultAgendamentoDate());
      
      const faixa = initialData.faixaHorario || "11:00-11:30";
      const [inicio, fim] = faixa.includes("-") ? faixa.split("-") : [faixa, "11:30"];
      setHorario({ inicio: inicio || "11:00", fim: fim || "11:30" });
      
      setEndereco(initialData.endereco || "");
      setObservacoesPedido(initialData.observacoes || "");
      setFormaPagamento(initialData.formaPagamento || "PIX");
      setVoucherCodigo(initialData.voucherCodigo || "");
      
      const rawItens = initialData.itens || initialData.pedido?.itens || [];
      const mappedItens: NovoPedidoItem[] = rawItens.map((it: any) => ({
        id: it.id ? String(it.id) : uid(),
        tipoItem: it.tipoItem || (it.opcaoId || it.opcao ? "PADRAO" : "PERSONALIZADA"),
        destinatarioNome: it.destinatarioNome || "",
        tamanhoId: String(it.tamanhoId || ""),
        tamanhoLabel: it.tamanho?.pesagemGramas ? `${it.tamanho.pesagemGramas}g` : (it.tamanhoLabel || ""),
        quantidade: it.quantidade || 1,
        opcaoId: String(it.opcaoId || ""),
        opcaoNome: it.opcao?.nome || it.nome || "",
        salgadoId: String(it.salgadoId || ""),
        salgadoNome: it.salgado?.nome || "",
        carboId: String(it.carboId || ""),
        carboNome: it.carbo?.nome || "",
        proteinaId: String(it.proteinaId || ""),
        proteinaNome: it.proteina?.nome || "",
        legumeId: String(it.legumeId || ""),
        legumeNome: it.legume?.nome || "",
        feijaoId: String(it.feijaoId || ""),
        feijaoNome: it.feijao?.nome || "",
        zerarLegume: !!it.zerarLegume,
        adicionarFeijao: !!it.adicionarFeijao,
        observacaoItem: it.observacaoItem || "",
        precoUnit: Number(it.valor || it.precoUnit || 0) / Math.max(1, Number(it.quantidade || 1)),
        usarPlano: !!it.usarPlano,
        trocaCarboId: String(it.trocaCarboId || ""),
        trocaProteinaId: String(it.trocaProteinaId || ""),
        trocaLegumeId: String(it.trocaLegumeId || ""),
        carboGramas: Number(it.carboGramas || 0),
        proteinaGramas: Number(it.proteinaGramas || 0),
        legumeGramas: Number(it.legumeGramas || 0),
        feijaoGramas: Number(it.feijaoGramas || 0),
      }));
      setItens(mappedItens);
    } else if (open && !initialData) {
      resetForm();
    }
  }, [open, initialData]);

  useEffect(() => {
    if (!clienteSelecionado) return;
    if (tipo === "ENTREGA" && !endereco.trim()) {
      setEndereco(clienteSelecionado.enderecoPrincipal || "");
    }
  }, [clienteSelecionado, tipo, endereco]);

  // Estimativa de taxa de entrega
  useEffect(() => {
    let ativo = true;

    async function updateTaxa() {
      if (tipo !== "ENTREGA" || !clienteId || !endereco.trim()) {
        setValorTaxa(0);
        return;
      }

      try {
        const res = await estimarTaxaEntrega({ clienteId: Number(clienteId) });
        if (!ativo) return;
        if (res && typeof res.valorTaxa === "number") {
          setValorTaxa(res.valorTaxa);
        }
      } catch (e: any) {
        if (!ativo) return;
        console.error("Erro ao estimar taxa:", e);
        setValorTaxa(0);
      }
    }

    updateTaxa();
    return () => {
      ativo = false;
    };
  }, [clienteId, tipo, endereco, estimarTaxaEntrega]);

  useEffect(() => {
    let ativo = true;

    async function verificarAgendamentoDuplicado() {
      if (!open || !clienteId || !data || initialData) {
        setAgendamentoDuplicado(null);
        setChecandoDuplicidade(false);
        return;
      }

      setChecandoDuplicidade(true);
      try {
        const dateISO = toISODateOnlyLocal(data);
        const res = await getAgendamentos({
          date: dateISO,
          clienteId: Number(clienteId),
          page: 1,
          pageSize: 1,
        });
        if (!ativo) return;
        const duplicado = res?.rows?.[0] || null;
        setAgendamentoDuplicado(duplicado);
        if (duplicado) {
          toast.warning(`Cliente já possui agendamento para o dia ${formatDateBR(data)}`, {
            description: "Para adicionar mais coisas, altere o pedido existente.",
          });
        }
      } catch {
        if (ativo) setAgendamentoDuplicado(null);
      } finally {
        if (ativo) setChecandoDuplicidade(false);
      }
    }

    verificarAgendamentoDuplicado();
    return () => {
      ativo = false;
    };
  }, [open, clienteId, data, initialData, getAgendamentos]);

  const totalMarmitas = useMemo(
    () => itens.filter((item) => item.tipoItem !== "SALGADO").reduce((acc, item) => acc + Number(item.quantidade || 0), 0),
    [itens]
  );

  const totalSalgados = useMemo(
    () => itens.filter((item) => item.tipoItem === "SALGADO").reduce((acc, item) => acc + Number(item.quantidade || 0), 0),
    [itens]
  );

  const totalItens = useMemo(
    () => itens.reduce((acc, item) => acc + Number(item.quantidade || 0), 0),
    [itens]
  );

  const itensDoGrupoAtual = useMemo(
    () => itens.filter((item) => item.groupId === currentGroupId),
    [itens, currentGroupId]
  );

  const hasItensNoGrupoAtual = itensDoGrupoAtual.length > 0;

  const planoSelecionado = useMemo(
    () => planosCatalogo.find((plano) => String(plano.id) === String(planoSelecionadoId)) || null,
    [planosCatalogo, planoSelecionadoId],
  );

  const valorPlanoSelecionado = Number(planoSelecionado?.valor || 0);
  const quantidadeTaxasPlanoFinal =
    incluirTaxaPlano && tipo === "ENTREGA" && valorTaxa > 0
      ? Math.max(1, Math.floor(Number(quantidadeTaxasPlano || 1)))
      : 0;
  const valorTaxasPlanoTotal = quantidadeTaxasPlanoFinal * Number(valorTaxa || 0);
  const valorTotalPlanoCliente = valorPlanoSelecionado + valorTaxasPlanoTotal;

  function getSaldoPlanoPorTamanho(tamanhoId?: string) {
    if (!tamanhoId) return 0;
    return (clienteSelecionado?.planos || []).reduce((acc: number, plano: any) => {
      const planoTamanhoId = String(plano.plano?.tamanhoId ?? plano.tamanhoId ?? "");
      if (planoTamanhoId !== String(tamanhoId)) return acc;
      return acc + Number(plano.saldoUnidades || 0);
    }, 0);
  }

  function canUsePlanoForItem(item: NovoPedidoItem) {
    if (!item.usarPlano || item.tipoItem === "SALGADO") return true;
    return (clienteSelecionado?.planos || []).some((plano: any) => {
      const planoTamanhoId = String(plano.plano?.tamanhoId ?? plano.tamanhoId ?? "");
      return planoTamanhoId === String(item.tamanhoId || "");
    });
  }

  const itensComPrecoBruto = useMemo(() => {
    const regraSalgado = regras
      .filter((r) => r.tipo === "VOLUME_SALGADOS" && totalSalgados >= Number(r.limite))
      .sort((a, b) => Number(b.limite) - Number(a.limite))[0];
    const precoSalgadoVolume = regraSalgado ? Number(regraSalgado.preco) : null;

    return itens.map((item) => {
      if (item.tipoItem === "SALGADO") {
        return {
          ...item,
          precoUnit: precoSalgadoVolume != null ? precoSalgadoVolume : Number(item.precoUnit || 0),
        };
      }

      const tamanho = tamanhos.find((t) => t.id === item.tamanhoId);
      if (!tamanho) return item;

      const precoFaixa = getPrecoUnitPorQuantidade(tamanho, totalMarmitas || 1);

      return {
        ...item,
        precoUnit:
          item.tipoItem === "PERSONALIZADA"
            ? item.precoUnit
            : Number(precoFaixa || 0),
      };
    });
  }, [itens, tamanhos, totalMarmitas, totalSalgados, regras]);

  const itensComPrecoFinal = useMemo(() => {
    return itensComPrecoBruto.map((item) => {
      if (!item.usarPlano) return item;
      if (!canUsePlanoForItem(item)) return item;
      return { ...item, precoUnit: 0 };
    });
  }, [itensComPrecoBruto, clienteSelecionado]);

  const subtotalPedido = useMemo(() => {
    const totalBrutoMarmitas = itensComPrecoFinal
      .filter((item) => item.tipoItem !== "SALGADO")
      .reduce(
      (acc, item) => acc + Number(item.precoUnit || 0) * Number(item.quantidade || 0),
      0
    );
    const totalBrutoSalgados = itensComPrecoFinal
      .filter((item) => item.tipoItem === "SALGADO")
      .reduce(
        (acc, item) => acc + Number(item.precoUnit || 0) * Number(item.quantidade || 0),
        0
      );

    const totalMarmitas = itensComPrecoFinal
      .filter((item) => item.tipoItem !== "SALGADO")
      .reduce((acc, it) => acc + it.quantidade, 0);

    // Desconto por volume total
    const regrasVolume = regras
      .filter((r) => r.tipo === "VOLUME_TOTAL" && totalMarmitas >= Number(r.limite))
      .sort((a, b) => Number(b.limite) - Number(a.limite));

    if (regrasVolume.length > 0) {
      const pct = Number(regrasVolume[0].preco);
      return totalBrutoMarmitas * (1 - pct / 100) + totalBrutoSalgados;
    }

    return totalBrutoMarmitas + totalBrutoSalgados;
  }, [itensComPrecoFinal, regras]);

  function resetForm() {
    setClienteId("");
    setTipo("ENTREGA");
    setData(getDefaultAgendamentoDate());
    setDataEntregaCongelada(getDefaultAgendamentoDate());
    setHorario({ inicio: "11:00", fim: "11:30" });
    setEndereco("");
    setObservacoesPedido("");
    setFormaPagamento("PIX");
    setVoucherCodigo("");
    setItens([]);
    setIncluirTaxaEntrega(true);
    resetFormItem();
  }

  function resetFormItem() {
    setFormItem({
      id: "",
      tipoItem: "PADRAO",
      destinatarioNome: "",
      tamanhoId: "",
      tamanhoLabel: "",
      quantidade: 1,
      opcaoId: "",
      opcaoNome: "",
      salgadoId: "",
      salgadoNome: "",
      carboId: "",
      carboNome: "",
      proteinaId: "",
      proteinaNome: "",
      legumeId: "",
      legumeNome: "",
      feijaoId: "",
      feijaoNome: "",
      zerarLegume: false,
      adicionarFeijao: false,
      observacaoItem: "",
      precoUnit: 0,
      trocaCarboId: "",
      trocaCarboNome: "",

      trocaProteinaId: "",
      trocaProteinaNome: "",

      trocaLegumeId: "",
      trocaLegumeNome: "",
      usarPlano: false,
      carboGramas: 0,
      proteinaGramas: 0,
      legumeGramas: 0,
      feijaoGramas: 0,
    });
  }

  function resetFormItemPartial() {
    setFormItem((prev) => ({
      ...prev,
      id: "",
      quantidade: 1,
      opcaoId: "",
      opcaoNome: "",
      salgadoId: "",
      salgadoNome: "",
      carboId: "",
      carboNome: "",
      proteinaId: "",
      proteinaNome: "",
      legumeId: "",
      legumeNome: "",
      feijaoId: "",
      feijaoNome: "",
      zerarLegume: false,
      adicionarFeijao: false,
      observacaoItem: "",
      precoUnit: 0,
      trocaCarboId: "",
      trocaCarboNome: "",
      trocaProteinaId: "",
      trocaProteinaNome: "",
      trocaLegumeId: "",
      trocaLegumeNome: "",
      carboGramas: 0,
      proteinaGramas: 0,
      legumeGramas: 0,
      feijaoGramas: 0,
    }));
  }

  const totalGramasPersonalizada = useMemo(() => {
    if (formItem.tipoItem !== "PERSONALIZADA") return 0;

    return (
      Number(formItem.carboGramas || 0) +
      Number(formItem.proteinaGramas || 0) +
      Number(formItem.legumeGramas || 0) +
      Number(formItem.feijaoGramas || 0)
    );
  }, [
    formItem.tipoItem,
    formItem.carboGramas,
    formItem.proteinaGramas,
    formItem.legumeGramas,
    formItem.feijaoGramas,
  ]);

  useEffect(() => {
    if (formItem.tipoItem !== "PERSONALIZADA") return;

    const proteina = Number(formItem.proteinaGramas || 0);
    const total = totalGramasPersonalizada;

    const regrasProteina = regras.filter((r) => r.tipo === "PROTEINA").sort((a, b) => a.limite - b.limite);
    const regrasTotal = regras.filter((r) => r.tipo === "PESO_TOTAL").sort((a, b) => a.limite - b.limite);

    let precoProteina = regrasProteina.length > 0 ? regrasProteina[regrasProteina.length - 1].preco : 0;
    for (const r of regrasProteina) {
      if (proteina <= r.limite) {
        precoProteina = r.preco;
        break;
      }
    }

    let precoTotal = regrasTotal.length > 0 ? regrasTotal[regrasTotal.length - 1].preco : 0;
    for (const r of regrasTotal) {
      if (total <= r.limite) {
        precoTotal = r.preco;
        break;
      }
    }

    let finalPrice = Math.max(precoProteina, precoTotal);

    // Ajuste por quantidade de ingredientes
    const tiposCount = [formItem.carboId, formItem.proteinaId, formItem.legumeId, formItem.feijaoId].filter(id => !!id).length;
    const regraAjuste = regras.find(r => r.tipo === "QUANTIDADE_INGREDIENTES" && Number(r.limite) === tiposCount);
    const ajuste = regraAjuste ? Number(regraAjuste.preco) : 0;
    
    finalPrice += ajuste;

    setFormItem((prev) => {
      if (prev.precoUnit === finalPrice) return prev;
      return { ...prev, precoUnit: finalPrice };
    });
  }, [formItem.tipoItem, formItem.carboId, formItem.proteinaId, formItem.legumeId, formItem.feijaoId, formItem.proteinaGramas, totalGramasPersonalizada, regras]);

  function abrirNovoPedido() {
    if (!clienteId) {
      toast.error("Cliente não selecionado", {
        description: "Selecione um cliente antes de adicionar um pedido.",
      });
      return;
    }

    setCurrentGroupId(uid());
    resetFormItem();
    setModalEscolhaPedidoOpen(true);
  }

  function abrirFormularioMarmita() {
    resetFormItem();
    setFormItem((prev) => ({
      ...prev,
      tipoItem: "PADRAO",
      destinatarioNome: clienteSelecionado?.nome || "",
    }));
    setModalEscolhaPedidoOpen(false);
    setModalNovoPedidoOpen(true);
  }

  function abrirFormularioSalgado() {
    resetFormItem();
    setFormItem((prev) => ({ ...prev, tipoItem: "SALGADO" }));
    setModalEscolhaPedidoOpen(false);
    setModalNovoPedidoOpen(true);
  }

  async function abrirModalPlano() {
    if (!clienteId) {
      toast.error("Cliente não selecionado", { description: "Selecione um cliente antes de vincular um plano." });
      return;
    }

    setModalEscolhaPedidoOpen(false);
    setModalPlanoOpen(true);
    setPlanoSelecionadoId("");
    setPlanoPago(false);
    setIncluirTaxaPlano(true);
    setQuantidadeTaxasPlano(1);

    try {
      const planos = await listPlanos();
      setPlanosCatalogo(planos || []);
    } catch {
      setPlanosCatalogo([]);
    }
  }

  async function handleVincularPlanoCliente() {
    if (!clienteId || !planoSelecionadoId) return;

    const vinculo = await vincularPlano(Number(clienteId), Number(planoSelecionadoId), planoPago, {
      quantidadeTaxasEntrega: quantidadeTaxasPlanoFinal,
      valorTaxaEntrega: quantidadeTaxasPlanoFinal > 0 ? Number(valorTaxa || 0) : 0,
    });
    const plano = planosCatalogo.find((p) => String(p.id) === String(planoSelecionadoId));
    const novoVinculo = plano ? { ...vinculo, plano } : vinculo;

    if (clienteSelecionado) {
      clienteSelecionado.planos = [...(clienteSelecionado.planos || []), novoVinculo];
    }

    setModalPlanoOpen(false);
    setPlanoSelecionadoId("");
    setPlanoPago(false);
    setIncluirTaxaPlano(true);
    setQuantidadeTaxasPlano(1);
  }

  function getResumoEscolhas(item: NovoPedidoItem) {
    if (item.tipoItem === "SALGADO") {
      return item.salgadoNome || "Salgado";
    }

    if (item.tipoItem === "PERSONALIZADA") {
      const partes = [
        item.carboNome ? `Carbo: ${item.carboNome} (${item.carboGramas || 0}g)` : null,
      item.proteinaNome ? `Proteína: ${item.proteinaNome} (${item.proteinaGramas || 0}g)` : null,
        !item.zerarLegume && item.legumeNome
          ? `Legume: ${item.legumeNome} (${item.legumeGramas || 0}g)`
          : null,
        item.adicionarFeijao && item.feijaoNome
          ? `Feijão: ${item.feijaoNome} (${item.feijaoGramas || 0}g)`
          : null,
      ].filter(Boolean);

      return partes.join(" • ");
    }

    const formatTroca = (nome: string) => `${nome} (+ R$ 2,00 Troca)`;
    const extras = [
      item.opcaoNome || "Marmita padrão",
      item.trocaCarboNome ? `Troca carbo: ${formatTroca(item.trocaCarboNome)}` : null,
      item.trocaProteinaNome ? `Troca proteína: ${formatTroca(item.trocaProteinaNome)}` : null,
      !item.zerarLegume && item.trocaLegumeNome
        ? `Troca legume: ${formatTroca(item.trocaLegumeNome)}`
        : null,
      item.zerarLegume ? "Sem legume" : null,
      item.adicionarFeijao ? "Com feijão" : null,
    ].filter(Boolean);

    return extras.join(" • ");
  }

  function editarItem(item: NovoPedidoItem) {
    setFormItem({ ...item });
    setCurrentGroupId(item.groupId || "");
    setModalNovoPedidoOpen(true);
  }

  function getNomeItem(item: NovoPedidoItem) {
    if (item.tipoItem === "SALGADO") return item.salgadoNome || "Salgado";
    if (item.tipoItem === "PERSONALIZADA") return "Personalizada";
    return item.opcaoNome || "Marmita padrão";
  }

  function getDestinatarioItem(item: NovoPedidoItem) {
    return (item.destinatarioNome || "").trim() || clienteSelecionado?.nome || "-";
  }

  function getDetalheListaItem(item: NovoPedidoItem) {
    if (item.tipoItem === "PERSONALIZADA") return getResumoEscolhas(item);
    if (item.tipoItem === "SALGADO") return "";

    const formatTroca = (nome: string) => `${nome} (+ R$ 2,00 Troca)`;
    return [
      item.trocaCarboNome ? `Troca carbo: ${formatTroca(item.trocaCarboNome)}` : null,
      item.trocaProteinaNome ? `Troca proteína: ${formatTroca(item.trocaProteinaNome)}` : null,
      !item.zerarLegume && item.trocaLegumeNome
        ? `Troca legume: ${formatTroca(item.trocaLegumeNome)}`
        : null,
      item.zerarLegume ? "Sem legume" : null,
      item.adicionarFeijao ? "Com feijão" : null,
    ].filter(Boolean).join(" • ");
  }

  function addPedidoNaLista(fechar = true) {
    if (fechar && formItem.tipoItem === "PADRAO" && !formItem.opcaoId) {
      setModalNovoPedidoOpen(false);
      resetFormItem();
      return;
    }

    if (formItem.tipoItem !== "SALGADO" && !formItem.destinatarioNome.trim()) {
      toast.error("Nome não informado", { description: "Informe o nome para a etiqueta antes de adicionar a marmita." });
      return;
    }

    if (formItem.tipoItem === "PADRAO" && !formItem.tamanhoId) {
      toast.error("Tamanho não selecionado", { description: "Selecione um tamanho para continuar." })
      return;
    }

    const tamanho = tamanhos.find((t) => t.id === formItem.tamanhoId);
    const salgado = salgados.find((s) => s.id === formItem.salgadoId);
    const isEdit = !!formItem.id;

    if (formItem.tipoItem === "SALGADO") {
      if (!salgado) {
        toast.error("Salgado não selecionado", { description: "Selecione um salgado antes de adicionar." });
        return;
      }

      const novo: NovoPedidoItem = {
        ...formItem,
        id: isEdit ? formItem.id : uid(),
        groupId: currentGroupId,
        salgadoId: salgado.id,
        salgadoNome: salgado.nome,
        opcaoId: "",
        opcaoNome: "",
        tamanhoId: "",
        tamanhoLabel: "Salgado",
        precoUnit: Number(salgado.preco || 0),
        usarPlano: false,
      };

      if (isEdit) {
        setItens((prev) => prev.map((it) => (it.id === formItem.id ? novo : it)));
      } else {
        setItens((prev) => [...prev, novo]);
      }

      toast.success(isEdit ? "Salgado atualizado" : "Salgado adicionado", {
        description: `${novo.quantidade}x ${novo.salgadoNome}`,
      });

      if (fechar) {
        setModalNovoPedidoOpen(false);
        resetFormItem();
      } else {
        resetFormItemPartial();
        setFormItem((prev) => ({ ...prev, tipoItem: "SALGADO" }));
      }
      return;
    }

    if (formItem.tipoItem === "PADRAO") {
      if (!tamanho) {
        toast.error("Tamanho inválido", { description: "Selecione um tamanho válido antes de continuar." })
        return;
      }
      if (!formItem.opcaoId) {
        toast.error("Opção não selecionada", { description: "Selecione a opção do cardápio antes de adicionar." })
        return;
      }

      let precoUnit = Number(
        getPrecoUnitPorQuantidade(tamanho, totalMarmitas + (isEdit ? 0 : formItem.quantidade))
      );

      let qtdTrocas = 0;
      if (formItem.trocaCarboId) qtdTrocas++;
      if (formItem.trocaProteinaId) qtdTrocas++;
      if (formItem.trocaLegumeId && !formItem.zerarLegume) qtdTrocas++;

      precoUnit += qtdTrocas * 2;

      const novo: NovoPedidoItem = {
        ...formItem,
        id: isEdit ? formItem.id : uid(),
        groupId: currentGroupId,
        tamanhoLabel: tamanho.nome,
        precoUnit,
      };

      if (!canUsePlanoForItem(novo)) {
        toast.error("Plano não encontrado", {
          description: "O cliente não tem um plano compatível com este tamanho.",
        });
        return;
      }

      if (isEdit) {
        setItens((prev) => prev.map((it) => (it.id === formItem.id ? novo : it)));
      } else {
        setItens((prev) => [...prev, novo]);
      }

      toast.success(isEdit ? "Item atualizado" : "Item adicionado ao pedido", {
        description: `${novo.quantidade}x ${novo.tamanhoLabel} — ${novo.opcaoNome || "Marmita padrão"}${novo.usarPlano ? " (Plano)" : ""}`,
      });

      if (fechar) {
        setModalNovoPedidoOpen(false);
        resetFormItem();
      } else {
        resetFormItemPartial();
      }
      return;
    }

    if (formItem.tipoItem === "PERSONALIZADA") {
      if (totalGramasPersonalizada <= 0) {
        toast.error("Peso não informado", { description: "Informe a gramagem dos ingredientes da sua personalizada." })
        return;
      }

      const novo: NovoPedidoItem = {
        ...formItem,
        id: isEdit ? formItem.id : uid(),
        groupId: currentGroupId,
        // Tenta encontrar um ID de tamanho que combine com a gramagem da personalizada
        tamanhoId: tamanhos.find(t => parseInt(t.nome) === totalGramasPersonalizada)?.id || "",
        tamanhoLabel: `${totalGramasPersonalizada}g`,
        precoUnit: Number(formItem.precoUnit || 0),
      };

      if (!canUsePlanoForItem(novo)) {
        toast.error("Plano não encontrado", {
          description: "O cliente não tem um plano compatível com este tamanho.",
        });
        return;
      }

      if (isEdit) {
        setItens((prev) => prev.map((it) => (it.id === formItem.id ? novo : it)));
      } else {
        setItens((prev) => [...prev, novo]);
      }

      toast.success(isEdit ? "Item personalizado atualizado" : "Item personalizado adicionado", {
        description: `${novo.quantidade}x ${novo.tamanhoLabel} — Personalizada`,
      });

      if (fechar) {
        setModalNovoPedidoOpen(false);
        resetFormItem();
      } else {
        resetFormItemPartial();
      }
    }
  }

  function removeItem(id: string) {
    setItens((prev) => prev.filter((item) => item.id !== id));
  }

  function changeItemQty(id: string, delta: number) {
    setItens((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextItem = {
          ...item,
          quantidade: Math.max(1, Number(item.quantidade || 1) + delta),
        };
        if (delta > 0 && !canUsePlanoForItem(nextItem)) {
          toast.error("Plano não encontrado", {
            description: "O cliente não tem um plano compatível com este tamanho.",
          });
          return item;
        }
        return {
          ...nextItem,
        };
      })
    );
  }

  async function handleSubmit() {
    if (!clienteId) return;
    if (!data) return;
    if (agendamentoDuplicado) {
      toast.error(`Cliente já possui agendamento para o dia ${formatDateBR(data)}`, {
        description: "Para adicionar mais coisas, alterar o pedido existente.",
      });
      return;
    }
    if (tipo === "CONGELAR" && !dataEntregaCongelada) return;
    if (tipo === "ENTREGA" && !endereco.trim()) return;
    if (itens.length === 0) return;

    if (isVoucherForma(formaPagamento) && !voucherCodigo.trim()) {
      toast.error("Voucher obrigatório", {
        description: "Digite o código do voucher para finalizar este agendamento.",
      });
      return;
    }

    // Validação final de gramagem para personalizadas
    const itemInvalido = itensComPrecoBruto.find(it => 
      it.tipoItem === "PERSONALIZADA" && 
      (Number(it.carboGramas || 0) + Number(it.proteinaGramas || 0) + Number(it.legumeGramas || 0) + Number(it.feijaoGramas || 0)) <= 0
    );

    if (itemInvalido) {
      toast.error("Erro na personalizada", {
        description: `A marmita personalizada "${itemInvalido.destinatarioNome || 'Sem nome'}" está com peso zerado. Por favor, edite-a e informe as gramas.`,
      });
      return;
    }

    const payload: any = {
      clienteId,
      tipo,
      data: data instanceof Date ? data.toISOString() : data,
      dataEntregaCongelada: tipo === "CONGELAR" && dataEntregaCongelada
        ? (dataEntregaCongelada instanceof Date ? dataEntregaCongelada.toISOString() : dataEntregaCongelada)
        : null,
      faixaHorario: `${horario.inicio}-${horario.fim}`,
      endereco: tipo === "ENTREGA" ? endereco : tipo,
      observacoes: observacoesPedido,
      formaPagamento: formaPagamento,
      voucherCodigo: isVoucherForma(formaPagamento) ? voucherCodigo.trim() : undefined,
      ...(tipo === "ENTREGA" && incluirTaxaEntrega && valorTaxa > 0 ? { valorTaxa } : {}),
      itens: itensComPrecoBruto.map(it => ({
         ...it,
         carboGramas: Number(it.carboGramas || 0),
         proteinaGramas: Number(it.proteinaGramas || 0),
         legumeGramas: Number(it.legumeGramas || 0),
         feijaoGramas: Number(it.feijaoGramas || 0),
         usarPlano: !!it.usarPlano
      })),
    };

    await onSubmit?.(payload);
    onOpenChange(false);
    resetForm();
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          onOpenChange(v);
          if (!v) resetForm();
        }}
      >
        <DialogContent className="max-w-7xl max-h-[92vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-serif text-3xl text-primary flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center p-2 shadow-lg shadow-primary/20">
                {/* Ícone simplificado que remete ao logo */}
                <div className="w-full h-full border-2 border-white/50 rounded-lg relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-white/20"></div>
                  <div className="absolute bottom-0 right-0 w-1/2 h-1/2 border-l border-t border-white/30"></div>
                </div>
              </div>
              Novo Agendamento
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden pr-1">
            <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)_320px] gap-4 h-full">
              {/* CLIENTE */}
              <div className="overflow-y-auto pr-1 max-h-[calc(92vh-180px)]">
                <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="font-serif text-xl flex items-center gap-2">
                    <User className="h-5 w-5 text-secondary" />
                    Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 flex flex-col">
                    <Label>Cliente</Label>
                    <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={comboboxOpen}
                          className="w-full justify-between"
                        >
                          <span className="truncate">
                            {clienteId
                              ? clientes.find((c) => c.id === clienteId)?.nome
                              : "Selecione o cliente"}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0" style={{ width: 'var(--radix-popover-trigger-width)' }} align="start">
                        <Command filter={(value, search) => {
                          const query = search.toLowerCase();
                          const client = clientes.find(c => c.id === value);
                          if (!client) return 0;
                          const name = client.nome.toLowerCase();
                          const phone = client.telefone?.replace(/\D/g, '') || "";
                          const rawPhoneSearch = query.replace(/\D/g, '');
                          if (name.includes(query) || (rawPhoneSearch && phone.includes(rawPhoneSearch))) {
                            return 1;
                          }
                          return 0;
                        }}>
                          <CommandInput placeholder="Pesquisar por nome ou telefone..." />
                          <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                          <CommandList>
                            <CommandGroup>
                              {clientes.map((cliente) => (
                                <CommandItem
                                  key={cliente.id}
                                  value={cliente.id}
                                  onSelect={(currentValue) => {
                                    setClienteId(currentValue === clienteId ? "" : currentValue);
                                    setComboboxOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4 shrink-0",
                                      clienteId === cliente.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col truncate">
                                    <span className="truncate">{cliente.nome}</span>
                                    {cliente.telefone && (
                                      <span className="text-xs text-muted-foreground">{cliente.telefone}</span>
                                    )}
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {checandoDuplicidade && clienteId && data && !initialData && (
                    <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                      Verificando agendamento do cliente para {formatDateBR(data)}...
                    </div>
                  )}

                  {agendamentoDuplicado && !initialData && (
                    <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-800">
                      <div className="font-bold">Cliente já possui agendamento para {formatDateBR(data)}.</div>
                      <div>Para adicionar mais coisas, altere o pedido existente.</div>
                    </div>
                  )}

                  <div className="rounded-lg border p-3 space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Nome:</span>{" "}
                      {clienteSelecionado?.nome || "-"}
                    </div>
                    <div>
                      <span className="font-medium">Telefone:</span>{" "}
                      {clienteSelecionado?.telefone || "-"}
                    </div>
                    <div>
                      <span className="font-medium">Endereço padrão:</span>{" "}
                      {clienteSelecionado?.enderecoPrincipal || "-"}
                    </div>
                    
                    {clienteSelecionado && (
                      <div className="pt-2 border-t mt-2 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">Plano Ativo:</span>{" "}
                            {clienteSelecionado.planos && clienteSelecionado.planos.length > 0 ? (
                              <Badge className="bg-green-500 hover:bg-green-600">Sim</Badge>
                            ) : (
                              <Badge variant="outline">Não</Badge>
                            )}
                          </div>
                          <Link href={`/historico-pedidos?search=${encodeURIComponent(clienteSelecionado.nome)}`} target="_blank">
                            <Button size="sm" variant="outline">
                              Ver Histórico
                            </Button>
                          </Link>
                        </div>

                        {clienteSelecionado.planos && clienteSelecionado.planos.length > 0 && (
                          <div className="flex flex-col gap-1 mt-1">
                            {clienteSelecionado.planos.map((plano: any) => {
                              const peso = plano.tamanho?.pesagemGramas || plano.plano?.tamanho?.pesagemGramas;
                              const pTamanhoId = plano.plano?.tamanhoId || plano.tamanhoId;
                              const isInUse = itens.some(it => it.usarPlano && Number(it.tamanhoId) === Number(pTamanhoId));
                              
                              return (
                                <div key={plano.id} className={`text-xs font-medium ${isInUse ? "text-green-600 bg-green-50 px-1 rounded-sm border border-green-100" : "text-muted-foreground"}`}>
                                  {plano.saldoUnidades} marmitas{peso ? ` - ${peso}g` : ""}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        
                        {(() => {
                           const itensComPlano = itens.filter(it => it.usarPlano);
                           if (itensComPlano.length === 0) return null;
                           
                           return (
                             <div className="mt-3 p-3 bg-blue-50/50 border border-blue-100 rounded-lg space-y-1">
                                <div className="text-[10px] font-bold text-blue-800 uppercase tracking-tight">Consumo do Plano</div>
                                {(() => {
                                   const porTamanho: Record<string, number> = {};
                                   itensComPlano.forEach(it => {
                                      porTamanho[it.tamanhoId] = (porTamanho[it.tamanhoId] || 0) + Number(it.quantidade);
                                   });
                                   
                                   return Object.entries(porTamanho).map(([tId, qtdTotal]) => {
                                      const planosDoTamanho = (clienteSelecionado?.planos || []).filter((p: any) => Number(p.plano?.tamanhoId || p.tamanhoId) === Number(tId));
                                      const plano = planosDoTamanho[0];
                                      const saldo = planosDoTamanho.reduce((acc: number, p: any) => acc + Number(p.saldoUnidades || 0), 0);
                                      const peso = plano?.tamanho?.pesagemGramas || plano?.plano?.tamanho?.pesagemGramas;
                                      const abatido = Math.min(qtdTotal, saldo);
                                      const novoPlano = Math.max(0, qtdTotal - abatido);
                                      
                                      return (
                                         <div key={tId} className="border-b border-blue-100/50 last:border-0 pb-1 last:pb-0 mb-1">
                                            <div className="text-[10px] font-semibold text-blue-600 mb-1">{peso ? `${peso}g` : "Tamanho desconhecido"}</div>
                                            <div className="text-sm flex justify-between">
                                               <span className="text-muted-foreground">Abatido:</span>
                                               <span className="font-bold">{abatido} un.</span>
                                            </div>
                                            {novoPlano > 0 && (
                                               <div className="text-xs flex justify-between text-orange-700">
                                                  <span>Novo plano não pago:</span>
                                                  <span className="font-bold">{novoPlano} un.</span>
                                               </div>
                                            )}
                                            {novoPlano > 0 && (
                                               <div className="text-[9px] text-orange-600 italic mt-0.5">Será renovado automaticamente</div>
                                            )}
                                         </div>
                                      );
                                   });
                                })()}
                             </div>
                           );
                        })()}
                      </div>
                    )}
                  </div>
                </CardContent>
                </Card>
              </div>

              {/* LISTA CENTRAL */}
              <div className="overflow-y-auto pr-1 max-h-[calc(92vh-180px)]">
                <Card className="min-w-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-4">
                  <div>
                    <CardTitle className="font-serif text-xl flex items-center gap-2">
                      <Plus className="h-5 w-5 text-secondary" />
                      Pedidos
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Cada linha representa um subpedido/marmita adicionada.
                    </p>
                  </div>

                  <Button onClick={abrirNovoPedido}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo pedido
                  </Button>
                </CardHeader>

                <CardContent className="p-0">
                  {itensComPrecoFinal.length === 0 ? (
                    <div className="p-12 text-center text-sm text-muted-foreground border-b border-dashed">
                      Nenhum item adicionado à lista.
                    </div>
                  ) : (
                    <div className="divide-y divide-border/40">
                      {Object.values(
                        itensComPrecoFinal.reduce((acc, item) => {
                          const key = item.groupId || item.id;
                          if (!acc[key]) acc[key] = [];
                          acc[key].push(item);
                          return acc;
                        }, {} as Record<string, typeof itensComPrecoFinal>)
                      ).map((grupo, gIdx) => {
                        const totalMarmitasG = grupo.reduce((sum, i) => sum + Number(i.quantidade || 0), 0);
                        const subtotalG = grupo.reduce((sum, i) => sum + Number(i.precoUnit || 0) * Number(i.quantidade || 0), 0);
                        const itemReferencia = grupo[0];
                        const nomePedido = getDestinatarioItem(itemReferencia);
                        const tamanhoPedido =
                          itemReferencia.tipoItem === "SALGADO"
                            ? "Salgado"
                            : itemReferencia.tamanhoLabel || "Tamanho não definido";
                        const grupoUsaPlano = grupo.some((item) => item.usarPlano);
                        
                        return (
                          <div key={grupo[0].groupId || grupo[0].id} className="bg-background">
                            {/* Cabeçalho do Grupo - Estilo Minimalista */}
                            <div className="bg-muted/30 px-4 py-3 flex flex-col gap-1 border-b border-border/10 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">Pedido #{gIdx + 1}</span>
                                  <Badge variant="outline" className="text-[9px] h-3.5 px-1 bg-white/50">{totalMarmitasG} un.</Badge>
                                  {grupoUsaPlano && (
                                    <Badge className="h-4 text-[9px] bg-green-600 hover:bg-green-700 border-none font-bold">PLANO</Badge>
                                  )}
                                </div>
                                <div className="mt-1 flex items-center gap-2 min-w-0 flex-wrap">
                                  <span className="text-sm font-bold text-foreground truncate">{nomePedido}</span>
                                  <Badge variant="secondary" className="text-[10px] h-5 px-2 font-medium uppercase tracking-tighter">
                                    {tamanhoPedido}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <div className="divide-y divide-border/30">
                              {grupo.map((item, iIdx) => {
                                const detalhe = getDetalheListaItem(item);
                                return (
                                  <div
                                    key={item.id}
                                    className="group relative flex items-start gap-4 p-4 hover:bg-muted/20 transition-colors cursor-pointer"
                                    onClick={() => editarItem(item)}
                                  >
                                    <div className="flex-1 min-w-0 space-y-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-sm">
                                          {item.quantidade}x
                                        </span>
                                        <span className="font-bold text-sm truncate">
                                          {getNomeItem(item)}
                                        </span>
                                        {item.tipoItem === "SALGADO" && (
                                          <Badge variant="outline" className="h-4 text-[9px] border-slate-200 bg-slate-50 text-slate-600 font-bold">SALGADO</Badge>
                                        )}
                                      </div>

                                      {detalhe ? (
                                        <div className="text-[11px] text-muted-foreground leading-relaxed italic">
                                          {detalhe}
                                        </div>
                                      ) : null}

                                    {item.observacaoItem?.trim() ? (
                                      <div className="text-[11px] bg-orange-50 text-orange-700 px-2 py-0.5 rounded border border-orange-100 w-fit mt-1">
                                        <span className="font-bold uppercase text-[9px]">Obs:</span> {item.observacaoItem}
                                      </div>
                                    ) : null}
                                  </div>

                                  <div className="flex flex-col items-end justify-between self-stretch gap-2">
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          editarItem(item);
                                        }}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeItem(item.id);
                                        }}
                                      >
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )})}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="p-4 bg-muted/10 border-t flex items-center justify-between">
                    <div className="text-xs text-muted-foreground font-medium">
                      Total de itens no agendamento: <span className="text-foreground font-bold">{totalItens}</span>
                    </div>
                  </div>
                </CardContent>
                </Card>
              </div>

              {/* DADOS DO AGENDAMENTO */}
              <div className="overflow-y-auto pr-1 max-h-[calc(92vh-180px)]">
                <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="font-serif text-xl flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-secondary" />
                    Agendamento
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={tipo} onValueChange={(v: PedidoTipo) => setTipo(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ENTREGA">Entrega</SelectItem>
                        <SelectItem value="RETIRADA">Retirada</SelectItem>
                        <SelectItem value="CONGELAR">Congelar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{tipo === "CONGELAR" ? "Data de produção" : "Data"}</Label>
                    <div className="rounded-md border p-2">
                      <Calendar
                        mode="single"
                        selected={data}
                        onSelect={setData}
                        locale={ptBR}
                      />
                    </div>
                  </div>

                  {tipo === "CONGELAR" && (
                    <div className="space-y-2">
                      <Label>Data de entrega da congelada</Label>
                      <div className="rounded-md border p-2">
                        <Calendar
                          mode="single"
                          selected={dataEntregaCongelada}
                          onSelect={setDataEntregaCongelada}
                          locale={ptBR}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Início</Label>
                      <Select
                        value={horario.inicio}
                        onValueChange={(v) =>
                          setHorario((prev) => ({ ...prev, inicio: v }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {horarios.map((h) => (
                            <SelectItem key={h} value={h}>
                              {h}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Fim</Label>
                      <Select
                        value={horario.fim}
                        onValueChange={(v) =>
                          setHorario((prev) => ({ ...prev, fim: v }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {horariosFimDisponiveis.map((h) => (
                            <SelectItem key={h} value={h}>
                              {h}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {tipo === "ENTREGA" ? (
                    <div className="space-y-2">
                      <Label>Endereço</Label>
                      <Textarea
                        value={endereco}
                        onChange={(e) => setEndereco(e.target.value)}
                        placeholder="Digite o endereço da entrega"
                      />
                    </div>
                  ) : tipo === "CONGELAR" ? (
                    <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                      Pedido marcado para congelar. A entrega da congelada usa a data selecionada acima.
                    </div>
                  ) : (
                    <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                      Pedido marcado como retirada.
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Forma de pagamento</Label>
                    <Select
                      value={formaPagamento}
                      onValueChange={(v: FormaPagamento) => setFormaPagamento(v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PIX">PIX</SelectItem>
                        <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                        <SelectItem value="CARTAO">Cartão</SelectItem>
                        <SelectItem value="VOUCHER">Voucher</SelectItem>
                        <SelectItem value="TROCA">Troca</SelectItem>
                        <SelectItem value="BONIFICACAO">Bonificação</SelectItem>
                        <SelectItem value="PLANO">Plano</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {isVoucherForma(formaPagamento) && (
                    <div className="space-y-2">
                      <Label htmlFor="voucherCodigo">Código do voucher</Label>
                      <Input
                        id="voucherCodigo"
                        value={voucherCodigo}
                        onChange={(e) => setVoucherCodigo(e.target.value)}
                        placeholder="Digite o voucher"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Observações gerais</Label>
                    <Textarea
                      value={observacoesPedido}
                      onChange={(e) => setObservacoesPedido(e.target.value)}
                      placeholder="Observações gerais do pedido"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Subtotal marmitas</span>
                      <span>R$ {currency(subtotalPedido)}</span>
                    </div>

                    {tipo === "ENTREGA" && valorTaxa > 0 && (
                      <div className="rounded-lg border border-dashed border-border/60 p-3 space-y-2 bg-muted/20">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="incluirTaxaEntrega"
                            checked={incluirTaxaEntrega}
                            onCheckedChange={(v) => setIncluirTaxaEntrega(!!v)}
                          />
                          <Label htmlFor="incluirTaxaEntrega" className="text-sm font-medium cursor-pointer leading-tight">
                            Tem taxa de entrega?
                            <span className="block text-[11px] text-muted-foreground font-normal">Estimada: R$ {currency(valorTaxa)}</span>
                          </Label>
                        </div>
                      </div>
                    )}

                    <Separator className="my-2" />

                    <div className="flex items-center justify-between text-lg">
                      <span className="font-bold text-primary">Total a pagar</span>
                      <span className="font-extrabold text-xl text-primary">R$ {currency(subtotalPedido + (tipo === "ENTREGA" && incluirTaxaEntrega ? valorTaxa : 0))}</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full h-14 text-lg font-bold bg-secondary hover:bg-secondary/90 text-white shadow-xl shadow-secondary/20 transition-all active:scale-[0.98]" 
                    onClick={handleSubmit}
                    disabled={!!agendamentoDuplicado || checandoDuplicidade}
                  >
                    <Send className="h-5 w-5 mr-2" />
                    Finalizar Agendamento
                  </Button>
                </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL SECUNDÁRIA */}
      {/* MODAL SECUNDÁRIA */}
      <Dialog open={modalEscolhaPedidoOpen} onOpenChange={setModalEscolhaPedidoOpen}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-primary">
              O que deseja vender?
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-3 py-2">
            <Button
              type="button"
              variant="outline"
              className="h-auto justify-start gap-3 rounded-xl border-primary/15 p-4 text-left hover:bg-primary/5"
              onClick={abrirFormularioMarmita}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold text-primary">Marmita</div>
                <div className="text-xs font-normal text-muted-foreground">Pedido padrão ou personalizada.</div>
              </div>
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-auto justify-start gap-3 rounded-xl border-secondary/20 p-4 text-left hover:bg-secondary/5"
              onClick={abrirFormularioSalgado}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-white">
                <Cookie className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold text-primary">Salgado</div>
                <div className="text-xs font-normal text-muted-foreground">Venda avulsa pelo cadastro de salgados.</div>
              </div>
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-auto w-full justify-start gap-3 rounded-xl border-emerald-200 p-4 text-left hover:bg-emerald-50"
              onClick={abrirModalPlano}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold text-primary">Planos</div>
                <div className="text-xs font-normal text-muted-foreground">Vincular um plano ao cliente selecionado.</div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={modalPlanoOpen} onOpenChange={setModalPlanoOpen}>
        <DialogContent className="max-w-xl bg-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-primary">
              Vincular Plano ao Cliente
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Cliente</div>
              <div className="mt-1 font-bold text-primary">{clienteSelecionado?.nome || "Selecione um cliente"}</div>
            </div>

            <div className="space-y-2">
              <Label>Plano</Label>
              <Select
                value={planoSelecionadoId}
                onValueChange={setPlanoSelecionadoId}
                disabled={savingPlano || !clienteSelecionado}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent>
                  {planosCatalogo.map((plano) => {
                    const gramas = plano.tamanho?.pesagemGramas ? `${plano.tamanho.pesagemGramas}g` : "-";
                    const unidades = Number(plano.unidades || 0);
                    const nome = plano.nome?.trim() ? plano.nome.trim() : `Plano ${gramas} (${unidades} un.)`;
                    return (
                      <SelectItem key={plano.id} value={String(plano.id)}>
                        {nome}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border/70 p-3">
              <div>
                <Label htmlFor="planoPagoAgendamento" className="text-sm font-semibold cursor-pointer">
                  Plano já foi pago?
                </Label>
                <p className="text-xs text-muted-foreground">Marque se o pagamento já entrou.</p>
              </div>
              <Checkbox
                id="planoPagoAgendamento"
                checked={planoPago}
                onCheckedChange={(v) => setPlanoPago(!!v)}
                disabled={savingPlano}
              />
            </div>

            {tipo === "ENTREGA" && valorTaxa > 0 && (
              <div className="rounded-xl border border-border/70 p-3 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor="incluirTaxaPlano" className="text-sm font-semibold cursor-pointer">
                      Incluir taxa de entrega?
                    </Label>
                    <p className="text-xs text-muted-foreground">Valor da taxa: R$ {currency(valorTaxa)}</p>
                  </div>
                  <Checkbox
                    id="incluirTaxaPlano"
                    checked={incluirTaxaPlano}
                    onCheckedChange={(v) => setIncluirTaxaPlano(!!v)}
                    disabled={savingPlano}
                  />
                </div>

                {incluirTaxaPlano && (
                  <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-3 items-end">
                    <div className="space-y-1.5">
                      <Label htmlFor="quantidadeTaxasPlano" className="text-xs text-muted-foreground">
                        Quantidade
                      </Label>
                      <Input
                        id="quantidadeTaxasPlano"
                        type="number"
                        min={1}
                        step={1}
                        value={quantidadeTaxasPlano}
                        onChange={(e) =>
                          setQuantidadeTaxasPlano(Math.max(1, Math.floor(Number(e.target.value || 1))))
                        }
                        disabled={savingPlano}
                      />
                    </div>
                    <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 text-sm">
                      <div className="text-xs text-emerald-700 font-semibold">Taxas de entrega</div>
                      <div className="font-bold text-primary">
                        {quantidadeTaxasPlanoFinal} x R$ {currency(valorTaxa)} = R$ {currency(valorTaxasPlanoTotal)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-xl border border-primary/10 bg-primary/5 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Plano</span>
                <span className="font-semibold">R$ {currency(valorPlanoSelecionado)}</span>
              </div>
              {valorTaxasPlanoTotal > 0 && (
                <div className="mt-1 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Taxas de entrega</span>
                  <span className="font-semibold">R$ {currency(valorTaxasPlanoTotal)}</span>
                </div>
              )}
              <div className="mt-3 flex items-center justify-between border-t border-primary/10 pt-3">
                <span className="font-bold text-primary">Total</span>
                <span className="text-xl font-extrabold text-primary">R$ {currency(valorTotalPlanoCliente)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setModalPlanoOpen(false)} disabled={savingPlano}>
                Cancelar
              </Button>
              <Button onClick={handleVincularPlanoCliente} disabled={savingPlano || !planoSelecionadoId || !clienteSelecionado}>
                {savingPlano ? "Vinculando..." : "Vincular plano"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={modalNovoPedidoOpen} onOpenChange={setModalNovoPedidoOpen}>
        <DialogContent className="max-w-6xl max-h-[92vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-2 border-b">
            <DialogTitle className="font-serif text-2xl text-primary">
              {formItem.id
                ? "Editar item"
                : formItem.tipoItem === "SALGADO"
                  ? "Adicionar Salgado ao Pedido"
                  : "Adicionar Marmita ao Pedido"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
              {/* LADO ESQUERDO: FORMULÁRIO */}
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-muted/30 border border-border/50 relative overflow-hidden space-y-4">
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mb-1 block">Para quem é este item?</Label>
                    <div className="font-medium text-lg">{clienteSelecionado?.nome || "Selecione um cliente antes"}</div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    <div className="space-y-2">
                      <Label>Nome na Etiqueta / Subpedido</Label>
                      <Input
                        value={formItem.destinatarioNome}
                        onChange={(e) =>
                          setFormItem((prev) => ({
                            ...prev,
                            destinatarioNome: e.target.value,
                          }))
                        }
                        placeholder="Ex.: João / Maria / Criança"
                        className="bg-background border-muted-foreground/20 h-11"
                        disabled={formItem.tipoItem !== "SALGADO" && hasItensNoGrupoAtual && !formItem.id}
                      />
                      {formItem.tipoItem !== "SALGADO" && hasItensNoGrupoAtual && !formItem.id && (
                        <p className="text-[10px] text-muted-foreground">
                          Nome travado para manter este subpedido no mesmo destinatário.
                        </p>
                      )}
                    </div>

                    {formItem.tipoItem === "SALGADO" ? (
                      <div className="space-y-2">
                        <Label>Salgado</Label>
                        <Select
                          value={formItem.salgadoId || ""}
                          onValueChange={(v) => {
                            const salgado = salgados.find((s) => s.id === v);
                            setFormItem((prev) => ({
                              ...prev,
                              salgadoId: v,
                              salgadoNome: salgado?.nome || "",
                              precoUnit: Number(salgado?.preco || 0),
                            }));
                          }}
                        >
                          <SelectTrigger className="bg-background border-muted-foreground/20 h-11">
                            <SelectValue placeholder="Selecione o salgado" />
                          </SelectTrigger>
                          <SelectContent>
                            {salgados.map((salgado) => (
                              <SelectItem key={salgado.id} value={salgado.id}>
                                {salgado.nome} - R$ {currency(salgado.preco)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label>Tamanho</Label>
                        <Select
                          value={formItem.tipoItem === "PERSONALIZADA" ? "__personalizado__" : formItem.tamanhoId}
                          disabled={hasItensNoGrupoAtual && !formItem.id}
                          onValueChange={(v) => {
                            if (v === "__personalizado__") {
                              setFormItem((prev) => ({
                                ...prev,
                                tipoItem: "PERSONALIZADA",
                                tamanhoId: "",
                                tamanhoLabel: "",
                                opcaoId: "",
                                opcaoNome: "",
                              }));
                            } else {
                              const tamanho = tamanhos.find((t) => t.id === v);
                              setFormItem((prev) => ({
                                ...prev,
                                tipoItem: "PADRAO",
                                tamanhoId: v,
                                tamanhoLabel: tamanho?.nome || "",
                              }));
                            }
                          }}
                        >
                          <SelectTrigger className="bg-background border-muted-foreground/20 h-11">
                            <SelectValue placeholder="Selecione o tamanho" />
                          </SelectTrigger>
                          <SelectContent>
                            {tamanhos.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.nome}
                              </SelectItem>
                            ))}
                            <SelectItem value="__personalizado__">Personalizado</SelectItem>
                          </SelectContent>
                        </Select>
                        {hasItensNoGrupoAtual && !formItem.id && (
                          <p className="text-[10px] text-muted-foreground">
                            Tamanho travado para as marmitas deste subpedido.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {(() => {
                    if (formItem.tipoItem === "SALGADO") return null;
                    const tamanhoId = formItem.tamanhoId;
                    const temPlanoCompativel = clienteSelecionado?.planos?.some((p: any) => {
                      const pTamanhoId = p.plano?.tamanhoId ?? p.tamanhoId;
                      return Number(pTamanhoId) === Number(tamanhoId);
                    });
                    if (!temPlanoCompativel) return null;
                    return (
                      <div className="mt-4 flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-100">
                         <div className="space-y-0.5">
                            <Label htmlFor="itemUsarPlano" className="text-sm font-semibold text-green-900 cursor-pointer">Usar saldo do plano</Label>
                            <p className="text-[10px] text-green-700">Abate este item do plano do cliente.</p>
                         </div>
                         <Checkbox 
                            id="itemUsarPlano" 
                            checked={formItem.usarPlano}
                            disabled={hasItensNoGrupoAtual && !formItem.id}
                            onCheckedChange={(v) => {
                               const usarPlano = !!v;
                               const itemComPlano = { ...formItem, usarPlano };
                               if (usarPlano && !canUsePlanoForItem(itemComPlano)) {
                                 toast.error("Plano não encontrado", {
                                   description: "O cliente não tem um plano compatível com este tamanho.",
                                 });
                                 return;
                               }
                               setFormItem(prev => ({ ...prev, usarPlano }));
                            }}
                         />
                      </div>
                    );
                  })()}
                </div>



                {formItem.tipoItem === "SALGADO" ? (
                  <div className="rounded-xl border border-secondary/20 bg-secondary/5 p-4 text-sm text-muted-foreground">
                    <span className="font-semibold text-primary">Salgado selecionado:</span>{" "}
                    {formItem.salgadoNome || "Escolha um salgado acima"}.
                    {formItem.salgadoId && (
                      <span className="ml-1">Preço unitário: R$ {currency(formItem.precoUnit)}.</span>
                    )}
                  </div>
                ) : formItem.tipoItem === "PADRAO" ? (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Opção do cardápio</Label>
                      <div className="grid grid-cols-1 md:grid-cols-[minmax(220px,1fr)_220px_auto] gap-2 items-center">
                        <Select
                          value={formItem.opcaoId}
                          onValueChange={(v) => {
                            const opcao = opcoesPadrao.find((o) => o.id === v);
                            setFormItem((prev) => ({
                              ...prev,
                              opcaoId: v,
                              opcaoNome: opcao?.nome || "",
                            }));
                          }}
                        >
                          <SelectTrigger className="h-9 text-sm min-w-0">
                            <SelectValue placeholder="Selecione a marmita" />
                          </SelectTrigger>
                          <SelectContent>
                            {opcoesPadrao.map((opcao) => (
                              <SelectItem key={opcao.id} value={opcao.id}>
                                {opcao.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-9 border-dashed text-muted-foreground font-normal bg-muted/30"
                          onClick={() => setModalTrocasOpen(true)}
                        >
                          Fazer substituições na marmita
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => addPedidoNaLista(false)}
                          className="shrink-0 h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Adicionar e continuar
                        </Button>
                      </div>
                    </div>

                    <div>
                      
                      {(formItem.trocaCarboId || formItem.trocaProteinaId || formItem.trocaLegumeId || formItem.zerarLegume || formItem.adicionarFeijao) ? (
                         <div className="mt-3 text-xs text-muted-foreground bg-muted/40 p-3 rounded-md border border-border/50">
                           <span className="font-semibold text-foreground">Trocas ativas:</span> {getResumoEscolhas(formItem)}
                         </div>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-3">
                        <div className="space-y-2">
                          <Label>Carboidrato</Label>
                          <Select
                            value={formItem.carboId || "none"}
                            onValueChange={(v) => {
                              if (v === "none") {
                                setFormItem((prev) => ({
                                  ...prev,
                                  carboId: "",
                                  carboNome: "",
                                  carboGramas: 0,
                                }));
                                return;
                              }
                              const item = carboidratos.find((o) => o.id === v);
                              setFormItem((prev) => ({
                                ...prev,
                                carboId: v,
                                carboNome: item?.nome || "",
                              }));
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Nenhum</SelectItem>
                              {carboidratos.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Gramas</Label>
                          <Input
                            type="number"
                            min={0}
                            step="1"
                            value={formItem.carboGramas || 0}
                            onChange={(e) =>
                              setFormItem((prev) => ({
                                ...prev,
                                carboGramas: Number(e.target.value || 0),
                              }))
                            }
                            placeholder="0"
                            disabled={!formItem.carboId}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-3">
                        <div className="space-y-2">
                          <Label>Proteína</Label>
                          <Select
                            value={formItem.proteinaId || "none"}
                            onValueChange={(v) => {
                              if (v === "none") {
                                setFormItem((prev) => ({
                                  ...prev,
                                  proteinaId: "",
                                  proteinaNome: "",
                                  proteinaGramas: 0,
                                }));
                                return;
                              }
                              const item = proteinas.find((o) => o.id === v);
                              setFormItem((prev) => ({
                                ...prev,
                                proteinaId: v,
                                proteinaNome: item?.nome || "",
                              }));
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Nenhum</SelectItem>
                              {proteinas.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Gramas</Label>
                          <Input
                            type="number"
                            min={0}
                            step="1"
                            value={formItem.proteinaGramas || 0}
                            onChange={(e) =>
                              setFormItem((prev) => ({
                                ...prev,
                                proteinaGramas: Number(e.target.value || 0),
                              }))
                            }
                            placeholder="0"
                            disabled={!formItem.proteinaId}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-3">
                        <div className="space-y-2">
                          <Label>Legume</Label>
                          <Select
                            value={formItem.legumeId || "none"}
                            onValueChange={(v) => {
                              if (v === "none") {
                                setFormItem((prev) => ({
                                  ...prev,
                                  legumeId: "",
                                  legumeNome: "",
                                  legumeGramas: 0,
                                }));
                                return;
                              }
                              const item = legumes.find((o) => o.id === v);
                              setFormItem((prev) => ({
                                ...prev,
                                legumeId: v,
                                legumeNome: item?.nome || "",
                              }));
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Nenhum</SelectItem>
                              {legumes.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Gramas</Label>
                          <Input
                            type="number"
                            min={0}
                            step="1"
                            value={formItem.legumeGramas || 0}
                            onChange={(e) =>
                              setFormItem((prev) => ({
                                ...prev,
                                legumeGramas: Number(e.target.value || 0),
                              }))
                            }
                            placeholder="0"
                            disabled={!formItem.legumeId}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-3">
                        <div className="space-y-2">
                          <Label>Feijão (opcional)</Label>
                          <Select
                            value={formItem.feijaoId || "none"}
                            onValueChange={(v) => {
                              if (v === "none") {
                                setFormItem((prev) => ({
                                  ...prev,
                                  feijaoId: "",
                                  feijaoNome: "",
                                  feijaoGramas: 0,
                                  adicionarFeijao: false,
                                }));
                                return;
                              }
                              const item = feijoes.find((o) => o.id === v);
                              setFormItem((prev) => ({
                                ...prev,
                                feijaoId: v,
                                feijaoNome: item?.nome || "",
                                adicionarFeijao: true,
                              }));
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Nenhum</SelectItem>
                              {feijoes.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Gramas</Label>
                          <Input
                            type="number"
                            min={0}
                            step="1"
                            value={formItem.feijaoGramas || 0}
                            onChange={(e) =>
                              setFormItem((prev) => ({
                                ...prev,
                                feijaoGramas: Number(e.target.value || 0),
                                adicionarFeijao: Number(e.target.value || 0) > 0 || !!prev.feijaoId,
                              }))
                            }
                            placeholder="0"
                            disabled={!formItem.feijaoId}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border p-3 text-sm">
                      <span className="font-medium">Peso total da personalizada:</span>{" "}
                      {totalGramasPersonalizada}g
                    </div>

                    <div className="rounded-lg border p-3 space-y-2">
                      <Label>Preço da personalizada</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={formItem.precoUnit || 0}
                        onChange={(e) =>
                          setFormItem((prev) => ({
                            ...prev,
                            precoUnit: Number(e.target.value || 0),
                          }))
                        }
                        placeholder="Temporário até plugar regra real"
                      />
                      <p className="text-xs text-muted-foreground">
                        Aqui depois a gente troca pelo cálculo real da personalizada.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quantidade</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          setFormItem((prev) => ({
                            ...prev,
                            quantidade: Math.max(1, Number(prev.quantidade || 1) - 1),
                          }))
                        }
                      >
                        <Minus className="h-4 w-4" />
                      </Button>

                      <Input
                        type="number"
                        min={1}
                        className="text-center"
                        value={formItem.quantidade}
                        onChange={(e) =>
                          setFormItem((prev) => ({
                            ...prev,
                            quantidade: Math.max(1, Number(e.target.value || 1)),
                          }))
                        }
                      />

                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          setFormItem((prev) => ({
                            ...prev,
                            quantidade: Number(prev.quantidade || 1) + 1,
                          }))
                        }
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Observação para a cozinha</Label>
                    <Textarea
                      value={formItem.observacaoItem}
                      onChange={(e) =>
                        setFormItem((prev) => ({
                          ...prev,
                          observacaoItem: e.target.value,
                        }))
                      }
                      placeholder="Ex.: sem cebola, carne mais passada, separar talher..."
                    />
                  </div>
                </div>
              </div>

              {/* LADO DIREITO: RESUMO DO PEDIDO (SIDEBAR) */}
              <aside className="lg:sticky lg:top-0 space-y-4">
                {itens.length > 0 ? (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-sm flex flex-col max-h-[60vh]">
                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 mb-4 flex items-center justify-between">
                      <span>Itens no Pedido</span>
                      <Badge className="bg-emerald-600 hover:bg-emerald-700">{itens.length}</Badge>
                    </div>
                    
                    <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1">
                      {itens.map((it) => (
                        <div
                          key={it.id}
                          className="flex flex-col gap-1 bg-white border border-emerald-100 rounded-xl p-3 text-xs shadow-sm hover:border-emerald-300 transition-all group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-slate-800 leading-tight">
                              {it.quantidade}x {getNomeItem(it)}
                            </span>
                            {it.usarPlano && (
                              <Badge className="h-4 px-1 text-[8px] bg-green-500 hover:bg-green-600 border-none font-black text-white shrink-0">PLANO</Badge>
                            )}
                            {it.tipoItem === "SALGADO" && (
                              <Badge variant="outline" className="h-4 px-1 text-[8px] border-slate-200 bg-slate-50 text-slate-600 font-black shrink-0">SALGADO</Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            {it.tamanhoLabel && it.tipoItem !== "SALGADO" && (
                              <Badge variant="secondary" className="text-[9px] h-3.5 px-1 font-medium uppercase tracking-tighter">{it.tamanhoLabel}</Badge>
                            )}
                          </div>

                          {it.tipoItem === "PERSONALIZADA" && (() => {
                            const partes = [
                              it.carboNome && it.carboGramas ? `${it.carboNome} ${it.carboGramas}g` : null,
                              it.proteinaNome && it.proteinaGramas ? `${it.proteinaNome} ${it.proteinaGramas}g` : null,
                              it.legumeNome && it.legumeGramas && !it.zerarLegume ? `${it.legumeNome} ${it.legumeGramas}g` : null,
                              it.feijaoNome && it.feijaoGramas && it.adicionarFeijao ? `${it.feijaoNome} ${it.feijaoGramas}g` : null,
                            ].filter(Boolean);
                            if (partes.length === 0) return null;
                            return (
                              <div className="text-[10px] text-slate-500 leading-relaxed mt-0.5">
                                {partes.map((p, i) => (
                                  <span key={i}>{p}{i < partes.length - 1 && <br />}</span>
                                ))}
                              </div>
                            );
                          })()}
                          
                          {it.destinatarioNome && it.destinatarioNome !== getNomeItem(it) && (
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1 italic mt-0.5">
                              <User className="h-2.5 w-2.5 opacity-60" />
                              {it.destinatarioNome}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    

                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-muted p-8 text-center bg-muted/5 flex flex-col items-center gap-3">
                    <div className="p-3 bg-muted/10 rounded-full">
                      <Plus className="h-6 w-6 text-muted-foreground opacity-40" />
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">O seu pedido aparecerá aqui à medida que você adicionar itens.</p>
                  </div>
                )}


              </aside>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t bg-muted/30 flex flex-row items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalNovoPedidoOpen(false)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button type="button" onClick={() => addPedidoNaLista(true)} className="rounded-xl shadow-lg">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Substituições da Marmita Opcional */}
      <Dialog open={modalTrocasOpen} onOpenChange={setModalTrocasOpen}>
        <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Substituições da Marmita</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Trocar carboidrato</Label>
                <Select
                  value={formItem.trocaCarboId || ""}
                  onValueChange={(v) => {
                    const item = carboidratos.find((o) => o.id === v);
                    setFormItem((prev) => ({
                      ...prev,
                      trocaCarboId: v,
                      trocaCarboNome: item?.nome || "",
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sem troca" />
                  </SelectTrigger>
                  <SelectContent>
                    {carboidratos.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {formItem.trocaCarboId ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-auto px-0 text-xs"
                    onClick={() =>
                      setFormItem((prev) => ({
                        ...prev,
                        trocaCarboId: "",
                        trocaCarboNome: "",
                      }))
                    }
                  >
                    Limpar troca
                  </Button>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>Trocar proteína</Label>
                <Select
                  value={formItem.trocaProteinaId || ""}
                  onValueChange={(v) => {
                    const item = proteinas.find((o) => o.id === v);
                    setFormItem((prev) => ({
                      ...prev,
                      trocaProteinaId: v,
                      trocaProteinaNome: item?.nome || "",
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sem troca" />
                  </SelectTrigger>
                  <SelectContent>
                    {proteinas.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {formItem.trocaProteinaId ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-auto px-0 text-xs"
                    onClick={() =>
                      setFormItem((prev) => ({
                        ...prev,
                        trocaProteinaId: "",
                        trocaProteinaNome: "",
                      }))
                    }
                  >
                    Limpar troca
                  </Button>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>Trocar legume</Label>
                <Select
                  value={formItem.trocaLegumeId || ""}
                  onValueChange={(v) => {
                    const item = legumes.find((o) => o.id === v);
                    setFormItem((prev) => ({
                      ...prev,
                      trocaLegumeId: v,
                      trocaLegumeNome: item?.nome || "",
                      zerarLegume: false,
                    }));
                  }}
                  disabled={formItem.zerarLegume}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        formItem.zerarLegume ? "Legume zerado" : "Sem troca"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {legumes.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {formItem.trocaLegumeId ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-auto px-0 text-xs"
                    onClick={() =>
                      setFormItem((prev) => ({
                        ...prev,
                        trocaLegumeId: "",
                        trocaLegumeNome: "",
                        zerarLegume: false,
                      }))
                    }
                  >
                    Limpar troca
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Checkbox
                checked={formItem.zerarLegume}
                onCheckedChange={(checked) =>
                  setFormItem((prev) => ({
                    ...prev,
                    zerarLegume: !!checked,
                    trocaLegumeId: checked ? "" : prev.trocaLegumeId,
                    trocaLegumeNome: checked ? "" : prev.trocaLegumeNome,
                  }))
                }
              />
              <Label className="m-0">Zerar legume</Label>
            </div>

            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Checkbox
                checked={formItem.adicionarFeijao}
                onCheckedChange={(checked) =>
                  setFormItem((prev) => ({
                    ...prev,
                    adicionarFeijao: !!checked,
                  }))
                }
              />
              <Label className="m-0">Adicionar feijão</Label>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" onClick={() => setModalTrocasOpen(false)}>
              Confirmar Substituições
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
