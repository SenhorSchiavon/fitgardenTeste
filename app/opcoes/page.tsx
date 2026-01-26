"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
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
import { Plus, Pencil, Trash, AlertCircle } from "lucide-react";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  useOpcoes,
  Opcao,
  OpcaoTipo,
  OpcaoCategoria,
  ComponenteTipo,
  OpcaoComponente,
} from "@/hooks/useOpcoes";
import { usePreparos, Preparo } from "@/hooks/usePreparos";

type ComponenteDraft = {
  id: string;
  tipo: ComponenteTipo;
  preparoId: number | null;
  preparoNome: string;
  porcentagem: number;
};

type NovaOpcaoForm = {
  tipo: OpcaoTipo;
  nome: string;
  categoria: OpcaoCategoria | null;
  componentes: ComponenteDraft[];
};

const formatCodigoOpcao = (id: number) => `OPC${String(id).padStart(3, "0")}`;

function toComponenteDraft(c: OpcaoComponente, idx: number): ComponenteDraft {
  return {
    id: `${c.tipo}-${c.preparoId}-${idx}`,
    tipo: c.tipo,
    preparoId: c.preparoId,
    preparoNome: c.preparoNome ?? "",
    porcentagem: c.porcentagem,
  };
}

export default function OpcoesPage() {
  const {
    opcoes,
    loading: loadingOpcoes,
    saving,
    createOpcao,
    updateOpcao,
    deleteOpcao,
  } = useOpcoes();

  const { preparos, loading: loadingPreparos } = usePreparos();

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState<ComponenteTipo | null>(null);
  const [erroSoma, setErroSoma] = useState(false);
  const [busca, setBusca] = useState("");

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    nome: string;
  } | null>(null);

  const [novaOpcao, setNovaOpcao] = useState<NovaOpcaoForm>({
    tipo: "MARMITA",
    nome: "",
    categoria: "FIT",
    componentes: [],
  });

  const resetForm = () => {
    setNovaOpcao({
      tipo: "MARMITA",
      nome: "",
      categoria: "FIT",
      componentes: [],
    });
    setEditandoId(null);
    setErroSoma(false);
    setSheetOpen(null);
  };

  const opcoesFiltradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return opcoes;

    return opcoes.filter((o) =>
      [o.id, o.nome, o.tipo, o.categoria].some((v) =>
        String(v ?? "")
          .toLowerCase()
          .includes(q),
      ),
    );
  }, [opcoes, busca]);

  const isLoading = loadingOpcoes || loadingPreparos;

  const somaPct = useMemo(() => {
    return (novaOpcao.componentes || []).reduce(
      (acc, c) => acc + (c.porcentagem || 0),
      0,
    );
  }, [novaOpcao.componentes]);

  const preparosPorTipo = useMemo(() => {
    return {
      CARBOIDRATO: preparos.filter((p) => p.tipo === "CARBOIDRATO"),
      PROTEINA: preparos.filter((p) => p.tipo === "PROTEINA"),
      LEGUMES: preparos.filter((p) => p.tipo === "LEGUMES"),
    } as const;
  }, [preparos]);

  const handleNew = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (opcao: Opcao) => {
    setNovaOpcao({
      tipo: opcao.tipo,
      nome: opcao.nome,
      categoria: opcao.categoria ?? "FIT",
      componentes: (opcao.componentes || []).map(toComponenteDraft),
    });

    setEditandoId(opcao.id);
    setDialogOpen(true);
    setErroSoma(false);
  };

  const openDeleteConfirm = (opcao: Opcao) => {
    setDeleteTarget({ id: opcao.id, nome: opcao.nome });
    setConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteOpcao(deleteTarget.id);
    } finally {
      setConfirmDeleteOpen(false);
      setDeleteTarget(null);
    }
  };

  const handleChangeTipo = (value: OpcaoTipo) => {
    setNovaOpcao((p) => {
      if (value === "OUTROS") {
        return {
          ...p,
          tipo: "OUTROS",
          categoria: null,
          componentes: [],
        };
      }

      return {
        ...p,
        tipo: "MARMITA",
        categoria: p.categoria ?? "FIT",
      };
    });

    setErroSoma(false);
  };

  const handleAddComponente = (tipo: ComponenteTipo, preparo: Preparo) => {
    setNovaOpcao((p) => {
      const jaExiste = p.componentes.some(
        (c) => c.tipo === tipo && c.preparoId === preparo.id,
      );

      if (jaExiste) {
        toast.info("Esse preparo já foi adicionado.", {
          description: "Escolha outro preparo ou altere a porcentagem.",
        });
        return p;
      }

      return {
        ...p,
        componentes: [
          ...p.componentes,
          {
            id: `${tipo}-${preparo.id}-${Date.now()}`,
            tipo,
            preparoId: preparo.id,
            preparoNome: preparo.nome,
            porcentagem: 0,
          },
        ],
      };
    });

    setErroSoma(false);
    setSheetOpen(null);
  };

  const handleRemoveComponente = (draftId: string) => {
    setNovaOpcao((p) => ({
      ...p,
      componentes: p.componentes.filter((c) => c.id !== draftId),
    }));
    setErroSoma(false);
  };

  const handleChangePorcentagem = (draftId: string, valor: number) => {
    const pct = Number.isFinite(valor) ? valor : 0;
    setNovaOpcao((p) => ({
      ...p,
      componentes: p.componentes.map((c) =>
        c.id === draftId ? { ...c, porcentagem: pct } : c,
      ),
    }));
    setErroSoma(false);
  };

  const handleSave = async () => {
    if (!novaOpcao.nome.trim()) return;

    if (novaOpcao.tipo === "MARMITA") {
      if (!novaOpcao.componentes.length) return;

      if (somaPct !== 100) {
        setErroSoma(true);
        return;
      }

      const temInvalido = novaOpcao.componentes.some(
        (c) => !c.preparoId || c.porcentagem < 0 || c.porcentagem > 100,
      );
      if (temInvalido) return;
    }

    const payload =
      novaOpcao.tipo === "MARMITA"
        ? {
            tipo: "MARMITA" as const,
            nome: novaOpcao.nome.trim(),
            categoria: novaOpcao.categoria,
            componentes: novaOpcao.componentes.map((c) => ({
              tipo: c.tipo,
              preparoId: c.preparoId!,
              porcentagem: Math.trunc(c.porcentagem || 0),
            })),
          }
        : {
            tipo: "OUTROS" as const,
            nome: novaOpcao.nome.trim(),
            categoria: null,
            componentes: [],
          };

    if (editandoId) await updateOpcao(editandoId, payload);
    else await createOpcao(payload);

    setDialogOpen(false);
    resetForm();
  };

  const codigoSistemaAtual = useMemo(() => {
    if (!editandoId) return "Automático";
    return formatCodigoOpcao(editandoId);
  }, [editandoId]);

  return (
    <div className="container mx-auto p-6">
      <Header
        title="Opções"
        subtitle="Gerencie as opções de marmitas e outros produtos"
        searchValue={busca}
        onSearchChange={setBusca}
      />

      <div className="flex items-center justify-end mb-6">
        <Button onClick={handleNew} disabled={saving}>
          <Plus className="mr-2 h-4 w-4" /> Criar Opção
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Opções Cadastradas</CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">
              Carregando opções...
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cód. Sistema</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {opcoesFiltradas.map((opcao) => (
                  <TableRow key={opcao.id}>
                    <TableCell>{formatCodigoOpcao(opcao.id)}</TableCell>
                    <TableCell>
                      {opcao.tipo === "MARMITA" ? "MARMITAS FIT" : "OUTROS"}
                    </TableCell>
                    <TableCell>{opcao.nome}</TableCell>
                    <TableCell>
                      {opcao.tipo === "MARMITA"
                        ? (opcao.categoria ?? "-").replace(
                            "LOW_CARB",
                            "LOW CARB",
                          )
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(opcao)}
                        disabled={saving}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteConfirm(opcao)}
                        disabled={saving}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {opcoesFiltradas.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-sm text-muted-foreground py-4"
                    >
                      Nenhuma opção cadastrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ALERT DIALOG EXCLUIR */}
      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir opção?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Você tem certeza que deseja excluir "${deleteTarget.nome}"? Essa ação não pode ser desfeita.`
                : "Você tem certeza que deseja excluir esta opção? Essa ação não pode ser desfeita."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={saving}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DIALOG CRIAR/EDITAR */}
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
              {editandoId ? "Editar Opção" : "Nova Opção"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <RadioGroup
                value={novaOpcao.tipo}
                onValueChange={(value) => handleChangeTipo(value as OpcaoTipo)}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="MARMITA" id="marmitas" />
                  <Label htmlFor="marmitas">MARMITAS FIT</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="OUTROS" id="outros" />
                  <Label htmlFor="outros">OUTROS</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={novaOpcao.nome}
                  onChange={(e) =>
                    setNovaOpcao((p) => ({ ...p, nome: e.target.value }))
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

            {novaOpcao.tipo === "MARMITA" && (
              <>
                <div className="space-y-2 border-t pt-4">
                  <Label>Categoria</Label>
                  <RadioGroup
                    value={novaOpcao.categoria ?? "FIT"}
                    onValueChange={(value) =>
                      setNovaOpcao((p) => ({
                        ...p,
                        categoria: value as OpcaoCategoria,
                      }))
                    }
                    className="flex flex-wrap gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="FIT" id="fit" />
                      <Label htmlFor="fit">FIT</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="LOW_CARB" id="lowcarb" />
                      <Label htmlFor="lowcarb">LOW CARB</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="VEGETARIANO" id="vegetariano" />
                      <Label htmlFor="vegetariano">VEGETARIANO</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="SOPA" id="sopa" />
                      <Label htmlFor="sopa">SOPA</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-4 border-t pt-4">
                  <div className="flex flex-wrap gap-2">
                    <Sheet
                      open={sheetOpen === "CARBOIDRATO"}
                      onOpenChange={(open) =>
                        setSheetOpen(open ? "CARBOIDRATO" : null)
                      }
                    >
                      <SheetTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={saving || loadingPreparos}
                        >
                          + Carboidrato
                        </Button>
                      </SheetTrigger>
                      <SheetContent>
                        <SheetHeader>
                          <SheetTitle>Adicionar Carboidrato</SheetTitle>
                        </SheetHeader>
                        <div className="py-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead className="text-right">Ação</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {preparosPorTipo.CARBOIDRATO.map((preparo) => (
                                <TableRow key={preparo.id}>
                                  <TableCell>{preparo.nome}</TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleAddComponente(
                                          "CARBOIDRATO",
                                          preparo,
                                        )
                                      }
                                    >
                                      Adicionar
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </SheetContent>
                    </Sheet>

                    <Sheet
                      open={sheetOpen === "PROTEINA"}
                      onOpenChange={(open) =>
                        setSheetOpen(open ? "PROTEINA" : null)
                      }
                    >
                      <SheetTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={saving || loadingPreparos}
                        >
                          + Proteína
                        </Button>
                      </SheetTrigger>
                      <SheetContent>
                        <SheetHeader>
                          <SheetTitle>Adicionar Proteína</SheetTitle>
                        </SheetHeader>
                        <div className="py-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead className="text-right">Ação</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {preparosPorTipo.PROTEINA.map((preparo) => (
                                <TableRow key={preparo.id}>
                                  <TableCell>{preparo.nome}</TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleAddComponente("PROTEINA", preparo)
                                      }
                                    >
                                      Adicionar
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </SheetContent>
                    </Sheet>

                    <Sheet
                      open={sheetOpen === "LEGUMES"}
                      onOpenChange={(open) =>
                        setSheetOpen(open ? "LEGUMES" : null)
                      }
                    >
                      <SheetTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={saving || loadingPreparos}
                        >
                          + Legumes
                        </Button>
                      </SheetTrigger>
                      <SheetContent>
                        <SheetHeader>
                          <SheetTitle>Adicionar Legumes</SheetTitle>
                        </SheetHeader>
                        <div className="py-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead className="text-right">Ação</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {preparosPorTipo.LEGUMES.map((preparo) => (
                                <TableRow key={preparo.id}>
                                  <TableCell>{preparo.nome}</TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleAddComponente("LEGUMES", preparo)
                                      }
                                    >
                                      Adicionar
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>

                  <div className="space-y-3">
                    <Label>Componentes</Label>

                    {novaOpcao.componentes.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Adicione 1 ou mais componentes (carboidrato, proteína e/ou
                        legumes) e defina as porcentagens.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {novaOpcao.componentes.map((c) => (
                          <div
                            key={c.id}
                            className="flex items-center gap-3 rounded-md border p-3"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {c.preparoNome || "-"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {c.tipo === "CARBOIDRATO"
                                  ? "Carboidrato"
                                  : c.tipo === "PROTEINA"
                                    ? "Proteína"
                                    : "Legumes"}
                              </p>
                            </div>

                            <div className="w-32">
                              <div className="flex items-center">
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={c.porcentagem ?? 0}
                                  onChange={(e) =>
                                    handleChangePorcentagem(
                                      c.id,
                                      Number(e.target.value),
                                    )
                                  }
                                />
                                <span className="ml-2">%</span>
                              </div>
                            </div>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveComponente(c.id)}
                              title="Remover componente"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {erroSoma && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        A soma das porcentagens deve ser igual a 100%.
                        Atualmente a soma é {somaPct}%.
                      </AlertDescription>
                    </Alert>
                  )}

                  {!erroSoma && novaOpcao.componentes.length > 0 && somaPct !== 100 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Soma atual: {somaPct}%. Ajuste até chegar em 100% para
                        salvar.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </>
            )}

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
    </div>
  );
}
