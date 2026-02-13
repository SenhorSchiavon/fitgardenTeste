"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { CreditCard, MapPin, Phone, Search, TruckIcon, User, CalendarIcon } from "lucide-react"
import { Header } from "@/components/header"

import { useAgendamentos } from "@/hooks/useAgendamentos" // <<< ajusta caminho

type HistoricoPedido = {
  id: string
  numeroPedido: string
  cliente: string
  tipoEntrega: "ENTREGA" | "RETIRADA"
  faixaHorario: string
  endereco: string
  zona: any
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
  status: "ENTREGUE" | "CANCELADO"
  agendamentoId: number
  pedidoId: number
}

export default function HistoricoPedidos() {
  const { getHistorico, loading } = useAgendamentos()

  const [historicoPedidos, setHistoricoPedidos] = useState<HistoricoPedido[]>([])
  const [pedidoSelecionado, setPedidoSelecionado] = useState<HistoricoPedido | null>(null)
  const [detalhesDialogOpen, setDetalhesDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const handleShowDetalhes = (pedido: HistoricoPedido) => {
    setPedidoSelecionado(pedido)
    setDetalhesDialogOpen(true)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  useEffect(() => {
    let mounted = true

    const load = async () => {
      // aqui pode mandar date se quiser filtrar por dia:
      // const today = new Date(); const date = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`
      const res = await getHistorico<HistoricoPedido>({
        // date,
        page: 1,
        pageSize: 200,
      })
      if (mounted) setHistoricoPedidos(res.rows || [])
    }

    load().catch(() => {})
    return () => {
      mounted = false
    }
  }, [getHistorico])

  const filteredPedidos = useMemo(() => {
    const t = searchTerm.trim().toLowerCase()
    if (!t) return historicoPedidos

    return historicoPedidos.filter((pedido) => {
      const dataFmt = formatDate(pedido.data)
      return (
        pedido.numeroPedido.toLowerCase().includes(t) ||
        pedido.cliente.toLowerCase().includes(t) ||
        dataFmt.includes(searchTerm) // mantém igual teu filtro por data digitada
      )
    })
  }, [historicoPedidos, searchTerm])

  return (
    <div className="container mx-auto p-6">
      <Header title="Histórico de Pedidos" subtitle="Consulte o histórico de pedidos realizados" />

      <div className="relative mb-6">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por número do pedido, cliente ou data..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pedidos Realizados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Entrega/Retirada</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredPedidos.map((pedido) => (
                <TableRow key={pedido.id}>
                  <TableCell>{pedido.numeroPedido}</TableCell>
                  <TableCell>{formatDate(pedido.data)}</TableCell>
                  <TableCell>{pedido.cliente}</TableCell>
                  <TableCell>{pedido.tipoEntrega}</TableCell>
                  <TableCell>{pedido.formaPagamento}</TableCell>
                  <TableCell>
                    <Badge variant={pedido.status === "ENTREGUE" ? "default" : "destructive"}>
                      {pedido.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleShowDetalhes(pedido)}>
                      Detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {filteredPedidos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    {loading ? "Carregando..." : "Nenhum pedido encontrado"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
                  {pedidoSelecionado?.endereco} ({String(pedidoSelecionado?.zona || "-")})
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Forma de Pagamento</div>
                  <div className="flex items-center">
                    <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
                    {pedidoSelecionado?.formaPagamento}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Status</div>
                  <div className="flex items-center">
                    <Badge variant={pedidoSelecionado?.status === "ENTREGUE" ? "default" : "destructive"}>
                      {pedidoSelecionado?.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {pedidoSelecionado?.observacoes && (
                <div className="space-y-1">
                  <div className="text-sm font-medium">Observações</div>
                  <div className="p-2 bg-muted rounded-md">{pedidoSelecionado.observacoes}</div>
                </div>
              )}
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
    </div>
  )
}
