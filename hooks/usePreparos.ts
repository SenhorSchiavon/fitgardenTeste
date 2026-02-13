import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "./api";

export type Medida = "UN" | "KG" | "L";
export type PreparoTipo = "CARBOIDRATO" | "PROTEINA" | "LEGUMES";

export type PreparoFichaItem = {
  id: number;
  ingredienteId: number;
  ingredienteNome: string;
  quantidade: number;
  medida: Medida;
  custo: number;
};

export type Preparo = {
  id: number;
  codigoSistema: string;
  nome: string;
  tipo: PreparoTipo;
  medida: Medida;
  custoTotal: number;
  fichaTecnica: PreparoFichaItem[];
};

type FichaTecnicaInput = {
  ingredienteId: number;
  quantidade: number;
};

type NovoPreparoInput = {
  nome: string;
  tipo: PreparoTipo;
  medida: Medida;
  fichaTecnica: FichaTecnicaInput[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";
const RESOURCE = `${API_URL}/preparos`;

export function usePreparos() {
  const [preparos, setPreparos] = useState<Preparo[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPreparos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await apiFetch(RESOURCE, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Falha ao carregar preparos");

      const data: Preparo[] = await res.json();
      setPreparos(data);
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar os preparos.");
      toast.error("Erro ao carregar preparos", { description: "Tente novamente em instantes." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreparos();
  }, [fetchPreparos]);

  async function createPreparo(input: NovoPreparoInput) {
    try {
      setSaving(true);
      setError(null);

      const res = await apiFetch(RESOURCE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!res.ok) throw new Error("Falha ao criar preparo");

      const created: Preparo = await res.json();
      setPreparos((prev) => [...prev, created]);

      toast.success("Preparo criado", {
        description: `"${created.nome}" foi cadastrado com sucesso.`,
      });

      return created;
    } catch (err) {
      console.error(err);
      setError("Não foi possível criar o preparo.");
      toast.error("Erro ao criar preparo", { description: "Verifique os dados e tente novamente." });
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function updatePreparo(id: number, input: NovoPreparoInput) {
    try {
      setSaving(true);
      setError(null);

      const res = await apiFetch(`${RESOURCE}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!res.ok) throw new Error("Falha ao atualizar preparo");

      const updated: Preparo = await res.json();
      setPreparos((prev) => prev.map((p) => (p.id === id ? updated : p)));

      toast.success("Preparo atualizado", {
        description: `"${updated.nome}" foi atualizado com sucesso.`,
      });

      return updated;
    } catch (err) {
      console.error(err);
      setError("Não foi possível atualizar o preparo.");
      toast.error("Erro ao atualizar preparo", { description: "Tente novamente em instantes." });
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function deletePreparo(id: number) {
    try {
      setSaving(true);
      setError(null);

      const preparo = preparos.find((p) => p.id === id);

      const res = await apiFetch(`${RESOURCE}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao excluir preparo");

      setPreparos((prev) => prev.filter((p) => p.id !== id));

      toast.success("Preparo excluído", {
        description: preparo ? `"${preparo.nome}" foi removido com sucesso.` : "O preparo foi removido com sucesso.",
      });
    } catch (err) {
      console.error(err);
      setError("Não foi possível excluir o preparo.");
      toast.error("Erro ao excluir preparo", { description: "Tente novamente em instantes." });
      throw err;
    } finally {
      setSaving(false);
    }
  }

  return {
    preparos,
    loading,
    saving,
    error,
    fetchPreparos,
    createPreparo,
    updatePreparo,
    deletePreparo,
  };
}
