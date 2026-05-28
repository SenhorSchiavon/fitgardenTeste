"use client";

import { useMemo, useState } from "react";
import { Layers, Pencil, Plus, Search, Trash, Wheat } from "lucide-react";
import { Header } from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { SortableHead } from "@/components/ui/sorttable";
import { useIngredientes } from "@/hooks/useIngredientes";
import { useMedidas } from "@/hooks/useMedidas";
import {
  Medida,
  Preparo,
  PreparoComponenteTipo,
  PreparoTipo,
  usePreparos,
} from "@/hooks/usePreparos";
import { useTableSort } from "@/hooks/useTableSort";

type ComponenteEmEdicao = {
  tipo: PreparoComponenteTipo;
  ingredienteId: number | null;
  ingredienteNome: string | null;
  preparoInsumoId: number | null;
  preparoInsumoNome: string | null;
  preparoInsumoTipo: PreparoTipo | null;
  quantidade: number;
  medida: Medida;
  custo: number;
  usarCruComoReferencia: boolean;
};

type NovoComponenteState = Omit<ComponenteEmEdicao, "medida" | "custo"> & {
  medida: Medida | null;
  custoUnitario: number;
};

const tiposPreparo: Array<{ value: PreparoTipo; label: string }> = [
  { value: "CARBOIDRATO", label: "Carboidrato" },
  { value: "PROTEINA", label: "Proteina" },
  { value: "LEGUMES", label: "Legumes" },
  { value: "FEIJAO", label: "Feijao" },
];

const componenteVazio: NovoComponenteState = {
  tipo: "INGREDIENTE" as PreparoComponenteTipo,
  ingredienteId: null,
  ingredienteNome: null,
  preparoInsumoId: null,
  preparoInsumoNome: null,
  preparoInsumoTipo: null,
  quantidade: 0,
  medida: null as Medida | null,
  custoUnitario: 0,
  usarCruComoReferencia: false,
};

export default function PreparosPage() {
  const {
    preparos,
    loading: loadingPreparos,
    saving,
    createPreparo,
    updatePreparo,
    deletePreparo,
  } = usePreparos();
  const { ingredientes, loading: loadingIngredientes } = useIngredientes();
  const { medidas, criarMedida } = useMedidas();

  const [busca, setBusca] = useState("");
  const [buscaComponente, setBuscaComponente] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [componentDialogOpen, setComponentDialogOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [novaMedidaNome, setNovaMedidaNome] = useState("");

  const [novoPreparo, setNovoPreparo] = useState<{
    nome: string;
    tipo: PreparoTipo;
    medidaId: string;
    componentes: ComponenteEmEdicao[];
  }>({
    nome: "",
    tipo: "CARBOIDRATO",
    medidaId: "",
    componentes: [],
  });

  const [novoComponente, setNovoComponente] = useState(componenteVazio);

  const preparosFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return preparos;

    return preparos.filter((preparo) =>
      [preparo.codigoSistema, preparo.nome, preparo.tipo].some((value) =>
        String(value).toLowerCase().includes(q),
      ),
    );
  }, [busca, preparos]);

  const { sort, onSort, sortedRows } = useTableSort(preparosFiltrados);

  const preparosDisponiveisComoInsumo = useMemo(
    () => preparos.filter((preparo) => preparo.id !== editandoId),
    [editandoId, preparos],
  );

  const componentesFiltrados = useMemo(() => {
    const q = buscaComponente.trim().toLowerCase();

    if (novoComponente.tipo === "PREPARO") {
      if (!q) return preparosDisponiveisComoInsumo;
      return preparosDisponiveisComoInsumo.filter((preparo) =>
        [preparo.codigoSistema, preparo.nome, preparo.tipo].some((value) =>
          String(value).toLowerCase().includes(q),
        ),
      );
    }

    if (!q) return ingredientes;
    return ingredientes.filter((ingrediente) =>
      [ingrediente.codigoSistema, ingrediente.nome, ingrediente.categoriaDescricao].some((value) =>
        String(value).toLowerCase().includes(q),
      ),
    );
  }, [buscaComponente, ingredientes, novoComponente.tipo, preparosDisponiveisComoInsumo]);

  const codigoSistemaAtual = useMemo(() => {
    if (!editandoId) return "Automatico";
    return preparos.find((p) => p.id === editandoId)?.codigoSistema ?? `PREP${String(editandoId).padStart(3, "0")}`;
  }, [editandoId, preparos]);

  const custoTotal = useMemo(
    () => novoPreparo.componentes.reduce((total, item) => total + item.custo, 0),
    [novoPreparo.componentes],
  );

  const isLoading = loadingPreparos || loadingIngredientes;

  const resetComponente = (tipo: PreparoComponenteTipo = "INGREDIENTE") => {
    setBuscaComponente("");
    setNovoComponente({ ...componenteVazio, tipo });
  };

  const resetForm = () => {
    setNovoPreparo({
      nome: "",
      tipo: "CARBOIDRATO",
      medidaId: "",
      componentes: [],
    });
    resetComponente();
    setEditandoId(null);
  };

  const handleNew = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (preparo: Preparo) => {
    setNovoPreparo({
      nome: preparo.nome,
      tipo: preparo.tipo,
      medidaId: String(preparo.medida?.id ?? ""),
      componentes: preparo.fichaTecnica.map((item) => ({
        tipo: item.tipo,
        ingredienteId: item.ingredienteId,
        ingredienteNome: item.ingredienteNome,
        preparoInsumoId: item.preparoInsumoId,
        preparoInsumoNome: item.preparoInsumoNome,
        preparoInsumoTipo: item.preparoInsumoTipo,
        quantidade: item.quantidade,
        medida: item.medida,
        custo: item.custo,
        usarCruComoReferencia: item.usarCruComoReferencia,
      })),
    });
    setEditandoId(preparo.id);
    setDialogOpen(true);
  };

  const componenteKey = (item: Pick<ComponenteEmEdicao, "tipo" | "ingredienteId" | "preparoInsumoId">) =>
    item.tipo === "PREPARO" ? `prep-${item.preparoInsumoId}` : `ing-${item.ingredienteId}`;

  const nomeComponente = (item: ComponenteEmEdicao) =>
    item.tipo === "PREPARO" ? item.preparoInsumoNome ?? "" : item.ingredienteNome ?? "";

  const selecionarIngrediente = (id: number) => {
    const ingrediente = ingredientes.find((item) => item.id === id);
    if (!ingrediente) return;

    setNovoComponente({
      tipo: "INGREDIENTE",
      ingredienteId: ingrediente.id,
      ingredienteNome: ingrediente.nome,
      preparoInsumoId: null,
      preparoInsumoNome: null,
      preparoInsumoTipo: null,
      quantidade: 0,
      medida: ingrediente.medida,
      custoUnitario: ingrediente.precoCusto,
      usarCruComoReferencia: false,
    });
  };

  const selecionarPreparoInsumo = (id: number) => {
    const preparo = preparosDisponiveisComoInsumo.find((item) => item.id === id);
    if (!preparo) return;

    setNovoComponente({
      tipo: "PREPARO",
      ingredienteId: null,
      ingredienteNome: null,
      preparoInsumoId: preparo.id,
      preparoInsumoNome: preparo.nome,
      preparoInsumoTipo: preparo.tipo,
      quantidade: 0,
      medida: preparo.medida,
      custoUnitario: preparo.custoTotal,
      usarCruComoReferencia: false,
    });
  };

  const handleAddComponente = () => {
    if (!novoComponente.medida || !novoComponente.quantidade || novoComponente.quantidade <= 0) return;

    const item: ComponenteEmEdicao = {
      tipo: novoComponente.tipo,
      ingredienteId: novoComponente.ingredienteId,
      ingredienteNome: novoComponente.ingredienteNome,
      preparoInsumoId: novoComponente.preparoInsumoId,
      preparoInsumoNome: novoComponente.preparoInsumoNome,
      preparoInsumoTipo: novoComponente.preparoInsumoTipo,
      quantidade: novoComponente.quantidade,
      medida: novoComponente.medida,
      custo: novoComponente.quantidade * novoComponente.custoUnitario,
      usarCruComoReferencia: novoComponente.usarCruComoReferencia,
    };

    setNovoPreparo((current) => {
      const key = componenteKey(item);
      const exists = current.componentes.some((componente) => componenteKey(componente) === key);

      return {
        ...current,
        componentes: exists
          ? current.componentes.map((componente) => (componenteKey(componente) === key ? item : componente))
          : [...current.componentes, item],
      };
    });

    resetComponente(novoComponente.tipo);
    setComponentDialogOpen(false);
  };

  const handleEditComponente = (item: ComponenteEmEdicao) => {
    setNovoComponente({
      tipo: item.tipo,
      ingredienteId: item.ingredienteId,
      ingredienteNome: item.ingredienteNome,
      preparoInsumoId: item.preparoInsumoId,
      preparoInsumoNome: item.preparoInsumoNome,
      preparoInsumoTipo: item.preparoInsumoTipo,
      quantidade: item.quantidade,
      medida: item.medida,
      custoUnitario: item.quantidade > 0 ? item.custo / item.quantidade : 0,
      usarCruComoReferencia: item.usarCruComoReferencia,
    });
    setComponentDialogOpen(true);
  };

  const handleRemoveComponente = (item: ComponenteEmEdicao) => {
    const key = componenteKey(item);
    setNovoPreparo((current) => ({
      ...current,
      componentes: current.componentes.filter((componente) => componenteKey(componente) !== key),
    }));
  };

  const handleSave = async () => {
    if (!novoPreparo.nome.trim() || !novoPreparo.medidaId) return;

    const payload = {
      nome: novoPreparo.nome.trim(),
      tipo: novoPreparo.tipo,
      medidaId: Number(novoPreparo.medidaId),
      fichaTecnica: novoPreparo.componentes.map((item) => ({
        tipo: item.tipo,
        ingredienteId: item.ingredienteId,
        preparoInsumoId: item.preparoInsumoId,
        quantidade: item.quantidade,
        usarCruComoReferencia: item.usarCruComoReferencia,
      })),
    };

    try {
      if (editandoId) {
        await updatePreparo(editandoId, payload);
      } else {
        await createPreparo(payload);
      }

      setDialogOpen(false);
      resetForm();
    } catch {
      // O hook mostra o toast.
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      await deletePreparo(deleteId);
    } finally {
      setDeleteOpen(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Header
        title="Preparos"
        subtitle="Gerencie fichas tecnicas com ingredientes e subpreparos"
        searchValue={busca}
        onSearchChange={setBusca}
      />

      <div className="mb-6 flex items-center justify-end">
        <Button onClick={handleNew} disabled={saving}>
          <Plus className="mr-2 h-4 w-4" /> Criar Preparo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Preparos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando preparos...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead label="Cod. Sistema" field="codigoSistema" sort={sort} onSort={onSort} />
                  <SortableHead label="Nome" field="nome" sort={sort} onSort={onSort} />
                  <SortableHead label="Tipo" field="tipo" sort={sort} onSort={onSort} />
                  <SortableHead label="Custo" field="custoTotal" sort={sort} onSort={onSort} />
                  <TableHead>Ficha</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRows.map((preparo) => (
                  <TableRow key={preparo.id}>
                    <TableCell>{preparo.codigoSistema}</TableCell>
                    <TableCell className="font-medium">{preparo.nome}</TableCell>
                    <TableCell>{preparo.tipo}</TableCell>
                    <TableCell>R$ {preparo.custoTotal.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline">{preparo.fichaTecnica.length} itens</Badge>
                        {preparo.fichaTecnica.some((item) => item.tipo === "PREPARO") && (
                          <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50">subpreparo</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(preparo)} disabled={saving}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={saving}
                        onClick={() => {
                          setDeleteId(preparo.id);
                          setDeleteOpen(true);
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {preparosFiltrados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-4 text-center text-sm text-muted-foreground">
                      Nenhum preparo cadastrado.
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
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editandoId ? "Editar Preparo" : "Novo Preparo"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={novoPreparo.nome}
                  onChange={(event) => setNovoPreparo((current) => ({ ...current, nome: event.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="codigo">Cod. Sistema</Label>
                <Input id="codigo" value={codigoSistemaAtual} disabled />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_1.4fr]">
              <div className="space-y-2">
                <Label>Medida do preparo</Label>
                <div className="flex gap-2">
                  <Select
                    value={novoPreparo.medidaId}
                    onValueChange={(value) => setNovoPreparo((current) => ({ ...current, medidaId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {medidas.map((medida) => (
                        <SelectItem key={medida.id} value={String(medida.id)}>
                          {medida.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex min-w-40 items-center gap-1 rounded-md border bg-gray-50 px-2">
                    <Input
                      placeholder="Nova..."
                      className="h-8 w-20 border-none bg-transparent shadow-none"
                      value={novaMedidaNome}
                      onChange={(event) => setNovaMedidaNome(event.target.value)}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={async () => {
                        if (!novaMedidaNome.trim()) return;
                        const medida = await criarMedida(novaMedidaNome.trim());
                        setNovoPreparo((current) => ({ ...current, medidaId: String(medida.id) }));
                        setNovaMedidaNome("");
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipo do preparo</Label>
                <RadioGroup
                  value={novoPreparo.tipo}
                  onValueChange={(value) => setNovoPreparo((current) => ({ ...current, tipo: value as PreparoTipo }))}
                  className="grid gap-2 sm:grid-cols-4"
                >
                  {tiposPreparo.map((tipo) => (
                    <Label
                      key={tipo.value}
                      htmlFor={tipo.value}
                      className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm"
                    >
                      <RadioGroupItem value={tipo.value} id={tipo.value} />
                      {tipo.label}
                    </Label>
                  ))}
                </RadioGroup>
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Label>Ficha tecnica</Label>
                  <p className="text-sm text-muted-foreground">
                    Misture ingredientes diretos e preparos prontos usados como insumo.
                  </p>
                </div>

                <Dialog
                  open={componentDialogOpen}
                  onOpenChange={(open) => {
                    setComponentDialogOpen(open);
                    if (!open) resetComponente(novoComponente.tipo);
                  }}
                >
                  <DialogTrigger asChild>
                    <Button size="sm" disabled={saving || loadingIngredientes}>
                      <Plus className="mr-2 h-4 w-4" /> Adicionar item
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Item da ficha tecnica</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label>Tipo do item</Label>
                        <RadioGroup
                          value={novoComponente.tipo}
                          onValueChange={(value) => resetComponente(value as PreparoComponenteTipo)}
                          className="grid gap-2 sm:grid-cols-2"
                        >
                          <Label
                            htmlFor="item-ingrediente"
                            className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm"
                          >
                            <RadioGroupItem value="INGREDIENTE" id="item-ingrediente" />
                            <Wheat className="h-4 w-4" /> Ingrediente
                          </Label>
                          <Label
                            htmlFor="item-preparo"
                            className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm"
                          >
                            <RadioGroupItem value="PREPARO" id="item-preparo" />
                            <Layers className="h-4 w-4" /> Preparo
                          </Label>
                        </RadioGroup>
                      </div>

                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder={novoComponente.tipo === "PREPARO" ? "Buscar preparo..." : "Buscar ingrediente..."}
                          className="pl-8"
                          value={buscaComponente}
                          onChange={(event) => setBuscaComponente(event.target.value)}
                        />
                      </div>

                      <ScrollArea className="h-[34vh] pr-2">
                        <Table>
                          <TableHeader className="sticky top-0 z-10 bg-background">
                            <TableRow>
                              <TableHead>Nome</TableHead>
                              <TableHead>Medida</TableHead>
                              <TableHead>Custo</TableHead>
                              <TableHead className="text-right">Acao</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {novoComponente.tipo === "PREPARO"
                              ? (componentesFiltrados as Preparo[]).map((preparo) => (
                                  <TableRow key={preparo.id}>
                                    <TableCell>
                                      <div className="font-medium">{preparo.nome}</div>
                                      <div className="text-xs text-muted-foreground">{preparo.tipo}</div>
                                    </TableCell>
                                    <TableCell>{preparo.medida?.nome}</TableCell>
                                    <TableCell>R$ {preparo.custoTotal.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">
                                      <Button size="sm" variant="outline" onClick={() => selecionarPreparoInsumo(preparo.id)}>
                                        Selecionar
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))
                              : componentesFiltrados.map((ingrediente: any) => (
                                  <TableRow key={ingrediente.id}>
                                    <TableCell>
                                      <div className="font-medium">{ingrediente.nome}</div>
                                      <div className="text-xs text-muted-foreground">{ingrediente.categoriaDescricao}</div>
                                    </TableCell>
                                    <TableCell>{ingrediente.medida?.nome}</TableCell>
                                    <TableCell>R$ {ingrediente.precoCusto.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">
                                      <Button size="sm" variant="outline" onClick={() => selecionarIngrediente(ingrediente.id)}>
                                        Selecionar
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>

                      {novoComponente.medida && (
                        <div className="space-y-4 border-t pt-4">
                          <div>
                            <p className="font-medium">
                              {novoComponente.tipo === "PREPARO"
                                ? novoComponente.preparoInsumoNome
                                : novoComponente.ingredienteNome}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Custo calculado: R$ {(novoComponente.quantidade * novoComponente.custoUnitario).toFixed(2)}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="quantidade">Quantidade ({novoComponente.medida.nome})</Label>
                            <Input
                              id="quantidade"
                              type="number"
                              step="0.001"
                              value={novoComponente.quantidade || ""}
                              onChange={(event) =>
                                setNovoComponente((current) => ({
                                  ...current,
                                  quantidade: Number.parseFloat(event.target.value || "0"),
                                }))
                              }
                            />
                          </div>

                          <Label className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={novoComponente.usarCruComoReferencia}
                              onCheckedChange={(checked) =>
                                setNovoComponente((current) => ({
                                  ...current,
                                  usarCruComoReferencia: !!checked,
                                }))
                              }
                            />
                            Usar como referencia no relatorio de cru
                          </Label>

                          <Button className="w-full" onClick={handleAddComponente}>
                            Adicionar a ficha tecnica
                          </Button>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Qtde.</TableHead>
                    <TableHead>Medida</TableHead>
                    <TableHead>Ref. cru</TableHead>
                    <TableHead>Custo</TableHead>
                    <TableHead className="text-right">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {novoPreparo.componentes.map((item) => (
                    <TableRow key={componenteKey(item)}>
                      <TableCell>
                        <Badge variant={item.tipo === "PREPARO" ? "default" : "outline"}>
                          {item.tipo === "PREPARO" ? "Preparo" : "Ingrediente"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{nomeComponente(item)}</div>
                        {item.tipo === "PREPARO" && (
                          <div className="text-xs text-muted-foreground">{item.preparoInsumoTipo}</div>
                        )}
                      </TableCell>
                      <TableCell>{item.quantidade}</TableCell>
                      <TableCell>{item.medida?.nome}</TableCell>
                      <TableCell>{item.usarCruComoReferencia ? "Sim" : "Nao"}</TableCell>
                      <TableCell>R$ {item.custo.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEditComponente(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveComponente(item)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {novoPreparo.componentes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-4 text-center text-sm text-muted-foreground">
                        Nenhum item adicionado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <div className="flex justify-end pt-2">
                <div className="text-right">
                  <p className="text-sm font-medium">Custo total</p>
                  <p className="text-lg font-bold">R$ {custoTotal.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
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

      <AlertDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setDeleteId(null);
        }}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-800">Excluir preparo?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Se ele estiver sendo usado como subpreparo em outra ficha tecnica, o sistema vai bloquear a exclusao.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 text-white hover:bg-red-700" disabled={saving}>
              {saving ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
