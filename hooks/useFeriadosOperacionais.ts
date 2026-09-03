"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/hooks/api";

export type FeriadoOperacional = {
  data: string;
  descricao?: string;
  recorrenteAnual?: boolean;
};

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api").replace(/\/+$/, "");

function normalizarFeriado(item: any): FeriadoOperacional | null {
  const data = String(item?.data || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return null;
  const descricao = String(item?.descricao || "").trim();
  return {
    data,
    descricao: descricao || undefined,
    recorrenteAnual: item?.recorrenteAnual !== false,
  };
}

function ordenarFeriados(a: FeriadoOperacional, b: FeriadoOperacional) {
  return a.data.slice(5).localeCompare(b.data.slice(5)) || a.data.localeCompare(b.data);
}

export function dataEhFeriadoOperacional(dataISO: string, feriados: FeriadoOperacional[]) {
  if (!dataISO) return false;
  return feriados.some((feriado) => (
    feriado.recorrenteAnual === false
      ? feriado.data === dataISO
      : feriado.data.slice(5) === dataISO.slice(5)
  ));
}

export function useFeriadosOperacionais() {
  const [feriados, setFeriados] = useState<FeriadoOperacional[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const carregarFeriados = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch(`${API_URL}/feriados-operacionais`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || data?.error || "Erro ao carregar feriados");
      setFeriados((Array.isArray(data) ? data : []).map(normalizarFeriado).filter(Boolean) as FeriadoOperacional[]);
    } catch (error: any) {
      toast.error("Não foi possível carregar os feriados", { description: error?.message });
    } finally {
      setLoading(false);
    }
  }, []);

  const salvarFeriados = useCallback(async (lista: FeriadoOperacional[]) => {
    setSaving(true);
    try {
      const feriadosNormalizados = lista
        .map(normalizarFeriado)
        .filter(Boolean)
        .sort(ordenarFeriados) as FeriadoOperacional[];
      const response = await apiFetch(`${API_URL}/feriados-operacionais`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feriados: feriadosNormalizados }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || data?.error || "Erro ao salvar feriados");
      const salvos = (Array.isArray(data) ? data : []).map(normalizarFeriado).filter(Boolean) as FeriadoOperacional[];
      setFeriados(salvos);
      toast.success("Feriados salvos");
      return salvos;
    } catch (error: any) {
      toast.error("Não foi possível salvar os feriados", { description: error?.message });
      throw error;
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    void carregarFeriados();
  }, [carregarFeriados]);

  const feriadosOrdenados = useMemo(() => [...feriados].sort(ordenarFeriados), [feriados]);

  return {
    feriados: feriadosOrdenados,
    loading,
    saving,
    carregarFeriados,
    salvarFeriados,
  };
}
