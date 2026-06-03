"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Tag, Trash, X } from "lucide-react";
import { DialogClose } from "@radix-ui/react-dialog";
import { apiFetch } from "@/hooks/api";
import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import("react-leaflet").then((m) => m.CircleMarker), { ssr: false });

const CIDADES_PR = ["LONDRINA", "CAMBÉ", "ROLÂNDIA", "ARAPONGAS", "IBIPORA", "MARINGÁ"];

function normalizarCidadePermitida(cidade?: string | null) {
  const busca = String(cidade || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
  return CIDADES_PR.find(
    (item) => item.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase() === busca,
  ) || "";
}

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
    apelido?: string | null;
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

  apelidoPrincipal?: string;
  secundarioCep?: string;
  secundarioUf?: string;
  secundarioCidade?: string;
  secundarioBairro?: string;
  secundarioLogradouro?: string;
  secundarioNumero?: string;
  secundarioComplemento?: string;
  secundarioLatitude?: number | null;
  secundarioLongitude?: number | null;
  apelidoSecundario?: string;
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

function currency(value: number) {
  return Number(value || 0).toFixed(2).replace(".", ",");
}

function upper(value?: string | null) {
  return String(value || "").toUpperCase();
}

function getApiUrl() {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";
  return base.replace(/\/+$/, "");
}

async function estimarTaxaPorCoordenadas(latitude: number, longitude: number) {
  const qs = new URLSearchParams({
    clienteId: "0",
    latitude: String(latitude),
    longitude: String(longitude),
  });

  const res = await apiFetch(`${getApiUrl()}/agendamentos/estimar-taxa?${qs.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || "Não foi possível calcular a taxa de entrega.");
  }

  return {
    distanciaKm: Number(data?.distanciaKm || 0),
    valorTaxa: Number(data?.valorTaxa || 0),
  };
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

async function buscarCepPorEnderecoViaCep(input: {
  uf?: string;
  cidade?: string;
  logradouro?: string;
  bairro?: string;
}) {
  const uf = String(input.uf || "").trim().toUpperCase();
  const cidade = String(input.cidade || "").trim();
  const logradouro = String(input.logradouro || "").trim();
  const bairro = String(input.bairro || "").trim().toLowerCase();

  if (uf.length !== 2) throw new Error("Informe a UF com 2 letras.");
  if (cidade.length < 3) throw new Error("Informe a cidade.");
  if (logradouro.length < 3) throw new Error("Informe a rua com pelo menos 3 letras.");

  const url = `https://viacep.com.br/ws/${encodeURIComponent(uf)}/${encodeURIComponent(cidade)}/${encodeURIComponent(logradouro)}/json/`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Erro ao consultar ViaCEP.");

  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Nenhum CEP encontrado para esse endereço.");
  }

  const matchBairro =
    bairro
      ? data.find((item: any) => String(item.bairro || "").trim().toLowerCase() === bairro) ||
        data.find((item: any) => String(item.bairro || "").trim().toLowerCase().includes(bairro))
      : null;
  const item = matchBairro || data[0];

  return {
    cep: onlyDigits(item.cep || ""),
    uf: item.uf as string,
    cidade: item.localidade as string,
    bairro: item.bairro as string,
    logradouro: item.logradouro as string,
    total: data.length,
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
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [localizandoSecundario, setLocalizandoSecundario] = useState(false);
  const [buscandoCepSecundario, setBuscandoCepSecundario] = useState(false);
  const [calculandoTaxa, setCalculandoTaxa] = useState(false);
  const [calculandoTaxaSecundario, setCalculandoTaxaSecundario] = useState(false);
  const [taxaEntrega, setTaxaEntrega] = useState<{ distanciaKm: number; valorTaxa: number } | null>(null);
  const [taxaEntregaSecundario, setTaxaEntregaSecundario] = useState<{ distanciaKm: number; valorTaxa: number } | null>(null);
  const [erroTaxaEntrega, setErroTaxaEntrega] = useState<string | null>(null);
  const [erroTaxaEntregaSecundario, setErroTaxaEntregaSecundario] = useState<string | null>(null);
  const [erroLocalizacao, setErroLocalizacao] = useState<string | null>(null);
  const [erroLocalizacaoSecundario, setErroLocalizacaoSecundario] = useState<string | null>(null);
  const [avisoCep, setAvisoCep] = useState<string | null>(null);
  const [avisoCepSecundario, setAvisoCepSecundario] = useState<string | null>(null);
  const [novaTag, setNovaTag] = useState("");

  const [form, setForm] = useState<ClienteFormValue>({
    nome: "",
    telefone: "",
    cep: "",
    uf: "PR",
    cidade: "",
    bairro: "",
    logradouro: "",
    numero: "",
    complemento: "",
    latitude: null,
    longitude: null,
    apelidoPrincipal: "",
    secundarioCep: "",
    secundarioUf: "",
    secundarioCidade: "",
    secundarioBairro: "",
    secundarioLogradouro: "",
    secundarioNumero: "",
    secundarioComplemento: "",
    secundarioLatitude: null,
    secundarioLongitude: null,
    apelidoSecundario: "",
    tags: [],
  });

  const coordsOk = useMemo(() => {
    return (
      typeof form.latitude === "number" &&
      !Number.isNaN(form.latitude) &&
      typeof form.longitude === "number" &&
      !Number.isNaN(form.longitude)
    );
  }, [form.latitude, form.longitude]);

  const coordsSecundarioOk = useMemo(() => {
    return (
      typeof form.secundarioLatitude === "number" &&
      !Number.isNaN(form.secundarioLatitude) &&
      typeof form.secundarioLongitude === "number" &&
      !Number.isNaN(form.secundarioLongitude)
    );
  }, [form.secundarioLatitude, form.secundarioLongitude]);

  // sempre que abrir com initialValue, preenche
  useEffect(() => {
    if (!open) return;

    setErroLocalizacao(null);
    setErroLocalizacaoSecundario(null);
    setErroTaxaEntrega(null);
    setErroTaxaEntregaSecundario(null);
    setTaxaEntrega(null);
    setTaxaEntregaSecundario(null);
    setAvisoCep(null);
    setAvisoCepSecundario(null);
    setNovaTag("");

    setForm((prev) => ({
      ...prev,
      nome: upper(initialValue?.nome),
      telefone: initialValue?.telefone ?? "",
      cep: initialValue?.cep ?? "",
      uf: "PR",
      cidade: normalizarCidadePermitida(initialValue?.cidade),
      bairro: upper(initialValue?.bairro),
      logradouro: upper(initialValue?.logradouro),
      numero: upper(initialValue?.numero),
      complemento: upper(initialValue?.complemento),
      latitude: initialValue?.latitude ?? null,
      longitude: initialValue?.longitude ?? null,
      apelidoPrincipal: initialValue?.apelidoPrincipal ?? "",
      secundarioCep: initialValue?.secundarioCep ?? "",
      secundarioUf: initialValue?.secundarioUf ?? "",
      secundarioCidade: normalizarCidadePermitida(initialValue?.secundarioCidade),
      secundarioBairro: upper(initialValue?.secundarioBairro),
      secundarioLogradouro: upper(initialValue?.secundarioLogradouro),
      secundarioNumero: upper(initialValue?.secundarioNumero),
      secundarioComplemento: upper(initialValue?.secundarioComplemento),
      secundarioLatitude: initialValue?.secundarioLatitude ?? null,
      secundarioLongitude: initialValue?.secundarioLongitude ?? null,
      apelidoSecundario: initialValue?.apelidoSecundario ?? "",
      tags: initialValue?.tags ?? [],
    }));
  }, [open, initialValue]);

  useEffect(() => {
    let alive = true;

    async function run() {
      if (!open || !coordsOk || form.latitude == null || form.longitude == null) {
        setTaxaEntrega(null);
        setErroTaxaEntrega(null);
        setCalculandoTaxa(false);
        return;
      }

      setCalculandoTaxa(true);
      setErroTaxaEntrega(null);

      try {
        const taxa = await estimarTaxaPorCoordenadas(form.latitude, form.longitude);
        if (!alive) return;
        setTaxaEntrega(taxa);
      } catch (e: any) {
        if (!alive) return;
        setTaxaEntrega(null);
        setErroTaxaEntrega(e?.message || "Não foi possível calcular a taxa de entrega.");
      } finally {
        if (alive) setCalculandoTaxa(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [open, coordsOk, form.latitude, form.longitude]);

  useEffect(() => {
    let alive = true;

    async function run() {
      if (!open || !coordsSecundarioOk || form.secundarioLatitude == null || form.secundarioLongitude == null) {
        setTaxaEntregaSecundario(null);
        setErroTaxaEntregaSecundario(null);
        setCalculandoTaxaSecundario(false);
        return;
      }

      setCalculandoTaxaSecundario(true);
      setErroTaxaEntregaSecundario(null);

      try {
        const taxa = await estimarTaxaPorCoordenadas(form.secundarioLatitude, form.secundarioLongitude);
        if (!alive) return;
        setTaxaEntregaSecundario(taxa);
      } catch (e: any) {
        if (!alive) return;
        setTaxaEntregaSecundario(null);
        setErroTaxaEntregaSecundario(e?.message || "Não foi possível calcular a taxa de entrega.");
      } finally {
        if (alive) setCalculandoTaxaSecundario(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [open, coordsSecundarioOk, form.secundarioLatitude, form.secundarioLongitude]);

  const montarEnderecoCompletoParaGeocode = () => {
    const ruaNum = [form.logradouro, form.numero].filter(Boolean).join(", ");
    const cidadeUf = [form.cidade, form.uf].filter(Boolean).join(" - ");
    return [ruaNum, form.bairro, cidadeUf, form.cep, "Brasil"].filter(Boolean).join(", ");
  };

  const montarEnderecoSecundarioCompletoParaGeocode = () => {
    const ruaNum = [form.secundarioLogradouro, form.secundarioNumero].filter(Boolean).join(", ");
    const cidadeUf = [form.secundarioCidade, form.secundarioUf].filter(Boolean).join(" - ");
    return [ruaNum, form.secundarioBairro, cidadeUf, form.secundarioCep, "Brasil"].filter(Boolean).join(", ");
  };

  const handleBuscarCep = async () => {
    setAvisoCep(null);
    setErroLocalizacao(null);
    setBuscandoCep(true);
    try {
      const cepClean = onlyDigits(form.cep || "");
      const data =
        cepClean.length === 8
          ? await buscarCepViaCep(form.cep || "")
          : await buscarCepPorEnderecoViaCep(form);

      setForm((p) => ({
        ...p,
        cep: data.cep,
        uf: "PR",
        cidade: normalizarCidadePermitida(data.cidade) || p.cidade,
        bairro: data.bairro || p.bairro,
        logradouro: data.logradouro || p.logradouro,
        latitude: null,
        longitude: null,
      }));
      setTaxaEntrega(null);
      setErroTaxaEntrega(null);

      const totalCeps = "total" in data ? Number(data.total || 0) : 0;
      if (totalCeps > 1) {
        setAvisoCep(`Encontrei ${totalCeps} CEPs possíveis e preenchi o mais compatível.`);
      }
    } catch (e: any) {
      setAvisoCep(e?.message || "Não foi possível buscar o CEP.");
    } finally {
      setBuscandoCep(false);
    }
  };

  const handleLocalizarEndereco = async () => {
    setAvisoCep(null);
    setErroLocalizacao(null);
    setBuscandoCep(true);
    setLocalizando(true);
    try {
      const cepClean = onlyDigits(form.cep || "");
      const data =
        cepClean.length === 8
          ? await buscarCepViaCep(form.cep || "")
          : await buscarCepPorEnderecoViaCep(form);

      const next = {
        cep: data.cep,
        uf: "PR",
        cidade: normalizarCidadePermitida(data.cidade) || form.cidade,
        bairro: upper(data.bairro || form.bairro),
        logradouro: upper(data.logradouro || form.logradouro),
      };

      const ruaNum = [next.logradouro, form.numero].filter(Boolean).join(", ");
      const cidadeUf = [next.cidade, next.uf].filter(Boolean).join(" - ");
      const endereco = [ruaNum, next.bairro, cidadeUf, next.cep, "Brasil"].filter(Boolean).join(", ");
      const geo = await geocodeNominatimComFallback(endereco);

      setForm((p) => ({
        ...p,
        ...next,
        latitude: geo.lat,
        longitude: geo.lon,
      }));
      setTaxaEntrega(null);
      setErroTaxaEntrega(null);

      const totalCeps = "total" in data ? Number(data.total || 0) : 0;
      if (totalCeps > 1) {
        setAvisoCep(`Encontrei ${totalCeps} CEPs possíveis e preenchi o mais compatível.`);
      }
    } catch (e: any) {
      setErroLocalizacao(e?.message || "Não foi possível localizar o endereço.");
    } finally {
      setBuscandoCep(false);
      setLocalizando(false);
    }
  };

  const handleBuscarCepSecundario = async () => {
    setAvisoCepSecundario(null);
    setErroLocalizacaoSecundario(null);
    setBuscandoCepSecundario(true);
    try {
      const cepClean = onlyDigits(form.secundarioCep || "");
      const data =
        cepClean.length === 8
          ? await buscarCepViaCep(form.secundarioCep || "")
          : await buscarCepPorEnderecoViaCep({
              cep: form.secundarioCep,
              uf: "PR",
              cidade: form.secundarioCidade,
              bairro: form.secundarioBairro,
              logradouro: form.secundarioLogradouro,
            });

      setForm((p) => ({
        ...p,
        secundarioCep: data.cep,
        secundarioUf: "PR",
        secundarioCidade: normalizarCidadePermitida(data.cidade) || p.secundarioCidade,
        secundarioBairro: data.bairro || p.secundarioBairro,
        secundarioLogradouro: data.logradouro || p.secundarioLogradouro,
        secundarioLatitude: null,
        secundarioLongitude: null,
      }));
      setTaxaEntregaSecundario(null);
      setErroTaxaEntregaSecundario(null);

      const totalCeps = "total" in data ? Number(data.total || 0) : 0;
      if (totalCeps > 1) {
        setAvisoCepSecundario(`Encontrei ${totalCeps} CEPs possíveis e preenchi o mais compatível.`);
      }
    } catch (e: any) {
      setAvisoCepSecundario(e?.message || "Não foi possível buscar o CEP.");
    } finally {
      setBuscandoCepSecundario(false);
    }
  };

  const handleLocalizarEnderecoSecundario = async () => {
    setAvisoCepSecundario(null);
    setErroLocalizacaoSecundario(null);
    setBuscandoCepSecundario(true);
    setLocalizandoSecundario(true);
    try {
      const cepClean = onlyDigits(form.secundarioCep || "");
      const data =
        cepClean.length === 8
          ? await buscarCepViaCep(form.secundarioCep || "")
          : await buscarCepPorEnderecoViaCep({
              cep: form.secundarioCep,
              uf: "PR",
              cidade: form.secundarioCidade,
              bairro: form.secundarioBairro,
              logradouro: form.secundarioLogradouro,
            });

      const next = {
        secundarioCep: data.cep,
        secundarioUf: "PR",
        secundarioCidade: normalizarCidadePermitida(data.cidade) || form.secundarioCidade,
        secundarioBairro: upper(data.bairro || form.secundarioBairro),
        secundarioLogradouro: upper(data.logradouro || form.secundarioLogradouro),
      };

      const ruaNum = [next.secundarioLogradouro, form.secundarioNumero].filter(Boolean).join(", ");
      const cidadeUf = [next.secundarioCidade, next.secundarioUf].filter(Boolean).join(" - ");
      const endereco = [ruaNum, next.secundarioBairro, cidadeUf, next.secundarioCep, "Brasil"].filter(Boolean).join(", ");
      const geo = await geocodeNominatimComFallback(endereco);

      setForm((p) => ({
        ...p,
        ...next,
        secundarioLatitude: geo.lat,
        secundarioLongitude: geo.lon,
      }));
      setTaxaEntregaSecundario(null);
      setErroTaxaEntregaSecundario(null);

      const totalCeps = "total" in data ? Number(data.total || 0) : 0;
      if (totalCeps > 1) {
        setAvisoCepSecundario(`Encontrei ${totalCeps} CEPs possíveis e preenchi o mais compatível.`);
      }
    } catch (e: any) {
      setErroLocalizacaoSecundario(e?.message || "Não foi possível localizar o endereço secundário.");
    } finally {
      setBuscandoCepSecundario(false);
      setLocalizandoSecundario(false);
    }
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

  const handleLocalizarSecundarioNoMapa = async () => {
    setErroLocalizacaoSecundario(null);
    setLocalizandoSecundario(true);
    try {
      const geo = await geocodeNominatimComFallback(montarEnderecoSecundarioCompletoParaGeocode());
      setForm((p) => ({ ...p, secundarioLatitude: geo.lat, secundarioLongitude: geo.lon }));
    } catch (e: any) {
      setErroLocalizacaoSecundario(e?.message || "Não foi possível localizar no mapa.");
    } finally {
      setLocalizandoSecundario(false);
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
    const nome = upper(form.nome).trim();
    const telefone = String(form.telefone || "").trim();
    if (!nome) return;
    if (!telefone) return;
    if (!coordsOk) {
      setErroLocalizacao("Localize o endereço antes de salvar.");
      return;
    }

    const temEnderecoSecundario =
      !!form.secundarioCep?.trim() ||
      !!form.secundarioCidade?.trim() ||
      !!form.secundarioBairro?.trim() ||
      !!form.secundarioLogradouro?.trim() ||
      !!form.secundarioNumero?.trim() ||
      !!form.secundarioComplemento?.trim();
    if (temEnderecoSecundario && !coordsSecundarioOk) {
      setErroLocalizacaoSecundario("Localize o endereço secundário antes de salvar.");
      return;
    }

    const payload: ClientePayload = {
      nome,
      telefone,
      tags: form.tags || [],
      enderecos: [
        {
          principal: true,
          apelido: upper(form.apelidoPrincipal).trim() || "CASA",
          cep: form.cep?.trim() ? onlyDigits(form.cep) : null,
          uf: "PR",
          cidade: form.cidade?.trim() || null,
          bairro: upper(form.bairro).trim() || null,
          logradouro: upper(form.logradouro).trim() || null,
          numero: upper(form.numero).trim() || null,
          complemento: upper(form.complemento).trim() || null,
          latitude: typeof form.latitude === "number" ? form.latitude : null,
          longitude: typeof form.longitude === "number" ? form.longitude : null,
        },
        ...(temEnderecoSecundario
          ? [{
              principal: false,
              apelido: upper(form.apelidoSecundario).trim() || "TRABALHO",
              cep: form.secundarioCep?.trim() ? onlyDigits(form.secundarioCep) : null,
              uf: "PR",
              cidade: form.secundarioCidade?.trim() || null,
              bairro: upper(form.secundarioBairro).trim() || null,
              logradouro: upper(form.secundarioLogradouro).trim() || null,
              numero: upper(form.secundarioNumero).trim() || null,
              complemento: upper(form.secundarioComplemento).trim() || null,
              latitude: typeof form.secundarioLatitude === "number" ? form.secundarioLatitude : null,
              longitude: typeof form.secundarioLongitude === "number" ? form.secundarioLongitude : null,
            }]
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
                  onChange={(e) => setForm((p) => ({ ...p, nome: upper(e.target.value) }))}
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
            <div className="text-sm font-medium">Endereço principal + Mapa</div>

            <div className="space-y-2">
              <Label htmlFor="apelidoPrincipal">Apelido do endereço principal</Label>
              <Input
                id="apelidoPrincipal"
                value={form.apelidoPrincipal || ""}
                onChange={(e) => setForm((p) => ({ ...p, apelidoPrincipal: upper(e.target.value) }))}
                disabled={saving}
                placeholder="Casa"
              />
            </div>

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
                  value="PR"
                  disabled
                />
              </div>

              <div className="flex">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleLocalizarEndereco}
                  disabled={saving || buscandoCep || localizando}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  {buscandoCep || localizando ? "Localizando..." : "Localizar Endereço"}
                </Button>
              </div>
            </div>

            {avisoCep && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {avisoCep}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Select value={form.cidade || ""} onValueChange={(cidade) => setForm((p) => ({ ...p, cidade }))} disabled={saving}>
                  <SelectTrigger id="cidade">
                    <SelectValue placeholder="Selecione a cidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {CIDADES_PR.map((cidade) => <SelectItem key={cidade} value={cidade}>{cidade}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  value={form.bairro || ""}
                  onChange={(e) => setForm((p) => ({ ...p, bairro: upper(e.target.value) }))}
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
                  onChange={(e) => setForm((p) => ({ ...p, logradouro: upper(e.target.value) }))}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  value={form.numero || ""}
                  onChange={(e) => setForm((p) => ({ ...p, numero: upper(e.target.value) }))}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="complemento">Complemento</Label>
              <Input
                id="complemento"
                value={form.complemento || ""}
                onChange={(e) => setForm((p) => ({ ...p, complemento: upper(e.target.value) }))}
                disabled={saving}
              />
            </div>

            {erroLocalizacao && <div className="text-sm text-red-600">{erroLocalizacao}</div>}

            <div className="rounded-md border border-dashed border-emerald-200 bg-emerald-50/50 px-3 py-2 text-sm">
              {calculandoTaxa ? (
                <span className="font-medium text-emerald-800">Calculando taxa de entrega...</span>
              ) : erroTaxaEntrega ? (
                <span className="text-orange-700">{erroTaxaEntrega}</span>
              ) : taxaEntrega ? (
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-medium text-emerald-900">
                    Taxa de entrega estimada
                    {taxaEntrega.distanciaKm > 0 ? ` (${taxaEntrega.distanciaKm.toFixed(2).replace(".", ",")} km)` : ""}
                  </span>
                  <span className="font-extrabold text-emerald-800">R$ {currency(taxaEntrega.valorTaxa)}</span>
                </div>
              ) : (
                <span className="text-muted-foreground">
                  Localize o endereço no mapa para calcular a taxa de entrega.
                </span>
              )}
            </div>

            <div className="rounded-md border overflow-hidden">
              <div className="p-3 border-b text-sm text-muted-foreground">
                {coordsOk
                  ? `Localização aproximada: ${form.latitude?.toFixed(5)}, ${form.longitude?.toFixed(5)}`
                  : "Sem localização ainda. Use Localizar Endereço antes de salvar."}
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

          <div className="space-y-4">
            <div className="text-sm font-medium">Endereço secundário</div>

            <div className="space-y-2">
              <Label htmlFor="apelidoSecundario">Apelido do endereço secundário</Label>
              <Input
                id="apelidoSecundario"
                value={form.apelidoSecundario || ""}
                onChange={(e) => setForm((p) => ({ ...p, apelidoSecundario: upper(e.target.value) }))}
                disabled={saving}
                placeholder="Trabalho"
              />
            </div>

            <div className="grid grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="secundarioCep">CEP</Label>
                <Input id="secundarioCep" value={form.secundarioCep || ""} onChange={(e) => setForm((p) => ({ ...p, secundarioCep: e.target.value }))} disabled={saving} placeholder="00000-000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secundarioUf">UF</Label>
                <Input id="secundarioUf" value="PR" disabled />
              </div>
              <div className="flex">
                <Button type="button" variant="secondary" onClick={handleLocalizarEnderecoSecundario} disabled={saving || buscandoCepSecundario || localizandoSecundario}>
                  <MapPin className="mr-2 h-4 w-4" />
                  {buscandoCepSecundario || localizandoSecundario ? "Localizando..." : "Localizar Endereço"}
                </Button>
              </div>
            </div>

            {avisoCepSecundario && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {avisoCepSecundario}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="secundarioCidade">Cidade</Label>
                <Select value={form.secundarioCidade || ""} onValueChange={(secundarioCidade) => setForm((p) => ({ ...p, secundarioCidade }))} disabled={saving}>
                  <SelectTrigger id="secundarioCidade">
                    <SelectValue placeholder="Selecione a cidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {CIDADES_PR.map((cidade) => <SelectItem key={cidade} value={cidade}>{cidade}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secundarioBairro">Bairro</Label>
                <Input id="secundarioBairro" value={form.secundarioBairro || ""} onChange={(e) => setForm((p) => ({ ...p, secundarioBairro: upper(e.target.value) }))} disabled={saving} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="secundarioComplemento">Complemento</Label>
                <Input id="secundarioComplemento" value={form.secundarioComplemento || ""} onChange={(e) => setForm((p) => ({ ...p, secundarioComplemento: upper(e.target.value) }))} disabled={saving} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="secundarioLogradouro">Rua</Label>
                <Input id="secundarioLogradouro" value={form.secundarioLogradouro || ""} onChange={(e) => setForm((p) => ({ ...p, secundarioLogradouro: upper(e.target.value) }))} disabled={saving} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secundarioNumero">Número</Label>
                <Input id="secundarioNumero" value={form.secundarioNumero || ""} onChange={(e) => setForm((p) => ({ ...p, secundarioNumero: upper(e.target.value) }))} disabled={saving} />
              </div>
            </div>

            {erroLocalizacaoSecundario && <div className="text-sm text-red-600">{erroLocalizacaoSecundario}</div>}

            <div className="rounded-md border border-dashed border-emerald-200 bg-emerald-50/50 px-3 py-2 text-sm">
              {calculandoTaxaSecundario ? (
                <span className="font-medium text-emerald-800">Calculando taxa de entrega...</span>
              ) : erroTaxaEntregaSecundario ? (
                <span className="text-orange-700">{erroTaxaEntregaSecundario}</span>
              ) : taxaEntregaSecundario ? (
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-medium text-emerald-900">
                    Taxa de entrega estimada
                    {taxaEntregaSecundario.distanciaKm > 0 ? ` (${taxaEntregaSecundario.distanciaKm.toFixed(2).replace(".", ",")} km)` : ""}
                  </span>
                  <span className="font-extrabold text-emerald-800">R$ {currency(taxaEntregaSecundario.valorTaxa)}</span>
                </div>
              ) : (
                <span className="text-muted-foreground">
                  Localize o endereço secundário no mapa para calcular a taxa de entrega.
                </span>
              )}
            </div>

            <div className="rounded-md border overflow-hidden">
              <div className="p-3 border-b text-sm text-muted-foreground">
                {coordsSecundarioOk
                  ? `Localização aproximada: ${form.secundarioLatitude?.toFixed(5)}, ${form.secundarioLongitude?.toFixed(5)}`
                  : "Sem localização ainda. Use Localizar Endereço antes de salvar."}
              </div>

              <div className="h-[280px]">
                {coordsSecundarioOk ? (
                  <MapContainer
                    center={[form.secundarioLatitude as number, form.secundarioLongitude as number]}
                    zoom={15}
                    style={{ height: "100%", width: "100%" }}
                    scrollWheelZoom={false}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <CircleMarker
                      center={[form.secundarioLatitude as number, form.secundarioLongitude as number] as [number, number]}
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
          <Button onClick={handleSave} disabled={saving || !coordsOk}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
