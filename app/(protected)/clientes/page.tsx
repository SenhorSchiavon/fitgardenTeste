"use client";

import { useMemo, useState } from "react";
import { History, Pencil, Plus, Trash } from "lucide-react";

import { Header } from "@/components/header";
import { ClienteFormDialog } from "@/components/clientes/ClienteFormDialog";
import { ClienteHistoricoDialog } from "@/components/clientes/ClienteHistoricoDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SortableHead } from "@/components/ui/sorttable";
import { useTableSort } from "@/hooks/useTableSort";
import { Cliente, useClientes } from "@/hooks/useClientes";

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

  const [clienteDialogOpen, setClienteDialogOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [clienteInitial, setClienteInitial] = useState<any>(null);

  const [historicoDialogOpen, setHistoricoDialogOpen] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [abaHistorico, setAbaHistorico] = useState<"historico" | "planos">("historico");
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

  const handleShowHistory = (
    cliente: Cliente,
    aba: "historico" | "planos" = "historico",
  ) => {
    setClienteSelecionado(cliente);
    setAbaHistorico(aba);
    setHistoricoDialogOpen(true);
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
        ? `${c.planos[0].tamanho?.pesagemGramas ?? c.planos[0].plano?.tamanho?.pesagemGramas ?? ""}g (${Number(
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

  return (
    <div className="container mx-auto p-6">
      <Header
        title="Cadastro de Clientes"
        subtitle="Gerencie os clientes e seus históricos"
        searchValue={search}
        onSearchChange={setSearch}
      />

      <div className="flex items-center justify-end mb-6 gap-3">
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
                          disabled={saving}
                          title="Histórico"
                        >
                          <History className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(cliente)}
                          disabled={saving}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <AlertDialog
                          open={excluindoId === cliente.id}
                          onOpenChange={(open) => setExcluindoId(open ? cliente.id : null)}
                        >
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={saving} title="Excluir">
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
                              <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
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
        saving={saving}
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
        saving={saving}
      />
    </div>
  );
}
