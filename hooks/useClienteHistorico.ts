"use client";

import { useCallback, useState } from "react";
import { apiFetch } from "./api";

export type ClienteHistoricoRow = {
    id: number;
    tipo: string;
    status: string;

    valorTotal: number | null;
    formaPagamento: string | null;
    pagamentoStatus: string | null;
    pagoEm: string | null;

    itensQtd: number;

    itens: {
        nome: string;
        tamanho: string | null;
        quantidade: number;
    }[];

    temAgendamento: boolean;
    agendamento: {
        id: number | null;
        data: string | null;
        faixaHorario: string | null;
    } | null;
};

export type ClienteHistoricoResponse = {
    page: number;
    pageSize: number;
    total: number;
    rows: ClienteHistoricoRow[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";
const RESOURCE = `${API_URL}/clientes`; // IMPORTANT: API_URL precisa terminar com /api

export function useClienteHistorico() {
    const [data, setData] = useState<ClienteHistoricoResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getHistorico = useCallback(
        async (params: { clienteId: number | string; page?: number; pageSize?: number }) => {
            const clienteId = Number(params.clienteId || 0);
            if (!clienteId) {
                setData(null);
                setError(null);
                return null;
            }

            const page = Math.max(1, Number(params.page || 1));
            const pageSize = Math.min(100, Math.max(1, Number(params.pageSize || 20)));

            setLoading(true);
            setError(null);

            try {
                const qs = new URLSearchParams({
                    page: String(page),
                    pageSize: String(pageSize),
                });

                const res = await apiFetch(`${RESOURCE}/${clienteId}/historico?${qs.toString()}`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                });

                const json = await res.json().catch(() => null);

                if (!res.ok) {
                    throw new Error(json?.message || "Erro ao buscar histórico");
                }

                setData(json as ClienteHistoricoResponse);
                return json as ClienteHistoricoResponse;
            } catch (e: any) {
                setData(null);
                setError(e?.message || "Erro ao buscar histórico");
                return null;
            } finally {
                setLoading(false);
            }
        },
        [],
    );

    return { data, loading, error, getHistorico };
}