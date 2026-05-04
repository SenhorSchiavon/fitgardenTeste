"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useClienteHistorico } from "@/hooks/useClienteHistorico";

type Aba = "historico" | "planos";

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

                                        return (
                                            <Collapsible key={plano.id}>
                                                <div className="rounded-md border p-4">
                                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                        <div className="min-w-0 space-y-1">
                                                            <div className="text-sm font-medium">
                                                                Plano: {plano.quantidade}x{pesagem}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                Adquirido em: {formatDate(plano.adquiridoEm)}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                Saldo atual: {plano.saldoUnidades} unidades
                                                            </div>
                                                        </div>

                                                        <CollapsibleTrigger asChild>
                                                            <Button variant="outline" size="sm" className="gap-2">
                                                                Ver usos
                                                                <ChevronDown className="h-4 w-4" />
                                                            </Button>
                                                        </CollapsibleTrigger>
                                                    </div>

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
