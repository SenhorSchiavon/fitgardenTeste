import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "./api";

export type Montador = {
  id: number;
  nome: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";
const RESOURCE = `${API_URL}/montadores`;

export function useMontadores() {
  const [montadores, setMontadores] = useState<Montador[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const carregarMontadores = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch(RESOURCE, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Falha ao carregar montadores");

      const data = await res.json();
      setMontadores(data);
    } catch (err: any) {
      toast.error("Erro ao buscar montadores", {
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarMontadores();
  }, [carregarMontadores]);

  const criarMontador = async (nome: string) => {
    try {
      const res = await apiFetch(RESOURCE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome }),
      });

      if (!res.ok) throw new Error("Falha ao cadastrar montador");

      const created = await res.json();
      setMontadores((prev) => [...prev, created].sort((a, b) => a.nome.localeCompare(b.nome)));

      toast.success("Sucesso", {
        description: "Montador cadastrado com sucesso!",
      });

      return created as Montador;
    } catch (err: any) {
      toast.error("Erro ao cadastrar montador", {
        description: err.message,
      });
      throw err;
    }
  };

  const updateMontador = async (id: number, nome: string) => {
    try {
      const res = await apiFetch(`${RESOURCE}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome }),
      });

      if (!res.ok) throw new Error("Falha ao atualizar montador");

      const updated = await res.json();
      setMontadores((prev) =>
        prev.map((montador) => (montador.id === id ? updated : montador)).sort((a, b) => a.nome.localeCompare(b.nome)),
      );

      toast.success("Sucesso", {
        description: "Montador atualizado com sucesso!",
      });

      return updated as Montador;
    } catch (err: any) {
      toast.error("Erro ao atualizar montador", {
        description: err.message,
      });
      throw err;
    }
  };

  const deleteMontador = async (id: number) => {
    try {
      const res = await apiFetch(`${RESOURCE}/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Falha ao excluir montador");

      setMontadores((prev) => prev.filter((montador) => montador.id !== id));

      toast.success("Sucesso", {
        description: "Montador excluído com sucesso!",
      });
    } catch (err: any) {
      toast.error("Erro ao excluir montador", {
        description: err.message,
      });
      throw err;
    }
  };

  return {
    montadores,
    isLoading,
    criarMontador,
    updateMontador,
    deleteMontador,
    carregarMontadores,
  };
}
