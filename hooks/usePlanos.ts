import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export type Tamanho = {
  id: number;
  pesagemGramas: number;
  valorUnitario: number;
  valor10: number;
  valor20: number;
  valor40: number;
};

export type Plano = {
  id: number;
  nome: string;
  tamanhoId: number;

  unidades: number;
  entregasInclusas: number;

  valor: number;
  ativo: boolean;

  tamanho?: Tamanho;
};

export type NovoPlanoInput = {
  nome: string;
  tamanhoId: number;
  unidades: number;
  entregasInclusas: number;
  valor: number;
  ativo: boolean;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";
const RESOURCE = `${API_URL}/planos`;
const TAMANHOS_RESOURCE = `${API_URL}/tamanhos`;

function toNumber(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function usePlanos() {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [tamanhos, setTamanhos] = useState<Tamanho[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTamanhos = useCallback(async () => {
    try {
      const res = await fetch(TAMANHOS_RESOURCE, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Falha ao carregar tamanhos");
      const data: Tamanho[] = await res.json();
      setTamanhos(data);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar tamanhos", {
        description: "Tente novamente em instantes.",
      });
    }
  }, []);

  const fetchPlanos = useCallback(async (search?: string) => {
    try {
      setLoading(true);
      setError(null);

      const url = new URL(RESOURCE);
      if (search?.trim()) url.searchParams.set("search", search.trim());

      const res = await fetch(url.toString(), {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Falha ao carregar planos");

      const data: Plano[] = await res.json();
      setPlanos(data);
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar os planos.");
      toast.error("Erro ao carregar planos", {
        description: "Tente novamente em instantes.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTamanhos();
    fetchPlanos();
  }, [fetchTamanhos, fetchPlanos]);

  async function createPlano(input: NovoPlanoInput) {
    try {
      setSaving(true);
      setError(null);

      const payload: NovoPlanoInput = {
        nome: String(input.nome || "").trim(),
        tamanhoId: toNumber(input.tamanhoId),
        unidades: toNumber(input.unidades),
        entregasInclusas: toNumber(input.entregasInclusas),
        valor: toNumber(input.valor),
        ativo: !!input.ativo,
      };

      const res = await fetch(RESOURCE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Falha ao criar plano");

      const created: Plano = await res.json();
      setPlanos((prev) => [...prev, created]);

      toast.success("Plano criado", {
        description: `"${created.nome}" foi cadastrado com sucesso.`,
      });

      return created;
    } catch (err) {
      console.error(err);
      setError("Não foi possível criar o plano.");
      toast.error("Erro ao criar plano", {
        description: "Verifique os dados e tente novamente.",
      });
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function updatePlano(id: number, input: NovoPlanoInput) {
    try {
      setSaving(true);
      setError(null);

      const payload: NovoPlanoInput = {
        nome: String(input.nome || "").trim(),
        tamanhoId: toNumber(input.tamanhoId),
        unidades: toNumber(input.unidades),
        entregasInclusas: toNumber(input.entregasInclusas),
        valor: toNumber(input.valor),
        ativo: !!input.ativo,
      };

      const res = await fetch(`${RESOURCE}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Falha ao atualizar plano");

      const updated: Plano = await res.json();
      setPlanos((prev) => prev.map((p) => (p.id === id ? updated : p)));

      toast.success("Plano atualizado", {
        description: `"${updated.nome}" foi atualizado com sucesso.`,
      });

      return updated;
    } catch (err) {
      console.error(err);
      setError("Não foi possível atualizar o plano.");
      toast.error("Erro ao atualizar plano", {
        description: "Tente novamente em instantes.",
      });
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function deletePlano(id: number) {
    try {
      setSaving(true);
      setError(null);

      const plano = planos.find((p) => p.id === id);

      const res = await fetch(`${RESOURCE}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao excluir plano");

      setPlanos((prev) => prev.filter((p) => p.id !== id));

      toast.success("Plano excluído", {
        description: plano
          ? `"${plano.nome}" foi removido com sucesso.`
          : "O plano foi removido com sucesso.",
      });
    } catch (err) {
      console.error(err);
      setError("Não foi possível excluir o plano.");
      toast.error("Erro ao excluir plano", {
        description: "Tente novamente em instantes.",
      });
      throw err;
    } finally {
      setSaving(false);
    }
  }

  const tamanhosOrdenados = useMemo(() => {
    return [...tamanhos].sort((a, b) => a.pesagemGramas - b.pesagemGramas);
  }, [tamanhos]);

  return {
    planos,
    tamanhos: tamanhosOrdenados,
    loading,
    saving,
    error,
    fetchPlanos,
    fetchTamanhos,
    createPlano,
    updatePlano,
    deletePlano,
  };
}
