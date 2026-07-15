"use client";

import { useMemo, useState } from "react";
import { Minus, PackagePlus, Pencil, Plus, Trash, Warehouse } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Congelada, CongeladaMovimentoTipo, useCongeladas } from "@/hooks/useCongeladas";

type FormState = {
  nome: string;
  tamanhoGramas: "200" | "300" | "400";
  quantidade: string;
  observacao: string;
};

const TAMANHOS_CONGELADAS = [200, 300, 400] as const;

type MovimentoState = {
  item: Congelada | null;
  tipo: CongeladaMovimentoTipo;
  quantidade: string;
  observacao: string;
};

function movimentoLabel(tipo: CongeladaMovimentoTipo) {
  if (tipo === "ENTRADA") return "Entrada";
  if (tipo === "SAIDA") return "Saida";
  return "Ajuste";
}

function formatDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function CongeladasPage() {
  const {
    congeladas,
    loading,
    saving,
    createCongelada,
    updateCongelada,
    movimentarCongelada,
    deleteCongelada,
  } = useCongeladas();

  const [busca, setBusca] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>({ nome: "", tamanhoGramas: "300", quantidade: "0", observacao: "" });
  const [movimento, setMovimento] = useState<MovimentoState>({
    item: null,
    tipo: "ENTRADA",
    quantidade: "1",
    observacao: "",
  });

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return congeladas;
    return congeladas.filter((item) =>
      [String(item.id), item.nome, `${item.tamanhoGramas}g`, String(item.quantidade)].some((v) => v.toLowerCase().includes(q)),
    );
  }, [congeladas, busca]);

  const listasPorTamanho = useMemo(
    () => TAMANHOS_CONGELADAS.map((tamanho) => ({
      tamanho,
      itens: filtradas.filter((item) => item.tamanhoGramas === tamanho),
    })),
    [filtradas],
  );

  const totalEstoque = useMemo(
    () => congeladas.reduce((total, item) => total + item.quantidade, 0),
    [congeladas],
  );

  const estoqueBaixo = useMemo(
    () => congeladas.filter((item) => item.quantidade <= 3).length,
    [congeladas],
  );

  const resetForm = () => {
    setForm({ nome: "", tamanhoGramas: "300", quantidade: "0", observacao: "" });
    setEditandoId(null);
  };

  const handleNew = () => {
    resetForm();
    setFormOpen(true);
  };

  const handleEdit = (item: Congelada) => {
    setEditandoId(item.id);
    setForm({ nome: item.nome, tamanhoGramas: String(item.tamanhoGramas) as FormState["tamanhoGramas"], quantidade: String(item.quantidade), observacao: "" });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim()) {
      toast.error("Nome e obrigatorio");
      return;
    }

    const quantidade = Number(form.quantidade || 0);
    if (!Number.isInteger(quantidade) || quantidade < 0) {
      toast.error("Quantidade invalida");
      return;
    }

    const tamanhoGramas = Number(form.tamanhoGramas) as 200 | 300 | 400;
    if (editandoId) await updateCongelada(editandoId, { nome: form.nome, tamanhoGramas });
    else await createCongelada({ nome: form.nome, tamanhoGramas, quantidade, observacao: form.observacao });

    setFormOpen(false);
    resetForm();
  };

  const openMovimento = (item: Congelada, tipo: CongeladaMovimentoTipo) => {
    setMovimento({
      item,
      tipo,
      quantidade: "1",
      observacao: tipo === "SAIDA" ? "Venda na recepcao" : "",
    });
  };

  const handleMovimento = async () => {
    if (!movimento.item) return;

    const quantidade = Number(movimento.quantidade || 0);
    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      toast.error("Informe uma quantidade maior que zero");
      return;
    }

    await movimentarCongelada(movimento.item.id, {
      tipo: movimento.tipo,
      quantidade,
      observacao: movimento.observacao,
    });

    setMovimento({ item: null, tipo: "ENTRADA", quantidade: "1", observacao: "" });
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await deleteCongelada(deleteId);
    setDeleteOpen(false);
    setDeleteId(null);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Header
        title="Congeladas"
        subtitle="Controle o estoque das marmitas congeladas dos freezers da recepcao"
        searchValue={busca}
        onSearchChange={setBusca}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-gray-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total no freezer</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <span className="text-3xl font-bold text-gray-900">{totalEstoque}</span>
            <Warehouse className="h-8 w-8 text-blue-500" />
          </CardContent>
        </Card>
        <Card className="border-gray-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Tipos cadastrados</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <span className="text-3xl font-bold text-gray-900">{congeladas.length}</span>
            <PackagePlus className="h-8 w-8 text-emerald-500" />
          </CardContent>
        </Card>
        <Card className="border-gray-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Estoque baixo</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <span className="text-3xl font-bold text-gray-900">{estoqueBaixo}</span>
            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">ate 3 un.</Badge>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-end">
        <Button onClick={handleNew} className="bg-blue-600 text-white hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Nova Congelada
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {listasPorTamanho.map(({ tamanho, itens }) => (
          <Card key={tamanho} className="min-w-0 border-gray-200 bg-white">
            <CardHeader className="border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-gray-800">Congeladas {tamanho}g</CardTitle>
                <Badge variant="secondary">{itens.reduce((total, item) => total + item.quantidade, 0)} un.</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <p className="p-5 text-sm text-gray-500">Carregando congeladas...</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 hover:bg-gray-50">
                        <TableHead className="text-gray-700">Marmita</TableHead>
                        <TableHead className="w-24 text-center text-gray-700">Estoque</TableHead>
                        <TableHead className="w-44 text-right text-gray-700">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itens.map((item) => {
                        const ultimo = item.movimentos?.[0];
                        return (
                          <TableRow key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <TableCell className="text-gray-800">
                              <div className="font-medium">{item.nome}</div>
                              <div className="mt-1 text-xs text-gray-500">
                                {ultimo ? `${movimentoLabel(ultimo.tipo)} de ${ultimo.quantidade} un. em ${formatDate(ultimo.createdAt)}` : "Sem movimentações"}
                              </div>
                              {item.quantidade <= 3 && (
                                <div className="mt-1 text-xs font-medium text-amber-700">Estoque baixo</div>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="inline-flex min-w-12 justify-center rounded-md bg-gray-100 px-2 py-1 text-lg font-bold text-gray-900">
                                {item.quantidade}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button size="icon" title="Adicionar" className="h-8 w-8 bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => openMovimento(item, "ENTRADA")} disabled={saving}>
                                  <Plus className="h-4 w-4" />
                                </Button>
                                <Button size="icon" title="Remover" variant="outline" className="h-8 w-8 border-red-200 text-red-700 hover:bg-red-50" onClick={() => openMovimento(item, "SAIDA")} disabled={saving || item.quantidade === 0}>
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" title="Editar" className="h-8 w-8 text-gray-500 hover:bg-blue-50 hover:text-blue-600" onClick={() => handleEdit(item)} disabled={saving}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" title="Excluir" className="h-8 w-8 text-gray-500 hover:bg-red-50 hover:text-red-600" onClick={() => { setDeleteId(item.id); setDeleteOpen(true); }} disabled={saving}>
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {itens.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="py-8 text-center text-sm text-gray-500">
                            Nenhuma congelada de {tamanho}g cadastrada.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-800">
              {editandoId ? "Editar Congelada" : "Nova Congelada"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-gray-700">Tamanho da marmita</Label>
              <div className="grid grid-cols-3 gap-2">
                {TAMANHOS_CONGELADAS.map((tamanho) => (
                  <Button
                    key={tamanho}
                    type="button"
                    variant={form.tamanhoGramas === String(tamanho) ? "default" : "outline"}
                    className={form.tamanhoGramas === String(tamanho) ? "bg-blue-600 text-white hover:bg-blue-700" : "border-gray-200"}
                    onClick={() => setForm((prev) => ({ ...prev, tamanhoGramas: String(tamanho) as FormState["tamanhoGramas"] }))}
                  >
                    {tamanho}g
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-gray-700">Nome da marmita</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))}
                className="border-gray-200"
                placeholder="Ex.: Frango com legumes"
              />
            </div>
            {!editandoId && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="quantidade" className="text-gray-700">Quantidade inicial</Label>
                  <Input
                    id="quantidade"
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={form.quantidade}
                    onChange={(e) => setForm((prev) => ({ ...prev, quantidade: e.target.value }))}
                    className="border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observacao" className="text-gray-700">Observacao</Label>
                  <Textarea
                    id="observacao"
                    value={form.observacao}
                    onChange={(e) => setForm((prev) => ({ ...prev, observacao: e.target.value }))}
                    className="border-gray-200"
                    placeholder="Opcional"
                  />
                </div>
              </>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                onClick={() => setFormOpen(false)}
                className="border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button onClick={handleSave} className="bg-blue-600 text-white hover:bg-blue-700" disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(movimento.item)}
        onOpenChange={(open) => {
          if (!open) setMovimento({ item: null, tipo: "ENTRADA", quantidade: "1", observacao: "" });
        }}
      >
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-800">
              {movimento.tipo === "SAIDA" ? "Remover do estoque" : "Adicionar ao estoque"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
              <span className="font-medium">{movimento.item?.nome}</span>
              <Badge variant="outline" className="ml-2">{movimento.item?.tamanhoGramas}g</Badge>
              <span className="ml-2 text-gray-500">Estoque atual: {movimento.item?.quantidade ?? 0}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="movimento-quantidade" className="text-gray-700">Quantidade</Label>
              <Input
                id="movimento-quantidade"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={movimento.quantidade}
                onChange={(e) => setMovimento((prev) => ({ ...prev, quantidade: e.target.value }))}
                className="border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="movimento-observacao" className="text-gray-700">Observacao</Label>
              <Textarea
                id="movimento-observacao"
                value={movimento.observacao}
                onChange={(e) => setMovimento((prev) => ({ ...prev, observacao: e.target.value }))}
                className="border-gray-200"
                placeholder={movimento.tipo === "SAIDA" ? "Ex.: Venda na recepcao" : "Ex.: Producao do dia"}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                onClick={() => setMovimento({ item: null, tipo: "ENTRADA", quantidade: "1", observacao: "" })}
                className="border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleMovimento}
                className={movimento.tipo === "SAIDA" ? "bg-red-600 text-white hover:bg-red-700" : "bg-emerald-600 text-white hover:bg-emerald-700"}
                disabled={saving}
              >
                {saving ? "Salvando..." : movimento.tipo === "SAIDA" ? "Remover" : "Adicionar"}
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
            <AlertDialogTitle className="text-gray-800">Excluir congelada?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Ela sera ocultada do estoque ativo, mas o historico fica preservado no banco.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-200 text-gray-700 hover:bg-gray-50" disabled={saving}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 text-white hover:bg-red-700" disabled={saving}>
              {saving ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
