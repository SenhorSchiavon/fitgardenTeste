"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { CreditCard, MapPin, Phone, Search, TruckIcon, User, CalendarIcon } from "lucide-react"
import { Header } from "@/components/header"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { useAgendamentos } from "@/hooks/useAgendamentos" // <<< ajusta caminho
import { useTableSort } from "@/hooks/useTableSort"
import { SortableHead } from "@/components/ui/sorttable"

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
    tipoItem?: string
    destinatarioNome?: string
    observacaoItem?: string
    carboNome?: string
    proteinaNome?: string
    legumeNome?: string
    feijaoNome?: string
    complementoNome?: string
    carboGramas?: number
    proteinaGramas?: number
    legumeGramas?: number
    feijaoGramas?: number
    complementoGramas?: number
    trocas?: string
  }[]
  data: string
  status: "ENTREGUE" | "CANCELADO"
  agendamentoId: number
  pedidoId: number
}

export default function HistoricoPedidos() {
  const { getHistorico, loading } = useAgendamentos()

  const [historicoPedidos, setHistoricoPedidos] = useState<HistoricoPedido[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [pedidoSelecionado, setPedidoSelecionado] = useState<HistoricoPedido | null>(null)
  const [detalhesDialogOpen, setDetalhesDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search)
      const querySearch = sp.get("search")
      if (querySearch) {
        setSearchTerm(querySearch)
      }
    }
  }, [])

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

  const formatTamanho = (tamanho?: string) => {
    if (!tamanho || tamanho === "-") return "-"
    return /^\d+$/.test(String(tamanho)) ? `${tamanho}g` : tamanho
  }

  const getItemDetalhes = (item: HistoricoPedido["itens"][number]) => {
    const composicao = [
      item.carboNome && `${item.carboNome}${item.carboGramas ? ` (${item.carboGramas}g)` : ""}`,
      item.proteinaNome && `${item.proteinaNome}${item.proteinaGramas ? ` (${item.proteinaGramas}g)` : ""}`,
      item.legumeNome && `${item.legumeNome}${item.legumeGramas ? ` (${item.legumeGramas}g)` : ""}`,
      item.feijaoNome && `${item.feijaoNome}${item.feijaoGramas ? ` (${item.feijaoGramas}g)` : ""}`,
      item.complementoNome && `${item.complementoNome}${item.complementoGramas ? ` (${item.complementoGramas}g)` : ""}`,
    ].filter(Boolean)

    return [
      item.destinatarioNome && !item.nome.includes(item.destinatarioNome) ? `Destinatário: ${item.destinatarioNome}` : null,
      composicao.length ? composicao.join(" • ") : null,
      item.trocas ? `Alterações: ${item.trocas}` : null,
      item.observacaoItem ? `Obs.: ${item.observacaoItem}` : null,
    ].filter(Boolean)
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd = Math.min(page * pageSize, total)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      const res = await getHistorico<HistoricoPedido>({
        date: dateFilter || undefined,
        q: searchTerm.trim() || undefined,
        page,
        pageSize,
      })
      if (mounted) {
        setHistoricoPedidos(res.rows || [])
        setTotal(Number(res.total || 0))
      }
    }

    load().catch(() => {})
    return () => {
      mounted = false
    }
  }, [dateFilter, getHistorico, page, pageSize, searchTerm])

  useEffect(() => {
    setPage(1)
  }, [dateFilter, pageSize, searchTerm])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const { sort, onSort, sortedRows } = useTableSort(historicoPedidos)

  return (
    <div className="container mx-auto p-6">
      <Header title="Histórico de Pedidos" subtitle="Consulte o histórico de pedidos realizados" />

      <div className="mb-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_150px_auto]">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número do pedido, cliente ou telefone..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />
        <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
          <SelectTrigger>
            <SelectValue placeholder="Itens por página" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 por página</SelectItem>
            <SelectItem value="25">25 por página</SelectItem>
            <SelectItem value="50">50 por página</SelectItem>
            <SelectItem value="100">100 por página</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() => {
            setSearchTerm("")
            setDateFilter("")
          }}
          disabled={!searchTerm && !dateFilter}
        >
          Limpar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pedidos Realizados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead label="Pedido" field="numeroPedido" sort={sort} onSort={onSort} />
                <SortableHead label="Data" field="data" sort={sort} onSort={onSort} />
                <SortableHead label="Cliente" field="cliente" sort={sort} onSort={onSort} />
                <SortableHead label="Entrega/Retirada" field="tipoEntrega" sort={sort} onSort={onSort} />
                <SortableHead label="Pagamento" field="formaPagamento" sort={sort} onSort={onSort} />
                <SortableHead label="Status" field="status" sort={sort} onSort={onSort} />
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {sortedRows.map((pedido) => (
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

              {historicoPedidos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    {loading ? "Carregando..." : "Nenhum pedido encontrado"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="mt-4 flex flex-col gap-3 border-t pt-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <div>
              {loading
                ? "Carregando pedidos..."
                : `Mostrando ${rangeStart}-${rangeEnd} de ${total} pedidos`}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={loading || page <= 1}
              >
                Anterior
              </Button>
              <span className="min-w-24 text-center">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={loading || page >= totalPages}
              >
                Próxima
              </Button>
            </div>
          </div>
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
                  <div className="text-sm font-medium">Faixa de Horário / Horário</div>
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                    {pedidoSelecionado?.faixaHorario || "-"}
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
                    <TableHead className="text-right">Quantidade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedidoSelecionado?.itens?.length ? (
                    pedidoSelecionado.itens.map((item, index) => {
                      const detalhes = getItemDetalhes(item)
                      return (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="font-medium">{item.nome}</div>
                            {detalhes.length > 0 && (
                              <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                                {detalhes.map((detalhe, detalheIndex) => (
                                  <div key={detalheIndex}>{detalhe}</div>
                                ))}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{formatTamanho(item.tamanho)}</TableCell>
                          <TableCell className="text-right">{item.quantidade}</TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">
                        Nenhum item encontrado para este pedido.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}
