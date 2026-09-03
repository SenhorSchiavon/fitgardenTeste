"use client";

import { useState } from "react";
import { CalendarOff, Plus, Save, Trash2 } from "lucide-react";
import { Header } from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FeriadoOperacional, useFeriadosOperacionais } from "@/hooks/useFeriadosOperacionais";

function formatarData(data: string) {
  const [ano, mes, dia] = data.split("-").map(Number);
  if (!ano || !mes || !dia) return data;
  return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function ordenarFeriados(a: FeriadoOperacional, b: FeriadoOperacional) {
  return a.data.slice(5).localeCompare(b.data.slice(5)) || a.data.localeCompare(b.data);
}

export default function FeriadosOperacionaisPage() {
  const { feriados, loading, saving, salvarFeriados } = useFeriadosOperacionais();
  const [data, setData] = useState("");
  const [descricao, setDescricao] = useState("");
  const [recorrenteAnual, setRecorrenteAnual] = useState(true);
  const [listaLocal, setListaLocal] = useState<FeriadoOperacional[] | null>(null);

  const lista = listaLocal ?? feriados;

  const adicionar = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      toast.error("Informe uma data válida");
      return;
    }
    const novo: FeriadoOperacional = {
      data,
      descricao: descricao.trim() || undefined,
      recorrenteAnual,
    };
    const chaveNova = recorrenteAnual ? data.slice(5) : data;
    const semDuplicado = lista.filter((item) => (item.recorrenteAnual === false ? item.data : item.data.slice(5)) !== chaveNova);
    setListaLocal([...semDuplicado, novo].sort(ordenarFeriados));
    setData("");
    setDescricao("");
    setRecorrenteAnual(true);
  };

  const remover = (feriado: FeriadoOperacional) => {
    const chave = feriado.recorrenteAnual === false ? feriado.data : feriado.data.slice(5);
    setListaLocal(lista.filter((item) => (item.recorrenteAnual === false ? item.data : item.data.slice(5)) !== chave));
  };

  const salvar = async () => {
    await salvarFeriados(lista);
    setListaLocal(null);
  };

  return (
    <div className="container mx-auto space-y-6 p-6">
      <Header title="Feriados Operacionais" subtitle="Configure dias sem atendimento para o agendamento pular automaticamente" />

      <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
        <Card className="h-fit border-gray-200 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <CalendarOff className="h-5 w-5 text-amber-600" />
              Novo feriado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="data-feriado">Data</Label>
              <Input
                id="data-feriado"
                type="date"
                value={data}
                onChange={(event) => setData(event.target.value)}
                disabled={loading || saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao-feriado">Nome</Label>
              <Input
                id="descricao-feriado"
                value={descricao}
                onChange={(event) => setDescricao(event.target.value)}
                placeholder="Ex.: Independência do Brasil"
                disabled={loading || saving}
              />
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded-md border bg-gray-50 p-3 text-sm font-medium text-gray-700">
              <Checkbox checked={recorrenteAnual} onCheckedChange={(checked) => setRecorrenteAnual(Boolean(checked))} />
              Repetir todo ano
            </label>
            <Button onClick={adicionar} disabled={loading || saving} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar à lista
            </Button>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white">
          <CardHeader className="border-b">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Feriados cadastrados</CardTitle>
              <Button onClick={salvar} disabled={loading || saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <p className="p-6 text-sm text-gray-500">Carregando feriados...</p>
            ) : lista.length ? (
              <div className="divide-y">
                {lista.map((feriado) => (
                  <div key={`${feriado.data}-${feriado.recorrenteAnual}`} className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-gray-900">{formatarData(feriado.data)}</span>
                        {feriado.recorrenteAnual !== false ? <Badge variant="secondary">Todo ano</Badge> : <Badge variant="outline">Só essa data</Badge>}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{feriado.descricao || "Feriado operacional"}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => remover(feriado)} disabled={saving}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center text-sm text-gray-500">
                Nenhum feriado operacional cadastrado.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
