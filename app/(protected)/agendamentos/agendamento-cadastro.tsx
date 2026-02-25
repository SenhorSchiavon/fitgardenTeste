"use client";

import { useEffect, useMemo, useState } from "react";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Minus,
  Trash,
  Send,
  CalendarIcon,
  MapPin,
  UserPlus,
} from "lucide-react";
import { PlanoClienteVinculo, usePlanosCliente } from "@/hooks/usePlanosCliente";
import { ClienteFormDialog } from "@/components/clientes/ClienteFormDialog";
import { useClientes } from "@/hooks/useClientes";

type PedidoTipo = "ENTREGA" | "RETIRADA";

type FormaPagamento =
  | "DINHEIRO"
  | "CREDITO"
  | "DEBITO"
  | "PIX"
  | "LINK"
  | "VOUCHER"
  | "VOUCHER_TAXA_DINHEIRO"
  | "VOUCHER_TAXA_CARTAO"
  | "VOUCHER_TAXA_PIX"
  | "PLANO";

type EnderecoCliente = {
  id?: number;
  principal: boolean;
  endereco?: string | null;
  cep?: string | null;
  uf?: string | null;
  cidade?: string | null;
  bairro?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
};

type ClienteSelect = {
  id: string;
  nome: string;
  telefone: string;
  endereco?: string;
  enderecos?: EnderecoCliente[];
};
type Cliente = {
  id: string;
  nome: string;
  telefone: string;
  enderecos: EnderecoCliente[];
};

type Opcao = {
  id: string;
  nome: string;
  categoria: string;
  tamanhos: {
    tamanhoId: string;
    tamanhoLabel: string;
    valorUnitario: number;
    valor10: number;
    valor20: number;
    valor40: number;
  }[];
}
type ItemPedido = {
  id: string;
  opcaoId: string;
  opcaoNome: string;
  tamanhoId: string;
  tamanhoLabel: string;
  quantidade: number;
  precoUnit: number;
  destinatarioNome?: string;
};

type HorarioIntervalo = {
  inicio: string;
  fim: string;
};

function formatEndereco(e?: any) {
  if (!e) return "";
  if (e.endereco?.trim()) return String(e.endereco).trim();

  const parts = [
    e.logradouro,
    e.numero ? `nº ${e.numero}` : null,
    e.bairro,
    e.cidade ? `${e.cidade}${e.uf ? `/${e.uf}` : ""}` : null,
    e.cep ? `CEP ${e.cep}` : null,
    e.complemento,
  ]
    .filter(Boolean)
    .map((x) => String(x).trim())
    .filter(Boolean);

  return parts.join(" • ");
}

function formatDatePtBr(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function onlyDigits(value: string) {
  return (value || "").replace(/\D/g, "");
}

function normalizePhoneToWaMe(phone: string) {
  const digits = onlyDigits(phone);
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

function buildWhatsappMessage(params: {
  clienteNome: string;
  data: Date;
  faixaHorario: string;
  tipo: PedidoTipo;
  endereco: string;
  itens: ItemPedido[];
  total: number;
  observacoes?: string;
}) {
  // Agrupa itens por destinatário
  const grupos = new Map<string, ItemPedido[]>();
  for (const it of params.itens) {
    const key = (it.destinatarioNome || params.clienteNome || "").trim() || "Sem nome";
    const arr = grupos.get(key) || [];
    arr.push(it);
    grupos.set(key, arr);
  }

  const linhasItens =
    params.itens.length === 0
      ? "- (sem itens)"
      : Array.from(grupos.entries())
        .map(([dest, items]) => {
          const linhas = items
            .map(
              (it) =>
                `- ${it.quantidade}x ${it.opcaoNome} (${it.tamanhoLabel}) — R$ ${(
                  it.precoUnit * it.quantidade
                ).toFixed(2)}`,
            )
            .join("\n");
          // Se só tem 1 grupo e o destinatário é o próprio cliente, não precisa “Para:”
          const showHeader =
            grupos.size > 1 || (dest.trim() && dest.trim() !== params.clienteNome.trim());
          return showHeader ? `Para: ${dest}\n${linhas}` : linhas;
        })
        .join("\n\n");

  const obs = (params.observacoes || "").trim();
  const blocoObs = obs ? `\n\nObservações:\n${obs}` : "";

  return `Olá, ${params.clienteNome}! ☀️

Seu agendamento foi confirmado:
• Tipo: ${params.tipo}
• Data: ${formatDatePtBr(params.data)}
• Faixa: ${params.faixaHorario}h
• Endereço: ${params.endereco || "-"}

Itens:
${linhasItens}

Total: R$ ${params.total.toFixed(2)}${blocoObs}`;
}

type AgendamentoEditData = {
  agendamentoId: number;
  clienteId: string;
  tipo: PedidoTipo;
  data: Date | string;
  faixaHorario: string;
  endereco: string;
  observacoes?: string | null;
  formaPagamento?: FormaPagamento | string | null;
  voucherCodigo?: string | null;
  itens: Array<{
    opcaoId: string | number;
    opcaoNome?: string | null;
    tamanhoId: string | number;
    tamanhoLabel?: string | null;
    quantidade: number;
    precoUnit?: number | null;
    destinatarioNome?: string | null;
  }>;
};

type OnCreateAgendamento = (payload: {
  clienteId: string;
  tipo: PedidoTipo;
  data: Date;
  faixaHorario: string;
  endereco: string;
  observacoes?: string;
  formaPagamento: FormaPagamento;
  voucherCodigo?: string;
  itens: {
    opcaoId: string;
    tamanhoId: string;
    quantidade: number;
    destinatarioNome?: string;
  }[];
}) => Promise<{ pedidoId: number; agendamentoId: number }>;

type OnUpdateAgendamento = (
  agendamentoId: number,
  payload: {
    clienteId?: string;
    tipo: PedidoTipo;
    data: Date;
    faixaHorario: string;
    endereco: string;
    observacoes?: string | null;
    formaPagamento: FormaPagamento;
    voucherCodigo?: string;
    itens: {
      opcaoId: string;
      tamanhoId: string;
      quantidade: number;
      destinatarioNome?: string;
    }[];
  },
) => Promise<any>;

function mapFormaPagamentoComTaxa(
  fp: FormaPagamento,
  taxa: "DINHEIRO" | "CARTAO" | "PIX",
) {
  if (fp !== "VOUCHER") return fp;
  if (taxa === "DINHEIRO") return "VOUCHER_TAXA_DINHEIRO";
  if (taxa === "PIX") return "VOUCHER_TAXA_PIX";
  return "VOUCHER_TAXA_CARTAO";
}

function isVoucherForma(fp: FormaPagamento) {
  return (
    fp === "VOUCHER" ||
    fp === "VOUCHER_TAXA_DINHEIRO" ||
    fp === "VOUCHER_TAXA_CARTAO" ||
    fp === "VOUCHER_TAXA_PIX"
  );
}
function getPrecoUnitPorQuantidade(tamanho: any, quantidade: number) {
  const qtd = Math.max(1, Number(quantidade || 1));

  const list = Array.isArray(tamanho?.precosPorQtd) ? tamanho.precosPorQtd : null;
  if (list && list.length) {
    const ordenado = [...list].sort((a, b) => Number(a.min) - Number(b.min));
    let escolhido = ordenado[0]?.preco ?? tamanho?.preco ?? 0;

    for (const regra of ordenado) {
      if (qtd >= Number(regra.min)) escolhido = Number(regra.preco);
    }
    return Number(escolhido) || 0;
  }

  const base = Number(tamanho?.preco ?? 0);

  const p10 = tamanho?.precoAcima10 != null ? Number(tamanho.precoAcima10) : null;
  const p20 = tamanho?.precoAcima20 != null ? Number(tamanho.precoAcima20) : null;
  const p40 = tamanho?.precoAcima40 != null ? Number(tamanho.precoAcima40) : null;

  if (qtd >= 40 && p40 != null) return p40;
  if (qtd >= 20 && p20 != null) return p20;
  if (qtd >= 10 && p10 != null) return p10;

  return base;
}
export function NovoAgendamentoDialog({
  open,
  onOpenChange,
  clientes,
  opcoes,
  defaultDate,
  onCreateAgendamento,
  mode = "create",
  initialData,
  onUpdateAgendamento,
  onClienteCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientes: Cliente[];
  opcoes: Opcao[];
  defaultDate: Date;
  onCreateAgendamento?: OnCreateAgendamento;

  mode?: "create" | "edit";
  initialData?: AgendamentoEditData | null;
  onUpdateAgendamento?: OnUpdateAgendamento;
  onClienteCreated?: () => Promise<void> | void;
}) {
  const { createCliente, saving: savingClienteHook } = useClientes();

  const [tipo, setTipo] = useState<PedidoTipo>("ENTREGA");
  const [data, setData] = useState<Date>(defaultDate);
  const [horario, setHorario] = useState<HorarioIntervalo>({
    inicio: "14:00",
    fim: "14:30",
  });
  const [voucherCodigo, setVoucherCodigo] = useState("");
  const [taxaPagaEm, setTaxaPagaEm] = useState<"DINHEIRO" | "CARTAO" | "PIX">(
    "DINHEIRO",
  );
  const [clientesLocal, setClientesLocal] = useState<Cliente[]>(clientes || []);

  useEffect(() => {
    const incoming = clientes || [];
    setClientesLocal((prev) => {
      const map = new Map<string, Cliente>();
      for (const c of prev) map.set(String(c.id), c);
      for (const c of incoming) map.set(String(c.id), c);
      return Array.from(map.values());
    });
  }, [clientes]);

  const [clienteId, setClienteId] = useState<string>("");
  const clienteSelecionado = useMemo(
    () => clientesLocal.find((c) => String(c.id) === String(clienteId)) || null,
    [clientesLocal, clienteId],
  );

  const [enderecoClienteId, setEnderecoClienteId] = useState<string>("");
  const [endereco, setEndereco] = useState<string>("");
  const [observacoes, setObservacoes] = useState<string>("");
  const { listPlanosDoCliente } = usePlanosCliente();

  const [planosCliente, setPlanosCliente] = useState<PlanoClienteVinculo[]>([]);
  const [loadingPlanosCliente, setLoadingPlanosCliente] = useState(false);
  const [erroPlanosCliente, setErroPlanosCliente] = useState<string | null>(null);
  const [formaPagamento, setFormaPagamento] =
    useState<FormaPagamento>("DINHEIRO");

  const [itens, setItens] = useState<ItemPedido[]>([]);

  // ✅ agora o novoItem tem destinatarioNome
  const [novoItem, setNovoItem] = useState<{
    opcaoId: string;
    tamanhoId: string;
    quantidade: number;
    destinatarioNome: string;
  }>({ opcaoId: "", tamanhoId: "", quantidade: 1, destinatarioNome: "" });

  const [isSaving, setIsSaving] = useState(false);
  const [confirmado, setConfirmado] = useState(false);
  const [faixaHorario, setFaixaHorario] = useState<string>("14:00-14:30");

  useEffect(() => {
    setHorario(faixaToIntervalo(faixaHorario));
  }, [faixaHorario]);

  const [clienteDialogOpen, setClienteDialogOpen] = useState(false);

  const tamanhosDisponiveis = useMemo(() => {
    const opcao = opcoes.find((o) => o.id === novoItem.opcaoId);
    return opcao?.tamanhos || [];
  }, [opcoes, novoItem.opcaoId]);

  const total = useMemo(() => {
    return itens.reduce((acc, it) => acc + it.precoUnit * it.quantidade, 0);
  }, [itens]);
  useEffect(() => {
  }, [novoItem.opcaoId, opcoes, tamanhosDisponiveis]);
  function resetForm() {
    setTipo("ENTREGA");
    setData(defaultDate);
    setHorario({ inicio: "14:00", fim: "14:30" });
    setEndereco("");
    setObservacoes("");
    setFormaPagamento("DINHEIRO");
    setVoucherCodigo("");
    setTaxaPagaEm("DINHEIRO");
    setItens([]);
    setNovoItem({
      opcaoId: "",
      tamanhoId: "",
      quantidade: 1,
      destinatarioNome: clienteSelecionado?.nome || "",
    });
    setIsSaving(false);
    setConfirmado(false);
  }

  const enderecosDoCliente = useMemo(() => {
    const list = clienteSelecionado?.enderecos || [];
    return Array.isArray(list) ? list : [];
  }, [clienteSelecionado]);

  const enderecoSelecionadoObj = useMemo(() => {
    if (!enderecosDoCliente.length) return null;

    if (enderecoClienteId) {
      return (
        enderecosDoCliente.find((e) => String(e.id) === String(enderecoClienteId)) ||
        null
      );
    }

    return enderecosDoCliente.find((e) => e.principal) || enderecosDoCliente[0] || null;
  }, [enderecosDoCliente, enderecoClienteId]);

  const [enderecoSelecionadoId, setEnderecoSelecionadoId] = useState<string>("");
  function precoPorQtd(t: { valorUnitario: number; valor10: number; valor20: number; valor40: number }, qtd: number) {
    if (qtd >= 40) return t.valor40;
    if (qtd >= 20) return t.valor20;
    if (qtd >= 10) return t.valor10;
    return t.valorUnitario;
  }
  function pickEnderecoById(endId: string) {
    setEnderecoSelecionadoId(endId);

    const lista = clienteSelecionado?.enderecos || [];
    const escolhido = lista.find((e) => String(e.id) === String(endId)) || null;
    if (!escolhido) return;

    const texto = escolhido.endereco?.trim()
      ? String(escolhido.endereco).trim()
      : formatEndereco(escolhido);

    setEndereco(texto);
  }

  function onPickCliente(id: string) {
    setClienteId(String(id));

    const c = clientesLocal.find((x) => String(x.id) === String(id));
    if (!c) return;

    const enderecos = Array.isArray(c.enderecos) ? c.enderecos : [];
    const principal = enderecos.find((e) => e.principal) || enderecos[0] || null;

    // ✅ default do destinatário = nome do cliente
    setNovoItem((prev) => ({ ...prev, destinatarioNome: c.nome }));

    setEnderecoClienteId(principal?.id != null ? String(principal.id) : "");
    setEndereco(principal ? formatEndereco(principal) : "");
  }

  useEffect(() => {
    if (!enderecoSelecionadoObj) return;
    setEndereco(formatEndereco(enderecoSelecionadoObj));
  }, [enderecoSelecionadoObj]);

  function addItem() {
    const opcao = opcoes.find((o) => o.id === novoItem.opcaoId);
    if (!opcao) return;

    const tamanho = opcao.tamanhos.find((t) => t.tamanhoId === novoItem.tamanhoId);
    if (!tamanho) return;

    const newId = `ITEM_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const qtdFinal = Math.max(1, novoItem.quantidade || 1);
    const qtd = Math.max(1, novoItem.quantidade || 1);
    const unit = precoPorQtd(tamanho, qtd);
    const destinatarioFinal = (novoItem.destinatarioNome || "").trim();

    setItens((prev) => [
      ...prev,
      {
        id: newId,
        opcaoId: opcao.id,
        opcaoNome: opcao.nome,
        tamanhoId: tamanho.tamanhoId,
        tamanhoLabel: tamanho.tamanhoLabel,
        quantidade: qtdFinal,
        precoUnit: unit,
        destinatarioNome: destinatarioFinal ? destinatarioFinal : (clienteSelecionado?.nome || ""),
      },
    ]);

    // mantém o destinatário preenchido (pra facilitar adicionar vários pro mesmo nome)
    setNovoItem((prev) => ({
      ...prev,
      opcaoId: "",
      tamanhoId: "",
      quantidade: 1,
    }));
  }

  function removeItem(id: string) {
    setItens((prev) => prev.filter((x) => x.id !== id));
  }

  function changeItemQty(id: string, delta: number) {
    setItens((prev) =>
      prev.map((x) => {
        if (x.id !== id) return x;

        const novaQtd = Math.max(1, x.quantidade + delta);

        const opcao = opcoes.find((o) => String(o.id) === String(x.opcaoId));
        const tamanho = opcao?.tamanhos?.find((t) => String(t.tamanhoId) === String(x.tamanhoId));

        const novoPrecoUnit = tamanho
          ? precoPorQtd(tamanho, novaQtd)
          : x.precoUnit;

        return { ...x, quantidade: novaQtd, precoUnit: novoPrecoUnit };
      }),
    );
  }

  useEffect(() => {
    let alive = true;

    async function run() {
      if (!clienteId) {
        setPlanosCliente([]);
        setErroPlanosCliente(null);
        return;
      }

      setLoadingPlanosCliente(true);
      setErroPlanosCliente(null);

      try {
        const data = await listPlanosDoCliente(Number(clienteId));
        if (!alive) return;
        setPlanosCliente(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (!alive) return;
        setPlanosCliente([]);
        setErroPlanosCliente(e?.message || "Falha ao carregar planos");
      } finally {
        if (!alive) return;
        setLoadingPlanosCliente(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [clienteId, listPlanosDoCliente]);

  useEffect(() => {
    if (!open) return;
    if (mode !== "edit") return;
    if (!initialData) return;

    setClienteId(String(initialData.clienteId));

    setTipo(initialData.tipo);
    const d = initialData.data instanceof Date ? initialData.data : new Date(initialData.data);
    setData(d);

    const faixa = (initialData.faixaHorario || "14:00-14:30").trim();
    setFaixaHorario(faixa);
    setHorario(splitFaixaHorario(initialData.faixaHorario || "14:00-14:30"));
    setEndereco(initialData.endereco || "");
    setObservacoes((initialData.observacoes || "") as any);

    const fp = (initialData.formaPagamento || "DINHEIRO") as any as FormaPagamento;
    setFormaPagamento(fp);

    setVoucherCodigo((initialData.voucherCodigo || "") as any);

    const itensPrefill: ItemPedido[] = (initialData.itens || []).map((it) => {
      const opcaoId = String(it.opcaoId);
      const tamanhoId = String(it.tamanhoId);

      const opcao = opcoes.find((o) => String(o.id) === opcaoId) || null;
      const tamanho = opcao?.tamanhos.find((t) => String(t.tamanhoId) === tamanhoId) || null;

      const precoUnit =
        it.precoUnit != null
          ? Number(it.precoUnit)
          : tamanho
            ? precoPorQtd(tamanho, Number(it.quantidade || 1))
            : 0;
      const opcaoNome = (it.opcaoNome as any) || opcao?.nome || "-";
      const tamanhoLabel = (it.tamanhoLabel as any) || tamanho?.tamanhoLabel || "-";

      return {
        id: `ITEM_EDIT_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        opcaoId,
        opcaoNome,
        tamanhoId,
        tamanhoLabel,
        quantidade: Math.max(1, Number(it.quantidade || 1)),
        precoUnit,
        destinatarioNome: (it.destinatarioNome as any) || "",
      };
    });

    setItens(itensPrefill);

    // default destinatário do próximo item
    setNovoItem((prev) => ({
      ...prev,
      destinatarioNome: itensPrefill[0]?.destinatarioNome?.trim()
        ? String(itensPrefill[0].destinatarioNome)
        : "",
    }));

    setConfirmado(false);
  }, [open, mode, initialData, opcoes]);

  async function confirmarAgendamento() {
    if (!clienteSelecionado) return;
    if (!endereco.trim() && tipo === "ENTREGA") return;
    if (itens.length === 0) return;

    setIsSaving(true);
    const faixa = `${horario.inicio}-${horario.fim}`;

    try {
      const formaFinal = mapFormaPagamentoComTaxa(formaPagamento, taxaPagaEm);

      if (mode === "edit") {
        if (!initialData?.agendamentoId) return;
        if (!onUpdateAgendamento) return;

        if (
          formaFinal === "VOUCHER_TAXA_PIX" ||
          formaFinal === "VOUCHER_TAXA_CARTAO" ||
          formaFinal === "PLANO" ||
          isVoucherForma(formaFinal)
        ) {
          throw new Error(
            "Por enquanto não dá pra mudar o pagamento para Voucher/Plano na edição. Crie um novo agendamento ou ajuste o backend.",
          );
        }

        await onUpdateAgendamento(initialData.agendamentoId, {
          tipo,
          data,
          faixaHorario: faixa,
          endereco,
          observacoes: (observacoes || "").trim() ? observacoes : null,
          formaPagamento: formaFinal as any,
          voucherCodigo: undefined,
          itens: itens.map((it) => ({
            opcaoId: String(it.opcaoId),
            tamanhoId: String(it.tamanhoId),
            quantidade: Number(it.quantidade),
            destinatarioNome: (it.destinatarioNome || "").trim() || undefined,
          })),
        });

        setConfirmado(true);
        return;
      }

      if (onCreateAgendamento) {
        await onCreateAgendamento({
          clienteId,
          tipo,
          data,
          faixaHorario: faixa,
          endereco,
          observacoes,
          formaPagamento: formaFinal as any,
          voucherCodigo: formaPagamento === "VOUCHER" ? voucherCodigo.trim() : undefined,
          itens: itens.map((it) => ({
            opcaoId: it.opcaoId,
            tamanhoId: it.tamanhoId,
            quantidade: it.quantidade,
            destinatarioNome: (it.destinatarioNome || "").trim() || undefined,
          })),
        });
      } else {
        await new Promise((r) => setTimeout(r, 400));
      }

      setConfirmado(true);
    } finally {
      setIsSaving(false);
    }
  }

  function enviarWhatsAppConfirmacao() {
    if (!clienteSelecionado) return;

    const faixa = `${horario.inicio}-${horario.fim}`;
    const waPhone = normalizePhoneToWaMe(clienteSelecionado.telefone);

    const msg = buildWhatsappMessage({
      clienteNome: clienteSelecionado.nome,
      data,
      faixaHorario: faixa,
      tipo,
      endereco: tipo === "ENTREGA" ? endereco : "-",
      itens,
      total,
      observacoes,
    });

    const url = `https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function pad2(n: number) {
    return String(n).padStart(2, "0");
  }

  function toMin(hhmm: string) {
    const [h, m] = (hhmm || "00:00").split(":").map((x) => Number(x));
    return (h || 0) * 60 + (m || 0);
  }

  function fromMin(min: number) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${pad2(h)}:${pad2(m)}`;
  }

  function gerarHorarios30(
    { start = "06:00", end = "22:00" }: { start?: string; end?: string } = {},
  ) {
    const ini = toMin(start);
    const fim = toMin(end);

    const arr: string[] = [];
    for (let t = ini; t <= fim; t += 30) arr.push(fromMin(t));
    return arr;
  }

  function splitFaixaHorario(faixa: string): HorarioIntervalo {
    const raw = (faixa || "").trim();
    if (raw.includes("-") && raw.includes(":")) {
      const [inicio, fim] = raw.split("-").map((s) => s.trim());
      return { inicio: inicio || "14:00", fim: fim || "14:30" };
    }
    return { inicio: "14:00", fim: "14:30" };
  }

  const horarios = useMemo(() => gerarHorarios30({ start: "06:00", end: "22:00" }), []);

  const horariosFimDisponiveis = useMemo(() => {
    const ini = toMin(horario.inicio);
    return horarios.filter((h) => toMin(h) > ini);
  }, [horarios, horario.inicio]);

  useEffect(() => {
    const ini = toMin(horario.inicio);
    const fim = toMin(horario.fim);

    if (fim > ini) return;

    const prox = horarios.find((h) => toMin(h) > ini) || horario.fim;
    setHorario((prev) => ({ ...prev, fim: prox }));
  }, [horario.inicio, horarios, horario.fim]);

  function faixaToIntervalo(faixa: string): HorarioIntervalo {
    const [inicio, fim] = (faixa || "").split("-").map((s) => s.trim());
    return { inicio: inicio || "14:00", fim: fim || "14:30" };
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) resetForm();
      }}
    >
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Editar Agendamento" : "Novo Agendamento"}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)] gap-6">
            <div className="space-y-4 min-w-0">
              <Tabs defaultValue="cliente">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="cliente">Cliente</TabsTrigger>
                  <TabsTrigger value="itens">Itens</TabsTrigger>
                </TabsList>

                {/* TAB: CLIENTE */}
                <TabsContent value="cliente" className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cliente</Label>

                      <div className="flex gap-2">
                        <div className="flex-1 min-w-0">
                          <Select value={clienteId} onValueChange={onPickCliente}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecione um cliente" />
                            </SelectTrigger>
                            <SelectContent>
                              {clientesLocal.map((c) => (
                                <SelectItem key={String(c.id)} value={String(c.id)}>
                                  {c.nome} — {c.telefone}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setClienteDialogOpen(true)}
                          disabled={isSaving || savingClienteHook || mode === "edit"}
                          title="Cadastrar cliente"
                          className="shrink-0"
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Cadastrar
                        </Button>
                      </div>

                      {mode === "edit" && (
                        <div className="text-xs text-muted-foreground">
                          (No editar, cliente fica travado. Se quiser trocar cliente no editar,
                          precisa ajustar o backend.)
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select value={tipo} onValueChange={(v) => setTipo(v as PedidoTipo)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ENTREGA">Entrega</SelectItem>
                          <SelectItem value="RETIRADA">Retirada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      placeholder="Ex: sem cebola, deixar na portaria, etc."
                    />
                  </div>

                  {/* resto igual... */}
                  <div className="border-t pt-4 space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-6 items-start">
                      <div className="space-y-2 lg:shrink-0">
                        <Label className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4" />
                          Data
                        </Label>

                        <div className="rounded-md border p-2 w-fit">
                          <Calendar
                            mode="single"
                            selected={data}
                            onSelect={(d) => d && setData(d)}
                            locale={ptBR}
                          />
                        </div>
                      </div>

                      <div className="space-y-4 min-w-0">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                          <div className="space-y-2 min-w-0">
                            <Label>Horário inicial</Label>
                            <Select
                              value={horario.inicio}
                              onValueChange={(v) => setHorario((h) => ({ ...h, inicio: v }))}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecione" />
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

                          <div className="space-y-2 min-w-0">
                            <Label>Horário final</Label>
                            <Select
                              value={horario.fim}
                              onValueChange={(v) => setHorario((h) => ({ ...h, fim: v }))}
                              disabled={!horario.inicio}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>

                              <SelectContent>
                                {horariosFimDisponiveis.map((h) => (
                                  <SelectItem key={h} value={h}>
                                    {h}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <div className="text-xs text-muted-foreground">
                              Intervalos de 30 em 30 minutos (fim sempre depois do início).
                            </div>
                          </div>
                        </div>

                        {tipo === "ENTREGA" && (
                          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            <div className="space-y-2 min-w-0">
                              <Label>Endereço do Cliente</Label>

                              <Select
                                value={
                                  enderecoClienteId ||
                                  (enderecoSelecionadoObj?.id != null
                                    ? String(enderecoSelecionadoObj.id)
                                    : "")
                                }
                                onValueChange={(v) => setEnderecoClienteId(String(v))}
                                disabled={!clienteSelecionado || enderecosDoCliente.length === 0}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue
                                    placeholder={
                                      !clienteSelecionado
                                        ? "Selecione um cliente"
                                        : enderecosDoCliente.length === 0
                                          ? "Cliente sem endereços cadastrados"
                                          : "Selecione um endereço"
                                    }
                                  />
                                </SelectTrigger>

                                <SelectContent>
                                  {enderecosDoCliente.map((e, idx) => {
                                    const val = String(e.id ?? idx);
                                    return (
                                      <SelectItem key={val} value={val}>
                                        {e.principal ? "Principal — " : "Alternativo — "}
                                        {formatEndereco(e) || "(endereço vazio)"}
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>

                              <div className="text-xs text-muted-foreground">
                                Dá pra ajustar manualmente no campo ao lado antes de confirmar.
                              </div>
                            </div>

                            <div className="space-y-2 min-w-0">
                              <Label className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                Endereço (Entrega)
                              </Label>

                              <Textarea
                                value={endereco}
                                onChange={(e) => setEndereco(e.target.value)}
                                placeholder="Rua, número, bairro..."
                                rows={3}
                                className="w-full min-h-[96px] resize-y"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* TAB: ITENS */}
                <TabsContent value="itens" className="space-y-4 pt-4">
                  {/* ✅ campo destinatário */}
                  <div className="space-y-2">
                    <Label>Para (destinatário)</Label>
                    <Input
                      value={novoItem.destinatarioNome}
                      onChange={(e) =>
                        setNovoItem((prev) => ({ ...prev, destinatarioNome: e.target.value }))
                      }
                      placeholder={clienteSelecionado?.nome ? `Ex: ${clienteSelecionado.nome}` : "Ex: João"}
                    />
                    <div className="text-xs text-muted-foreground">
                      Quem vai receber esse item. Por padrão fica o nome do cliente, mas dá pra trocar
                      (ex: “João”, “Maria”, “Pessoal do Financeiro”).
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Opção</Label>
                      <Select
                        value={novoItem.opcaoId}
                        onValueChange={(v) =>
                          setNovoItem((prev) => ({ ...prev, opcaoId: v, tamanhoId: "" }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione uma opção" />
                        </SelectTrigger>
                        <SelectContent>
                          {opcoes.map((o) => (
                            <SelectItem key={o.id} value={o.id}>
                              {o.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Tamanho</Label>
                      <Select
                        value={novoItem.tamanhoId}
                        onValueChange={(v) => setNovoItem((prev) => ({ ...prev, tamanhoId: v }))}
                        disabled={!novoItem.opcaoId}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione um tamanho" />
                        </SelectTrigger>
                        <SelectContent>
                          {tamanhosDisponiveis.map((t) => (
                            <SelectItem key={t.tamanhoId} value={t.tamanhoId}>
                              {t.tamanhoLabel} — R$ {Number(precoPorQtd(t, novoItem.quantidade || 1) ?? 0).toFixed(2)}                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Label className="whitespace-nowrap">Quantidade</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          setNovoItem((prev) => ({
                            ...prev,
                            quantidade: Math.max(1, (prev.quantidade || 1) - 1),
                          }))
                        }
                      >
                        <Minus className="h-4 w-4" />
                      </Button>

                      <Input
                        type="number"
                        min={1}
                        className="w-20 text-center"
                        value={novoItem.quantidade || 1}
                        onChange={(e) =>
                          setNovoItem((prev) => ({
                            ...prev,
                            quantidade: Number.parseInt(e.target.value || "1", 10) || 1,
                          }))
                        }
                      />

                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          setNovoItem((prev) => ({ ...prev, quantidade: (prev.quantidade || 1) + 1 }))
                        }
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button
                      type="button"
                      onClick={addItem}
                      disabled={!novoItem.opcaoId || !novoItem.tamanhoId}
                    >
                      Adicionar Item
                    </Button>
                  </div>

                  <div className="border rounded-md overflow-hidden max-h-[45vh] overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 z-10 bg-background">
                        <TableRow>
                          <TableHead>Para</TableHead>
                          <TableHead>Item</TableHead>
                          <TableHead>Tamanho</TableHead>
                          <TableHead>Qtd</TableHead>
                          <TableHead>Unit.</TableHead>
                          <TableHead>Subtotal</TableHead>
                          <TableHead className="w-[60px]"></TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {itens.map((it) => (
                          <TableRow key={it.id}>
                            <TableCell className="max-w-[180px] truncate">
                              {(it.destinatarioNome || "").trim() || clienteSelecionado?.nome || "-"}
                            </TableCell>
                            <TableCell>{it.opcaoNome}</TableCell>
                            <TableCell>{it.tamanhoLabel}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => changeItemQty(it.id, -1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="min-w-[18px] text-center">{it.quantidade}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => changeItemQty(it.id, 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>R$ {it.precoUnit.toFixed(2)}</TableCell>
                            <TableCell>R$ {(it.precoUnit * it.quantidade).toFixed(2)}</TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeItem(it.id)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}

                        {itens.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-6">
                              Nenhum item adicionado
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* COLUNA DIREITA (igual, sem mexer) */}
            <div className="space-y-4 min-w-0">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Resumo</div>
                  {confirmado ? (
                    <Badge className="bg-emerald-600 text-white">Confirmado</Badge>
                  ) : (
                    <Badge variant="outline">Rascunho</Badge>
                  )}
                </div>

                <div className="text-sm text-muted-foreground space-y-1">
                  <div>
                    <span className="font-medium text-foreground">Data:</span>{" "}
                    {formatDatePtBr(data)}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Faixa:</span>{" "}
                    {horario.inicio} - {horario.fim}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Tipo:</span> {tipo}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Cliente:</span>{" "}
                    {clienteSelecionado ? clienteSelecionado.nome : "-"}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Telefone:</span>{" "}
                    {clienteSelecionado ? clienteSelecionado.telefone : "-"}
                  </div>

                  <div className="border-t pt-3 mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">Plano:</span>

                      {loadingPlanosCliente ? (
                        <Badge variant="outline">Carregando...</Badge>
                      ) : planosCliente.length > 0 ? (
                        <Badge className="bg-blue-600 text-white">Tem plano</Badge>
                      ) : (
                        <Badge variant="outline">Sem plano</Badge>
                      )}
                    </div>

                    {!!erroPlanosCliente && (
                      <div className="text-xs text-red-600">{erroPlanosCliente}</div>
                    )}

                    {planosCliente.length > 0 && (
                      <div className="text-xs text-muted-foreground space-y-1">
                        {planosCliente.map((pc) => (
                          <div key={pc.id} className="flex justify-between gap-3">
                            <span className="truncate">
                              {pc.plano?.nome?.trim() || `Plano #${pc.planoId}`}{" "}
                              {pc.plano?.tamanho?.pesagemGramas
                                ? `(${pc.plano.tamanho.pesagemGramas}g)`
                                : ""}
                            </span>

                            <span className="shrink-0">
                              {pc.saldoUnidades != null ? `${pc.saldoUnidades} un.` : ""}
                              {pc.saldoEntregas != null ? ` • ${pc.saldoEntregas} ent.` : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="line-clamp-2">
                    <span className="font-medium text-foreground">Endereço:</span>{" "}
                    {tipo === "ENTREGA" ? endereco || "-" : "(retirada)"}
                  </div>

                  <div className="border-t pt-3 mt-2 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Itens:</span>
                      <span>{itens.reduce((acc, it) => acc + it.quantidade, 0)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>R$ {total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-4 space-y-3">
                  <div className="font-medium">Pagamento</div>

                  <div className="space-y-2">
                    <Label>Forma</Label>
                    <Select
                      value={formaPagamento}
                      onValueChange={(v) => setFormaPagamento(v as FormaPagamento)}
                      disabled={mode === "edit"}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                        <SelectItem value="PIX">PIX</SelectItem>
                        <SelectItem value="DEBITO">Débito</SelectItem>
                        <SelectItem value="CREDITO">Crédito</SelectItem>
                        <SelectItem value="LINK">Link</SelectItem>
                        <SelectItem value="VOUCHER">Voucher</SelectItem>
                        <SelectItem value="PLANO">Plano (saldo)</SelectItem>
                      </SelectContent>
                    </Select>

                    {mode === "edit" && (
                      <div className="text-xs text-muted-foreground">
                        (No editar, pagamento está travado pra não quebrar regra de voucher/plano.)
                      </div>
                    )}
                  </div>

                  {formaPagamento === "VOUCHER" && (
                    <div className="space-y-3 pt-2">
                      <div className="space-y-2">
                        <Label>Código do voucher</Label>
                        <Input
                          value={voucherCodigo}
                          onChange={(e) => setVoucherCodigo(e.target.value)}
                          placeholder="Ex: FIT10"
                          disabled={mode === "edit"}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Taxa de entrega paga em</Label>
                        <Select
                          value={taxaPagaEm}
                          onValueChange={(v) => setTaxaPagaEm(v as any)}
                          disabled={mode === "edit"}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                            <SelectItem value="PIX">PIX</SelectItem>
                            <SelectItem value="CARTAO">Cartão</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="text-xs text-muted-foreground">
                          Isso vira VOUCHER_TAXA_* no backend.
                        </div>
                      </div>
                    </div>
                  )}

                  {formaPagamento === "PLANO" && (
                    <div className="text-xs text-muted-foreground pt-2">
                      O backend debita unidades/entregas do plano do cliente. (No editar fica travado.)
                    </div>
                  )}

                  {formaPagamento === "LINK" && (
                    <div className="text-xs text-muted-foreground pt-2">
                      (Depois você pode gerar link de pagamento e salvar no backend.)
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Fechar
          </Button>

          {!confirmado ? (
            <Button
              onClick={confirmarAgendamento}
              disabled={
                isSaving ||
                !clienteId ||
                itens.length === 0 ||
                (tipo === "ENTREGA" && !endereco.trim()) ||
                (formaPagamento === "VOUCHER" && !voucherCodigo.trim()) ||
                (mode === "edit" && !initialData?.agendamentoId)
              }
            >
              {isSaving
                ? mode === "edit"
                  ? "Salvando..."
                  : "Confirmando..."
                : mode === "edit"
                  ? "Salvar Alterações"
                  : "Confirmar Agendamento"}
            </Button>
          ) : (
            <Button onClick={enviarWhatsAppConfirmacao} disabled={!clienteSelecionado}>
              <Send className="mr-2 h-4 w-4" /> Enviar WhatsApp
            </Button>
          )}
        </DialogFooter>

        <ClienteFormDialog
          open={clienteDialogOpen}
          onOpenChange={setClienteDialogOpen}
          title="Novo Cliente"
          saving={isSaving || savingClienteHook}
          onSubmit={async (payload: any) => {
            const created = await createCliente(payload);

            const createdId = String(
              (created as any)?.id ??
              (created as any)?.cliente?.id ??
              (created as any)?.data?.id ??
              "",
            );

            if (createdId) {
              const novo: Cliente = {
                id: createdId,
                nome: String(payload?.nome || (created as any)?.nome || "Novo cliente"),
                telefone: String(payload?.telefone || (created as any)?.telefone || ""),
                enderecos: Array.isArray(payload?.enderecos) ? payload.enderecos : [],
              };

              setClientesLocal((prev) => {
                if (prev.some((c) => String(c.id) === String(createdId))) return prev;
                return [novo, ...prev];
              });

              setClienteId(createdId);

              // ✅ default destinatário = nome do cliente novo
              setNovoItem((prev) => ({ ...prev, destinatarioNome: novo.nome }));

              const principal =
                novo.enderecos.find((e) => e.principal) || novo.enderecos[0] || null;
              if (principal) {
                setEnderecoClienteId(principal.id != null ? String(principal.id) : "");
                setEndereco(formatEndereco(principal));
              }
            }

            await onClienteCreated?.();
            setClienteDialogOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}