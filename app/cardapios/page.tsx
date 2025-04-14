"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash, Check } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Header } from "@/components/header"

type Cardapio = {
  id: string
  codigo: string
  nome: string
  ativo: boolean
  opcoes: string[]
}

type Opcao = {
  id: string
  nome: string
  categoria: string
}

export default function Cardapios() {
  const [cardapios, setCardapios] = useState<Cardapio[]>([
    {
      id: "CARD001",
      codigo: "1",
      nome: "Cardápio Semanal",
      ativo: true,
      opcoes: ["Fit Tradicional", "Low Carb Especial", "Vegetariano Mix"],
    },
    {
      id: "CARD002",
      codigo: "2",
      nome: "Cardápio Executivo",
      ativo: false,
      opcoes: ["Fit Tradicional", "Proteico Plus"],
    },
  ])

  const [opcoes] = useState<Opcao[]>([
    { id: "OPC001", nome: "Fit Tradicional", categoria: "FIT" },
    { id: "OPC002", nome: "Low Carb Especial", categoria: "LOW CARB" },
    { id: "OPC003", nome: "Vegetariano Mix", categoria: "VEGETARIANO" },
    { id: "OPC004", nome: "Proteico Plus", categoria: "FIT" },
    { id: "OPC005", nome: "Sopa Detox", categoria: "SOPA" },
  ])

  const [novoCardapio, setNovoCardapio] = useState<Partial<Cardapio>>({
    codigo: "",
    nome: "",
    ativo: true,
    opcoes: [],
  })

  const [editando, setEditando] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)

  const handleSave = () => {
    if (editando) {
      setCardapios(
        cardapios.map((card) =>
          card.id === editando
            ? {
                ...card,
                codigo: novoCardapio.codigo || "",
                nome: novoCardapio.nome || "",
                ativo: novoCardapio.ativo || false,
                opcoes: novoCardapio.opcoes || [],
              }
            : card,
        ),
      )
      setEditando(null)
    } else {
      const newId = `CARD${String(cardapios.length + 1).padStart(3, "0")}`
      setCardapios([
        ...cardapios,
        {
          id: newId,
          codigo: novoCardapio.codigo || "",
          nome: novoCardapio.nome || "",
          ativo: novoCardapio.ativo || false,
          opcoes: novoCardapio.opcoes || [],
        },
      ])
    }

    setNovoCardapio({ codigo: "", nome: "", ativo: true, opcoes: [] })
    setDialogOpen(false)
  }

  const handleEdit = (cardapio: Cardapio) => {
    setNovoCardapio({
      codigo: cardapio.codigo,
      nome: cardapio.nome,
      ativo: cardapio.ativo,
      opcoes: [...cardapio.opcoes],
    })
    setEditando(cardapio.id)
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setCardapios(cardapios.filter((card) => card.id !== id))
  }

  const handleNew = () => {
    setNovoCardapio({ codigo: "", nome: "", ativo: true, opcoes: [] })
    setEditando(null)
    setDialogOpen(true)
  }

  const handleToggleOpcao = (opcaoNome: string) => {
    const opcoes = novoCardapio.opcoes || []
    if (opcoes.includes(opcaoNome)) {
      setNovoCardapio({
        ...novoCardapio,
        opcoes: opcoes.filter((o) => o !== opcaoNome),
      })
    } else {
      setNovoCardapio({
        ...novoCardapio,
        opcoes: [...opcoes, opcaoNome],
      })
    }
  }

  const handleConfirmSave = () => {
    setConfirmDialogOpen(false)
    handleSave()
  }

  const handlePreSave = () => {
    setConfirmDialogOpen(true)
  }

  const opcoesPorCategoria = () => {
    const categorias: Record<string, Opcao[]> = {}
    opcoes.forEach((opcao) => {
      if (!categorias[opcao.categoria]) {
        categorias[opcao.categoria] = []
      }
      categorias[opcao.categoria].push(opcao)
    })
    return categorias
  }

  return (
    <div className="container mx-auto p-6">
      <Header title="Cardápios" subtitle="Gerencie os cardápios disponíveis" />

      <div className="flex items-center justify-end mb-6">
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" /> Criar Cardápio
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cardápios Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cardapios.map((cardapio) => (
                <TableRow key={cardapio.id}>
                  <TableCell>{cardapio.codigo}</TableCell>
                  <TableCell>{cardapio.nome}</TableCell>
                  <TableCell>
                    {cardapio.ativo ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        <Check className="mr-1 h-3 w-3" />
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                        Inativo
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(cardapio)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(cardapio.id)}>
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
            <DialogTitle>{editando ? "Editar Cardápio" : "Novo Cardápio"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={novoCardapio.nome || ""}
                  onChange={(e) => setNovoCardapio({ ...novoCardapio, nome: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="codigo">Código</Label>
                <Input
                  id="codigo"
                  value={novoCardapio.codigo || ""}
                  onChange={(e) => setNovoCardapio({ ...novoCardapio, codigo: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Código para ordenação dos cardápios</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="ativo"
                checked={novoCardapio.ativo}
                onCheckedChange={(checked) => setNovoCardapio({ ...novoCardapio, ativo: !!checked })}
              />
              <Label htmlFor="ativo">Ativo</Label>
            </div>

            <div className="space-y-2 border-t pt-4">
              <Label>Refeições</Label>
              <ScrollArea className="h-72 rounded-md border">
                <div className="p-4">
                  {Object.entries(opcoesPorCategoria()).map(([categoria, opcoesCategoria]) => (
                    <div key={categoria} className="mb-4">
                      <h3 className="mb-2 font-medium">{categoria}</h3>
                      <div className="space-y-2">
                        {opcoesCategoria.map((opcao) => (
                          <div key={opcao.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={opcao.id}
                              checked={(novoCardapio.opcoes || []).includes(opcao.nome)}
                              onCheckedChange={() => handleToggleOpcao(opcao.nome)}
                            />
                            <Label htmlFor={opcao.id}>{opcao.nome}</Label>
                          </div>
                        ))}
                      </div>
                      <Separator className="my-2" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handlePreSave}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Seleção</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <h3 className="mb-2 font-medium">Opções selecionadas:</h3>
            {Object.entries(opcoesPorCategoria()).map(([categoria, opcoesCategoria]) => {
              const opcoesSelecionadas = opcoesCategoria.filter((o) => (novoCardapio.opcoes || []).includes(o.nome))
              if (opcoesSelecionadas.length === 0) return null
              return (
                <div key={categoria} className="mb-2">
                  <h4 className="text-sm font-medium">{categoria}:</h4>
                  <ul className="ml-4 list-disc">
                    {opcoesSelecionadas.map((opcao) => (
                      <li key={opcao.id} className="text-sm">
                        {opcao.nome}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Voltar
            </Button>
            <Button onClick={handleConfirmSave}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
