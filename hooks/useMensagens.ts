import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
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

export function useMensagens() {
    const [modelos, setModelos] = useState<MensagemModelo[]>([]);
    const [historico, setHistorico] = useState<MensagemHistorico[]>([]);
    const [loading, setLoading] = useState(false);

    const loadModelos = useCallback(async () => {
        try {
            const { data } = await api.get("/mensagens/modelos");
            setModelos(data);
        } catch (error) {
            console.error("Erro ao carregar modelos", error);
        }
    }, []);

    const loadHistory = useCallback(async (clienteId?: number) => {
        try {
            const { data } = await api.get("/mensagens/historico", {
                params: { clienteId }
            });
            setHistorico(data);
        } catch (error) {
            console.error("Erro ao carregar histórico", error);
        }
    }, []);

    const saveModelo = async (data: { id?: number, titulo: string, corpo: string }) => {
        setLoading(true);
        try {
            if (data.id) {
                await api.put(`/mensagens/modelos/${data.id}`, data);
                toast.success("Modelo atualizado!");
            } else {
                await api.post("/mensagens/modelos", data);
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
            await api.delete(`/mensagens/modelos/${id}`);
            toast.success("Modelo removido!");
            await loadModelos();
        } catch (error) {
            toast.error("Não foi possível excluir este modelo");
        }
    };

    const prepareMessage = async (clienteId: number, modeloId: number, extraVars: Record<string, string> = {}) => {
        try {
            const { data } = await api.post("/mensagens/preparar", { clienteId, modeloId, extraVars });
            return data.textoFormatado as string;
        } catch (error) {
            toast.error("Erro ao preparar mensagem");
            return "";
        }
    };

    const registerSend = async (clienteId: number, modeloId: number, textoEnviado: string) => {
        try {
            await api.post("/mensagens/historico", { clienteId, modeloId, textoEnviado });
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
