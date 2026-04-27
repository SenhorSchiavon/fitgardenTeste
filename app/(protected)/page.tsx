"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/header"
import { ArrowDown, ArrowUp, BarChart3, Calendar, DollarSign, ShoppingCart, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <Header title="Dashboard" subtitle="Bem-vindo ao FitGarden" onSearchChange={() => {}} searchValue=""/>

      <div className="grid grid-cols-12 gap-6">
        {/* Cards de métricas - primeira linha */}
        <Card className="col-span-12 md:col-span-6 lg:col-span-3 border-none shadow-sm bg-white overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <CardHeader className="py-4 px-6 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Receita Total</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0">
            <div className="text-3xl font-serif font-bold text-primary">R$ 45.231</div>
            <p className="text-xs text-green-600 flex items-center mt-2 font-bold">
              +20.1% <ArrowUp className="ml-1 h-3 w-3" />
              <span className="text-muted-foreground font-normal ml-1">vs mês anterior</span>
            </p>
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
            <div className="text-3xl font-serif font-bold text-primary">+24</div>
            <p className="text-xs text-green-600 flex items-center mt-2 font-bold">
              +12.2% <ArrowUp className="ml-1 h-3 w-3" />
              <span className="text-muted-foreground font-normal ml-1">este mês</span>
            </p>
          </CardContent>
        </Card>

        <Card className="col-span-12 md:col-span-6 lg:col-span-3 border-none shadow-sm bg-white overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <CardHeader className="py-4 px-6 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Pedidos</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShoppingCart className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0">
            <div className="text-3xl font-serif font-bold text-primary">+573</div>
            <p className="text-xs text-green-600 flex items-center mt-2 font-bold">
              +8.4% <ArrowUp className="ml-1 h-3 w-3" />
              <span className="text-muted-foreground font-normal ml-1">esta semana</span>
            </p>
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
            <div className="text-3xl font-serif font-bold text-primary">R$ 78,90</div>
            <p className="text-xs text-red-500 flex items-center mt-2 font-bold">
              -4.5% <ArrowDown className="ml-1 h-3 w-3" />
              <span className="text-muted-foreground font-normal ml-1">vs ontem</span>
            </p>
          </CardContent>
        </Card>

        {/* Gráfico de vendas - segunda linha */}
        <Card className="col-span-12 lg:col-span-8 border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="py-6 px-6 border-b border-border/40">
            <div className="flex justify-between items-center">
              <CardTitle className="font-serif text-xl text-primary">Vendas Semanais</CardTitle>
              <div className="flex space-x-2 bg-muted/50 p-1 rounded-lg">
                <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-black tracking-widest bg-white shadow-sm">
                  Semana
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                  Mês
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[240px] w-full bg-muted/20 flex flex-col items-center justify-center group">
               <BarChart3 className="h-12 w-12 text-primary/10 group-hover:scale-110 transition-transform duration-500" />
               <p className="text-muted-foreground text-xs mt-4 font-medium uppercase tracking-widest">Painel de Vendas em Tempo Real</p>
            </div>
          </CardContent>
        </Card>

        {/* Produtos mais vendidos - segunda linha */}
        <Card className="col-span-12 lg:col-span-4 border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="py-6 px-6 border-b border-border/40">
            <CardTitle className="font-serif text-xl text-primary">Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent className="py-6 px-6 space-y-5">
            {[
              { label: "Fit Tradicional", value: 120, pct: 85, color: "bg-primary" },
              { label: "Low Carb Especial", value: 85, pct: 70, color: "bg-secondary" },
              { label: "Vegetariano Mix", value: 65, pct: 55, color: "bg-primary/60" },
            ].map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                  <span className="text-primary">{item.label}</span>
                  <span className="text-muted-foreground">{item.value} un.</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className={cn(item.color, "h-2 rounded-full transition-all duration-1000 shadow-sm")} style={{ width: `${item.pct}%` }}></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pedidos recentes - terceira linha */}
        <Card className="col-span-12 lg:col-span-8 border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="py-6 px-6 border-b border-border/40">
            <div className="flex justify-between items-center">
              <CardTitle className="font-serif text-xl text-primary">Pedidos Recentes</CardTitle>
              <Button variant="link" className="text-secondary font-bold text-xs uppercase tracking-widest">
                Ver todos
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 divide-y divide-border/30">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between px-6 py-4 hover:bg-muted/10 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary transition-colors">
                      <ShoppingCart className="h-5 w-5 text-primary group-hover:text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-primary">Pedido #{3000 + i}</p>
                      <p className="text-xs text-muted-foreground">João Silva • Pix</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-primary">R$ {(Math.random() * 100 + 50).toFixed(2)}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Hoje, 14:3{i}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Agendamentos - terceira linha */}
        <Card className="col-span-12 lg:col-span-4 border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="py-6 px-6 border-b border-border/40">
            <div className="flex justify-between items-center">
              <CardTitle className="font-serif text-xl text-primary">Entregas</CardTitle>
              <Calendar className="h-5 w-5 text-secondary" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 divide-y divide-border/30">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center px-6 py-4 hover:bg-muted/10 transition-colors">
                  <div className={cn("mr-4 h-2.5 w-2.5 rounded-full", i === 1 ? "bg-secondary animate-pulse" : "bg-primary/30")}></div>
                  <div>
                    <p className="text-sm font-bold text-primary">Entrega #{1000 + i}</p>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-tighter">15:0{i} • 3 itens</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
