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
import { Plus, Pencil, Trash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/header";

import { useMedidas, Medida } from "@/hooks/useMedidas";
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

export default function MedidasPage() {
  const {
    medidas,
    isLoading: loadingMedidas,
    criarMedida,
    updateMedida,
    deleteMedida,
  } = useMedidas();

  const [busca, setBusca] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const medidasFiltradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return medidas;

    return medidas.filter((m) =>
      [String(m.id), m.nome].some((v) =>
        String(v).toLowerCase().includes(q)
      )
    );
  }, [medidas, busca]);

  const resetForm = () => {
    setNovoNome("");
    setEditandoId(null);
  };

  const handleNew = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (medida: Medida) => {
    setNovoNome(medida.nome);
    setEditandoId(medida.id);
    setDialogOpen(true);
  };

  const openDelete = (id: number) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!novoNome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    setSaving(true);
    try {
      if (editandoId) {
        if(updateMedida) {
          await updateMedida(editandoId, novoNome.trim());
        }
      } else {
        await criarMedida(novoNome.trim());
      }
      setDialogOpen(false);
      resetForm();
    } catch (e) {
      // O hook já mostra toast de erro
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId || !deleteMedida) return;

    setSaving(true);
    try {
      await deleteMedida(deleteId);
    } catch (e) {
      // Erro é tratado no hook
    } finally {
      setDeleteOpen(false);
      setDeleteId(null);
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Header
        title="Medidas"
        subtitle="Gerencie as unidades de medida do sistema"
        searchValue={busca}
        onSearchChange={setBusca}
      />

      <div className="flex items-center justify-end">
        <Button
          onClick={handleNew}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" /> Nova Medida
        </Button>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-800">Medidas Cadastradas</CardTitle>
        </CardHeader>

        <CardContent>
          {loadingMedidas ? (
            <p className="text-sm text-gray-500">Carregando medidas...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="text-gray-700 w-24">Cód.</TableHead>
                  <TableHead className="text-gray-700">Nome</TableHead>
                  <TableHead className="text-right text-gray-700 w-28">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {medidasFiltradas.map((medida) => (
                  <TableRow
                    key={medida.id}
                    className="hover:bg-gray-50 border-b border-gray-100"
                  >
                    <TableCell className="font-medium text-gray-700">
                      {medida.id}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {medida.nome}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => handleEdit(medida)}
                        disabled={saving}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => openDelete(medida.id)}
                        disabled={saving}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {medidasFiltradas.length === 0 && !loadingMedidas && (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-sm text-gray-500 py-4"
                    >
                      Nenhuma medida encontrada.
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
              {editandoId ? "Editar Medida" : "Nova Medida"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-gray-700">
                Nome
              </Label>
              <Input
                id="nome"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value.toUpperCase())}
                placeholder="Ex: KG, UNIDADE, GRAMAS"
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
                disabled={saving || !novoNome.trim()}
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
              Excluir medida?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              O registro não será realmente apagado do banco, apenas desativado (soft delete).
              Essa ação pode ocultar essa medida de novos cadastros.
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
