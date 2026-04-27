"use client"

import { useDashboard } from "@/hooks/useDashboard"
import { ArrowUp, BarChart3, Calendar, DollarSign, ShoppingCart, Users, Loader2, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function Dashboard() {
  const { data, loading, error } = useDashboard()

  const fmtCurrency = (v: number) => 
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
  
  const fmtDate = (iso: string) => {
    try {
      return new Intl.DateTimeFormat("pt-BR", { 
        day: "2-digit", 
        month: "2-digit", 
        hour: "2-digit", 
        minute: "2-digit" 
      }).format(new Date(iso))
    } catch {
      return iso
    }
  }

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-muted-foreground font-serif text-lg animate-pulse">Carregando métricas reais...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-4 text-center px-4">
        <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-serif font-bold text-primary">Erro ao carregar Dashboard</h2>
        <p className="text-muted-foreground max-w-md">{error || "Não foi possível conectar ao servidor para buscar os dados reais."}</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
          Tentar Novamente
        </Button>
      </div>
    )
  }

  const { metrics, maisVendidos, pedidosRecentes } = data
  const maxVenda = maisVendidos.length > 0 ? Math.max(...maisVendidos.map(m => m.quantidade)) : 1

  return (
    <div className="space-y-6">
      <Header title="Dashboard" subtitle="Visão geral do seu negócio" onSearchChange={() => {}} searchValue=""/>

      <div className="grid grid-cols-12 gap-6">
        {/* Cards de métricas */}
        <Card className="col-span-12 md:col-span-6 lg:col-span-3 border-none shadow-sm bg-white overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <CardHeader className="py-4 px-6 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Receita Total</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0">
            <div className="text-2xl font-serif font-bold text-primary">{fmtCurrency(metrics.receitaTotal)}</div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-2">Acumulado histórico</p>
          </CardContent>
        </Card>

        <Card className="col-span-12 md:col-span-6 lg:col-span-3 border-none shadow-sm bg-white overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-secondary" />
          <CardHeader className="py-4 px-6 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Novos Clientes</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-secondary" />
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0">
            <div className="text-2xl font-serif font-bold text-primary">+{metrics.novosClientesMes}</div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-2">Registrados este mês</p>
          </CardContent>
        </Card>

        <Card className="col-span-12 md:col-span-6 lg:col-span-3 border-none shadow-sm bg-white overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <CardHeader className="py-4 px-6 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Pedidos Semana</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShoppingCart className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0">
            <div className="text-2xl font-serif font-bold text-primary">+{metrics.pedidosSemana}</div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-2">Últimos 7 dias</p>
          </CardContent>
        </Card>

        <Card className="col-span-12 md:col-span-6 lg:col-span-3 border-none shadow-sm bg-white overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-secondary" />
          <CardHeader className="py-4 px-6 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Ticket Médio</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-secondary/10 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-secondary" />
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0">
            <div className="text-2xl font-serif font-bold text-primary">{fmtCurrency(metrics.ticketMedio)}</div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-2">Média por pedido</p>
          </CardContent>
        </Card>

        {/* Gráfico de vendas */}
        <Card className="col-span-12 lg:col-span-8 border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="py-6 px-6 border-b border-border/40">
            <CardTitle className="font-serif text-xl text-primary">Vendas Semanais</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[280px] w-full flex items-end justify-around px-6 pb-10 pt-6">
              {data.vendasSemanais.map((v) => {
                const maxVendaSemana = Math.max(...data.vendasSemanais.map(s => s.total), 1)
                const height = (v.total / maxVendaSemana) * 100
                return (
                  <div key={v.data} className="flex flex-col items-center group w-full px-2">
                    <div 
                      className="w-full bg-primary/20 rounded-t-sm group-hover:bg-primary transition-all duration-500 relative" 
                      style={{ height: `${Math.max(height, 5)}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {fmtCurrency(v.total)}
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-tighter">
                      {new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(new Date(v.data))}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Produtos mais vendidos */}
        <Card className="col-span-12 lg:col-span-4 border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="py-6 px-6 border-b border-border/40">
            <CardTitle className="font-serif text-xl text-primary">Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent className="py-6 px-6 space-y-5">
            {maisVendidos.length > 0 ? maisVendidos.map((item, idx) => (
              <div key={item.nome} className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                  <span className="text-primary truncate max-w-[180px]">{item.nome}</span>
                  <span className="text-muted-foreground">{item.quantidade} un.</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div 
                    className={cn(idx % 2 === 0 ? "bg-primary" : "bg-secondary", "h-1.5 rounded-full transition-all duration-1000 shadow-sm")} 
                    style={{ width: `${(item.quantidade / maxVenda) * 100}%` }}
                  ></div>
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground text-center py-10">Nenhum dado de venda ainda.</p>
            )}
          </CardContent>
        </Card>

        {/* Pedidos recentes */}
        <Card className="col-span-12 lg:col-span-12 border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="py-6 px-6 border-b border-border/40">
            <div className="flex justify-between items-center">
              <CardTitle className="font-serif text-xl text-primary">Últimos Pedidos</CardTitle>
              <Button variant="outline" size="sm" className="text-xs uppercase font-black tracking-widest h-8" asChild>
                <a href="/agendamentos">Gerenciar Pedidos</a>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-muted/30 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3">ID</th>
                    <th className="px-6 py-3">Cliente</th>
                    <th className="px-6 py-3">Data/Hora</th>
                    <th className="px-6 py-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {pedidosRecentes.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/10 transition-colors group">
                      <td className="px-6 py-4 text-sm font-bold text-primary">#{p.id}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary font-bold text-xs uppercase">
                            {p.clienteNome.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">{p.clienteNome}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">{fmtDate(p.createdAt)}</td>
                      <td className="px-6 py-4 text-right text-sm font-black text-primary">{fmtCurrency(p.valorTotal)}</td>
                    </tr>
                  ))}
                  {pedidosRecentes.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-sm text-muted-foreground">Nenhum pedido recente.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
