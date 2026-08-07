"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Copy, Download, Plus, Search } from "lucide-react"
import { Header } from "@/components/header"
import { useTableSort } from "@/hooks/useTableSort"
import { SortableHead } from "@/components/ui/sorttable"
import { apiFetch } from "@/hooks/api"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api"

type Voucher = {
  id: string
  numero: string
  data: string
  baixado: boolean
}

export default function Vouchers() {
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)

  const [novoVoucher, setNovoVoucher] = useState<Partial<Voucher>>({
    numero: "",
    data: new Date().toISOString().split("T")[0],
    baixado: false,
  })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFiltro, setStatusFiltro] = useState<"TODOS" | "DISPONIVEIS" | "BAIXADOS">("TODOS")
  const [dataInicial, setDataInicial] = useState("")
  const [dataFinal, setDataFinal] = useState("")

  const carregarVouchers = async () => {
    try {
      setLoading(true)
      const response = await apiFetch(`${API_URL}/vouchers`)
      const data = await response.json().catch(() => [])
      if (!response.ok) throw new Error(data?.message || "Erro ao carregar vouchers")
      setVouchers((data || []).map((voucher: any) => ({
        id: String(voucher.id),
        numero: String(voucher.codigo),
        data: String(voucher.data),
        baixado: !!voucher.usado,
      })))
    } catch (error: any) {
      toast.error("Não foi possível carregar os vouchers", { description: error?.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void carregarVouchers()
  }, [])

  const handleSave = async () => {
    if (novoVoucher.numero) {
      try {
        const response = await apiFetch(`${API_URL}/vouchers`, {
          method: "POST",
          body: JSON.stringify({ codigo: novoVoucher.numero, data: novoVoucher.data, usado: !!novoVoucher.baixado }),
        })
        const data = await response.json().catch(() => null)
        if (!response.ok) throw new Error(data?.message || "Erro ao salvar voucher")
        await carregarVouchers()
        setNovoVoucher({ numero: "", data: new Date().toISOString().split("T")[0], baixado: false })
        setDialogOpen(false)
      } catch (error: any) {
        toast.error("Não foi possível salvar o voucher", { description: error?.message })
      }
    }
  }

  const handleToggleBaixado = async (id: string) => {
    const voucher = vouchers.find((item) => item.id === id)
    if (!voucher) return
    try {
      const response = await apiFetch(`${API_URL}/vouchers/${id}/usado`, {
        method: "PATCH",
        body: JSON.stringify({ usado: !voucher.baixado }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.message || "Erro ao atualizar voucher")
      setVouchers((atuais) => atuais.map((item) => item.id === id ? { ...item, baixado: !!data.usado } : item))
    } catch (error: any) {
      toast.error("Não foi possível atualizar o voucher", { description: error?.message })
    }
  }

  const handleNew = () => {
    setNovoVoucher({
      numero: "",
      data: new Date().toISOString().split("T")[0],
      baixado: false,
    })
    setDialogOpen(true)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR")
  }

  const filteredVouchers = useMemo(() => vouchers.filter((voucher) => {
    const correspondeBusca = voucher.numero.includes(searchTerm.trim()) || formatDate(voucher.data).includes(searchTerm.trim())
    const correspondeStatus = statusFiltro === "TODOS" || (statusFiltro === "BAIXADOS" ? voucher.baixado : !voucher.baixado)
    const dataVoucher = String(voucher.data).slice(0, 10)
    const correspondeInicio = !dataInicial || dataVoucher >= dataInicial
    const correspondeFim = !dataFinal || dataVoucher <= dataFinal
    return correspondeBusca && correspondeStatus && correspondeInicio && correspondeFim
  }), [vouchers, searchTerm, statusFiltro, dataInicial, dataFinal])

  const textoExportacao = useMemo(
    () => Array.from(new Set(filteredVouchers.map((voucher) => voucher.numero.trim()).filter(Boolean))).join(","),
    [filteredVouchers],
  )

  const copiarCodigos = async () => {
    if (!textoExportacao) return toast.error("Nenhum voucher para copiar")
    await navigator.clipboard.writeText(textoExportacao)
    toast.success(`${filteredVouchers.length} voucher(es) copiado(s)`, { description: "Códigos separados por vírgula, sem espaços." })
  }

  const baixarTxt = () => {
    if (!textoExportacao) return toast.error("Nenhum voucher para exportar")
    const url = URL.createObjectURL(new Blob([textoExportacao], { type: "text/plain;charset=utf-8" }))
    const link = document.createElement("a")
    link.href = url
    link.download = `vouchers-${new Date().toISOString().slice(0, 10)}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  const { sort, onSort, sortedRows } = useTableSort(filteredVouchers)

  return (
    <div className="container mx-auto p-6">
      <Header title="Vouchers" subtitle="Gerencie os vouchers do sistema" />

      <div className="mb-6 grid gap-3 lg:grid-cols-[minmax(240px,1fr)_180px_160px_160px_auto]">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número ou data..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFiltro} onValueChange={(value: typeof statusFiltro) => setStatusFiltro(value)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos os vouchers</SelectItem>
            <SelectItem value="DISPONIVEIS">Não baixados</SelectItem>
            <SelectItem value="BAIXADOS">Baixados</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" value={dataInicial} onChange={(event) => setDataInicial(event.target.value)} title="Data inicial" />
        <Input type="date" value={dataFinal} onChange={(event) => setDataFinal(event.target.value)} title="Data final" />
        <Button onClick={handleNew} className="whitespace-nowrap">
          <Plus className="mr-2 h-4 w-4" /> Novo Voucher
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={copiarCodigos} disabled={!filteredVouchers.length}>
          <Copy className="mr-2 h-4 w-4" /> Copiar códigos
        </Button>
        <Button variant="outline" onClick={baixarTxt} disabled={!filteredVouchers.length}>
          <Download className="mr-2 h-4 w-4" /> Baixar TXT
        </Button>
        <span className="text-sm text-muted-foreground">{filteredVouchers.length} voucher(es) no filtro</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vouchers Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead label="Número" field="numero" sort={sort} onSort={onSort} />
                <SortableHead label="Data" field="data" sort={sort} onSort={onSort} />
                <SortableHead label="Baixado" field="baixado" sort={sort} onSort={onSort} />
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRows.map((voucher) => (
                <TableRow key={voucher.id}>
                  <TableCell>{voucher.numero}</TableCell>
                  <TableCell>{formatDate(voucher.data)}</TableCell>
                  <TableCell>
                    <Checkbox checked={voucher.baixado} onCheckedChange={() => handleToggleBaixado(voucher.id)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleToggleBaixado(voucher.id)}>
                      {voucher.baixado ? "Marcar como Não Baixado" : "Marcar como Baixado"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && filteredVouchers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    Nenhum voucher encontrado
                  </TableCell>
                </TableRow>
              )}
              {loading && (
                <TableRow><TableCell colSpan={4} className="text-center py-4">Carregando vouchers...</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Voucher</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="numero">Número do Voucher</Label>
              <Input
                id="numero"
                value={novoVoucher.numero || ""}
                onChange={(e) => setNovoVoucher({ ...novoVoucher, numero: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                value={novoVoucher.data || ""}
                onChange={(e) => setNovoVoucher({ ...novoVoucher, data: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="baixado"
                checked={novoVoucher.baixado}
                onCheckedChange={(checked) => setNovoVoucher({ ...novoVoucher, baixado: !!checked })}
              />
              <Label htmlFor="baixado">Já Baixado</Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
