"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Check,
  Edit3,
  MessageCircle,
  Plus,
  RefreshCcw,
  Search,
  Send,
  Trash2,
  Users,
} from "lucide-react";

import { Header } from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  WhatsAppAutoReply,
  WhatsAppConversation,
  useWhatsApp,
} from "@/hooks/useWhatsApp";

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

export default function WhatsAppPage() {
  const {
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
  } = useWhatsApp();

  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [conversationSearch, setConversationSearch] = useState("");
  const [replyText, setReplyText] = useState("");

  const [editingRule, setEditingRule] = useState<Partial<WhatsAppAutoReply>>({
    keyword: "",
    response: "",
    active: true,
  });

  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);

  const filteredConversations = useMemo(() => {
    const q = conversationSearch.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((conversation) => {
      const name = contactName(conversation).toLowerCase();
      return name.includes(q) || conversation.contact.phone.includes(q);
    });
  }, [conversationSearch, conversations]);

  const selectedConversation = conversations.find((item) => item.id === selectedConversationId) || null;

  useEffect(() => {
    if (!selectedConversationId && conversations[0]) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId]);

  useEffect(() => {
    if (selectedConversationId) loadMessages(selectedConversationId);
  }, [loadMessages, selectedConversationId]);

  const handleSendReply = async () => {
    const text = replyText.trim();
    if (!selectedConversationId || !text) return;
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
    });
    setEditingRule({ keyword: "", response: "", active: true });
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
    <div className="space-y-6 pb-10">
      <Header title="WhatsApp" subtitle="Inbox, respostas automaticas e transmissoes" />

      <Tabs defaultValue="conversas" className="w-full">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <TabsList>
            <TabsTrigger value="conversas">Conversas</TabsTrigger>
            <TabsTrigger value="respostas">Respostas</TabsTrigger>
            <TabsTrigger value="transmissao">Transmissao</TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>

        <TabsContent value="conversas" className="mt-6">
          <div className="grid min-h-[620px] grid-cols-1 gap-4 lg:grid-cols-[340px_1fr]">
            <Card className="overflow-hidden">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageCircle className="h-4 w-4" />
                  Conversas
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={conversationSearch}
                    onChange={(event) => setConversationSearch(event.target.value)}
                    placeholder="Buscar contato"
                    className="pl-9"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[520px]">
                  <div className="divide-y">
                    {filteredConversations.map((conversation) => {
                      const lastMessage = conversation.messages[0];
                      const active = conversation.id === selectedConversationId;
                      return (
                        <button
                          key={conversation.id}
                          onClick={() => setSelectedConversationId(conversation.id)}
                          className={cn(
                            "w-full px-4 py-4 text-left transition-colors hover:bg-muted/60",
                            active && "bg-muted",
                          )}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate text-sm font-semibold">{contactName(conversation)}</p>
                            {conversation.lastMessageAt && (
                              <span className="text-[11px] text-muted-foreground">
                                {format(new Date(conversation.lastMessageAt), "dd/MM HH:mm", { locale: ptBR })}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {lastMessage?.body || displayPhone(conversation.contact.phone)}
                          </p>
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

            <Card className="flex min-h-[620px] flex-col overflow-hidden">
              {selectedConversation ? (
                <>
                  <CardHeader className="border-b">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg">{contactName(selectedConversation)}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {displayPhone(selectedConversation.contact.phone)}
                        </p>
                      </div>
                      <Badge variant="secondary">{selectedConversation.status}</Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col p-0">
                    <ScrollArea className="h-[430px] flex-1 p-5">
                      <div className="space-y-3">
                        {messages.map((message) => {
                          const outbound = message.direction === "OUTBOUND";
                          return (
                            <div
                              key={message.id}
                              className={cn("flex", outbound ? "justify-end" : "justify-start")}
                            >
                              <div
                                className={cn(
                                  "max-w-[78%] rounded-lg px-4 py-3 text-sm shadow-sm",
                                  outbound
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-foreground",
                                )}
                              >
                                <p className="whitespace-pre-wrap break-words">{message.body}</p>
                                <div
                                  className={cn(
                                    "mt-2 flex items-center justify-end gap-2 text-[10px]",
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
                      </div>
                    </ScrollArea>

                    <div className="border-t p-4">
                      <div className="flex gap-3">
                        <Textarea
                          value={replyText}
                          onChange={(event) => setReplyText(event.target.value)}
                          placeholder="Digite a resposta..."
                          className="min-h-[72px] resize-none"
                        />
                        <Button
                          className="h-[72px] px-5"
                          onClick={handleSendReply}
                          disabled={sending || !replyText.trim()}
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
                <div className="flex gap-2">
                  <Button onClick={handleSaveRule} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Salvar
                  </Button>
                  {editingRule.id && (
                    <Button
                      variant="outline"
                      onClick={() => setEditingRule({ keyword: "", response: "", active: true })}
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
    </div>
  );
}
