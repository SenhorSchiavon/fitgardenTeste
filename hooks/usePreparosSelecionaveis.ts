import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "./api";

export type PreparoTipo = "CARBOIDRATO" | "PROTEINA" | "LEGUMES" | "FEIJAO";

export type PreparoSelecionavel = {
  id: number;
  nome: string;
  tipo: PreparoTipo;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

export function usePreparosSelecionaveis(tipo?: PreparoTipo) {
  const [preparos, setPreparos] = useState<PreparoSelecionavel[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPreparos = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (tipo) params.set("tipo", tipo);

      const url = `${API_URL}/preparos/selecionaveis${params.toString() ? `?${params.toString()}` : ""}`;

      const res = await apiFetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Falha ao carregar preparos selecionáveis");

      const data: PreparoSelecionavel[] = await res.json();
      setPreparos(data);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar preparos", {
        description: "Tente novamente em instantes.",
      });
    } finally {
      setLoading(false);
    }
  }, [tipo]);

  useEffect(() => {
    fetchPreparos();
  }, [fetchPreparos]);

  return {
    preparos,
    loading,
    refetch: fetchPreparos,
  };
}