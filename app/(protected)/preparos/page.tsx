"use client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Header } from "@/components/header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { usePreparos, Preparo, PreparoTipo, Medida } from "@/hooks/usePreparos";
import { useIngredientes } from "@/hooks/useIngredientes";

type IngredientePreparoEmEdicao = {
  ingredienteId: number;
  ingredienteNome: string;
  quantidade: number;
  medida: Medida;
  custo: number;
};

export default function PreparosPage() {
  const {
    preparos,
    loading: loadingPreparos,
    saving,
    createPreparo,
    updatePreparo,
    deletePreparo,
  } = usePreparos();

  const { ingredientes, loading: loadingIngredientes } = useIngredientes();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [novoPreparo, setNovoPreparo] = useState<{
    nome: string;
    tipo: PreparoTipo;
    medida: Medida;
    ingredientes: IngredientePreparoEmEdicao[];
  }>({
    nome: "",
    tipo: "CARBOIDRATO",
    medida: "KG",
    ingredientes: [],
  });

  const [novoIngrediente, setNovoIngrediente] = useState<{
    ingredienteId: number | null;
    ingredienteNome: string;
    medida: Medida;
    quantidade: number;
    custo: number;
  }>({
    ingredienteId: null,
    ingredienteNome: "",
    medida: "KG",
    quantidade: 0,
    custo: 0,
  });

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [busca, setBusca] = useState("");
  const [buscaIngrediente, setBuscaIngrediente] = useState("");

  const preparosFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return preparos;

    return preparos.filter((p) =>
      [p.codigoSistema, p.nome, p.tipo, p.medida].some((v) =>
        String(v).toLowerCase().includes(q),
      ),
    );
  }, [preparos, busca]);
  const openDelete = (id: number) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      await deletePreparo(deleteId);
    } finally {
      setDeleteOpen(false);
      setDeleteId(null);
    }
  };

  const ingredientesFiltrados = useMemo(() => {
    const q = buscaIngrediente.trim().toLowerCase();
    if (!q) return ingredientes;

    return ingredientes.filter((i) =>
      [i.codigoSistema, i.nome, i.medida].some((v) =>
        String(v).toLowerCase().includes(q),
      ),
    );
  }, [ingredientes, buscaIngrediente]);

  const isLoading = loadingPreparos || loadingIngredientes;

  const codigoSistemaAtual = useMemo(() => {
    if (!editandoId) return "Automático";
    const prep = preparos.find((p) => p.id === editandoId);
    return prep?.codigoSistema ?? `PREP${String(editandoId).padStart(3, "0")}`;
  }, [editandoId, preparos]);

  const calcularCustoPreparo = (itens: IngredientePreparoEmEdicao[]) =>
    itens.reduce(
      (total, item) => total + (Number.isFinite(item.custo) ? item.custo : 0),
      0,
    );

  const resetForm = () => {
    setNovoPreparo({
      nome: "",
      tipo: "CARBOIDRATO",
      medida: "KG",
      ingredientes: [],
    });
    setNovoIngrediente({
      ingredienteId: null,
      ingredienteNome: "",
      medida: "KG",
      quantidade: 0,
      custo: 0,
    });
    setEditandoId(null);
  };

  const handleNew = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (preparo: Preparo) => {
    setNovoPreparo({
      nome: preparo.nome,
      tipo: preparo.tipo,
      medida: preparo.medida,
      ingredientes: preparo.fichaTecnica.map((ft) => ({
        ingredienteId: ft.ingredienteId,
        ingredienteNome: ft.ingredienteNome,
        quantidade: ft.quantidade,
        medida: ft.medida,
        custo: ft.custo,
      })),
    });

    setEditandoId(preparo.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    await deletePreparo(id);
  };

  const handleRemoveIngrediente = (ingredienteId: number) => {
    setNovoPreparo((p) => ({
      ...p,
      ingredientes: p.ingredientes.filter(
        (i) => i.ingredienteId !== ingredienteId,
      ),
    }));
  };

  const handleAddIngrediente = () => {
    if (!novoIngrediente.ingredienteId) return;
    if (!novoIngrediente.quantidade || novoIngrediente.quantidade <= 0) return;

    const item: IngredientePreparoEmEdicao = {
      ingredienteId: novoIngrediente.ingredienteId,
      ingredienteNome: novoIngrediente.ingredienteNome,
      quantidade: novoIngrediente.quantidade,
      medida: novoIngrediente.medida,
      custo: novoIngrediente.custo,
    };

    setNovoPreparo((p) => ({
      ...p,
      ingredientes: [...p.ingredientes, item],
    }));

    setNovoIngrediente({
      ingredienteId: null,
      ingredienteNome: "",
      medida: "KG",
      quantidade: 0,
      custo: 0,
    });
    setSheetOpen(false);
  };

  const handleSave = async () => {
    if (!novoPreparo.nome.trim()) return;

    const payload = {
      nome: novoPreparo.nome.trim(),
      tipo: novoPreparo.tipo, // PROTEINA sem acento
      medida: novoPreparo.medida,
      fichaTecnica: novoPreparo.ingredientes.map((i) => ({
        ingredienteId: i.ingredienteId,
        quantidade: i.quantidade,
      })),
    };

    try {
      if (editandoId) {
        await updatePreparo(editandoId, payload);
      } else {
        await createPreparo(payload);
      }

      setDialogOpen(false);
      resetForm();
    } catch {
      // toast já está no hook
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Header
        title="Preparos"
        subtitle="Gerencie os preparos e fichas técnicas"
        searchValue={busca}
        onSearchChange={setBusca}
      />

      <div className="flex items-center justify-end mb-6">
        <Button onClick={handleNew} disabled={saving}>
          <Plus className="mr-2 h-4 w-4" /> Criar Preparo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Preparos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">
              Carregando preparos...
            </p>
          ) : (
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
                {preparosFiltrados.map((preparo) => (
                  <TableRow key={preparo.id}>
                    <TableCell>{preparo.codigoSistema}</TableCell>
                    <TableCell>{preparo.nome}</TableCell>
                    <TableCell>{preparo.tipo}</TableCell>
                    <TableCell>R$ {preparo.custoTotal.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(preparo)}
                        disabled={saving}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDelete(preparo.id)}
                        disabled={saving}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {preparosFiltrados.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-sm text-muted-foreground py-4"
                    >
                      Nenhum preparo cadastrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editandoId ? "Editar Preparo" : "Novo Preparo"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={novoPreparo.nome}
                  onChange={(e) =>
                    setNovoPreparo((p) => ({ ...p, nome: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="codigo">Cód. Sistema</Label>
                <Input id="codigo" value={codigoSistemaAtual} disabled />
                <p className="text-xs text-muted-foreground">
                  Preenchimento automático (não editável)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Medida</Label>
                <RadioGroup
                  value={novoPreparo.medida}
                  onValueChange={(value) =>
                    setNovoPreparo((p) => ({ ...p, medida: value as Medida }))
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
                <Label>Tipo</Label>
                <RadioGroup
                  value={novoPreparo.tipo}
                  onValueChange={(value) =>
                    setNovoPreparo((p) => ({
                      ...p,
                      tipo: value as PreparoTipo,
                    }))
                  }
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="CARBOIDRATO" id="carboidrato" />
                    <Label htmlFor="carboidrato">CARBOIDRATO</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PROTEINA" id="proteina" />
                    <Label htmlFor="proteina">PROTEINA</Label>
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
                    <Button size="sm" disabled={saving || loadingIngredientes}>
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
                        <Input
                          placeholder="Buscar ingrediente..."
                          className="pl-8"
                          value={buscaIngrediente}
                          onChange={(e) => setBuscaIngrediente(e.target.value)}
                        />
                      </div>

                      <ScrollArea className="h-[55vh] pr-2">
                        <Table>
                          <TableHeader className="sticky top-0 bg-background z-10">
                            <TableRow>
                              <TableHead>Ingrediente</TableHead>
                              <TableHead>Medida</TableHead>
                              <TableHead>Ação</TableHead>
                            </TableRow>
                          </TableHeader>

                          <TableBody>
                            {ingredientesFiltrados.map((ingrediente) => (
                              <TableRow key={ingrediente.id}>
                                <TableCell>{ingrediente.nome}</TableCell>
                                <TableCell>{ingrediente.medida}</TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      setNovoIngrediente({
                                        ingredienteId: ingrediente.id,
                                        ingredienteNome: ingrediente.nome,
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
                      </ScrollArea>

                      {novoIngrediente.ingredienteId && (
                        <div className="mt-4 space-y-4 border-t pt-4">
                          <h3 className="font-medium">
                            Adicionar {novoIngrediente.ingredienteNome}
                          </h3>

                          <div className="space-y-2">
                            <Label htmlFor="quantidade">
                              Quantidade ({novoIngrediente.medida})
                            </Label>
                            <Input
                              id="quantidade"
                              type="number"
                              step="0.01"
                              value={novoIngrediente.quantidade || ""}
                              onChange={(e) => {
                                const qtd = Number.parseFloat(
                                  e.target.value || "0",
                                );
                                const preco =
                                  ingredientes.find(
                                    (i) =>
                                      i.id === novoIngrediente.ingredienteId,
                                  )?.precoCusto || 0;

                                setNovoIngrediente((p) => ({
                                  ...p,
                                  quantidade: qtd,
                                  custo: qtd * preco,
                                }));
                              }}
                            />
                          </div>

                          <Button
                            onClick={handleAddIngrediente}
                            className="w-full"
                          >
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
                  {novoPreparo.ingredientes.map((ingrediente) => (
                    <TableRow key={ingrediente.ingredienteId}>
                      <TableCell>{ingrediente.ingredienteNome}</TableCell>
                      <TableCell>{ingrediente.quantidade}</TableCell>
                      <TableCell>{ingrediente.medida}</TableCell>
                      <TableCell>R$ {ingrediente.custo.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleRemoveIngrediente(ingrediente.ingredienteId)
                          }
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {novoPreparo.ingredientes.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-sm text-muted-foreground py-4"
                      >
                        Nenhum ingrediente adicionado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <div className="flex justify-end pt-2">
                <div className="text-right">
                  <p className="text-sm font-medium">Custo Total:</p>
                  <p className="text-lg font-bold">
                    R${" "}
                    {calcularCustoPreparo(novoPreparo.ingredientes).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setDeleteId(null);
        }}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-800">
              Excluir preparo?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Essa ação não pode ser desfeita. O preparo será removido do
              sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-gray-200 text-gray-700 hover:bg-gray-50"
              disabled={saving}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={saving}
            >
              {saving ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
