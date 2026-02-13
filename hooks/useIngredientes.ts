import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "./api";

export type Medida = "UN" | "KG" | "L";

export type Ingrediente = {
  id: number;
  codigoSistema: string;
  nome: string;
  categoriaId: number;
  categoriaDescricao: string;
  medida: Medida;
  precoCusto: number;
};

type NovoIngredienteInput = {
  nome: string;
  categoriaId: number;
  medida: Medida;
  precoCusto: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";
const RESOURCE = `${API_URL}/ingredientes`;

export function useIngredientes() {
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIngredientes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await apiFetch(RESOURCE, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Falha ao carregar ingredientes");

      const data: Ingrediente[] = await res.json();
      setIngredientes(data);
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar os ingredientes.");

      toast.error("Erro ao carregar ingredientes", {
        description: "Tente novamente em instantes.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIngredientes();
  }, [fetchIngredientes]);

  async function createIngrediente(input: NovoIngredienteInput) {
    try {
      setSaving(true);
      setError(null);

      const res = await apiFetch(RESOURCE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!res.ok) throw new Error("Falha ao criar ingrediente");

      const created: Ingrediente = await res.json();
      setIngredientes((prev) => [...prev, created]);

      toast.success("Ingrediente criado", {
        description: `"${created.nome}" foi cadastrado com sucesso.`,
      });

      return created;
    } catch (err) {
      console.error(err);
      setError("Não foi possível criar o ingrediente.");

      toast.error("Erro ao criar ingrediente", {
        description: "Verifique os dados e tente novamente.",
      });

      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function updateIngrediente(id: number, input: NovoIngredienteInput) {
    try {
      setSaving(true);
      setError(null);

      const res = await apiFetch(`${RESOURCE}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!res.ok) throw new Error("Falha ao atualizar ingrediente");

      const updated: Ingrediente = await res.json();
      setIngredientes((prev) => prev.map((i) => (i.id === id ? updated : i)));

      toast.success("Ingrediente atualizado", {
        description: `"${updated.nome}" foi atualizado com sucesso.`,
      });

      return updated;
    } catch (err) {
      console.error(err);
      setError("Não foi possível atualizar o ingrediente.");

      toast.error("Erro ao atualizar ingrediente", {
        description: "Tente novamente em instantes.",
      });

      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function deleteIngrediente(id: number) {
    try {
      setSaving(true);
      setError(null);

      const ingrediente = ingredientes.find((i) => i.id === id);

      const res = await apiFetch(`${RESOURCE}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao excluir ingrediente");

      setIngredientes((prev) => prev.filter((i) => i.id !== id));

      toast.success("Ingrediente excluído", {
        description: ingrediente
          ? `"${ingrediente.nome}" foi removido com sucesso.`
          : "O ingrediente foi removido com sucesso.",
      });
    } catch (err) {
      console.error(err);
      setError("Não foi possível excluir o ingrediente.");

      toast.error("Erro ao excluir ingrediente", {
        description: "Tente novamente em instantes.",
      });

      throw err;
    } finally {
      setSaving(false);
    }
  }

  return {
    ingredientes,
    loading,
    saving,
    error,
    fetchIngredientes,
    createIngrediente,
    updateIngrediente,
    deleteIngrediente,
  };
}
