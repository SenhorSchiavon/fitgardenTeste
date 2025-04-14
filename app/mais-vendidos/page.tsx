"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Header } from "@/components/header"

type VendaItem = {
  nome: string
  quantidade: number
  valor: number
}

type VendaCliente = {
  nome: string
  pedidos: number
  valor: number
}

export default function MaisVendidos() {
  const [periodo, setPeriodo] = useState("mes")

  const [dadosItens] = useState<VendaItem[]>([
    { nome: "Fit Tradicional", quantidade: 120, valor: 2388 },
    { nome: "Low Carb Especial", quantidade: 85, valor: 1870 },
    { nome: "Vegetariano Mix", quantidade: 65, valor: 1235 },
    { nome: "Proteico Plus", quantidade: 50, valor: 1250 },
    { nome: "Sopa Detox", quantidade: 40, valor: 720 },
  ])

  const [dadosClientes] = useState<VendaCliente[]>([
    { nome: "João Silva", pedidos: 15, valor: 750 },
    { nome: "Maria Oliveira", pedidos: 12, valor: 600 },
    { nome: "Ana Santos", pedidos: 10, valor: 500 },
    { nome: "Carlos Pereira", pedidos: 8, valor: 400 },
    { nome: "Roberto Almeida", pedidos: 7, valor: 350 },
  ])

  return (
    <div className="container mx-auto p-6">
      <Header title="Mais Vendidos" subtitle="Análise dos produtos mais vendidos e clientes mais ativos" />

      <div className="flex items-center justify-end mb-6">
        <div className="w-[200px]">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semana">Última Semana</SelectItem>
              <SelectItem value="mes">Último Mês</SelectItem>
              <SelectItem value="trimestre">Último Trimestre</SelectItem>
              <SelectItem value="ano">Último Ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="produtos">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="produtos">Produtos Mais Vendidos</TabsTrigger>
          <TabsTrigger value="clientes">Clientes Mais Ativos</TabsTrigger>
        </TabsList>
        <TabsContent value="produtos">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Produtos por Quantidade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dadosItens}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nome" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="quantidade" fill="#8884d8" name="Quantidade" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Produtos por Valor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dadosItens}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nome" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="valor" fill="#82ca9d" name="Valor (R$)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="clientes">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Clientes por Número de Pedidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dadosClientes}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nome" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="pedidos" fill="#8884d8" name="Número de Pedidos" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Clientes por Valor Gasto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dadosClientes}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nome" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="valor" fill="#82ca9d" name="Valor Gasto (R$)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
