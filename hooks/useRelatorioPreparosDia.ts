"use client";

import { useCallback, useState } from "react";
import { apiFetch } from "./api";

export type RelatorioPreparoRow = {
  preparoId: number;
  nome: string;
  kgPronto: number;
  kgCru: number;
};

export type RelatorioPreparosDiaResponse = {
  data: string;
  prontos: RelatorioPreparoRow[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";
const RESOURCE = `${API_URL}/relatorios`;

function validarDataISO(dataStr: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dataStr);
}

export function useRelatorioPreparosDia() {
  const [data, setData] = useState<RelatorioPreparosDiaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRelatorio = useCallback(async (params: { data: string }) => {
    const dataStr = String(params.data || "").trim();

    if (!validarDataISO(dataStr)) {
      setData(null);
      setError("Data inválida. Use YYYY-MM-DD.");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const qs = new URLSearchParams({ data: dataStr });

      const res = await apiFetch(`${RESOURCE}/preparos?${qs.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.message || "Erro ao buscar relatório de preparos");
      }

      setData(json as RelatorioPreparosDiaResponse);
      return json as RelatorioPreparosDiaResponse;
    } catch (e: any) {
      setData(null);
      setError(e?.message || "Erro ao buscar relatório de preparos");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadDocx = useCallback(async (params: { data: string }) => {
    const dataStr = String(params.data || "").trim();

    if (!validarDataISO(dataStr)) {
      setError("Data inválida. Use YYYY-MM-DD.");
      return false;
    }

    setDownloading(true);
    setError(null);

    try {
      const qs = new URLSearchParams({ data: dataStr });

      const res = await apiFetch(`${RESOURCE}/preparos/docx?${qs.toString()}`, {
        method: "GET",
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.message || "Erro ao gerar DOCX");
      }

      const blob = await res.blob();

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-preparo-${dataStr}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      return true;
    } catch (e: any) {
      setError(e?.message || "Erro ao gerar DOCX");
      return false;
    } finally {
      setDownloading(false);
    }
  }, []);

  return { data, loading, downloading, error, getRelatorio, downloadDocx };
}