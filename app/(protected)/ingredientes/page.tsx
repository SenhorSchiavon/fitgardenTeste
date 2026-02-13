"use client";

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
import { Plus, Pencil, Trash, FileSpreadsheet } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Header } from "@/components/header";

import { useIngredientes, Medida, Ingrediente } from "@/hooks/useIngredientes";
import { useCategorias } from "@/hooks/useCategorias";
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

import { toast } from "sonner";

type NovoIngredienteForm = {
  nome: string;
  categoriaId: string;
  medida: Medida;
  precoCusto: string;
};

export default function IngredientesPage() {
  const {
    ingredientes,
    loading: loadingIngredientes,
    saving,
    createIngrediente,
    updateIngrediente,
    deleteIngrediente,
  } = useIngredientes();

  const { categorias, loading: loadingCategorias } = useCategorias();
  const [novoIngrediente, setNovoIngrediente] = useState<NovoIngredienteForm>({
    nome: "",
    categoriaId: "",
    medida: "UN",
    precoCusto: "",
  });

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const openDelete = (id: number) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteIngrediente(deleteId);
      toast.success("Ingrediente excluído!");
    } catch (e) {
      toast.error("Falha ao excluir ingrediente");
    } finally {
      setDeleteOpen(false);
      setDeleteId(null);
    }
  };

  const resetForm = () => {
    setNovoIngrediente({
      nome: "",
      categoriaId: "",
      medida: "UN",
      precoCusto: "",
    });
    setEditandoId(null);
  };
  const [busca, setBusca] = useState("");

  const ingredientesFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return ingredientes;

    return ingredientes.filter((i) =>
      [i.codigoSistema, i.nome, i.categoriaDescricao].some((v) =>
        String(v).toLowerCase().includes(q),
      ),
    );
  }, [ingredientes, busca]);
  const handleNew = () => {
    resetForm();
    setDialogOpen(true);
  };
  const categoriaSelecionadaLabel = useMemo(() => {
    if (novoIngrediente.categoriaId === null) return "";
    return (
      categorias.find((c) => c.id === Number(novoIngrediente.categoriaId))
        ?.descricao ?? ""
    );
  }, [novoIngrediente.categoriaId, categorias]);

  const handleEdit = (ingrediente: Ingrediente) => {
    setNovoIngrediente({
      nome: ingrediente.nome,
      categoriaId: String(ingrediente.categoriaId ?? ""),
      medida: ingrediente.medida,
      precoCusto: String(ingrediente.precoCusto),
    });
    setEditandoId(ingrediente.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!novoIngrediente.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    if (!novoIngrediente.categoriaId) {
      toast.error("Selecione uma categoria");
      return;
    }

    // garante que o id selecionado existe nas categorias carregadas
    const categoriaSelecionada = categorias.find(
      (c) => String(c.id) === novoIngrediente.categoriaId,
    );

    if (!categoriaSelecionada) {
      toast.error("Selecione uma categoria válida");
      return;
    }

    const categoriaIdNumero = Number(categoriaSelecionada.id); // aqui é seguro se id for número no backend
    if (!Number.isFinite(categoriaIdNumero)) {
      toast.error("ID de categoria inválido (backend retornou string no id)");
      return;
    }

    const preco = Number(String(novoIngrediente.precoCusto).replace(",", "."));

    const payload = {
      nome: novoIngrediente.nome.trim(),
      categoriaId: categoriaIdNumero,
      medida: novoIngrediente.medida,
      precoCusto: Number.isFinite(preco) ? preco : 0,
    };

    try {
      if (editandoId) await updateIngrediente(editandoId, payload);
      else await createIngrediente(payload);

      toast.success("Ingrediente salvo!");
      resetForm();
      setDialogOpen(false);
    } catch (e) {
      toast.error("Falha ao salvar ingrediente");
    }
  };
  const handleDelete = async (id: number) => {
    try {
      await deleteIngrediente(id);
      toast.success("Ingrediente excluído!");
    } catch (e) {
      toast.error("Falha ao excluir ingrediente");
    }
  };

  const codigoSistemaAtual = useMemo(() => {
    if (!editandoId) return "Automático";
    const ing = ingredientes.find((i) => i.id === editandoId);
    return ing?.codigoSistema ?? String(editandoId);
  }, [editandoId, ingredientes]);

  const isLoading = loadingIngredientes || loadingCategorias;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Header
        title="Ingredientes"
        subtitle="Gerencie os ingredientes do sistema"
        searchValue={busca}
        onSearchChange={setBusca}
      />

      <div className="flex items-center justify-end">
        <div className="flex gap-2">
          <Button variant="outline" disabled>
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Importar/Exportar Excel
          </Button>
          <Button
            onClick={handleNew}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="mr-2 h-4 w-4" /> Criar Ingrediente
          </Button>
        </div>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-800">
            Ingredientes Cadastrados
          </CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <p className="text-sm text-gray-500">Carregando ingredientes...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="text-gray-700">Cód. Sistema</TableHead>
                  <TableHead className="text-gray-700">Nome</TableHead>
                  <TableHead className="text-gray-700">Categoria</TableHead>
                  <TableHead className="text-gray-700">
                    Preço de Custo
                  </TableHead>
                  <TableHead className="text-gray-700">Medida</TableHead>
                  <TableHead className="text-right text-gray-700">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {ingredientesFiltrados.map((ingrediente) => (
                  <TableRow
                    key={ingrediente.id}
                    className="hover:bg-gray-50 border-b border-gray-100"
                  >
                    <TableCell className="font-medium text-gray-700">
                      {ingrediente.codigoSistema}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {ingrediente.nome}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {ingrediente.categoriaDescricao}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      R$ {ingrediente.precoCusto.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {ingrediente.medida}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => handleEdit(ingrediente)}
                        disabled={saving}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => openDelete(ingrediente.id)}
                        disabled={saving}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {ingredientesFiltrados.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-sm text-gray-500 py-4"
                    >
                      Nenhum ingrediente cadastrado.
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
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-800">
              {editandoId ? "Editar Ingrediente" : "Novo Ingrediente"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-gray-700">
                Nome
              </Label>
              <Input
                id="nome"
                value={novoIngrediente.nome}
                onChange={(e) =>
                  setNovoIngrediente((p) => ({ ...p, nome: e.target.value }))
                }
                className="border-gray-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="codigo" className="text-gray-700">
                Cód. Sistema
              </Label>
              <Input
                id="codigo"
                value={codigoSistemaAtual}
                disabled
                className="bg-gray-50 border-gray-200"
              />
              <p className="text-xs text-gray-500">
                Preenchimento automático (não editável)
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Categoria</Label>

              <Select
                value={novoIngrediente.categoriaId}
                onValueChange={(value) =>
                  setNovoIngrediente((p) => ({ ...p, categoriaId: value }))
                }
              >
                <SelectTrigger className="border-gray-200">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>

                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.descricao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {loadingCategorias && (
                <p className="text-xs text-gray-500">
                  Carregando categorias...
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Medida</Label>
              <RadioGroup
                value={novoIngrediente.medida}
                onValueChange={(value) =>
                  setNovoIngrediente((p) => ({
                    ...p,
                    medida: value as Medida,
                  }))
                }
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="UN" id="un" />
                  <Label htmlFor="un" className="text-gray-700">
                    UN
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="KG" id="kg" />
                  <Label htmlFor="kg" className="text-gray-700">
                    KG
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="L" id="l" />
                  <Label htmlFor="l" className="text-gray-700">
                    L
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="precoCusto" className="text-gray-700">
                Preço de Custo
              </Label>
              <Input
                id="precoCusto"
                type="number"
                step="0.01"
                inputMode="decimal"
                value={novoIngrediente.precoCusto}
                onChange={(e) =>
                  setNovoIngrediente((p) => ({
                    ...p,
                    precoCusto: e.target.value,
                  }))
                }
                className="border-gray-200"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                onClick={() => setDialogOpen(false)}
                className="border border-gray-200 text-gray-700 hover:bg-gray-50 bg-white"
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={saving}
              >
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
              Excluir ingrediente?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Essa ação não pode ser desfeita. O ingrediente será removido do
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
