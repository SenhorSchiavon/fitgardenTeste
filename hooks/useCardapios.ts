import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "./api";

export type CardapioOpcao = {
  id: number;
  opcaoId: number;
  opcaoNome?: string;
  opcaoTipo?: "MARMITA" | "OUTROS";
  opcaoCategoriaId?: number | null;
  opcaoCategoria?: string | null;
  componentes?: Array<{
    opcaoPreparoId: number;
    tipo: "CARBOIDRATO" | "PROTEINA" | "LEGUMES" | "FEIJAO" | "COMPLEMENTO";
    preparoId: number;
    preparoNome?: string | null;
    porcentagem: number;
    montadorId?: number | null;
    montadorNome?: string | null;
  }>;
  ordem: number;
  ativo: boolean;
};

export type Cardapio = {
  id: number;
  codigo: string;
  nome: string;
  ativo: boolean;
  imagens?: Array<{
    id: number;
    nome: string;
    mimeType: string;
    tamanho: number;
    url: string;
    createdAt: string;
  }>;
  opcoes: CardapioOpcao[];
};

type CardapioOpcaoInput = {
  opcaoId: number;
  ordem?: number;
  ativo?: boolean;
  montadores?: Array<{
    opcaoPreparoId: number;
    montadorId?: number | null;
  }>;
};

export type NovoCardapioInput = {
  codigo: string;
  nome: string;
  ativo?: boolean;
  opcoes?: CardapioOpcaoInput[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";
const RESOURCE = `${API_URL}/cardapios`;

export function useCardapios() {
  const [cardapios, setCardapios] = useState<Cardapio[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCardapios = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await apiFetch(RESOURCE, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Falha ao carregar cardápios");

      const data: Cardapio[] = await res.json();
      setCardapios(data);
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar os cardápios.");

      toast.error("Erro ao carregar cardápios", {
        description: "Tente novamente em instantes.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCardapios();
  }, [fetchCardapios]);

  async function createCardapio(input: NovoCardapioInput) {
    try {
      setSaving(true);
      setError(null);

      const res = await apiFetch(RESOURCE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const msg = await safeReadMessage(res);
        throw new Error(msg || "Falha ao criar cardápio");
      }

      const created: Cardapio = await res.json();
      setCardapios((prev) => [...prev, created]);

      toast.success("Cardápio criado", {
        description: `"${created.nome}" foi cadastrado com sucesso.`,
      });

      return created;
    } catch (err) {
      console.error(err);
      setError("Não foi possível criar o cardápio.");

      toast.error("Erro ao criar cardápio", {
        description: err instanceof Error ? err.message : "Verifique os dados e tente novamente.",
      });

      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function updateCardapio(id: number, input: NovoCardapioInput) {
    try {
      setSaving(true);
      setError(null);

      const res = await apiFetch(`${RESOURCE}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const msg = await safeReadMessage(res);
        throw new Error(msg || "Falha ao atualizar cardápio");
      }

      const updated: Cardapio = await res.json();
      setCardapios((prev) => prev.map((c) => (c.id === id ? updated : c)));

      toast.success("Cardápio atualizado", {
        description: `"${updated.nome}" foi atualizado com sucesso.`,
      });

      return updated;
    } catch (err) {
      console.error(err);
      setError("Não foi possível atualizar o cardápio.");

      toast.error("Erro ao atualizar cardápio", {
        description: err instanceof Error ? err.message : "Tente novamente em instantes.",
      });

      throw err;
    } finally {
      setSaving(false);
    }
  }
  async function setCardapioAtivo(id: number, ativo: boolean) {
    try {
      setSaving(true);
      setError(null);

      const res = await apiFetch(`${RESOURCE}/${id}/ativo`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo }),
      });

      if (!res.ok) {
        const msg = await safeReadMessage(res);
        throw new Error(msg || "Falha ao alterar status");
      }

      const updated: Cardapio = await res.json();
      setCardapios((prev) => prev.map((c) => (c.id === id ? updated : c)));

      toast.success("Status atualizado", {
        description: `Cardápio "${updated.nome}" agora está ${updated.ativo ? "ativo" : "inativo"}.`,
      });

      return updated;
    } catch (err) {
      console.error(err);
      setError("Não foi possível alterar o status do cardápio.");

      toast.error("Erro ao alterar status", {
        description: err instanceof Error ? err.message : "Tente novamente em instantes.",
      });

      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function deleteCardapio(id: number) {
    try {
      setSaving(true);
      setError(null);

      const cardapio = cardapios.find((c) => c.id === id);

      const res = await apiFetch(`${RESOURCE}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const msg = await safeReadMessage(res);
        throw new Error(msg || "Falha ao excluir cardápio");
      }

      setCardapios((prev) => prev.filter((c) => c.id !== id));

      toast.success("Cardápio excluído", {
        description: cardapio
          ? `"${cardapio.nome}" foi removido com sucesso.`
          : "O cardápio foi removido com sucesso.",
      });
    } catch (err) {
      console.error(err);
      setError("Não foi possível excluir o cardápio.");

      toast.error("Erro ao excluir cardápio", {
        description: err instanceof Error ? err.message : "Tente novamente em instantes.",
      });

      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function uploadCardapioImagem(id: number, file: File) {
    try {
      setSaving(true);
      setError(null);

      const base64 = await fileToBase64(file);
      const res = await apiFetch(`${RESOURCE}/${id}/imagens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: file.name,
          mimeType: file.type,
          base64,
        }),
      });

      if (!res.ok) {
        const msg = await safeReadMessage(res);
        throw new Error(msg || "Falha ao enviar imagem");
      }

      const imagem = await res.json();
      setCardapios((prev) =>
        prev.map((cardapio) =>
          cardapio.id === id
            ? { ...cardapio, imagens: [imagem, ...(cardapio.imagens || [])] }
            : cardapio,
        ),
      );
      toast.success("Imagem adicionada");
      return imagem;
    } catch (err) {
      toast.error("Erro ao enviar imagem", {
        description: err instanceof Error ? err.message : "Tente novamente.",
      });
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function deleteCardapioImagem(cardapioId: number, imagemId: number) {
    try {
      setSaving(true);
      const res = await apiFetch(`${RESOURCE}/${cardapioId}/imagens/${imagemId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const msg = await safeReadMessage(res);
        throw new Error(msg || "Falha ao remover imagem");
      }

      setCardapios((prev) =>
        prev.map((cardapio) =>
          cardapio.id === cardapioId
            ? { ...cardapio, imagens: (cardapio.imagens || []).filter((imagem) => imagem.id !== imagemId) }
            : cardapio,
        ),
      );
      toast.success("Imagem removida");
    } catch (err) {
      toast.error("Erro ao remover imagem", {
        description: err instanceof Error ? err.message : "Tente novamente.",
      });
      throw err;
    } finally {
      setSaving(false);
    }
  }

  return {
    cardapios,
    loading,
    saving,
    error,
    fetchCardapios,
    createCardapio,
    updateCardapio,
    deleteCardapio,
    setCardapioAtivo,
    uploadCardapioImagem,
    deleteCardapioImagem,
  };
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.readAsDataURL(file);
  });
}

async function safeReadMessage(res: Response) {
  try {
    const data = await res.json();
    return data?.message ? String(data.message) : null;
  } catch {
    return null;
  }
}
