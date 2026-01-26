"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export type Tamanho = {
  id: number;
  pesagemGramas: number;
  valorUnitario: number;
  valor10: number;
  valor20: number;
  valor40: number;
  createdAt?: string;
  updatedAt?: string;
};

type CriarAtualizarTamanhoInput = {
  pesagemGramas: number;
  valorUnitario: number;
  valor10: number;
  valor20: number;
  valor40: number;
};

function getApiUrl() {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) return "";
  return base.replace(/\/+$/, "");
}

async function http<T>(path: string, init?: RequestInit) {
  const base = getApiUrl();
  const url = `${base}${path}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    let msg = "Erro na requisição.";
    try {
      const data = await res.json();
      msg = data?.message || data?.error || msg;
    } catch {}
    throw new Error(msg);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function useTamanhos() {
  const [tamanhos, setTamanhos] = useState<Tamanho[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const getTamanhos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await http<Tamanho[]>("/tamanhos");
      setTamanhos(data);
    } catch (err: any) {
      toast.error("Erro ao carregar tamanhos", {
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getTamanhos();
  }, [getTamanhos]);

  const createTamanho = useCallback(async (payload: CriarAtualizarTamanhoInput) => {
    setSaving(true);
    try {
      const created = await http<Tamanho>("/tamanhos", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setTamanhos((p) =>
        [...p, created].sort((a, b) => a.pesagemGramas - b.pesagemGramas),
      );

      toast.success("Tamanho criado", {
        description: `${created.pesagemGramas}g cadastrado com sucesso.`,
      });

      return created;
    } catch (err: any) {
      toast.error("Erro ao criar tamanho", {
        description: err.message,
      });
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const updateTamanho = useCallback(
    async (id: number, payload: CriarAtualizarTamanhoInput) => {
      setSaving(true);
      try {
        const updated = await http<Tamanho>(`/tamanhos/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });

        setTamanhos((p) =>
          p
            .map((t) => (t.id === id ? updated : t))
            .sort((a, b) => a.pesagemGramas - b.pesagemGramas),
        );

        toast.success("Tamanho atualizado", {
          description: `${updated.pesagemGramas}g atualizado com sucesso.`,
        });

        return updated;
      } catch (err: any) {
        toast.error("Erro ao atualizar tamanho", {
          description: err.message,
        });
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const deleteTamanho = useCallback(async (id: number) => {
    setSaving(true);
    try {
      await http<void>(`/tamanhos/${id}`, { method: "DELETE" });

      setTamanhos((p) => p.filter((t) => t.id !== id));

      toast.success("Tamanho removido", {
        description: "O tamanho foi excluído com sucesso.",
      });
    } catch (err: any) {
      toast.error("Erro ao excluir tamanho", {
        description: err.message,
      });
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    tamanhos,
    loading,
    saving,
    refresh: getTamanhos,
    createTamanho,
    updateTamanho,
    deleteTamanho,
  };
}
