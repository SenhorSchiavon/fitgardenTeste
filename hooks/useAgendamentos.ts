"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "./api";
export type RegiaoEntrega =
  | "CENTRO"
  | "ZONA_SUL"
  | "ZONA_NORTE"
  | "ZONA_LESTE"
  | "ZONA_OESTE"
  | "CAMBE"
  | "IBIPORA";

export type PedidoTipo = "ENTREGA" | "RETIRADA";

export type PedidoStatus = "ABERTO" | "PAGO" | "CANCELADO";
export type PedidoPendenteRow = {
  agendamentoId: number;
  pedidoId: number;

  id: string;
  numeroPedido: string;

  cliente: string;
  telefone: string;

  tipoEntrega: "ENTREGA" | "RETIRADA";
  faixaHorario: string;

  endereco: string;
  zona: RegiaoEntrega | null;

  quantidade: number;
  formaPagamento: FormaPagamento | string;

  entregador?: string | null;
  observacoes?: string | null;
  valorTotal: number;
  itens: { nome: string; tamanho: string; quantidade: number }[];
  data: string;
};

export type PedidosPendentesQuery = {
  date?: string;
  q?: string;
  page?: number;
  pageSize?: number;
};
export type EstimarTaxaResponse = {
  success: boolean;
  distanciaKm: number;
  valorTaxa: number;
};
export type FinalizarPagamentoInput = {
  formaPagamento: Exclude<FormaPagamento, "PLANO">;
};
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

export type AgendamentoItemInput = {
  opcaoId: number;
  tamanhoId: number;
  quantidade: number;
};

export type CreateAgendamentoInput = {
  clienteId: number;
  tipo: PedidoTipo;
  data: Date | string;
  faixaHorario: string;
  endereco?: string;
  regiao?: RegiaoEntrega;
  observacoes?: string;
  formaPagamento: FormaPagamento;
  voucherCodigo?: string;
  itens: AgendamentoItemInput[];
};

export type UpdateAgendamentoInput = Partial<{
  tipo: PedidoTipo;
  data: Date | string;
  faixaHorario: string;
  endereco: string;
  regiao: RegiaoEntrega | null;
  observacoes: string | null;
  formaPagamento: FormaPagamento;
  itens: AgendamentoItemInput[];
}>;

export type AgendamentosListQuery = {
  date?: string; // YYYY-MM-DD
  clienteId?: number;
  tipo?: PedidoTipo;
  status?: PedidoStatus;
  q?: string;
  page?: number;
  pageSize?: number;
};

export type AgendamentosListResponse<T = any> = {
  page: number;
  pageSize: number;
  total: number;
  rows: T[];
};

function toISODateOnly(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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

  let data: any = null;
  const text = await res.text();
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

export function useAgendamentos(options?: { baseUrl?: string }) {
  const baseUrl = API_URL + "/agendamentos";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const clearError = useCallback(() => setError(""), []);

  const showError = useCallback((msg: string) => {
    toast.error(msg);
  }, []);

  const getAgendamentos = useCallback(
    async <T = any>(query: AgendamentosListQuery = {}) => {
      setLoading(true);
      setError("");
      try {
        const qs = buildQueryString({ ...query });
        return await fetchJson<AgendamentosListResponse<T>>(`${baseUrl}${qs}`, {
          method: "GET",
        });
      } catch (e: any) {
        const msg = e?.message || "Erro ao listar agendamentos";
        setError(msg);
        showError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [baseUrl, showError],
  );

  const getAgendamentoById = useCallback(
    async <T = any>(id: number) => {
      setLoading(true);
      setError("");
      try {
        return await fetchJson<T>(`${baseUrl}/${id}`, { method: "GET" });
      } catch (e: any) {
        const msg = e?.message || "Erro ao buscar agendamento";
        setError(msg);
        showError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [baseUrl, showError],
  );
  const getPedidosPendentes = useCallback(
    async (query: PedidosPendentesQuery = {}) => {
      setLoading(true);
      setError("");
      try {
        const qs = buildQueryString({ ...query });
        return await fetchJson<AgendamentosListResponse<PedidoPendenteRow>>(
          `${baseUrl}/pendentes${qs}`,
          { method: "GET" },
        );
      } catch (e: any) {
        const msg = e?.message || "Erro ao listar pedidos pendentes";
        setError(msg);
        showError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [baseUrl, showError],
  );
  const baixarXlsxImportEntregasDoDia = useCallback(
    async (date?: string) => {
      const dateISO = date && date.trim() ? date : toISODateOnly(new Date());

      setLoading(true);
      setError("");
      try {
        const qs = buildQueryString({ date: dateISO, pendentes: 1 });

        const res = await apiFetch(
          `${baseUrl}/exports/import-entregas.xlsx${qs}`,
          { method: "GET" },
        );

        if (!res.ok) {
          const text = await res.text();
          let data: any = null;
          try {
            data = text ? JSON.parse(text) : null;
          } catch {
            data = { raw: text };
          }
          const msg =
            data?.message ||
            data?.error ||
            `Erro HTTP ${res.status} (${res.statusText})`;
          throw new Error(msg);
        }

        const blob = await res.blob();

        // tenta pegar filename do header
        const cd = res.headers.get("content-disposition") || "";
        const match = cd.match(/filename="([^"]+)"/i);
        const filename = (
          match?.[1] || `import-entregas-${dateISO}.xlsx`
        ).trim();

        // baixa no navegador
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        toast.success("Planilha gerada e baixada!");
        return { success: true, filename };
      } catch (e: any) {
        const msg = e?.message || "Erro ao baixar planilha";
        setError(msg);
        showError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [baseUrl, showError],
  );

  const finalizarPagamento = useCallback(
    async (agendamentoId: number, payload: FinalizarPagamentoInput) => {
      setLoading(true);
      setError("");
      try {
        return await fetchJson<{
          success: boolean;
          pedidoId: number;
          agendamentoId: number;
        }>(`${baseUrl}/${agendamentoId}/finalizar-pagamento`, {
          method: "POST",
          body: JSON.stringify({ formaPagamento: payload.formaPagamento }),
        });
      } catch (e: any) {
        const msg = e?.message || "Erro ao finalizar pagamento";
        setError(msg);
        showError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [baseUrl, showError],
  );
  const integrarEntregasDoDia = useCallback(
    async (date?: string) => {
      const dateISO = date && date.trim() ? date : toISODateOnly(new Date());

      setLoading(true);
      setError("");
      try {
        const qs = buildQueryString({ date: dateISO });

        return await fetchJson<{
          success: boolean;
          date: string;
          totalEncontrados: number;
          ok: number;
          fail: number;
          errors: { agendamentoId: number; error: string }[];
        }>(`${baseUrl}/integrar-entregas-do-dia${qs}`, {
          method: "POST",
        });
      } catch (e: any) {
        const msg = e?.message || "Erro ao integrar entregas do dia";
        setError(msg);
        showError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [baseUrl, showError],
  );

  const createAgendamento = useCallback(
    async (payload: CreateAgendamentoInput) => {
      setLoading(true);
      setError("");
      try {
        const body = {
          clienteId: Number(payload.clienteId),
          tipo: payload.tipo,
          data:
            payload.data instanceof Date
              ? payload.data.toISOString()
              : payload.data,
          faixaHorario: payload.faixaHorario,
          endereco: payload.endereco,
          regiao: payload.regiao,
          observacoes: payload.observacoes,
          formaPagamento: payload.formaPagamento,
          voucherCodigo: payload.voucherCodigo?.trim() || undefined,
          itens: (payload.itens || []).map((it) => ({
            opcaoId: Number(it.opcaoId),
            tamanhoId: Number(it.tamanhoId),
            quantidade: Number(it.quantidade),
          })),
        };

        return await fetchJson<{ pedidoId: number; agendamentoId: number }>(
          baseUrl,
          { method: "POST", body: JSON.stringify(body) },
        );
      } catch (e: any) {
        const msg = e?.message || "Erro ao criar agendamento";
        setError(msg);
        showError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [baseUrl, showError],
  );
  const estimarTaxaEntrega = useCallback(
    async (clienteId: number) => {
      setLoading(true);
      setError("");
      try {
        const qs = buildQueryString({ clienteId: Number(clienteId) });
        return await fetchJson<EstimarTaxaResponse>(
          `${baseUrl}/estimar-taxa${qs}`,
          { method: "GET" },
        );
      } catch (e: any) {
        const msg = e?.message || "Erro ao estimar taxa de entrega";
        setError(msg);
        showError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [baseUrl, showError],
  );
  const updateAgendamento = useCallback(
    async (id: number, payload: UpdateAgendamentoInput) => {
      setLoading(true);
      setError("");
      try {
        const body: any = { ...payload };
        if (body.data instanceof Date) body.data = body.data.toISOString();

        if (Array.isArray(body.itens)) {
          body.itens = body.itens.map((it: any) => ({
            opcaoId: Number(it.opcaoId),
            tamanhoId: Number(it.tamanhoId),
            quantidade: Number(it.quantidade),
          }));
        }

        return await fetchJson<any>(`${baseUrl}/${id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      } catch (e: any) {
        const msg = e?.message || "Erro ao atualizar agendamento";
        setError(msg);
        showError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [baseUrl, showError],
  );

  const deleteAgendamento = useCallback(
    async (id: number) => {
      setLoading(true);
      setError("");
      try {
        return await fetchJson<{ success: boolean }>(`${baseUrl}/${id}`, {
          method: "DELETE",
        });
      } catch (e: any) {
        const msg = e?.message || "Erro ao remover agendamento";
        setError(msg);
        showError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [baseUrl, showError],
  );

  // ajudinhas
  const utils = useMemo(
    () => ({
      toISODateOnly,
    }),
    [],
  );
  const getPendentes = useCallback(
    async <T = any>(
      query: {
        date?: string;
        q?: string;
        page?: number;
        pageSize?: number;
      } = {},
    ) => {
      setLoading(true);
      setError("");
      try {
        const qs = buildQueryString({ ...query });
        return await fetchJson<AgendamentosListResponse<T>>(
          `${baseUrl}/pendentes${qs}`,
          {
            method: "GET",
          },
        );
      } catch (e: any) {
        const msg = e?.message || "Erro ao listar pendentes";
        setError(msg);
        showError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [baseUrl, showError],
  );

  const getHistorico = useCallback(
    async <T = any>(
      query: {
        date?: string;
        q?: string;
        page?: number;
        pageSize?: number;
      } = {},
    ) => {
      setLoading(true);
      setError("");
      try {
        const qs = buildQueryString({ ...query });
        return await fetchJson<AgendamentosListResponse<T>>(
          `${baseUrl}/historico${qs}`,
          {
            method: "GET",
          },
        );
      } catch (e: any) {
        const msg = e?.message || "Erro ao listar histórico";
        setError(msg);
        showError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [baseUrl, showError],
  );

  return {
    loading,
    error,
    clearError,

    finalizarPagamento,
    getPedidosPendentes,
    getHistorico,
    baixarXlsxImportEntregasDoDia,
    getAgendamentos,
    getAgendamentoById,
    createAgendamento,
    updateAgendamento,
    deleteAgendamento,
    estimarTaxaEntrega,
    integrarEntregasDoDia,
    utils,
  };
}
