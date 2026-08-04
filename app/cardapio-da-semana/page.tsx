"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ChevronDown, ClipboardList, Leaf, MessageCircle, Minus, Plus, Send, ShoppingBasket, Soup, Star, User, Utensils } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type OpcaoPublica = {
  id: string;
  nome: string;
  categoria: string;
  descricao?: string | null;
  ordem?: number;
};

type CardapioPublico = {
  id: number;
  nome: string;
  codigo: string;
  whatsappNumber?: string | null;
  destinoWhatsApp?: "principal" | "alternativo";
  opcoes: OpcaoPublica[];
};

const TAMANHOS = ["200g", "300g", "400g", "500g", "PERSONALIZADO"] as const;
type TamanhoSelecionado = (typeof TAMANHOS)[number] | "";

function apiUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api";
  return `${base.replace(/\/+$/, "")}${path}`;
}

function normalize(value?: string | null) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

function cleanPhone(value?: string | null) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("55") ? digits : `55${digits}`;
}

function cleanGramas(value?: string | number | null) {
  return String(value ?? "").replace(/\D/g, "").slice(0, 4);
}

function categoryLabel(category: string) {
  const normalized = normalize(category);
  if (!normalized || normalized === "OUTROS" || normalized === "DELETADO") return "FIT - MONTE SUA MARMITA";
  if (normalized.includes("ARROZ")) return "ARROZ PADRÃO";
  if (normalized.includes("PURE")) return "PURÊ PADRÃO";
  if (normalized.includes("SOPA")) return "SOPAS E CALDOS";
  if (normalized === "VEGETARIANA" || normalized === "VEGETARIANO") return "VEGETARIANA";
  return category.toUpperCase();
}

function categoryOrder(category: string) {
  const normalized = normalize(category);
  if (normalized.startsWith("FIT")) return 0;
  if (normalized.includes("ARROZ")) return 1;
  if (normalized.includes("PURE")) return 2;
  if (normalized.includes("LOW")) return 3;
  if (normalized.includes("VEGET")) return 4;
  if (normalized.includes("SOPA") || normalized.includes("CALDO")) return 5;
  return 99;
}

function categoryStyle(category: string) {
  const normalized = normalize(category);
  if (normalized.includes("LOW")) return { icon: Leaf, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-100" };
  if (normalized.includes("SOPA")) return { icon: Soup, color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-100" };
  if (normalized.includes("VEGET")) return { icon: Leaf, color: "text-teal-700", bg: "bg-teal-50", border: "border-teal-100" };
  if (normalized === "DELETADO" || normalized === "FIT" || normalized === "OUTROS") {
    return { icon: Utensils, color: "text-[#b85b36]", bg: "bg-[#fff7f2]", border: "border-[#f1d7c8]" };
  }
  return { icon: Star, color: "text-[#b85b36]", bg: "bg-[#fff7f2]", border: "border-[#f1d7c8]" };
}

function montarMensagem({
  nome,
  observacoes,
  telefone,
  personalizada,
  opcoes,
  itensPedido,
  feijaoOpcional,
  tamanhoSelecionado,
}: {
  nome: string;
  observacoes: string;
  telefone: string;
  personalizada: {
    carboGramas: string;
    proteinaGramas: string;
    feijaoGramas: string;
    legumeGramas: string;
  };
  opcoes: OpcaoPublica[];
  itensPedido: Record<string, number>;
  feijaoOpcional: Record<string, boolean>;
  tamanhoSelecionado: TamanhoSelecionado;
}) {
  const escolhidas = opcoes
    .filter((opcao) => Number(itensPedido[opcao.id] || 0) > 0)
    .map((opcao) => {
      const quantidade = Number(itensPedido[opcao.id] || 0);
      const adicionalFeijao = feijaoOpcional[opcao.id] ? " + feijão opcional (+R$2/unidade)" : "";
      return `${quantidade}x ${opcao.nome}${adicionalFeijao}`;
    });

  const linhasPersonalizada = tamanhoSelecionado === "PERSONALIZADO"
    ? [
        "Pesagem personalizada do pedido:",
        `- Carbo: ${personalizada.carboGramas || "-"}g`,
        `- Proteína: ${personalizada.proteinaGramas || "-"}g`,
        `- Feijão: ${personalizada.feijaoGramas || "-"}g`,
        `- Legumes: ${personalizada.legumeGramas || "-"}g`,
      ]
    : [];

  const total = escolhidas.reduce((acc, linha) => acc + Number(linha.split("x")[0] || 0), 0);
  const totalFeijao = opcoes.reduce((acc, opcao) => (
    acc + (feijaoOpcional[opcao.id] ? Number(itensPedido[opcao.id] || 0) : 0)
  ), 0);

  return [
    "PEDIDO:",
    "",
    `Nome: ${nome || "-"}`,
    `Telefone: ${telefone || "-"}`,
    `Tamanho do pedido: ${tamanhoSelecionado}`,
    ...linhasPersonalizada,
    observacoes.trim() ? `Observação: ${observacoes.trim()}` : null,
    "",
    "Marmitas:",
    ...escolhidas,
    totalFeijao ? `Adicional de feijão: ${totalFeijao} unidade(s) (+R$2 cada)` : null,
    "",
    `Total de marmitas: ${total}`,
  ].filter(Boolean).join("\n");
}

export default function CardapioDaSemanaPage() {
  const dadosSectionRef = useRef<HTMLElement>(null);
  const [cardapio, setCardapio] = useState<CardapioPublico | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [itensPedido, setItensPedido] = useState<Record<string, number>>({});
  const [feijaoOpcional, setFeijaoOpcional] = useState<Record<string, boolean>>({});
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState<TamanhoSelecionado>("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState("");
  const [personalizada, setPersonalizada] = useState({
    carboGramas: "",
    proteinaGramas: "",
    feijaoGramas: "",
    legumeGramas: "",
  });

  const whatsappNumber = cleanPhone(
    cardapio?.whatsappNumber ||
      (cardapio?.destinoWhatsApp === "alternativo" ? "" : process.env.NEXT_PUBLIC_WHATSAPP_PEDIDOS_NUMERO),
  );

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const destino = new URLSearchParams(window.location.search).get("destino");
        const path = destino === "alternativo" ? "/public/cardapio-semana?destino=alternativo" : "/public/cardapio-semana";
        const res = await fetch(apiUrl(path), { cache: "no-store" });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.message || "Não foi possível carregar o cardápio.");
        if (alive) setCardapio(data);
      } catch (e: any) {
        if (alive) setError(e?.message || "Erro ao carregar cardápio.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const opcoes = cardapio?.opcoes || [];
  const total = useMemo(() => {
    return Object.values(itensPedido).reduce((acc, quantidade) => acc + Number(quantidade || 0), 0);
  }, [itensPedido]);
  const totalFeijaoOpcional = useMemo(() => {
    return opcoes.reduce((acc, opcao) => (
      acc + (feijaoOpcional[opcao.id] ? Number(itensPedido[opcao.id] || 0) : 0)
    ), 0);
  }, [feijaoOpcional, itensPedido, opcoes]);

  const grupos = useMemo(() => {
    const map = new Map<string, OpcaoPublica[]>();
    opcoes.forEach((opcao) => {
      const label = categoryLabel(opcao.categoria);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(opcao);
    });

    return Array.from(map.entries())
      .map(([categoria, items]) => ({
        categoria,
        items: items.sort((a, b) => Number(a.ordem || 0) - Number(b.ordem || 0) || a.nome.localeCompare(b.nome)),
      }))
      .sort((a, b) => {
        return categoryOrder(a.categoria) - categoryOrder(b.categoria);
      });
  }, [opcoes]);

  function getItemPedido(id: string) {
    return itensPedido[id] || 0;
  }

  function changeQuantity(id: string, delta: number) {
    if (!tamanhoSelecionado) return;

    setItensPedido((prev) => {
      const atual = Number(prev[id] || 0);
      const proximo = Math.max(0, atual + delta);
      if (proximo === 0) {
        setFeijaoOpcional((feijaoPrev) => ({ ...feijaoPrev, [id]: false }));
      }
      return {
        ...prev,
        [id]: proximo,
      };
    });
  }

  function toggleFeijaoOpcional(id: string, checked: boolean) {
    if (!getItemPedido(id)) return;
    setFeijaoOpcional((prev) => ({ ...prev, [id]: checked }));
  }

  function enviarPedido() {
    if (!tamanhoSelecionado || !total) return;
    if (!whatsappNumber) return;

    const personalizadaSanitizada = {
      carboGramas: cleanGramas(personalizada.carboGramas),
      proteinaGramas: cleanGramas(personalizada.proteinaGramas),
      feijaoGramas: cleanGramas(personalizada.feijaoGramas),
      legumeGramas: cleanGramas(personalizada.legumeGramas),
    };

    const text = montarMensagem({
      nome,
      observacoes,
      telefone,
      personalizada: personalizadaSanitizada,
      opcoes,
      itensPedido,
      feijaoOpcional,
      tamanhoSelecionado,
    });

    // O WhatsApp é o fluxo principal e abre sem depender da API de registro.
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
    const whatsappWindow = window.open(whatsappUrl, "_blank");
    if (!whatsappWindow) window.location.href = whatsappUrl;

    void (async () => {
    try {
      setEnviando(true);
      setErroEnvio("");
      const res = await fetch(apiUrl("/public/pedidos"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardapioId: cardapio?.id,
          origem: cardapio?.destinoWhatsApp || "principal",
          nome,
          telefone,
          tamanhoLabel: tamanhoSelecionado,
          observacoes,
          personalizada: personalizadaSanitizada,
          itens: opcoes
            .map((opcao) => ({
              opcaoId: Number(opcao.id),
              quantidade: Number(itensPedido[opcao.id] || 0),
              adicionarFeijao: !!feijaoOpcional[opcao.id],
            }))
            .filter((item) => item.quantidade > 0),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Não foi possível registrar o pedido.");
    } catch {
      setErroEnvio("O WhatsApp foi aberto, mas o pedido não pôde ser registrado no sistema agora.");
    } finally {
      setEnviando(false);
    }
    })();
  }

  function continuarParaEnvio() {
    dadosSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderGramasInput(label: string, keyName: "carboGramas" | "proteinaGramas" | "feijaoGramas" | "legumeGramas") {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <Input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          value={personalizada[keyName]}
          onChange={(event) => setPersonalizada((prev) => ({ ...prev, [keyName]: cleanGramas(event.target.value) }))}
          placeholder="Somente números"
        />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f1e9] px-3 py-4 text-[#15332f] sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl rounded-[28px] border border-[#e3d8c8] bg-[#fffdf8] p-4 shadow-2xl shadow-black/10 sm:p-8">
        <header className="grid gap-5 sm:grid-cols-[280px_1fr] sm:items-center">
          <div className="flex items-center justify-center overflow-hidden rounded-2xl bg-[#1b413c] p-2 shadow-sm">
            <img src="/brand/fitgarden-logo-04.png" alt="Fit Garden" className="h-auto w-full object-contain" />
          </div>

          <div className="text-center sm:text-left">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#b85b36]">Marmitas saudáveis</p>
            <h1 className="mt-1 text-3xl font-black uppercase tracking-tight text-[#14332f] sm:text-5xl">
              Cardápio da Semana
            </h1>
            <p className="mt-2 text-sm font-medium text-[#47625d] sm:text-base">
              Monte seu pedido escolhendo o tamanho e a quantidade de cada marmita.
            </p>
          </div>

        </header>

        <section className="mt-6 rounded-2xl border-4 border-[#14332f] bg-white p-3 shadow-sm">
          <div className="mb-2 text-xs font-black uppercase tracking-widest text-[#14332f]">É muito fácil pedir:</div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: CheckCircle2, text: "Escolha um tamanho para o pedido todo." },
              { icon: ClipboardList, text: "Informe as quantidades de cada marmita." },
              { icon: Send, text: "Digite nome, telefone e envie." },
            ].map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.text} className="flex items-center gap-3 rounded-xl bg-[#f7faf8] p-3">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-[#14332f] text-sm font-black text-white">{index + 1}</div>
                  <Icon className="h-7 w-7 shrink-0 text-[#14332f]" />
                  <p className="text-sm font-bold leading-snug text-[#14332f]">{step.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        {loading && (
          <div className="mt-8 rounded-2xl border border-dashed p-10 text-center font-semibold text-[#47625d]">
            Carregando cardápio...
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-center font-semibold text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <section className="mt-6 rounded-2xl border bg-white p-4 shadow-sm">
              <div className="grid gap-4 lg:grid-cols-[260px_1fr] lg:items-start">
                <div className="space-y-2">
                  <Label className="text-base font-black uppercase text-[#14332f]">Tamanho do pedido</Label>
                  <select
                    value={tamanhoSelecionado}
                    onChange={(event) => setTamanhoSelecionado(event.target.value as TamanhoSelecionado)}
                    className="h-11 w-full rounded-xl border border-[#d8cbbd] bg-[#fffdf8] px-3 text-sm font-black text-[#14332f]"
                  >
                    <option value="" disabled>
                      Selecionar
                    </option>
                    {TAMANHOS.map((tamanho) => (
                      <option key={tamanho} value={tamanho}>
                        {tamanho}
                      </option>
                    ))}
                  </select>
                  <p className={cn("text-xs font-medium", tamanhoSelecionado ? "text-[#60746f]" : "font-bold text-[#b85b36]")}>
                    {tamanhoSelecionado
                      ? "Todas as marmitas do pedido usam esse tamanho."
                      : "Selecione o tamanho para liberar as quantidades."}
                  </p>
                </div>

                {tamanhoSelecionado === "PERSONALIZADO" && (
                  <div className="rounded-2xl border border-[#e9d8c8] bg-[#fff7f2] p-4">
                    <h2 className="text-sm font-black uppercase tracking-wide text-[#b85b36]">Personalizado</h2>
                    <div className="mt-3 grid gap-4 md:grid-cols-4">
                      {renderGramasInput("Carbo", "carboGramas")}
                      {renderGramasInput("Proteína", "proteinaGramas")}
                      {renderGramasInput("Feijão", "feijaoGramas")}
                      {renderGramasInput("Legumes", "legumeGramas")}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-4 space-y-2">
                <Label>Observação (opcional)</Label>
                <Textarea
                  value={observacoes}
                  onChange={(event) => setObservacoes(event.target.value)}
                  placeholder="Alguma observação?"
                  className="min-h-10 resize-none"
                />
              </div>
            </section>

            <section className="mt-6 grid gap-4 lg:grid-cols-2">
              {grupos.map((grupo) => {
                const style = categoryStyle(grupo.categoria);
                const Icon = style.icon;
                return (
                  <Card key={grupo.categoria} className={cn("overflow-hidden rounded-2xl border bg-white shadow-sm", style.border)}>
                    <div className={cn("flex items-center gap-3 border-b px-4 py-3", style.bg, style.border)}>
                      <Icon className={cn("h-6 w-6", style.color)} />
                      <h2 className={cn("text-lg font-black uppercase tracking-tight", style.color)}>{grupo.categoria}</h2>
                    </div>
                    <div className="divide-y">
                      {grupo.items.map((opcao, index) => {
                        const quantidade = getItemPedido(opcao.id);
                        return (
                          <div key={opcao.id} className="grid gap-2 px-3 py-2.5 sm:grid-cols-[42px_minmax(0,1fr)_120px] sm:items-center sm:px-4">
                            <Badge variant="secondary" className="h-7 w-fit justify-center rounded-lg bg-[#f6e4d8] font-black text-[#b85b36] sm:w-auto">
                              {index + 1}
                            </Badge>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold leading-snug text-[#253f3a]">{opcao.nome}</div>
                              {opcao.descricao?.trim() ? (
                                <p className="mt-1 text-xs font-medium leading-snug text-[#60746f]">{opcao.descricao}</p>
                              ) : null}
                            </div>
                            <div className="grid grid-cols-[34px_34px_34px] justify-end overflow-hidden rounded-lg border bg-white sm:grid-cols-[38px_38px_38px]">
                              <div className="grid place-items-center text-sm font-black tabular-nums text-[#14332f]">{quantidade}</div>
                              <button type="button" disabled={!tamanhoSelecionado} className="grid place-items-center border-l text-[#14332f] transition hover:bg-[#f6e4d8] disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-300" onClick={() => changeQuantity(opcao.id, -1)}>
                                <Minus className="h-4 w-4" />
                              </button>
                              <button type="button" disabled={!tamanhoSelecionado} className="grid place-items-center border-l text-[#14332f] transition hover:bg-[#dceee5] disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-300" onClick={() => changeQuantity(opcao.id, 1)}>
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                            {quantidade > 0 ? (
                              <label className="flex items-center gap-2 rounded-lg bg-[#fff7f2] px-3 py-2 text-xs font-bold text-[#b85b36] sm:col-start-2 sm:col-span-2">
                                <input
                                  type="checkbox"
                                  checked={!!feijaoOpcional[opcao.id]}
                                  onChange={(event) => toggleFeijaoOpcional(opcao.id, event.target.checked)}
                                  className="h-4 w-4 accent-[#b85b36]"
                                />
                                Adicionar feijão opcional nesta marmita (+R$2 por unidade)
                              </label>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                );
              })}
            </section>

            <section className="sticky bottom-2 z-20 mt-6 rounded-2xl border-2 border-[#14332f] bg-white/95 p-3 shadow-2xl backdrop-blur sm:bottom-3 sm:p-4">
              <div className="grid gap-2 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-4">
                <div className="flex min-w-0 items-center justify-center gap-2 text-[#14332f] sm:justify-start">
                  <ShoppingBasket className="h-6 w-6 shrink-0" />
                  <div className="flex items-baseline gap-2 leading-tight sm:block">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#60746f]">Seu pedido</p>
                    <p className="whitespace-nowrap font-black"><span className="text-2xl text-[#b85b36]">{total}</span> marmita(s)</p>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={continuarParaEnvio}
                  disabled={!tamanhoSelecionado || !total}
                  className="h-12 w-full rounded-xl bg-[#c24f2f] px-3 text-sm font-black uppercase text-white shadow-lg shadow-[#c24f2f]/25 hover:bg-[#a94329] sm:justify-self-end sm:px-7 sm:text-base"
                >
                  <span className="truncate">{!tamanhoSelecionado ? "Selecione o tamanho" : total ? "Continuar para enviar" : "Escolha as marmitas"}</span>
                  {total ? <ChevronDown className="ml-2 h-5 w-5" /> : null}
                </Button>
              </div>
              {totalFeijaoOpcional ? (
                <p className="mt-1 text-center text-sm font-bold text-[#b85b36]">
                  Feijão opcional: {totalFeijaoOpcional} unidade(s) (+R$2 cada)
                </p>
              ) : null}
              {total > 0 ? (
                <p className="mt-2 text-center text-xs font-black uppercase tracking-wide text-[#b85b36]">
                  Atenção: seu pedido ainda não foi enviado
                </p>
              ) : null}
            </section>

            <section ref={dadosSectionRef} className="mt-5 scroll-mt-4 rounded-2xl border-2 border-[#14332f] bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-lg font-black uppercase text-[#14332f]">
                <User className="h-5 w-5" />
                Último passo: enviar pedido
              </div>
              <div className="mb-4 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold leading-snug text-emerald-900">
                <MessageCircle className="h-6 w-6 shrink-0" />
                <p>Preencha seus dados e toque no botão abaixo. Não precisa tirar print: seu pedido completo abrirá pronto no WhatsApp.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nome completo</Label>
                  <Input value={nome} onChange={(event) => setNome(event.target.value)} placeholder="Digite seu nome" />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={telefone} onChange={(event) => setTelefone(event.target.value)} placeholder="Digite seu telefone" />
                </div>
              </div>
              {!whatsappNumber && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
                  Configure o número em NEXT_PUBLIC_WHATSAPP_PEDIDOS_NUMERO para ativar o envio pelo WhatsApp.
                </div>
              )}

              <div className="mt-5 flex justify-center">
                <Button
                  type="button"
                  size="lg"
                  className="h-14 w-full max-w-xl rounded-xl bg-[#c24f2f] text-base font-black uppercase tracking-wide text-white shadow-lg shadow-[#c24f2f]/25 hover:bg-[#a94329] sm:text-xl"
                  onClick={enviarPedido}
                  disabled={enviando || !tamanhoSelecionado || !total || !nome.trim() || !telefone.trim() || !whatsappNumber}
                >
                  <Send className="mr-3 h-5 w-5" />
                  {enviando ? "Registrando pedido..." : "Abrir WhatsApp e enviar pedido"}
                </Button>
              </div>

              {total > 0 && (!nome.trim() || !telefone.trim()) ? (
                <p className="mt-3 text-center text-sm font-bold text-[#b85b36]">
                  Preencha nome e telefone para liberar o botão de envio.
                </p>
              ) : null}

              {erroEnvio ? <p className="mt-3 text-center text-sm font-semibold text-red-700">{erroEnvio}</p> : null}

              <p className="mt-4 text-center text-xs font-medium text-[#60746f]">
                Seus dados estão seguros e seu pedido será enviado para nossa equipe pelo WhatsApp.
              </p>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
