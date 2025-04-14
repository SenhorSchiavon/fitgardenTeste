"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Minus, Trash, CreditCard, Send } from "lucide-react"
import { Header } from "@/components/header"

type Cliente = {
  id: string
  nome: string
  telefone: string
}

type Opcao = {
  id: string
  nome: string
  categoria: string
  tamanhos: { tamanho: string; preco: number }[]
}

type ItemPedido = {
  id: string
  opcao: string
  tamanho: string
  quantidade: number
  preco: number
}

export default function PedidoSemAgendamento() {
  const [clientes] = useState<Cliente[]>([
    { id: "CLI001", nome: "João Silva", telefone: "(43) 99999-8888" },
    { id: "CLI002", nome: "Maria Oliveira", telefone: "(43) 98888-7777" },
    { id: "CLI003", nome: "Ana Santos", telefone: "(43) 97777-6666" },
  ])

  const [opcoes] = useState<Opcao[]>([
    {
      id: "OPC001",
      nome: "Fit Tradicional",
      categoria: "FIT",
      tamanhos: [
        { tamanho: "350g", preco: 19.9 },
        { tamanho: "450g", preco: 24.9 },
      ],
    },
    {
      id: "OPC002",
      nome: "Low Carb Especial",
      categoria: "LOW CARB",
      tamanhos: [
        { tamanho: "350g", preco: 21.9 },
        { tamanho: "450g", preco: 26.9 },
      ],
    },
    {
      id: "OPC003",
      nome: "Vegetariano Mix",
      categoria: "VEGETARIANO",
      tamanhos: [
        { tamanho: "350g", preco: 18.9 },
        { tamanho: "450g", preco: 23.9 },
      ],
    },
    {
      id: "OPC004",
      nome: "Sobremesa Fit",
      categoria: "OUTROS",
      tamanhos: [{ tamanho: "150g", preco: 12.9 }],
    },
  ])

  const [pedido, setPedido] = useState({
    cliente: "",
    observacoes: "",
    formaPagamento: "dinheiro",
    itens: [] as ItemPedido[],
  })

  const [novoItem, setNovoItem] = useState<Partial<ItemPedido>>({
    opcao: "",
    tamanho: "",
    quantidade: 1,
  })

  const [pagamentoDialogOpen, setPagamentoDialogOpen] = useState(false)
  const [confirmacaoDialogOpen, setConfirmacaoDialogOpen] = useState(false)

  const handleAddItem = () => {
    if (novoItem.opcao && novoItem.tamanho) {
      const opcaoSelecionada = opcoes.find((o) => o.nome === novoItem.opcao)
      const tamanhoSelecionado = opcaoSelecionada?.tamanhos.find((t) => t.tamanho === novoItem.tamanho)

      if (opcaoSelecionada && tamanhoSelecionado) {
        const newItem: ItemPedido = {
          id: `ITEM${pedido.itens.length + 1}`,
          opcao: novoItem.opcao,
          tamanho: novoItem.tamanho,
          quantidade: novoItem.quantidade || 1,
          preco: tamanhoSelecionado.preco,
        }

        setPedido({
          ...pedido,
          itens: [...pedido.itens, newItem],
        })

        setNovoItem({
          opcao: "",
          tamanho: "",
          quantidade: 1,
        })
      }
    }
  }

  const handleRemoveItem = (id: string) => {
    setPedido({
      ...pedido,
      itens: pedido.itens.filter((item) => item.id !== id),
    })
  }

  const handleQuantityChange = (id: string, change: number) => {
    setPedido({
      ...pedido,
      itens: pedido.itens.map((item) =>
        item.id === id ? { ...item, quantidade: Math.max(1, item.quantidade + change) } : item,
      ),
    })
  }

  const calcularTotal = () => {
    return pedido.itens.reduce((total, item) => total + item.preco * item.quantidade, 0)
  }

  const handlePagamento = () => {
    setPagamentoDialogOpen(true)
  }

  const handleFinalizarPagamento = () => {
    // Aqui seria implementada a lógica para finalizar o pagamento
    setPagamentoDialogOpen(false)
    setConfirmacaoDialogOpen(true)
  }

  const handleEnviarWhatsapp = () => {
    // Aqui seria implementada a lógica para enviar o resumo do pedido por WhatsApp
    alert("Resumo do pedido enviado para o WhatsApp do cliente!")
  }

  const handleFinalizarPedido = () => {
    // Aqui seria implementada a lógica para finalizar o pedido
    setConfirmacaoDialogOpen(false)
    // Resetar o formulário
    setPedido({
      cliente: "",
      observacoes: "",
      formaPagamento: "dinheiro",
      itens: [],
    })
  }

  const getTamanhosByOpcao = (opcaoNome: string) => {
    const opcaoSelecionada = opcoes.find((o) => o.nome === opcaoNome)
    return opcaoSelecionada?.tamanhos || []
  }

  return (
    <div className="container mx-auto p-6">
      <Header title="Pedido sem Agendamento" subtitle="Crie pedidos para retirada imediata ou produtos congelados" />

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados do Pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="cliente">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="cliente">Cliente</TabsTrigger>
                <TabsTrigger value="itens">Itens do Pedido</TabsTrigger>
              </TabsList>
              <TabsContent value="cliente" className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="cliente">Cliente</Label>
                  <Select value={pedido.cliente} onValueChange={(value) => setPedido({ ...pedido, cliente: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.nome}>
                          {cliente.nome} - {cliente.telefone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={pedido.observacoes}
                    onChange={(e) => setPedido({ ...pedido, observacoes: e.target.value })}
                    placeholder="Alguma observação sobre o pedido..."
                  />
                </div>
              </TabsContent>
              <TabsContent value="itens" className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="opcao">Opção</Label>
                    <Select
                      value={novoItem.opcao}
                      onValueChange={(value) => setNovoItem({ ...novoItem, opcao: value, tamanho: "" })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma opção" />
                      </SelectTrigger>
                      <SelectContent>
                        {opcoes.map((opcao) => (
                          <SelectItem key={opcao.id} value={opcao.nome}>
                            {opcao.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tamanho">Tamanho</Label>
                    <Select
                      value={novoItem.tamanho}
                      onValueChange={(value) => setNovoItem({ ...novoItem, tamanho: value })}
                      disabled={!novoItem.opcao}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um tamanho" />
                      </SelectTrigger>
                      <SelectContent>
                        {getTamanhosByOpcao(novoItem.opcao || "").map((tamanho) => (
                          <SelectItem key={tamanho.tamanho} value={tamanho.tamanho}>
                            {tamanho.tamanho} - R$ {tamanho.preco.toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <Label htmlFor="quantidade">Quantidade</Label>
                  <div className="flex items-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setNovoItem({ ...novoItem, quantidade: Math.max(1, (novoItem.quantidade || 1) - 1) })
                      }
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      id="quantidade"
                      type="number"
                      min="1"
                      className="w-16 text-center mx-2"
                      value={novoItem.quantidade || 1}
                      onChange={(e) => setNovoItem({ ...novoItem, quantidade: Number.parseInt(e.target.value) || 1 })}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setNovoItem({ ...novoItem, quantidade: (novoItem.quantidade || 1) + 1 })}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button type="button" onClick={handleAddItem} disabled={!novoItem.opcao || !novoItem.tamanho}>
                    Adicionar Item
                  </Button>
                </div>

                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Tamanho</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Preço Unit.</TableHead>
                        <TableHead>Subtotal</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pedido.itens.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.opcao}</TableCell>
                          <TableCell>{item.tamanho}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleQuantityChange(item.id, -1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="mx-2">{item.quantidade}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleQuantityChange(item.id, 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>R$ {item.preco.toFixed(2)}</TableCell>
                          <TableCell>R$ {(item.preco * item.quantidade).toFixed(2)}</TableCell>
                          <TableCell>
                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}>
                              <Trash className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {pedido.itens.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4">
                            Nenhum item adicionado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>R$ {calcularTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>R$ {calcularTotal().toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <Button
                className="w-full"
                onClick={handlePagamento}
                disabled={pedido.itens.length === 0 || !pedido.cliente}
              >
                <CreditCard className="mr-2 h-4 w-4" /> Pagamento
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleEnviarWhatsapp}
                disabled={pedido.itens.length === 0 || !pedido.cliente}
              >
                <Send className="mr-2 h-4 w-4" /> Enviar para WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={pagamentoDialogOpen} onOpenChange={setPagamentoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Pagamento</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <RadioGroup
                value={pedido.formaPagamento}
                onValueChange={(value) => setPedido({ ...pedido, formaPagamento: value })}
                className="grid grid-cols-2 gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dinheiro" id="dinheiro" />
                  <Label htmlFor="dinheiro">Dinheiro</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="credito" id="credito" />
                  <Label htmlFor="credito">Cartão de Crédito</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="debito" id="debito" />
                  <Label htmlFor="debito">Cartão de Débito</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pix" id="pix" />
                  <Label htmlFor="pix">PIX</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Valor Total</Label>
              <div className="text-2xl font-bold">R$ {calcularTotal().toFixed(2)}</div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setPagamentoDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleFinalizarPagamento}>Finalizar Pagamento</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmacaoDialogOpen} onOpenChange={setConfirmacaoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pedido Finalizado</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Pedido finalizado com sucesso!</p>
            <p className="mt-2">Cliente: {pedido.cliente}</p>
            <p>Total: R$ {calcularTotal().toFixed(2)}</p>
            <p>Forma de Pagamento: {pedido.formaPagamento}</p>
          </div>
          <DialogFooter>
            <Button onClick={handleFinalizarPedido}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
