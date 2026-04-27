"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "./api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

export type DashboardData = {
  metrics: {
    receitaTotal: number;
    novosClientesMes: number;
    pedidosSemana: number;
    ticketMedio: number;
    totalClientes: number;
  };
  vendasSemanais: { data: string; total: number }[];
  maisVendidos: { nome: string; quantidade: number }[];
  pedidosRecentes: {
    id: number;
    clienteNome: string;
    valorTotal: number;
    createdAt: string;
  }[];
};

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`${API_URL}/relatorios/metrics`);
      if (!res.ok) throw new Error("Erro ao carregar dados do dashboard");
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e?.message || "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
