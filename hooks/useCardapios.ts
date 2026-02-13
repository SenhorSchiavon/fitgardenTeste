import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "./api";

export type CardapioOpcao = {
  id: number;
  opcaoId: number;
  opcaoNome?: string;
  opcaoTipo?: "MARMITA" | "OUTROS";
  opcaoCategoria?: "FIT" | "LOW_CARB" | "VEGETARIANO" | "SOPA" | null;
  ordem: number;
  ativo: boolean;
};

export type Cardapio = {
  id: number;
  codigo: string;
  nome: string;
  ativo: boolean;
  opcoes: CardapioOpcao[];
};

type CardapioOpcaoInput = {
  opcaoId: number;
  ordem?: number;
  ativo?: boolean;
};

export type NovoCardapioInput = {
  codigo: string;
  nome: string;
  ativo?: boolean;
  opcoes?: CardapioOpcaoInput[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";
const RESOURCE = `${API_URL}/cardapios`;

export function useCardapios() {
  const [cardapios, setCardapios] = useState<Cardapio[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCardapios = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await apiFetch(RESOURCE, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Falha ao carregar cardápios");

      const data: Cardapio[] = await res.json();
      setCardapios(data);
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar os cardápios.");

      toast.error("Erro ao carregar cardápios", {
        description: "Tente novamente em instantes.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCardapios();
  }, [fetchCardapios]);

  async function createCardapio(input: NovoCardapioInput) {
    try {
      setSaving(true);
      setError(null);

      const res = await apiFetch(RESOURCE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const msg = await safeReadMessage(res);
        throw new Error(msg || "Falha ao criar cardápio");
      }

      const created: Cardapio = await res.json();
      setCardapios((prev) => [...prev, created]);

      toast.success("Cardápio criado", {
        description: `"${created.nome}" foi cadastrado com sucesso.`,
      });

      return created;
    } catch (err) {
      console.error(err);
      setError("Não foi possível criar o cardápio.");

      toast.error("Erro ao criar cardápio", {
        description: err instanceof Error ? err.message : "Verifique os dados e tente novamente.",
      });

      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function updateCardapio(id: number, input: NovoCardapioInput) {
    try {
      setSaving(true);
      setError(null);

      const res = await apiFetch(`${RESOURCE}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const msg = await safeReadMessage(res);
        throw new Error(msg || "Falha ao atualizar cardápio");
      }

      const updated: Cardapio = await res.json();
      setCardapios((prev) => prev.map((c) => (c.id === id ? updated : c)));

      toast.success("Cardápio atualizado", {
        description: `"${updated.nome}" foi atualizado com sucesso.`,
      });

      return updated;
    } catch (err) {
      console.error(err);
      setError("Não foi possível atualizar o cardápio.");

      toast.error("Erro ao atualizar cardápio", {
        description: err instanceof Error ? err.message : "Tente novamente em instantes.",
      });

      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function deleteCardapio(id: number) {
    try {
      setSaving(true);
      setError(null);

      const cardapio = cardapios.find((c) => c.id === id);

      const res = await apiFetch(`${RESOURCE}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const msg = await safeReadMessage(res);
        throw new Error(msg || "Falha ao excluir cardápio");
      }

      setCardapios((prev) => prev.filter((c) => c.id !== id));

      toast.success("Cardápio excluído", {
        description: cardapio
          ? `"${cardapio.nome}" foi removido com sucesso.`
          : "O cardápio foi removido com sucesso.",
      });
    } catch (err) {
      console.error(err);
      setError("Não foi possível excluir o cardápio.");

      toast.error("Erro ao excluir cardápio", {
        description: err instanceof Error ? err.message : "Tente novamente em instantes.",
      });

      throw err;
    } finally {
      setSaving(false);
    }
  }

  return {
    cardapios,
    loading,
    saving,
    error,
    fetchCardapios,
    createCardapio,
    updateCardapio,
    deleteCardapio,
  };
}

async function safeReadMessage(res: Response) {
  try {
    const data = await res.json();
    return data?.message ? String(data.message) : null;
  } catch {
    return null;
  }
}
