"use client";

import { useState } from "react";
import { Plus, Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useRegrasPersonalizadas, RegraPrecoTipo, RegraPrecoPersonalizada } from "@/hooks/useRegrasPersonalizadas";

export default function RegrasPersonalizadaPage() {
  const { regras, loading, saving, criarRegra, atualizarRegra, deletarRegra } = useRegrasPersonalizadas();

  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<{ id?: number; tipo: RegraPrecoTipo; limite: number | ""; preco: number | "" }>({
    tipo: "PROTEINA",
    limite: "",
    preco: "",
  });

  const regrasProteina = regras.filter((r) => r.tipo === "PROTEINA").sort((a, b) => a.limite - b.limite);
  const regrasTotal = regras.filter((r) => r.tipo === "PESO_TOTAL").sort((a, b) => a.limite - b.limite);

  function handleOpenModal(tipo: RegraPrecoTipo, item?: RegraPrecoPersonalizada) {
    if (item) {
      setFormData({
        id: item.id,
        tipo: item.tipo,
        limite: item.limite,
        preco: item.preco,
      });
    } else {
      setFormData({
        id: undefined,
        tipo,
        limite: "",
        preco: "",
      });
    }
    setModalOpen(true);
  }

  async function handleSave() {
    if (formData.limite === "" || formData.preco === "") return;

    try {
      if (formData.id) {
        await atualizarRegra(formData.id, {
          tipo: formData.tipo,
          limite: Number(formData.limite),
          preco: Number(formData.preco),
        });
      } else {
        await criarRegra({
          tipo: formData.tipo,
          limite: Number(formData.limite),
          preco: Number(formData.preco),
        });
      }
      setModalOpen(false);
    } catch (error) {
      // toast in hook
    }
  }

  if (loading) return <div className="p-8">Carregando tabelas de preço...</div>;

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Regras de Preço (Personalizadas)</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie as faixas de preço por peso de proteína e peso total das marmitas. A de maior valor será sempre aplicada.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <div>
              <CardTitle>Tabela de Proteína</CardTitle>
              <CardDescription>Cobrança baseada exclusivamente no peso da proteína.</CardDescription>
            </div>
            <Button size="sm" onClick={() => handleOpenModal("PROTEINA")}>
              <Plus className="mr-2 h-4 w-4" /> Nova Regra
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Até (Gramas)</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regrasProteina.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">Nenhuma regra cadastrada.</TableCell>
                  </TableRow>
                )}
                {regrasProteina.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>Até {r.limite}g</TableCell>
                    <TableCell>R$ {Number(r.preco).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenModal("PROTEINA", r)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deletarRegra(r.id)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <div>
              <CardTitle>Tabela de Peso Total</CardTitle>
              <CardDescription>Faixa de base de preços para marmitas grandes.</CardDescription>
            </div>
            <Button size="sm" onClick={() => handleOpenModal("PESO_TOTAL")}>
              <Plus className="mr-2 h-4 w-4" /> Nova Regra
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Até (Gramas)</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regrasTotal.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">Nenhuma regra cadastrada.</TableCell>
                  </TableRow>
                )}
                {regrasTotal.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>Até {r.limite}g</TableCell>
                    <TableCell>R$ {Number(r.preco).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenModal("PESO_TOTAL", r)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deletarRegra(r.id)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {formData.id ? "Editar Teto de Preço" : "Novo Teto de Preço"}
              {formData.tipo === "PROTEINA" ? " (Proteína)" : " (Peso Total)"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Gramagem Máxima (Até x gramas)</Label>
              <Input
                type="number"
                placeholder="Ex: 200, 300..."
                value={formData.limite}
                onChange={(e) => setFormData((p) => ({ ...p, limite: e.target.value === "" ? "" : Number(e.target.value) }))}
              />
              <p className="text-xs text-muted-foreground">Utilize 9999 para criar uma regra geral sem teto máximo.</p>
            </div>
            <div className="space-y-2">
              <Label>Preço da Faixa</Label>
              <Input
                type="number"
                placeholder="Ex: 11.70"
                step="0.01"
                value={formData.preco}
                onChange={(e) => setFormData((p) => ({ ...p, preco: e.target.value === "" ? "" : Number(e.target.value) }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || formData.limite === "" || formData.preco === ""}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
