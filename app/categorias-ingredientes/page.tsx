"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Header } from "@/components/header"

type Categoria = {
  id: string
  descricao: string
  tipo: "INGREDIENTE" | "PRODUTO"
}

export default function CategoriasIngredientes() {
  const [categorias, setCategorias] = useState<Categoria[]>([
    { id: "CAT001", descricao: "Proteínas", tipo: "INGREDIENTE" },
    { id: "CAT002", descricao: "Carboidratos", tipo: "INGREDIENTE" },
    { id: "CAT003", descricao: "Legumes", tipo: "INGREDIENTE" },
    { id: "CAT004", descricao: "Temperos", tipo: "INGREDIENTE" },
  ])

  const [novaCategoria, setNovaCategoria] = useState<Partial<Categoria>>({
    descricao: "",
    tipo: "INGREDIENTE",
  })

  const [editando, setEditando] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleSave = () => {
    if (editando) {
      setCategorias(
        categorias.map((cat) =>
          cat.id === editando
            ? { ...cat, descricao: novaCategoria.descricao || "", tipo: novaCategoria.tipo || "INGREDIENTE" }
            : cat,
        ),
      )
      setEditando(null)
    } else {
      const newId = `CAT${String(categorias.length + 1).padStart(3, "0")}`
      setCategorias([
        ...categorias,
        {
          id: newId,
          descricao: novaCategoria.descricao || "",
          tipo: novaCategoria.tipo || "INGREDIENTE",
        },
      ])
    }

    setNovaCategoria({ descricao: "", tipo: "INGREDIENTE" })
    setDialogOpen(false)
  }

  const handleEdit = (categoria: Categoria) => {
    setNovaCategoria({ descricao: categoria.descricao, tipo: categoria.tipo })
    setEditando(categoria.id)
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setCategorias(categorias.filter((cat) => cat.id !== id))
  }

  const handleNew = () => {
    setNovaCategoria({ descricao: "", tipo: "INGREDIENTE" })
    setEditando(null)
    setDialogOpen(true)
  }

  return (
    <div className="container mx-auto p-6">
      <Header title="Categorias de Ingredientes" subtitle="Gerencie as categorias de ingredientes e produtos" />

      <div className="flex items-center justify-end mb-6">
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" /> Criar Categoria
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Categorias Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cód. Sistema</TableHead>
                <TableHead>Categoria de Ingredientes</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categorias.map((categoria) => (
                <TableRow key={categoria.id}>
                  <TableCell>{categoria.id}</TableCell>
                  <TableCell>{categoria.descricao}</TableCell>
                  <TableCell>{categoria.tipo}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(categoria)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(categoria.id)}>
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
            <DialogTitle>{editando ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                value={novaCategoria.descricao || ""}
                onChange={(e) => setNovaCategoria({ ...novaCategoria, descricao: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Categoria de:</Label>
              <RadioGroup
                value={novaCategoria.tipo}
                onValueChange={(value) =>
                  setNovaCategoria({ ...novaCategoria, tipo: value as "INGREDIENTE" | "PRODUTO" })
                }
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="INGREDIENTE" id="ingrediente" />
                  <Label htmlFor="ingrediente">INGREDIENTE</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PRODUTO" id="produto" />
                  <Label htmlFor="produto">PRODUTO</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="codigo">Cód. Sistema</Label>
              <Input id="codigo" value={editando || `CAT${String(categorias.length + 1).padStart(3, "0")}`} disabled />
              <p className="text-xs text-muted-foreground">Preenchimento automático (não editável)</p>
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
