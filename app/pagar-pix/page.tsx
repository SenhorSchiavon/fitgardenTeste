"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, Copy, LockKeyhole, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Cobranca = { valor: number; status: "PENDENTE" | "CONFIRMADO" | "EXPIRADO" | "INDISPONIVEL"; pixCopiaECola: string | null; expiraEm: string | null };
function endpoint() {
  const base = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api").replace(/\/+$/, "");
  return `${base.endsWith("/api") ? base : `${base}/api`}/public/pix-pagamento`;
}

export default function PagarPixPage() {
  const [token, setToken] = useState("");
  const [cobranca, setCobranca] = useState<Cobranca | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [falhaCopia, setFalhaCopia] = useState("");
  const codigoRef = useRef<HTMLTextAreaElement>(null);
  const requisicao = useRef<AbortController | null>(null);
  useEffect(() => {
    const t = new URLSearchParams(window.location.hash.slice(1)).get("t") || "";
    setToken(t);
    if (!t) { setErro("Este link está incompleto. Peça o link de pagamento à FitGarden."); setCarregando(false); }
  }, []);
  const carregar = useCallback(async () => {
    if (!token) return;
    requisicao.current?.abort();
    const controller = new AbortController(); requisicao.current = controller;
    try {
      const response = await fetch(endpoint(), { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: controller.signal, referrerPolicy: "no-referrer" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Não foi possível carregar o pagamento.");
      if (!controller.signal.aborted) { setCobranca(data); setErro(""); }
    } catch (error) { if (!controller.signal.aborted) setErro(error instanceof Error ? error.message : "Não foi possível carregar o Pix."); }
    finally { if (!controller.signal.aborted) setCarregando(false); }
  }, [token]);
  useEffect(() => { void carregar(); return () => requisicao.current?.abort(); }, [carregar]);
  useEffect(() => {
    if (!token || cobranca?.status !== "PENDENTE") return;
    const timer = setInterval(() => {
      if (cobranca.expiraEm && Date.parse(cobranca.expiraEm) <= Date.now()) {
        setCobranca(prev => prev ? { ...prev, status: "EXPIRADO", pixCopiaECola: null } : prev);
      } else if (!document.hidden) void carregar();
    }, 15000);
    return () => clearInterval(timer);
  }, [token, cobranca?.status, cobranca?.expiraEm, carregar]);

  async function copiar() {
    if (!cobranca?.pixCopiaECola || cobranca.status !== "PENDENTE") return;
    if (cobranca.expiraEm && Date.parse(cobranca.expiraEm) <= Date.now()) {
      setCobranca({ ...cobranca, status: "EXPIRADO", pixCopiaECola: null }); return;
    }
    setFalhaCopia("");
    try { await navigator.clipboard.writeText(cobranca.pixCopiaECola); setCopiado(true); }
    catch {
      codigoRef.current?.closest("details")?.setAttribute("open", "");
      codigoRef.current?.focus(); codigoRef.current?.select();
      try { if (document.execCommand("copy")) setCopiado(true); else setFalhaCopia("Selecione o código abaixo e toque em Copiar no seu celular."); }
      catch { setFalhaCopia("Selecione o código abaixo e toque em Copiar no seu celular."); }
    }
  }
  const pendente = cobranca?.status === "PENDENTE" && Boolean(cobranca.pixCopiaECola);
  return <main className="min-h-dvh bg-[#f3f7f4] px-4 py-8 sm:py-12">
    <div className="mx-auto max-w-md">
      <div className="mb-6 rounded-2xl bg-[#0d352c] px-5 py-4 text-center"><img src="/brand/fitgarden-horizontal.png" alt="FitGarden" className="mx-auto h-16 max-w-[220px] object-contain" /></div>
      <section className="space-y-5 rounded-3xl border border-emerald-900/10 bg-white p-5 shadow-sm sm:p-7">
        <div className="text-center"><p className="text-sm text-muted-foreground">Pagamento do seu pedido</p><h1 className="mt-1 text-2xl font-bold text-primary">Pagar com Pix</h1></div>
        {carregando ? <p className="py-8 text-center text-muted-foreground" role="status">Carregando seu Pix…</p> : erro ? <div className="space-y-4"><p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{erro}</p>{token && <Button variant="outline" className="w-full" onClick={() => { setCarregando(true); void carregar(); }}><RefreshCw className="mr-2 h-4 w-4" />Tentar novamente</Button>}</div> : cobranca && <>
          <p className="text-center text-4xl font-bold tracking-tight text-primary">{cobranca.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
          {cobranca.status === "CONFIRMADO" ? <div className="rounded-2xl bg-emerald-50 p-6 text-center text-emerald-800"><CheckCircle2 className="mx-auto mb-3 h-10 w-10" /><h2 className="font-semibold">Pagamento confirmado</h2><p className="mt-1 text-sm">O pagamento já foi registrado no pedido. Obrigado!</p></div>
            : cobranca.status === "EXPIRADO" ? <p className="rounded-xl bg-amber-50 p-4 text-center text-amber-900">Este Pix expirou. Peça uma nova cobrança à FitGarden.</p>
            : !pendente ? <p className="rounded-xl bg-amber-50 p-4 text-center text-amber-900">Esta cobrança não está disponível para pagamento. Fale com a FitGarden.</p>
            : <>
              <Button className="h-14 w-full rounded-xl text-base" onClick={() => void copiar()}><Copy className="mr-2 h-5 w-5" />{copiado ? "Pix copiado! Copiar novamente" : "Copiar Pix"}</Button>
              {falhaCopia && <p role="alert" className="text-sm text-amber-800">{falhaCopia}</p>}
              <p aria-live="polite" className="text-center text-sm text-muted-foreground">{copiado ? "Agora abra o aplicativo do seu banco, escolha Pix Copia e Cola e cole o código." : "Toque em Copiar Pix e cole no aplicativo do seu banco."}</p>
              <div className="flex justify-center rounded-2xl border border-dashed bg-white p-3"><QRCodeSVG value={cobranca.pixCopiaECola!} size={232} marginSize={4} /></div>
              <p className="text-center text-xs text-muted-foreground">Você também pode escanear o QR Code usando outro aparelho.</p>
              <details className="text-sm"><summary className="cursor-pointer text-muted-foreground">Ver código completo</summary><textarea ref={codigoRef} aria-label="Código Pix completo" readOnly value={cobranca.pixCopiaECola!} onFocus={event => event.target.select()} className="mt-2 h-24 w-full rounded-lg border p-3 font-mono text-xs" /></details>
              {cobranca.expiraEm && <p className="text-center text-xs text-muted-foreground">Válido até {new Date(cobranca.expiraEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} (horário de Brasília).</p>}
            </>}
        </>}
        <p className="flex items-start gap-2 border-t pt-4 text-xs text-muted-foreground"><LockKeyhole className="h-4 w-4 shrink-0" />Confira o recebedor e o valor no aplicativo do seu banco antes de confirmar.</p>
      </section>
      <p className="mt-5 text-center text-xs text-muted-foreground">FitGarden · Refeições saudáveis</p>
    </div>
  </main>;
}
