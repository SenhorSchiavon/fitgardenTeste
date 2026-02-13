import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "./api";

type OpcaoDoCardapio = {
  id: string;
  nome: string;
  categoria: string;
  tamanhos: { tamanhoId: string; tamanhoLabel: string; preco: number }[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

export function useOpcoesDoCardapio(cardapioId?: number) {
  const [opcoes, setOpcoes] = useState<OpcaoDoCardapio[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOpcoes = useCallback(async () => {
    if (!cardapioId) {
      setOpcoes([]);
      return;
    }

    try {
      setLoading(true);
      const res = await apiFetch(`${API_URL}/cardapios-ativos/${cardapioId}/opcoes`, {
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Falha ao carregar opções do cardápio.");

      const data = (await res.json()) as OpcaoDoCardapio[];
      setOpcoes(data);
    } catch (e) {
      toast.error("Erro ao carregar opções", {
        description: e instanceof Error ? e.message : "Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  }, [cardapioId]);

  useEffect(() => {
    fetchOpcoes();
  }, [fetchOpcoes]);

  return { opcoes, loading, refetch: fetchOpcoes };
}
