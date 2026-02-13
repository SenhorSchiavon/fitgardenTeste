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
import { Plus, Pencil, Trash, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plano, NovoPlanoInput, usePlanos } from "@/hooks/usePlanos";

type PlanoForm = {
  nome: string;
  tamanhoId: string; // select
  unidades: string;
  entregasInclusas: string;
  valor: string;
  ativo: boolean;
};

function toNumber(value: string, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function moneyBr(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function PlanosPage() {
  const { planos, tamanhos, loading, saving, createPlano, updatePlano, deletePlano } =
    usePlanos();

  const [busca, setBusca] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [excluindoId, setExcluindoId] = useState<number | null>(null);

  const [form, setForm] = useState<PlanoForm>({
    nome: "",
    tamanhoId: "",
    unidades: "10",
    entregasInclusas: "0",
    valor: "0",
    ativo: true,
  });

  const resetForm = () => {
    setForm({
      nome: "",
      tamanhoId: "",
      unidades: "10",
      entregasInclusas: "0",
      valor: "0",
      ativo: true,
    });
    setEditandoId(null);
  };

  const planosFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return planos;

    return planos.filter((p) =>
      [p.id, p.nome, p.tamanho?.pesagemGramas, p.unidades, p.entregasInclusas, p.valor]
        .some((v) => String(v ?? "").toLowerCase().includes(q)),
    );
  }, [planos, busca]);

  const handleNew = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (plano: Plano) => {
    setForm({
      nome: plano.nome,
      tamanhoId: String(plano.tamanhoId),
      unidades: String(plano.unidades ?? 0),
      entregasInclusas: String(plano.entregasInclusas ?? 0),
      valor: String(plano.valor ?? 0),
      ativo: !!plano.ativo,
    });
    setEditandoId(plano.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const nome = String(form.nome || "").trim();
    if (!nome) return;
    if (!form.tamanhoId) return;

    const payload: NovoPlanoInput = {
      nome,
      tamanhoId: toNumber(form.tamanhoId),
      unidades: toNumber(form.unidades),
      entregasInclusas: toNumber(form.entregasInclusas),
      valor: toNumber(form.valor),
      ativo: !!form.ativo,
    };

    if (editandoId) await updatePlano(editandoId, payload);
    else await createPlano(payload);

    setDialogOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6">
      <Header
        title="Planos"
        subtitle="Crie planos para vincular aos clientes e controlar saldos (unidades/entregas)"
      />

      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, tamanho, unidades..."
            className="pl-8"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            disabled={loading}
          />
        </div>

        <Button onClick={handleNew} disabled={saving}>
          <Plus className="mr-2 h-4 w-4" /> Criar Plano
        </Button>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-800">Planos Cadastrados</CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-500">Carregando planos...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="text-gray-700">ID</TableHead>
                  <TableHead className="text-gray-700">Nome</TableHead>
                  <TableHead className="text-gray-700">Tamanho</TableHead>
                  <TableHead className="text-gray-700">Unidades</TableHead>
                  <TableHead className="text-gray-700">Entregas</TableHead>
                  <TableHead className="text-gray-700">Valor</TableHead>
                  <TableHead className="text-gray-700">Ativo</TableHead>
                  <TableHead className="text-right text-gray-700">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {planosFiltrados.map((plano) => (
                  <TableRow
                    key={plano.id}
                    className="hover:bg-gray-50 border-b border-gray-100"
                  >
                    <TableCell className="font-medium text-gray-700">
                      {plano.id}
                    </TableCell>

                    <TableCell className="text-gray-700">{plano.nome}</TableCell>

                    <TableCell className="text-gray-700">
                      {plano.tamanho?.pesagemGramas
                        ? `${plano.tamanho.pesagemGramas}g`
                        : `#${plano.tamanhoId}`}
                    </TableCell>

                    <TableCell className="text-gray-700">
                      {Number(plano.unidades || 0)}
                    </TableCell>

                    <TableCell className="text-gray-700">
                      {Number(plano.entregasInclusas || 0)}
                    </TableCell>

                    <TableCell className="text-gray-700">
                      {moneyBr(Number(plano.valor || 0))}
                    </TableCell>

                    <TableCell className="text-gray-700">
                      {plano.ativo ? "Sim" : "Não"}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => handleEdit(plano)}
                        disabled={saving}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <AlertDialog
                        open={excluindoId === plano.id}
                        onOpenChange={(open) =>
                          setExcluindoId(open ? plano.id : null)
                        }
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-500 hover:text-red-600 hover:bg-red-50"
                            disabled={saving}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>

                        <AlertDialogContent className="bg-white">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-gray-800">
                              Excluir plano?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-600">
                              Isso remove o plano <b>{plano.nome}</b>. Se ele
                              já estiver vinculado a clientes, a API pode
                              bloquear.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={saving}>
                              Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction
                              disabled={saving}
                              onClick={async () => {
                                await deletePlano(plano.id);
                                setExcluindoId(null);
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}

                {planosFiltrados.length === 0 && !loading && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-sm text-gray-500 py-4"
                    >
                      Nenhum plano cadastrado.
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
        <DialogContent className="bg-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-800">
              {editandoId ? "Editar Plano" : "Novo Plano"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-gray-700">Nome</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                className="border-gray-200"
                disabled={saving}
                placeholder="Ex: Plano 10 marmitas"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Tamanho</Label>
                <Select
                  value={form.tamanhoId}
                  onValueChange={(value) => setForm((p) => ({ ...p, tamanhoId: value }))}
                  disabled={saving}
                >
                  <SelectTrigger className="border-gray-200">
                    <SelectValue placeholder="Selecione o tamanho" />
                  </SelectTrigger>
                  <SelectContent>
                    {tamanhos.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.pesagemGramas}g
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">Valor (R$)</Label>
                <Input
                  value={form.valor}
                  onChange={(e) => setForm((p) => ({ ...p, valor: e.target.value }))}
                  className="border-gray-200"
                  disabled={saving}
                  placeholder="Ex: 199.90"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Unidades (marmitas)</Label>
                <Input
                  value={form.unidades}
                  onChange={(e) => setForm((p) => ({ ...p, unidades: e.target.value }))}
                  className="border-gray-200"
                  disabled={saving}
                  placeholder="Ex: 10"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">Entregas inclusas</Label>
                <Input
                  value={form.entregasInclusas}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, entregasInclusas: e.target.value }))
                  }
                  className="border-gray-200"
                  disabled={saving}
                  placeholder="Ex: 2"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border border-gray-200 p-3">
              <div>
                <div className="text-sm font-medium text-gray-800">Ativo</div>
                <div className="text-xs text-gray-500">
                  Planos inativos não devem aparecer para venda/seleção.
                </div>
              </div>
              <Switch
                checked={form.ativo}
                onCheckedChange={(checked:boolean) => setForm((p) => ({ ...p, ativo: checked }))}
                disabled={saving}
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
    </div>
  );
}
