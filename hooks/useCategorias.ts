import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "./api";

export type CategoriaTipo = "INGREDIENTE" | "PRODUTO";

export type Categoria = {
  id: number;
  codigoSistema: string;
  descricao: string;
  tipo: "INGREDIENTE" | "PRODUTO";
};


type NovaCategoriaInput = {
  descricao: string;
  tipo: CategoriaTipo;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";
const RESOURCE = `${API_URL}/categorias`;

export function useCategorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategorias = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await apiFetch(RESOURCE, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error("Falha ao carregar categorias");
      }

      const data: Categoria[] = await res.json();
      setCategorias(data);
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar as categorias.");

      toast.error("Erro ao carregar categorias", {
        description: "Tente novamente em instantes.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategorias();
  }, [fetchCategorias]);

  async function createCategoria(input: NovaCategoriaInput) {
    try {
      setSaving(true);
      setError(null);

      const res = await apiFetch(RESOURCE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        throw new Error("Falha ao criar categoria");
      }

      const created: Categoria = await res.json();
      setCategorias((prev) => [...prev, created]);

      toast.success("Categoria criada", {
        description: "A categoria foi cadastrada com sucesso.",
      });

      return created;
    } catch (err) {
      console.error(err);
      setError("Não foi possível criar a categoria.");

      toast.error("Erro ao criar categoria", {
        description: "Verifique os dados e tente novamente.",
      });

      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function updateCategoria(id: number, input: NovaCategoriaInput) {
    try {
      setSaving(true);
      setError(null);

      const res = await apiFetch(`${RESOURCE}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        throw new Error("Falha ao atualizar categoria");
      }

      const updated: Categoria = await res.json();

      setCategorias((prev) => prev.map((cat) => (cat.id === id ? updated : cat)));

      toast.success("Categoria atualizada", {
        description: "A categoria foi atualizada com sucesso.",
      });

      return updated;
    } catch (err) {
      console.error(err);
      setError("Não foi possível atualizar a categoria.");

      toast.error("Erro ao atualizar categoria", {
        description: "Tente novamente em instantes.",
      });

      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategoria(id: number) {
    try {
      setSaving(true);
      setError(null);

      const categoria = categorias.find((c) => c.id === id);

      const res = await apiFetch(`${RESOURCE}/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Falha ao excluir categoria");
      }

      setCategorias((prev) => prev.filter((cat) => cat.id !== id));

      toast.success("Categoria excluída", {
        description: categoria
          ? `"${categoria.descricao}" foi removida com sucesso.`
          : "Categoria removida com sucesso.",
      });
    } catch (err) {
      console.error(err);
      setError("Não foi possível excluir a categoria.");

      toast.error("Erro ao excluir categoria", {
        description: "Tente novamente em instantes.",
      });

      throw err;
    } finally {
      setSaving(false);
    }
  }

  return {
    categorias,
    loading,
    saving,
    error,
    fetchCategorias,
    createCategoria,
    updateCategoria,
    deleteCategoria,
  };
}
