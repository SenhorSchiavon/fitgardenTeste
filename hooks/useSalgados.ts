"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "./api";

export type Salgado = {
  id: number;
  nome: string;
  preco: number;
  ativo: boolean;
};

export type NovoSalgadoInput = {
  nome: string;
  preco: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";
const RESOURCE = `${API_URL}/salgados`;

function toNumber(value: any) {
  const n = Number(String(value || 0).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function normalizeSalgado(salgado: any): Salgado {
  return { ...salgado, preco: Number(salgado.preco || 0) };
}

export function useSalgados() {
  const [salgados, setSalgados] = useState<Salgado[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchSalgados = useCallback(async (search?: string) => {
    setLoading(true);
    try {
      const url = new URL(RESOURCE);
      if (search?.trim()) url.searchParams.set("search", search.trim());

      const res = await apiFetch(url.toString(), {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Falha ao carregar salgados");
      const data = await res.json();
      setSalgados((data || []).map(normalizeSalgado));
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar salgados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSalgados();
  }, [fetchSalgados]);

  async function createSalgado(input: NovoSalgadoInput) {
    setSaving(true);
    try {
      const res = await apiFetch(RESOURCE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: input.nome.trim(),
          preco: toNumber(input.preco),
        }),
      });

      if (!res.ok) throw new Error("Falha ao criar salgado");
      const created = normalizeSalgado(await res.json());
      setSalgados((prev) => [...prev, created]);
      toast.success("Salgado criado");
      return created;
    } catch (err) {
      console.error(err);
      toast.error("Erro ao criar salgado");
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function updateSalgado(id: number, input: NovoSalgadoInput) {
    setSaving(true);
    try {
      const res = await apiFetch(`${RESOURCE}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: input.nome.trim(),
          preco: toNumber(input.preco),
        }),
      });

      if (!res.ok) throw new Error("Falha ao atualizar salgado");
      const updated = normalizeSalgado(await res.json());
      setSalgados((prev) => prev.map((s) => (s.id === id ? updated : s)));
      toast.success("Salgado atualizado");
      return updated;
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar salgado");
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function deleteSalgado(id: number) {
    setSaving(true);
    try {
      const res = await apiFetch(`${RESOURCE}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao excluir salgado");
      setSalgados((prev) => prev.filter((s) => s.id !== id));
      toast.success("Salgado excluído");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir salgado");
      throw err;
    } finally {
      setSaving(false);
    }
  }

  return {
    salgados,
    loading,
    saving,
    fetchSalgados,
    createSalgado,
    updateSalgado,
    deleteSalgado,
  };
}
