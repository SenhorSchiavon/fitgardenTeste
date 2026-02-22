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
import { Plus, Minus, Trash, Send, CalendarIcon, MapPin, UserPlus } from "lucide-react";

// >>> AJUSTA O PATH AQUI
import { ClienteFormDialog } from "@/components/clientes/ClienteFormDialog";

// >>> hook pra criar cliente (seu hook já existe no projeto)
import { useClientes } from "@/hooks/useClientes";

type RegiaoEntrega =
  | "CENTRO"
  | "ZONA_SUL"
  | "ZONA_NORTE"
  | "ZONA_LESTE"
  | "ZONA_OESTE"
  | "CAMBE"
  | "IBIPORA";

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

type Cliente = {
  id: string;
  nome: string;
  telefone: string;
  regiao?: RegiaoEntrega;
  endereco?: string;
};

type Opcao = {
  id: string;
  nome: string;
  categoria: string;
  tamanhos: { tamanhoId: string; tamanhoLabel: string; preco: number }[];
};

type ItemPedido = {
  id: string;
  opcaoId: string;
  opcaoNome: string;
  tamanhoId: string;
  tamanhoLabel: string;
  quantidade: number;
  precoUnit: number;
};

type HorarioIntervalo = {
  inicio: string;
  fim: string;
};

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

function regiaoLabel(regiao: RegiaoEntrega) {
  switch (regiao) {
    case "CENTRO":
      return "Centro";
    case "ZONA_SUL":
      return "Zona Sul";
    case "ZONA_NORTE":
      return "Zona Norte";
    case "ZONA_LESTE":
      return "Zona Leste";
    case "ZONA_OESTE":
      return "Zona Oeste";
    case "CAMBE":
      return "Cambé";
    case "IBIPORA":
      return "Ibiporã";
    default:
      return regiao;
  }
}

function buildWhatsappMessage(params: {
  clienteNome: string;
  data: Date;
  faixaHorario: string;
  tipo: PedidoTipo;
  endereco: string;
  regiao?: RegiaoEntrega;
  itens: ItemPedido[];
  total: number;
  observacoes?: string;
}) {
  const linhasItens =
    params.itens.length === 0
      ? "- (sem itens)"
      : params.itens
        .map(
          (it) =>
            `- ${it.quantidade}x ${it.opcaoNome} (${it.tamanhoLabel}) — R$ ${(
              it.precoUnit * it.quantidade
            ).toFixed(2)}`,
        )
        .join("\n");

  const regiao = params.regiao ? regiaoLabel(params.regiao) : "-";
  const obs = (params.observacoes || "").trim();
  const blocoObs = obs ? `\n\nObservações:\n${obs}` : "";

  return `Olá, ${params.clienteNome}! ☀️

Seu agendamento foi confirmado:
• Tipo: ${params.tipo}
• Data: ${formatDatePtBr(params.data)}
• Faixa: ${params.faixaHorario}h
• Região: ${regiao}
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
  regiao?: RegiaoEntrega | null;
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
  }>;
};

type OnCreateAgendamento = (payload: {
  clienteId: string;
  tipo: PedidoTipo;
  data: Date;
  faixaHorario: string;
  endereco: string;
  regiao?: RegiaoEntrega;
  observacoes?: string;
  formaPagamento: FormaPagamento;
  voucherCodigo?: string;
  itens: { opcaoId: string; tamanhoId: string; quantidade: number }[];
}) => Promise<{ pedidoId: number; agendamentoId: number }>;

type OnUpdateAgendamento = (
  agendamentoId: number,
  payload: {
    clienteId?: string;
    tipo: PedidoTipo;
    data: Date;
    faixaHorario: string;
    endereco: string;
    regiao?: RegiaoEntrega | null;
    observacoes?: string | null;
    formaPagamento: FormaPagamento;
    voucherCodigo?: string;
    itens: { opcaoId: string; tamanhoId: string; quantidade: number }[];
  },
) => Promise<any>;

function splitFaixaHorario(faixa: string): HorarioIntervalo {
  const raw = (faixa || "").trim();

  if (raw.includes("-") && raw.includes(":")) {
    const [inicio, fim] = raw.split("-").map((s) => s.trim());
    return { inicio: inicio || "13:00", fim: fim || "15:00" };
  }

  if (raw.includes("-")) {
    const [a, b] = raw.split("-").map((s) => s.trim());
    const inicio = a.length <= 2 ? `${a.padStart(2, "0")}:00` : a;
    const fim = b.length <= 2 ? `${b.padStart(2, "0")}:00` : b;
    return { inicio: inicio || "13:00", fim: fim || "15:00" };
  }

  return { inicio: "13:00", fim: "15:00" };
}

function mapFormaPagamentoComTaxa(fp: FormaPagamento, taxa: "DINHEIRO" | "CARTAO" | "PIX") {
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
  const [horario, setHorario] = useState<HorarioIntervalo>({ inicio: "", fim: "" });
  const [voucherCodigo, setVoucherCodigo] = useState("");
  const [taxaPagaEm, setTaxaPagaEm] = useState<"DINHEIRO" | "CARTAO" | "PIX">("DINHEIRO");

  const [clienteId, setClienteId] = useState<string>("");
  const clienteSelecionado = useMemo(
    () => clientes.find((c) => String(c.id) === clienteId) || null,
    [clientes, clienteId],
  );

  const [endereco, setEndereco] = useState<string>("");
  const [regiao, setRegiao] = useState<RegiaoEntrega | "">("");
  const [observacoes, setObservacoes] = useState<string>("");

  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>("DINHEIRO");

  const [itens, setItens] = useState<ItemPedido[]>([]);
  const [novoItem, setNovoItem] = useState<{ opcaoId: string; tamanhoId: string; quantidade: number }>(
    { opcaoId: "", tamanhoId: "", quantidade: 1 },
  );

  const [isSaving, setIsSaving] = useState(false);
  const [confirmado, setConfirmado] = useState(false);

  // >>> modal de cadastrar cliente
  const [clienteDialogOpen, setClienteDialogOpen] = useState(false);

  const tamanhosDisponiveis = useMemo(() => {
    const opcao = opcoes.find((o) => o.id === novoItem.opcaoId);
    return opcao?.tamanhos || [];
  }, [opcoes, novoItem.opcaoId]);

  const total = useMemo(() => {
    return itens.reduce((acc, it) => acc + it.precoUnit * it.quantidade, 0);
  }, [itens]);

  function resetForm() {
    setTipo("ENTREGA");
    setData(defaultDate);
    setHorario({ inicio: "13:00", fim: "15:00" });
    setClienteId("");
    setEndereco("");
    setRegiao("");
    setObservacoes("");
    setFormaPagamento("DINHEIRO");
    setVoucherCodigo("");
    setTaxaPagaEm("DINHEIRO");
    setItens([]);
    setNovoItem({ opcaoId: "", tamanhoId: "", quantidade: 1 });
    setIsSaving(false);
    setConfirmado(false);
  }

  function onPickCliente(id: string) {
    setClienteId(id);

    const c = clientes.find((x) => x.id === id);
    if (!c) return;

    if (c.endereco) setEndereco(c.endereco);
    if (c.regiao) setRegiao(c.regiao);
  }

  function addItem() {
    const opcao = opcoes.find((o) => o.id === novoItem.opcaoId);
    if (!opcao) return;

    const tamanho = opcao.tamanhos.find((t) => t.tamanhoId === novoItem.tamanhoId);
    if (!tamanho) return;

    const newId = `ITEM_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    setItens((prev) => [
      ...prev,
      {
        id: newId,
        opcaoId: opcao.id,
        opcaoNome: opcao.nome,
        tamanhoId: tamanho.tamanhoId,
        tamanhoLabel: tamanho.tamanhoLabel,
        quantidade: Math.max(1, novoItem.quantidade || 1),
        precoUnit: tamanho.preco,
      },
    ]);

    setNovoItem({ opcaoId: "", tamanhoId: "", quantidade: 1 });
  }

  function removeItem(id: string) {
    setItens((prev) => prev.filter((x) => x.id !== id));
  }

  function changeItemQty(id: string, delta: number) {
    setItens((prev) =>
      prev.map((x) =>
        x.id === id ? { ...x, quantidade: Math.max(1, x.quantidade + delta) } : x,
      ),
    );
  }

  useEffect(() => {
    if (!open) return;
    if (mode !== "edit") return;
    if (!initialData) return;

    setClienteId(String(initialData.clienteId));

    setTipo(initialData.tipo);
    const d = initialData.data instanceof Date ? initialData.data : new Date(initialData.data);
    setData(d);

    setHorario(splitFaixaHorario(initialData.faixaHorario || ""));

    setEndereco(initialData.endereco || "");
    setRegiao((initialData.regiao as any) || "");
    setObservacoes((initialData.observacoes || "") as any);

    const fp = (initialData.formaPagamento || "DINHEIRO") as any as FormaPagamento;
    setFormaPagamento(fp);

    setVoucherCodigo((initialData.voucherCodigo || "") as any);

    const itensPrefill: ItemPedido[] = (initialData.itens || []).map((it) => {
      const opcaoId = String(it.opcaoId);
      const tamanhoId = String(it.tamanhoId);

      const opcao = opcoes.find((o) => String(o.id) === opcaoId) || null;
      const tamanho =
        opcao?.tamanhos.find((t) => String(t.tamanhoId) === tamanhoId) || null;

      const precoUnit =
        it.precoUnit != null
          ? Number(it.precoUnit)
          : tamanho?.preco != null
            ? Number(tamanho.preco)
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
      };
    });

    setItens(itensPrefill);
    setConfirmado(false);
  }, [open, mode, initialData, opcoes]);

  async function confirmarAgendamento() {
    if (!clienteSelecionado) return;
    if (!endereco.trim() && tipo === "ENTREGA") return;
    if (itens.length === 0) return;

    setIsSaving(true);
    const faixaHorario = `${horario.inicio}-${horario.fim}`;

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
          faixaHorario,
          endereco,
          regiao: regiao ? (regiao as RegiaoEntrega) : null,
          observacoes: (observacoes || "").trim() ? observacoes : null,
          formaPagamento: formaFinal as any,
          voucherCodigo: undefined,
          itens: itens.map((it) => ({
            opcaoId: String(it.opcaoId),
            tamanhoId: String(it.tamanhoId),
            quantidade: Number(it.quantidade),
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
          faixaHorario,
          endereco,
          regiao: regiao ? (regiao as RegiaoEntrega) : undefined,
          observacoes,
          formaPagamento: formaFinal as any,
          voucherCodigo: formaPagamento === "VOUCHER" ? voucherCodigo.trim() : undefined,
          itens: itens.map((it) => ({
            opcaoId: it.opcaoId,
            tamanhoId: it.tamanhoId,
            quantidade: it.quantidade,
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
    const faixaHorario = `${horario.inicio}-${horario.fim}`;
    const waPhone = normalizePhoneToWaMe(clienteSelecionado.telefone);
    const msg = buildWhatsappMessage({
      clienteNome: clienteSelecionado.nome,
      data,
      faixaHorario,
      tipo,
      endereco: tipo === "ENTREGA" ? endereco : "-",
      regiao: regiao ? (regiao as RegiaoEntrega) : undefined,
      itens,
      total,
      observacoes,
    });

    const url = `https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) resetForm();
      }}
    >
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Editar Agendamento" : "Novo Agendamento"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
          <div className="space-y-4">
            <Tabs defaultValue="cliente">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="cliente">Cliente</TabsTrigger>
                <TabsTrigger value="agenda">Agenda</TabsTrigger>
                <TabsTrigger value="itens">Itens</TabsTrigger>
              </TabsList>

              <TabsContent value="cliente" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cliente</Label>

                    {/* >>> SELECT + BOTÃO CADASTRAR LADO A LADO */}
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Select value={clienteId} onValueChange={onPickCliente}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um cliente" />
                          </SelectTrigger>
                          <SelectContent>
                            {clientes.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
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
                        (No editar, cliente fica travado. Se quiser trocar cliente no editar, precisa ajustar o backend.)
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={tipo} onValueChange={(v) => setTipo(v as PedidoTipo)}>
                      <SelectTrigger>
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
              </TabsContent>

              <TabsContent value="agenda" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      Data
                    </Label>

                    <div className="rounded-md border p-2 w-fit">
                      <Calendar mode="single" selected={data} onSelect={(d) => d && setData(d)} locale={ptBR} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Horário inicial</Label>
                        <Input
                          type="time"
                          value={horario.inicio}
                          onChange={(e) => setHorario((h) => ({ ...h, inicio: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Horário final</Label>
                        <Input
                          type="time"
                          value={horario.fim}
                          onChange={(e) => setHorario((h) => ({ ...h, fim: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Região</Label>
                      <Select value={regiao} onValueChange={(v) => setRegiao(v as RegiaoEntrega)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CENTRO">Centro</SelectItem>
                          <SelectItem value="ZONA_SUL">Zona Sul</SelectItem>
                          <SelectItem value="ZONA_OESTE">Zona Oeste</SelectItem>
                          <SelectItem value="ZONA_NORTE">Zona Norte</SelectItem>
                          <SelectItem value="ZONA_LESTE">Zona Leste</SelectItem>
                          <SelectItem value="CAMBE">Cambé</SelectItem>
                          <SelectItem value="IBIPORA">Ibiporã</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Endereço (Entrega)
                      </Label>
                      <Textarea
                        value={endereco}
                        onChange={(e) => setEndereco(e.target.value)}
                        placeholder="Rua, número, bairro..."
                        disabled={tipo === "RETIRADA"}
                        rows={3}
                        className="min-h-[96px] resize-y"
                      />

                      {tipo === "RETIRADA" && (
                        <div className="text-xs text-muted-foreground">
                          Retirada não precisa de endereço.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="itens" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Opção</Label>
                    <Select
                      value={novoItem.opcaoId}
                      onValueChange={(v) =>
                        setNovoItem({ ...novoItem, opcaoId: v, tamanhoId: "" })
                      }
                    >
                      <SelectTrigger>
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
                      onValueChange={(v) => setNovoItem({ ...novoItem, tamanhoId: v })}
                      disabled={!novoItem.opcaoId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um tamanho" />
                      </SelectTrigger>
                      <SelectContent>
                        {tamanhosDisponiveis.map((t) => (
                          <SelectItem key={t.tamanhoId} value={t.tamanhoId}>
                            {t.tamanhoLabel} — R$ {t.preco.toFixed(2)}
                          </SelectItem>
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
                        setNovoItem({
                          ...novoItem,
                          quantidade: Math.max(1, (novoItem.quantidade || 1) - 1),
                        })
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
                        setNovoItem({
                          ...novoItem,
                          quantidade: Number.parseInt(e.target.value || "1", 10) || 1,
                        })
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setNovoItem({
                          ...novoItem,
                          quantidade: (novoItem.quantidade || 1) + 1,
                        })
                      }
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <Button type="button" onClick={addItem} disabled={!novoItem.opcaoId || !novoItem.tamanhoId}>
                    Adicionar Item
                  </Button>
                </div>

                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
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
                          <TableCell>{it.opcaoNome}</TableCell>
                          <TableCell>{it.tamanhoLabel}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button type="button" variant="ghost" size="icon" onClick={() => changeItemQty(it.id, -1)}>
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="min-w-[18px] text-center">{it.quantidade}</span>
                              <Button type="button" variant="ghost" size="icon" onClick={() => changeItemQty(it.id, 1)}>
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>R$ {it.precoUnit.toFixed(2)}</TableCell>
                          <TableCell>R$ {(it.precoUnit * it.quantidade).toFixed(2)}</TableCell>
                          <TableCell>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(it.id)}>
                              <Trash className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}

                      {itens.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-6">
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

          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">Resumo</div>
                {confirmado ? (
                  <Badge className="bg-emerald-600 text-white">Confirmado</Badge>
                ) : (
                  <Badge variant="outline">Rascunho</Badge>
                )}
              </div>

              <div className="text-sm text-muted-foreground">
                <div>
                  <span className="font-medium text-foreground">Data:</span> {formatDatePtBr(data)}
                </div>
                <div>
                  <span className="font-medium text-foreground">Faixa:</span> {horario.inicio} - {horario.fim}
                </div>
                <div>
                  <span className="font-medium text-foreground">Tipo:</span> {tipo}
                </div>
                <div>
                  <span className="font-medium text-foreground">Cliente:</span> {clienteSelecionado ? clienteSelecionado.nome : "-"}
                </div>
                <div>
                  <span className="font-medium text-foreground">Telefone:</span> {clienteSelecionado ? clienteSelecionado.telefone : "-"}
                </div>
                <div>
                  <span className="font-medium text-foreground">Região:</span> {regiao ? regiaoLabel(regiao as RegiaoEntrega) : "-"}
                </div>
                <div className="line-clamp-2">
                  <span className="font-medium text-foreground">Endereço:</span> {tipo === "ENTREGA" ? endereco || "-" : "(retirada)"}
                </div>
              </div>

              <div className="border-t pt-3 space-y-2">
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
                  <SelectTrigger>
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
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                        <SelectItem value="PIX">PIX</SelectItem>
                        <SelectItem value="CARTAO">Cartão</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="text-xs text-muted-foreground">Isso vira VOUCHER_TAXA_* no backend.</div>
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

        {/* >>> MODAL DE CADASTRAR CLIENTE */}
        <ClienteFormDialog
          open={clienteDialogOpen}
          onOpenChange={setClienteDialogOpen}
          title="Novo Cliente"
          saving={isSaving || savingClienteHook}
          onSubmit={async (payload: any) => {
            const created = await createCliente(payload);

            const createdId = String(
              (created as any)?.id ?? (created as any)?.cliente?.id ?? ""
            );

            // ✅ manda o pai recarregar a lista
            await onClienteCreated?.();

            // ✅ agora o select vai ter o item novo, então selecionar funciona de verdade
            if (createdId) {
              setClienteId(createdId);
            }

            setClienteDialogOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}