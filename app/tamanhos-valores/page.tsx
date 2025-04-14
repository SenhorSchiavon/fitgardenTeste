"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Header } from "@/components/header"

type TamanhoValor = {
  id: string
  pesagem: number
  valorUnitario: number
  valorAcima10: number
  valorAcima20: number
  valorAcima40: number
}

export default function TamanhosValores() {
  const [tamanhos, setTamanhos] = useState<TamanhoValor[]>([
    {
      id: "TAM001",
      pesagem: 350,
      valorUnitario: 19.9,
      valorAcima10: 18.9,
      valorAcima20: 17.9,
      valorAcima40: 16.9,
    },
    {
      id: "TAM002",
      pesagem: 450,
      valorUnitario: 24.9,
      valorAcima10: 23.9,
      valorAcima20: 22.9,
      valorAcima40: 21.9,
    },
  ])

  const [novoTamanho, setNovoTamanho] = useState<Partial<TamanhoValor>>({
    pesagem: 0,
    valorUnitario: 0,
    valorAcima10: 0,
    valorAcima20: 0,
    valorAcima40: 0,
  })

  const [editando, setEditando] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleSave = () => {
    if (editando) {
      setTamanhos(
        tamanhos.map((tam) =>
          tam.id === editando
            ? {
                ...tam,
                pesagem: novoTamanho.pesagem || 0,
                valorUnitario: novoTamanho.valorUnitario || 0,
                valorAcima10: novoTamanho.valorAcima10 || 0,
                valorAcima20: novoTamanho.valorAcima20 || 0,
                valorAcima40: novoTamanho.valorAcima40 || 0,
              }
            : tam,
        ),
      )
      setEditando(null)
    } else {
      const newId = `TAM${String(tamanhos.length + 1).padStart(3, "0")}`
      setTamanhos([
        ...tamanhos,
        {
          id: newId,
          pesagem: novoTamanho.pesagem || 0,
          valorUnitario: novoTamanho.valorUnitario || 0,
          valorAcima10: novoTamanho.valorAcima10 || 0,
          valorAcima20: novoTamanho.valorAcima20 || 0,
          valorAcima40: novoTamanho.valorAcima40 || 0,
        },
      ])
    }

    setNovoTamanho({
      pesagem: 0,
      valorUnitario: 0,
      valorAcima10: 0,
      valorAcima20: 0,
      valorAcima40: 0,
    })
    setDialogOpen(false)
  }

  const handleEdit = (tamanho: TamanhoValor) => {
    setNovoTamanho({
      pesagem: tamanho.pesagem,
      valorUnitario: tamanho.valorUnitario,
      valorAcima10: tamanho.valorAcima10,
      valorAcima20: tamanho.valorAcima20,
      valorAcima40: tamanho.valorAcima40,
    })
    setEditando(tamanho.id)
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setTamanhos(tamanhos.filter((tam) => tam.id !== id))
  }

  const handleNew = () => {
    setNovoTamanho({
      pesagem: 0,
      valorUnitario: 0,
      valorAcima10: 0,
      valorAcima20: 0,
      valorAcima40: 0,
    })
    setEditando(null)
    setDialogOpen(true)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 3,
    }).format(value)
  }

  return (
    <div className="container mx-auto p-6">
      <Header title="Tamanhos e Valores" subtitle="Gerencie os tamanhos e valores das marmitas" />

      <div className="flex items-center justify-end mb-6">
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" /> Criar Tamanho
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tamanhos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pesagem (g)</TableHead>
                <TableHead>Unitário</TableHead>
                <TableHead>Acima de 10 un.</TableHead>
                <TableHead>Acima de 20 un.</TableHead>
                <TableHead>Acima de 40 un.</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tamanhos.map((tamanho) => (
                <TableRow key={tamanho.id}>
                  <TableCell>{tamanho.pesagem}g</TableCell>
                  <TableCell>{formatCurrency(tamanho.valorUnitario)}</TableCell>
                  <TableCell>{formatCurrency(tamanho.valorAcima10)}</TableCell>
                  <TableCell>{formatCurrency(tamanho.valorAcima20)}</TableCell>
                  <TableCell>{formatCurrency(tamanho.valorAcima40)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(tamanho)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(tamanho.id)}>
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
            <DialogTitle>{editando ? "Editar Tamanho" : "Novo Tamanho"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="pesagem">Pesagem</Label>
              <div className="flex items-center">
                <Input
                  id="pesagem"
                  type="number"
                  value={novoTamanho.pesagem || ""}
                  onChange={(e) => setNovoTamanho({ ...novoTamanho, pesagem: Number(e.target.value) })}
                />
                <span className="ml-2">g</span>
              </div>
            </div>

            <div className="space-y-2 border-t pt-4">
              <h3 className="font-medium">Valores:</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="valorUnitario">UNITÁRIO</Label>
                  <Input
                    id="valorUnitario"
                    type="number"
                    step="0.001"
                    value={novoTamanho.valorUnitario || ""}
                    onChange={(e) => setNovoTamanho({ ...novoTamanho, valorUnitario: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valorAcima10">ACIMA DE 10 UNIDADES</Label>
                  <Input
                    id="valorAcima10"
                    type="number"
                    step="0.001"
                    value={novoTamanho.valorAcima10 || ""}
                    onChange={(e) => setNovoTamanho({ ...novoTamanho, valorAcima10: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valorAcima20">ACIMA DE 20 UNIDADES</Label>
                  <Input
                    id="valorAcima20"
                    type="number"
                    step="0.001"
                    value={novoTamanho.valorAcima20 || ""}
                    onChange={(e) => setNovoTamanho({ ...novoTamanho, valorAcima20: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valorAcima40">ACIMA DE 40 UNIDADES</Label>
                  <Input
                    id="valorAcima40"
                    type="number"
                    step="0.001"
                    value={novoTamanho.valorAcima40 || ""}
                    onChange={(e) => setNovoTamanho({ ...novoTamanho, valorAcima40: Number(e.target.value) })}
                  />
                </div>
              </div>
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
