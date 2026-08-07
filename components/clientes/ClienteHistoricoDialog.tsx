"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Pencil } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useClienteHistorico } from "@/hooks/useClienteHistorico";
import { apiFetch } from "@/hooks/api";

type Aba = "historico" | "planos";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api";

type ClienteMin = {
    id: number | string;
    nome?: string | null;
};

function formatDate(value?: string | null) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("pt-BR");
}

function moneyBr(value?: number | null) {
    return Number(value || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}

export function ClienteHistoricoDialog({
    open,
    onOpenChange,
    cliente,
    defaultTab = "historico",
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    cliente: ClienteMin | null;
    defaultTab?: Aba;
    saving?: boolean;
}) {
    const [aba, setAba] = useState<Aba>(defaultTab);
    const { data, loading, error, getHistorico } = useClienteHistorico();
    const [page, setPage] = useState(1);
    const [planoEmEdicao, setPlanoEmEdicao] = useState<number | null>(null);
    const [usosEmEdicao, setUsosEmEdicao] = useState<{ unidades: number; entregas: number; itens: Record<number, number> }>({ unidades: 0, entregas: 0, itens: {} });
    const [salvandoUsos, setSalvandoUsos] = useState(false);
    const [erroUsos, setErroUsos] = useState("");
    const pageSize = 10;

    useEffect(() => {
        if (!open) return;
        setAba(defaultTab);
        setPage(1);
    }, [open, defaultTab]);

    useEffect(() => {
        if (!open || !cliente?.id) return;
        getHistorico({ clienteId: cliente.id, page, pageSize });
    }, [open, cliente?.id, page, pageSize, getHistorico]);

    const planos = data?.planos || [];

    const iniciarEdicaoUsos = (plano: (typeof planos)[number]) => {
        setPlanoEmEdicao(plano.id);
        setUsosEmEdicao({
            unidades: Math.max(0, plano.quantidade - plano.saldoUnidades),
            entregas: Math.max(0, plano.taxasEntregaCompradas - plano.saldoEntregas),
            itens: Object.fromEntries((plano.itens || []).map((item) => [item.id, Math.max(0, item.quantidade - item.saldoUnidades)])),
        });
        setErroUsos("");
    };

    const salvarUsos = async (plano: (typeof planos)[number]) => {
        if (!cliente?.id) return;
        const unidades = Math.floor(Number(usosEmEdicao.unidades || 0));
        const entregas = Math.floor(Number(usosEmEdicao.entregas || 0));
        const itensInvalidos = (plano.itens || []).some((item) => {
            const usados = Math.floor(Number(usosEmEdicao.itens[item.id] || 0));
            return usados < 0 || usados > item.quantidade;
        });
        if (unidades < 0 || unidades > plano.quantidade || entregas < 0 || entregas > plano.taxasEntregaCompradas || itensInvalidos) {
            setErroUsos("Informe usos entre zero e o total contratado no plano.");
            return;
        }
        setSalvandoUsos(true);
        setErroUsos("");
        try {
            const res = await apiFetch(`${API_URL}/clientes/${cliente.id}/planos/${plano.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    saldoUnidades: plano.itens?.length ? undefined : plano.quantidade - unidades,
                    saldoEntregas: plano.taxasEntregaCompradas - entregas,
                    saldosItens: plano.itens?.length
                        ? plano.itens.map((item) => ({
                            id: item.id,
                            saldoUnidades: item.quantidade - Math.floor(Number(usosEmEdicao.itens[item.id] || 0)),
                        }))
                        : undefined,
                }),
            });
            const json = await res.json().catch(() => null);
            if (!res.ok) throw new Error(json?.message || "Não foi possível salvar os usos.");
            await getHistorico({ clienteId: cliente.id, page, pageSize });
            setPlanoEmEdicao(null);
        } catch (e: any) {
            setErroUsos(e?.message || "Não foi possível salvar os usos.");
        } finally {
            setSalvandoUsos(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>
                        Histórico de Pedidos - {cliente?.nome || "(sem cliente)"}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-2">
                    <Tabs value={aba} onValueChange={(v) => setAba(v as Aba)}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="historico">Histórico de Pedidos</TabsTrigger>
                            <TabsTrigger value="planos">Histórico de Planos</TabsTrigger>
                        </TabsList>

                        <TabsContent value="historico" className="py-4 space-y-3">
                            {!cliente ? (
                                <div className="text-sm text-muted-foreground">Selecione um cliente.</div>
                            ) : loading ? (
                                <div className="text-sm text-muted-foreground">Carregando...</div>
                            ) : error ? (
                                <div className="text-sm text-red-600">{error}</div>
                            ) : (data?.rows?.length || 0) === 0 ? (
                                <div className="text-sm text-muted-foreground">Nenhum pedido encontrado.</div>
                            ) : (
                                <div className="space-y-2">
                                    {data!.rows.map((r) => (
                                        <div key={r.id} className="rounded-md border p-3">
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm font-medium">Pedido #{r.id}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {r.temAgendamento ? "Com agendamento" : "Sem agendamento"}
                                                </div>
                                            </div>

                                            <div className="text-xs text-muted-foreground mt-1 space-y-1">
                                                <div>Status: {r.status}</div>
                                                <div>Tipo: {r.tipo}</div>
                                                <div>Itens: {r.itensQtd}</div>
                                                <div>Total: {r.valorTotal != null ? `R$ ${r.valorTotal.toFixed(2)}` : "-"}</div>
                                                <div>
                                                    Pagamento: {r.formaPagamento || "-"} ({r.pagamentoStatus || "-"})
                                                </div>

                                                {r.agendamento?.data && (
                                                    <div>
                                                        Agendamento: {formatDate(r.agendamento.data)}{" "}
                                                        {r.agendamento.faixaHorario ? `- ${r.agendamento.faixaHorario}` : ""}
                                                    </div>
                                                )}

                                                {r.itens?.length > 0 && (
                                                    <div className="mt-2 border-t pt-2 space-y-1 text-xs">
                                                        {r.itens.map((item, idx) => (
                                                            <div key={idx} className="flex justify-between">
                                                                <span>
                                                                    {item.quantidade}x {item.nome}
                                                                    {item.tamanho ? ` (${item.tamanho})` : ""}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {data && data.total > pageSize && (
                                <div className="flex items-center justify-between pt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={page <= 1 || loading}
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    >
                                        Anterior
                                    </Button>
                                    <span className="text-xs text-muted-foreground">
                                        Página {page} de {Math.max(1, Math.ceil(data.total / pageSize))}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={page >= Math.ceil(data.total / pageSize) || loading}
                                        onClick={() => setPage((p) => p + 1)}
                                    >
                                        Próxima
                                    </Button>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="planos" className="py-4 space-y-3">
                            {!cliente ? (
                                <div className="text-sm text-muted-foreground">Selecione um cliente.</div>
                            ) : loading ? (
                                <div className="text-sm text-muted-foreground">Carregando...</div>
                            ) : error ? (
                                <div className="text-sm text-red-600">{error}</div>
                            ) : planos.length === 0 ? (
                                <div className="rounded-md border p-6 text-sm text-muted-foreground text-center">
                                    Nenhum plano encontrado para este cliente.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {planos.map((plano) => {
                                        const pesagem = plano.pesagemGramas != null ? `${plano.pesagemGramas}g` : "-";
                                        const resumoPlano = plano.itens?.length
                                            ? plano.itens.map((item) => `${item.quantidade}x${item.personalizado ? "Personalizado" : `${item.pesagemGramas || "-"}g`}`).join(" + ")
                                            : `${plano.quantidade}x${pesagem}`;

                                        return (
                                            <Collapsible key={plano.id}>
                                                <div className="rounded-md border p-4">
                                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                        <div className="min-w-0 space-y-1">
                                                            <div className="text-sm font-medium">
                                                                Plano: {resumoPlano}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                Adquirido em: {formatDate(plano.adquiridoEm)}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                Saldo atual: {plano.saldoUnidades} unidades
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                Taxinhas de entrega: {plano.saldoEntregas} de {plano.taxasEntregaCompradas} restantes
                                                                {plano.valorTaxaEntrega > 0 ? ` (${moneyBr(plano.valorTaxaEntrega)} cada)` : ""}
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-wrap gap-2">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                className="gap-2"
                                                                onClick={() => iniciarEdicaoUsos(plano)}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                                Editar usos
                                                            </Button>
                                                            <CollapsibleTrigger asChild>
                                                                <Button variant="outline" size="sm" className="gap-2">
                                                                    Ver usos
                                                                    <ChevronDown className="h-4 w-4" />
                                                                </Button>
                                                            </CollapsibleTrigger>
                                                        </div>
                                                    </div>

                                                    {planoEmEdicao === plano.id && (
                                                        <div className="mt-4 rounded-md border bg-muted/30 p-3">
                                                            <div className="grid gap-3 sm:grid-cols-2">
                                                                {plano.itens?.length ? (
                                                                    <div className="space-y-2 sm:col-span-2">
                                                                        <Label>Marmitas utilizadas por categoria</Label>
                                                                        <div className="grid gap-3 sm:grid-cols-2">
                                                                            {plano.itens.map((item) => (
                                                                                <div key={item.id} className="space-y-1">
                                                                                    <Label htmlFor={`usos-item-${item.id}`} className="text-xs">
                                                                                        {item.personalizado ? "Personalizado" : `${item.pesagemGramas || "-"}g`} — total {item.quantidade}
                                                                                    </Label>
                                                                                    <Input
                                                                                        id={`usos-item-${item.id}`}
                                                                                        type="number"
                                                                                        min={0}
                                                                                        max={item.quantidade}
                                                                                        step={1}
                                                                                        value={usosEmEdicao.itens[item.id] || 0}
                                                                                        onChange={(event) => setUsosEmEdicao((atual) => ({
                                                                                            ...atual,
                                                                                            itens: { ...atual.itens, [item.id]: Number(event.target.value || 0) },
                                                                                        }))}
                                                                                    />
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                <div className="space-y-1.5">
                                                                    <Label htmlFor={`usos-unidades-${plano.id}`}>Marmitas utilizadas</Label>
                                                                    <Input
                                                                        id={`usos-unidades-${plano.id}`}
                                                                        type="number"
                                                                        min={0}
                                                                        max={plano.quantidade}
                                                                        step={1}
                                                                        value={usosEmEdicao.unidades}
                                                                        onChange={(event) => setUsosEmEdicao((atual) => ({
                                                                            ...atual,
                                                                            unidades: Number(event.target.value || 0),
                                                                        }))}
                                                                    />
                                                                    <p className="text-xs text-muted-foreground">Total contratado: {plano.quantidade}</p>
                                                                </div>
                                                                )}
                                                                <div className="space-y-1.5">
                                                                    <Label htmlFor={`usos-entregas-${plano.id}`}>Taxinhas utilizadas</Label>
                                                                    <Input
                                                                        id={`usos-entregas-${plano.id}`}
                                                                        type="number"
                                                                        min={0}
                                                                        max={plano.taxasEntregaCompradas}
                                                                        step={1}
                                                                        value={usosEmEdicao.entregas}
                                                                        onChange={(event) => setUsosEmEdicao((atual) => ({
                                                                            ...atual,
                                                                            entregas: Number(event.target.value || 0),
                                                                        }))}
                                                                    />
                                                                    <p className="text-xs text-muted-foreground">Total contratado: {plano.taxasEntregaCompradas}</p>
                                                                </div>
                                                            </div>
                                                            {erroUsos && <p className="mt-2 text-sm text-red-600">{erroUsos}</p>}
                                                            <div className="mt-3 flex justify-end gap-2">
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    disabled={salvandoUsos}
                                                                    onClick={() => setPlanoEmEdicao(null)}
                                                                >
                                                                    Cancelar
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    disabled={salvandoUsos}
                                                                    onClick={() => salvarUsos(plano)}
                                                                >
                                                                    {salvandoUsos ? "Salvando..." : "Salvar usos"}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <CollapsibleContent className="mt-4 border-t pt-3">
                                                        {plano.usos.length === 0 ? (
                                                            <div className="text-sm text-muted-foreground">
                                                                Nenhuma unidade utilizada ainda.
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                {plano.usos.map((uso) => (
                                                                    <div
                                                                        key={uso.id}
                                                                        className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground"
                                                                    >
                                                                        Utilizado {uso.unidades} unidades - {formatDate(uso.data)}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        <div className="mt-4 border-t pt-3">
                                                            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                                Uso das taxinhas de entrega
                                                            </div>
                                                            {plano.usosEntregas.length === 0 ? (
                                                                <div className="text-sm text-muted-foreground">
                                                                    Nenhuma taxinha de entrega utilizada ainda.
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-2">
                                                                    {plano.usosEntregas.map((uso) => (
                                                                        <div
                                                                            key={uso.id}
                                                                            className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
                                                                        >
                                                                            Utilizado {uso.entregas} taxa{uso.entregas === 1 ? "" : "s"} de entrega - {formatDate(uso.data)}
                                                                            {uso.pedidoId ? ` - Pedido #${uso.pedidoId}` : ""}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </CollapsibleContent>
                                                </div>
                                            </Collapsible>
                                        );
                                    })}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
}
