"use client";

import { Minus, Plus, Send, ShoppingBasket, Snowflake } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isMobileWhatsAppDevice, openWhatsApp } from "@/lib/open-whatsapp";

type CongeladaPublica = { id: string; nome: string; descricao?: string | null; tamanhoGramas: number; quantidade: number };
type DadosPublicos = { id: number; whatsappNumber?: string | null; destinoWhatsApp?: string; congeladas: CongeladaPublica[] };

function apiUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api";
  return `${base.replace(/\/+$/, "")}${path}`;
}

function telefoneFormatado(valor: string) {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export default function CardapioCongeladasPage() {
  const [dados, setDados] = useState<DadosPublicos | null>(null);
  const [quantidades, setQuantidades] = useState<Record<string, number>>({});
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState("");

  useEffect(() => {
    const destino = new URLSearchParams(window.location.search).get("destino");
    const path = destino === "alternativo" ? "/public/cardapio-semana?destino=alternativo" : "/public/cardapio-semana";

    fetch(apiUrl(path), { cache: "no-store" })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || "Erro ao carregar congeladas.");
        setDados(json);
      })
      .catch((e) => setErro(e?.message || "Erro ao carregar congeladas."));
  }, []);

  const total = useMemo(() => Object.values(quantidades).reduce((soma, quantidade) => soma + Number(quantidade || 0), 0), [quantidades]);
  const tamanhos = useMemo(
    () => Array.from(new Set((dados?.congeladas || []).filter((item) => item.quantidade > 0).map((item) => item.tamanhoGramas))).sort((a, b) => a - b),
    [dados],
  );
  const congeladasVisiveis = useMemo(
    () => tamanhoSelecionado
      ? (dados?.congeladas || []).filter((item) => item.quantidade > 0 && String(item.tamanhoGramas) === tamanhoSelecionado)
      : [],
    [dados, tamanhoSelecionado],
  );

  function alterar(item: CongeladaPublica, delta: number) {
    setQuantidades((atual) => ({
      ...atual,
      [item.id]: Math.max(0, Math.min(item.quantidade, Number(atual[item.id] || 0) + delta)),
    }));
  }

  async function enviar() {
    if (!dados || !total || !nome.trim() || !telefone.trim()) return;
    const itens = dados.congeladas
      .filter((item) => Number(quantidades[item.id] || 0) > 0)
      .map((item) => ({ congeladaId: Number(item.id), quantidade: Number(quantidades[item.id]), nome: item.nome, tamanhoGramas: item.tamanhoGramas }));
    const whatsappWindow = isMobileWhatsAppDevice() ? null : window.open("about:blank", "_blank");
    setEnviando(true);
    setErro("");
    try {
      const res = await fetch(apiUrl("/public/pedidos"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardapioId: dados.id, tipoPedido: "CONGELADAS", origem: dados.destinoWhatsApp || "principal", nome, telefone, tamanhoLabel: "CONGELADAS", itens }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || "Não foi possível registrar o pedido.");
      const numero = String(dados.whatsappNumber || "").replace(/\D/g, "");
      const mensagem = `Olá, fiz um novo pedido pelo site! 😎\nPedido #${json.id}`;
      if (numero) openWhatsApp({ phone: numero, message: mensagem, desktopWindow: whatsappWindow });
      else whatsappWindow?.close();
      setQuantidades({});
    } catch (e: any) {
      whatsappWindow?.close();
      setErro(e?.message || "Erro ao enviar pedido.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#eef7f8] px-3 py-5 text-[#15332f] sm:px-6">
      <div className="mx-auto max-w-4xl rounded-[28px] border border-sky-100 bg-white p-4 shadow-xl sm:p-8">
        <header className="flex items-center gap-4 border-b pb-5">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-sky-100 text-sky-700"><Snowflake className="h-8 w-8" /></div>
          <div><p className="text-xs font-black uppercase tracking-widest text-sky-700">Estoque disponível</p><h1 className="text-3xl font-black">Marmitas congeladas</h1></div>
        </header>
        {erro ? <p className="mt-5 rounded-xl bg-red-50 p-3 font-semibold text-red-700">{erro}</p> : null}
        <section className="mt-6 space-y-3">
          <div>
            <Label htmlFor="tamanho-congelada" className="font-black">Selecione um tamanho</Label>
            <select id="tamanho-congelada" className="mt-2 h-12 w-full rounded-xl border bg-white px-3 font-bold" value={tamanhoSelecionado} onChange={(event) => { setTamanhoSelecionado(event.target.value); setQuantidades({}); }}>
              <option value="">Selecione um tamanho</option>
              {tamanhos.map((tamanho) => <option key={tamanho} value={String(tamanho)}>{tamanho}g</option>)}
            </select>
          </div>
          <div className="divide-y overflow-hidden rounded-2xl border">
          {congeladasVisiveis.map((item) => (
            <div key={item.id} className="grid grid-cols-[1fr_auto] items-center gap-4 p-4">
              <div>
                <p className="font-bold text-slate-900">{item.nome}</p>
                {item.descricao?.trim() ? (
                  <p className="mt-1 text-xs font-medium text-[#60746f] leading-snug">{item.descricao}</p>
                ) : null}
                <p className="mt-1 text-xs font-semibold text-[#60746f]">{item.tamanhoGramas}g · estoque {item.quantidade}</p>
              </div>
              <div className="grid grid-cols-3 overflow-hidden rounded-xl border">
                <button className="h-10 w-10" onClick={() => alterar(item, -1)}><Minus className="mx-auto h-4 w-4" /></button>
                <span className="grid h-10 w-10 place-items-center border-x font-black">{quantidades[item.id] || 0}</span>
                <button className="h-10 w-10" onClick={() => alterar(item, 1)} disabled={Number(quantidades[item.id] || 0) >= item.quantidade}><Plus className="mx-auto h-4 w-4" /></button>
              </div>
            </div>
          ))}
          {dados && dados.congeladas.length === 0 ? <p className="p-8 text-center text-[#60746f]">Nenhuma congelada disponível no momento.</p> : null}
          {dados && dados.congeladas.length > 0 && !tamanhoSelecionado ? <p className="p-8 text-center text-[#60746f]">Selecione um tamanho para ver as opções com estoque.</p> : null}
          {tamanhoSelecionado && congeladasVisiveis.length === 0 ? <p className="p-8 text-center text-[#60746f]">Nenhuma congelada deste tamanho está disponível.</p> : null}
          </div>
        </section>
        <section className="mt-6 space-y-4 rounded-2xl border p-4">
          <div className="flex items-center gap-2 font-black"><ShoppingBasket className="h-5 w-5" /> Seu pedido: {total} marmita(s)</div>
          <div className="grid gap-4 sm:grid-cols-2"><div><Label>Nome completo</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} /></div><div><Label>Telefone</Label><Input value={telefone} onChange={(e) => setTelefone(telefoneFormatado(e.target.value))} /></div></div>
          <Button className="h-12 w-full bg-[#c24f2f] font-black text-white hover:bg-[#a94329]" onClick={enviar} disabled={enviando || !total || !nome.trim() || !telefone.trim()}><Send className="mr-2 h-5 w-5" />{enviando ? "Enviando..." : "Enviar pedido de congeladas"}</Button>
        </section>
      </div>
    </main>
  );
}
