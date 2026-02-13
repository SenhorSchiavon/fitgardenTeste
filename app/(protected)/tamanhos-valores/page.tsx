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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { useTamanhos, Tamanho } from "@/hooks/useTamanhos";

type TamanhoValorForm = {
  pesagem: number;
  valorUnitario: number;
  valorAcima10: number;
  valorAcima20: number;
  valorAcima40: number;
};

export default function TamanhosValores() {
  const { tamanhos, loading, saving, createTamanho, updateTamanho, deleteTamanho } = useTamanhos();

  const [busca, setBusca] = useState("");

  const [novoTamanho, setNovoTamanho] = useState<Partial<TamanhoValorForm>>({
    pesagem: 0,
    valorUnitario: 0,
    valorAcima10: 0,
    valorAcima20: 0,
    valorAcima40: 0,
  });

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [excluindoId, setExcluindoId] = useState<number | null>(null);

  const resetForm = () => {
    setNovoTamanho({
      pesagem: 0,
      valorUnitario: 0,
      valorAcima10: 0,
      valorAcima20: 0,
      valorAcima40: 0,
    });
    setEditandoId(null);
  };

  const handleNew = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (t: Tamanho) => {
    setNovoTamanho({
      pesagem: t.pesagemGramas,
      valorUnitario: t.valorUnitario,
      valorAcima10: t.valor10,
      valorAcima20: t.valor20,
      valorAcima40: t.valor40,
    });
    setEditandoId(t.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      pesagemGramas: Math.trunc(Number(novoTamanho.pesagem || 0)),
      valorUnitario: Number(novoTamanho.valorUnitario || 0),
      valor10: Number(novoTamanho.valorAcima10 || 0),
      valor20: Number(novoTamanho.valorAcima20 || 0),
      valor40: Number(novoTamanho.valorAcima40 || 0),
    };

    if (!payload.pesagemGramas) return;

    if (editandoId) await updateTamanho(editandoId, payload);
    else await createTamanho(payload);

    setDialogOpen(false);
    resetForm();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 3,
    }).format(value);
  };

  const tamanhosFiltradosOrdenados = useMemo(() => {
    const q = busca.trim().toLowerCase();

    const base = [...tamanhos].sort((a, b) => a.pesagemGramas - b.pesagemGramas);
    if (!q) return base;

    const match = (v: unknown) => String(v ?? "").toLowerCase().includes(q);

    return base.filter((t) =>
      [
        t.id,
        t.pesagemGramas,
        t.valorUnitario,
        t.valor10,
        t.valor20,
        t.valor40,
      ].some(match),
    );
  }, [tamanhos, busca]);

  return (
    <div className="container mx-auto p-6">
      <Header
        title="Tamanhos e Valores"
        subtitle="Gerencie os tamanhos e valores das marmitas"
        searchValue={busca}
        onSearchChange={setBusca}
      />

      <div className="flex items-center justify-end mb-6">
        <Button onClick={handleNew} disabled={saving}>
          <Plus className="mr-2 h-4 w-4" /> Criar Tamanho
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tamanhos Cadastrados</CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando tamanhos...</p>
          ) : (
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
                {tamanhosFiltradosOrdenados.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.pesagemGramas}g</TableCell>
                    <TableCell>{formatCurrency(t.valorUnitario)}</TableCell>
                    <TableCell>{formatCurrency(t.valor10)}</TableCell>
                    <TableCell>{formatCurrency(t.valor20)}</TableCell>
                    <TableCell>{formatCurrency(t.valor40)}</TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(t)}
                        disabled={saving}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <AlertDialog
                        open={excluindoId === t.id}
                        onOpenChange={(open) => setExcluindoId(open ? t.id : null)}
                      >
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={saving}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir tamanho?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Isso remove o tamanho de {t.pesagemGramas}g. Se ele estiver em uso (planos/pedidos),
                              a API pode bloquear a exclusão.
                            </AlertDialogDescription>
                          </AlertDialogHeader>

                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              disabled={saving}
                              onClick={async () => {
                                await deleteTamanho(t.id);
                                setExcluindoId(null);
                              }}
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}

                {tamanhosFiltradosOrdenados.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-4">
                      Nenhum tamanho encontrado.
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editandoId ? "Editar Tamanho" : "Novo Tamanho"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="pesagem">Pesagem</Label>
              <div className="flex items-center">
                <Input
                  id="pesagem"
                  type="number"
                  value={novoTamanho.pesagem ?? ""}
                  onChange={(e) => setNovoTamanho((p) => ({ ...p, pesagem: Number(e.target.value) }))}
                  disabled={saving}
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
                    value={novoTamanho.valorUnitario ?? ""}
                    onChange={(e) => setNovoTamanho((p) => ({ ...p, valorUnitario: Number(e.target.value) }))}
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valorAcima10">ACIMA DE 10 UNIDADES</Label>
                  <Input
                    id="valorAcima10"
                    type="number"
                    step="0.001"
                    value={novoTamanho.valorAcima10 ?? ""}
                    onChange={(e) => setNovoTamanho((p) => ({ ...p, valorAcima10: Number(e.target.value) }))}
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valorAcima20">ACIMA DE 20 UNIDADES</Label>
                  <Input
                    id="valorAcima20"
                    type="number"
                    step="0.001"
                    value={novoTamanho.valorAcima20 ?? ""}
                    onChange={(e) => setNovoTamanho((p) => ({ ...p, valorAcima20: Number(e.target.value) }))}
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valorAcima40">ACIMA DE 40 UNIDADES</Label>
                  <Input
                    id="valorAcima40"
                    type="number"
                    step="0.001"
                    value={novoTamanho.valorAcima40 ?? ""}
                    onChange={(e) => setNovoTamanho((p) => ({ ...p, valorAcima40: Number(e.target.value) }))}
                    disabled={saving}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
