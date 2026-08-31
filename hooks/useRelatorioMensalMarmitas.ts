"use client";

import { useCallback, useState } from "react";
import { apiFetch } from "./api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";
const RESOURCE = `${API_URL}/relatorios/mensal-marmitas`;

export type RelatorioMensalTipo = "todos" | "voucher" | "plano" | "normal";
export type RelatorioMensalTamanho = "200g" | "300g" | "400g" | "500g";
export type RelatorioMensalTotaisTamanho = Record<RelatorioMensalTamanho, number>;

export type RelatorioMensalLinha = {
  data: string;
  label: string;
  voucher: RelatorioMensalTotaisTamanho;
  plano: RelatorioMensalTotaisTamanho;
  normal: RelatorioMensalTotaisTamanho;
  total: number;
};

export type RelatorioMensalMarmitasResponse = {
  dataInicio: string;
  dataFim: string;
  tipo: RelatorioMensalTipo;
  tamanhos: RelatorioMensalTamanho[];
  linhas: RelatorioMensalLinha[];
  totais: {
    voucher: RelatorioMensalTotaisTamanho;
    plano: RelatorioMensalTotaisTamanho;
    normal: RelatorioMensalTotaisTamanho;
    total: number;
  };
};

function validarDataISO(dataStr: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dataStr);
}

export function useRelatorioMensalMarmitas() {
  const [data, setData] = useState<RelatorioMensalMarmitasResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRelatorioMensal = useCallback(async (params: { dataInicio: string; dataFim: string; tipo?: RelatorioMensalTipo }) => {
    const dataInicio = String(params.dataInicio || "").trim();
    const dataFim = String(params.dataFim || "").trim();
    const tipo = params.tipo || "todos";

    if (!validarDataISO(dataInicio) || !validarDataISO(dataFim)) {
      setError("Informe data inicial e final no formato correto.");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const qs = new URLSearchParams({ dataInicio, dataFim, tipo });
      const res = await apiFetch(`${RESOURCE}?${qs.toString()}`);
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.message || "Erro ao carregar relatório mensal");
      }

      setData(json as RelatorioMensalMarmitasResponse);
      return json as RelatorioMensalMarmitasResponse;
    } catch (e: any) {
      setError(e?.message || "Erro ao carregar relatório mensal");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, getRelatorioMensal };
}
