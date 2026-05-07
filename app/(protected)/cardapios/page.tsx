"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash, Check, Power } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Header } from "@/components/header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter as AlertDialogFooterUi,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useCardapios, Cardapio } from "@/hooks/useCardapios";
import { useOpcoes, Opcao } from "@/hooks/useOpcoes";
import { useMontadores } from "@/hooks/useMontadores";
import { useTableSort } from "@/hooks/useTableSort";
import { SortableHead } from "@/components/ui/sorttable";

type NovoCardapioForm = {
  codigo: string;
  nome: string;
  ativo: boolean;
  opcoesIds: number[];
  montadores: Record<string, string>;
};

export default function CardapiosPage() {
  const {
    cardapios,
    loading: loadingCardapios,
    saving,
    createCardapio,
    updateCardapio,
    deleteCardapio,
    setCardapioAtivo,
    fetchCardapios,
  } = useCardapios();

  const { opcoes, loading: loadingOpcoes } = useOpcoes();
  const { montadores, isLoading: loadingMontadores } = useMontadores();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [busca, setBusca] = useState("");

  const [form, setForm] = useState<NovoCardapioForm>({
    codigo: "",
    nome: "",
    ativo: false,
    opcoesIds: [],
    montadores: {},
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; nome: string } | null>(null);

  const isLoading = loadingCardapios || loadingOpcoes || loadingMontadores;
  const handleToggleAtivo = async (cardapio: Cardapio) => {
    await setCardapioAtivo(cardapio.id, !cardapio.ativo);
    await fetchCardapios();
  };
  const cardapiosFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return cardapios;
    return cardapios.filter((c) => [c.codigo, c.nome, c.ativo ? "ativo" : "inativo"].some((v) => String(v).toLowerCase().includes(q)));
  }, [cardapios, busca]);
  const { sort, onSort, sortedRows } = useTableSort<Cardapio, "codigo" | "nome" | "ativo">(cardapiosFiltrados);

  const opcoesPorCategoria = useMemo(() => {
    const categorias: Record<string, Opcao[]> = {};
    for (const o of opcoes) {
      const cat = o.tipo === "MARMITA" ? (o.categoriaDescricao ?? "SEM CATEGORIA") : "OUTROS";
      if (!categorias[cat]) categorias[cat] = [];
      categorias[cat].push(o);
    }
    for (const k of Object.keys(categorias)) {
      categorias[k].sort((a, b) => a.nome.localeCompare(b.nome));
    }
    return categorias;
  }, [opcoes]);

  const resetForm = () => {
    setForm({ codigo: "", nome: "", ativo: false, opcoesIds: [], montadores: {} });
    setEditandoId(null);
  };

  const handleNew = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (cardapio: Cardapio) => {
    const montadoresForm: Record<string, string> = {};
    for (const opcao of cardapio.opcoes || []) {
      for (const componente of opcao.componentes || []) {
        if (componente.montadorId) {
          montadoresForm[`${opcao.opcaoId}:${componente.opcaoPreparoId}`] = String(componente.montadorId);
        }
      }
    }

    setForm({
      codigo: cardapio.codigo,
      nome: cardapio.nome,
      ativo: cardapio.ativo,
      opcoesIds: (cardapio.opcoes || []).filter((x) => x.ativo).map((x) => x.opcaoId),
      montadores: montadoresForm,
    });
    setEditandoId(cardapio.id);
    setDialogOpen(true);
  };

  const handleToggleOpcao = (opcaoId: number) => {
    setForm((p) => {
      const ids = p.opcoesIds || [];
      const has = ids.includes(opcaoId);
      return { ...p, opcoesIds: has ? ids.filter((id) => id !== opcaoId) : [...ids, opcaoId] };
    });
  };

  const handleChangeMontador = (opcaoId: number, opcaoPreparoId: number, value: string) => {
    const key = `${opcaoId}:${opcaoPreparoId}`;
    setForm((p) => {
      const next = { ...p.montadores };
      if (value === "none") delete next[key];
      else next[key] = value;
      return { ...p, montadores: next };
    });
  };

  const labelComponente = (tipo: string) => {
    if (tipo === "CARBOIDRATO") return "Carboidrato";
    if (tipo === "PROTEINA") return "Proteína";
    if (tipo === "LEGUMES") return "Legumes";
    if (tipo === "FEIJAO") return "Feijao";
    return tipo;
  };

  const handlePreSave = () => {
    if (!form.codigo.trim()) return;
    if (!form.nome.trim()) return;
    setConfirmDialogOpen(true);
  };

  const handleConfirmSave = async () => {
    setConfirmDialogOpen(false);

    const opcoesPayload = (form.opcoesIds || []).map((opcaoId, idx) => {
      const opcao = opcoes.find((o) => o.id === opcaoId);
      return {
        opcaoId,
        ordem: idx + 1,
        ativo: true,
        montadores: (opcao?.componentes || [])
          .map((componente) => ({
            opcaoPreparoId: componente.opcaoPreparoId,
            montadorId: form.montadores[`${opcaoId}:${componente.opcaoPreparoId}`]
              ? Number(form.montadores[`${opcaoId}:${componente.opcaoPreparoId}`])
              : null,
          }))
          .filter((item) => item.montadorId != null),
      };
    });

    const payload = {
      codigo: form.codigo.trim(),
      nome: form.nome.trim(),
      ativo: !!form.ativo,
      opcoes: opcoesPayload,
    };

    if (editandoId) await updateCardapio(editandoId, payload);
    else await createCardapio(payload);

    setDialogOpen(false);
    resetForm();
  };

  const openDeleteDialog = (cardapio: Cardapio) => {
    setDeleteTarget({ id: cardapio.id, nome: cardapio.nome });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteCardapio(deleteTarget.id);
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  const selectedResumo = useMemo(() => {
    const selectedSet = new Set(form.opcoesIds || []);
    const mapById = new Map<number, Opcao>();
    for (const o of opcoes) mapById.set(o.id, o);

    const list = [...selectedSet]
      .map((id) => mapById.get(id))
      .filter(Boolean) as Opcao[];

    // ordena por nome
    list.sort((a, b) => a.nome.localeCompare(b.nome));
    return list;
  }, [form.opcoesIds, opcoes]);

  return (
    <div className="container mx-auto p-6">
      <Header
        title="Cardápios"
        subtitle="Gerencie os cardápios disponíveis"
        searchValue={busca}
        onSearchChange={setBusca}
      />

      <div className="flex items-center justify-end mb-6">
        <Button onClick={handleNew} disabled={saving || isLoading}>
          <Plus className="mr-2 h-4 w-4" /> Criar Cardápio
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cardápios Cadastrados</CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead label="Código" field="codigo" sort={sort} onSort={onSort} />
                  <SortableHead label="Nome" field="nome" sort={sort} onSort={onSort} />
                  <SortableHead label="Ativo" field="ativo" sort={sort} onSort={onSort} />
                  <div className="flex items-center justify-center gap-2">
                    Ações
                  </div>                </TableRow>
              </TableHeader>

              <TableBody>
                {sortedRows.map((cardapio) => (
                  <TableRow key={cardapio.id}>
                    <TableCell>{cardapio.codigo}</TableCell>
                    <TableCell>{cardapio.nome}</TableCell>
                    <TableCell>
                      {cardapio.ativo ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          <Check className="mr-1 h-3 w-3" />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                          Inativo
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleAtivo(cardapio)}
                        disabled={saving}
                        title={cardapio.ativo ? "Inativar" : "Ativar"}
                      >
                        <Power className={`h-4 w-4 ${cardapio.ativo ? "text-green-600" : "text-gray-500"}`} />
                      </Button>

                      <Button variant="ghost" size="icon" onClick={() => handleEdit(cardapio)} disabled={saving}>
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(cardapio)} disabled={saving}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {cardapiosFiltrados.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-4">
                      Nenhum cardápio cadastrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* MODAL CRIAR/EDITAR */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editandoId ? "Editar Cardápio" : "Novo Cardápio"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={form.nome}
                  onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="codigo">Código</Label>
                <Input
                  id="codigo"
                  value={form.codigo}
                  onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))}
                  disabled={saving}
                />
                <p className="text-xs text-muted-foreground">Código para ordenação dos cardápios</p>
              </div>
            </div>



            <div className="space-y-2 border-t pt-4">
              <Label>Refeições (opções)</Label>

              <ScrollArea className="h-[460px] rounded-md border">
                <div className="p-4">
                  {Object.entries(opcoesPorCategoria).map(([categoria, opcoesCategoria]) => (
                    <div key={categoria} className="mb-4">
                      <h3 className="mb-2 font-medium">
                        {categoria}
                      </h3>

                      <div className="space-y-2">
                        {opcoesCategoria.map((opcao) => {
                          const selecionada = (form.opcoesIds || []).includes(opcao.id);

                          return (
                            <div key={opcao.id} className="rounded-md border border-transparent px-2 py-2 data-[selected=true]:border-emerald-100 data-[selected=true]:bg-emerald-50/40" data-selected={selecionada}>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`opcao-${opcao.id}`}
                                  checked={selecionada}
                                  onCheckedChange={() => handleToggleOpcao(opcao.id)}
                                  disabled={saving}
                                />
                                <Label htmlFor={`opcao-${opcao.id}`} className="font-medium">
                                  {opcao.nome}
                                </Label>
                              </div>

                              {selecionada && opcao.tipo === "MARMITA" && (
                                <div className="ml-7 mt-3 space-y-2">
                                  {(opcao.componentes || []).length === 0 ? (
                                    <p className="text-xs text-muted-foreground">
                                      Esta opção não possui componentes cadastrados.
                                    </p>
                                  ) : (
                                    (opcao.componentes || []).map((componente) => {
                                      const key = `${opcao.id}:${componente.opcaoPreparoId}`;

                                      return (
                                        <div
                                          key={componente.opcaoPreparoId}
                                          className="grid grid-cols-1 gap-2 rounded-md border bg-white px-3 py-2 md:grid-cols-[minmax(0,1fr)_220px] md:items-center"
                                        >
                                          <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-slate-800">
                                              {componente.preparoNome || "-"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              {labelComponente(componente.tipo)} · {componente.porcentagem}%
                                            </p>
                                          </div>

                                          <Select
                                            value={form.montadores[key] || "none"}
                                            onValueChange={(value) =>
                                              handleChangeMontador(opcao.id, componente.opcaoPreparoId, value)
                                            }
                                            disabled={saving}
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Montador" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="none">Sem montador</SelectItem>
                                              {montadores.map((montador) => (
                                                <SelectItem key={montador.id} value={String(montador.id)}>
                                                  {montador.nome}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <Separator className="my-2" />
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <p className="text-xs text-muted-foreground">
                A ordem é definida pela ordem de seleção (você pode melhorar depois com drag & drop).
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={handlePreSave} disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* CONFIRMAR SALVAR */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Seleção</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <h3 className="mb-2 font-medium">Opções selecionadas:</h3>

            {selectedResumo.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma opção selecionada.</p>
            ) : (
              <ul className="ml-4 list-disc">
                {selectedResumo.map((op) => (
                  <li key={op.id} className="text-sm">
                    {op.nome}
                    {op.tipo === "MARMITA" && op.categoriaDescricao ? (
                      <span className="text-muted-foreground"> — {op.categoriaDescricao}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)} disabled={saving}>
              Voltar
            </Button>
            <Button onClick={handleConfirmSave} disabled={saving}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ALERT DIALOG EXCLUIR */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cardápio?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.nome
                ? `Você tem certeza que deseja excluir "${deleteTarget.nome}"? Essa ação não pode ser desfeita.`
                : "Você tem certeza que deseja excluir este cardápio? Essa ação não pode ser desfeita."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooterUi>
            <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={saving}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooterUi>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
