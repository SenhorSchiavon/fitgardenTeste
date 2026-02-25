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
import { NovoAgendamentoDialog } from "./agendamento-cadastro";
import { useOpcoesDoCardapio } from "@/hooks/useOpcoesDoCardapio";
import { useClientes } from "@/hooks/useClientes";
import { useAgendamentos } from "@/hooks/useAgendamentos";
import { useCardapios } from "@/hooks/useCardapios";
import { toast } from "@/components/ui/use-toast";
import { useRelatorioPreparosDia } from "@/hooks/useRelatorioPreparosDia";
import { useRelatorioPedidosDia } from "@/hooks/useRelatorioPedidosDia";
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

  itens: { nome: string; tamanho: string; quantidade: number }[];
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
      (row.pedido?.itens ?? row.itens ?? []).map((it: any) => ({
        nome: it.opcao?.nome ?? it.nome ?? "-",
        tamanho: it.tamanho?.pesagemGramas
          ? `${it.tamanho.pesagemGramas}g`
          : (it.tamanhoLabel ?? "-"),
        quantidade: Number(it.quantidade ?? 0),
      })) ?? [];

    const quantidade = itensUi.reduce(
      (acc: number, it: any) => acc + it.quantidade,
      0,
    );

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
      valorPedido: Number(row.pedido?.valorPedido ?? row.valorPedido ?? 0),
      valorTaxa: Number(row.pedido?.valorTaxa ?? row.valorTaxa ?? 0),
      valorTotal: Number(row.pedido?.valorTotal ?? row.valorTotal ?? 0),
      observacoes: row.pedido?.observacoes ?? row.observacoes ?? undefined,
      itens: itensUi,
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Detalhes do Agendamento {agendamentoSelecionado?.numeroPedido} -{" "}
              {agendamentoSelecionado?.cliente}
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
                    {agendamentoSelecionado?.cliente}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Telefone</div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    {agendamentoSelecionado?.telefone}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Tipo de Entrega</div>
                  <div className="flex items-center">
                    <TruckIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                    {agendamentoSelecionado?.tipoEntrega}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Faixa de Horário</div>
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                    {agendamentoSelecionado?.faixaHorario}h
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium">Endereço</div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  {agendamentoSelecionado?.endereco} (
                  {agendamentoSelecionado?.zona})
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Forma de Pagamento</div>
                  <div className="flex items-center">
                    <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
                    {agendamentoSelecionado?.formaPagamento}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Entregador</div>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    {agendamentoSelecionado?.entregador}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Subtotal (itens)</div>
                    <div>R$ {(agendamentoSelecionado?.valorPedido ?? 0).toFixed(2)}</div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm font-medium">Taxa de entrega</div>
                    <div>
                      {agendamentoSelecionado?.tipoEntrega === "ENTREGA"
                        ? `R$ ${(agendamentoSelecionado?.valorTaxa ?? 0).toFixed(2)}`
                        : "-"}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-medium">Total</div>
                  <div className="text-lg font-semibold">
                    R$ {(agendamentoSelecionado?.valorTotal ?? 0).toFixed(2)}
                  </div>
                </div>
              </div>

              {agendamentoSelecionado?.observacoes && (
                <div className="space-y-1">
                  <div className="text-sm font-medium">Observações</div>
                  <div className="p-2 bg-muted rounded-md">
                    {agendamentoSelecionado.observacoes}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!agendamentoSelecionado) return;
                    setModoEdicao(true);
                    setAgendamentoEditandoId(Number(agendamentoSelecionado.id));
                    setDadosEdicao(agendamentoSelecionado);
                    setDetalhesDialogOpen(false);
                    setCadastroOpen(true);
                  }}
                >
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() =>
                    agendamentoSelecionado &&
                    handleDeleteAgendamento(agendamentoSelecionado.id)
                  }
                >
                  <Trash className="mr-2 h-4 w-4" /> Excluir Agendamento
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
                  {agendamentoSelecionado?.itens.map((item, index) => (
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
      <Sheet open={preparoSheetOpen} onOpenChange={setPreparoSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Relatório de Preparo - {formatDate(selectedDate)}</SheetTitle>
          </SheetHeader>

          <div className="py-6">
            {errorRelatorioPreparos ? (
              <div className="text-sm text-destructive">{errorRelatorioPreparos}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Preparo</TableHead>
                    <TableHead className="text-right">Pronto (kg)</TableHead>
                    <TableHead className="text-right">Cru (kg)</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {(relatorioPreparos?.prontos ?? []).length > 0 ? (
                    <>
                      {(relatorioPreparos?.prontos ?? []).map((row) => (
                        <TableRow key={row.preparoId}>
                          <TableCell>{row.nome}</TableCell>
                          <TableCell className="text-right">
                            {Number(row.kgPronto ?? 0).toFixed(3)}
                          </TableCell>
                          <TableCell className="text-right">
                            {Number(row.kgCru ?? 0).toFixed(3)}
                          </TableCell>
                        </TableRow>
                      ))}

                      {/* Totais */}
                      <TableRow>
                        <TableCell className="font-medium">Total</TableCell>
                        <TableCell className="text-right font-medium">
                          {(
                            (relatorioPreparos?.prontos ?? []).reduce(
                              (acc, r) => acc + Number(r.kgPronto ?? 0),
                              0,
                            ) || 0
                          ).toFixed(3)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {(
                            (relatorioPreparos?.prontos ?? []).reduce(
                              (acc, r) => acc + Number(r.kgCru ?? 0),
                              0,
                            ) || 0
                          ).toFixed(3)}
                        </TableCell>
                      </TableRow>
                    </>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center">
                        Nenhum preparo encontrado para o dia
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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
      <NovoAgendamentoDialog
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
            endereco: enderecoTexto,
            enderecos: c.enderecos || [], // <<< adiciona isso
          };
        })}
        opcoes={opcoes.map((o) => ({
          id: String(o.id),
          nome: o.nome,
          categoria: o.categoria ?? "OUTROS",
          tamanhos: o.tamanhos.map((t) => ({
            tamanhoId: String(t.tamanhoId),
            tamanhoLabel: t.tamanhoLabel,
            valorUnitario: Number(t.valorUnitario ?? 0),
            valor10: Number(t.valor10 ?? 0),
            valor20: Number(t.valor20 ?? 0),
            valor40: Number(t.valor40 ?? 0),
          })),
        }))}
        defaultDate={selectedDate} // melhor usar a data selecionada no calendário
        mode={modoEdicao ? "edit" : "create"}
        initialData={
          modoEdicao && dadosEdicao
            ? {
              agendamentoId: Number(dadosEdicao.id),
              clienteId: String(
                // hoje você só tem o nome no UI; ideal é vir clienteId do backend
                // se você já tiver dadosEdicao.clienteId, troca aqui
                clientes.find((c) => c.nome === dadosEdicao.cliente)?.id ??
                "",
              ),
              tipo: dadosEdicao.tipoEntrega,
              data: selectedDate, // ideal: data real do agendamento (se vier do backend)
              faixaHorario: dadosEdicao.faixaHorario,
              endereco: dadosEdicao.endereco,
              observacoes: dadosEdicao.observacoes ?? null,
              formaPagamento: dadosEdicao.formaPagamento ?? "DINHEIRO",
              voucherCodigo: null,
              itens: [], // <<< IMPORTANT: precisa ter opcaoId/tamanhoId pra editar itens
            }
            : null
        }
        onUpdateAgendamento={async (agendamentoId, payload) => {
          // chama backend
          await updateAgendamento(agendamentoId, {
            tipo: payload.tipo,
            data: payload.data,
            faixaHorario: payload.faixaHorario,
            endereco: payload.endereco,
            observacoes: payload.observacoes ?? null,
            formaPagamento: payload.formaPagamento,
            itens: payload.itens.map((it) => ({
              opcaoId: Number(it.opcaoId),
              tamanhoId: Number(it.tamanhoId),
              quantidade: Number(it.quantidade),
            })),
          });

          // recarrega lista do dia
          const date = utils.toISODateOnly(selectedDate);
          const res = await getAgendamentos({ date, page: 1, pageSize: 200 });
          setAgendamentos((res.rows || []).map(mapApiToUi));

          setCadastroOpen(false);
        }}
        onCreateAgendamento={async (payload) => {
          const result = await createAgendamento({
            clienteId: Number(payload.clienteId),
            tipo: payload.tipo,
            data: payload.data,
            faixaHorario: payload.faixaHorario,
            endereco: payload.endereco,
            observacoes: payload.observacoes,
            formaPagamento: payload.formaPagamento,
            itens: payload.itens.map((it) => ({
              opcaoId: Number(it.opcaoId),
              tamanhoId: Number(it.tamanhoId),
              quantidade: Number(it.quantidade),
            })),
          });

          const date = utils.toISODateOnly(selectedDate);
          const res = await getAgendamentos({ date, page: 1, pageSize: 200 });
          setAgendamentos((res.rows || []).map(mapApiToUi));

          setCadastroOpen(false);
          return result;
        }}
      />
    </div>
  );
}
