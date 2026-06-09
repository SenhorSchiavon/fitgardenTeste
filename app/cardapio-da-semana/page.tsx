"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardList, Leaf, Minus, Plus, Send, ShoppingBasket, Soup, Star, User, Utensils } from "lucide-react";

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
  ordem?: number;
};

type PreparoPublico = {
  id: string;
  nome: string;
  tipo: "CARBOIDRATO" | "PROTEINA" | "FEIJAO" | "LEGUMES";
};

type CardapioPublico = {
  id: number;
  nome: string;
  codigo: string;
  opcoes: OpcaoPublica[];
  preparos?: PreparoPublico[];
};

const CATEGORY_ORDER = ["DELETADO", "FIT", "LOW CARB", "SOPAS E CALDOS", "SOPAS", "VEGETARIANA", "VEGETARIANO", "OUTROS"];
const TAMANHOS = ["200g", "300g", "400g", "500g", "PERSONALIZADO"] as const;

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

function categoryLabel(category: string) {
  const normalized = normalize(category);
  if (!normalized || normalized === "OUTROS" || normalized === "DELETADO") return "FIT - MONTE SUA MARMITA";
  if (normalized.includes("SOPA")) return "SOPAS E CALDOS";
  if (normalized === "VEGETARIANA" || normalized === "VEGETARIANO") return "VEGETARIANO";
  return category.toUpperCase();
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
  personalizada,
  opcoes,
  itensPedido,
}: {
  nome: string;
  observacoes: string;
  personalizada: {
    ativo: boolean;
    carboNome: string;
    proteinaNome: string;
    feijaoNome: string;
    legumeNome: string;
    carboGramas: string;
    proteinaGramas: string;
    feijaoGramas: string;
    legumeGramas: string;
  };
  opcoes: OpcaoPublica[];
  itensPedido: Record<string, { quantidade: number; tamanho: string }>;
}) {
  const escolhidas = opcoes
    .filter((opcao) => Number(itensPedido[opcao.id]?.quantidade || 0) > 0)
    .map((opcao) => `${itensPedido[opcao.id].quantidade}x ${opcao.nome} (${itensPedido[opcao.id].tamanho})`);

  const linhasPersonalizada = personalizada.ativo
    ? [
        "1x PERSONALIZADA",
        `- Carbo: ${personalizada.carboNome || "-"} ${personalizada.carboGramas || "-"}g`,
        `- Proteina: ${personalizada.proteinaNome || "-"} ${personalizada.proteinaGramas || "-"}g`,
        `- Feijao: ${personalizada.feijaoNome || "-"} ${personalizada.feijaoGramas || "-"}g`,
        `- Legumes: ${personalizada.legumeNome || "-"} ${personalizada.legumeGramas || "-"}g`,
      ]
    : [];

  const total = escolhidas.reduce((acc, linha) => acc + Number(linha.split("x")[0] || 0), 0) + (personalizada.ativo ? 1 : 0);

  return [
    "Ola! Quero fazer meu pedido da Fit Garden:",
    "",
    `Nome: ${nome || "-"}`,
    "",
    "Marmitas:",
    ...escolhidas,
    ...linhasPersonalizada,
    "",
    `Total de marmitas: ${total}`,
    observacoes.trim() ? "" : null,
    observacoes.trim() ? `Observacoes: ${observacoes.trim()}` : null,
  ].filter(Boolean).join("\n");
}

export default function CardapioDaSemanaPage() {
  const [cardapio, setCardapio] = useState<CardapioPublico | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [itensPedido, setItensPedido] = useState<Record<string, { quantidade: number; tamanho: string }>>({});
  const [nome, setNome] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [personalizadaAtiva, setPersonalizadaAtiva] = useState(false);
  const [personalizada, setPersonalizada] = useState({
    carboId: "",
    proteinaId: "",
    feijaoId: "",
    legumeId: "",
    carboGramas: "",
    proteinaGramas: "",
    feijaoGramas: "",
    legumeGramas: "",
  });

  const whatsappNumber = cleanPhone(process.env.NEXT_PUBLIC_WHATSAPP_PEDIDOS_NUMERO);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(apiUrl("/public/cardapio-semana"), { cache: "no-store" });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.message || "Nao foi possivel carregar o cardapio.");
        if (alive) setCardapio(data);
      } catch (e: any) {
        if (alive) setError(e?.message || "Erro ao carregar cardapio.");
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
  const preparos = cardapio?.preparos || [];
  const total = useMemo(() => {
    return Object.values(itensPedido).reduce((acc, item) => acc + Number(item.quantidade || 0), 0) + (personalizadaAtiva ? 1 : 0);
  }, [itensPedido, personalizadaAtiva]);

  const preparosPorTipo = useMemo(() => {
    return {
      carboidratos: preparos.filter((preparo) => preparo.tipo === "CARBOIDRATO"),
      proteinas: preparos.filter((preparo) => preparo.tipo === "PROTEINA"),
      feijoes: preparos.filter((preparo) => preparo.tipo === "FEIJAO"),
      legumes: preparos.filter((preparo) => preparo.tipo === "LEGUMES"),
    };
  }, [preparos]);

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
        const ia = CATEGORY_ORDER.findIndex((item) => normalize(a.categoria).includes(normalize(item)));
        const ib = CATEGORY_ORDER.findIndex((item) => normalize(b.categoria).includes(normalize(item)));
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      });
  }, [opcoes]);

  const getPreparoNome = (id: string) => preparos.find((preparo) => preparo.id === id)?.nome || "";

  function getItemPedido(id: string) {
    return itensPedido[id] || { quantidade: 0, tamanho: "200g" };
  }

  function changeQuantity(id: string, delta: number) {
    setItensPedido((prev) => {
      const atual = prev[id] || { quantidade: 0, tamanho: "200g" };
      return {
        ...prev,
        [id]: { ...atual, quantidade: Math.max(0, Number(atual.quantidade || 0) + delta) },
      };
    });
  }

  function changeTamanhoItem(id: string, tamanho: string) {
    setItensPedido((prev) => {
      const atual = prev[id] || { quantidade: 0, tamanho: "200g" };
      return {
        ...prev,
        [id]: { ...atual, tamanho },
      };
    });
  }

  function enviarPedido() {
    if (!total) return;
    if (!whatsappNumber) return;

    const text = montarMensagem({
      nome,
      observacoes,
      personalizada: {
        ativo: personalizadaAtiva,
        carboNome: getPreparoNome(personalizada.carboId),
        proteinaNome: getPreparoNome(personalizada.proteinaId),
        feijaoNome: getPreparoNome(personalizada.feijaoId),
        legumeNome: getPreparoNome(personalizada.legumeId),
        carboGramas: personalizada.carboGramas,
        proteinaGramas: personalizada.proteinaGramas,
        feijaoGramas: personalizada.feijaoGramas,
        legumeGramas: personalizada.legumeGramas,
      },
      opcoes,
      itensPedido,
    });

    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`, "_blank");
  }

  function renderPreparoSelect(label: string, value: string, keyName: "carboId" | "proteinaId" | "feijaoId" | "legumeId", items: PreparoPublico[]) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <select
          value={value}
          onChange={(event) => setPersonalizada((prev) => ({ ...prev, [keyName]: event.target.value }))}
          className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Selecione</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nome}
            </option>
          ))}
        </select>
      </div>
    );
  }

  function renderGramasInput(label: string, keyName: "carboGramas" | "proteinaGramas" | "feijaoGramas" | "legumeGramas") {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <Input
          type="number"
          min={0}
          value={personalizada[keyName]}
          onChange={(event) => setPersonalizada((prev) => ({ ...prev, [keyName]: event.target.value }))}
          placeholder="Gramas"
        />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f1e9] px-3 py-4 text-[#15332f] sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl rounded-[28px] border border-[#e3d8c8] bg-[#fffdf8] p-4 shadow-2xl shadow-black/10 sm:p-8">
        <header className="grid gap-5 sm:grid-cols-[180px_1fr_150px] sm:items-center">
          <div className="flex items-center justify-center rounded-2xl bg-white p-3 shadow-sm">
            <img src="/brand/fitgarden-horizontal.png" alt="Fit Garden" className="max-h-20 object-contain" />
          </div>

          <div className="text-center sm:text-left">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#b85b36]">Marmitas saudaveis</p>
            <h1 className="mt-1 text-3xl font-black uppercase tracking-tight text-[#14332f] sm:text-5xl">
              Cardapio da Semana
            </h1>
            <p className="mt-2 text-sm font-medium text-[#47625d] sm:text-base">
              Monte seu pedido escolhendo o tamanho e a quantidade de cada marmita.
            </p>
          </div>

          <div className="hidden justify-center sm:flex">
            <div className="h-28 w-28 rounded-[28px] border-4 border-white bg-[radial-gradient(circle_at_30%_30%,#f3c59f,#bb5b36_55%,#14332f)] shadow-xl" />
          </div>
        </header>

        <section className="mt-6 rounded-2xl border-4 border-[#14332f] bg-white p-3 shadow-sm">
          <div className="mb-2 text-xs font-black uppercase tracking-widest text-[#14332f]">E muito facil pedir:</div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: CheckCircle2, text: "Escolha o tamanho em cada marmita." },
              { icon: ClipboardList, text: "Informe as quantidades ou monte personalizada." },
              { icon: Send, text: "Digite nome, observacao e envie." },
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
            Carregando cardapio...
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
              <Label className="text-base font-black uppercase text-[#14332f]">Personalizada</Label>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-[#60746f]">Monte uma marmita com ingredientes e pesagens informadas por voce.</p>
                <Button
                  type="button"
                  variant={personalizadaAtiva ? "default" : "outline"}
                  className={cn(personalizadaAtiva && "bg-[#14332f] hover:bg-[#0f2825]")}
                  onClick={() => setPersonalizadaAtiva((prev) => !prev)}
                >
                  {personalizadaAtiva ? "Remover personalizada" : "Adicionar personalizada"}
                </Button>
              </div>
            </section>

            {personalizadaAtiva && (
              <section className="mt-5 rounded-2xl border bg-white p-4 shadow-sm">
                <h2 className="text-lg font-black uppercase text-[#14332f]">Personalizada</h2>
                <p className="mt-1 text-sm font-medium text-[#60746f]">
                  Escolha os ingredientes e informe as pesagens desejadas.
                </p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {renderPreparoSelect("Carbo", personalizada.carboId, "carboId", preparosPorTipo.carboidratos)}
                  {renderPreparoSelect("Proteina", personalizada.proteinaId, "proteinaId", preparosPorTipo.proteinas)}
                  {renderPreparoSelect("Feijao", personalizada.feijaoId, "feijaoId", preparosPorTipo.feijoes)}
                  {renderPreparoSelect("Legumes", personalizada.legumeId, "legumeId", preparosPorTipo.legumes)}
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-4">
                  {renderGramasInput("Gramas do carbo", "carboGramas")}
                  {renderGramasInput("Gramas da proteina", "proteinaGramas")}
                  {renderGramasInput("Gramas do feijao", "feijaoGramas")}
                  {renderGramasInput("Gramas dos legumes", "legumeGramas")}
                </div>
              </section>
            )}

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
                        const item = getItemPedido(opcao.id);
                        return (
                          <div key={opcao.id} className="grid gap-2 px-3 py-2.5 sm:grid-cols-[42px_minmax(0,1fr)_100px_120px] sm:items-center sm:px-4">
                            <Badge variant="secondary" className="h-7 w-fit justify-center rounded-lg bg-[#f6e4d8] font-black text-[#b85b36] sm:w-auto">
                              {index + 1}
                            </Badge>
                            <div className="min-w-0 text-sm font-semibold leading-snug text-[#253f3a]">{opcao.nome}</div>
                            {item.quantidade > 0 ? (
                              <select
                                value={item.tamanho}
                                onChange={(event) => changeTamanhoItem(opcao.id, event.target.value)}
                                className="h-9 rounded-lg border bg-white px-2 text-xs font-bold text-[#14332f]"
                              >
                                {TAMANHOS.filter((tamanho) => tamanho !== "PERSONALIZADO").map((tamanho) => (
                                  <option key={tamanho} value={tamanho}>
                                    {tamanho}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <div className="hidden sm:block" />
                            )}
                            <div className="grid grid-cols-[34px_34px_34px] justify-end overflow-hidden rounded-lg border bg-white sm:grid-cols-[38px_38px_38px]">
                              <div className="grid place-items-center text-sm font-black tabular-nums text-[#14332f]">{item.quantidade}</div>
                              <button type="button" className="grid place-items-center border-l text-[#14332f] transition hover:bg-[#f6e4d8]" onClick={() => changeQuantity(opcao.id, -1)}>
                                <Minus className="h-4 w-4" />
                              </button>
                              <button type="button" className="grid place-items-center border-l text-[#14332f] transition hover:bg-[#dceee5]" onClick={() => changeQuantity(opcao.id, 1)}>
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                );
              })}
            </section>

            <section className="sticky bottom-3 z-10 mt-6 rounded-2xl border bg-white/95 p-4 shadow-xl backdrop-blur">
              <div className="flex items-center justify-center gap-3 text-xl font-black uppercase tracking-wide text-[#14332f]">
                <ShoppingBasket className="h-7 w-7" />
                Total de marmitas:
                <span className="text-3xl text-[#b85b36]">{total}</span>
              </div>
            </section>

            <section className="mt-5 rounded-2xl border bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-lg font-black uppercase text-[#14332f]">
                <User className="h-5 w-5" />
                Seus dados
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nome completo</Label>
                  <Input value={nome} onChange={(event) => setNome(event.target.value)} placeholder="Digite seu nome" />
                </div>
                <div className="space-y-2">
                  <Label>Observacoes opcional</Label>
                  <Textarea
                    value={observacoes}
                    onChange={(event) => setObservacoes(event.target.value)}
                    placeholder="Alguma observacao sobre seu pedido?"
                    className="min-h-10 resize-none"
                  />
                </div>
              </div>

              {!whatsappNumber && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
                  Configure o numero em NEXT_PUBLIC_WHATSAPP_PEDIDOS_NUMERO para ativar o envio pelo WhatsApp.
                </div>
              )}

              <div className="mt-5 flex justify-center">
                <Button
                  type="button"
                  size="lg"
                  className="h-14 w-full max-w-xl rounded-xl bg-[#c24f2f] text-base font-black uppercase tracking-wide text-white shadow-lg shadow-[#c24f2f]/25 hover:bg-[#a94329] sm:text-xl"
                  onClick={enviarPedido}
                  disabled={!total || !whatsappNumber}
                >
                  <Send className="mr-3 h-5 w-5" />
                  Enviar meu pedido
                </Button>
              </div>

              <p className="mt-4 text-center text-xs font-medium text-[#60746f]">
                Seus dados estao seguros e seu pedido sera enviado para nossa equipe pelo WhatsApp.
              </p>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
