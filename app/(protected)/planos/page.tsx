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
import { Plus, Pencil, Trash, Search, MessageCircle, Check } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plano, NovoPlanoInput, usePlanos } from "@/hooks/usePlanos";
import { usePlanosCliente } from "@/hooks/usePlanosCliente";
import { useRegrasPersonalizadas } from "@/hooks/useRegrasPersonalizadas";
import { useTableSort } from "@/hooks/useTableSort";
import { SortableHead } from "@/components/ui/sorttable";

type PlanoItemForm = {
  id: string;
  tipo: "TAMANHO" | "PERSONALIZADO";
  tamanhoId: string;
  pesoPersonalizadoGramas: string;
  unidades: string;
};

type PlanoForm = {
  nome: string;
  entregasInclusas: string;
  ativo: boolean;
  itens: PlanoItemForm[];
};

function toNumber(value: string, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function moneyBr(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function novaLinhaPlano(): PlanoItemForm {
  return {
    id: uid(),
    tipo: "TAMANHO",
    tamanhoId: "",
    pesoPersonalizadoGramas: "",
    unidades: "10",
  };
}

function valorPlanoPorQuantidade(tamanho: any, quantidade: number) {
  const qtd = Math.max(1, Math.floor(Number(quantidade || 1)));
  if (qtd >= 40 && tamanho.valor40 != null) return Number(tamanho.valor40 || 0);
  if (qtd >= 20 && tamanho.valor20 != null) return Number(tamanho.valor20 || 0);
  if (qtd >= 10 && tamanho.valor10 != null) return Number(tamanho.valor10 || 0);
  return Number(tamanho.valorUnitario || 0) * qtd;
}

export default function PlanosPage() {
  const { planos, tamanhos, loading, saving, createPlano, updatePlano, deletePlano } =
    usePlanos();
  const { regras } = useRegrasPersonalizadas();

  const { listPlanosNaoPagos, marcarPlanoComoPago } = usePlanosCliente();

  const [busca, setBusca] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [excluindoId, setExcluindoId] = useState<number | null>(null);
  
  const [planosNaoPagos, setPlanosNaoPagos] = useState<any[]>([]);
  const [loadingNaoPagos, setLoadingNaoPagos] = useState(false);

  // Load unpaid plans
  const loadNaoPagos = async () => {
    setLoadingNaoPagos(true);
    try {
      const data = await listPlanosNaoPagos();
      setPlanosNaoPagos(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingNaoPagos(false);
    }
  };

  const [form, setForm] = useState<PlanoForm>({
    nome: "",
    entregasInclusas: "0",
    ativo: true,
    itens: [novaLinhaPlano()],
  });

  const resetForm = () => {
    setForm({
      nome: "",
      entregasInclusas: "0",
      ativo: true,
      itens: [novaLinhaPlano()],
    });
    setEditandoId(null);
  };

  const itensCalculados = useMemo(() => {
    const regrasPeso = regras
      .filter((r) => r.tipo === "PESO_TOTAL")
      .sort((a, b) => Number(a.limite) - Number(b.limite));

    return form.itens.map((item) => {
      const unidades = Math.max(1, Math.floor(toNumber(item.unidades, 1)));
      if (item.tipo === "TAMANHO") {
        const tamanho = tamanhos.find((t) => String(t.id) === String(item.tamanhoId));
        const valorTotal = tamanho ? valorPlanoPorQuantidade(tamanho, unidades) : 0;
        return {
          ...item,
          unidades,
          label: tamanho?.pesagemGramas ? `${tamanho.pesagemGramas}g` : "Tamanho",
          valorTotal,
          valorUnitario: unidades > 0 ? valorTotal / unidades : 0,
          valido: !!tamanho,
        };
      }

      const peso = Math.max(0, Math.floor(toNumber(item.pesoPersonalizadoGramas, 0)));
      const regra = regrasPeso.find((r) => peso <= Number(r.limite)) || regrasPeso[regrasPeso.length - 1];
      const valorUnitario = peso > 0 && regra ? Number(regra.preco || 0) : 0;
      return {
        ...item,
        unidades,
        label: peso > 0 ? `${peso}g personalizada` : "Personalizada",
        valorTotal: valorUnitario * unidades,
        valorUnitario,
        valido: peso > 0 && valorUnitario > 0,
      };
    });
  }, [form.itens, regras, tamanhos]);

  const valorTotalPlano = itensCalculados.reduce((acc, item) => acc + Number(item.valorTotal || 0), 0);
  const unidadesTotalPlano = itensCalculados.reduce((acc, item) => acc + Number(item.unidades || 0), 0);

  const planosFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return planos;

    return planos.filter((p) =>
      [p.id, p.nome, p.tamanho?.pesagemGramas, p.unidades, p.entregasInclusas, p.entregas, p.valor]
        .some((v) => String(v ?? "").toLowerCase().includes(q)),
    );
  }, [planos, busca]);

  const { sort, onSort, sortedRows } = useTableSort(planosFiltrados);

  const handleNew = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (plano: Plano) => {
    const itens =
      plano.itens && plano.itens.length > 0
        ? plano.itens.map((item) => ({
            id: item.id ? String(item.id) : uid(),
            tipo: item.pesoPersonalizadoGramas ? "PERSONALIZADO" as const : "TAMANHO" as const,
            tamanhoId: item.tamanhoId ? String(item.tamanhoId) : "",
            pesoPersonalizadoGramas: item.pesoPersonalizadoGramas ? String(item.pesoPersonalizadoGramas) : "",
            unidades: String(item.unidades || 1),
          }))
        : [
            {
              id: uid(),
              tipo: "TAMANHO" as const,
              tamanhoId: plano.tamanhoId ? String(plano.tamanhoId) : "",
              pesoPersonalizadoGramas: "",
              unidades: String(plano.unidades || 1),
            },
          ];

    setForm({
      nome: plano.nome,
      entregasInclusas: String(plano.entregasInclusas ?? plano.entregas ?? 0),
      ativo: !!plano.ativo,
      itens,
    });
    setEditandoId(plano.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const nome = String(form.nome || "").trim();
    if (!nome) return;
    if (itensCalculados.some((item) => !item.valido)) return;
    const primeiroTamanho = form.itens.find((item) => item.tipo === "TAMANHO" && item.tamanhoId);

    const payload: NovoPlanoInput = {
      nome,
      tamanhoId: primeiroTamanho ? toNumber(primeiroTamanho.tamanhoId) : null,
      unidades: unidadesTotalPlano,
      entregasInclusas: toNumber(form.entregasInclusas),
      valor: valorTotalPlano,
      ativo: !!form.ativo,
      itens: form.itens.map((item) => ({
        tamanhoId: item.tipo === "TAMANHO" ? toNumber(item.tamanhoId) : null,
        pesoPersonalizadoGramas:
          item.tipo === "PERSONALIZADO" ? toNumber(item.pesoPersonalizadoGramas) : null,
        unidades: toNumber(item.unidades, 1),
      })),
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
        subtitle="Crie planos para vincular aos clientes e controle os planos não pagos"
      />

      <Tabs defaultValue="catalogo" onValueChange={(val) => {
        if (val === "naopagos") loadNaoPagos();
      }}>
        <TabsList className="mb-4">
          <TabsTrigger value="catalogo">Catálogo de Planos</TabsTrigger>
          <TabsTrigger value="naopagos">Planos Não Pagos</TabsTrigger>
        </TabsList>

        <TabsContent value="catalogo" className="space-y-6">
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
                  <SortableHead label="ID" field="id" sort={sort} onSort={onSort} />
                  <SortableHead label="Nome" field="nome" sort={sort} onSort={onSort} />
                  <SortableHead label="Composições" field="tamanho.pesagemGramas" sort={sort} onSort={onSort} />
                  <SortableHead label="Unidades" field="unidades" sort={sort} onSort={onSort} />
                  <SortableHead label="Entregas" field="entregasInclusas" sort={sort} onSort={onSort} />
                  <SortableHead label="Valor" field="valor" sort={sort} onSort={onSort} />
                  <SortableHead label="Ativo" field="ativo" sort={sort} onSort={onSort} />
                  <TableHead className="text-right text-gray-700">Ações</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {sortedRows.map((plano) => (
                  <TableRow
                    key={plano.id}
                    className="hover:bg-gray-50 border-b border-gray-100"
                  >
                    <TableCell className="font-medium text-gray-700">
                      {plano.id}
                    </TableCell>

                    <TableCell className="text-gray-700">{plano.nome}</TableCell>

                    <TableCell className="text-gray-700">
                      {plano.itens && plano.itens.length > 0 ? (
                        <div className="space-y-1">
                          {plano.itens.map((item) => {
                            const label = item.pesoPersonalizadoGramas
                              ? `${item.pesoPersonalizadoGramas}g personalizada`
                              : item.tamanho?.pesagemGramas
                                ? `${item.tamanho.pesagemGramas}g`
                                : item.tamanhoId
                                  ? `#${item.tamanhoId}`
                                  : "Sem tamanho";
                            return (
                              <div key={item.id || `${label}-${item.unidades}`} className="text-xs">
                                {Number(item.unidades || 0)}x {label}
                              </div>
                            );
                          })}
                        </div>
                      ) : plano.tamanho?.pesagemGramas ? (
                        `${plano.tamanho.pesagemGramas}g`
                      ) : (
                        `#${plano.tamanhoId}`
                      )}
                    </TableCell>

                    <TableCell className="text-gray-700">
                      {Number(plano.unidades || 0)}
                    </TableCell>

                    <TableCell className="text-gray-700">
                      {Number(plano.entregasInclusas ?? plano.entregas ?? 0)}
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
      </TabsContent>

      <TabsContent value="naopagos">
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-800">Planos com Pagamento Pendente</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingNaoPagos ? (
              <p className="text-sm text-gray-500">Carregando...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead>Cliente</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Data Vínculo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {planosNaoPagos.map((p) => {
                    const nomePlano = p.plano?.nome || "Plano";
                    const gramas = p.plano?.tamanho?.pesagemGramas ? ` - ${p.plano.tamanho.pesagemGramas}g` : "";
                    const telefone = p.cliente?.telefone || "";
                    const telefoneLimpo = telefone.replace(/\D/g, "");
                    const qtdTaxas = Number(p.taxasEntregaCompradas || 0);
                    const valorTaxaUnit = Number(p.valorTaxaEntrega || 0);
                    const valorTaxas = qtdTaxas * valorTaxaUnit;
                    const valorPlano = Number(p.plano?.valor || 0);
                    const valorTotal = valorPlano + valorTaxas;
                    const msgCobranca = `Olá ${p.cliente?.nome?.split(' ')[0]}! Tudo bem? O pagamento do seu plano ${nomePlano}${gramas}${valorTotal > 0 ? ` no valor de ${moneyBr(valorTotal)}` : ""} ainda não foi identificado. Assim que realizar o pagamento, por favor envie o comprovante por aqui. Obrigado(a)!`;
                    const msg = `Olá ${p.cliente?.nome?.split(' ')[0]}! Tudo bem? Estou entrando em contato para lembrar sobre o pagamento do seu plano ${nomePlano}${gramas} que está pendente. Por favor, assim que realizar o pagamento, nos envie o comprovante por aqui. Obrigado(a)!`;

                    return (
                      <TableRow key={p.id} className="hover:bg-gray-50 border-b border-gray-100">
                        <TableCell className="font-medium">{p.cliente?.nome}</TableCell>
                        <TableCell>{telefone}</TableCell>
                        <TableCell>
                          <div>{nomePlano}{gramas}</div>
                          {valorTotal > 0 && (
                            <div className="text-xs font-bold text-emerald-700">
                              Total: {moneyBr(valorTotal)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{p.createdAt ? new Date(p.createdAt).toLocaleDateString("pt-BR") : ""}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 mr-2"
                            title="Cobrar no WhatsApp"
                            disabled={!telefoneLimpo}
                            onClick={() => {
                              window.open(`https://wa.me/55${telefoneLimpo}?text=${encodeURIComponent(msgCobranca)}`, "_blank");
                            }}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Marcar como Pago"
                            onClick={async () => {
                              await marcarPlanoComoPago(p.id);
                              await loadNaoPagos();
                            }}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {planosNaoPagos.length === 0 && !loadingNaoPagos && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-gray-500 py-4">
                        Nenhum plano com pagamento pendente.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      </Tabs>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="bg-white max-w-4xl max-h-[90vh] overflow-y-auto">
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

            <div className="space-y-3 rounded-md border border-gray-200 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label className="text-gray-700">Tamanhos e quantidades</Label>
                  <p className="text-xs text-gray-500">
                    O valor é calculado automaticamente pela tabela de preços.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      itens: [...p.itens, novaLinhaPlano()],
                    }))
                  }
                  disabled={saving}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Adicionar
                </Button>
              </div>

              <div className="space-y-2">
                {form.itens.map((item, index) => {
                  const calculado = itensCalculados[index];
                  return (
                    <div key={item.id} className="rounded-md border border-gray-100 bg-gray-50 p-3">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-[140px_minmax(0,1fr)_120px_36px] md:items-end">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-gray-500">Tipo</Label>
                          <Select
                            value={item.tipo}
                            onValueChange={(value: "TAMANHO" | "PERSONALIZADO") =>
                              setForm((p) => ({
                                ...p,
                                itens: p.itens.map((linha) =>
                                  linha.id === item.id
                                    ? {
                                        ...linha,
                                        tipo: value,
                                        tamanhoId: "",
                                        pesoPersonalizadoGramas: "",
                                      }
                                    : linha,
                                ),
                              }))
                            }
                            disabled={saving}
                          >
                            <SelectTrigger className="bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="TAMANHO">Sistema</SelectItem>
                              <SelectItem value="PERSONALIZADO">Personalizada</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs text-gray-500">
                            {item.tipo === "PERSONALIZADO" ? "Peso exato" : "Tamanho"}
                          </Label>
                          {item.tipo === "PERSONALIZADO" ? (
                            <Input
                              type="number"
                              min={1}
                              step={1}
                              value={item.pesoPersonalizadoGramas}
                              onChange={(e) =>
                                setForm((p) => ({
                                  ...p,
                                  itens: p.itens.map((linha) =>
                                    linha.id === item.id
                                      ? { ...linha, pesoPersonalizadoGramas: e.target.value }
                                      : linha,
                                  ),
                                }))
                              }
                              className="bg-white"
                              disabled={saving}
                              placeholder="Ex: 425"
                            />
                          ) : (
                            <Select
                              value={item.tamanhoId}
                              onValueChange={(value) =>
                                setForm((p) => ({
                                  ...p,
                                  itens: p.itens.map((linha) =>
                                    linha.id === item.id ? { ...linha, tamanhoId: value } : linha,
                                  ),
                                }))
                              }
                              disabled={saving}
                            >
                              <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                {tamanhos.map((t) => (
                                  <SelectItem key={t.id} value={String(t.id)}>
                                    {t.pesagemGramas}g
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs text-gray-500">Quantidade</Label>
                          <Input
                            type="number"
                            min={1}
                            step={1}
                            value={item.unidades}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                itens: p.itens.map((linha) =>
                                  linha.id === item.id ? { ...linha, unidades: e.target.value } : linha,
                                ),
                              }))
                            }
                            className="bg-white"
                            disabled={saving}
                          />
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-gray-500 hover:bg-red-50 hover:text-red-600"
                          onClick={() =>
                            setForm((p) => ({
                              ...p,
                              itens: p.itens.filter((linha) => linha.id !== item.id),
                            }))
                          }
                          disabled={saving || form.itens.length === 1}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="mt-2 flex items-center justify-between rounded-sm bg-white px-3 py-2 text-sm">
                        <span className="text-gray-500">
                          {calculado?.valido
                            ? `${calculado.unidades}x ${calculado.label} a ${moneyBr(Number(calculado.valorUnitario || 0))}/un.`
                            : "Complete esta combinação"}
                        </span>
                        <span className="font-semibold text-gray-800">
                          {moneyBr(Number(calculado?.valorTotal || 0))}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

              <div className="rounded-md border border-emerald-100 bg-emerald-50 p-3">
                <div className="text-xs font-semibold uppercase text-emerald-700">
                  Total automático
                </div>
                <div className="mt-1 text-2xl font-bold text-emerald-900">
                  {moneyBr(valorTotalPlano)}
                </div>
                <div className="text-xs text-emerald-700">
                  {unidadesTotalPlano} marmitas no plano
                </div>
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
                disabled={saving || itensCalculados.some((item) => !item.valido)}
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
