"use client";

import { useState, useMemo } from "react";
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
import { Plus, Pencil, Trash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Header } from "@/components/header";
import { useCategorias, CategoriaTipo } from "@/hooks/useCategorias";
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

type NovaCategoriaForm = {
  descricao: string;
  tipo: CategoriaTipo;
};

export default function CategoriasIngredientes() {
  const {
    categorias,
    loading,
    saving,
    createCategoria,
    updateCategoria,
    deleteCategoria,
  } = useCategorias();

  const [novaCategoria, setNovaCategoria] = useState<NovaCategoriaForm>({
    descricao: "",
    tipo: "INGREDIENTE",
  });

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [busca, setBusca] = useState("");

  const categoriasFiltradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return categorias;

    return categorias.filter((c) =>
      [c.id, c.descricao, c.tipo].some((v) =>
        String(v).toLowerCase().includes(q),
      ),
    );
  }, [categorias, busca]);

  const openDelete = (id: number) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await deleteCategoria(deleteId);
    setDeleteOpen(false);
    setDeleteId(null);
  };

  const resetForm = () => {
    setNovaCategoria({ descricao: "", tipo: "INGREDIENTE" });
    setEditandoId(null);
  };

  const handleSave = async () => {
    if (!novaCategoria.descricao.trim()) {
      // validação simples
      return;
    }

    const payload = {
      descricao: novaCategoria.descricao.trim(),
      tipo: novaCategoria.tipo,
    };

    if (editandoId) {
      await updateCategoria(editandoId, payload);
    } else {
      await createCategoria(payload);
    }

    resetForm();
    setDialogOpen(false);
  };

  const handleEdit = (id: number) => {
    const cat = categorias.find((c) => c.id === id);
    if (!cat) return;

    setNovaCategoria({
      descricao: cat.descricao,
      tipo: cat.tipo,
    });
    setEditandoId(cat.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    await deleteCategoria(id);
  };

  const handleNew = () => {
    resetForm();
    setDialogOpen(true);
  };

  const codigoSistemaAtual = editandoId ? String(editandoId) : "Automático"; // quando criando, ID vem do backend

  return (
    <div className="space-y-6">
      <Header
        title="Categorias de Ingredientes"
        subtitle="Gerencie as categorias de ingredientes e produtos"
        searchValue={busca}
        onSearchChange={setBusca}
      />

      <div className="flex items-center justify-end">
        <Button
          onClick={handleNew}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" /> Criar Categoria
        </Button>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-800">
            Categorias Cadastradas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-500">Carregando categorias...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="text-gray-700">Cód. Sistema</TableHead>
                  <TableHead className="text-gray-700">
                    Categoria de Ingredientes
                  </TableHead>
                  <TableHead className="text-gray-700">Tipo</TableHead>
                  <TableHead className="text-right text-gray-700">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoriasFiltradas.map((categoria) => (
                  <TableRow
                    key={categoria.id}
                    className="hover:bg-gray-50 border-b border-gray-100"
                  >
                    <TableCell className="font-medium text-gray-700">
                      {categoria.id}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {categoria.descricao}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {categoria.tipo}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => handleEdit(categoria.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => openDelete(categoria.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {categoriasFiltradas.length === 0 && !loading && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-sm text-gray-500 py-4"
                    >
                      Nenhuma categoria cadastrada.
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
        onOpenChange={(open: boolean | ((prevState: boolean) => boolean)) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-800">
              {editandoId ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="descricao" className="text-gray-700">
                Descrição
              </Label>
              <Input
                id="descricao"
                value={novaCategoria.descricao}
                onChange={(e) =>
                  setNovaCategoria((prev) => ({
                    ...prev,
                    descricao: e.target.value,
                  }))
                }
                className="border-gray-200"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Categoria de:</Label>
              <RadioGroup
                value={novaCategoria.tipo}
                onValueChange={(value: string) =>
                  setNovaCategoria((prev) => ({
                    ...prev,
                    tipo: value as CategoriaTipo,
                  }))
                }
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="INGREDIENTE" id="ingrediente" />
                  <Label htmlFor="ingrediente" className="text-gray-700">
                    INGREDIENTE
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PRODUTO" id="produto" />
                  <Label htmlFor="produto" className="text-gray-700">
                    PRODUTO
                  </Label>
                </div>
              </RadioGroup>
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
        onOpenChange={(open: boolean) => {
          setDeleteOpen(open);
          if (!open) setDeleteId(null);
        }}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-800">
              Excluir categoria?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Essa ação não pode ser desfeita. A categoria será removida do
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
