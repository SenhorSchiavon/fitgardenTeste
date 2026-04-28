"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { Header } from "@/components/header";
import { SortableHead } from "@/components/ui/sorttable";
import { useTableSort } from "@/hooks/useTableSort";
import { Salgado, useSalgados } from "@/hooks/useSalgados";
import { toast } from "sonner";

function moneyBr(value: number) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function SalgadosPage() {
  const { salgados, loading, saving, createSalgado, updateSalgado, deleteSalgado } = useSalgados();
  const [busca, setBusca] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState({ nome: "", preco: "" });

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return salgados;
    return salgados.filter((s) =>
      [String(s.id), s.nome, String(s.preco)].some((v) =>
        String(v).toLowerCase().includes(q)
      )
    );
  }, [salgados, busca]);

  const { sort, onSort, sortedRows } = useTableSort(filtrados);

  const resetForm = () => {
    setForm({ nome: "", preco: "" });
    setEditandoId(null);
  };

  const handleNew = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (salgado: Salgado) => {
    setEditandoId(salgado.id);
    setForm({ nome: salgado.nome, preco: String(Number(salgado.preco || 0)) });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    const preco = Number(String(form.preco || 0).replace(",", "."));
    if (!Number.isFinite(preco) || preco < 0) {
      toast.error("Preço inválido");
      return;
    }

    if (editandoId) await updateSalgado(editandoId, { nome: form.nome, preco });
    else await createSalgado({ nome: form.nome, preco });

    setDialogOpen(false);
    resetForm();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await deleteSalgado(deleteId);
    setDeleteOpen(false);
    setDeleteId(null);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Header
        title="Salgados"
        subtitle="Cadastre salgados para vender nos pedidos"
        searchValue={busca}
        onSearchChange={setBusca}
      />

      <div className="flex items-center justify-end">
        <Button onClick={handleNew} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="mr-2 h-4 w-4" /> Novo Salgado
        </Button>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-800">Salgados Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-500">Carregando salgados...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <SortableHead label="Cód." field="id" sort={sort} onSort={onSort} />
                  <SortableHead label="Nome" field="nome" sort={sort} onSort={onSort} />
                  <SortableHead label="Preço" field="preco" sort={sort} onSort={onSort} />
                  <TableHead className="text-right text-gray-700 w-28">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRows.map((salgado) => (
                  <TableRow key={salgado.id} className="hover:bg-gray-50 border-b border-gray-100">
                    <TableCell className="font-medium text-gray-700">{salgado.id}</TableCell>
                    <TableCell className="text-gray-700">{salgado.nome}</TableCell>
                    <TableCell className="text-gray-700">{moneyBr(salgado.preco)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => handleEdit(salgado)}
                        disabled={saving}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setDeleteId(salgado.id);
                          setDeleteOpen(true);
                        }}
                        disabled={saving}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {filtrados.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-gray-500 py-4">
                      Nenhum salgado cadastrado.
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
              {editandoId ? "Editar Salgado" : "Novo Salgado"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-gray-700">Nome</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                className="border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preco" className="text-gray-700">Preço</Label>
              <Input
                id="preco"
                type="number"
                step="0.01"
                inputMode="decimal"
                value={form.preco}
                onChange={(e) => setForm((p) => ({ ...p, preco: e.target.value }))}
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
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white" disabled={saving}>
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
            <AlertDialogTitle className="text-gray-800">Excluir salgado?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              O salgado será ocultado de novos pedidos, mas pedidos antigos continuam preservados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-200 text-gray-700 hover:bg-gray-50" disabled={saving}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white" disabled={saving}>
              {saving ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
