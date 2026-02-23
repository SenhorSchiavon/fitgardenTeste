"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "./api";



export type EnderecoCliente = {
  id?: number;
  principal: boolean;
  endereco?: string | null;
  cep?: string | null;
  uf?: string | null;
  cidade?: string | null;
  bairro?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;

  latitude?: number | null;
  longitude?: number | null;

  createdAt?: string;
  updatedAt?: string;
};

export type PlanoCliente = {
  id: number;
  clienteId: number;
  tamanhoId: number;
  saldoUnidades: number;
  saldoEntregas: number;
  tamanho?: { id: number; pesagemGramas: number };
  createdAt?: string;
  updatedAt?: string;
};
function formatEndereco(e?: any) {
  if (!e) return "";
  if (e.endereco?.trim()) return String(e.endereco).trim();

  const parts = [
    e.logradouro,
    e.numero ? `nº ${e.numero}` : null,
    e.bairro,
    e.cidade ? `${e.cidade}${e.uf ? `/${e.uf}` : ""}` : null,
    e.cep ? `CEP ${e.cep}` : null,
    e.complemento,
  ]
    .filter(Boolean)
    .map((x) => String(x).trim())
    .filter(Boolean);

  return parts.join(" • ");
}
export type Cliente = {
  id: number;
  nome: string;
  telefone: string;
  dataNascimento?: string | null;

  enderecos: EnderecoCliente[];
  tags: { id: number; tag: string }[];
  planos: PlanoCliente[];

  createdAt?: string;
  updatedAt?: string;
};

export type CriarAtualizarClienteInput = {
  nome: string;
  telefone: string;
  enderecos?: EnderecoCliente[];
  tags?: string[];
};

function getApiUrl() {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) return "";
  return base.replace(/\/+$/, "");
}

async function http<T>(path: string, init?: RequestInit) {
  const base = getApiUrl();
  const url = `${base}${path}`;

  const res = await apiFetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    let msg = "Erro na requisição.";
    try {
      const data = await res.json();
      msg = data?.message || data?.error || msg;
    } catch { }
    throw new Error(msg);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function useClientes() {
  const { toast } = useToast();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const getClientes = useCallback(
    async (searchValue?: string) => {
      setLoading(true);
      try {
        const q = (searchValue ?? search)?.trim();
        const query = q ? `?search=${encodeURIComponent(q)}` : "";
        const data = await http<Cliente[]>(`/clientes${query}`);
        setClientes(data);
      } catch (e: any) {
        toast({
          title: "Erro ao carregar clientes",
          description: e?.message || "Tente novamente.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [search, toast],
  );

  useEffect(() => {
    getClientes();
  }, [getClientes]);

  const createCliente = useCallback(
    async (payload: CriarAtualizarClienteInput) => {
      setSaving(true);
      try {
        const created = await http<Cliente>("/clientes", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        setClientes((p) => [...p, created].sort((a, b) => a.nome.localeCompare(b.nome)));
        toast({ title: "Cliente criado", description: "Cadastro salvo com sucesso." });
        return created;
      } catch (e: any) {
        toast({
          title: "Erro ao criar cliente",
          description: e?.message || "Tente novamente.",
          variant: "destructive",
        });
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [toast],
  );

  const updateCliente = useCallback(
    async (id: number, payload: CriarAtualizarClienteInput) => {
      setSaving(true);
      try {
        const updated = await http<Cliente>(`/clientes/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });

        setClientes((p) => p.map((c) => (c.id === id ? updated : c)).sort((a, b) => a.nome.localeCompare(b.nome)));
        toast({ title: "Cliente atualizado", description: "Alterações salvas com sucesso." });
        return updated;
      } catch (e: any) {
        toast({
          title: "Erro ao atualizar cliente",
          description: e?.message || "Tente novamente.",
          variant: "destructive",
        });
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [toast],
  );

  const deleteCliente = useCallback(
    async (id: number) => {
      setSaving(true);
      try {
        await http<void>(`/clientes/${id}`, { method: "DELETE" });
        setClientes((p) => p.filter((c) => c.id !== id));
        toast({ title: "Cliente excluído" });
      } catch (e: any) {
        toast({
          title: "Erro ao excluir cliente",
          description: e?.message || "Tente novamente.",
          variant: "destructive",
        });
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [toast],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clientes;

    return clientes.filter((c) => {
      const principal = c.enderecos?.find((e) => e.principal)?.endereco || "";
      return (
        c.nome.toLowerCase().includes(q) ||
        (c.telefone || "").includes(q) ||
        principal.toLowerCase().includes(q)
      );
    });
  }, [clientes, search]);

  return {
    clientes,
    filteredClientes: filtered,

    search,
    setSearch,

    loading,
    saving,

    refresh: getClientes,
    createCliente,
    updateCliente,
    deleteCliente,
  };
}
