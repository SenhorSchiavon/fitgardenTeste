"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "./api";

export type WhatsAppContact = {
  id: number;
  name?: string | null;
  phone: string;
};

export type WhatsAppMessage = {
  id: number;
  conversationId: number;
  direction: "INBOUND" | "OUTBOUND";
  type: "TEXT";
  body: string;
  whatsappMessageId?: string | null;
  status: "RECEIVED" | "SENT" | "DELIVERED" | "READ" | "FAILED";
  createdAt: string;
};

export type WhatsAppConversation = {
  id: number;
  contactId: number;
  status: "OPEN" | "CLOSED";
  lastMessageAt?: string | null;
  contact: WhatsAppContact;
  messages: WhatsAppMessage[];
};

export type WhatsAppAutoReply = {
  id: number;
  keyword: string;
  response: string;
  active: boolean;
};

export type WhatsAppBroadcast = {
  id: number;
  title: string;
  message: string;
  createdAt: string;
  recipients: {
    id: number;
    status: string;
    errorMessage?: string | null;
    contact: WhatsAppContact;
  }[];
};

function getApiUrl() {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) return "";
  return base.replace(/\/+$/, "");
}

async function http<T>(path: string, init?: RequestInit) {
  const res = await apiFetch(`${getApiUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    let msg = "Erro na requisicao.";
    try {
      const data = await res.json();
      msg = data?.message || data?.error || msg;
    } catch {}
    throw new Error(msg);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function useWhatsApp() {
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [contacts, setContacts] = useState<WhatsAppContact[]>([]);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [autoReplies, setAutoReplies] = useState<WhatsAppAutoReply[]>([]);
  const [broadcasts, setBroadcasts] = useState<WhatsAppBroadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadConversations = useCallback(async () => {
    const data = await http<WhatsAppConversation[]>("/whatsapp/conversations");
    setConversations(data);
    return data;
  }, []);

  const loadContacts = useCallback(async () => {
    const data = await http<WhatsAppContact[]>("/whatsapp/contacts");
    setContacts(data);
    return data;
  }, []);

  const loadAutoReplies = useCallback(async () => {
    const data = await http<WhatsAppAutoReply[]>("/whatsapp/auto-replies");
    setAutoReplies(data);
    return data;
  }, []);

  const loadBroadcasts = useCallback(async () => {
    const data = await http<WhatsAppBroadcast[]>("/whatsapp/broadcasts");
    setBroadcasts(data);
    return data;
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadConversations(), loadContacts(), loadAutoReplies(), loadBroadcasts()]);
    } catch (error: any) {
      toast.error(error?.message || "Erro ao carregar WhatsApp");
    } finally {
      setLoading(false);
    }
  }, [loadAutoReplies, loadBroadcasts, loadContacts, loadConversations]);

  const loadMessages = useCallback(async (conversationId: number) => {
    const data = await http<WhatsAppMessage[]>(`/whatsapp/conversations/${conversationId}/messages`);
    setMessages(data);
    return data;
  }, []);

  const sendMessage = useCallback(
    async (conversationId: number, body: string) => {
      setSending(true);
      try {
        await http<WhatsAppMessage>(`/whatsapp/conversations/${conversationId}/messages`, {
          method: "POST",
          body: JSON.stringify({ body }),
        });
        await Promise.all([loadMessages(conversationId), loadConversations()]);
        toast.success("Mensagem enviada");
      } catch (error: any) {
        toast.error(error?.message || "Erro ao enviar mensagem");
        throw error;
      } finally {
        setSending(false);
      }
    },
    [loadConversations, loadMessages],
  );

  const saveAutoReply = useCallback(
    async (data: { id?: number; keyword: string; response: string; active: boolean }) => {
      const path = data.id ? `/whatsapp/auto-replies/${data.id}` : "/whatsapp/auto-replies";
      await http(path, {
        method: data.id ? "PUT" : "POST",
        body: JSON.stringify(data),
      });
      await loadAutoReplies();
      toast.success("Resposta automatica salva");
    },
    [loadAutoReplies],
  );

  const deleteAutoReply = useCallback(
    async (id: number) => {
      await http(`/whatsapp/auto-replies/${id}`, { method: "DELETE" });
      await loadAutoReplies();
      toast.success("Resposta automatica removida");
    },
    [loadAutoReplies],
  );

  const sendBroadcast = useCallback(
    async (data: { title: string; message: string; contactIds: number[] }) => {
      setSending(true);
      try {
        await http("/whatsapp/broadcasts", {
          method: "POST",
          body: JSON.stringify(data),
        });
        await Promise.all([loadBroadcasts(), loadConversations()]);
        toast.success("Transmissao processada");
      } catch (error: any) {
        toast.error(error?.message || "Erro ao enviar transmissao");
        throw error;
      } finally {
        setSending(false);
      }
    },
    [loadBroadcasts, loadConversations],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    conversations,
    contacts,
    messages,
    autoReplies,
    broadcasts,
    loading,
    sending,
    refresh,
    loadMessages,
    sendMessage,
    saveAutoReply,
    deleteAutoReply,
    sendBroadcast,
  };
}
