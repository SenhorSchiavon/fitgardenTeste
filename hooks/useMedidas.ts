import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { apiFetch } from "./api";

export type Medida = {
  id: number;
  nome: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";
const RESOURCE = `${API_URL}/medidas`;

export function useMedidas() {
  const [medidas, setMedidas] = useState<Medida[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const carregarMedidas = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch(RESOURCE, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Falha ao carregar medidas");

      const data = await res.json();
      setMedidas(data);
    } catch (err: any) {
      toast.error("Erro ao buscar medidas", {
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarMedidas();
  }, [carregarMedidas]);

  const criarMedida = async (nome: string) => {
    try {
      const res = await apiFetch(RESOURCE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome }),
      });

      if (!res.ok) throw new Error("Falha ao cadastrar medida");

      const created = await res.json();
      setMedidas((prev) => [...prev, created]);

      toast.success("Sucesso", {
        description: "Medida cadastrada com sucesso!",
      });

      return created as Medida;
    } catch (err: any) {
      toast.error("Erro ao cadastrar medida", {
        description: err.message,
      });
      throw err;
    }
  };

  const updateMedida = async (id: number, nome: string) => {
    try {
      const res = await apiFetch(`${RESOURCE}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome }),
      });

      if (!res.ok) throw new Error("Falha ao atualizar medida");

      const updated = await res.json();
      setMedidas((prev) => prev.map((m) => (m.id === id ? updated : m)));
      
      toast.success("Sucesso", {
        description: "Medida atualizada com sucesso!",
      });
      return updated as Medida;
    } catch (err: any) {
      toast.error("Erro ao atualizar medida", {
        description: err.message,
      });
      throw err;
    }
  };

  const deleteMedida = async (id: number) => {
    try {
      const res = await apiFetch(`${RESOURCE}/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Falha ao excluir medida");

      setMedidas((prev) => prev.filter((m) => m.id !== id));
      
      toast.success("Sucesso", {
        description: "Medida excluída com sucesso!",
      });
    } catch (err: any) {
      toast.error("Erro ao excluir medida", {
        description: err.message,
      });
      throw err;
    }
  };

  return {
    medidas,
    isLoading,
    criarMedida,
    updateMedida,
    deleteMedida,
    carregarMedidas,
  };
}
