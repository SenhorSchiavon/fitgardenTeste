import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/header"
import { ArrowDown, ArrowUp, BarChart3, Calendar, DollarSign, ShoppingCart, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Dashboard() {
  return (
    <div className="space-y-4">
      <Header title="Dashboard" subtitle="Bem-vindo ao FitGarden" />

      <div className="grid grid-cols-12 gap-4">
        {/* Cards de métricas - primeira linha */}
        <Card className="col-span-3 bg-white border-gray-200">
          <CardHeader className="py-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium text-gray-700">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-2xl font-bold text-gray-800">R$ 45.231</div>
            <p className="text-xs text-green-600 flex items-center">
              +20.1% <ArrowUp className="ml-1 h-3 w-3" />
            </p>
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-white border-gray-200">
          <CardHeader className="py-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium text-gray-700">Novos Clientes</CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-2xl font-bold text-gray-800">+24</div>
            <p className="text-xs text-green-600 flex items-center">
              +12.2% <ArrowUp className="ml-1 h-3 w-3" />
            </p>
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-white border-gray-200">
          <CardHeader className="py-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium text-gray-700">Pedidos</CardTitle>
              <ShoppingCart className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-2xl font-bold text-gray-800">+573</div>
            <p className="text-xs text-green-600 flex items-center">
              +8.4% <ArrowUp className="ml-1 h-3 w-3" />
            </p>
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-white border-gray-200">
          <CardHeader className="py-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium text-gray-700">Ticket Médio</CardTitle>
              <BarChart3 className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-2xl font-bold text-gray-800">R$ 78,90</div>
            <p className="text-xs text-red-500 flex items-center">
              -4.5% <ArrowDown className="ml-1 h-3 w-3" />
            </p>
          </CardContent>
        </Card>

        {/* Gráfico de vendas - segunda linha */}
        <Card className="col-span-8 bg-white border-gray-200">
          <CardHeader className="py-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium text-gray-700">Vendas Semanais</CardTitle>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="h-7 text-xs border-gray-200 text-gray-600">
                  Semana
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs border-gray-200 text-gray-600">
                  Mês
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[180px] w-full bg-gray-50 flex items-center justify-center">
              <p className="text-gray-500 text-sm">Gráfico de vendas semanais</p>
            </div>
          </CardContent>
        </Card>

        {/* Produtos mais vendidos - segunda linha */}
        <Card className="col-span-4 bg-white border-gray-200">
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium text-gray-700">Produtos Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent className="py-2 space-y-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-700">Fit Tradicional</span>
                <span className="text-gray-500">120 un.</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: "85%" }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-700">Low Carb Especial</span>
                <span className="text-gray-500">85 un.</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: "70%" }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-700">Vegetariano Mix</span>
                <span className="text-gray-500">65 un.</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: "55%" }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pedidos recentes - terceira linha */}
        <Card className="col-span-8 bg-white border-gray-200">
          <CardHeader className="py-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium text-gray-700">Pedidos Recentes</CardTitle>
              <Button variant="outline" size="sm" className="h-7 text-xs border-gray-200 text-gray-600">
                Ver todos
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 divide-y divide-gray-100">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                      <ShoppingCart className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-800">Pedido #{3000 + i}</p>
                      <p className="text-xs text-gray-500">João Silva</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-gray-800">R$ {(Math.random() * 100 + 50).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">Hoje, 14:3{i}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Agendamentos - terceira linha */}
        <Card className="col-span-4 bg-white border-gray-200">
          <CardHeader className="py-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium text-gray-700">Próximos Agendamentos</CardTitle>
              <Calendar className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 divide-y divide-gray-100">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center px-4 py-2">
                  <div className="mr-3 h-2 w-2 rounded-full bg-blue-500"></div>
                  <div>
                    <p className="text-xs font-medium text-gray-800">Entrega #{1000 + i}</p>
                    <p className="text-xs text-gray-500">15:0{i} • 3 itens</p>
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
