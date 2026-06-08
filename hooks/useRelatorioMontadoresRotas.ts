"use client";

import { useCallback, useState } from "react";
import { apiFetch } from "./api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";
const RESOURCE = `${API_URL}/relatorios`;

function validarDataISO(dataStr: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dataStr);
}

export function useRelatorioMontadoresRotas() {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abrirCupomElgin = useCallback(async (params: { data: string }) => {
    const dataStr = String(params.data || "").trim();

    if (!validarDataISO(dataStr)) {
      setError("Data invÃ¡lida. Use YYYY-MM-DD.");
      return false;
    }

    setDownloading(true);
    setError(null);

    try {
      const qs = new URLSearchParams({ data: dataStr });
      const res = await apiFetch(`${RESOURCE}/montadores-rotas/elgin?${qs.toString()}`, {
        method: "GET",
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.message || "Erro ao gerar cupom Elgin");
      }

      const html = await res.text();
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => window.URL.revokeObjectURL(url), 60_000);

      return true;
    } catch (e: any) {
      setError(e?.message || "Erro ao gerar cupom Elgin");
      return false;
    } finally {
      setDownloading(false);
    }
  }, []);

  return { downloading, error, abrirCupomElgin };
}
