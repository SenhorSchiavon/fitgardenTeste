"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Pencil,
  Trash,
  Search,
  History,
  Tag,
  MapPin,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";
import "leaflet/dist/leaflet.css";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { Cliente, RegiaoEntrega, useClientes } from "@/hooks/useClientes";
import { DialogClose } from "@radix-ui/react-dialog";

const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false },
);
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), {
  ssr: false,
});

type ClienteForm = {
  nome: string;
  telefone: string;
  cpf?: string;
  dataNascimento?: string;

  regiao?:
    | "CENTRO"
    | "ZONA SUL"
    | "ZONA OESTE"
    | "ZONA NORTE"
    | "ZONA LESTE"
    | "CAMBÉ"
    | "IBIPORÃ";

  // endereço principal
  cep?: string;
  uf?: string;
  cidade?: string;
  bairro?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;

  latitude?: number | null;
  longitude?: number | null;

  // alternativo (simples)
  enderecoAlternativo?: string;

  tags: string[];
};

function uiRegiaoToApi(value?: ClienteForm["regiao"]): RegiaoEntrega | null {
  if (!value) return null;

  const v = value
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");

  const map: Record<string, RegiaoEntrega> = {
    CENTRO: "CENTRO",
    ZONA_SUL: "ZONA_SUL",
    ZONA_NORTE: "ZONA_NORTE",
    ZONA_OESTE: "ZONA_OESTE",
    ZONA_LESTE: "ZONA_LESTE",
    CAMBE: "CAMBE",
    IBIPORA: "IBIPORA",
  };

  return map[v] || null;
}

function apiRegiaoToUi(value?: RegiaoEntrega | null): ClienteForm["regiao"] {
  if (!value) return "CENTRO";
  const map: Record<RegiaoEntrega, ClienteForm["regiao"]> = {
    CENTRO: "CENTRO",
    ZONA_SUL: "ZONA SUL",
    ZONA_NORTE: "ZONA NORTE",
    ZONA_LESTE: "ZONA LESTE",
    ZONA_OESTE: "ZONA OESTE",
    CAMBE: "CAMBÉ",
    IBIPORA: "IBIPORÃ",
  };
  return map[value] || "CENTRO";
}

function principalEnderecoTexto(c: Cliente) {
  const e = c.enderecos?.find((x) => x.principal);
  if (!e) return "";
  const rua = e.logradouro || "";
  const num = e.numero ? `, ${e.numero}` : "";
  const bairro = e.bairro ? ` - ${e.bairro}` : "";
  const cidade = e.cidade ? `, ${e.cidade}` : "";
  const uf = e.uf ? `/${e.uf}` : "";
  const cep = e.cep ? ` (${e.cep})` : "";
  const fallback = e.endereco ? ` - ${e.endereco}` : "";
  return `${rua}${num}${bairro}${cidade}${uf}${cep}${fallback}`.trim();
}

function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

async function buscarCepViaCep(cep: string) {
  const clean = onlyDigits(cep);
  if (clean.length !== 8) throw new Error("CEP inválido. Use 8 dígitos.");

  const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`, {
    cache: "no-store",
  });
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
const CircleMarker = dynamic(
  () => import("react-leaflet").then((m) => m.CircleMarker),
  { ssr: false },
);

async function geocodeNominatim(address: string) {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(address)}`;

  const res = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) throw new Error("Não foi possível localizar no mapa.");

  const data = await res.json();

  // 1) formato array (json/jsonv2)
  if (Array.isArray(data) && data[0]) {
    return { lat: Number(data[0].lat), lon: Number(data[0].lon) };
  }

  // 2) formato geojson (FeatureCollection)
  if (data?.features?.length) {
    const f = data.features[0];
    const lon = f?.geometry?.coordinates?.[0];
    const lat = f?.geometry?.coordinates?.[1];
    if (typeof lat === "number" && typeof lon === "number") return { lat, lon };
  }

  throw new Error("Endereço não localizado.");
}

export default function Clientes() {
  const {
    filteredClientes,
    loading,
    saving,
    search,
    setSearch,
    createCliente,
    updateCliente,
    deleteCliente,
  } = useClientes();
  const [localizando, setLocalizando] = useState(false);
  const [erroLocalizacao, setErroLocalizacao] = useState<string | null>(null);

  const [novoCliente, setNovoCliente] = useState<ClienteForm>({
    nome: "",
    telefone: "",
    cpf: "",
    regiao: "CENTRO",
    dataNascimento: "",

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

  const [novaTag, setNovaTag] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [historicoDialogOpen, setHistoricoDialogOpen] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(
    null,
  );

  const [excluindoId, setExcluindoId] = useState<number | null>(null);

  const resetForm = () => {
    setNovoCliente({
      nome: "",
      telefone: "",
      cpf: "",
      regiao: "CENTRO",
      dataNascimento: "",

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
    setNovaTag("");
    setEditandoId(null);
  };

  const handleNew = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (cliente: Cliente) => {
    const end1 = cliente.enderecos?.find((e) => e.principal);
    const end2 = cliente.enderecos?.find((e) => !e.principal);

    setNovoCliente({
      nome: cliente.nome,
      telefone: cliente.telefone,
      cpf: cliente.cpf || "",
      regiao: apiRegiaoToUi(cliente.regiao),
      dataNascimento: cliente.dataNascimento
        ? String(cliente.dataNascimento).slice(0, 10)
        : "",

      cep: end1?.cep || "",
      uf: end1?.uf || "",
      cidade: end1?.cidade || "",
      bairro: end1?.bairro || "",
      logradouro: end1?.logradouro || "",
      numero: end1?.numero || "",
      complemento: end1?.complemento || "",

      latitude: end1?.latitude ?? null,
      longitude: end1?.longitude ?? null,

      enderecoAlternativo: end2?.endereco || "",
      tags: (cliente.tags || []).map((t) => t.tag),
    });

    setEditandoId(cliente.id);
    setDialogOpen(true);
  };

  const handleAddTag = () => {
    const tag = novaTag.trim();
    if (!tag) return;
    if (!novoCliente.tags.includes(tag))
      setNovoCliente((p) => ({ ...p, tags: [...p.tags, tag] }));
    setNovaTag("");
  };

  const handleRemoveTag = (tag: string) => {
    setNovoCliente((p) => ({ ...p, tags: p.tags.filter((t) => t !== tag) }));
  };

  const montarEnderecoCompletoParaGeocode = () => {
    const ruaNum = [novoCliente.logradouro, novoCliente.numero]
      .filter(Boolean)
      .join(", ");
    const cidadeUf = [novoCliente.cidade, novoCliente.uf]
      .filter(Boolean)
      .join(" - ");
    const parts = [
      ruaNum,
      novoCliente.bairro,
      cidadeUf,
      novoCliente.cep,
      "Brasil",
    ].filter(Boolean);
    return parts.join(", ");
  };

  const handleBuscarCep = async () => {
    const data = await buscarCepViaCep(novoCliente.cep || "");
    setNovoCliente((p) => ({
      ...p,
      cep: data.cep,
      uf: data.uf || p.uf,
      cidade: data.cidade || p.cidade,
      bairro: data.bairro || p.bairro,
      logradouro: data.logradouro || p.logradouro,
      // quando muda CEP, geralmente muda localidade — zera coords pra recalcular
      latitude: null,
      longitude: null,
    }));
  };

  const handleLocalizarNoMapa = async () => {
    setErroLocalizacao(null);
    setLocalizando(true);

    try {
      const addrFull = montarEnderecoCompletoParaGeocode();
      const geo = await geocodeNominatimComFallback(addrFull);

      setNovoCliente((p) => ({ ...p, latitude: geo.lat, longitude: geo.lon }));
    } catch (e: any) {
      setErroLocalizacao(e?.message || "Não foi possível localizar no mapa.");
    } finally {
      setLocalizando(false);
    }
  };
  async function geocodeNominatimComFallback(fullAddress: string) {
    try {
      return await geocodeNominatim(fullAddress);
    } catch {}

    const semCep = fullAddress
      .replace(/\b\d{5}-?\d{3}\b/g, "")
      .replace(/\s+,/g, ",")
      .trim();
    try {
      return await geocodeNominatim(semCep);
    } catch {}

    const parts = fullAddress
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    const fallback = parts.slice(0, 2).concat(parts.slice(-3)).join(", ");
    return await geocodeNominatim(fallback);
  }

  const handleSave = async () => {
    const payload = {
      nome: String(novoCliente.nome || "").trim(),
      telefone: String(novoCliente.telefone || "").trim(),
      cpf: novoCliente.cpf?.trim() ? novoCliente.cpf.trim() : null,
      dataNascimento: novoCliente.dataNascimento?.trim()
        ? novoCliente.dataNascimento.trim()
        : null,
      regiao: uiRegiaoToApi(novoCliente.regiao) || null,
      tags: novoCliente.tags || [],
      enderecos: [
        {
          principal: true,
          cep: novoCliente.cep?.trim() ? onlyDigits(novoCliente.cep) : null,
          uf: novoCliente.uf?.trim() || null,
          cidade: novoCliente.cidade?.trim() || null,
          bairro: novoCliente.bairro?.trim() || null,
          logradouro: novoCliente.logradouro?.trim() || null,
          numero: novoCliente.numero?.trim() || null,
          complemento: novoCliente.complemento?.trim() || null,
          latitude:
            typeof novoCliente.latitude === "number"
              ? novoCliente.latitude
              : null,
          longitude:
            typeof novoCliente.longitude === "number"
              ? novoCliente.longitude
              : null,
        },
        ...(novoCliente.enderecoAlternativo?.trim()
          ? [
              {
                principal: false,
                endereco: novoCliente.enderecoAlternativo.trim(),
              },
            ]
          : []),
      ],
    };

    if (!payload.nome) return;
    if (!payload.telefone) return;

    if (editandoId) await updateCliente(editandoId, payload);
    else await createCliente(payload);

    setDialogOpen(false);
    resetForm();
  };

  const handleShowHistory = (cliente: Cliente) => {
    setClienteSelecionado(cliente);
    setHistoricoDialogOpen(true);
  };

  const planosSelecionado = useMemo(() => {
    if (!clienteSelecionado) return [];
    return (clienteSelecionado.planos || []).map((p) => ({
      id: String(p.id),
      nome: "Plano",
      tamanho: p.tamanho ? `${p.tamanho.pesagemGramas}g` : "-",
      saldoRestante: Number(p.saldoUnidades || 0),
    }));
  }, [clienteSelecionado]);

  const coordsOk =
    typeof novoCliente.latitude === "number" &&
    !Number.isNaN(novoCliente.latitude) &&
    typeof novoCliente.longitude === "number" &&
    !Number.isNaN(novoCliente.longitude);

  return (
    <div className="container mx-auto p-6">
      <Header
        title="Cadastro de Clientes"
        subtitle="Gerencie os clientes e seus planos"
      />

      <div className="flex items-center justify-between mb-6 gap-3">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone ou endereço..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={loading}
          />
        </div>

        <Button onClick={handleNew} disabled={saving}>
          <Plus className="mr-2 h-4 w-4" /> Novo Cliente
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clientes Cadastrados</CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">
              Carregando clientes...
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Data de Nascimento</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredClientes.map((cliente) => {
                  const endereco = principalEnderecoTexto(cliente);

                  return (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium">
                        {cliente.nome}
                      </TableCell>
                      <TableCell>{cliente.telefone || ""}</TableCell>
                      <TableCell>{endereco || "-"}</TableCell>

                      <TableCell>
                        {cliente.planos?.length
                          ? `${cliente.planos[0].tamanho?.pesagemGramas ?? ""}g (${Number(cliente.planos[0].saldoUnidades || 0)} un.)`
                          : "Sem plano"}
                      </TableCell>

                      <TableCell>
                        {cliente.dataNascimento
                          ? new Date(cliente.dataNascimento).toLocaleDateString(
                              "pt-BR",
                            )
                          : "Não informada"}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleShowHistory(cliente)}
                          disabled={saving}
                        >
                          <History className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(cliente)}
                          disabled={saving}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <AlertDialog
                          open={excluindoId === cliente.id}
                          onOpenChange={(open) =>
                            setExcluindoId(open ? cliente.id : null)
                          }
                        >
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={saving}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>

                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Excluir cliente?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Isso remove o cliente <b>{cliente.nome}</b>. Se
                                ele tiver pedidos, a API pode bloquear a
                                exclusão.
                              </AlertDialogDescription>
                            </AlertDialogHeader>

                            <AlertDialogFooter>
                              <AlertDialogCancel disabled={saving}>
                                Cancelar
                              </AlertDialogCancel>
                              <AlertDialogAction
                                disabled={saving}
                                onClick={async () => {
                                  await deleteCliente(cliente.id);
                                  setExcluindoId(null);
                                }}
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {filteredClientes.length === 0 && !loading && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-sm text-muted-foreground py-4"
                    >
                      Nenhum cliente encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* MODAL CRIAR/EDITAR */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-hidden p-0 flex flex-col">
          <div className="sticky top-0 z-20 bg-background border-b px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <DialogHeader className="p-0">
                <DialogTitle>
                  {editandoId ? "Editar Cliente" : "Novo Cliente"}
                </DialogTitle>
              </DialogHeader>

              <DialogClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 px-6">
            <Tabs defaultValue="dados">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="dados">Dados</TabsTrigger>
                <TabsTrigger value="endereco">Endereço + Mapa</TabsTrigger>
                <TabsTrigger value="tags">Tags</TabsTrigger>
              </TabsList>

              <TabsContent value="dados" className="space-y-4 py-4 px-0">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome</Label>
                    <Input
                      id="nome"
                      value={novoCliente.nome}
                      onChange={(e) =>
                        setNovoCliente((p) => ({ ...p, nome: e.target.value }))
                      }
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={novoCliente.telefone}
                      onChange={(e) =>
                        setNovoCliente((p) => ({
                          ...p,
                          telefone: e.target.value,
                        }))
                      }
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={novoCliente.cpf || ""}
                      onChange={(e) =>
                        setNovoCliente((p) => ({ ...p, cpf: e.target.value }))
                      }
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                    <Input
                      id="dataNascimento"
                      type="date"
                      value={novoCliente.dataNascimento || ""}
                      onChange={(e) =>
                        setNovoCliente((p) => ({
                          ...p,
                          dataNascimento: e.target.value,
                        }))
                      }
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="regiao">Região</Label>
                  <Select
                    value={novoCliente.regiao || "CENTRO"}
                    onValueChange={(value) =>
                      setNovoCliente((p) => ({ ...p, regiao: value as any }))
                    }
                    disabled={saving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma região" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CENTRO">CENTRO</SelectItem>
                      <SelectItem value="ZONA SUL">ZONA SUL</SelectItem>
                      <SelectItem value="ZONA NORTE">ZONA NORTE</SelectItem>
                      <SelectItem value="ZONA OESTE">ZONA OESTE</SelectItem>
                      <SelectItem value="ZONA LESTE">ZONA LESTE</SelectItem>
                      <SelectItem value="CAMBÉ">CAMBÉ</SelectItem>
                      <SelectItem value="IBIPORÃ">IBIPORÃ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="endereco" className="space-y-4 py-4 px-0">
                <div className="grid grid-cols-3 gap-4 items-end">
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      value={novoCliente.cep || ""}
                      onChange={(e) =>
                        setNovoCliente((p) => ({ ...p, cep: e.target.value }))
                      }
                      disabled={saving}
                      placeholder="00000-000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="uf">UF</Label>
                    <Input
                      id="uf"
                      value={novoCliente.uf || ""}
                      onChange={(e) =>
                        setNovoCliente((p) => ({
                          ...p,
                          uf: e.target.value.toUpperCase(),
                        }))
                      }
                      disabled={saving}
                      placeholder="PR"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleBuscarCep}
                      disabled={saving}
                    >
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
                      value={novoCliente.cidade || ""}
                      onChange={(e) =>
                        setNovoCliente((p) => ({
                          ...p,
                          cidade: e.target.value,
                        }))
                      }
                      disabled={saving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input
                      id="bairro"
                      value={novoCliente.bairro || ""}
                      onChange={(e) =>
                        setNovoCliente((p) => ({
                          ...p,
                          bairro: e.target.value,
                        }))
                      }
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="logradouro">Rua</Label>
                    <Input
                      id="logradouro"
                      value={novoCliente.logradouro || ""}
                      onChange={(e) =>
                        setNovoCliente((p) => ({
                          ...p,
                          logradouro: e.target.value,
                        }))
                      }
                      disabled={saving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero">Número</Label>
                    <Input
                      id="numero"
                      value={novoCliente.numero || ""}
                      onChange={(e) =>
                        setNovoCliente((p) => ({
                          ...p,
                          numero: e.target.value,
                        }))
                      }
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input
                    id="complemento"
                    value={novoCliente.complemento || ""}
                    onChange={(e) =>
                      setNovoCliente((p) => ({
                        ...p,
                        complemento: e.target.value,
                      }))
                    }
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="enderecoAlternativo">
                    Endereço Alternativo
                  </Label>
                  <Input
                    id="enderecoAlternativo"
                    value={novoCliente.enderecoAlternativo || ""}
                    onChange={(e) =>
                      setNovoCliente((p) => ({
                        ...p,
                        enderecoAlternativo: e.target.value,
                      }))
                    }
                    disabled={saving}
                  />
                </div>

                <div className="rounded-md border overflow-hidden">
                  <div className="p-3 border-b text-sm text-muted-foreground">
                    {coordsOk
                      ? `Localização aproximada: ${novoCliente.latitude?.toFixed(5)}, ${novoCliente.longitude?.toFixed(5)}`
                      : "Sem localização ainda. Use “Localizar” para gerar uma posição aproximada."}
                  </div>

                  <div className="h-[280px]">
                    {coordsOk ? (
                      <MapContainer
                        center={[
                          novoCliente.latitude as number,
                          novoCliente.longitude as number,
                        ]}
                        zoom={15}
                        style={{ height: "100%", width: "100%" }}
                        scrollWheelZoom={false}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <CircleMarker
                          center={
                            [
                              novoCliente.latitude as number,
                              novoCliente.longitude as number,
                            ] as [number, number]
                          }
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
              </TabsContent>

              <TabsContent value="tags" className="space-y-4 py-4 px-0">
                <div className="space-y-2">
                  <Label>Tags</Label>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {(novoCliente.tags || []).map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
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
                    <Button
                      type="button"
                      onClick={handleAddTag}
                      disabled={saving}
                    >
                      <Tag className="mr-2 h-4 w-4" /> Adicionar
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={historicoDialogOpen} onOpenChange={setHistoricoDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Histórico de Pedidos - {clienteSelecionado?.nome}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="historico">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="historico">Histórico de Pedidos</TabsTrigger>
              <TabsTrigger value="planos">Planos em Aberto</TabsTrigger>
            </TabsList>

            <TabsContent value="historico" className="py-4">
              <div className="text-sm text-muted-foreground">
                Em breve: quando entrarmos em <b>Pedidos</b>, a gente pluga aqui
                o endpoint e lista o histórico real.
              </div>
            </TabsContent>

            <TabsContent value="planos" className="py-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plano Adquirido</TableHead>
                    <TableHead>Tamanho</TableHead>
                    <TableHead>Saldo Restante</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {planosSelecionado.map((plano) => (
                    <TableRow key={plano.id}>
                      <TableCell>{plano.nome}</TableCell>
                      <TableCell>{plano.tamanho}</TableCell>
                      <TableCell>{plano.saldoRestante} unidades</TableCell>
                    </TableRow>
                  ))}

                  {planosSelecionado.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center">
                        Nenhum plano ativo
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
