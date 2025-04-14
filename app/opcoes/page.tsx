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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Header } from "@/components/header"

type Opcao = {
  id: string
  tipo: "MARMITAS FIT" | "OUTROS"
  nome: string
  categoria?: "FIT" | "LOW CARB" | "VEGETARIANO" | "SOPA"
  carboidrato?: { nome: string; porcentagem: number }
  proteina?: { nome: string; porcentagem: number }
  legumes?: { nome: string; porcentagem: number }
}

type Preparo = {
  id: string
  nome: string
  tipo: "CARBOIDRATO" | "PROTEÍNA" | "LEGUMES"
}

export default function Opcoes() {
  const [opcoes, setOpcoes] = useState<Opcao[]>([
    {
      id: "OPC001",
      tipo: "MARMITAS FIT",
      nome: "Fit Tradicional",
      categoria: "FIT",
      carboidrato: { nome: "Arroz Integral", porcentagem: 30 },
      proteina: { nome: "Frango Grelhado", porcentagem: 40 },
      legumes: { nome: "Mix de Legumes", porcentagem: 30 },
    },
    {
      id: "OPC002",
      tipo: "MARMITAS FIT",
      nome: "Low Carb Especial",
      categoria: "LOW CARB",
      carboidrato: { nome: "Batata Doce", porcentagem: 20 },
      proteina: { nome: "Carne Moída", porcentagem: 50 },
      legumes: { nome: "Brócolis", porcentagem: 30 },
    },
    {
      id: "OPC003",
      tipo: "OUTROS",
      nome: "Sobremesa Fit",
    },
  ])

  const [preparos] = useState<Preparo[]>([
    { id: "PREP001", nome: "Arroz Integral", tipo: "CARBOIDRATO" },
    { id: "PREP002", nome: "Batata Doce", tipo: "CARBOIDRATO" },
    { id: "PREP003", nome: "Frango Grelhado", tipo: "PROTEÍNA" },
    { id: "PREP004", nome: "Carne Moída", tipo: "PROTEÍNA" },
    { id: "PREP005", nome: "Mix de Legumes", tipo: "LEGUMES" },
    { id: "PREP006", nome: "Brócolis", tipo: "LEGUMES" },
  ])

  const [novaOpcao, setNovaOpcao] = useState<Partial<Opcao>>({
    tipo: "MARMITAS FIT",
    nome: "",
    categoria: "FIT",
  })

  const [editando, setEditando] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState<"carboidrato" | "proteina" | "legumes" | null>(null)
  const [erroSoma, setErroSoma] = useState(false)

  const handleSave = () => {
    // Verificar se a soma das porcentagens é 100% para marmitas
    if (novaOpcao.tipo === "MARMITAS FIT") {
      const carbPct = novaOpcao.carboidrato?.porcentagem || 0
      const protPct = novaOpcao.proteina?.porcentagem || 0
      const legPct = novaOpcao.legumes?.porcentagem || 0
      const soma = carbPct + protPct + legPct

      if (soma !== 100) {
        setErroSoma(true)
        return
      }
    }

    if (editando) {
      setOpcoes(
        opcoes.map((op) =>
          op.id === editando
            ? {
                ...op,
                tipo: novaOpcao.tipo || "OUTROS",
                nome: novaOpcao.nome || "",
                categoria: novaOpcao.tipo === "MARMITAS FIT" ? novaOpcao.categoria : undefined,
                carboidrato: novaOpcao.tipo === "MARMITAS FIT" ? novaOpcao.carboidrato : undefined,
                proteina: novaOpcao.tipo === "MARMITAS FIT" ? novaOpcao.proteina : undefined,
                legumes: novaOpcao.tipo === "MARMITAS FIT" ? novaOpcao.legumes : undefined,
              }
            : op,
        ),
      )
      setEditando(null)
    } else {
      const newId = `OPC${String(opcoes.length + 1).padStart(3, "0")}`
      setOpcoes([
        ...opcoes,
        {
          id: newId,
          tipo: novaOpcao.tipo || "OUTROS",
          nome: novaOpcao.nome || "",
          categoria: novaOpcao.tipo === "MARMITAS FIT" ? novaOpcao.categoria : undefined,
          carboidrato: novaOpcao.tipo === "MARMITAS FIT" ? novaOpcao.carboidrato : undefined,
          proteina: novaOpcao.tipo === "MARMITAS FIT" ? novaOpcao.proteina : undefined,
          legumes: novaOpcao.tipo === "MARMITAS FIT" ? novaOpcao.legumes : undefined,
        },
      ])
    }

    setNovaOpcao({ tipo: "MARMITAS FIT", nome: "", categoria: "FIT" })
    setDialogOpen(false)
    setErroSoma(false)
  }

  const handleEdit = (opcao: Opcao) => {
    setNovaOpcao({
      tipo: opcao.tipo,
      nome: opcao.nome,
      categoria: opcao.categoria,
      carboidrato: opcao.carboidrato,
      proteina: opcao.proteina,
      legumes: opcao.legumes,
    })
    setEditando(opcao.id)
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setOpcoes(opcoes.filter((op) => op.id !== id))
  }

  const handleNew = () => {
    setNovaOpcao({ tipo: "MARMITAS FIT", nome: "", categoria: "FIT" })
    setEditando(null)
    setDialogOpen(true)
    setErroSoma(false)
  }

  const handleSelectPreparo = (tipo: "carboidrato" | "proteina" | "legumes", preparo: Preparo) => {
    if (tipo === "carboidrato") {
      setNovaOpcao({
        ...novaOpcao,
        carboidrato: { nome: preparo.nome, porcentagem: novaOpcao.carboidrato?.porcentagem || 0 },
      })
    } else if (tipo === "proteina") {
      setNovaOpcao({
        ...novaOpcao,
        proteina: { nome: preparo.nome, porcentagem: novaOpcao.proteina?.porcentagem || 0 },
      })
    } else if (tipo === "legumes") {
      setNovaOpcao({
        ...novaOpcao,
        legumes: { nome: preparo.nome, porcentagem: novaOpcao.legumes?.porcentagem || 0 },
      })
    }
    setSheetOpen(null)
  }

  const handleChangePorcentagem = (tipo: "carboidrato" | "proteina" | "legumes", valor: number) => {
    if (tipo === "carboidrato" && novaOpcao.carboidrato) {
      setNovaOpcao({
        ...novaOpcao,
        carboidrato: { ...novaOpcao.carboidrato, porcentagem: valor },
      })
    } else if (tipo === "proteina" && novaOpcao.proteina) {
      setNovaOpcao({
        ...novaOpcao,
        proteina: { ...novaOpcao.proteina, porcentagem: valor },
      })
    } else if (tipo === "legumes" && novaOpcao.legumes) {
      setNovaOpcao({
        ...novaOpcao,
        legumes: { ...novaOpcao.legumes, porcentagem: valor },
      })
    }
    setErroSoma(false)
  }

  const filtrarPreparosPorTipo = (tipo: "CARBOIDRATO" | "PROTEÍNA" | "LEGUMES") => {
    return preparos.filter((preparo) => preparo.tipo === tipo)
  }

  return (
    <div className="container mx-auto p-6">
      <Header title="Opções" subtitle="Gerencie as opções de marmitas e outros produtos" />

      <div className="flex items-center justify-end mb-6">
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" /> Criar Opção
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Opções Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cód. Sistema</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {opcoes.map((opcao) => (
                <TableRow key={opcao.id}>
                  <TableCell>{opcao.id}</TableCell>
                  <TableCell>{opcao.tipo}</TableCell>
                  <TableCell>{opcao.nome}</TableCell>
                  <TableCell>{opcao.categoria || "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(opcao)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(opcao.id)}>
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
            <DialogTitle>{editando ? "Editar Opção" : "Nova Opção"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <RadioGroup
                value={novaOpcao.tipo}
                onValueChange={(value) => setNovaOpcao({ ...novaOpcao, tipo: value as "MARMITAS FIT" | "OUTROS" })}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="MARMITAS FIT" id="marmitas" />
                  <Label htmlFor="marmitas">MARMITAS FIT</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="OUTROS" id="outros" />
                  <Label htmlFor="outros">OUTROS</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={novaOpcao.nome || ""}
                  onChange={(e) => setNovaOpcao({ ...novaOpcao, nome: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="codigo">Cód. Sistema</Label>
                <Input id="codigo" value={editando || `OPC${String(opcoes.length + 1).padStart(3, "0")}`} disabled />
                <p className="text-xs text-muted-foreground">Preenchimento automático (não editável)</p>
              </div>
            </div>

            {novaOpcao.tipo === "MARMITAS FIT" && (
              <>
                <div className="space-y-2 border-t pt-4">
                  <Label>Categoria</Label>
                  <RadioGroup
                    value={novaOpcao.categoria}
                    onValueChange={(value) =>
                      setNovaOpcao({ ...novaOpcao, categoria: value as "FIT" | "LOW CARB" | "VEGETARIANO" | "SOPA" })
                    }
                    className="flex flex-wrap gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="FIT" id="fit" />
                      <Label htmlFor="fit">FIT</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="LOW CARB" id="lowcarb" />
                      <Label htmlFor="lowcarb">LOW CARB</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="VEGETARIANO" id="vegetariano" />
                      <Label htmlFor="vegetariano">VEGETARIANO</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="SOPA" id="sopa" />
                      <Label htmlFor="sopa">SOPA</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Label>Carboidrato</Label>
                    <Sheet
                      open={sheetOpen === "carboidrato"}
                      onOpenChange={(open) => setSheetOpen(open ? "carboidrato" : null)}
                    >
                      <SheetTrigger asChild>
                        <Button size="sm" variant="outline">
                          Selecionar Carboidrato
                        </Button>
                      </SheetTrigger>
                      <SheetContent>
                        <SheetHeader>
                          <SheetTitle>Selecionar Carboidrato</SheetTitle>
                        </SheetHeader>
                        <div className="py-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Ação</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filtrarPreparosPorTipo("CARBOIDRATO").map((preparo) => (
                                <TableRow key={preparo.id}>
                                  <TableCell>{preparo.nome}</TableCell>
                                  <TableCell>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleSelectPreparo("carboidrato", preparo)}
                                    >
                                      Selecionar
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Input value={novaOpcao.carboidrato?.nome || ""} disabled />
                    </div>
                    <div className="w-24">
                      <div className="flex items-center">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={novaOpcao.carboidrato?.porcentagem || ""}
                          onChange={(e) => handleChangePorcentagem("carboidrato", Number(e.target.value))}
                          disabled={!novaOpcao.carboidrato?.nome}
                        />
                        <span className="ml-2">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Proteína</Label>
                    <Sheet
                      open={sheetOpen === "proteina"}
                      onOpenChange={(open) => setSheetOpen(open ? "proteina" : null)}
                    >
                      <SheetTrigger asChild>
                        <Button size="sm" variant="outline">
                          Selecionar Proteína
                        </Button>
                      </SheetTrigger>
                      <SheetContent>
                        <SheetHeader>
                          <SheetTitle>Selecionar Proteína</SheetTitle>
                        </SheetHeader>
                        <div className="py-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Ação</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filtrarPreparosPorTipo("PROTEÍNA").map((preparo) => (
                                <TableRow key={preparo.id}>
                                  <TableCell>{preparo.nome}</TableCell>
                                  <TableCell>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleSelectPreparo("proteina", preparo)}
                                    >
                                      Selecionar
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Input value={novaOpcao.proteina?.nome || ""} disabled />
                    </div>
                    <div className="w-24">
                      <div className="flex items-center">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={novaOpcao.proteina?.porcentagem || ""}
                          onChange={(e) => handleChangePorcentagem("proteina", Number(e.target.value))}
                          disabled={!novaOpcao.proteina?.nome}
                        />
                        <span className="ml-2">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Legumes</Label>
                    <Sheet
                      open={sheetOpen === "legumes"}
                      onOpenChange={(open) => setSheetOpen(open ? "legumes" : null)}
                    >
                      <SheetTrigger asChild>
                        <Button size="sm" variant="outline">
                          Selecionar Legumes
                        </Button>
                      </SheetTrigger>
                      <SheetContent>
                        <SheetHeader>
                          <SheetTitle>Selecionar Legumes</SheetTitle>
                        </SheetHeader>
                        <div className="py-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Ação</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filtrarPreparosPorTipo("LEGUMES").map((preparo) => (
                                <TableRow key={preparo.id}>
                                  <TableCell>{preparo.nome}</TableCell>
                                  <TableCell>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleSelectPreparo("legumes", preparo)}
                                    >
                                      Selecionar
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Input value={novaOpcao.legumes?.nome || ""} disabled />
                    </div>
                    <div className="w-24">
                      <div className="flex items-center">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={novaOpcao.legumes?.porcentagem || ""}
                          onChange={(e) => handleChangePorcentagem("legumes", Number(e.target.value))}
                          disabled={!novaOpcao.legumes?.nome}
                        />
                        <span className="ml-2">%</span>
                      </div>
                    </div>
                  </div>

                  {erroSoma && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        A soma das porcentagens deve ser igual a 100%. Atualmente a soma é{" "}
                        {(novaOpcao.carboidrato?.porcentagem || 0) +
                          (novaOpcao.proteina?.porcentagem || 0) +
                          (novaOpcao.legumes?.porcentagem || 0)}
                        %.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </>
            )}

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
