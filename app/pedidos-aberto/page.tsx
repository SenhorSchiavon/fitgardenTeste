"use client"

import { SelectItem } from "@/components/ui/select"

import { SelectContent } from "@/components/ui/select"

import { SelectValue } from "@/components/ui/select"

import { SelectTrigger } from "@/components/ui/select"

import { Select } from "@/components/ui/select"

import { Label } from "@/components/ui/label"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CreditCard, MapPin, Phone, Trash, TruckIcon, User, CalendarIcon } from "lucide-react"
import { Header } from "@/components/header"

type PedidoAberto = {
  id: string
  numeroPedido: string
  cliente: string
  tipoEntrega: "ENTREGA" | "RETIRADA"
  faixaHorario: "13-15" | "15-17" | "17-18" | "18-20:30"
  endereco: string
  zona: "CENTRO" | "ZONA SUL" | "ZONA NORTE" | "ZONA LESTE" | "CAMBÉ" | "IBIPORÃ"
  telefone: string
  quantidade: number
  formaPagamento: string
  entregador: string
  observacoes?: string
  itens: {
    nome: string
    tamanho: string
    quantidade: number
  }[]
  data: string
}

export default function PedidosAberto() {
  const [pedidosAberto, setPedidosAberto] = useState<PedidoAberto[]>([
    {
      id: "PED001",
      numeroPedido: "#3005",
      cliente: "Roberto Almeida",
      tipoEntrega: "ENTREGA",
      faixaHorario: "13-15",
      endereco: "Rua das Palmeiras, 456",
      zona: "CENTRO",
      telefone: "(43) 95555-4444",
      quantidade: 3,
      formaPagamento: "Pendente",
      entregador: "Carlos",
      observacoes: "Cliente solicitou contato antes da entrega",
      itens: [
        { nome: "Fit Tradicional", tamanho: "350g", quantidade: 2 },
        { nome: "Low Carb Especial", tamanho: "450g", quantidade: 1 },
      ],
      data: "2023-06-15",
    },
    {
      id: "PED002",
      numeroPedido: "#3006",
      cliente: "Juliana Costa",
      tipoEntrega: "RETIRADA",
      faixaHorario: "15-17",
      endereco: "-",
      zona: "CENTRO",
      telefone: "(43) 94444-3333",
      quantidade: 5,
      formaPagamento: "Pendente",
      entregador: "-",
      itens: [{ nome: "Vegetariano Mix", tamanho: "350g", quantidade: 5 }],
      data: "2023-06-16",
    },
  ])

  const [pedidoSelecionado, setPedidoSelecionado] = useState<PedidoAberto | null>(null)
  const [detalhesDialogOpen, setDetalhesDialogOpen] = useState(false)
  const [pagamentoDialogOpen, setPagamentoDialogOpen] = useState(false)

  const handleShowDetalhes = (pedido: PedidoAberto) => {
    setPedidoSelecionado(pedido)
    setDetalhesDialogOpen(true)
  }

  const handleDeletePedido = (id: string) => {
    setPedidosAberto(pedidosAberto.filter((ped) => ped.id !== id))
    setDetalhesDialogOpen(false)
  }

  const handlePagamento = () => {
    setPagamentoDialogOpen(true)
  }

  const handleFinalizarPagamento = () => {
    // Aqui seria implementada a lógica para finalizar o pagamento
    // e mover o pedido para o histórico
    if (pedidoSelecionado) {
      setPedidosAberto(pedidosAberto.filter((ped) => ped.id !== pedidoSelecionado.id))
      setPagamentoDialogOpen(false)
      setDetalhesDialogOpen(false)
    }
  }

  const getFaixaHorarioColor = (faixa: string) => {
    switch (faixa) {
      case "13-15":
        return "bg-red-500"
      case "15-17":
        return "bg-orange-500"
      case "17-18":
        return "bg-green-500"
      case "18-20:30":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  const getZonaColor = (zona: string) => {
    switch (zona) {
      case "CENTRO":
        return "bg-purple-500"
      case "ZONA SUL":
        return "bg-yellow-500"
      case "ZONA NORTE":
        return "bg-pink-500"
      case "ZONA LESTE":
        return "bg-emerald-500"
      case "CAMBÉ":
        return "bg-indigo-500"
      case "IBIPORÃ":
        return "bg-amber-500"
      default:
        return "bg-gray-500"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  return (
    <div className="container mx-auto p-6">
      <Header title="Pedidos em Aberto" subtitle="Gerencie os pedidos com pagamento pendente" />

      <Card>
        <CardHeader>
          <CardTitle>Pedidos com Pagamento Pendente</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-250px)]">
            <div className="space-y-4">
              {pedidosAberto.map((pedido) => (
                <div
                  key={pedido.id}
                  className="flex flex-col border rounded-lg overflow-hidden cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleShowDetalhes(pedido)}
                >
                  <div className="flex items-center p-4 bg-muted/40">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="font-medium">{pedido.numeroPedido}</span>
                        <span className="mx-2">-</span>
                        <span>{pedido.cliente}</span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <Badge variant={pedido.tipoEntrega === "ENTREGA" ? "default" : "outline"}>
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
                  <div className={`h-1 ${getFaixaHorarioColor(pedido.faixaHorario)}`} style={{ width: "70%" }}></div>
                  <div className={`h-1 ${getZonaColor(pedido.zona)}`} style={{ width: "30%", marginLeft: "70%" }}></div>
                </div>
              ))}
              {pedidosAberto.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">Não há pedidos com pagamento pendente</div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={detalhesDialogOpen} onOpenChange={setDetalhesDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Detalhes do Pedido {pedidoSelecionado?.numeroPedido} - {pedidoSelecionado?.cliente}
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
                  {pedidoSelecionado?.endereco} ({pedidoSelecionado?.zona})
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
                  <div className="p-2 bg-muted rounded-md">{pedidoSelecionado.observacoes}</div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="destructive"
                  onClick={() => pedidoSelecionado && handleDeletePedido(pedidoSelecionado.id)}
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
              <Select defaultValue="credito">
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="debito">Cartão de Débito</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="voucher">Voucher</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Valor Total</Label>
              <div className="text-2xl font-bold">R$ 150,00</div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setPagamentoDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleFinalizarPagamento}>Finalizar Pagamento</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
