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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import {
//   Sheet,
//   SheetContent,
//   SheetHeader,
//   SheetTitle,
//   SheetTrigger,
// } from "@/components/ui/sheet";
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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePreparos, Preparo, PreparoTipo, Medida } from "@/hooks/usePreparos";
import { useIngredientes } from "@/hooks/useIngredientes";
import { useMedidas } from "@/hooks/useMedidas";
import { useTableSort } from "@/hooks/useTableSort";
import { SortableHead } from "@/components/ui/sorttable";

type IngredientePreparoEmEdicao = {
  ingredienteId: number;
  ingredienteNome: string;
  quantidade: number;
  medida: Medida;
  custo: number;
  usarCruComoReferencia: boolean;
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
  const { medidas, isLoading: loadingMedidas, criarMedida } = useMedidas();
  const [novaMedidaNome, setNovaMedidaNome] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [novoPreparo, setNovoPreparo] = useState<{
    nome: string;
    tipo: PreparoTipo;
    medidaId: string;
    ingredientes: IngredientePreparoEmEdicao[];
  }>({
    nome: "",
    tipo: "CARBOIDRATO",
    medidaId: "",
    ingredientes: [],
  });

  const [novoIngrediente, setNovoIngrediente] = useState<{
    ingredienteId: number | null;
    ingredienteNome: string;
    medida: Medida | null;
    quantidade: number;
    custo: number;
    usarCruComoReferencia: boolean;
  }>({
    ingredienteId: null,
    ingredienteNome: "",
    medida: null,
    quantidade: 0,
    custo: 0,
    usarCruComoReferencia: false,
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

  const { sort, onSort, sortedRows } = useTableSort(preparosFiltrados);

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
      medidaId: "",
      ingredientes: [],
    });
    setNovoIngrediente({
      ingredienteId: null,
      ingredienteNome: "",
      medida: null,
      quantidade: 0,
      custo: 0,
      usarCruComoReferencia: false,
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
      medidaId: String(preparo.medida?.id ?? ""),
      ingredientes: preparo.fichaTecnica.map((ft) => ({
        ingredienteId: ft.ingredienteId,
        ingredienteNome: ft.ingredienteNome,
        quantidade: ft.quantidade,
        medida: ft.medida,
        custo: ft.custo,
        usarCruComoReferencia: ft.usarCruComoReferencia,
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
    if (!novoIngrediente.ingredienteId || !novoIngrediente.medida) return;
    if (!novoIngrediente.quantidade || novoIngrediente.quantidade <= 0) return;

    const item: IngredientePreparoEmEdicao = {
      ingredienteId: novoIngrediente.ingredienteId,
      ingredienteNome: novoIngrediente.ingredienteNome,
      quantidade: novoIngrediente.quantidade,
      medida: novoIngrediente.medida,
      custo: novoIngrediente.custo,
      usarCruComoReferencia: novoIngrediente.usarCruComoReferencia,
    };

    setNovoPreparo((p) => {
      const exists = p.ingredientes.some((i) => i.ingredienteId === item.ingredienteId);
      if (exists) {
        return {
          ...p,
          ingredientes: p.ingredientes.map((i) =>
            i.ingredienteId === item.ingredienteId ? item : i
          ),
        };
      }
      return {
        ...p,
        ingredientes: [...p.ingredientes, item],
      };
    });

    setNovoIngrediente({
      ingredienteId: null,
      ingredienteNome: "",
      medida: null,
      quantidade: 0,
      custo: 0,
      usarCruComoReferencia: false,
    });
    setSheetOpen(false);
  };

  const handleEditIngrediente = (ingId: number) => {
    const item = novoPreparo.ingredientes.find((i) => i.ingredienteId === ingId);
    if (!item) return;

    setNovoIngrediente({
      ingredienteId: item.ingredienteId,
      ingredienteNome: item.ingredienteNome,
      medida: item.medida,
      quantidade: item.quantidade,
      custo: item.custo,
      usarCruComoReferencia: item.usarCruComoReferencia,
    });
    setSheetOpen(true);
  };

  const handleSave = async () => {
    if (!novoPreparo.nome.trim()) return;

    const payload = {
      nome: novoPreparo.nome.trim(),
      tipo: novoPreparo.tipo, // PROTEINA sem acento
      medidaId: Number(novoPreparo.medidaId),
      fichaTecnica: novoPreparo.ingredientes.map((i) => ({
        ingredienteId: i.ingredienteId,
        quantidade: i.quantidade,
        usarCruComoReferencia: i.usarCruComoReferencia,
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
                  <SortableHead label="Cód. Sistema" field="codigoSistema" sort={sort} onSort={onSort} />
                  <SortableHead label="Nome" field="nome" sort={sort} onSort={onSort} />
                  <SortableHead label="Tipo" field="tipo" sort={sort} onSort={onSort} />
                  <SortableHead label="Preço de Custo" field="custoTotal" sort={sort} onSort={onSort} />
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRows.map((preparo) => (
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
              <div className="flex gap-2">
                <Select
                  value={novoPreparo.medidaId}
                  onValueChange={(value) =>
                    setNovoPreparo((p) => ({ ...p, medidaId: value }))
                  }
                >
                  <SelectTrigger className="border-gray-200">
                    <SelectValue placeholder="Selecione uma medida" />
                  </SelectTrigger>
                  <SelectContent>
                    {medidas.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {m.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-1 border rounded bg-gray-50 px-2 min-w-44">
                  <Input
                    placeholder="Nova..."
                    className="w-20 h-8 border-none bg-transparent shadow-none"
                    value={novaMedidaNome}
                    onChange={(e) => setNovaMedidaNome(e.target.value)}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    title="Adicionar Medida"
                    className="h-8 w-8 text-blue-600 hover:bg-blue-100"
                    onClick={async () => {
                      if (!novaMedidaNome.trim()) return;
                      try {
                        const m = await criarMedida(novaMedidaNome.trim());
                        setNovoPreparo((p) => ({ ...p, medidaId: String(m.id) }));
                        setNovaMedidaNome("");
                      } catch (e) {}
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
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
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="FEIJAO" id="feijao" />
                    <Label htmlFor="feijao">FEIJÃO</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <div className="flex items-center justify-between">
                <Label>Ficha Técnica</Label>

                <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" disabled={saving || loadingIngredientes}>
                      <Plus className="mr-2 h-4 w-4" /> Adicionar Ingrediente
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
                    <DialogHeader>
                      <DialogTitle>Selecionar Ingrediente</DialogTitle>
                    </DialogHeader>

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

                      <ScrollArea className="h-[40vh] pr-2">
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
                                <TableCell>{ingrediente.medida?.nome}</TableCell>
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
                                        usarCruComoReferencia: false,
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
                            {novoPreparo.ingredientes.some((i) => i.ingredienteId === novoIngrediente.ingredienteId)
                              ? "Editar "
                              : "Adicionar "}
                            {novoIngrediente.ingredienteNome}
                          </h3>

                          <div className="space-y-2">
                            <Label htmlFor="quantidade">
                              Quantidade ({novoIngrediente.medida?.nome})
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

                          <div className="flex items-center space-x-2 pt-2 pb-2">
                             <Checkbox
                               id="usarCruIngrediente"
                               checked={novoIngrediente.usarCruComoReferencia}
                               onCheckedChange={(checked) =>
                                 setNovoIngrediente((p) => ({ ...p, usarCruComoReferencia: !!checked }))
                               }
                             />
                             <Label htmlFor="usarCruIngrediente" className="text-sm font-medium leading-none">
                               Usar peso cru como referência
                             </Label>
                          </div>

                          <Button
                            onClick={handleAddIngrediente}
                            className="w-full"
                          >
                            {novoPreparo.ingredientes.some((i) => i.ingredienteId === novoIngrediente.ingredienteId)
                              ? "Salvar Alterações do Ingrediente"
                              : "Adicionar à Ficha Técnica"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Ingrediente</TableHead>
                    <TableHead>Qtde.</TableHead>
                    <TableHead>Medida</TableHead>
                    <TableHead>Ref. Cru?</TableHead>
                    <TableHead>Custo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {novoPreparo.ingredientes.map((ingrediente) => (
                    <TableRow key={ingrediente.ingredienteId}>
                      <TableCell>{ingrediente.ingredienteNome}</TableCell>
                      <TableCell>{ingrediente.quantidade}</TableCell>
                      <TableCell>{ingrediente.medida?.nome}</TableCell>
                      <TableCell>{ingrediente.usarCruComoReferencia ? "Sim" : "Não"}</TableCell>
                      <TableCell>R$ {ingrediente.custo.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditIngrediente(ingrediente.ingredienteId)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
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
