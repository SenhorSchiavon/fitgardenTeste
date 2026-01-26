"use client";

import { useState } from "react";
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

type Agendamento = {
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
    | "ZONA OESTE"
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
};

export default function Agendamentos() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([
    {
      id: "AGD001",
      numeroPedido: "#3001",
      cliente: "João Silva",
      tipoEntrega: "ENTREGA",
      faixaHorario: "13-15",
      endereco: "Rua das Flores, 123",
      zona: "CENTRO",
      telefone: "(43) 99999-8888",
      quantidade: 2,
      formaPagamento: "Cartão de Crédito",
      entregador: "Carlos",
      observacoes: "Sem cebola",
      itens: [
        { nome: "Fit Tradicional", tamanho: "350g", quantidade: 1 },
        { nome: "Low Carb Especial", tamanho: "450g", quantidade: 1 },
      ],
    },
    {
      id: "AGD002",
      numeroPedido: "#3002",
      cliente: "Maria Oliveira",
      tipoEntrega: "ENTREGA",
      faixaHorario: "15-17",
      endereco: "Av. Principal, 456",
      zona: "ZONA SUL",
      telefone: "(43) 98888-7777",
      quantidade: 5,
      formaPagamento: "PIX",
      entregador: "Pedro",
      itens: [{ nome: "Fit Tradicional", tamanho: "350g", quantidade: 5 }],
    },
    {
      id: "AGD003",
      numeroPedido: "#3003",
      cliente: "Ana Santos",
      tipoEntrega: "RETIRADA",
      faixaHorario: "17-18",
      endereco: "-",
      zona: "CENTRO",
      telefone: "(43) 97777-6666",
      quantidade: 3,
      formaPagamento: "Dinheiro",
      entregador: "-",
      itens: [
        { nome: "Vegetariano Mix", tamanho: "350g", quantidade: 2 },
        { nome: "Sopa Detox", tamanho: "450g", quantidade: 1 },
      ],
    },
    {
      id: "AGD004",
      numeroPedido: "#3004",
      cliente: "Carlos Pereira",
      tipoEntrega: "ENTREGA",
      faixaHorario: "18-20:30",
      endereco: "Rua Secundária, 789",
      zona: "ZONA NORTE",
      telefone: "(43) 96666-5555",
      quantidade: 1,
      formaPagamento: "Cartão de Débito",
      entregador: "Carlos",
      itens: [{ nome: "Proteico Plus", tamanho: "450g", quantidade: 1 }],
    },
  ]);

  const [agendamentoSelecionado, setAgendamentoSelecionado] =
    useState<Agendamento | null>(null);
  const [detalhesDialogOpen, setDetalhesDialogOpen] = useState(false);
  const [producaoSheetOpen, setProducaoSheetOpen] = useState(false);
  const [rotasSheetOpen, setRotasSheetOpen] = useState(false);

  const handleShowDetalhes = (agendamento: Agendamento) => {
    setAgendamentoSelecionado(agendamento);
    setDetalhesDialogOpen(true);
  };

  const handleDeleteAgendamento = (id: string) => {
    setAgendamentos(agendamentos.filter((agd) => agd.id !== id));
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
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setProducaoSheetOpen(true)}>
            <FileText className="mr-2 h-4 w-4" /> Produção do Dia
          </Button>
          <Button variant="outline" onClick={() => setRotasSheetOpen(true)}>
            <MapPin className="mr-2 h-4 w-4" /> Rotas de Montagem
          </Button>
          <Button>
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
    </div>
  );
}
