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
  pago?: boolean;
  cliente?: {
    id: number;
    nome?: string;
    telefone?: string;
  };
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
  const vincularPlano = useCallback(
    async (clienteId: number, planoId: number, pago: boolean = false) => {
      setSaving(true);
      try {
        const res = await apiFetch(`${API_URL}/clientes/${clienteId}/planos/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planoId, pago }),
        });

        if (!res.ok) {
          const msg = await res.text().catch(() => "");
          throw new Error(msg || "Falha ao vincular plano");
        }

        const data = (await res.json()) as PlanoClienteVinculo;
        toast.success("Plano vinculado com sucesso!");
        return data;
      } catch (e: any) {
        console.error(e);
        toast.error("Erro ao vincular plano", {
          description: e?.message || "Tente novamente.",
        });
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const desvincularPlano = useCallback(
    async (clienteId: number, planoClienteId: number) => {
      setSaving(true);
      try {
        const res = await apiFetch(
          `${API_URL}/clientes/${clienteId}/planos/${planoClienteId}`,
          {
            method: "DELETE",
          },
        );

        if (!res.ok) throw new Error("Falha ao remover plano");

        toast.success("Plano desvinculado!");
      } catch (e: any) {
        console.error(e);
        toast.error("Erro ao desvincular plano", {
          description: e?.message || "Tente novamente.",
        });
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [],
  );


  const listPlanosNaoPagos = useCallback(async () => {
    const res = await apiFetch(`${API_URL}/planos-cliente/nao-pagos`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      throw new Error(msg || "Falha ao carregar planos não pagos");
    }

    return (await res.json()) as PlanoClienteVinculo[];
  }, []);

  const marcarPlanoComoPago = useCallback(async (planoClienteId: number) => {
    setSaving(true);
    try {
      const res = await apiFetch(`${API_URL}/planos-cliente/${planoClienteId}/pago`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || "Falha ao marcar plano como pago");
      }

      toast.success("Plano marcado como pago!");
    } catch (e: any) {
      console.error(e);
      toast.error("Erro ao marcar plano como pago", {
        description: e?.message || "Tente novamente.",
      });
      throw e;
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
    listPlanosNaoPagos,
    marcarPlanoComoPago,
  };
}
