"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Trash, ChevronDown } from "lucide-react";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { usePlanosCliente } from "@/hooks/usePlanosCliente";
import { useClienteHistorico } from "@/hooks/useClienteHistorico";

type Aba = "historico" | "planos";

type PlanoCatalogo = {
    id: number;
    nome?: string | null;
    unidades?: number | null;
    tamanho?: { id: number; pesagemGramas: number } | null;
};

type ClienteMin = {
    id: number | string;
    nome?: string | null;
    telefone?: string | null;
    planos?: any[];
};

export function ClienteHistoricoDialog({
    open,
    onOpenChange,
    cliente,
    defaultTab = "historico",
    saving = false,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    cliente: ClienteMin | null;
    defaultTab?: Aba;
    saving?: boolean;
}) {
    const {
        listTamanhos,
        listPlanos,
        createPlano,
        vincularPlano,
        desvincularPlano,
        saving: savingPlano,
    } = usePlanosCliente();

    const savingAll = saving || savingPlano;

    const [aba, setAba] = useState<Aba>(defaultTab);

    const [tamanhos, setTamanhos] = useState<{ id: number; pesagemGramas: number }[]>([]);
    const [planosCatalogo, setPlanosCatalogo] = useState<PlanoCatalogo[]>([]);
    const [vinculoPlanoId, setVinculoPlanoId] = useState<string>("");

    const [novoPlanoCatalogo, setNovoPlanoCatalogo] = useState<{
        nome: string;
        tamanhoId: string;
        unidades: number;
    }>({
        nome: "",
        tamanhoId: "",
        unidades: 10,
    });
    const { data, loading, error, getHistorico } = useClienteHistorico();
    const [page, setPage] = useState(1);
    const pageSize = 10;

    useEffect(() => {
        if (!open) return;
        if (aba !== "historico") return;
        if (!cliente?.id) return;

        getHistorico({ clienteId: cliente.id, page, pageSize });
    }, [open, aba, cliente?.id, page, pageSize, getHistorico]);
    useEffect(() => {
        if (!open) return;
        setAba(defaultTab);
    }, [open, defaultTab]);

    useEffect(() => {
        let alive = true;

        async function run() {
            if (!open) return;
            if (aba !== "planos") return;

            try {
                const [t, planos] = await Promise.all([listTamanhos(), listPlanos()]);
                if (!alive) return;
                setTamanhos(t || []);
                setPlanosCatalogo(planos || []);
            } catch {
                if (!alive) return;
                setTamanhos([]);
                setPlanosCatalogo([]);
            }
        }

        run();
        return () => {
            alive = false;
        };
    }, [open, aba, listTamanhos, listPlanos]);

    const planosSelecionado = useMemo(() => {
        if (!cliente) return [];
        const arr = Array.isArray(cliente.planos) ? cliente.planos : [];
        return arr.map((p: any) => ({
            id: Number(p.id),
            nome: p.nome || p.plano?.nome || "Plano",
            tamanho: p.tamanho?.pesagemGramas
                ? `${p.tamanho.pesagemGramas}g`
                : p.plano?.tamanho?.pesagemGramas
                    ? `${p.plano.tamanho.pesagemGramas}g`
                    : "-",
            unidades: Number(p.unidades ?? p.plano?.unidades ?? 0),
        }));
    }, [cliente]);

    const planosVinculaveis = useMemo(() => {
        const vinculadosIds = new Set(planosSelecionado.map((p) => p.id));
        return (planosCatalogo || []).filter((p) => !vinculadosIds.has(p.id));
    }, [planosCatalogo, planosSelecionado]);

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
                            <TabsTrigger value="planos">Planos</TabsTrigger>
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
                                                        Agendamento: {String(r.agendamento.data)}{" "}
                                                        {r.agendamento.faixaHorario ? `• ${r.agendamento.faixaHorario}` : ""}
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
                        </TabsContent>

                        <TabsContent value="planos" className="py-4 space-y-4">
                            <div className="rounded-md border p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm font-medium">Vincular plano</div>
                                    <div className="text-xs text-muted-foreground">
                                        Selecione um plano do catálogo e vincule ao cliente
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3 items-end">
                                    <div className="space-y-1 col-span-2">
                                        <Label>Plano</Label>
                                        <Select
                                            value={vinculoPlanoId}
                                            onValueChange={(v) => setVinculoPlanoId(v)}
                                            disabled={savingAll || !cliente}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione um plano..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {planosVinculaveis.map((p) => {
                                                    const g = p.tamanho?.pesagemGramas ? `${p.tamanho.pesagemGramas}g` : "-";
                                                    const u = Number(p.unidades || 0);
                                                    const nome = p.nome?.trim() ? p.nome.trim() : `Plano ${g} (${u} un.)`;
                                                    return (
                                                        <SelectItem key={p.id} value={String(p.id)}>
                                                            {nome}
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Button
                                        className="w-full"
                                        disabled={savingAll || !cliente || !vinculoPlanoId}
                                        onClick={async () => {
                                            if (!cliente) return;
                                            if (!vinculoPlanoId) return;

                                            const vinc = await vincularPlano(Number(cliente.id), Number(vinculoPlanoId));

                                            // otimista: só pra UI refletir que “tem mais um plano”
                                            const plano = planosCatalogo.find((p) => String(p.id) === String(vinculoPlanoId));
                                            if (plano) {
                                                (cliente as any).planos = [...((cliente as any).planos || []), { ...vinc, plano }];
                                            }

                                            setVinculoPlanoId("");
                                        }}
                                    >
                                        {savingAll ? "Vinculando..." : "Vincular"}
                                    </Button>
                                </div>
                            </div>

                            <Separator />

                            <Collapsible defaultOpen={false}>
                                <div className="rounded-md border p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm font-medium">Criar novo plano</div>

                                        <CollapsibleTrigger asChild>
                                            <Button variant="ghost" size="sm" className="gap-2">
                                                Abrir <ChevronDown className="h-4 w-4" />
                                            </Button>
                                        </CollapsibleTrigger>
                                    </div>

                                    <CollapsibleContent className="mt-4 space-y-3">
                                        <div className="grid grid-cols-3 gap-3 items-end">
                                            <div className="space-y-1">
                                                <Label>Nome (opcional)</Label>
                                                <Input
                                                    value={novoPlanoCatalogo.nome}
                                                    onChange={(e) =>
                                                        setNovoPlanoCatalogo((p) => ({ ...p, nome: e.target.value }))
                                                    }
                                                    disabled={savingAll}
                                                    placeholder="Ex: Plano 300g"
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <Label>Tamanho</Label>
                                                <Select
                                                    value={novoPlanoCatalogo.tamanhoId}
                                                    onValueChange={(v) =>
                                                        setNovoPlanoCatalogo((p) => ({ ...p, tamanhoId: v }))
                                                    }
                                                    disabled={savingAll}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione..." />
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

                                            <div className="space-y-1">
                                                <Label>Qtd. unidades</Label>
                                                <Input
                                                    type="number"
                                                    value={String(novoPlanoCatalogo.unidades)}
                                                    onChange={(e) =>
                                                        setNovoPlanoCatalogo((p) => ({
                                                            ...p,
                                                            unidades: Number(e.target.value || 0),
                                                        }))
                                                    }
                                                    disabled={savingAll}
                                                    min={0}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-end">
                                            <Button
                                                disabled={savingAll || !novoPlanoCatalogo.tamanhoId}
                                                onClick={async () => {
                                                    if (!novoPlanoCatalogo.tamanhoId) return;

                                                    const created = await createPlano({
                                                        nome: novoPlanoCatalogo.nome?.trim()
                                                            ? novoPlanoCatalogo.nome.trim()
                                                            : null,
                                                        tamanhoId: Number(novoPlanoCatalogo.tamanhoId),
                                                        unidades: Number(novoPlanoCatalogo.unidades || 0),
                                                    });

                                                    setPlanosCatalogo((prev) => [created, ...(prev || [])]);
                                                    setNovoPlanoCatalogo({ nome: "", tamanhoId: "", unidades: 10 });
                                                }}
                                            >
                                                {savingAll ? "Criando..." : "Criar plano"}
                                            </Button>
                                        </div>
                                    </CollapsibleContent>
                                </div>
                            </Collapsible>

                            <div className="rounded-md border">
                                <div className="px-4 py-3 border-b flex items-center justify-between">
                                    <div className="text-sm font-medium">Planos vinculados</div>
                                    <div className="text-xs text-muted-foreground">
                                        {planosSelecionado.length} plano(s)
                                    </div>
                                </div>

                                <div className="p-4">
                                    {planosSelecionado.length === 0 ? (
                                        <div className="text-sm text-muted-foreground text-center py-6">
                                            Nenhum plano vinculado
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {planosSelecionado.map((plano: any) => (
                                                <div
                                                    key={plano.id}
                                                    className="flex items-center justify-between rounded-md border px-3 py-2"
                                                >
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-medium truncate">{plano.nome}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {plano.tamanho} • {plano.unidades} un.
                                                        </div>
                                                    </div>

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        disabled={savingAll || !cliente}
                                                        onClick={async () => {
                                                            if (!cliente) return;

                                                            await desvincularPlano(Number(cliente.id), Number(plano.id));

                                                            // otimista
                                                            (cliente as any).planos = ((cliente as any).planos || []).filter(
                                                                (p: any) => Number(p.id) !== Number(plano.id),
                                                            );
                                                        }}
                                                        title="Remover vínculo"
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
}