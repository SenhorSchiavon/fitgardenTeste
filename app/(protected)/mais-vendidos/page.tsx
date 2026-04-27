"use client"

import { useEffect, useState } from "react"
import { useRelatorioVendas } from "@/hooks/useRelatorioVendas"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts"
import { Header } from "@/components/header"
import { 
  TrendingUp, Users, ShoppingBag, CreditCard, 
  Truck, ArrowUpRight, ArrowDownRight, Activity,
  Package, LayoutDashboard, Search
} from "lucide-react"
import { cn } from "@/lib/utils"

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function MaisVendidos() {
  const [periodo, setPeriodo] = useState("mes")
  const { data, loading, getRelatorioVendas } = useRelatorioVendas()

  useEffect(() => {
    getRelatorioVendas(periodo)
  }, [periodo, getRelatorioVendas])

  const dadosItens = data?.itens || []
  const dadosClientes = data?.clientes || []
  const dadosEntrega = data?.tiposEntrega || []
  const dadosPagamento = data?.formasPagamento || []

  const totalVendas = dadosItens.reduce((acc, it) => acc + it.valor, 0)
  const totalPedidos = dadosClientes.reduce((acc, cl) => acc + cl.pedidos, 0)
  const ticketMedio = totalPedidos > 0 ? totalVendas / totalPedidos : 0

  const fmtCurrency = (v: number) => 
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)

  return (
    <div className="space-y-8 pb-10">
      <Header 
        title="Inteligência de Vendas" 
        subtitle="Análise profunda de performance, comportamento de clientes e logística" 
      />

      {/* Seletor de Período Premium */}
      <div className="flex items-center justify-between bg-white/50 backdrop-blur-md p-4 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Activity className="h-4 w-4 text-emerald-600" />
          </div>
          <span className="text-sm font-bold text-slate-700 tracking-tight">Período de Análise</span>
        </div>
        <div className="w-[200px]">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="bg-white border-slate-200 rounded-xl shadow-sm focus:ring-emerald-500/20">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 shadow-xl">
              <SelectItem value="semana">Última Semana</SelectItem>
              <SelectItem value="mes">Último Mês</SelectItem>
              <SelectItem value="trimestre">Último Trimestre</SelectItem>
              <SelectItem value="ano">Último Ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cards de Resumo Estilo Dashboard Moderno */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            label: "Receita no Período", 
            value: fmtCurrency(totalVendas), 
            icon: TrendingUp, 
            color: "text-emerald-600", 
            bg: "bg-emerald-50",
            trend: "+12%",
            trendUp: true 
          },
          { 
            label: "Pedidos Realizados", 
            value: totalPedidos, 
            icon: ShoppingBag, 
            color: "text-blue-600", 
            bg: "bg-blue-50",
            trend: "+5%",
            trendUp: true 
          },
          { 
            label: "Ticket Médio", 
            value: fmtCurrency(ticketMedio), 
            icon: CreditCard, 
            color: "text-amber-600", 
            bg: "bg-amber-50",
            trend: "-2%",
            trendUp: false 
          },
          { 
            label: "Clientes Ativos", 
            value: dadosClientes.length, 
            icon: Users, 
            color: "text-purple-600", 
            bg: "bg-purple-50",
            trend: "+8%",
            trendUp: true 
          },
        ].map((card, i) => (
          <Card key={i} className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300", card.bg)}>
                  <card.icon className={cn("h-6 w-6", card.color)} />
                </div>
                <div className={cn("flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full", card.trendUp ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")}>
                  {card.trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {card.trend}
                </div>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">{card.label}</p>
                <h3 className="text-2xl font-serif font-bold text-slate-800">{card.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="h-[400px] flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          <p className="text-slate-500 font-serif animate-pulse">Cruzando dados de vendas...</p>
        </div>
      ) : (
        <Tabs defaultValue="produtos" className="space-y-6">
          <div className="flex items-center justify-center">
            <TabsList className="bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <TabsTrigger value="produtos" className="rounded-xl px-8 py-2.5 data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm transition-all font-bold text-xs uppercase tracking-widest">
                Produtos & Vendas
              </TabsTrigger>
              <TabsTrigger value="clientes" className="rounded-xl px-8 py-2.5 data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm transition-all font-bold text-xs uppercase tracking-widest">
                Ranking de Clientes
              </TabsTrigger>
              <TabsTrigger value="logistica" className="rounded-xl px-8 py-2.5 data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm transition-all font-bold text-xs uppercase tracking-widest">
                Logística & Pagamentos
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="produtos" className="space-y-6 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="font-serif text-xl text-slate-800">Principais Produtos</CardTitle>
                      <CardDescription>Volume de vendas por unidade</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-8">
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dadosItens} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="nome" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                          cursor={{ fill: '#f8fafc' }}
                        />
                        <Bar dataKey="quantidade" fill="#10b981" radius={[8, 8, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="font-serif text-xl text-slate-800">Faturamento por Produto</CardTitle>
                      <CardDescription>Receita bruta gerada</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-8">
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dadosItens} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="nome" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                          formatter={(value: number) => fmtCurrency(value)}
                          cursor={{ fill: '#f8fafc' }}
                        />
                        <Bar dataKey="valor" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="clientes" className="space-y-6 outline-none">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="font-serif text-xl text-slate-800">Ranking por Frequência</CardTitle>
                      <CardDescription>Clientes com mais pedidos concluídos</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-8">
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dadosClientes} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                        <YAxis type="category" dataKey="nome" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}} />
                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                        <Bar dataKey="pedidos" fill="#8b5cf6" radius={[0, 8, 8, 0]} barSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="font-serif text-xl text-slate-800">LTV (Lifetime Value)</CardTitle>
                      <CardDescription>Total gasto por cliente no período</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-8">
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dadosClientes} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                        <YAxis type="category" dataKey="nome" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                          formatter={(value: number) => fmtCurrency(value)}
                        />
                        <Bar dataKey="valor" fill="#10b981" radius={[0, 8, 8, 0]} barSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="logistica" className="space-y-6 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                      <Truck className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="font-serif text-xl text-slate-800">Preferências de Entrega</CardTitle>
                      <CardDescription>Distribuição por tipo de serviço</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-8">
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dadosEntrega}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="quantidade"
                          nameKey="tipo"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {dadosEntrega.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-500/10 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <CardTitle className="font-serif text-xl text-slate-800">Métodos de Pagamento</CardTitle>
                      <CardDescription>Volume financeiro por modalidade</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-8">
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dadosPagamento}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="valor"
                          nameKey="forma"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {dadosPagamento.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                          formatter={(value: number) => fmtCurrency(value)}
                        />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
