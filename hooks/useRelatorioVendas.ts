"use client";

import { useCallback, useState } from "react";
import { apiFetch } from "./api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";
const RESOURCE = `${API_URL}/relatorios/vendas-analytics`;

export type VendaItem = {
  nome: string;
  quantidade: number;
  valor: number;
};

export type VendaCliente = {
  nome: string;
  pedidos: number;
  valor: number;
};

export type TipoEntrega = {
  tipo: string;
  quantidade: number;
  valor: number;
};

export type FormaPagamento = {
  forma: string;
  valor: number;
};

export type RelatorioVendasResponse = {
  itens: VendaItem[];
  clientes: VendaCliente[];
  tiposEntrega: TipoEntrega[];
  formasPagamento: FormaPagamento[];
};

export function useRelatorioVendas() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RelatorioVendasResponse | null>(null);

  const getRelatorioVendas = useCallback(async (periodo: string = "mes") => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`${RESOURCE}?periodo=${periodo}`);
      if (!res.ok) throw new Error("Erro ao carregar relatórios");
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e?.message || "Erro ao carregar relatórios");
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, data, getRelatorioVendas };
}
