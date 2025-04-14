"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash, Search } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Header } from "@/components/header"

type Preparo = {
  id: string
  nome: string
  tipo: "CARBOIDRATO" | "PROTEÍNA" | "LEGUMES"
  medida: "UN" | "KG" | "L"
  precoCusto: number
  ingredientes: IngredientePreparo[]
}

type IngredientePreparo = {
  id: string
  nome: string
  quantidade: number
  medida: "UN" | "KG" | "L"
  custo: number
}

type Ingrediente = {
  id: string
  nome: string
  medida: "UN" | "KG" | "L"
  precoCusto: number
}

export default function Preparos() {
  const [preparos, setPreparos] = useState<Preparo[]>([
    {
      id: "PREP001",
      nome: "Arroz Integral",
      tipo: "CARBOIDRATO",
      medida: "KG",
      precoCusto: 12.5,
      ingredientes: [
        { id: "ING002", nome: "Arroz Integral", quantidade: 1, medida: "KG", custo: 7.5 },
        { id: "ING004", nome: "Azeite", quantidade: 0.05, medida: "L", custo: 1.5 },
      ],
    },
    {
      id: "PREP002",
      nome: "Frango Grelhado",
      tipo: "PROTEÍNA",
      medida: "KG",
      precoCusto: 25.9,
      ingredientes: [
        { id: "ING001", nome: "Peito de Frango", quantidade: 1, medida: "KG", custo: 22.9 },
        { id: "ING004", nome: "Azeite", quantidade: 0.1, medida: "L", custo: 3.0 },
      ],
    },
  ])

  const [ingredientes] = useState<Ingrediente[]>([
    { id: "ING001", nome: "Peito de Frango", medida: "KG", precoCusto: 22.9 },
    { id: "ING002", nome: "Arroz Integral", medida: "KG", precoCusto: 7.5 },
    { id: "ING003", nome: "Brócolis", medida: "KG", precoCusto: 8.9 },
    { id: "ING004", nome: "Azeite", medida: "L", precoCusto: 29.9 },
  ])

  const [novoPreparo, setNovoPreparo] = useState<Partial<Preparo>>({
    nome: "",
    tipo: "CARBOIDRATO",
    medida: "KG",
    precoCusto: 0,
    ingredientes: [],
  })

  const [novoIngrediente, setNovoIngrediente] = useState<Partial<IngredientePreparo>>({
    id: "",
    nome: "",
    quantidade: 0,
    medida: "KG",
    custo: 0,
  })

  const [editando, setEditando] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)

  const calcularCustoPreparo = (ingredientes: IngredientePreparo[]) => {
    return ingredientes.reduce((total, ing) => total + ing.custo, 0)
  }

  const handleSave = () => {
    if (editando) {
      setPreparos(
        preparos.map((prep) =>
          prep.id === editando
            ? {
                ...prep,
                nome: novoPreparo.nome || "",
                tipo: novoPreparo.tipo || "CARBOIDRATO",
                medida: novoPreparo.medida || "KG",
                ingredientes: novoPreparo.ingredientes || [],
                precoCusto: calcularCustoPreparo(novoPreparo.ingredientes || []),
              }
            : prep,
        ),
      )
      setEditando(null)
    } else {
      const newId = `PREP${String(preparos.length + 1).padStart(3, "0")}`
      const custoTotal = calcularCustoPreparo(novoPreparo.ingredientes || [])

      setPreparos([
        ...preparos,
        {
          id: newId,
          nome: novoPreparo.nome || "",
          tipo: novoPreparo.tipo || "CARBOIDRATO",
          medida: novoPreparo.medida || "KG",
          ingredientes: novoPreparo.ingredientes || [],
          precoCusto: custoTotal,
        },
      ])
    }

    setNovoPreparo({ nome: "", tipo: "CARBOIDRATO", medida: "KG", precoCusto: 0, ingredientes: [] })
    setDialogOpen(false)
  }

  const handleEdit = (preparo: Preparo) => {
    setNovoPreparo({
      nome: preparo.nome,
      tipo: preparo.tipo,
      medida: preparo.medida,
      ingredientes: [...preparo.ingredientes],
      precoCusto: preparo.precoCusto,
    })
    setEditando(preparo.id)
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setPreparos(preparos.filter((prep) => prep.id !== id))
  }

  const handleNew = () => {
    setNovoPreparo({ nome: "", tipo: "CARBOIDRATO", medida: "KG", precoCusto: 0, ingredientes: [] })
    setEditando(null)
    setDialogOpen(true)
  }

  const handleAddIngrediente = () => {
    const ingredienteSelecionado = ingredientes.find((ing) => ing.id === novoIngrediente.id)

    if (ingredienteSelecionado && novoIngrediente.quantidade) {
      const custo = ingredienteSelecionado.precoCusto * novoIngrediente.quantidade

      const novoItem: IngredientePreparo = {
        id: ingredienteSelecionado.id,
        nome: ingredienteSelecionado.nome,
        quantidade: novoIngrediente.quantidade,
        medida: ingredienteSelecionado.medida,
        custo: custo,
      }

      setNovoPreparo({
        ...novoPreparo,
        ingredientes: [...(novoPreparo.ingredientes || []), novoItem],
        precoCusto: calcularCustoPreparo([...(novoPreparo.ingredientes || []), novoItem]),
      })

      setNovoIngrediente({ id: "", nome: "", quantidade: 0, medida: "KG", custo: 0 })
      setSheetOpen(false)
    }
  }

  const handleRemoveIngrediente = (id: string) => {
    const ingredientesAtualizados = (novoPreparo.ingredientes || []).filter((ing) => ing.id !== id)
    setNovoPreparo({
      ...novoPreparo,
      ingredientes: ingredientesAtualizados,
      precoCusto: calcularCustoPreparo(ingredientesAtualizados),
    })
  }

  return (
    <div className="container mx-auto p-6">
      <Header title="Preparos" subtitle="Gerencie os preparos e fichas técnicas" />

      <div className="flex items-center justify-end mb-6">
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" /> Criar Preparo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Preparos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cód. Sistema</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Preço de Custo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preparos.map((preparo) => (
                <TableRow key={preparo.id}>
                  <TableCell>{preparo.id}</TableCell>
                  <TableCell>{preparo.nome}</TableCell>
                  <TableCell>{preparo.tipo}</TableCell>
                  <TableCell>R$ {preparo.precoCusto.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(preparo)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(preparo.id)}>
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
            <DialogTitle>{editando ? "Editar Preparo" : "Novo Preparo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={novoPreparo.nome || ""}
                  onChange={(e) => setNovoPreparo({ ...novoPreparo, nome: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="codigo">Cód. Sistema</Label>
                <Input id="codigo" value={editando || `PREP${String(preparos.length + 1).padStart(3, "0")}`} disabled />
                <p className="text-xs text-muted-foreground">Preenchimento automático (não editável)</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Medida</Label>
                <RadioGroup
                  value={novoPreparo.medida}
                  onValueChange={(value) => setNovoPreparo({ ...novoPreparo, medida: value as "UN" | "KG" | "L" })}
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
                <Label>Tipo</Label>
                <RadioGroup
                  value={novoPreparo.tipo}
                  onValueChange={(value) =>
                    setNovoPreparo({ ...novoPreparo, tipo: value as "CARBOIDRATO" | "PROTEÍNA" | "LEGUMES" })
                  }
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="CARBOIDRATO" id="carboidrato" />
                    <Label htmlFor="carboidrato">CARBOIDRATO</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PROTEÍNA" id="proteina" />
                    <Label htmlFor="proteina">PROTEÍNA</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="LEGUMES" id="legumes" />
                    <Label htmlFor="legumes">LEGUMES</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <div className="flex items-center justify-between">
                <Label>Ficha Técnica</Label>
                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                  <SheetTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" /> Adicionar Ingrediente
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Selecionar Ingrediente</SheetTitle>
                    </SheetHeader>
                    <div className="py-4">
                      <div className="relative mb-4">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Buscar ingrediente..." className="pl-8" />
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Ingrediente</TableHead>
                            <TableHead>Medida</TableHead>
                            <TableHead>Ação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ingredientes.map((ingrediente) => (
                            <TableRow key={ingrediente.id}>
                              <TableCell>{ingrediente.nome}</TableCell>
                              <TableCell>{ingrediente.medida}</TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setNovoIngrediente({
                                      id: ingrediente.id,
                                      nome: ingrediente.nome,
                                      medida: ingrediente.medida,
                                      quantidade: 0,
                                      custo: 0,
                                    })
                                  }
                                >
                                  Selecionar
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {novoIngrediente.id && (
                        <div className="mt-4 space-y-4 border-t pt-4">
                          <h3 className="font-medium">Adicionar {novoIngrediente.nome}</h3>
                          <div className="space-y-2">
                            <Label htmlFor="quantidade">Quantidade ({novoIngrediente.medida})</Label>
                            <Input
                              id="quantidade"
                              type="number"
                              step="0.01"
                              value={novoIngrediente.quantidade || ""}
                              onChange={(e) =>
                                setNovoIngrediente({
                                  ...novoIngrediente,
                                  quantidade: Number.parseFloat(e.target.value),
                                  custo:
                                    Number.parseFloat(e.target.value) *
                                    (ingredientes.find((i) => i.id === novoIngrediente.id)?.precoCusto || 0),
                                })
                              }
                            />
                          </div>
                          <Button onClick={handleAddIngrediente} className="w-full">
                            Adicionar à Ficha Técnica
                          </Button>
                        </div>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Ingrediente</TableHead>
                    <TableHead>Qtde.</TableHead>
                    <TableHead>Medida</TableHead>
                    <TableHead>Custo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(novoPreparo.ingredientes || []).map((ingrediente) => (
                    <TableRow key={ingrediente.id}>
                      <TableCell>{ingrediente.nome}</TableCell>
                      <TableCell>{ingrediente.quantidade}</TableCell>
                      <TableCell>{ingrediente.medida}</TableCell>
                      <TableCell>R$ {ingrediente.custo.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveIngrediente(ingrediente.id)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-end pt-2">
                <div className="text-right">
                  <p className="text-sm font-medium">Custo Total:</p>
                  <p className="text-lg font-bold">
                    R$ {calcularCustoPreparo(novoPreparo.ingredientes || []).toFixed(2)}
                  </p>
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
