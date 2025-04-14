"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash, Search, History, Tag } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"

type Cliente = {
  id: string
  nome: string
  telefone: string
  cpf: string
  endereco: string
  enderecoAlternativo?: string
  regiao: "CENTRO" | "ZONA SUL" | "ZONA NORTE" | "ZONA LESTE" | "CAMBÉ" | "IBIPORÃ"
  dataNascimento: string
  planos: Plano[]
  tags: string[]
}

type Plano = {
  id: string
  nome: string
  tamanho: string
  saldoRestante: number
}

type HistoricoPedido = {
  id: string
  data: string
  quantidade: number
  tamanho: string
  pagamento: string
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([
    {
      id: "CLI001",
      nome: "João Silva",
      telefone: "(43) 99999-8888",
      cpf: "123.456.789-00",
      endereco: "Rua das Flores, 123",
      regiao: "CENTRO",
      dataNascimento: "1985-05-15",
      planos: [
        { id: "PLANO001", nome: "Mensal Fit", tamanho: "350g", saldoRestante: 20 },
        { id: "PLANO002", nome: "Semanal Low Carb", tamanho: "450g", saldoRestante: 5 },
      ],
      tags: ["VIP", "Vegetariano"],
    },
    {
      id: "CLI002",
      nome: "Maria Oliveira",
      telefone: "(43) 98888-7777",
      cpf: "987.654.321-00",
      endereco: "Av. Principal, 456",
      enderecoAlternativo: "Rua Comercial, 789",
      regiao: "ZONA SUL",
      dataNascimento: "1990-10-20",
      planos: [{ id: "PLANO003", nome: "Quinzenal Fit", tamanho: "350g", saldoRestante: 10 }],
      tags: ["Novo Cliente"],
    },
  ])

  const [historicoPedidos] = useState<HistoricoPedido[]>([
    { id: "PED001", data: "2023-05-10", quantidade: 5, tamanho: "350g", pagamento: "Cartão de Crédito" },
    { id: "PED002", data: "2023-05-17", quantidade: 5, tamanho: "350g", pagamento: "PIX" },
    { id: "PED003", data: "2023-05-24", quantidade: 5, tamanho: "350g", pagamento: "Dinheiro" },
    { id: "PED004", data: "2023-05-31", quantidade: 5, tamanho: "350g", pagamento: "Cartão de Débito" },
  ])

  const [novoCliente, setNovoCliente] = useState<Partial<Cliente>>({
    nome: "",
    telefone: "",
    cpf: "",
    endereco: "",
    enderecoAlternativo: "",
    regiao: "CENTRO",
    dataNascimento: "",
    planos: [],
    tags: [],
  })

  const [novaTag, setNovaTag] = useState("")
  const [editando, setEditando] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [historicoDialogOpen, setHistoricoDialogOpen] = useState(false)
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const handleSave = () => {
    if (editando) {
      setClientes(
        clientes.map((cli) =>
          cli.id === editando
            ? {
                ...cli,
                nome: novoCliente.nome || "",
                telefone: novoCliente.telefone || "",
                cpf: novoCliente.cpf || "",
                endereco: novoCliente.endereco || "",
                enderecoAlternativo: novoCliente.enderecoAlternativo,
                regiao: novoCliente.regiao || "CENTRO",
                dataNascimento: novoCliente.dataNascimento || "",
                tags: novoCliente.tags || [],
                planos: novoCliente.planos || [],
              }
            : cli,
        ),
      )
      setEditando(null)
    } else {
      const newId = `CLI${String(clientes.length + 1).padStart(3, "0")}`
      setClientes([
        ...clientes,
        {
          id: newId,
          nome: novoCliente.nome || "",
          telefone: novoCliente.telefone || "",
          cpf: novoCliente.cpf || "",
          endereco: novoCliente.endereco || "",
          enderecoAlternativo: novoCliente.enderecoAlternativo,
          regiao: novoCliente.regiao || "CENTRO",
          dataNascimento: novoCliente.dataNascimento || "",
          tags: novoCliente.tags || [],
          planos: [],
        },
      ])
    }

    setNovoCliente({
      nome: "",
      telefone: "",
      cpf: "",
      endereco: "",
      enderecoAlternativo: "",
      regiao: "CENTRO",
      dataNascimento: "",
      planos: [],
      tags: [],
    })
    setDialogOpen(false)
  }

  const handleEdit = (cliente: Cliente) => {
    setNovoCliente({
      nome: cliente.nome,
      telefone: cliente.telefone,
      cpf: cliente.cpf,
      endereco: cliente.endereco,
      enderecoAlternativo: cliente.enderecoAlternativo,
      regiao: cliente.regiao,
      dataNascimento: cliente.dataNascimento,
      planos: [...cliente.planos],
      tags: [...cliente.tags],
    })
    setEditando(cliente.id)
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setClientes(clientes.filter((cli) => cli.id !== id))
  }

  const handleNew = () => {
    setNovoCliente({
      nome: "",
      telefone: "",
      cpf: "",
      endereco: "",
      enderecoAlternativo: "",
      regiao: "CENTRO",
      dataNascimento: "",
      planos: [],
      tags: [],
    })
    setEditando(null)
    setDialogOpen(true)
  }

  const handleAddTag = () => {
    if (novaTag.trim() && !novoCliente.tags?.includes(novaTag.trim())) {
      setNovoCliente({
        ...novoCliente,
        tags: [...(novoCliente.tags || []), novaTag.trim()],
      })
      setNovaTag("")
    }
  }

  const handleRemoveTag = (tag: string) => {
    setNovoCliente({
      ...novoCliente,
      tags: (novoCliente.tags || []).filter((t) => t !== tag),
    })
  }

  const handleShowHistory = (cliente: Cliente) => {
    setClienteSelecionado(cliente)
    setHistoricoDialogOpen(true)
  }

  const filteredClientes = clientes.filter(
    (cliente) =>
      cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.telefone.includes(searchTerm) ||
      cliente.endereco.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="container mx-auto p-6">
      <Header title="Cadastro de Clientes" subtitle="Gerencie os clientes e seus planos" />

      <div className="flex items-center justify-between mb-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone ou endereço..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" /> Novo Cliente
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clientes Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Data de Nascimento</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClientes.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell className="font-medium">{cliente.nome}</TableCell>
                  <TableCell>{cliente.telefone}</TableCell>
                  <TableCell>{cliente.endereco}</TableCell>
                  <TableCell>
                    {cliente.planos.length > 0
                      ? `${cliente.planos[0].nome} (${cliente.planos[0].saldoRestante} un.)`
                      : "Sem plano"}
                  </TableCell>
                  <TableCell>
                    {cliente.dataNascimento
                      ? new Date(cliente.dataNascimento).toLocaleDateString("pt-BR")
                      : "Não informada"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleShowHistory(cliente)}>
                      <History className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(cliente)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(cliente.id)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="dados">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="dados">Dados Pessoais</TabsTrigger>
              <TabsTrigger value="tags">Tags</TabsTrigger>
            </TabsList>
            <TabsContent value="dados" className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={novoCliente.nome || ""}
                    onChange={(e) => setNovoCliente({ ...novoCliente, nome: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={novoCliente.telefone || ""}
                    onChange={(e) => setNovoCliente({ ...novoCliente, telefone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={novoCliente.cpf || ""}
                    onChange={(e) => setNovoCliente({ ...novoCliente, cpf: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                  <Input
                    id="dataNascimento"
                    type="date"
                    value={novoCliente.dataNascimento || ""}
                    onChange={(e) => setNovoCliente({ ...novoCliente, dataNascimento: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={novoCliente.endereco || ""}
                  onChange={(e) => setNovoCliente({ ...novoCliente, endereco: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="enderecoAlternativo">Endereço Alternativo</Label>
                <Input
                  id="enderecoAlternativo"
                  value={novoCliente.enderecoAlternativo || ""}
                  onChange={(e) => setNovoCliente({ ...novoCliente, enderecoAlternativo: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="regiao">Região</Label>
                <Select
                  value={novoCliente.regiao}
                  onValueChange={(value) =>
                    setNovoCliente({
                      ...novoCliente,
                      regiao: value as "CENTRO" | "ZONA SUL" | "ZONA NORTE" | "ZONA LESTE" | "CAMBÉ" | "IBIPORÃ",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma região" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CENTRO">CENTRO</SelectItem>
                    <SelectItem value="ZONA SUL">ZONA SUL</SelectItem>
                    <SelectItem value="ZONA NORTE">ZONA NORTE</SelectItem>
                    <SelectItem value="ZONA LESTE">ZONA LESTE</SelectItem>
                    <SelectItem value="CAMBÉ">CAMBÉ</SelectItem>
                    <SelectItem value="IBIPORÃ">IBIPORÃ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
            <TabsContent value="tags" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(novoCliente.tags || []).map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 rounded-full"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        <Trash className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nova tag..."
                    value={novaTag}
                    onChange={(e) => setNovaTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddTag}>
                    <Tag className="mr-2 h-4 w-4" /> Adicionar
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={historicoDialogOpen} onOpenChange={setHistoricoDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Histórico de Pedidos - {clienteSelecionado?.nome}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="historico">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="historico">Histórico de Pedidos</TabsTrigger>
              <TabsTrigger value="planos">Planos em Aberto</TabsTrigger>
            </TabsList>
            <TabsContent value="historico" className="py-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Quantidade (UN)</TableHead>
                    <TableHead>Tamanho</TableHead>
                    <TableHead>Pagamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historicoPedidos.map((pedido) => (
                    <TableRow key={pedido.id}>
                      <TableCell>{new Date(pedido.data).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>{pedido.quantidade}</TableCell>
                      <TableCell>{pedido.tamanho}</TableCell>
                      <TableCell>{pedido.pagamento}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="planos" className="py-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plano Adquirido</TableHead>
                    <TableHead>Tamanho</TableHead>
                    <TableHead>Saldo Restante</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clienteSelecionado?.planos.map((plano) => (
                    <TableRow key={plano.id}>
                      <TableCell>{plano.nome}</TableCell>
                      <TableCell>{plano.tamanho}</TableCell>
                      <TableCell>{plano.saldoRestante} unidades</TableCell>
                    </TableRow>
                  ))}
                  {clienteSelecionado?.planos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center">
                        Nenhum plano ativo
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
