"use client";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  useAgendamentos,
  PedidoPendenteRow,
  FormaPagamento,
} from "@/hooks/useAgendamentos";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CreditCard,
  MapPin,
  Phone,
  Trash,
  TruckIcon,
  User,
  CalendarIcon,
  CheckCircle2,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { Header } from "@/components/header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type PedidoAberto = {
  id: string;
  numeroPedido: string;
  cliente: string;
  tipoEntrega: "ENTREGA" | "RETIRADA";
  faixaHorario: "13-15" | "15-17" | "17-18" | "18-20:30";
  endereco: string;
  zona:
    | "CENTRO"
    | "ZONA SUL"
    | "ZONA NORTE"
    | "ZONA LESTE"
    | "CAMBÉ"
    | "IBIPORÃ";
  telefone: string;
  quantidade: number;
  formaPagamento: string;
  entregador: string;
  observacoes?: string;
  itens: {
    nome: string;
    tamanho: string;
    quantidade: number;
  }[];
  data: string;
};

function toISODateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function PedidosAberto() {
  const {
    loading,
    getPedidosPendentes,
    getPagamentosParaConciliar,
    finalizarPagamento,
    conciliarPagamento,
    marcarPagamentoNaoPago,
    deleteAgendamento,
  } = useAgendamentos();

  const [pedidosAberto, setPedidosAberto] = useState<PedidoPendenteRow[]>([]);
  const [pagamentosConciliar, setPagamentosConciliar] = useState<PedidoPendenteRow[]>([]);
  const [dataFiltro, setDataFiltro] = useState(() => toISODateOnly(new Date()));
  const [filtroConciliacao, setFiltroConciliacao] = useState<"todos" | "a-conciliar" | "conciliados">("todos");

  const [pedidoSelecionado, setPedidoSelecionado] =
    useState<PedidoPendenteRow | null>(null);
  const [detalhesDialogOpen, setDetalhesDialogOpen] = useState(false);
  const [pagamentoDialogOpen, setPagamentoDialogOpen] = useState(false);

  const [formaPagamentoFinal, setFormaPagamentoFinal] =
    useState<Exclude<FormaPagamento, "PLANO">>("PIX");

  const pagamentosConciliarFiltrados = useMemo(() => {
    if (filtroConciliacao === "a-conciliar") {
      return pagamentosConciliar.filter((pedido) => !pedido.conciliado);
    }
    if (filtroConciliacao === "conciliados") {
      return pagamentosConciliar.filter((pedido) => pedido.conciliado);
    }
    return pagamentosConciliar;
  }, [filtroConciliacao, pagamentosConciliar]);

  async function load(date = dataFiltro) {
    const [resp, conciliacaoResp] = await Promise.all([
      getPedidosPendentes({ page: 1, pageSize: 50 }),
      getPagamentosParaConciliar({ date, page: 1, pageSize: 50 }),
    ]);
    setPedidosAberto(resp.rows || []);
    setPagamentosConciliar(conciliacaoResp.rows || []);
  }

  useEffect(() => {
    load(dataFiltro).catch(() => {});
  }, [dataFiltro]);

  const handleShowDetalhes = (pedido: PedidoPendenteRow) => {
    setPedidoSelecionado(pedido);
    setDetalhesDialogOpen(true);
  };

  const handleDeletePedido = async (agendamentoId: number) => {
    await deleteAgendamento(agendamentoId);
    setPedidosAberto((prev) =>
      prev.filter((p) => p.agendamentoId !== agendamentoId),
    );
    setDetalhesDialogOpen(false);
    toast.success("Pedido removido");
  };
  const getFaixaHorarioColor = (faixa: string) => {
    switch (faixa) {
      case "13-15":
        return "bg-red-500";
      case "15-17":
        return "bg-orange-500";
      case "17-18":
        return "bg-green-500";
      case "18-20:30":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
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
      case "CAMBÉ":
        return "bg-indigo-500";
      case "IBIPORÃ":
        return "bg-amber-500";
      default:
        return "bg-gray-500";
    }
  };
  const handlePagamento = () => {
    setPagamentoDialogOpen(true);
  };

  const handleFinalizarPagamento = async () => {
    if (!pedidoSelecionado) return;

    await finalizarPagamento(pedidoSelecionado.agendamentoId, {
      formaPagamento: formaPagamentoFinal,
    });

    setPedidosAberto((prev) =>
      prev.filter((p) => p.agendamentoId !== pedidoSelecionado.agendamentoId),
    );
    const conciliacaoResp = await getPagamentosParaConciliar({ date: dataFiltro, page: 1, pageSize: 50 });
    setPagamentosConciliar(conciliacaoResp.rows || []);
    setPagamentoDialogOpen(false);
    setDetalhesDialogOpen(false);
    toast.success("Pagamento finalizado");
  };

  const handleConciliarPagamento = async (pedido: PedidoPendenteRow) => {
    if (!pedido.pagamentoId) {
      toast.error("Pagamento não encontrado para conciliação");
      return;
    }

    await conciliarPagamento(pedido.pagamentoId, true);
    await load(dataFiltro);
    toast.success("Pagamento conciliado");
  };

  const handleDesconciliarPagamento = async (pedido: PedidoPendenteRow) => {
    if (!pedido.pagamentoId) {
      toast.error("Pagamento nÃ£o encontrado para conciliaÃ§Ã£o");
      return;
    }

    await conciliarPagamento(pedido.pagamentoId, false);
    await load(dataFiltro);
    toast.success("Pagamento desconciliado");
  };

  const handleMarcarNaoPago = async (pedido: PedidoPendenteRow) => {
    if (!pedido.pagamentoId) {
      toast.error("Pagamento nÃ£o encontrado");
      return;
    }

    await marcarPagamentoNaoPago(pedido.pagamentoId);
    await load(dataFiltro);
    toast.success("Pagamento marcado como nÃ£o pago");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="container mx-auto p-6">
      <Header
        title="Pedidos em Aberto"
        subtitle="Gerencie os pedidos com pagamento pendente"
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Label htmlFor="dataFiltro">Data da conciliação</Label>
          <Input
            id="dataFiltro"
            type="date"
            value={dataFiltro}
            onChange={(event) => setDataFiltro(event.target.value)}
            className="w-full sm:w-56"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setDataFiltro(toISODateOnly(new Date()))}
        >
          Hoje
        </Button>
      </div>

      <Tabs defaultValue="pendentes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pendentes">Pendentes ({pedidosAberto.length})</TabsTrigger>
          <TabsTrigger value="conciliacao">Pagos / Conciliacao ({pagamentosConciliarFiltrados.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pendentes">
      <Card>
        <CardHeader>
          <CardTitle>Pedidos com Pagamento Pendente</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-250px)]">
            <div className="space-y-4">
              {pedidosAberto.map((pedido) => (
                <div
                  key={pedido.agendamentoId}
                  className="flex flex-col border rounded-lg overflow-hidden cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleShowDetalhes(pedido)}
                >
                  <div className="flex items-center p-4 bg-muted/40">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="font-medium">
                          {pedido.numeroPedido}
                        </span>
                        <span className="mx-2">-</span>
                        <span>{pedido.cliente}</span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <Badge
                          variant={
                            pedido.tipoEntrega === "ENTREGA"
                              ? "default"
                              : "outline"
                          }
                        >
                          {pedido.tipoEntrega}
                        </Badge>
                        <span className="mx-2">•</span>
                        <span>{formatDate(pedido.data)}</span>
                        <span className="mx-2">•</span>
                        <span>{pedido.quantidade} itens</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">Pagamento Pendente</Badge>
                    </div>
                  </div>
                </div>
              ))}
              {pedidosAberto.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Não há pedidos com pagamento pendente
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="conciliacao">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>Pagamentos Confirmados e Conciliados</CardTitle>
                <Select
                  value={filtroConciliacao}
                  onValueChange={(value) => setFiltroConciliacao(value as typeof filtroConciliacao)}
                >
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filtrar status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="a-conciliar">A conciliar</SelectItem>
                    <SelectItem value="conciliados">Conciliados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="space-y-4">
                  {pagamentosConciliarFiltrados.map((pedido) => (
                    <div
                      key={pedido.pagamentoId || pedido.agendamentoId}
                      className="flex items-center gap-4 border rounded-lg p-4 bg-muted/20"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{pedido.numeroPedido}</span>
                          <span>-</span>
                          <span className="truncate">{pedido.cliente}</span>
                          <Badge variant="outline">{pedido.formaPagamento}</Badge>
                          {pedido.conciliado ? (
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                              Conciliado
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                              A conciliar
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground mt-1">
                          <span>{formatDate(pedido.data)}</span>
                          <span>•</span>
                          <span>{pedido.tipoEntrega}</span>
                          {pedido.pagoEm && (
                            <>
                              <span>•</span>
                              <span>Pago em {new Date(pedido.pagoEm).toLocaleDateString("pt-BR")}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Valor</div>
                        <div className="text-lg font-bold">
                          R$ {Number(pedido.valorTotalFinal ?? pedido.valorTotal).toFixed(2)}
                        </div>
                      </div>

                      <div className="flex flex-wrap justify-end gap-2">
                        {pedido.conciliado ? (
                          <Button
                            variant="outline"
                            onClick={() => handleDesconciliarPagamento(pedido)}
                            disabled={loading || !pedido.pagamentoId}
                          >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Desconciliar
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleConciliarPagamento(pedido)}
                            disabled={loading || !pedido.pagamentoId}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Conciliar
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          className="border-red-200 text-red-700 hover:bg-red-50"
                          onClick={() => handleMarcarNaoPago(pedido)}
                          disabled={loading || !pedido.pagamentoId}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Marcar nao pago
                        </Button>
                      </div>
                    </div>
                  ))}

                  {pagamentosConciliarFiltrados.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum pagamento encontrado para esse filtro
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={detalhesDialogOpen} onOpenChange={setDetalhesDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Detalhes do Pedido {pedidoSelecionado?.numeroPedido} -{" "}
              {pedidoSelecionado?.cliente}
            </DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="detalhes">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="detalhes">Detalhes do Pedido</TabsTrigger>
              <TabsTrigger value="itens">Itens do Pedido</TabsTrigger>
            </TabsList>
            <TabsContent value="detalhes" className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Cliente</div>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    {pedidoSelecionado?.cliente}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Telefone</div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    {pedidoSelecionado?.telefone}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Tipo de Entrega</div>
                  <div className="flex items-center">
                    <TruckIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                    {pedidoSelecionado?.tipoEntrega}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Faixa de Horário</div>
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                    {pedidoSelecionado?.faixaHorario}h
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium">Endereço</div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  {pedidoSelecionado?.endereco} (
                  {pedidoSelecionado?.zona || "-"})
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Forma de Pagamento</div>
                  <div className="flex items-center">
                    <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
                    <Badge variant="destructive">Pendente</Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Data</div>
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                    {pedidoSelecionado && formatDate(pedidoSelecionado.data)}
                  </div>
                </div>
              </div>

              {pedidoSelecionado?.observacoes && (
                <div className="space-y-1">
                  <div className="text-sm font-medium">Observações</div>
                  <div className="p-2 bg-muted rounded-md">
                    {pedidoSelecionado.observacoes}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="destructive"
                  onClick={() =>
                    pedidoSelecionado &&
                    handleDeletePedido(pedidoSelecionado.agendamentoId)
                  }
                >
                  <Trash className="mr-2 h-4 w-4" /> Excluir Pedido
                </Button>
                <Button onClick={handlePagamento}>
                  <CreditCard className="mr-2 h-4 w-4" /> Realizar Pagamento
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="itens" className="py-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Tamanho</TableHead>
                    <TableHead>Quantidade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedidoSelecionado?.itens.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.nome}</TableCell>
                      <TableCell>{item.tamanho}</TableCell>
                      <TableCell>{item.quantidade}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={pagamentoDialogOpen} onOpenChange={setPagamentoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Pagamento</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select
                value={formaPagamentoFinal}
                onValueChange={(v) => setFormaPagamentoFinal(v as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                  <SelectItem value="CREDITO">Cartão de Crédito</SelectItem>
                  <SelectItem value="DEBITO">Cartão de Débito</SelectItem>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="VOUCHER">Voucher</SelectItem>
                  <SelectItem value="TROCA">Troca</SelectItem>
                  <SelectItem value="BONIFICACAO">Bonificação</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Valor Total</Label>
              <div className="text-2xl font-bold">
                {pedidoSelecionado
                  ? `R$ ${Number(pedidoSelecionado.valorTotalFinal ?? pedidoSelecionado.valorTotal).toFixed(2)}`
                  : "-"}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setPagamentoDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleFinalizarPagamento}
                disabled={loading || !pedidoSelecionado}
              >
                Finalizar Pagamento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
