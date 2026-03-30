import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { apiFetch } from "./api";

export type RegraPrecoTipo = "PROTEINA" | "PESO_TOTAL";

export type RegraPrecoPersonalizada = {
  id: number;
  tipo: RegraPrecoTipo;
  limite: number;
  preco: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api";
const RESOURCE = `${API_URL}/regras-personalizada`;

export function useRegrasPersonalizadas() {
  const [regras, setRegras] = useState<RegraPrecoPersonalizada[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const carregarRegras = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch(RESOURCE, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Falha ao carregar regras");

      const data: RegraPrecoPersonalizada[] = await res.json();
      setRegras(data);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar regras de pre\u00e7o.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarRegras();
  }, [carregarRegras]);

  const criarRegra = async (data: { tipo: RegraPrecoTipo; limite: number; preco: number }) => {
    try {
      setSaving(true);
      const res = await apiFetch(RESOURCE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Falha ao criar regra");

      const created: RegraPrecoPersonalizada = await res.json();
      setRegras((prev) => [...prev, created]);
      toast.success("Regra adicionada com sucesso!");
      return created;
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar regra.");
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const atualizarRegra = async (id: number, data: { tipo: RegraPrecoTipo; limite: number; preco: number }) => {
    try {
      setSaving(true);
      const res = await apiFetch(`${RESOURCE}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Falha ao atualizar regra");

      const updated: RegraPrecoPersonalizada = await res.json();
      setRegras((prev) => prev.map((r) => (r.id === id ? updated : r)));
      toast.success("Regra atualizada com sucesso!");
      return updated;
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar regra.");
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const deletarRegra = async (id: number) => {
    try {
      setSaving(true);
      const res = await apiFetch(`${RESOURCE}/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Falha ao remover regra");

      setRegras((prev) => prev.filter((r) => r.id !== id));
      toast.success("Regra removida!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao remover regra.");
      throw error;
    } finally {
      setSaving(false);
    }
  };

  return {
    regras,
    loading,
    saving,
    carregarRegras,
    criarRegra,
    atualizarRegra,
    deletarRegra,
  };
}
