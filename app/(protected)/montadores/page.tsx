"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash } from "lucide-react";

import { Header } from "@/components/header";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SortableHead } from "@/components/ui/sorttable";
import { useTableSort } from "@/hooks/useTableSort";
import { Montador, useMontadores } from "@/hooks/useMontadores";
import { toast } from "sonner";

export default function MontadoresPage() {
  const {
    montadores,
    isLoading,
    criarMontador,
    updateMontador,
    deleteMontador,
  } = useMontadores();

  const [busca, setBusca] = useState("");
  const [nome, setNome] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const montadoresFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return montadores;

    return montadores.filter((montador) =>
      [String(montador.id), montador.nome].some((value) =>
        String(value).toLowerCase().includes(q),
      ),
    );
  }, [montadores, busca]);

  const { sort, onSort, sortedRows } = useTableSort(montadoresFiltrados);

  const resetForm = () => {
    setNome("");
    setEditandoId(null);
  };

  const handleNew = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (montador: Montador) => {
    setNome(montador.nome);
    setEditandoId(montador.id);
    setDialogOpen(true);
  };

  const openDelete = (id: number) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    setSaving(true);
    try {
      if (editandoId) {
        await updateMontador(editandoId, nome.trim());
      } else {
        await criarMontador(nome.trim());
      }
      setDialogOpen(false);
      resetForm();
    } catch {
      // O hook já mostra o toast de erro.
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    setSaving(true);
    try {
      await deleteMontador(deleteId);
    } catch {
      // O hook já mostra o toast de erro.
    } finally {
      setDeleteOpen(false);
      setDeleteId(null);
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Header
        title="Montadores"
        subtitle="Gerencie os nomes dos montadores"
        searchValue={busca}
        onSearchChange={setBusca}
      />

      <div className="flex items-center justify-end">
        <Button onClick={handleNew} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="mr-2 h-4 w-4" /> Novo Montador
        </Button>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-800">Montadores Cadastrados</CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <p className="text-sm text-gray-500">Carregando montadores...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <SortableHead label="Cód." field="id" sort={sort} onSort={onSort} />
                  <SortableHead label="Nome" field="nome" sort={sort} onSort={onSort} />
                  <TableHead className="text-right text-gray-700 w-28">Ações</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {sortedRows.map((montador) => (
                  <TableRow key={montador.id} className="hover:bg-gray-50 border-b border-gray-100">
                    <TableCell className="font-medium text-gray-700">{montador.id}</TableCell>
                    <TableCell className="text-gray-700">{montador.nome}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => handleEdit(montador)}
                        disabled={saving}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => openDelete(montador.id)}
                        disabled={saving}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {montadoresFiltrados.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-sm text-gray-500 py-4">
                      Nenhum montador encontrado.
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
              {editandoId ? "Editar Montador" : "Novo Montador"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-gray-700">
                Nome
              </Label>
              <Input
                id="nome"
                value={nome}
                onChange={(event) => setNome(event.target.value.toUpperCase())}
                placeholder="Ex: MARIA"
                className="border-gray-200 uppercase"
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
                disabled={saving || !nome.trim()}
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
            <AlertDialogTitle className="text-gray-800">Excluir montador?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              O registro será desativado e não aparecerá mais na lista de montadores.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-200 text-gray-700 hover:bg-gray-50" disabled={saving}>
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
