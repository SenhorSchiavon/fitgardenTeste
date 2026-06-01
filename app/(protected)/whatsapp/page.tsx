"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarPlus,
  Check,
  Edit3,
  Lock,
  Plus,
  RefreshCcw,
  Search,
  Send,
  Tags,
  Trash2,
  Unlock,
  Users,
} from "lucide-react";

import { Header } from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  WhatsAppAutoReply,
  WhatsAppConversation,
  WhatsAppLabel,
  WhatsAppQuickReply,
  useWhatsApp,
} from "@/hooks/useWhatsApp";
import { NovoAgendamentoNovoLayout } from "../agendamentos/agendamento-cadastro";
import { useAgendamentos } from "@/hooks/useAgendamentos";
import { useCardapios } from "@/hooks/useCardapios";
import { useClientes } from "@/hooks/useClientes";
import { useOpcoesDoCardapio } from "@/hooks/useOpcoesDoCardapio";
import { usePreparosSelecionaveis } from "@/hooks/usePreparosSelecionaveis";
import { useSalgados } from "@/hooks/useSalgados";
import { useTamanhos } from "@/hooks/useTamanhos";

function displayPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length >= 12) {
    const ddd = digits.slice(2, 4);
    const number = digits.slice(4);
    return `(${ddd}) ${number}`;
  }
  return phone;
}

function contactName(conversation: WhatsAppConversation) {
  return conversation.contact.name || displayPhone(conversation.contact.phone);
}

function normalizePhone(phone?: string | null) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("55") ? digits : `55${digits}`;
}

function formatEndereco(e?: any) {
  if (!e) return "";
  if (e.endereco?.trim()) return String(e.endereco).trim();
  return [e.logradouro, e.numero ? `nº ${e.numero}` : null, e.bairro, e.cidade, e.cep ? `CEP ${e.cep}` : null]
    .filter(Boolean)
    .join(" - ");
}

function getUploadPath(body: string) {
  return body.split(/\s+/).find((part) => part.startsWith("/uploads/")) || "";
}

function apiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/api\/?$/, "").replace(/\/+$/, "");
}

const LABEL_COLORS = ["#0f766e", "#16a34a", "#f59e0b", "#0ea5e9", "#8b5cf6", "#e11d48", "#64748b"];

export default function WhatsAppPage() {
  const {
    conversations,
    contacts,
    messages,
    autoReplies,
    labels,
    quickReplies,
    broadcasts,
    loading,
    sending,
    refresh,
    loadMessages,
    sendMessage,
    saveAutoReply,
    deleteAutoReply,
    saveLabel,
    deleteLabel,
    setConversationLabels,
    saveQuickReply,
    deleteQuickReply,
    setHumanActive,
    assumeConversation,
    releaseConversation,
    sendBroadcast,
  } = useWhatsApp();
  const { clientes, saving: savingClientes, createCliente } = useClientes();
  const { tamanhos } = useTamanhos();
  const { cardapios } = useCardapios();
  const cardapioAtivo = cardapios.find((c) => c.ativo) ?? null;
  const { opcoes } = useOpcoesDoCardapio(cardapioAtivo?.id);
  const { preparos } = usePreparosSelecionaveis();
  const { salgados } = useSalgados();
  const { createAgendamento } = useAgendamentos();

  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [conversationSearch, setConversationSearch] = useState("");
  const [selectedLabelId, setSelectedLabelId] = useState<number | "all">("all");
  const [replyText, setReplyText] = useState("");
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [labelForm, setLabelForm] = useState<{ id?: number; name: string; color: string }>({
    name: "",
    color: LABEL_COLORS[0],
  });
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [editingRule, setEditingRule] = useState<Partial<WhatsAppAutoReply>>({
    keyword: "",
    response: "",
    active: true,
    sendActiveMenuImages: false,
    onlyFirstMessage: false,
    skipWhenHumanActive: true,
  });
  const [editingQuickReply, setEditingQuickReply] = useState<Partial<WhatsAppQuickReply>>({
    shortcut: "",
    title: "",
    body: "",
    mediaUrl: "",
    mediaType: "",
    active: true,
  });

  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);
  const [broadcastLabelId, setBroadcastLabelId] = useState<number | "all">("all");

  const filteredConversations = useMemo(() => {
    const q = conversationSearch.trim().toLowerCase();
    const byLabel = selectedLabelId === "all"
      ? conversations
      : conversations.filter((conversation) =>
          conversation.labels?.some((item) => item.labelId === selectedLabelId),
        );
    if (!q) return byLabel;
    return byLabel.filter((conversation) => {
      const name = contactName(conversation).toLowerCase();
      return name.includes(q) || conversation.contact.phone.includes(q);
    });
  }, [conversationSearch, conversations, selectedLabelId]);

  const selectedConversation = conversations.find((item) => item.id === selectedConversationId) || null;
  const selectedConversationLabelIds = selectedConversation?.labels?.map((item) => item.labelId) || [];
  const conversationByContactId = useMemo(() => {
    const map = new Map<number, WhatsAppConversation>();
    conversations.forEach((conversation) => {
      if (!map.has(conversation.contactId)) {
        map.set(conversation.contactId, conversation);
      }
    });
    return map;
  }, [conversations]);
  const filteredBroadcastContacts = useMemo(() => {
    if (broadcastLabelId === "all") return contacts;
    return contacts.filter((contact) =>
      conversationByContactId.get(contact.id)?.labels?.some((item) => item.labelId === broadcastLabelId),
    );
  }, [broadcastLabelId, contacts, conversationByContactId]);
  const selectedFilteredContactIds = filteredBroadcastContacts
    .map((contact) => contact.id)
    .filter((id) => selectedContactIds.includes(id));
  const matchedCliente = useMemo(() => {
    if (!selectedConversation) return null;
    const phone = normalizePhone(selectedConversation.contact.phone);
    return clientes.find((cliente) => normalizePhone(cliente.telefone) === phone) || null;
  }, [clientes, selectedConversation]);
  const currentUser = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);
  const lockActive = !!selectedConversation?.lockedByUserId &&
    !!selectedConversation?.lockExpiresAt &&
    new Date(selectedConversation.lockExpiresAt).getTime() > Date.now();
  const lockedByMe = lockActive && Number(selectedConversation?.lockedByUserId) === Number(currentUser?.id);
  const canSend = !lockActive || lockedByMe || currentUser?.isAdmin;
  const opcoesPadrao = opcoes.map((o) => ({ id: String(o.id), nome: o.nome }));
  const carboidratos = preparos.filter((p) => p.tipo === "CARBOIDRATO").map((p) => ({ id: String(p.id), nome: p.nome }));
  const proteinas = preparos.filter((p) => p.tipo === "PROTEINA").map((p) => ({ id: String(p.id), nome: p.nome }));
  const legumes = preparos.filter((p) => p.tipo === "LEGUMES").map((p) => ({ id: String(p.id), nome: p.nome }));
  const feijoes = preparos.filter((p) => p.tipo === "FEIJAO").map((p) => ({ id: String(p.id), nome: p.nome }));
  const complementos = preparos.filter((p) => p.tipo === "COMPLEMENTO").map((p) => ({ id: String(p.id), nome: p.nome }));

  useEffect(() => {
    if (!selectedConversationId && conversations[0]) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId]);

  useEffect(() => {
    if (selectedConversationId) loadMessages(selectedConversationId);
  }, [loadMessages, selectedConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages, selectedConversationId]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      refresh();
      if (selectedConversationId) loadMessages(selectedConversationId);
    }, 4500);
    return () => window.clearInterval(interval);
  }, [loadMessages, refresh, selectedConversationId]);

  const applyQuickReply = (value: string) => {
    const match = value.match(/(^|\s)(\/[\w-]+)$/i);
    if (!match) {
      setReplyText(value);
      return;
    }
    const macro = quickReplies.find(
      (item) => item.active && item.shortcut.toLowerCase() === match[2].toLowerCase(),
    );
    if (!macro) {
      setReplyText(value);
      return;
    }
    const prefix = value.slice(0, match.index || 0) + match[1];
    const attachment = macro.mediaUrl ? `\n${macro.mediaUrl}` : "";
    setReplyText(`${prefix}${macro.body}${attachment}`.trimStart());
  };

  const handleSendReply = async () => {
    const text = replyText.trim();
    if (!selectedConversationId || !text || !canSend) return;
    await sendMessage(selectedConversationId, text);
    setReplyText("");
  };

  const handleSaveRule = async () => {
    if (!editingRule.keyword?.trim() || !editingRule.response?.trim()) return;
    await saveAutoReply({
      id: editingRule.id,
      keyword: editingRule.keyword,
      response: editingRule.response,
      active: editingRule.active ?? true,
      sendActiveMenuImages: editingRule.sendActiveMenuImages ?? false,
      onlyFirstMessage: editingRule.onlyFirstMessage ?? false,
      skipWhenHumanActive: editingRule.skipWhenHumanActive ?? true,
    });
    setEditingRule({ keyword: "", response: "", active: true, sendActiveMenuImages: false, onlyFirstMessage: false, skipWhenHumanActive: true });
  };

  const handleSaveQuickReply = async () => {
    if (!editingQuickReply.shortcut?.trim() || !editingQuickReply.title?.trim()) return;
    await saveQuickReply({
      id: editingQuickReply.id,
      shortcut: editingQuickReply.shortcut,
      title: editingQuickReply.title,
      body: editingQuickReply.body || "",
      mediaUrl: editingQuickReply.mediaUrl || null,
      mediaType: editingQuickReply.mediaType || null,
      active: editingQuickReply.active ?? true,
    });
    setEditingQuickReply({ shortcut: "", title: "", body: "", mediaUrl: "", mediaType: "", active: true });
  };

  const handleToggleConversationLabel = async (labelId: number) => {
    if (!selectedConversation) return;
    const nextIds = selectedConversationLabelIds.includes(labelId)
      ? selectedConversationLabelIds.filter((id) => id !== labelId)
      : [...selectedConversationLabelIds, labelId];
    await setConversationLabels(selectedConversation.id, nextIds);
  };

  const resetLabelForm = () => {
    setLabelForm({ name: "", color: LABEL_COLORS[0] });
  };

  const handleEditLabel = (label: WhatsAppLabel) => {
    setLabelForm({ id: label.id, name: label.name, color: label.color || LABEL_COLORS[0] });
  };

  const handleSaveLabel = async () => {
    if (!labelForm.name.trim()) return;
    await saveLabel({
      id: labelForm.id,
      name: labelForm.name.trim(),
      color: labelForm.color,
    });
    resetLabelForm();
  };

  const handleDeleteLabel = async (labelId: number) => {
    await deleteLabel(labelId);
    if (selectedLabelId === labelId) setSelectedLabelId("all");
    if (labelForm.id === labelId) resetLabelForm();
  };

  const toggleContact = (id: number) => {
    setSelectedContactIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const handleBroadcast = async () => {
    await sendBroadcast({
      title: broadcastTitle,
      message: broadcastMessage,
      contactIds: selectedContactIds,
    });
    setBroadcastTitle("");
    setBroadcastMessage("");
    setSelectedContactIds([]);
  };

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col gap-4 pb-4">
      <Header title="WhatsApp" subtitle="Atendimento, respostas rapidas e transmissao" />

      <Tabs defaultValue="conversas" className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <TabsList className="w-fit rounded-full bg-muted/60 p-1">
            <TabsTrigger value="conversas">Conversas</TabsTrigger>
            <TabsTrigger value="respostas">Respostas</TabsTrigger>
            <TabsTrigger value="transmissao">Transmissao</TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading} className="w-fit rounded-full">
            <RefreshCcw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Atualizar
          </Button>
        </div>

        <TabsContent value="conversas" className="mt-3 min-h-0 flex-1">
          <div className="grid h-[calc(100vh-198px)] min-h-[520px] grid-cols-1 gap-3 lg:grid-cols-[300px_minmax(0,1fr)]">
            <Card className="overflow-hidden rounded-xl border-border/70 shadow-none">
              <CardHeader className="space-y-3 border-b bg-background/80 p-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={conversationSearch}
                    onChange={(event) => setConversationSearch(event.target.value)}
                    placeholder="Buscar contato"
                    className="h-10 rounded-full border-border/70 bg-muted/30 pl-9 shadow-none"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={selectedLabelId === "all" ? "default" : "outline"}
                    onClick={() => setSelectedLabelId("all")}
                    className="h-8 shrink-0 rounded-full px-3"
                  >
                    Todas
                  </Button>
                  {labels.map((label) => (
                    <Button
                      key={label.id}
                      type="button"
                      size="sm"
                      variant={selectedLabelId === label.id ? "default" : "outline"}
                      onClick={() => setSelectedLabelId(label.id)}
                      className="h-8 shrink-0 rounded-full px-3"
                    >
                      {label.name}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-313px)] min-h-[405px]">
                  <div>
                    {filteredConversations.map((conversation) => {
                      const lastMessage = conversation.messages[0];
                      const active = conversation.id === selectedConversationId;
                      const assumed = Boolean(conversation.lockedByUserId);
                      const hasLabels = Boolean(conversation.labels?.length);
                      return (
                        <button
                          key={conversation.id}
                          onClick={() => setSelectedConversationId(conversation.id)}
                          className={cn(
                            "w-full border-b border-border/60 px-4 py-3 text-left transition-colors hover:bg-muted/45",
                            active && "bg-primary/5 shadow-[inset_3px_0_0_hsl(var(--primary))]",
                            hasLabels && !active && "bg-amber-50/50",
                          )}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-1.5">
                              {hasLabels && (
                                <span
                                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                                  style={{ backgroundColor: conversation.labels[0]?.label.color }}
                                  title="Possui etiqueta"
                                />
                              )}
                              <p className="truncate text-sm font-semibold text-foreground">{contactName(conversation)}</p>
                            </div>
                            {conversation.lastMessageAt && (
                              <span className="shrink-0 text-[11px] text-muted-foreground">
                                {format(new Date(conversation.lastMessageAt), "dd/MM HH:mm", { locale: ptBR })}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {lastMessage?.body || displayPhone(conversation.contact.phone)}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                                assumed
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border-border bg-background text-muted-foreground",
                              )}
                            >
                              <Lock className="h-3 w-3" />
                              {assumed ? `Com ${conversation.lockedByName || "atendente"}` : "Livre"}
                            </span>
                            {hasLabels && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                <Tags className="h-3 w-3" />
                                Etiqueta
                              </span>
                            )}
                          </div>
                          {!!conversation.labels?.length && (
                            <div className="mt-2 flex gap-1 overflow-hidden">
                              {conversation.labels.slice(0, 3).map(({ label }) => (
                                <span
                                  key={label.id}
                                  className="truncate rounded-full border px-1.5 py-0.5 text-[10px] font-medium"
                                  style={{ borderColor: label.color, color: label.color }}
                                >
                                  {label.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </button>
                      );
                    })}
                    {!filteredConversations.length && (
                      <p className="p-6 text-sm text-muted-foreground">Nenhuma conversa encontrada.</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="flex min-h-0 flex-col overflow-hidden rounded-xl border-border/70 shadow-none">
              {selectedConversation ? (
                <>
                  <CardHeader className="border-b bg-background/90 p-4">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0">
                        <CardTitle className="truncate text-base">{contactName(selectedConversation)}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {displayPhone(selectedConversation.contact.phone)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                        <Button variant="outline" size="sm" onClick={() => setScheduleOpen(true)} className="h-9 rounded-full">
                          <CalendarPlus className="mr-2 h-4 w-4" />
                          Agendar
                        </Button>
                        {lockedByMe ? (
                          <Button variant="outline" size="sm" onClick={() => releaseConversation(selectedConversation.id)} className="h-9 rounded-full">
                            <Unlock className="mr-2 h-4 w-4" />
                            Liberar
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => assumeConversation(selectedConversation.id)} className="h-9 rounded-full">
                            <Lock className="mr-2 h-4 w-4" />
                            Assumir
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-col gap-3 border-t border-border/60 pt-3 xl:flex-row xl:items-center">
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setLabelsOpen(true)}
                          className="h-9 shrink-0 rounded-full"
                        >
                          <Tags className="mr-2 h-4 w-4" />
                          Etiquetas
                        </Button>
                        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                          {selectedConversation.labels?.length ? (
                            selectedConversation.labels.slice(0, 4).map(({ label }) => (
                              <span
                                key={label.id}
                                className="rounded-full border px-2 py-1 text-xs font-medium"
                                style={{ borderColor: label.color, color: label.color }}
                              >
                                {label.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">Sem etiquetas</span>
                          )}
                          {(selectedConversation.labels?.length || 0) > 4 && (
                            <span className="text-xs text-muted-foreground">
                              +{(selectedConversation.labels?.length || 0) - 4}
                            </span>
                          )}
                        </div>
                      </div>
                      <label className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                        Atendimento humano
                        <Switch
                          checked={selectedConversation.humanActive}
                          onCheckedChange={(checked) => setHumanActive(selectedConversation.id, checked)}
                        />
                      </label>
                    </div>
                  </CardHeader>

                  <CardContent className="flex min-h-0 flex-1 flex-col p-0">
                    <ScrollArea className="min-h-0 flex-1 bg-muted/20">
                      <div className="space-y-3 p-4">
                        {messages.map((message) => {
                          const outbound = message.direction === "OUTBOUND";
                          const uploadPath = getUploadPath(message.body);
                          return (
                            <div
                              key={message.id}
                              className={cn("flex", outbound ? "justify-end" : "justify-start")}
                            >
                              <div
                                className={cn(
                                  "max-w-[76%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm",
                                  outbound
                                    ? "rounded-br-md bg-primary text-primary-foreground"
                                    : "rounded-bl-md bg-background text-foreground",
                                )}
                              >
                                {uploadPath ? (
                                  <div className="space-y-2">
                                    <img
                                      src={`${apiBaseUrl()}${uploadPath}`}
                                      alt="Anexo do cardápio"
                                      className="max-h-48 rounded-md object-cover"
                                    />
                                    <p className="whitespace-pre-wrap break-words">{message.body.replace(uploadPath, "").trim()}</p>
                                  </div>
                                ) : (
                                  <p className="whitespace-pre-wrap break-words">{message.body}</p>
                                )}
                                <div
                                  className={cn(
                                    "mt-1 flex items-center justify-end gap-2 text-[10px]",
                                    outbound ? "text-primary-foreground/70" : "text-muted-foreground",
                                  )}
                                >
                                  <span>{format(new Date(message.createdAt), "dd/MM HH:mm", { locale: ptBR })}</span>
                                  {outbound && <span>{message.status}</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>

                    <div className="shrink-0 border-t bg-background p-3">
                      <div className="flex gap-3">
                        <Textarea
                          value={replyText}
                          onChange={(event) => applyQuickReply(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                              event.preventDefault();
                              handleSendReply();
                            }
                          }}
                          placeholder={canSend ? "Digite a resposta ou use /oferta..." : "Conversa bloqueada por outro atendente"}
                          className="min-h-[48px] resize-none rounded-2xl border-border/70 bg-muted/20 px-4 py-3 shadow-none"
                          disabled={!canSend}
                        />
                        <Button
                          className="h-[48px] w-[48px] shrink-0 rounded-2xl p-0"
                          onClick={handleSendReply}
                          disabled={sending || !replyText.trim() || !canSend}
                          title="Enviar"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center p-10 text-center text-muted-foreground">
                  Selecione uma conversa para iniciar o atendimento.
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="respostas" className="mt-6">
          <Tabs defaultValue="automaticas" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 rounded-full bg-muted/60 p-1 sm:w-fit">
              <TabsTrigger value="automaticas" className="rounded-full">Respostas automáticas</TabsTrigger>
              <TabsTrigger value="macros" className="rounded-full">Macros</TabsTrigger>
            </TabsList>

            <TabsContent value="automaticas" className="mt-0">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[380px_1fr]">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {editingRule.id ? "Editar resposta" : "Nova resposta automatica"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  value={editingRule.keyword || ""}
                  onChange={(event) => setEditingRule((current) => ({ ...current, keyword: event.target.value }))}
                  placeholder="Palavra-chave"
                />
                <Textarea
                  value={editingRule.response || ""}
                  onChange={(event) => setEditingRule((current) => ({ ...current, response: event.target.value }))}
                  placeholder="Resposta enviada ao cliente"
                  className="min-h-[160px]"
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editingRule.active ?? true}
                    onChange={(event) =>
                      setEditingRule((current) => ({ ...current, active: event.target.checked }))
                    }
                  />
                  Ativa
                </label>
                <label className="flex items-start gap-3 rounded-md border p-3 text-sm">
                  <Checkbox
                    checked={editingRule.sendActiveMenuImages ?? false}
                    onCheckedChange={(checked) =>
                      setEditingRule((current) => ({
                        ...current,
                        sendActiveMenuImages: checked === true,
                      }))
                    }
                  />
                  <span>
                    <span className="block font-medium">Enviar imagens do cardápio ativo</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      Quando esta regra responder, o WhatsApp envia também os anexos cadastrados no cardápio ativo.
                    </span>
                  </span>
                </label>
                <label className="flex items-center gap-3 rounded-md border p-3 text-sm">
                  <Checkbox
                    checked={editingRule.onlyFirstMessage ?? false}
                    onCheckedChange={(checked) =>
                      setEditingRule((current) => ({ ...current, onlyFirstMessage: checked === true }))
                    }
                  />
                  Executar apenas na primeira mensagem da conversa
                </label>
                <label className="flex items-center gap-3 rounded-md border p-3 text-sm">
                  <Checkbox
                    checked={editingRule.skipWhenHumanActive ?? true}
                    onCheckedChange={(checked) =>
                      setEditingRule((current) => ({ ...current, skipWhenHumanActive: checked === true }))
                    }
                  />
                  Nao disparar durante atendimento humano
                </label>
                <div className="flex gap-2">
                  <Button onClick={handleSaveRule} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Salvar
                  </Button>
                  {editingRule.id && (
                    <Button
                      variant="outline"
                      onClick={() => setEditingRule({ keyword: "", response: "", active: true, sendActiveMenuImages: false, onlyFirstMessage: false, skipWhenHumanActive: true })}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Regras cadastradas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y rounded-md border">
                  {autoReplies.map((rule) => (
                    <div key={rule.id} className="flex items-start justify-between gap-4 p-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{rule.keyword}</p>
                          <Badge variant={rule.active ? "default" : "secondary"}>
                            {rule.active ? "Ativa" : "Inativa"}
                          </Badge>
                          {rule.sendActiveMenuImages && (
                            <Badge variant="outline">Envia cardápio</Badge>
                          )}
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{rule.response}</p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingRule(rule)}
                          title="Editar"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteAutoReply(rule.id)}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {!autoReplies.length && (
                    <p className="p-6 text-sm text-muted-foreground">Nenhuma regra cadastrada.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
            </TabsContent>

            <TabsContent value="macros" className="mt-0">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[380px_1fr]">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {editingQuickReply.id ? "Editar macro" : "Nova macro"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  value={editingQuickReply.shortcut || ""}
                  onChange={(event) => setEditingQuickReply((current) => ({ ...current, shortcut: event.target.value }))}
                  placeholder="/oferta"
                />
                <Input
                  value={editingQuickReply.title || ""}
                  onChange={(event) => setEditingQuickReply((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Nome interno"
                />
                <Textarea
                  value={editingQuickReply.body || ""}
                  onChange={(event) => setEditingQuickReply((current) => ({ ...current, body: event.target.value }))}
                  placeholder="Texto, emojis e links da macro"
                  className="min-h-[120px]"
                />
                <Input
                  value={editingQuickReply.mediaUrl || ""}
                  onChange={(event) => setEditingQuickReply((current) => ({ ...current, mediaUrl: event.target.value }))}
                  placeholder="URL de imagem ou PDF opcional"
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editingQuickReply.active ?? true}
                    onChange={(event) => setEditingQuickReply((current) => ({ ...current, active: event.target.checked }))}
                  />
                  Ativa
                </label>
                <div className="flex gap-2">
                  <Button onClick={handleSaveQuickReply} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Salvar macro
                  </Button>
                  {editingQuickReply.id && (
                    <Button
                      variant="outline"
                      onClick={() => setEditingQuickReply({ shortcut: "", title: "", body: "", mediaUrl: "", mediaType: "", active: true })}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Macros cadastradas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y rounded-md border">
                  {quickReplies.map((macro) => (
                    <div key={macro.id} className="flex items-start justify-between gap-4 p-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{macro.shortcut}</Badge>
                          <p className="font-semibold">{macro.title}</p>
                          <Badge variant={macro.active ? "default" : "secondary"}>
                            {macro.active ? "Ativa" : "Inativa"}
                          </Badge>
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{macro.body || macro.mediaUrl}</p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setEditingQuickReply(macro)} title="Editar">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteQuickReply(macro.id)} title="Excluir">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {!quickReplies.length && (
                    <p className="p-6 text-sm text-muted-foreground">Nenhuma macro cadastrada.</p>
                  )}
                </div>
              </CardContent>
            </Card>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="transmissao" className="mt-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[420px_1fr]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4" />
                  Nova transmissao
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  value={broadcastTitle}
                  onChange={(event) => setBroadcastTitle(event.target.value)}
                  placeholder="Titulo interno"
                />
                <Textarea
                  value={broadcastMessage}
                  onChange={(event) => setBroadcastMessage(event.target.value)}
                  placeholder="Mensagem para os contatos selecionados"
                  className="min-h-[140px]"
                />
                <div className="space-y-2 rounded-md border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-muted-foreground">Filtrar por etiqueta</p>
                    <span className="text-xs text-muted-foreground">
                      {filteredBroadcastContacts.length} contatos
                    </span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    <Button
                      type="button"
                      size="sm"
                      variant={broadcastLabelId === "all" ? "default" : "outline"}
                      onClick={() => setBroadcastLabelId("all")}
                      className="h-8 shrink-0 rounded-full px-3"
                    >
                      Todos
                    </Button>
                    {labels.map((label) => (
                      <Button
                        key={label.id}
                        type="button"
                        size="sm"
                        variant={broadcastLabelId === label.id ? "default" : "outline"}
                        onClick={() => setBroadcastLabelId(label.id)}
                        className="h-8 shrink-0 rounded-full px-3"
                      >
                        <span className="mr-1.5 h-2 w-2 rounded-full" style={{ backgroundColor: label.color }} />
                        {label.name}
                      </Button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setSelectedContactIds((current) =>
                          Array.from(new Set([...current, ...filteredBroadcastContacts.map((contact) => contact.id)])),
                        )
                      }
                      disabled={!filteredBroadcastContacts.length}
                      className="h-8 rounded-full"
                    >
                      Selecionar filtrados
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const filteredIds = new Set(filteredBroadcastContacts.map((contact) => contact.id));
                        setSelectedContactIds((current) => current.filter((id) => !filteredIds.has(id)));
                      }}
                      disabled={!selectedFilteredContactIds.length}
                      className="h-8 rounded-full"
                    >
                      Limpar filtrados
                    </Button>
                  </div>
                </div>
                <div className="rounded-md border">
                  <div className="border-b px-3 py-2 text-xs font-semibold text-muted-foreground">
                    {selectedContactIds.length} contatos selecionados
                    {broadcastLabelId !== "all" && ` (${selectedFilteredContactIds.length} nesta etiqueta)`}
                  </div>
                  <ScrollArea className="h-[260px]">
                    <div className="divide-y">
                      {filteredBroadcastContacts.map((contact) => {
                        const selected = selectedContactIds.includes(contact.id);
                        const conversation = conversationByContactId.get(contact.id);
                        return (
                          <button
                            key={contact.id}
                            onClick={() => toggleContact(contact.id)}
                            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/60"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {contact.name || displayPhone(contact.phone)}
                              </p>
                              <p className="text-xs text-muted-foreground">{displayPhone(contact.phone)}</p>
                              {!!conversation?.labels?.length && (
                                <div className="mt-1 flex gap-1 overflow-hidden">
                                  {conversation.labels.slice(0, 2).map(({ label }) => (
                                    <span
                                      key={label.id}
                                      className="truncate rounded-full border px-1.5 py-0.5 text-[10px] font-medium"
                                      style={{ borderColor: label.color, color: label.color }}
                                    >
                                      {label.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <span
                              className={cn(
                                "flex h-5 w-5 items-center justify-center rounded border",
                                selected && "border-primary bg-primary text-primary-foreground",
                              )}
                            >
                              {selected && <Check className="h-3 w-3" />}
                            </span>
                          </button>
                        );
                      })}
                      {!filteredBroadcastContacts.length && (
                        <p className="p-6 text-sm text-muted-foreground">
                          Nenhum contato encontrado para este filtro.
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
                <Button
                  className="w-full gap-2"
                  onClick={handleBroadcast}
                  disabled={sending || !broadcastMessage.trim() || !selectedContactIds.length}
                >
                  <Send className="h-4 w-4" />
                  Enviar transmissao
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ultimas transmissoes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y rounded-md border">
                  {broadcasts.map((broadcast) => (
                    <div key={broadcast.id} className="p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold">{broadcast.title}</p>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(broadcast.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{broadcast.message}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {broadcast.recipients.map((recipient) => (
                          <Badge key={recipient.id} variant={recipient.status === "FAILED" ? "destructive" : "secondary"}>
                            {recipient.contact.name || displayPhone(recipient.contact.phone)}: {recipient.status}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                  {!broadcasts.length && (
                    <p className="p-6 text-sm text-muted-foreground">Nenhuma transmissao enviada.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={labelsOpen} onOpenChange={setLabelsOpen}>
        <DialogContent className="max-w-3xl rounded-xl p-0">
          <DialogHeader className="border-b px-6 py-5">
            <DialogTitle>Etiquetas da conversa</DialogTitle>
            <DialogDescription>
              Organize a conversa atual e gerencie as etiquetas disponiveis.
            </DialogDescription>
          </DialogHeader>

          <div className="grid max-h-[70vh] grid-cols-1 overflow-hidden md:grid-cols-[1fr_320px]">
            <div className="min-h-0 border-b p-5 md:border-b-0 md:border-r">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Aplicar nesta conversa</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedConversation ? contactName(selectedConversation) : "Nenhuma conversa selecionada"}
                  </p>
                </div>
                <Badge variant="secondary" className="rounded-full">
                  {selectedConversationLabelIds.length} selecionada{selectedConversationLabelIds.length === 1 ? "" : "s"}
                </Badge>
              </div>

              <ScrollArea className="h-[360px] pr-3">
                <div className="space-y-2">
                  {labels.map((label) => {
                    const selected = selectedConversationLabelIds.includes(label.id);
                    return (
                      <button
                        key={label.id}
                        type="button"
                        onClick={() => handleToggleConversationLabel(label.id)}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors hover:bg-muted/50",
                          selected && "border-primary bg-primary/5",
                        )}
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: label.color }} />
                          <span className="truncate text-sm font-medium">{label.name}</span>
                        </span>
                        <span
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                            selected && "border-primary bg-primary text-primary-foreground",
                          )}
                        >
                          {selected && <Check className="h-3 w-3" />}
                        </span>
                      </button>
                    );
                  })}
                  {!labels.length && (
                    <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                      Crie a primeira etiqueta no painel ao lado.
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="min-h-0 bg-muted/20 p-5">
              <div className="space-y-3 rounded-lg border bg-background p-3">
                <p className="text-sm font-semibold">{labelForm.id ? "Editar etiqueta" : "Nova etiqueta"}</p>
                <Input
                  value={labelForm.name}
                  onChange={(event) => setLabelForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Nome da etiqueta"
                  className="h-9 shadow-none"
                />
                <div className="flex flex-wrap gap-2">
                  {LABEL_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setLabelForm((current) => ({ ...current, color }))}
                      className={cn(
                        "h-7 w-7 rounded-full border-2 border-background shadow-sm ring-1 ring-border",
                        labelForm.color === color && "ring-2 ring-primary",
                      )}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                  <Input
                    type="color"
                    value={labelForm.color}
                    onChange={(event) => setLabelForm((current) => ({ ...current, color: event.target.value }))}
                    className="h-7 w-10 rounded-full p-1"
                    title="Cor personalizada"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveLabel} disabled={!labelForm.name.trim()}>
                    {labelForm.id ? "Salvar" : "Criar"}
                  </Button>
                  {labelForm.id && (
                    <Button size="sm" variant="outline" onClick={resetLabelForm}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Todas as etiquetas</p>
                <ScrollArea className="h-[210px] pr-3">
                  <div className="space-y-2">
                    {labels.map((label) => (
                      <div key={label.id} className="flex items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: label.color }} />
                          <span className="truncate text-sm font-medium">{label.name}</span>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditLabel(label)} title="Editar">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteLabel(label.id)} title="Remover">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <NovoAgendamentoNovoLayout
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        clientes={clientes.map((c) => {
          const enderecoPrincipal = c.enderecos?.find((e) => e.principal) ?? c.enderecos?.[0];
          return {
            id: String(c.id),
            nome: c.nome,
            telefone: c.telefone,
            enderecoPrincipal: enderecoPrincipal ? formatEndereco(enderecoPrincipal) : "",
            enderecos: c.enderecos,
            tags: c.tags,
            planos: c.planos,
          };
        })}
        tamanhos={tamanhos.map((t) => ({
          id: String(t.id),
          nome: `${t.pesagemGramas}g`,
          valorUnitario: Number(t.valorUnitario ?? 0),
          valor10: Number(t.valor10 ?? 0),
          valor20: Number(t.valor20 ?? 0),
          valor40: Number(t.valor40 ?? 0),
        }))}
        opcoesPadrao={opcoesPadrao}
        carboidratos={carboidratos}
        proteinas={proteinas}
        legumes={legumes}
        feijoes={feijoes}
        complementos={complementos}
        salgados={salgados.map((s) => ({
          id: String(s.id),
          nome: s.nome,
          preco: Number(s.preco || 0),
        }))}
        initialData={matchedCliente ? { clienteId: matchedCliente.id } : null}
        savingCliente={savingClientes}
        onCreateCliente={createCliente}
        onSubmit={async (payload) => {
          await createAgendamento({
            clienteId: Number(payload.clienteId),
            tipo: payload.tipo,
            data: payload.data,
            dataEntregaCongelada: payload.dataEntregaCongelada,
            faixaHorario: payload.faixaHorario,
            endereco: payload.endereco,
            entregaLatitude: payload.entregaLatitude,
            entregaLongitude: payload.entregaLongitude,
            observacoes: payload.observacoes,
            formaPagamento: payload.formaPagamento,
            senhaAutorizacao: payload.senhaAutorizacao,
            voucherCodigo: payload.voucherCodigo,
            itens: payload.itens,
          });
          setScheduleOpen(false);
        }}
      />
    </div>
  );
}
