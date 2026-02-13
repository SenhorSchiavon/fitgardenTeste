"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "./api";

export type PedidoTipo = "ENTREGA" | "RETIRADA";

export type FormaPagamento =
  | "DINHEIRO"
  | "CREDITO"
  | "DEBITO"
  | "PIX"
  | "LINK"
  | "VOUCHER"
  | "VOUCHER_TAXA_DINHEIRO"
  | "VOUCHER_TAXA_CARTAO"
  | "VOUCHER_TAXA_PIX"
  | "PLANO";

export type PedidoStatus = "ABERTO" | "PAGO" | "CANCELADO";

export type PedidoItemInput = {
  opcaoId: number;
  tamanhoId: number;
  quantidade: number;
};

export type CreatePedidoSemAgendamentoInput = {
  clienteId: number;
  tipo?: PedidoTipo; // default RETIRADA no backend
  observacoes?: string;
  formaPagamento: FormaPagamento;
  voucherCodigo?: string;
  itens: PedidoItemInput[];
};

export type UpdatePedidoSemAgendamentoInput = Partial<{
  tipo: PedidoTipo;
  observacoes: string | null;
  formaPagamento: FormaPagamento;
  itens: PedidoItemInput[];
}>;

export type FinalizarPagamentoInput = {
  formaPagamento: Exclude<FormaPagamento, "PLANO">;
};

export type ListQuery = {
  q?: string;
  page?: number;
  pageSize?: number;
};

export type ListResponse<T = any> = {
  page: number;
  pageSize: number;
  total: number;
  rows: T[];
};

function buildQueryString(params: Record<string, any>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.set(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg =
      data?.message ||
      data?.error ||
      `Erro HTTP ${res.status} (${res.statusText})`;
    console.log("fetchJson error details:", {
      url,
      init,
      status: res.status,
      responseText: text,
      parsedData: data,
    });
    throw new Error(msg);
  }

  return data as T;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

export function usePedidosSemAgendamento() {
  const baseUrl = API_URL + "/pedidos-sem-agendamento";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const clearError = useCallback(() => setError(""), []);
  const showError = useCallback((msg: string) => toast.error(msg), []);

  const createPedido = useCallback(async (payload: CreatePedidoSemAgendamentoInput) => {
    setLoading(true);
    setError("");
    try {
      const body = {
        clienteId: Number(payload.clienteId),
        tipo: payload.tipo,
        observacoes: payload.observacoes,
        formaPagamento: payload.formaPagamento,
        voucherCodigo: payload.voucherCodigo?.trim() || undefined,
        itens: (payload.itens || []).map((it) => ({
          opcaoId: Number(it.opcaoId),
          tamanhoId: Number(it.tamanhoId),
          quantidade: Number(it.quantidade),
        })),
      };

      return await fetchJson<{ pedidoId: number }>(baseUrl, {
        method: "POST",
        body: JSON.stringify(body),
      });
    } catch (e: any) {
      const msg = e?.message || "Erro ao criar pedido";
      setError(msg);
      showError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [baseUrl, showError]);

  const getPedidoById = useCallback(async <T = any>(pedidoId: number) => {
    setLoading(true);
    setError("");
    try {
      return await fetchJson<T>(`${baseUrl}/${pedidoId}`, { method: "GET" });
    } catch (e: any) {
      const msg = e?.message || "Erro ao buscar pedido";
      setError(msg);
      showError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [baseUrl, showError]);

  const getPedidos = useCallback(async <T = any>(query: ListQuery = {}) => {
    setLoading(true);
    setError("");
    try {
      const qs = buildQueryString({ ...query });
      return await fetchJson<ListResponse<T>>(`${baseUrl}${qs}`, { method: "GET" });
    } catch (e: any) {
      const msg = e?.message || "Erro ao listar pedidos";
      setError(msg);
      showError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [baseUrl, showError]);

  const getPendentes = useCallback(async <T = any>(query: ListQuery = {}) => {
    setLoading(true);
    setError("");
    try {
      const qs = buildQueryString({ ...query });
      return await fetchJson<ListResponse<T>>(`${baseUrl}/pendentes${qs}`, { method: "GET" });
    } catch (e: any) {
      const msg = e?.message || "Erro ao listar pendentes";
      setError(msg);
      showError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [baseUrl, showError]);

  const getHistorico = useCallback(async <T = any>(query: ListQuery = {}) => {
    setLoading(true);
    setError("");
    try {
      const qs = buildQueryString({ ...query });
      return await fetchJson<ListResponse<T>>(`${baseUrl}/historico${qs}`, { method: "GET" });
    } catch (e: any) {
      const msg = e?.message || "Erro ao listar histórico";
      setError(msg);
      showError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [baseUrl, showError]);

  const updatePedido = useCallback(async (pedidoId: number, payload: UpdatePedidoSemAgendamentoInput) => {
    setLoading(true);
    setError("");
    try {
      const body: any = { ...payload };

      if (Array.isArray(body.itens)) {
        body.itens = body.itens.map((it: any) => ({
          opcaoId: Number(it.opcaoId),
          tamanhoId: Number(it.tamanhoId),
          quantidade: Number(it.quantidade),
        }));
      }

      return await fetchJson<any>(`${baseUrl}/${pedidoId}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    } catch (e: any) {
      const msg = e?.message || "Erro ao atualizar pedido";
      setError(msg);
      showError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [baseUrl, showError]);

  const deletePedido = useCallback(async (pedidoId: number) => {
    setLoading(true);
    setError("");
    try {
      return await fetchJson<{ success: boolean }>(`${baseUrl}/${pedidoId}`, {
        method: "DELETE",
      });
    } catch (e: any) {
      const msg = e?.message || "Erro ao remover pedido";
      setError(msg);
      showError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [baseUrl, showError]);

  const finalizarPagamento = useCallback(async (pedidoId: number, payload: FinalizarPagamentoInput) => {
    setLoading(true);
    setError("");
    try {
      return await fetchJson<{ success: boolean; pedidoId: number }>(
        `${baseUrl}/${pedidoId}/finalizar-pagamento`,
        {
          method: "POST",
          body: JSON.stringify({ formaPagamento: payload.formaPagamento }),
        },
      );
    } catch (e: any) {
      const msg = e?.message || "Erro ao finalizar pagamento";
      setError(msg);
      showError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [baseUrl, showError]);

  const utils = useMemo(() => ({}), []);

  return {
    loading,
    error,
    clearError,

    createPedido,
    getPedidoById,
    getPedidos,
    getPendentes,
    getHistorico,
    updatePedido,
    deletePedido,
    finalizarPagamento,

    utils,
  };
}
