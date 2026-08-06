"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Search } from "lucide-react"
import { Header } from "@/components/header"
import { useTableSort } from "@/hooks/useTableSort"
import { SortableHead } from "@/components/ui/sorttable"
import { apiFetch } from "@/hooks/api"
import { toast } from "sonner"

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

  const filteredVouchers = vouchers.filter(
    (voucher) => voucher.numero.includes(searchTerm) || formatDate(voucher.data).includes(searchTerm),
  )

  const { sort, onSort, sortedRows } = useTableSort(filteredVouchers)

  return (
    <div className="container mx-auto p-6">
      <Header title="Vouchers" subtitle="Gerencie os vouchers do sistema" />

      <div className="flex items-center justify-between mb-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número ou data..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" /> Novo Voucher
        </Button>
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
