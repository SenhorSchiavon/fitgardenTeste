"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Search } from "lucide-react"
import { Header } from "@/components/header"

type Voucher = {
  id: string
  numero: string
  data: string
  baixado: boolean
}

export default function Vouchers() {
  const [vouchers, setVouchers] = useState<Voucher[]>([
    { id: "V001", numero: "2123456", data: "2023-05-10", baixado: true },
    { id: "V002", numero: "2234567", data: "2023-05-15", baixado: true },
    { id: "V003", numero: "2345678", data: "2023-05-20", baixado: false },
    { id: "V004", numero: "2456789", data: "2023-05-25", baixado: false },
    { id: "V005", numero: "2567890", data: "2023-05-30", baixado: false },
  ])

  const [novoVoucher, setNovoVoucher] = useState<Partial<Voucher>>({
    numero: "",
    data: new Date().toISOString().split("T")[0],
    baixado: false,
  })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const handleSave = () => {
    if (novoVoucher.numero) {
      const newId = `V${String(vouchers.length + 1).padStart(3, "0")}`
      setVouchers([
        ...vouchers,
        {
          id: newId,
          numero: novoVoucher.numero,
          data: novoVoucher.data || new Date().toISOString().split("T")[0],
          baixado: novoVoucher.baixado || false,
        },
      ])
      setNovoVoucher({
        numero: "",
        data: new Date().toISOString().split("T")[0],
        baixado: false,
      })
      setDialogOpen(false)
    }
  }

  const handleToggleBaixado = (id: string) => {
    setVouchers(vouchers.map((voucher) => (voucher.id === id ? { ...voucher, baixado: !voucher.baixado } : voucher)))
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
                <TableHead>Número</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Baixado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVouchers.map((voucher) => (
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
              {filteredVouchers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    Nenhum voucher encontrado
                  </TableCell>
                </TableRow>
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
