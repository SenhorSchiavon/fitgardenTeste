"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash, FileSpreadsheet } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Header } from "@/components/header"

type Ingrediente = {
  id: string
  nome: string
  categoria: string
  precoCusto: number
  medida: "UN" | "KG" | "L"
}

type Categoria = {
  id: string
  descricao: string
}

export default function Ingredientes() {
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([
    { id: "ING001", nome: "Peito de Frango", categoria: "Proteínas", precoCusto: 22.9, medida: "KG" },
    { id: "ING002", nome: "Arroz Integral", categoria: "Carboidratos", precoCusto: 7.5, medida: "KG" },
    { id: "ING003", nome: "Brócolis", categoria: "Legumes", precoCusto: 8.9, medida: "KG" },
    { id: "ING004", nome: "Azeite", categoria: "Temperos", precoCusto: 29.9, medida: "L" },
  ])

  const [categorias] = useState<Categoria[]>([
    { id: "CAT001", descricao: "Proteínas" },
    { id: "CAT002", descricao: "Carboidratos" },
    { id: "CAT003", descricao: "Legumes" },
    { id: "CAT004", descricao: "Temperos" },
  ])

  const [novoIngrediente, setNovoIngrediente] = useState<Partial<Ingrediente>>({
    nome: "",
    categoria: "",
    precoCusto: 0,
    medida: "UN",
  })

  const [editando, setEditando] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleSave = () => {
    if (editando) {
      setIngredientes(
        ingredientes.map((ing) =>
          ing.id === editando
            ? {
                ...ing,
                nome: novoIngrediente.nome || "",
                categoria: novoIngrediente.categoria || "",
                precoCusto: novoIngrediente.precoCusto || 0,
                medida: novoIngrediente.medida || "UN",
              }
            : ing,
        ),
      )
      setEditando(null)
    } else {
      const newId = `ING${String(ingredientes.length + 1).padStart(3, "0")}`
      setIngredientes([
        ...ingredientes,
        {
          id: newId,
          nome: novoIngrediente.nome || "",
          categoria: novoIngrediente.categoria || "",
          precoCusto: novoIngrediente.precoCusto || 0,
          medida: novoIngrediente.medida || "UN",
        },
      ])
    }

    setNovoIngrediente({ nome: "", categoria: "", precoCusto: 0, medida: "UN" })
    setDialogOpen(false)
  }

  const handleEdit = (ingrediente: Ingrediente) => {
    setNovoIngrediente({
      nome: ingrediente.nome,
      categoria: ingrediente.categoria,
      precoCusto: ingrediente.precoCusto,
      medida: ingrediente.medida,
    })
    setEditando(ingrediente.id)
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setIngredientes(ingredientes.filter((ing) => ing.id !== id))
  }

  const handleNew = () => {
    setNovoIngrediente({ nome: "", categoria: "", precoCusto: 0, medida: "UN" })
    setEditando(null)
    setDialogOpen(true)
  }

  return (
    <div className="container mx-auto p-6">
      <Header title="Ingredientes" subtitle="Gerencie os ingredientes do sistema" />

      <div className="flex items-center justify-end mb-6">
        <div className="flex space-x-2">
          <Button variant="outline">
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Importar/Exportar Excel
          </Button>
          <Button onClick={handleNew}>
            <Plus className="mr-2 h-4 w-4" /> Criar Ingrediente
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ingredientes Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cód. Sistema</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Preço de Custo</TableHead>
                <TableHead>Medida</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredientes.map((ingrediente) => (
                <TableRow key={ingrediente.id}>
                  <TableCell>{ingrediente.id}</TableCell>
                  <TableCell>{ingrediente.nome}</TableCell>
                  <TableCell>{ingrediente.categoria}</TableCell>
                  <TableCell>R$ {ingrediente.precoCusto.toFixed(2)}</TableCell>
                  <TableCell>{ingrediente.medida}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(ingrediente)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(ingrediente.id)}>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Ingrediente" : "Novo Ingrediente"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={novoIngrediente.nome || ""}
                onChange={(e) => setNovoIngrediente({ ...novoIngrediente, nome: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="codigo">Cód. Sistema</Label>
              <Input
                id="codigo"
                value={editando || `ING${String(ingredientes.length + 1).padStart(3, "0")}`}
                disabled
              />
              <p className="text-xs text-muted-foreground">Preenchimento automático (não editável)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select
                value={novoIngrediente.categoria}
                onValueChange={(value) => setNovoIngrediente({ ...novoIngrediente, categoria: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id} value={cat.descricao}>
                      {cat.descricao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Medida</Label>
              <RadioGroup
                value={novoIngrediente.medida}
                onValueChange={(value) =>
                  setNovoIngrediente({ ...novoIngrediente, medida: value as "UN" | "KG" | "L" })
                }
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="UN" id="un" />
                  <Label htmlFor="un">UN</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="KG" id="kg" />
                  <Label htmlFor="kg">KG</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="L" id="l" />
                  <Label htmlFor="l">L</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="precoCusto">Preço de Custo</Label>
              <Input
                id="precoCusto"
                type="number"
                step="0.01"
                value={novoIngrediente.precoCusto || ""}
                onChange={(e) =>
                  setNovoIngrediente({ ...novoIngrediente, precoCusto: Number.parseFloat(e.target.value) })
                }
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
