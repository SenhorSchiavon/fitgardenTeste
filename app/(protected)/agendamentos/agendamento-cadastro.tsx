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
  Plus,
  Trash,
  CalendarIcon,
  User,
  MapPin,
  Send,
  Minus,
} from "lucide-react";

type PedidoTipo = "ENTREGA" | "RETIRADA";
type FormaPagamento =
  | "DINHEIRO"
  | "PIX"
  | "CARTAO"
  | "VOUCHER"
  | "PLANO"
  | "VOUCHER_TAXA_DINHEIRO"
  | "VOUCHER_TAXA_CARTAO"
  | "VOUCHER_TAXA_PIX";

type ClienteOption = {
  id: string;
  nome: string;
  telefone?: string | null;
  enderecoPrincipal?: string | null;
};

type TamanhoOption = {
  id: string;
  label: string;
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

type NovoPedidoItem = {
  id: string;
  tipoItem: "PADRAO" | "PERSONALIZADA";
  destinatarioNome: string;
  tamanhoId: string;
  tamanhoLabel: string;
  quantidade: number;

  opcaoId?: string;
  opcaoNome?: string;

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
  onSubmit,
}: Props) {
  const [clienteId, setClienteId] = useState("");
  const [tipo, setTipo] = useState<PedidoTipo>("ENTREGA");
  const [data, setData] = useState<Date | undefined>(new Date());
  const [horario, setHorario] = useState<HorarioIntervalo>({
    inicio: "11:00",
    fim: "11:30",
  });
  const [endereco, setEndereco] = useState("");
  const [observacoesPedido, setObservacoesPedido] = useState("");
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>("PIX");

  const [modalNovoPedidoOpen, setModalNovoPedidoOpen] = useState(false);
  const [itens, setItens] = useState<NovoPedidoItem[]>([]);

  const [formItem, setFormItem] = useState<NovoPedidoItem>({
    id: "",
    tipoItem: "PADRAO",
    destinatarioNome: "",
    tamanhoId: "",
    tamanhoLabel: "",
    quantidade: 1,

    opcaoId: "",
    opcaoNome: "",

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
    if (!clienteSelecionado) return;
    if (tipo === "ENTREGA" && !endereco.trim()) {
      setEndereco(clienteSelecionado.enderecoPrincipal || "");
    }
  }, [clienteSelecionado, tipo, endereco]);

  const totalMarmitas = useMemo(
    () => itens.reduce((acc, item) => acc + Number(item.quantidade || 0), 0),
    [itens]
  );

  const itensComPrecoAtualizado = useMemo(() => {
    return itens.map((item) => {
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
  }, [itens, tamanhos, totalMarmitas]);

  const subtotalPedido = useMemo(() => {
    return itensComPrecoAtualizado.reduce((acc, item) => {
      return acc + Number(item.precoUnit || 0) * Number(item.quantidade || 0);
    }, 0);
  }, [itensComPrecoAtualizado]);

  function resetForm() {
    setClienteId("");
    setTipo("ENTREGA");
    setData(new Date());
    setHorario({ inicio: "11:00", fim: "11:30" });
    setEndereco("");
    setObservacoesPedido("");
    setFormaPagamento("PIX");
    setItens([]);
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
    });
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

  function abrirNovoPedido() {
    resetFormItem();
    setModalNovoPedidoOpen(true);
  }

  function getResumoEscolhas(item: NovoPedidoItem) {
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

    const extras = [
      item.opcaoNome || "Marmita padrão",
      item.trocaCarboNome ? `Troca carbo: ${item.trocaCarboNome}` : null,
      item.trocaProteinaNome ? `Troca proteína: ${item.trocaProteinaNome}` : null,
      !item.zerarLegume && item.trocaLegumeNome
        ? `Troca legume: ${item.trocaLegumeNome}`
        : null,
      item.zerarLegume ? "Sem legume" : null,
      item.adicionarFeijao ? "Com feijão" : null,
    ].filter(Boolean);

    return extras.join(" • ");
  }

  function addPedidoNaLista() {
    const tamanho = tamanhos.find((t) => t.id === formItem.tamanhoId);

    if (formItem.tipoItem === "PADRAO") {
      if (!tamanho) return;
      if (!formItem.opcaoId) return;

      const precoUnit = Number(
        getPrecoUnitPorQuantidade(tamanho, totalMarmitas + formItem.quantidade)
      );

      const novo: NovoPedidoItem = {
        ...formItem,
        id: uid(),
        tamanhoLabel: tamanho.label,
        precoUnit,
      };

      setItens((prev) => [...prev, novo]);
      setModalNovoPedidoOpen(false);
      resetFormItem();
      return;
    }

    if (!formItem.proteinaId) return;
    if (totalGramasPersonalizada <= 0) return;

    const novo: NovoPedidoItem = {
      ...formItem,
      id: uid(),
      tamanhoId: "",
      tamanhoLabel: `${totalGramasPersonalizada}g`,
      precoUnit: Number(formItem.precoUnit || 0),
    };

    setItens((prev) => [...prev, novo]);
    setModalNovoPedidoOpen(false);
    resetFormItem();

  }

  function removeItem(id: string) {
    setItens((prev) => prev.filter((item) => item.id !== id));
  }

  function changeItemQty(id: string, delta: number) {
    setItens((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          quantidade: Math.max(1, Number(item.quantidade || 1) + delta),
        };
      })
    );
  }

  async function handleSubmit() {
    if (!clienteId) return;
    if (!data) return;
    if (tipo === "ENTREGA" && !endereco.trim()) return;
    if (itens.length === 0) return;

    const payload = {
      clienteId,
      tipo,
      data,
      faixaHorario: `${horario.inicio}-${horario.fim}`,
      endereco: tipo === "RETIRADA" ? "RETIRADA" : endereco,
      observacoes: observacoesPedido,
      formaPagamento,
      itens: itensComPrecoAtualizado,
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
            <DialogTitle>Novo Agendamento</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)_320px] gap-4">
              {/* CLIENTE */}
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="h-4 w-4" />
                    Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Cliente</Label>
                    <Select value={clienteId} onValueChange={setClienteId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes.map((cliente) => (
                          <SelectItem key={cliente.id} value={cliente.id}>
                            {cliente.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

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
                  </div>
                </CardContent>
              </Card>

              {/* LISTA CENTRAL */}
              <Card className="min-w-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-4">
                  <div>
                    <CardTitle className="text-base">Pedidos da lista</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Cada linha representa um subpedido/marmita adicionada.
                    </p>
                  </div>

                  <Button onClick={abrirNovoPedido}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo pedido
                  </Button>
                </CardHeader>

                <CardContent className="space-y-4">
                  {itensComPrecoAtualizado.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                      Nenhum pedido adicionado ainda.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {itensComPrecoAtualizado.map((item) => {
                        const subtotal = Number(item.precoUnit || 0) * Number(item.quantidade || 0);

                        return (
                          <div
                            key={item.id}
                            className="rounded-xl border p-4 space-y-3"
                          >
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium">
                                    {(item.destinatarioNome || "").trim() ||
                                      clienteSelecionado?.nome ||
                                      "Cliente"}
                                  </span>
                                  <Badge variant="secondary">
                                    {item.tipoItem === "PERSONALIZADA"
                                      ? "Personalizada"
                                      : "Padrão"}
                                  </Badge>
                                  <Badge variant="outline">{item.tamanhoLabel}</Badge>
                                </div>

                                <div className="text-sm text-muted-foreground break-words">
                                  {getResumoEscolhas(item)}
                                </div>

                                {item.observacaoItem?.trim() ? (
                                  <div className="text-sm">
                                    <span className="font-medium">Obs:</span>{" "}
                                    {item.observacaoItem}
                                  </div>
                                ) : null}
                              </div>

                              <div className="flex flex-col items-start md:items-end gap-2">
                                <div className="text-right">
                                  <div className="text-sm text-muted-foreground">
                                    Unit. R$ {currency(item.precoUnit)}
                                  </div>
                                  <div className="font-semibold">
                                    Subtotal R$ {currency(subtotal)}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => changeItemQty(item.id, -1)}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>

                                  <div className="min-w-[32px] text-center font-medium">
                                    {item.quantidade}
                                  </div>

                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => changeItemQty(item.id, 1)}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>

                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeItem(item.id)}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* DADOS DO AGENDAMENTO */}
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="text-base">Agendamento</CardTitle>
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
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Data</Label>
                    <div className="rounded-md border p-2">
                      <Calendar
                        mode="single"
                        selected={data}
                        onSelect={setData}
                        locale={ptBR}
                      />
                    </div>
                  </div>

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
                        <SelectItem value="PLANO">Plano</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

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
                    <div className="flex items-center justify-between">
                      <span>Total de marmitas</span>
                      <span className="font-medium">{totalMarmitas}</span>
                    </div>

                    <div className="flex items-center justify-between text-base">
                      <span className="font-semibold">Total</span>
                      <span className="font-bold">R$ {currency(subtotalPedido)}</span>
                    </div>
                  </div>

                  <Button className="w-full" onClick={handleSubmit}>
                    <Send className="h-4 w-4 mr-2" />
                    Salvar agendamento
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL SECUNDÁRIA */}
      {/* MODAL SECUNDÁRIA */}
      <Dialog open={modalNovoPedidoOpen} onOpenChange={setModalNovoPedidoOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo pedido</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="rounded-lg border p-3 bg-muted/30">
              <div className="text-sm">
                <span className="font-medium">Cliente:</span>{" "}
                {clienteSelecionado?.nome || "Selecione um cliente antes"}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Subpedido / Para quem é</Label>
                <Input
                  value={formItem.destinatarioNome}
                  onChange={(e) =>
                    setFormItem((prev) => ({
                      ...prev,
                      destinatarioNome: e.target.value,
                    }))
                  }
                  placeholder="Ex.: João / Maria / Criança"
                />
              </div>

              {formItem.tipoItem === "PADRAO" ? (
                <div className="space-y-2">
                  <Label>Tamanho</Label>
                  <Select
                    value={formItem.tamanhoId}
                    onValueChange={(v) => {
                      const tamanho = tamanhos.find((t) => t.id === v);
                      setFormItem((prev) => ({
                        ...prev,
                        tamanhoId: v,
                        tamanhoLabel: tamanho?.label || "",
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tamanho" />
                    </SelectTrigger>
                    <SelectContent>
                      {tamanhos.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.label} — R$ {currency(t.valorUnitario)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div></div>
              )}
            </div>

            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Checkbox
                checked={formItem.tipoItem === "PERSONALIZADA"}
                onCheckedChange={(checked) =>
                  setFormItem((prev) => ({
                    ...prev,
                    tipoItem: checked ? "PERSONALIZADA" : "PADRAO",
                    opcaoId: "",
                    opcaoNome: "",
                    tamanhoId: checked ? "" : prev.tamanhoId,
                    tamanhoLabel: checked ? "" : prev.tamanhoLabel,
                  }))
                }
              />
              <div>
                <div className="font-medium">Marmita personalizada</div>
                <div className="text-sm text-muted-foreground">
                  Para personalizada, montar uma por vez e informar a gramagem de cada componente.
                </div>
              </div>
            </div>

            {formItem.tipoItem === "PADRAO" ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Opção do cardápio</Label>
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
                    <SelectTrigger>
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
                </div>

                <div className="rounded-lg border p-4 space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Trocas da marmita</Label>
                    <p className="text-xs text-muted-foreground">
                      Use apenas quando o cliente quiser substituir algum componente.
                    </p>
                  </div>

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
                            }))
                          }
                        >
                          Limpar troca
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-3">
                    <div className="space-y-2">
                      <Label>Carboidrato</Label>
                      <Select
                        value={formItem.carboId}
                        onValueChange={(v) => {
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
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-3">
                    <div className="space-y-2">
                      <Label>Proteína</Label>
                      <Select
                        value={formItem.proteinaId}
                        onValueChange={(v) => {
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
                        placeholder="130"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-3">
                    <div className="space-y-2">
                      <Label>Legume</Label>
                      <Select
                        value={formItem.legumeId}
                        onValueChange={(v) => {
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
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-3">
                    <div className="space-y-2">
                      <Label>Feijão (opcional)</Label>
                      <Select
                        value={formItem.feijaoId}
                        onValueChange={(v) => {
                          const item = feijoes.find((o) => o.id === v);
                          setFormItem((prev) => ({
                            ...prev,
                            feijaoId: v,
                            feijaoNome: item?.nome || "",
                            adicionarFeijao: !!v,
                          }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
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

            <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-4">
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalNovoPedidoOpen(false)}
            >
              Cancelar
            </Button>

            <Button type="button" onClick={addPedidoNaLista}>
              Adicionar pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}