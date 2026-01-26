import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export type OpcaoTipo = "MARMITA" | "OUTROS";
export type OpcaoCategoria = "FIT" | "LOW_CARB" | "VEGETARIANO" | "SOPA";
export type ComponenteTipo = "CARBOIDRATO" | "PROTEINA" | "LEGUMES";

export type OpcaoComponente = {
  tipo: ComponenteTipo;
  preparoId: number;
  preparoNome?: string; // opcional (caso o backend devolva junto)
  porcentagem: number; // int
};

export type Opcao = {
  id: number;
  tipo: OpcaoTipo;
  nome: string;
  categoria: OpcaoCategoria | null;

  componentes: OpcaoComponente[]; // pra OUTROS pode vir []
};

type NovaOpcaoInput = {
  tipo: OpcaoTipo;
  nome: string;
  categoria?: OpcaoCategoria | null;
  componentes?: Array<{
    tipo: ComponenteTipo;
    preparoId: number;
    porcentagem: number;
  }>;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";
const RESOURCE = `${API_URL}/opcoes`;

export function useOpcoes() {
  const [opcoes, setOpcoes] = useState<Opcao[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOpcoes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(RESOURCE, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Falha ao carregar opções");

      const data: Opcao[] = await res.json();
      setOpcoes(data);
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar as opções.");

      toast.error("Erro ao carregar opções", {
        description: "Tente novamente em instantes.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOpcoes();
  }, [fetchOpcoes]);

  async function createOpcao(input: NovaOpcaoInput) {
    try {
      setSaving(true);
      setError(null);

      const res = await fetch(RESOURCE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!res.ok) throw new Error("Falha ao criar opção");

      const created: Opcao = await res.json();
      setOpcoes((prev) => [...prev, created]);

      toast.success("Opção criada", {
        description: `"${created.nome}" foi cadastrada com sucesso.`,
      });

      return created;
    } catch (err) {
      console.error(err);
      setError("Não foi possível criar a opção.");

      toast.error("Erro ao criar opção", {
        description: "Verifique os dados e tente novamente.",
      });

      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function updateOpcao(id: number, input: NovaOpcaoInput) {
    try {
      setSaving(true);
      setError(null);

      const res = await fetch(`${RESOURCE}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!res.ok) throw new Error("Falha ao atualizar opção");

      const updated: Opcao = await res.json();
      setOpcoes((prev) => prev.map((o) => (o.id === id ? updated : o)));

      toast.success("Opção atualizada", {
        description: `"${updated.nome}" foi atualizada com sucesso.`,
      });

      return updated;
    } catch (err) {
      console.error(err);
      setError("Não foi possível atualizar a opção.");

      toast.error("Erro ao atualizar opção", {
        description: "Tente novamente em instantes.",
      });

      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function deleteOpcao(id: number) {
    try {
      setSaving(true);
      setError(null);

      const opcao = opcoes.find((o) => o.id === id);

      const res = await fetch(`${RESOURCE}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao excluir opção");

      setOpcoes((prev) => prev.filter((o) => o.id !== id));

      toast.success("Opção excluída", {
        description: opcao
          ? `"${opcao.nome}" foi removida com sucesso.`
          : "A opção foi removida com sucesso.",
      });
    } catch (err) {
      console.error(err);
      setError("Não foi possível excluir a opção.");

      toast.error("Erro ao excluir opção", {
        description: "Tente novamente em instantes.",
      });

      throw err;
    } finally {
      setSaving(false);
    }
  }

  return {
    opcoes,
    loading,
    saving,
    error,
    fetchOpcoes,
    createOpcao,
    updateOpcao,
    deleteOpcao,
  };
}
