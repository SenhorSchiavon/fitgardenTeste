"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Leaf,
  Minus,
  Plus,
  Search,
  Send,
  ShieldCheck,
  ShoppingBasket,
  Soup,
  Utensils,
  X,
} from "lucide-react";

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

type CardapioPublico = {
  id: number;
  nome: string;
  codigo: string;
  opcoes: OpcaoPublica[];
};

type OpcaoSelecionada = OpcaoPublica & {
  quantity: number;
};

const CATEGORY_ORDER = ["FIT - MONTE SUA MARMITA", "LOW CARB", "VEGETARIANO", "SOPAS E CALDOS", "OUTROS"];

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

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(date);
}

function getCurrentWeekRange() {
  const today = new Date();
  const monday = new Date(today);
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  monday.setDate(today.getDate() + diffToMonday);

  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  return `${formatShortDate(monday)} - ${formatShortDate(friday)}`;
}

function categoryLabel(category: string) {
  const normalized = normalize(category);
  if (!normalized || normalized === "OUTROS" || normalized === "DELETADO") return "FIT - MONTE SUA MARMITA";
  if (normalized.includes("SOPA")) return "SOPAS E CALDOS";
  if (normalized === "VEGETARIANA" || normalized === "VEGETARIANO") return "VEGETARIANO";
  return category.toUpperCase();
}

function categoryIcon(category: string) {
  const normalized = normalize(category);
  if (normalized.includes("SOPA")) return Soup;
  if (normalized.includes("LOW") || normalized.includes("VEGET")) return Leaf;
  return Utensils;
}

function categoryTone(category: string) {
  const normalized = normalize(category);
  if (normalized.includes("LOW")) return "bg-emerald-50 text-emerald-800 ring-emerald-100";
  if (normalized.includes("VEGET")) return "bg-teal-50 text-teal-800 ring-teal-100";
  if (normalized.includes("SOPA")) return "bg-amber-50 text-amber-800 ring-amber-100";
  return "bg-[#fff4ec] text-[#a34d2f] ring-[#f2d7c8]";
}

function montarMensagem({
  nome,
  dataEntrega,
  observacoes,
  opcoes,
  quantities,
}: {
  nome: string;
  dataEntrega: string;
  observacoes: string;
  opcoes: OpcaoPublica[];
  quantities: Record<string, number>;
}) {
  const escolhidas = opcoes
    .filter((opcao) => Number(quantities[opcao.id] || 0) > 0)
    .map((opcao) => `${quantities[opcao.id]}x ${opcao.nome}`);
  const total = escolhidas.reduce((acc, linha) => acc + Number(linha.split("x")[0] || 0), 0);

  return [
    "Olá! Quero fazer meu pedido da Fit Garden:",
    "",
    `Nome: ${nome || "-"}`,
    dataEntrega ? `Data desejada: ${dataEntrega.split("-").reverse().join("/")}` : "Data desejada: -",
    "",
    "Marmitas:",
    ...escolhidas,
    "",
    `Total de marmitas: ${total}`,
    observacoes.trim() ? "" : null,
    observacoes.trim() ? `Observações: ${observacoes.trim()}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export default function CardapioDaSemana2Page() {
  const [cardapio, setCardapio] = useState<CardapioPublico | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("TODOS");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [dataEntrega, setDataEntrega] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const whatsappNumber = cleanPhone(process.env.NEXT_PUBLIC_WHATSAPP_PEDIDOS_NUMERO);
  const weekRange = useMemo(() => getCurrentWeekRange(), []);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(apiUrl("/public/cardapio-semana"), { cache: "no-store" });
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
  const total = useMemo(() => Object.values(quantities).reduce((acc, qtd) => acc + Number(qtd || 0), 0), [quantities]);

  const selectedOptions = useMemo<OpcaoSelecionada[]>(() => {
    return opcoes
      .map((opcao) => ({ ...opcao, quantity: Number(quantities[opcao.id] || 0) }))
      .filter((opcao) => opcao.quantity > 0);
  }, [opcoes, quantities]);

  const categories = useMemo(() => {
    const labels = Array.from(new Set(opcoes.map((opcao) => categoryLabel(opcao.categoria))));
    return labels.sort((a, b) => {
      const ia = CATEGORY_ORDER.indexOf(a);
      const ib = CATEGORY_ORDER.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b);
    });
  }, [opcoes]);

  const filteredOptions = useMemo(() => {
    const term = normalize(search);

    return opcoes
      .filter((opcao) => {
        const label = categoryLabel(opcao.categoria);
        const selected = Number(quantities[opcao.id] || 0) > 0;
        const matchesFilter =
          activeFilter === "TODOS" ||
          (activeFilter === "SELECIONADAS" && selected) ||
          activeFilter === label;
        const matchesSearch = !term || normalize(opcao.nome).includes(term) || normalize(label).includes(term);

        return matchesFilter && matchesSearch;
      })
      .sort((a, b) => Number(a.ordem || 0) - Number(b.ordem || 0) || a.nome.localeCompare(b.nome));
  }, [activeFilter, opcoes, quantities, search]);

  function changeQuantity(id: string, delta: number) {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(0, Number(prev[id] || 0) + delta),
    }));
  }

  function enviarPedido() {
    if (!total || !whatsappNumber) return;

    const text = montarMensagem({
      nome,
      dataEntrega,
      observacoes,
      opcoes,
      quantities,
    });

    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`, "_blank");
  }

  function FilterButton({ value, label }: { value: string; label: string }) {
    const active = activeFilter === value;
    return (
      <button
        type="button"
        className={cn(
          "h-10 shrink-0 rounded-full border px-4 text-sm font-black transition",
          active
            ? "border-[#12332f] bg-[#12332f] text-white shadow-lg shadow-[#12332f]/15"
            : "border-[#d9ded6] bg-white text-[#38514b] hover:border-[#12332f]/35",
        )}
        onClick={() => setActiveFilter(value)}
      >
        {label}
      </button>
    );
  }

  function CheckoutContent() {
    return (
      <>
        <div className="flex items-start justify-between gap-4 border-b border-[#edf0ea] p-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#bd5733]">Finalizar pedido</p>
            <h2 className="mt-1 text-2xl font-black text-[#12332f]">Seu pedido</h2>
            <p className="mt-1 text-sm font-semibold text-[#60756f]">{total} marmitas selecionadas</p>
          </div>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full bg-[#f4efe5] text-[#12332f] transition hover:bg-[#eadfce] lg:hidden"
            onClick={() => setCheckoutOpen(false)}
            aria-label="Fechar resumo"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(100vh-190px)] overflow-auto p-5">
          <div className="space-y-2">
            {selectedOptions.length ? (
              selectedOptions.map((opcao) => (
                <div key={opcao.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[#fbfaf6] px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-[#203c36]">{opcao.nome}</p>
                    <p className="text-xs font-semibold text-[#60756f]">{categoryLabel(opcao.categoria)}</p>
                  </div>
                  <Badge className="rounded-full bg-[#12332f] text-white">{opcao.quantity}x</Badge>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-[#d8cdbc] p-5 text-center text-sm font-semibold text-[#60756f]">
                Escolha ao menos uma marmita para finalizar.
              </div>
            )}
          </div>

          <div className="mt-5 rounded-2xl bg-[#f7f1e8] p-4 text-center">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#60756f]">Total de marmitas</p>
            <p className="mt-1 text-5xl font-black leading-none text-[#bd5733]">{total}</p>
          </div>

          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label>Nome completo</Label>
              <Input
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                placeholder="Digite seu nome"
                className="h-12 rounded-2xl border-[#dce5df] bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label>Data de entrega desejada</Label>
              <div className="relative">
                <Input
                  type="date"
                  value={dataEntrega}
                  onChange={(event) => setDataEntrega(event.target.value)}
                  className="h-12 rounded-2xl border-[#dce5df] bg-white pr-10"
                />
                <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações opcional</Label>
              <Textarea
                value={observacoes}
                onChange={(event) => setObservacoes(event.target.value)}
                placeholder="Alguma observação sobre seu pedido?"
                className="min-h-24 resize-none rounded-2xl border-[#dce5df] bg-white"
              />
            </div>
          </div>

          {!whatsappNumber && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
              Configure o número em NEXT_PUBLIC_WHATSAPP_PEDIDOS_NUMERO para ativar o envio pelo WhatsApp.
            </div>
          )}
        </div>

        <div className="border-t border-[#edf0ea] bg-white p-5">
          <Button
            type="button"
            size="lg"
            className="h-14 w-full rounded-2xl bg-[#c24f2f] text-base font-black uppercase tracking-wide text-white shadow-lg shadow-[#c24f2f]/20 hover:bg-[#a94329]"
            onClick={enviarPedido}
            disabled={!total || !whatsappNumber}
          >
            <Send className="mr-3 h-5 w-5" />
            Enviar pelo WhatsApp
          </Button>
          <p className="mt-3 flex items-center justify-center gap-2 text-center text-xs font-semibold text-[#60756f]">
            <ShieldCheck className="h-4 w-4" />
            Você confere tudo antes de enviar.
          </p>
        </div>
      </>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4efe5] pb-28 text-[#12332f] lg:pb-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8">
        <header className="rounded-[1.7rem] bg-[#12332f] p-4 text-white shadow-xl shadow-[#12332f]/15 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <img src="/brand/fitgarden-horizontal.png" alt="Fit Garden" className="h-14 w-auto object-contain drop-shadow-lg sm:h-16" />
              <div className="hidden h-12 w-px bg-white/20 sm:block" />
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#ffd7b0]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Cardápio ativo
                </div>
                <h1 className="mt-2 text-2xl font-black uppercase tracking-tight sm:text-3xl">Cardápio da semana</h1>
              </div>
            </div>

            <div className="w-fit rounded-2xl border border-white/15 bg-white/10 px-4 py-2">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ffd7b0]">Semana</p>
              <p className="mt-0.5 text-sm font-black">{weekRange}</p>
            </div>
          </div>
        </header>

        <section className="sticky top-0 z-20 -mx-4 border-y border-[#e1d8ca] bg-[#f4efe5]/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:rounded-[1.3rem] lg:border lg:bg-white lg:p-4 lg:shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#60756f]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar marmita, categoria ou ingrediente..."
                className="h-12 rounded-2xl border-[#d9ded6] bg-white pl-11 pr-11 text-base font-semibold shadow-sm"
              />
              {search && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-[#60756f] transition hover:bg-[#f4efe5]"
                  onClick={() => setSearch("")}
                  aria-label="Limpar busca"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
              <FilterButton value="TODOS" label="Todos" />
              {categories.map((categoria) => (
                <FilterButton key={categoria} value={categoria} label={categoria.replace("FIT - MONTE SUA MARMITA", "Fit")} />
              ))}
              <FilterButton value="SELECIONADAS" label={`Selecionadas (${selectedOptions.length})`} />
            </div>
          </div>
        </section>

        {loading && (
          <Card className="rounded-[1.5rem] border-dashed bg-white p-10 text-center font-semibold text-[#60756f]">
            Carregando cardápio...
          </Card>
        )}

        {error && (
          <Card className="rounded-[1.5rem] border-red-200 bg-red-50 p-6 text-center font-semibold text-red-700">
            {error}
          </Card>
        )}

        {!loading && !error && (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <section className="space-y-2">
              {filteredOptions.length ? (
                filteredOptions.map((opcao, index) => {
                  const qty = Number(quantities[opcao.id] || 0);
                  const selected = qty > 0;
                  const categoria = categoryLabel(opcao.categoria);
                  const Icon = categoryIcon(categoria);

                  return (
                    <div
                      key={opcao.id}
                      className={cn(
                        "grid grid-cols-[36px_minmax(0,1fr)] gap-3 rounded-2xl border border-[#e3e8e1] bg-white p-3 shadow-sm transition sm:grid-cols-[42px_minmax(0,1fr)_144px] sm:items-center",
                        selected && "border-[#e4b38e] bg-[#fff9f4] shadow-md shadow-[#c75c34]/10",
                      )}
                    >
                      <div
                        className={cn(
                          "grid h-9 w-9 place-items-center rounded-xl bg-[#f4efe5] text-sm font-black tabular-nums text-[#a85532]",
                          selected && "bg-[#c24f2f] text-white",
                        )}
                      >
                        {index + 1}
                      </div>

                      <div className="min-w-0">
                        <p className="text-base font-black leading-snug text-[#203c36]">{opcao.nome}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ring-1", categoryTone(categoria))}>
                            <Icon className="h-3.5 w-3.5" />
                            {categoria}
                          </span>
                          {selected && <span className="text-xs font-black uppercase tracking-wide text-[#c24f2f]">No pedido</span>}
                        </div>
                      </div>

                      <div className="col-span-2 grid grid-cols-[48px_48px_48px] justify-end overflow-hidden rounded-2xl border border-[#dfe7df] bg-white shadow-sm sm:col-span-1">
                        <button
                          type="button"
                          className="grid h-12 place-items-center text-[#12332f] transition hover:bg-[#fff0e6] disabled:cursor-not-allowed disabled:text-[#a7b4ae]"
                          onClick={() => changeQuantity(opcao.id, -1)}
                          disabled={!qty}
                          aria-label={`Diminuir ${opcao.nome}`}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <div className="grid place-items-center border-x text-base font-black tabular-nums text-[#12332f]">{qty}</div>
                        <button
                          type="button"
                          className="grid h-12 place-items-center bg-[#12332f] text-white transition hover:bg-[#1f5149]"
                          onClick={() => changeQuantity(opcao.id, 1)}
                          aria-label={`Aumentar ${opcao.nome}`}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <Card className="rounded-[1.5rem] border-dashed bg-white p-8 text-center">
                  <p className="text-lg font-black text-[#12332f]">Nenhuma marmita encontrada</p>
                  <p className="mt-1 text-sm font-semibold text-[#60756f]">Tente limpar a busca ou trocar o filtro.</p>
                </Card>
              )}
            </section>

            <aside className="hidden lg:sticky lg:top-5 lg:block">
              <Card className="overflow-hidden rounded-[1.6rem] border-0 bg-white shadow-xl shadow-[#12332f]/10 ring-1 ring-[#e6ded2]">
                <CheckoutContent />
              </Card>
            </aside>
          </div>
        )}
      </div>

      {!loading && !error && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#d8cdbc] bg-white/95 p-3 shadow-2xl backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl bg-[#f7f1e8] px-3 py-2">
              <ShoppingBasket className="h-5 w-5 shrink-0 text-[#12332f]" />
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-wider text-[#60756f]">Selecionadas</p>
                <p className="text-2xl font-black leading-none text-[#bd5733]">{total}</p>
              </div>
            </div>
            <Button
              type="button"
              className="h-14 rounded-2xl bg-[#c24f2f] px-5 font-black uppercase text-white shadow-lg shadow-[#c24f2f]/25 hover:bg-[#a94329]"
              onClick={() => setCheckoutOpen(true)}
              disabled={!total}
            >
              Ver pedido
            </Button>
          </div>
        </div>
      )}

      {checkoutOpen && (
        <div className="fixed inset-0 z-40 bg-black/45 p-3 backdrop-blur-sm lg:hidden" onClick={() => setCheckoutOpen(false)}>
          <div
            className="absolute inset-x-3 bottom-3 max-h-[92vh] overflow-hidden rounded-[1.7rem] bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <CheckoutContent />
          </div>
        </div>
      )}
    </main>
  );
}
