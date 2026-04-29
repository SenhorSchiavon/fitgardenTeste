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
import { useTableSort } from "@/hooks/useTableSort";
import { SortableHead } from "@/components/ui/sorttable";

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
  const regrasIngredientes = regras.filter((r) => r.tipo === "QUANTIDADE_INGREDIENTES").sort((a, b) => a.limite - b.limite);
  const regrasVolume = regras.filter((r) => r.tipo === "VOLUME_TOTAL").sort((a, b) => a.limite - b.limite);
  const regrasSalgados = regras.filter((r) => r.tipo === "VOLUME_SALGADOS").sort((a, b) => a.limite - b.limite);

  const { sort: sortP, onSort: onSortP, sortedRows: rowsP } = useTableSort(regrasProteina, { initialKey: "limite", initialDirection: "asc" });
  const { sort: sortT, onSort: onSortT, sortedRows: rowsT } = useTableSort(regrasTotal, { initialKey: "limite", initialDirection: "asc" });
  const { sort: sortI, onSort: onSortI, sortedRows: rowsI } = useTableSort(regrasIngredientes, { initialKey: "limite", initialDirection: "asc" });
  const { sort: sortV, onSort: onSortV, sortedRows: rowsV } = useTableSort(regrasVolume, { initialKey: "limite", initialDirection: "asc" });
  const { sort: sortS, onSort: onSortS, sortedRows: rowsS } = useTableSort(regrasSalgados, { initialKey: "limite", initialDirection: "asc" });

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
    <div className="p-6 md:p-10 space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Regras de Preço e Descontos</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie as faixas de preço personalizadas, ajustes por ingredientes e descontos progressivos por volume.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <div>
              <CardTitle>Tabela de Proteína</CardTitle>
              <CardDescription>Baseado exclusivamente no peso da proteína.</CardDescription>
            </div>
            <Button size="sm" onClick={() => handleOpenModal("PROTEINA")}>
              <Plus className="mr-2 h-4 w-4" /> Nova Regra
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead label="Até (Gramas)" field="limite" sort={sortP} onSort={onSortP} />
                  <SortableHead label="Valor" field="preco" sort={sortP} onSort={onSortP} />
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rowsP.map((r) => (
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
              <CardDescription>Base para marmitas grandes (peso total).</CardDescription>
            </div>
            <Button size="sm" onClick={() => handleOpenModal("PESO_TOTAL")}>
              <Plus className="mr-2 h-4 w-4" /> Nova Regra
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead label="Até (Gramas)" field="limite" sort={sortT} onSort={onSortT} />
                  <SortableHead label="Valor" field="preco" sort={sortT} onSort={onSortT} />
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rowsT.map((r) => (
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <div>
              <CardTitle>Ajuste por Qtd. Ingredientes</CardTitle>
              <CardDescription>Acréscimo ou desconto por tipos de alimento.</CardDescription>
            </div>
            <Button size="sm" onClick={() => handleOpenModal("QUANTIDADE_INGREDIENTES")}>
              <Plus className="mr-2 h-4 w-4" /> Nova Regra
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead label="Qtd. Ingredientes" field="limite" sort={sortI} onSort={onSortI} />
                  <SortableHead label="Ajuste (R$)" field="preco" sort={sortI} onSort={onSortI} />
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rowsI.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.limite} ingrediente(s)</TableCell>
                    <TableCell className={r.preco < 0 ? "text-green-600 font-bold" : r.preco > 0 ? "text-red-600 font-bold" : ""}>
                      {r.preco > 0 ? "+" : ""} R$ {Number(r.preco).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenModal("QUANTIDADE_INGREDIENTES", r)}>
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
              <CardTitle>Desconto por Volume Total</CardTitle>
              <CardDescription>Desconto em % para pedidos com muitas marmitas.</CardDescription>
            </div>
            <Button size="sm" onClick={() => handleOpenModal("VOLUME_TOTAL")}>
              <Plus className="mr-2 h-4 w-4" /> Nova Regra
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead label="A partir de (Marmitas)" field="limite" sort={sortV} onSort={onSortV} />
                  <SortableHead label="Desconto (%)" field="preco" sort={sortV} onSort={onSortV} />
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rowsV.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.limite} marmitas</TableCell>
                    <TableCell className="font-bold text-green-600">{r.preco}% de desconto</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenModal("VOLUME_TOTAL", r)}>
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
              <CardTitle>Salgados</CardTitle>
              <CardDescription>Preço unitário por quantidade, contando apenas salgados.</CardDescription>
            </div>
            <Button size="sm" onClick={() => handleOpenModal("VOLUME_SALGADOS")}>
              <Plus className="mr-2 h-4 w-4" /> Nova Regra
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead label="A partir de (Salgados)" field="limite" sort={sortS} onSort={onSortS} />
                  <SortableHead label="Preço Unitário" field="preco" sort={sortS} onSort={onSortS} />
                  <TableHead className="text-right">AÃ§Ãµes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rowsS.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.limite} salgados</TableCell>
                    <TableCell className="font-bold text-green-700">R$ {Number(r.preco).toFixed(2)} / un.</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenModal("VOLUME_SALGADOS", r)}>
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
              {formData.id ? "Editar Regra" : "Nova Regra"}
              {formData.tipo === "PROTEINA" && " (Proteína)"}
              {formData.tipo === "PESO_TOTAL" && " (Peso Total)"}
              {formData.tipo === "QUANTIDADE_INGREDIENTES" && " (Ajuste Ingredientes)"}
              {formData.tipo === "VOLUME_TOTAL" && " (Desconto Volume)"}
              {formData.tipo === "VOLUME_SALGADOS" && " (Salgados)"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>
                {formData.tipo === "PROTEINA" || formData.tipo === "PESO_TOTAL"
                  ? "Gramagem Máxima (Até X gramas)"
                  : formData.tipo === "QUANTIDADE_INGREDIENTES"
                    ? "Quantidade de Ingredientes"
                    : formData.tipo === "VOLUME_SALGADOS"
                      ? "Quantidade Mínima de Salgados"
                      : "Quantidade Mínima de Marmitas"}
              </Label>
              <Input
                type="number"
                placeholder="Ex: 200, 20, 2..."
                value={formData.limite}
                onChange={(e) => setFormData((p) => ({ ...p, limite: e.target.value === "" ? "" : Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label>
                {formData.tipo === "VOLUME_TOTAL"
                  ? "Percentual de Desconto (%)"
                  : formData.tipo === "VOLUME_SALGADOS"
                    ? "Preço Unitário do Salgado (R$)"
                    : "Valor de Ajuste (R$)"}
              </Label>
              <Input
                type="number"
                placeholder={formData.tipo === "VOLUME_TOTAL" ? "Ex: 5, 7, 10" : formData.tipo === "VOLUME_SALGADOS" ? "Ex: 7.50" : "Ex: 1.00, -0.50"}
                step="0.01"
                value={formData.preco}
                onChange={(e) => setFormData((p) => ({ ...p, preco: e.target.value === "" ? "" : Number(e.target.value) }))}
              />
              {formData.tipo === "QUANTIDADE_INGREDIENTES" && (
                <p className="text-[10px] text-muted-foreground italic">Valores negativos dão desconto, positivos dão acréscimo.</p>
              )}
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
