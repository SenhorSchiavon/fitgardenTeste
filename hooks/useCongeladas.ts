"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "./api";

export type CongeladaMovimentoTipo = "ENTRADA" | "SAIDA" | "AJUSTE";

export type CongeladaMovimento = {
  id: number;
  congeladaId: number;
  tipo: CongeladaMovimentoTipo;
  quantidade: number;
  estoqueAntes: number;
  estoqueDepois: number;
  observacao?: string | null;
  createdAt: string;
};

export type Congelada = {
  id: number;
  nome: string;
  quantidade: number;
  ativo: boolean;
  movimentos?: CongeladaMovimento[];
};

export type NovaCongeladaInput = {
  nome: string;
  quantidade?: number;
  observacao?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api";
const RESOURCE = `${API_URL}/congeladas`;

function toInteger(value: any) {
  const n = Number(value || 0);
  return Number.isInteger(n) && n >= 0 ? n : 0;
}

function normalizeCongelada(congelada: any): Congelada {
  return {
    ...congelada,
    quantidade: toInteger(congelada.quantidade),
    movimentos: (congelada.movimentos || []).map((m: any) => ({
      ...m,
      quantidade: toInteger(m.quantidade),
      estoqueAntes: toInteger(m.estoqueAntes),
      estoqueDepois: toInteger(m.estoqueDepois),
    })),
  };
}

async function parseError(res: Response, fallback: string) {
  try {
    const data = await res.json();
    return data?.error || fallback;
  } catch {
    return fallback;
  }
}

export function useCongeladas() {
  const [congeladas, setCongeladas] = useState<Congelada[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchCongeladas = useCallback(async (search?: string) => {
    setLoading(true);
    try {
      const url = new URL(RESOURCE);
      if (search?.trim()) url.searchParams.set("search", search.trim());

      const res = await apiFetch(url.toString(), {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (!res.ok) throw new Error(await parseError(res, "Falha ao carregar congeladas"));
      const data = await res.json();
      setCongeladas((data || []).map(normalizeCongelada));
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar congeladas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCongeladas();
  }, [fetchCongeladas]);

  async function createCongelada(input: NovaCongeladaInput) {
    setSaving(true);
    try {
      const res = await apiFetch(RESOURCE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: input.nome.trim(),
          quantidade: toInteger(input.quantidade),
          observacao: input.observacao?.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error(await parseError(res, "Falha ao criar congelada"));
      const created = normalizeCongelada(await res.json());
      setCongeladas((prev) => [...prev, created].sort((a, b) => a.nome.localeCompare(b.nome)));
      toast.success("Marmita congelada criada");
      return created;
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Erro ao criar congelada");
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function updateCongelada(id: number, input: { nome: string }) {
    setSaving(true);
    try {
      const res = await apiFetch(`${RESOURCE}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: input.nome.trim() }),
      });

      if (!res.ok) throw new Error(await parseError(res, "Falha ao atualizar congelada"));
      const updated = normalizeCongelada(await res.json());
      setCongeladas((prev) => prev.map((item) => (item.id === id ? updated : item)));
      toast.success("Marmita congelada atualizada");
      return updated;
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Erro ao atualizar congelada");
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function movimentarCongelada(
    id: number,
    input: { tipo: CongeladaMovimentoTipo; quantidade: number; observacao?: string },
  ) {
    setSaving(true);
    try {
      const res = await apiFetch(`${RESOURCE}/${id}/movimentar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: input.tipo,
          quantidade: toInteger(input.quantidade),
          observacao: input.observacao?.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error(await parseError(res, "Falha ao movimentar estoque"));
      const updated = normalizeCongelada(await res.json());
      setCongeladas((prev) => prev.map((item) => (item.id === id ? updated : item)));
      toast.success(input.tipo === "SAIDA" ? "Quantidade removida" : "Quantidade adicionada");
      return updated;
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Erro ao movimentar estoque");
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function deleteCongelada(id: number) {
    setSaving(true);
    try {
      const res = await apiFetch(`${RESOURCE}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await parseError(res, "Falha ao excluir congelada"));
      setCongeladas((prev) => prev.filter((item) => item.id !== id));
      toast.success("Marmita congelada excluida");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Erro ao excluir congelada");
      throw err;
    } finally {
      setSaving(false);
    }
  }

  return {
    congeladas,
    loading,
    saving,
    fetchCongeladas,
    createCongelada,
    updateCongelada,
    movimentarCongelada,
    deleteCongelada,
  };
}
