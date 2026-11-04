"use client";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { Marker, MapContainer, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { agendaRequest } from "./retirada-agendamento";
type Ponto = [number, number];
type Entrega = { id: string; agendamentoId: number; pedidoId: number; clienteNome: string; clienteEndereco: string; clienteCidade: string; status: string; entregadorId: string; faixaHorario: string;
  cliente: { latitude: number | null; longitude: number | null } | null;
  rotasVinculadas: { ordem: number; rota: { id: string; nome: string } }[];
  pagamentos: { forma: string; status: string; valor: string }[] };
type Entregador = { id: string; nome: string; lastLat?: number | null; lastLng?: number | null };
type Dados = { entregas: Entrega[]; entregadores: Entregador[]; origem?: { latitude: number | null; longitude: number | null } };
const cores = ["#059669", "#2563eb", "#ea580c", "#9333ea", "#db2777"];
const icones = cores.map(cor => divIcon({ className: "", iconSize: [24, 24], iconAnchor: [12, 12], html: `<span style="display:block;width:24px;height:24px;border:3px solid white;border-radius:50%;background:${cor};box-shadow:0 1px 5px #0005"></span>` }));
const coord = (e: Entrega): Ponto | null => e.cliente?.latitude != null && e.cliente.longitude != null ? [e.cliente.latitude, e.cliente.longitude] : null;
const iconeEntregador = divIcon({
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  html: '<span class="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-white bg-slate-900 text-base shadow-md" aria-hidden="true">🛵</span>',
});
function Enquadrar({ pontos }: { pontos: Ponto[] }) {
  const map = useMap();
  useEffect(() => {
    const ajustar = () => { map.invalidateSize({ animate: false }); if (pontos.length) map.fitBounds(pontos, { padding: [35, 35], maxZoom: 14, animate: false }); };
    ajustar();
    const observer = new ResizeObserver(ajustar); observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map, pontos]);
  return null;
}
function PopupResponsivo({ ponto, children }: { ponto: Ponto; children: ReactNode }) {
  const map = useMap();
  const [largura, setLargura] = useState(() => map.getContainer().clientWidth);
  useEffect(() => { const observer = new ResizeObserver(() => setLargura(map.getContainer().clientWidth)); observer.observe(map.getContainer()); return () => observer.disconnect(); }, [map]);
  const maxWidth = Math.max(120, Math.min(280, largura - 100));
  return <Popup key={largura} position={ponto} maxWidth={maxWidth} minWidth={Math.min(180, maxWidth)} maxHeight={240} keepInView autoPanPadding={[16, 16]}>{children}</Popup>;
}
function Trocar({ entrega, entregadores, onSuccess }: { entrega: Entrega; entregadores: Dados["entregadores"]; onSuccess: () => void }) {
  const [id, setId] = useState(entrega.entregadorId), [saving, setSaving] = useState(false), [erro, setErro] = useState("");
  return <div className="mt-3 space-y-2 border-t pt-2"><label className="block text-xs font-semibold">Reatribuir no LevaCerto<select aria-label="Novo entregador" className="mt-1 w-full rounded border p-2" value={id} disabled={saving || entrega.status === "ENTREGUE"} onChange={e => setId(e.target.value)}><option value={entrega.entregadorId}>{entregadores.find(e => e.id === entrega.entregadorId)?.nome || "Entregador atual"}</option>{entregadores.filter(e => e.id !== entrega.entregadorId).map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}</select></label>
    {entrega.status === "ENTREGUE" ? <p className="text-xs">Entrega concluída.</p> : <><p className="text-xs text-muted-foreground">A rota será mantida. O novo entregador precisará conferir a carga.</p><Button size="sm" className="w-full" disabled={saving || id === entrega.entregadorId} onClick={async () => { setSaving(true); setErro(""); try { await agendaRequest(`/${entrega.agendamentoId}/entregador`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entregadorId: id }) }); onSuccess(); } catch (e) { setErro(e instanceof Error ? e.message : "Falha na alteração"); } finally { setSaving(false); } }}>{saving ? "Salvando no LevaCerto…" : "Salvar novo entregador"}</Button></>}
    {erro && <p role="alert" className="text-xs text-red-700">{erro}</p>}
  </div>;
}
export default function MapaAgendamentos({ date }: { date: string }) {
  const [dados, setDados] = useState<Dados | null>(null), [rota, setRota] = useState(""), [entregador, setEntregador] = useState(""), [erro, setErro] = useState(""), [loading, setLoading] = useState(true), [versao, setVersao] = useState(0);
  const [selecionada, setSelecionada] = useState<{ id: string; versao: number } | null>(null);
  const [linhas, setLinhas] = useState<{ id: string; pontos: Ponto[]; real: boolean; cor: string }[]>([]);
  useEffect(() => { const controller = new AbortController(); setLoading(true); setDados(null); setErro("");
    agendaRequest(`/mapa?date=${date}`, { signal: controller.signal }).then(setDados).catch(e => { if (!controller.signal.aborted) setErro(e.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); }); return () => controller.abort();
  }, [date, versao]);
  const rotas = useMemo(() => Array.from(new Map((dados?.entregas || []).flatMap(e => e.rotasVinculadas.map(v => [v.rota.id, v.rota] as const))).values()), [dados]);
  const visiveis = useMemo(() => (dados?.entregas || []).filter(e => (!rota || e.rotasVinculadas.some(v => v.rota.id === rota)) && (!entregador || e.entregadorId === entregador)), [dados, rota, entregador]);
  const entregaSelecionada = visiveis.find(e => e.id === selecionada?.id);
  const pontos = useMemo(() => visiveis.flatMap(e => { const p = coord(e); return p ? [p] : []; }), [visiveis]);
  const posicoes = useMemo(() => {
    const idsDaRota = new Set(visiveis.map(e => e.entregadorId));
    return (dados?.entregadores ?? []).flatMap(e => {
      if ((entregador && e.id !== entregador) || (rota && !idsDaRota.has(e.id))) return [];
      const { lastLat: lat, lastLng: lng } = e;
      if (typeof lat !== "number" || typeof lng !== "number" || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return [];
      return [{ id: e.id, nome: e.nome, ponto: [lat, lng] as Ponto }];
    });
  }, [dados, entregador, rota, visiveis]);
  const pontosMapa = useMemo(() => [...pontos, ...posicoes.map(e => e.ponto)], [pontos, posicoes]);
  useEffect(() => {
    const controller = new AbortController(); setLinhas([]);
    const grupos = new Map<string, Entrega[]>();
    for (const e of visiveis) { const r = e.rotasVinculadas[0]?.rota.id || "sem-rota"; const chave = `${r}:${e.entregadorId}`; grupos.set(chave, [...(grupos.get(chave) || []), e]); }
    void Promise.all(Array.from(grupos.entries()).map(async ([id, entregas], i) => {
      entregas.sort((a, b) => (a.rotasVinculadas[0]?.ordem || 0) - (b.rotasVinculadas[0]?.ordem || 0));
      const pts = entregas.flatMap(e => { const p = coord(e); return p ? [p] : []; });
      if (dados?.origem?.latitude != null && dados.origem.longitude != null) pts.unshift([dados.origem.latitude, dados.origem.longitude]);
      const indiceRota = rotas.findIndex(r => r.id === entregas[0]?.rotasVinculadas[0]?.rota.id);
      const cor = cores[Math.max(0, indiceRota) % cores.length];
      if (pts.length < 2) return { id, pontos: pts, real: false, cor };
      try { const geometry = await agendaRequest("/mapa/trajeto", { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pontos: pts }) }); return { id, pontos: geometry.coordinates.map(([lon, lat]: number[]) => [lat, lon] as Ponto), real: true, cor }; }
      catch { return { id, pontos: pts, real: false, cor }; }
    })).then(result => { if (!controller.signal.aborted) setLinhas(result); });
    return () => controller.abort();
  }, [visiveis, dados, rotas]);
  return <div className="space-y-3 rounded-xl border bg-white p-4"><div className="flex flex-wrap items-end gap-3"><label className="text-sm">Rota<select className="mt-1 block rounded border p-2" value={rota} onChange={e => setRota(e.target.value)}><option value="">Todas as rotas</option>{rotas.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}</select></label><label className="text-sm">Entregador<select className="mt-1 block rounded border p-2" value={entregador} onChange={e => setEntregador(e.target.value)}><option value="">Todos os entregadores</option>{dados?.entregadores.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}</select></label><Button variant="outline" disabled={loading} onClick={() => setVersao(v => v + 1)}>Atualizar mapa</Button></div>
    <p className="text-xs text-muted-foreground">{visiveis.length} entregas · {visiveis.length - pontos.length} sem coordenadas. Toque em um ponto para consultar ou trocar o entregador. O mapa mostra entregas sincronizadas com o LevaCerto.</p>
    {erro ? <p role="alert" className="rounded bg-red-50 p-4 text-red-800">{erro}</p> : loading ? <p role="status" className="py-20 text-center">Carregando mapa…</p> : <>
      {!visiveis.length && <p className="rounded bg-slate-50 p-3 text-sm">Nenhuma entrega neste filtro. Confira a data e a sincronização com o LevaCerto.</p>}
      <p className="text-xs text-muted-foreground">🛵 Entregadores no mapa: {posicoes.length}. A posição é a última enviada ao LevaCerto. Use Atualizar mapa para consultar novamente.</p>
      <MapContainer center={[-23.31, -51.16]} zoom={12} className="z-0 h-[580px] w-full rounded-lg"><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' /><Enquadrar pontos={pontosMapa} />
        {linhas.map(l => <Polyline key={l.id} interactive={false} positions={l.pontos} pathOptions={{ color: l.cor, weight: 4, ...(l.real ? {} : { dashArray: "7 8" }) }} />)}
        {visiveis.map(e => {
          const p = coord(e);
          if (!p) return null;
          const i = rotas.findIndex(r => r.id === e.rotasVinculadas[0]?.rota.id);
          return <Marker key={e.id} position={p} autoPanOnFocus={false} title={`${e.clienteNome} · ${e.faixaHorario}`} alt={`Entrega de ${e.clienteNome}`} icon={icones[Math.max(0, i) % cores.length]}
            eventHandlers={{ click: () => setSelecionada(atual => ({ id: e.id, versao: (atual?.versao || 0) + 1 })), keypress: event => { if (event.originalEvent.key === "Enter") setSelecionada(atual => ({ id: e.id, versao: (atual?.versao || 0) + 1 })); } }} />;
        })}
        {posicoes.map(e => (
          <Marker key={`entregador:${e.id}`} position={e.ponto} icon={iconeEntregador}
            title={`Entregador: ${e.nome}`} alt={`Entregador: ${e.nome}`} zIndexOffset={500}>
            <Popup><strong>{e.nome}</strong><div>Última posição enviada pelo app</div></Popup>
          </Marker>
        ))}
        {entregaSelecionada && coord(entregaSelecionada) && <PopupResponsivo key={selecionada?.versao} ponto={coord(entregaSelecionada)!}>
<div className="min-w-0 break-words"><strong>{entregaSelecionada.clienteNome} · #{entregaSelecionada.pedidoId}</strong><p>{entregaSelecionada.clienteEndereco} · {entregaSelecionada.clienteCidade}</p><div>{entregaSelecionada.rotasVinculadas.map(v => v.rota.nome).join(", ")} · {entregaSelecionada.faixaHorario}</div><div>Entregador: {dados?.entregadores.find(d => d.id === entregaSelecionada.entregadorId)?.nome || "Indisponível"}</div><div className="mt-2 text-xs">{entregaSelecionada.pagamentos.map((pg, j) => <div key={j}>{pg.forma} · {Number(pg.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} · {pg.status}</div>)}</div><Trocar key={entregaSelecionada.entregadorId} entrega={entregaSelecionada} entregadores={dados?.entregadores || []} onSuccess={() => setVersao(v => v + 1)} /></div>
        </PopupResponsivo>}
      </MapContainer>
      {linhas.some(l => !l.real && l.pontos.length > 1) && <p role="status" className="rounded bg-amber-50 p-3 text-xs text-amber-900">Trajeto por ruas indisponível para parte das entregas. Linhas tracejadas indicam apenas a sequência dos pontos.</p>}
      {visiveis.some(e => !coord(e)) && <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm"><strong>Corrigir localização:</strong> {visiveis.filter(e => !coord(e)).map(e => e.clienteNome).join(", ")}. Atualize o endereço do cliente e sincronize a entrega.</div>}
    </>}
  </div>;
}
