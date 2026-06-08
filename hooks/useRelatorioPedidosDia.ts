"use client";

import { useCallback, useState } from "react";
import { apiFetch } from "./api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";
const RESOURCE = `${API_URL}/relatorios`;

function validarDataISO(dataStr: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dataStr);
}

export function useRelatorioPedidosDia() {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadPdf = useCallback(async (params: { data: string }) => {
    const dataStr = String(params.data || "").trim();

    if (!validarDataISO(dataStr)) {
      setError("Data inválida. Use YYYY-MM-DD.");
      return false;
    }

    setDownloading(true);
    setError(null);

    try {
      const qs = new URLSearchParams({ data: dataStr });

      const res = await apiFetch(`${RESOURCE}/pedidos/pdf?${qs.toString()}`, {
        method: "GET",
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.message || "Erro ao gerar PDF");
      }

      const blob = await res.blob();

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-pedidos-${dataStr}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      return true;
    } catch (e: any) {
      setError(e?.message || "Erro ao gerar PDF");
      return false;
    } finally {
      setDownloading(false);
    }
  }, []);

  return { downloading, error, downloadPdf };
}
