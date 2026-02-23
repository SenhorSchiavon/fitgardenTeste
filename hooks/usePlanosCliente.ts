import { useCallback, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "./api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

export type Tamanho = {
  id: number;
  pesagemGramas: number;
};

export type PlanoCatalogo = {
  id: number;
  nome?: string | null;
  tamanhoId: number;
  unidades: number;
  tamanho?: Tamanho;
  createdAt?: string;
};

export type PlanoClienteVinculo = {
  id: number;
  clienteId: number;
  planoId: number;
  saldoUnidades?: number | null;
  saldoEntregas?: number | null;
  plano?: PlanoCatalogo & { tamanho?: Tamanho };
  createdAt?: string;
};

type CreatePlanoCatalogoInput = {
  tamanhoId: number;
  unidades: number;
  nome?: string | null;
};

export function usePlanosCliente() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const listTamanhos = useCallback(async () => {
    const res = await apiFetch(`${API_URL}/tamanhos`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Falha ao carregar tamanhos");
    return (await res.json()) as Tamanho[];
  }, []);

  // 1) LISTAR PLANOS (CATÁLOGO)
  const listPlanos = useCallback(async () => {
    const res = await apiFetch(`${API_URL}/planos`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Falha ao carregar planos");
    return (await res.json()) as PlanoCatalogo[];
  }, []);

  // 2) CRIAR PLANO (CATÁLOGO)
  const createPlano = useCallback(async (input: CreatePlanoCatalogoInput) => {
    try {
      setSaving(true);

      const res = await apiFetch(`${API_URL}/planos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || "Falha ao criar plano");
      }

      const created = (await res.json()) as PlanoCatalogo;

      toast.success("Plano criado", {
        description: `${created.nome?.trim() ? created.nome : "Plano"} ${created.tamanho?.pesagemGramas ?? ""}g (${created.unidades} un.)`,
      });

      return created;
    } catch (e) {
      console.error(e);
      toast.error("Erro ao criar plano", { description: "Tente novamente." });
      throw e;
    } finally {
      setSaving(false);
    }
  }, []);
  const listPlanosDoCliente = useCallback(async (clienteId: number) => {
    const res = await apiFetch(`${API_URL}/clientes/${clienteId}/planos`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      throw new Error(msg || "Falha ao carregar planos do cliente");
    }

    return (await res.json()) as PlanoClienteVinculo[];
  }, []);
  const vincularPlano = useCallback(async (clienteId: number, planoId: number) => {
    setSaving(true);
    try {
      const res = await apiFetch(`${API_URL}/clientes/${clienteId}/planos/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planoId }),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || "Falha ao vincular plano");
      }

      return (await res.json()) as PlanoClienteVinculo;
    } finally {
      setSaving(false);
    }
  }, []);

  const desvincularPlano = useCallback(async (clienteId: number, planoClienteId: number) => {
    setSaving(true);
    try {
      const res = await apiFetch(`${API_URL}/clientes/${clienteId}/planos/${planoClienteId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Falha ao remover plano");
    } finally {
      setSaving(false);
    }
  }, []);


  return {
    loading,
    saving,
    listTamanhos,
    listPlanos,
    listPlanosDoCliente,
    createPlano,
    vincularPlano,
    desvincularPlano,
  };
}
