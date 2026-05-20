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
  Trash2,
  Unlock,
  Users,
} from "lucide-react";

import { Header } from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  WhatsAppAutoReply,
  WhatsAppConversation,
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
  const [labelDraft, setLabelDraft] = useState("");
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

  const handleCreateLabel = async () => {
    if (!labelDraft.trim()) return;
    await saveLabel({ name: labelDraft.trim() });
    setLabelDraft("");
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
                      return (
                        <button
                          key={conversation.id}
                          onClick={() => setSelectedConversationId(conversation.id)}
                          className={cn(
                            "w-full border-b border-border/60 px-4 py-3 text-left transition-colors hover:bg-muted/45",
                            active && "bg-primary/5 shadow-[inset_3px_0_0_hsl(var(--primary))]",
                          )}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate text-sm font-semibold text-foreground">{contactName(conversation)}</p>
                            {conversation.lastMessageAt && (
                              <span className="shrink-0 text-[11px] text-muted-foreground">
                                {format(new Date(conversation.lastMessageAt), "dd/MM HH:mm", { locale: ptBR })}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {lastMessage?.body || displayPhone(conversation.contact.phone)}
                          </p>
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
                        {lockActive ? (
                          <Badge variant={lockedByMe ? "default" : "secondary"} className="h-8 rounded-full px-3">
                            <Lock className="h-3 w-3" />
                            {lockedByMe ? "Atendimento com voce" : `Com ${selectedConversation.lockedByName || "atendente"}`}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="h-8 rounded-full px-3">Livre</Badge>
                        )}
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
                      <div className="flex flex-1 flex-wrap items-center gap-2">
                        {labels.map((label) => (
                          <button
                            key={label.id}
                            type="button"
                            onClick={() => handleToggleConversationLabel(label.id)}
                            className={cn(
                              "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                              selectedConversationLabelIds.includes(label.id) && "text-white",
                            )}
                            style={{
                              borderColor: label.color,
                              backgroundColor: selectedConversationLabelIds.includes(label.id) ? label.color : "transparent",
                              color: selectedConversationLabelIds.includes(label.id) ? "#fff" : label.color,
                            }}
                          >
                            {label.name}
                          </button>
                        ))}
                        <div className="flex items-center gap-1">
                          <Input
                            value={labelDraft}
                            onChange={(event) => setLabelDraft(event.target.value)}
                            placeholder="Nova etiqueta"
                            className="h-8 w-32 rounded-full shadow-none"
                          />
                          <Button type="button" variant="ghost" size="icon" onClick={handleCreateLabel} className="h-8 w-8 rounded-full">
                            <Plus className="h-4 w-4" />
                          </Button>
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
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[380px_1fr]">
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
                <div className="rounded-md border">
                  <div className="border-b px-3 py-2 text-xs font-semibold text-muted-foreground">
                    {selectedContactIds.length} contatos selecionados
                  </div>
                  <ScrollArea className="h-[260px]">
                    <div className="divide-y">
                      {contacts.map((contact) => {
                        const selected = selectedContactIds.includes(contact.id);
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
                      {!contacts.length && (
                        <p className="p-6 text-sm text-muted-foreground">
                          Os contatos aparecem depois das primeiras conversas recebidas.
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
            observacoes: payload.observacoes,
            formaPagamento: payload.formaPagamento,
            voucherCodigo: payload.voucherCodigo,
            itens: payload.itens,
          });
          setScheduleOpen(false);
        }}
      />
    </div>
  );
}
