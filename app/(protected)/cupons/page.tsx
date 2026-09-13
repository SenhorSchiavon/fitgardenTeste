"use client"

import { useEffect, useMemo, useState } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiFetch } from "@/hooks/api"
import { useTableSort } from "@/hooks/useTableSort"
import { SortableHead } from "@/components/ui/sorttable"
import { BarChart3, Pencil, Plus, Search, Trash } from "lucide-react"
import { toast } from "sonner"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api"

type Cupom = { id: number; nome: string; percentual: number; createdAt: string }
type RelatorioCupom = { cupomId: number | null; nome: string; percentual: number; usos: number; descontoTotal: number; valorPedidos: number }

const hoje = () => new Date().toISOString().slice(0, 10)
const moeda = (valor: number) => Number(valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function CuponsPage() {
  const [cupons, setCupons] = useState<Cupom[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Cupom | null>(null)
  const [form, setForm] = useState({ nome: "", percentual: "" })
  const [relatorioOpen, setRelatorioOpen] = useState(false)
  const [dataInicio, setDataInicio] = useState(hoje())
  const [dataFim, setDataFim] = useState(hoje())
  const [relatorio, setRelatorio] = useState<RelatorioCupom[]>([])
  const [loadingRelatorio, setLoadingRelatorio] = useState(false)

  async function carregarCupons() {
    try {
      setLoading(true)
      const response = await apiFetch(`${API_URL}/cupons`)
      const data = await response.json().catch(() => [])
      if (!response.ok) throw new Error(data?.message || "Erro ao carregar cupons")
      setCupons((data || []).map((cupom: any) => ({
        id: Number(cupom.id),
        nome: String(cupom.nome || ""),
        percentual: Number(cupom.percentual || 0),
        createdAt: String(cupom.createdAt || ""),
      })))
    } catch (error: any) {
      toast.error("Não foi possível carregar os cupons", { description: error?.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void carregarCupons()
  }, [])

  const filtrados = useMemo(() => {
    const termo = busca.trim().toUpperCase()
    return cupons.filter((cupom) => !termo || cupom.nome.includes(termo) || String(cupom.percentual).includes(termo))
  }, [cupons, busca])
  const { sort, onSort, sortedRows } = useTableSort(filtrados)

  function abrirNovo() {
    setEditing(null)
    setForm({ nome: "", percentual: "" })
    setDialogOpen(true)
  }

  function abrirEdicao(cupom: Cupom) {
    setEditing(cupom)
    setForm({ nome: cupom.nome, percentual: String(cupom.percentual) })
    setDialogOpen(true)
  }

  async function salvarCupom() {
    try {
      const response = await apiFetch(`${API_URL}/cupons${editing ? `/${editing.id}` : ""}`, {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify({ nome: form.nome, percentual: Number(form.percentual) }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.message || "Erro ao salvar cupom")
      toast.success(editing ? "Cupom atualizado" : "Cupom criado")
      setDialogOpen(false)
      await carregarCupons()
    } catch (error: any) {
      toast.error("Não foi possível salvar o cupom", { description: error?.message })
    }
  }

  async function excluirCupom(cupom: Cupom) {
    if (!confirm(`Excluir o cupom ${cupom.nome}?`)) return
    try {
      const response = await apiFetch(`${API_URL}/cupons/${cupom.id}`, { method: "DELETE" })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.message || "Erro ao excluir cupom")
      toast.success("Cupom excluído")
      await carregarCupons()
    } catch (error: any) {
      toast.error("Não foi possível excluir o cupom", { description: error?.message })
    }
  }

  async function carregarRelatorio() {
    try {
      setLoadingRelatorio(true)
      const params = new URLSearchParams()
      if (dataInicio) params.set("dataInicio", dataInicio)
      if (dataFim) params.set("dataFim", dataFim)
      const response = await apiFetch(`${API_URL}/cupons/relatorio?${params.toString()}`)
      const data = await response.json().catch(() => [])
      if (!response.ok) throw new Error(data?.message || "Erro ao carregar relatório")
      setRelatorio((data || []).map((linha: any) => ({
        cupomId: linha.cupomId ?? null,
        nome: String(linha.nome || ""),
        percentual: Number(linha.percentual || 0),
        usos: Number(linha.usos || 0),
        descontoTotal: Number(linha.descontoTotal || 0),
        valorPedidos: Number(linha.valorPedidos || 0),
      })))
    } catch (error: any) {
      toast.error("Não foi possível carregar o relatório", { description: error?.message })
    } finally {
      setLoadingRelatorio(false)
    }
  }

  function abrirRelatorio() {
    setRelatorioOpen(true)
    void carregarRelatorio()
  }

  return (
    <div className="container mx-auto p-6">
      <Header title="Cupons" subtitle="Cadastre cupons percentuais para aplicar nos agendamentos" />

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar cupom..." className="pl-8" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={abrirRelatorio}><BarChart3 className="mr-2 h-4 w-4" /> Relatório por data</Button>
          <Button onClick={abrirNovo}><Plus className="mr-2 h-4 w-4" /> Novo cupom</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Cupons cadastrados</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead label="Nome" field="nome" sort={sort} onSort={onSort} />
                <SortableHead label="Percentual" field="percentual" sort={sort} onSort={onSort} />
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRows.map((cupom) => (
                <TableRow key={cupom.id}>
                  <TableCell className="font-semibold">{cupom.nome}</TableCell>
                  <TableCell>{cupom.percentual}%</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => abrirEdicao(cupom)} title="Editar cupom"><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-red-600" onClick={() => excluirCupom(cupom)} title="Excluir cupom"><Trash className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && sortedRows.length === 0 && <TableRow><TableCell colSpan={3} className="py-6 text-center text-muted-foreground">Nenhum cupom encontrado</TableCell></TableRow>}
              {loading && <TableRow><TableCell colSpan={3} className="py-6 text-center text-muted-foreground">Carregando cupons...</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar cupom" : "Novo cupom"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cupomNome">Nome</Label>
              <Input id="cupomNome" value={form.nome} onChange={(e) => setForm((atual) => ({ ...atual, nome: e.target.value.toUpperCase() }))} placeholder="Ex.: CLIENTE10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cupomPercentual">Percentual de desconto</Label>
              <Input id="cupomPercentual" type="number" min="0" max="100" step="0.01" value={form.percentual} onChange={(e) => setForm((atual) => ({ ...atual, percentual: e.target.value }))} placeholder="Ex.: 10" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={salvarCupom}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={relatorioOpen} onOpenChange={setRelatorioOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader><DialogTitle>Relatório de cupons</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-[160px_160px_auto]">
            <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
            <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
            <Button onClick={carregarRelatorio} disabled={loadingRelatorio}>Atualizar relatório</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cupom</TableHead>
                <TableHead>%</TableHead>
                <TableHead>Usos</TableHead>
                <TableHead>Desconto total</TableHead>
                <TableHead>Valor dos pedidos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {relatorio.map((linha) => (
                <TableRow key={`${linha.cupomId}-${linha.nome}`}>
                  <TableCell className="font-semibold">{linha.nome}</TableCell>
                  <TableCell>{linha.percentual}%</TableCell>
                  <TableCell>{linha.usos}</TableCell>
                  <TableCell>R$ {moeda(linha.descontoTotal)}</TableCell>
                  <TableCell>R$ {moeda(linha.valorPedidos)}</TableCell>
                </TableRow>
              ))}
              {!loadingRelatorio && relatorio.length === 0 && <TableRow><TableCell colSpan={5} className="py-6 text-center text-muted-foreground">Nenhum uso de cupom nesse período</TableCell></TableRow>}
              {loadingRelatorio && <TableRow><TableCell colSpan={5} className="py-6 text-center text-muted-foreground">Carregando relatório...</TableCell></TableRow>}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  )
}
