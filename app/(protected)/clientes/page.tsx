"use client";

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
import { Plus, Pencil, Trash, Package, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Header } from "@/components/header";
import { useTableSort } from "@/hooks/useTableSort";
import { SortableHead } from "@/components/ui/sorttable";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ClienteHistoricoDialog } from "@/components/clientes/ClienteHistoricoDialog";
import { History } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

import { Cliente, useClientes } from "@/hooks/useClientes";
import { usePlanosCliente } from "@/hooks/usePlanosCliente";

// >>> IMPORTA O MODAL REUTILIZÁVEL (ajusta o path conforme teu projeto)
import { ClienteFormDialog } from "@/components/clientes/ClienteFormDialog";

type PlanoCatalogo = {
  id: number;
  nome?: string | null;
  unidades?: number | null;
  tamanho?: { id: number; pesagemGramas: number } | null;
};

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

  const {
    listTamanhos, // [{id, pesagemGramas}]
    listPlanos, // PlanoCatalogo[]
    createPlano, // (payload: {nome?: string|null, tamanhoId: number, unidades: number}) => PlanoCatalogo
    vincularPlano, // (clienteId: number, planoId: number) => any
    desvincularPlano, // (clienteId: number, planoIdOrVinculoId: number) => any
    saving: savingPlano,
  } = usePlanosCliente();

  const savingAll = saving || savingPlano;

  // >>> estados do MODAL reutilizável (criar/editar)
  const [clienteDialogOpen, setClienteDialogOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [clienteInitial, setClienteInitial] = useState<any>(null);

  // >>> histórico/planos (continua igual)
  const [historicoDialogOpen, setHistoricoDialogOpen] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [abaHistorico, setAbaHistorico] = useState<"historico" | "planos">("historico");

  const [tamanhos, setTamanhos] = useState<{ id: number; pesagemGramas: number }[]>([]);
  const [planosCatalogo, setPlanosCatalogo] = useState<PlanoCatalogo[]>([]);

  const [novoPlanoCatalogo, setNovoPlanoCatalogo] = useState<{
    nome: string;
    tamanhoId: string;
    unidades: number;
  }>({
    nome: "",
    tamanhoId: "",
    unidades: 10,
  });

  const [vinculoPlanoId, setVinculoPlanoId] = useState<string>("");
  const [excluindoId, setExcluindoId] = useState<number | null>(null);

  const handleNew = () => {
    setEditandoId(null);
    setClienteInitial(null);
    setClienteDialogOpen(true);
  };

  const handleEdit = (cliente: Cliente) => {
    const end1 = cliente.enderecos?.find((e) => e.principal);
    const end2 = cliente.enderecos?.find((e) => !e.principal);

    setClienteInitial({
      nome: cliente.nome,
      telefone: cliente.telefone,

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
    setClienteDialogOpen(true);
  };

  const handleShowHistory = async (
    cliente: Cliente,
    aba: "historico" | "planos" = "historico",
  ) => {
    setClienteSelecionado(cliente);
    setHistoricoDialogOpen(true);
    setAbaHistorico(aba);

    if (aba === "planos") {
      try {
        const [t, planos] = await Promise.all([listTamanhos(), listPlanos()]);
        setTamanhos(t || []);
        setPlanosCatalogo(planos || []);
      } catch {
        setTamanhos([]);
        setPlanosCatalogo([]);
      }
    }
  };

  type ClienteRow = {
    cliente: Cliente;
    nome: string;
    telefone: string;
    endereco: string;
    plano: string;
  };

  const rows: ClienteRow[] = useMemo(() => {
    return (filteredClientes || []).map((c) => {
      const endereco = principalEnderecoTexto(c) || "-";

      const plano = c.planos?.length
        ? `${c.planos[0].tamanho?.pesagemGramas ?? ""}g (${Number(
          c.planos[0].saldoUnidades || 0,
        )} un.)`
        : "Sem plano";

      return {
        cliente: c,
        nome: c.nome || "",
        telefone: c.telefone || "",
        endereco,
        plano,
      };
    });
  }, [filteredClientes]);

  const { sort, onSort, sortedRows } = useTableSort<
    ClienteRow,
    "nome" | "telefone" | "endereco" | "plano"
  >(rows, { initialKey: "nome", initialDirection: "asc" });

  const planosSelecionado = useMemo(() => {
    if (!clienteSelecionado) return [];
    return (clienteSelecionado.planos || []).map((p: any) => ({
      id: Number(p.id),
      nome: p.nome || p.plano?.nome || "Plano",
      tamanho: p.tamanho?.pesagemGramas
        ? `${p.tamanho.pesagemGramas}g`
        : p.plano?.tamanho?.pesagemGramas
          ? `${p.plano.tamanho.pesagemGramas}g`
          : "-",
      unidades: Number(p.unidades ?? p.plano?.unidades ?? 0),
    }));
  }, [clienteSelecionado]);

  const planosVinculaveis = useMemo(() => {
    const vinculadosIds = new Set(planosSelecionado.map((p) => p.id));
    return (planosCatalogo || []).filter((p) => !vinculadosIds.has(p.id));
  }, [planosCatalogo, planosSelecionado]);

  return (
    <div className="container mx-auto p-6">
      <Header
        title="Cadastro de Clientes"
        subtitle="Gerencie os clientes e seus planos"
        searchValue={search}
        onSearchChange={setSearch}
      />

      <div className="flex items-center justify-end mb-6 gap-3">
        <Button onClick={handleNew} disabled={savingAll}>
          <Plus className="mr-2 h-4 w-4" /> Novo Cliente
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clientes Cadastrados</CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando clientes...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead label="Nome" field="nome" sort={sort} onSort={onSort} />
                  <SortableHead label="Telefone" field="telefone" sort={sort} onSort={onSort} />
                  <SortableHead label="Endereço" field="endereco" sort={sort} onSort={onSort} />
                  <SortableHead label="Plano" field="plano" sort={sort} onSort={onSort} />
                  <TableHead className="text-right">
                    <div className="flex items-center justify-end gap-2">Ações</div>
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {sortedRows.map((row) => {
                  const cliente = row.cliente;

                  return (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium">{row.nome}</TableCell>
                      <TableCell>{row.telefone || ""}</TableCell>
                      <TableCell>{row.endereco || "-"}</TableCell>
                      <TableCell>{row.plano}</TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleShowHistory(cliente, "historico")}
                          disabled={savingAll}
                          title="Histórico"
                        >
                          <History className="h-4 w-4" />
                        </Button>


                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(cliente)}
                          disabled={savingAll}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <AlertDialog
                          open={excluindoId === cliente.id}
                          onOpenChange={(open) => setExcluindoId(open ? cliente.id : null)}
                        >
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={savingAll} title="Excluir">
                              <Trash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>

                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Isso remove o cliente <b>{cliente.nome}</b>. Se ele tiver pedidos, a API
                                pode bloquear a exclusão.
                              </AlertDialogDescription>
                            </AlertDialogHeader>

                            <AlertDialogFooter>
                              <AlertDialogCancel disabled={savingAll}>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                disabled={savingAll}
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

                {sortedRows.length === 0 && !loading && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
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

      <ClienteFormDialog
        open={clienteDialogOpen}
        onOpenChange={(open) => {
          setClienteDialogOpen(open);
          if (!open) {
            setEditandoId(null);
            setClienteInitial(null);
          }
        }}
        title={editandoId ? "Editar Cliente" : "Novo Cliente"}
        initialValue={clienteInitial}
        saving={savingAll}
        onSubmit={async (payload: any) => {
          if (editandoId) return updateCliente(editandoId, payload);
          return createCliente(payload);
        }}
      />
      <ClienteHistoricoDialog
        open={historicoDialogOpen}
        onOpenChange={setHistoricoDialogOpen}
        cliente={clienteSelecionado}
        defaultTab={abaHistorico}
        saving={savingAll}
      />
   
    </div>
  );
}