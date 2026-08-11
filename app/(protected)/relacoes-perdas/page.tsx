"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/hooks/api";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api";

export default function RelacoesPerdasPage() {
  const [multiplicador, setMultiplicador] = useState("1");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const response = await apiFetch(`${API_URL}/relacoes-perdas`);
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "Erro ao carregar a perda");
        setMultiplicador(String(Number(data.multiplicador ?? 1)));
      } catch (error: any) {
        toast.error("Não foi possível carregar a relação de perdas", { description: error?.message });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const salvar = async () => {
    const valor = Number(multiplicador);
    if (!Number.isFinite(valor) || valor < 0) return toast.error("Informe um valor maior ou igual a zero");
    try {
      setSaving(true);
      const response = await apiFetch(`${API_URL}/relacoes-perdas`, {
        method: "PUT",
        body: JSON.stringify({ multiplicador: valor }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Erro ao salvar a perda");
      setMultiplicador(String(Number(data.multiplicador)));
      toast.success("Relação de perdas salva");
    } catch (error: any) {
      toast.error("Não foi possível salvar", { description: error?.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto space-y-6 p-6">
      <Header title="Relações de Perdas" subtitle="Configure o multiplicador aplicado aos pesos do relatório de preparos" />
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Perda</CardTitle>
          <CardDescription>Todos os quilos preparados e ingredientes crus serão multiplicados por este valor.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="multiplicador-perda">Multiplicador</Label>
            <Input
              id="multiplicador-perda"
              type="number"
              min="0"
              step="0.001"
              value={multiplicador}
              onChange={(event) => setMultiplicador(event.target.value)}
              disabled={loading || saving}
            />
            <p className="text-sm text-muted-foreground">Exemplo: com valor 10, 30,5 kg será exibido como 305 kg.</p>
          </div>
          <Button onClick={salvar} disabled={loading || saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
