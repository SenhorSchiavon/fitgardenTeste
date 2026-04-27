import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "./api";
import { toast } from "sonner";

export interface MensagemModelo {
    id: number;
    titulo: string;
    corpo: string;
    tipo: 'PADRAO' | 'PERSONALIZADO';
}

export interface MensagemHistorico {
    id: number;
    clienteId: number;
    cliente: { nome: string };
    modelo?: { titulo: string };
    textoEnviado: string;
    createdAt: string;
}

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

export function useMensagens() {
    const [modelos, setModelos] = useState<MensagemModelo[]>([]);
    const [historico, setHistorico] = useState<MensagemHistorico[]>([]);
    const [loading, setLoading] = useState(false);

    const loadModelos = useCallback(async () => {
        try {
            const data = await http<MensagemModelo[]>("/mensagens/modelos");
            setModelos(data);
        } catch (error) {
            console.error("Erro ao carregar modelos", error);
        }
    }, []);

    const loadHistory = useCallback(async (clienteId?: number) => {
        try {
            const query = clienteId ? `?clienteId=${clienteId}` : "";
            const data = await http<MensagemHistorico[]>(`/mensagens/historico${query}`);
            setHistorico(data);
        } catch (error) {
            console.error("Erro ao carregar histórico", error);
        }
    }, []);

    const saveModelo = async (data: { id?: number, titulo: string, corpo: string }) => {
        setLoading(true);
        try {
            if (data.id) {
                await http(`/mensagens/modelos/${data.id}`, {
                    method: "PUT",
                    body: JSON.stringify(data)
                });
                toast.success("Modelo atualizado!");
            } else {
                await http("/mensagens/modelos", {
                    method: "POST",
                    body: JSON.stringify(data)
                });
                toast.success("Modelo criado!");
            }
            await loadModelos();
        } catch (error) {
            toast.error("Erro ao salvar modelo");
        } finally {
            setLoading(false);
        }
    };

    const deleteModelo = async (id: number) => {
        try {
            await http(`/mensagens/modelos/${id}`, { method: "DELETE" });
            toast.success("Modelo removido!");
            await loadModelos();
        } catch (error) {
            toast.error("Não foi possível excluir este modelo");
        }
    };

    const prepareMessage = async (clienteId: number, modeloId: number, extraVars: Record<string, string> = {}) => {
        try {
            const data = await http<{ textoFormatado: string }>("/mensagens/preparar", {
                method: "POST",
                body: JSON.stringify({ clienteId, modeloId, extraVars })
            });
            return data.textoFormatado;
        } catch (error) {
            toast.error("Erro ao preparar mensagem");
            return "";
        }
    };

    const registerSend = async (clienteId: number, modeloId: number, textoEnviado: string) => {
        try {
            await http("/mensagens/historico", {
                method: "POST",
                body: JSON.stringify({ clienteId, modeloId, textoEnviado })
            });
            loadHistory();
        } catch (error) {
            console.error("Erro ao registrar envio", error);
        }
    };

    useEffect(() => {
        loadModelos();
        loadHistory();
    }, [loadModelos, loadHistory]);

    return {
        modelos,
        historico,
        loading,
        saveModelo,
        deleteModelo,
        prepareMessage,
        registerSend,
        refresh: () => { loadModelos(); loadHistory(); }
    };
}
