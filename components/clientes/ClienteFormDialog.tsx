"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Tag, Trash, X } from "lucide-react";
import { DialogClose } from "@radix-ui/react-dialog";
import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import("react-leaflet").then((m) => m.CircleMarker), { ssr: false });

type ClientePayload = {
  nome: string;
  telefone: string;
  tags: string[];
  enderecos: Array<{
    principal: boolean;
    cep?: string | null;
    uf?: string | null;
    cidade?: string | null;
    bairro?: string | null;
    logradouro?: string | null;
    numero?: string | null;
    complemento?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    endereco?: string | null; // alternativo
  }>;
};

type ClienteFormValue = {
  nome: string;
  telefone: string;

  cep?: string;
  uf?: string;
  cidade?: string;
  bairro?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;

  latitude?: number | null;
  longitude?: number | null;

  enderecoAlternativo?: string;
  tags: string[];
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  saving?: boolean;

  initialValue?: Partial<ClienteFormValue> | null;

  onSubmit: (payload: ClientePayload) => Promise<any> | any;

  // opcional: útil no Agendamentos pra já selecionar o cliente criado
  onCreated?: (created: any) => void;
};

function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

async function buscarCepViaCep(cep: string) {
  const clean = onlyDigits(cep);
  if (clean.length !== 8) throw new Error("CEP inválido. Use 8 dígitos.");

  const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`, { cache: "no-store" });
  if (!res.ok) throw new Error("Erro ao consultar ViaCEP.");
  const data = await res.json();
  if (data?.erro) throw new Error("CEP não encontrado.");

  return {
    cep: clean,
    uf: data.uf as string,
    cidade: data.localidade as string,
    bairro: data.bairro as string,
    logradouro: data.logradouro as string,
  };
}

async function geocodeNominatim(address: string) {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(address)}`;
  const res = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Não foi possível localizar no mapa.");
  const data = await res.json();

  if (Array.isArray(data) && data[0]) return { lat: Number(data[0].lat), lon: Number(data[0].lon) };
  throw new Error("Endereço não localizado.");
}

async function geocodeNominatimComFallback(fullAddress: string) {
  try {
    return await geocodeNominatim(fullAddress);
  } catch {}

  const semCep = fullAddress.replace(/\b\d{5}-?\d{3}\b/g, "").replace(/\s+,/g, ",").trim();
  try {
    return await geocodeNominatim(semCep);
  } catch {}

  const parts = fullAddress.split(",").map((x) => x.trim()).filter(Boolean);
  const fallback = parts.slice(0, 2).concat(parts.slice(-3)).join(", ");
  return await geocodeNominatim(fallback);
}

export function ClienteFormDialog({
  open,
  onOpenChange,
  title = "Novo Cliente",
  saving = false,
  initialValue,
  onSubmit,
  onCreated,
}: Props) {
  const [localizando, setLocalizando] = useState(false);
  const [erroLocalizacao, setErroLocalizacao] = useState<string | null>(null);
  const [novaTag, setNovaTag] = useState("");

  const [form, setForm] = useState<ClienteFormValue>({
    nome: "",
    telefone: "",
    cep: "",
    uf: "",
    cidade: "",
    bairro: "",
    logradouro: "",
    numero: "",
    complemento: "",
    latitude: null,
    longitude: null,
    enderecoAlternativo: "",
    tags: [],
  });

  // sempre que abrir com initialValue, preenche
  useEffect(() => {
    if (!open) return;

    setErroLocalizacao(null);
    setNovaTag("");

    setForm((prev) => ({
      ...prev,
      nome: initialValue?.nome ?? "",
      telefone: initialValue?.telefone ?? "",
      cep: initialValue?.cep ?? "",
      uf: initialValue?.uf ?? "",
      cidade: initialValue?.cidade ?? "",
      bairro: initialValue?.bairro ?? "",
      logradouro: initialValue?.logradouro ?? "",
      numero: initialValue?.numero ?? "",
      complemento: initialValue?.complemento ?? "",
      latitude: initialValue?.latitude ?? null,
      longitude: initialValue?.longitude ?? null,
      enderecoAlternativo: initialValue?.enderecoAlternativo ?? "",
      tags: initialValue?.tags ?? [],
    }));
  }, [open, initialValue]);

  const coordsOk = useMemo(() => {
    return (
      typeof form.latitude === "number" &&
      !Number.isNaN(form.latitude) &&
      typeof form.longitude === "number" &&
      !Number.isNaN(form.longitude)
    );
  }, [form.latitude, form.longitude]);

  const montarEnderecoCompletoParaGeocode = () => {
    const ruaNum = [form.logradouro, form.numero].filter(Boolean).join(", ");
    const cidadeUf = [form.cidade, form.uf].filter(Boolean).join(" - ");
    return [ruaNum, form.bairro, cidadeUf, form.cep, "Brasil"].filter(Boolean).join(", ");
  };

  const handleBuscarCep = async () => {
    const data = await buscarCepViaCep(form.cep || "");
    setForm((p) => ({
      ...p,
      cep: data.cep,
      uf: data.uf || p.uf,
      cidade: data.cidade || p.cidade,
      bairro: data.bairro || p.bairro,
      logradouro: data.logradouro || p.logradouro,
      latitude: null,
      longitude: null,
    }));
  };

  const handleLocalizarNoMapa = async () => {
    setErroLocalizacao(null);
    setLocalizando(true);
    try {
      const geo = await geocodeNominatimComFallback(montarEnderecoCompletoParaGeocode());
      setForm((p) => ({ ...p, latitude: geo.lat, longitude: geo.lon }));
    } catch (e: any) {
      setErroLocalizacao(e?.message || "Não foi possível localizar no mapa.");
    } finally {
      setLocalizando(false);
    }
  };

  const handleAddTag = () => {
    const tag = (novaTag || "").trim();
    if (!tag) return;
    if (!form.tags.includes(tag)) setForm((p) => ({ ...p, tags: [...p.tags, tag] }));
    setNovaTag("");
  };

  const handleRemoveTag = (tag: string) => {
    setForm((p) => ({ ...p, tags: p.tags.filter((t) => t !== tag) }));
  };

  const handleSave = async () => {
    const nome = String(form.nome || "").trim();
    const telefone = String(form.telefone || "").trim();
    if (!nome) return;
    if (!telefone) return;

    const payload: ClientePayload = {
      nome,
      telefone,
      tags: form.tags || [],
      enderecos: [
        {
          principal: true,
          cep: form.cep?.trim() ? onlyDigits(form.cep) : null,
          uf: form.uf?.trim() || null,
          cidade: form.cidade?.trim() || null,
          bairro: form.bairro?.trim() || null,
          logradouro: form.logradouro?.trim() || null,
          numero: form.numero?.trim() || null,
          complemento: form.complemento?.trim() || null,
          latitude: typeof form.latitude === "number" ? form.latitude : null,
          longitude: typeof form.longitude === "number" ? form.longitude : null,
        },
        ...(form.enderecoAlternativo?.trim()
          ? [{ principal: false, endereco: form.enderecoAlternativo.trim() }]
          : []),
      ],
    };

    const createdOrUpdated = await onSubmit(payload);
    if (createdOrUpdated && onCreated) onCreated(createdOrUpdated);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-hidden p-0 flex flex-col">
        <div className="sticky top-0 z-20 bg-background border-b px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <DialogHeader className="p-0">
              <DialogTitle>{title}</DialogTitle>
            </DialogHeader>

            <DialogClose asChild>
              <Button variant="ghost" size="icon" disabled={saving}>
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-8">
          {/* DADOS */}
          <div className="space-y-4">
            <div className="text-sm font-medium">Dados</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={form.nome}
                  onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={form.telefone}
                  onChange={(e) => setForm((p) => ({ ...p, telefone: e.target.value }))}
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* ENDEREÇO + MAPA */}
          <div className="space-y-4">
            <div className="text-sm font-medium">Endereço + Mapa</div>

            <div className="grid grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  value={form.cep || ""}
                  onChange={(e) => setForm((p) => ({ ...p, cep: e.target.value }))}
                  disabled={saving}
                  placeholder="00000-000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="uf">UF</Label>
                <Input
                  id="uf"
                  value={form.uf || ""}
                  onChange={(e) => setForm((p) => ({ ...p, uf: e.target.value.toUpperCase() }))}
                  disabled={saving}
                  placeholder="PR"
                />
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={handleBuscarCep} disabled={saving}>
                  Buscar CEP
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleLocalizarNoMapa}
                  disabled={saving || localizando}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  {localizando ? "Localizando..." : "Localizar"}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={form.cidade || ""}
                  onChange={(e) => setForm((p) => ({ ...p, cidade: e.target.value }))}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  value={form.bairro || ""}
                  onChange={(e) => setForm((p) => ({ ...p, bairro: e.target.value }))}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="logradouro">Rua</Label>
                <Input
                  id="logradouro"
                  value={form.logradouro || ""}
                  onChange={(e) => setForm((p) => ({ ...p, logradouro: e.target.value }))}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  value={form.numero || ""}
                  onChange={(e) => setForm((p) => ({ ...p, numero: e.target.value }))}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="complemento">Complemento</Label>
              <Input
                id="complemento"
                value={form.complemento || ""}
                onChange={(e) => setForm((p) => ({ ...p, complemento: e.target.value }))}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="enderecoAlternativo">Endereço Alternativo</Label>
              <Input
                id="enderecoAlternativo"
                value={form.enderecoAlternativo || ""}
                onChange={(e) => setForm((p) => ({ ...p, enderecoAlternativo: e.target.value }))}
                disabled={saving}
              />
            </div>

            {erroLocalizacao && <div className="text-sm text-red-600">{erroLocalizacao}</div>}

            <div className="rounded-md border overflow-hidden">
              <div className="p-3 border-b text-sm text-muted-foreground">
                {coordsOk
                  ? `Localização aproximada: ${form.latitude?.toFixed(5)}, ${form.longitude?.toFixed(5)}`
                  : "Sem localização ainda. Use “Localizar” para gerar uma posição aproximada."}
              </div>

              <div className="h-[280px]">
                {coordsOk ? (
                  <MapContainer
                    center={[form.latitude as number, form.longitude as number]}
                    zoom={15}
                    style={{ height: "100%", width: "100%" }}
                    scrollWheelZoom={false}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <CircleMarker
                      center={[form.latitude as number, form.longitude as number] as [number, number]}
                      radius={6}
                      pathOptions={{}}
                    />
                  </MapContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                    Mapa aparecerá aqui após localizar.
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* TAGS */}
          <div className="space-y-4">
            <div className="text-sm font-medium">Tags</div>

            <div className="space-y-2">
              <Label>Tags</Label>

              <div className="flex flex-wrap gap-2 mb-4">
                {(form.tags || []).map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 rounded-full"
                      onClick={() => handleRemoveTag(tag)}
                      disabled={saving}
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Nova tag..."
                  value={novaTag}
                  onChange={(e) => setNovaTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  disabled={saving}
                />
                <Button type="button" onClick={handleAddTag} disabled={saving}>
                  <Tag className="mr-2 h-4 w-4" /> Adicionar
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 px-6 pb-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}