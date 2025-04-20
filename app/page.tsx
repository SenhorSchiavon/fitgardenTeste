import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/header"
import { ArrowDown, ArrowUp, BarChart3, Calendar, DollarSign, ShoppingCart, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <Header title="Dashboard" subtitle="Bem-vindo ao FitGarden" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">R$ 45.231,89</div>
            <p className="text-xs text-gray-500">
              <span className="text-green-600 flex items-center">
                +20.1% <ArrowUp className="ml-1 h-3 w-3" />
              </span>{" "}
              em relação ao mês passado
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Novos Clientes</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">+24</div>
            <p className="text-xs text-gray-500">
              <span className="text-green-600 flex items-center">
                +12.2% <ArrowUp className="ml-1 h-3 w-3" />
              </span>{" "}
              em relação ao mês passado
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">+573</div>
            <p className="text-xs text-gray-500">
              <span className="text-green-600 flex items-center">
                +8.4% <ArrowUp className="ml-1 h-3 w-3" />
              </span>{" "}
              em relação ao mês passado
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Ticket Médio</CardTitle>
            <BarChart3 className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">R$ 78,90</div>
            <p className="text-xs text-gray-500">
              <span className="text-red-500 flex items-center">
                -4.5% <ArrowDown className="ml-1 h-3 w-3" />
              </span>{" "}
              em relação ao mês passado
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-white border border-gray-200">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
            Análise
          </TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
            Relatórios
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-800">Vendas Semanais</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px] w-full bg-gray-50 rounded-md flex items-center justify-center">
                  <p className="text-gray-500">Gráfico de vendas semanais</p>
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-3 bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-800">Produtos Mais Vendidos</CardTitle>
                <CardDescription className="text-gray-500">Top 5 produtos mais vendidos este mês</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-full">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Fit Tradicional</span>
                        <span className="text-sm text-gray-500">120 un.</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: "85%" }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-full">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Low Carb Especial</span>
                        <span className="text-sm text-gray-500">85 un.</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: "70%" }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-full">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Vegetariano Mix</span>
                        <span className="text-sm text-gray-500">65 un.</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: "55%" }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-full">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Proteico Plus</span>
                        <span className="text-sm text-gray-500">50 un.</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: "40%" }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-full">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Sopa Detox</span>
                        <span className="text-sm text-gray-500">40 un.</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: "30%" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-2 bg-white border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-gray-800">Pedidos Recentes</CardTitle>
                  <CardDescription className="text-gray-500">Últimos 5 pedidos realizados</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="border-gray-200 text-gray-700 hover:bg-gray-50">
                  Ver todos
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <div className="flex items-center space-x-3">
                        <div className="h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center">
                          <ShoppingCart className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">Pedido #{3000 + i}</p>
                          <p className="text-xs text-gray-500">Cliente: João Silva</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-800">R$ {(Math.random() * 100 + 50).toFixed(2)}</p>
                        <p className="text-xs text-gray-500">Hoje, 14:3{i}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-800">Próximos Agendamentos</CardTitle>
                <CardDescription className="text-gray-500">Agendamentos para hoje</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">Entrega #{1000 + i}</p>
                        <div className="flex items-center text-xs text-gray-500">
                          <span>15:0{i} - 17:00</span>
                          <span className="mx-1">•</span>
                          <span>3 itens</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full border-gray-200 text-gray-700 hover:bg-gray-50">
                    Ver todos os agendamentos
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent
          value="analytics"
          className="h-[400px] flex items-center justify-center bg-white border border-gray-200 rounded-md"
        >
          <p className="text-gray-500">Conteúdo de análise detalhada</p>
        </TabsContent>
        <TabsContent
          value="reports"
          className="h-[400px] flex items-center justify-center bg-white border border-gray-200 rounded-md"
        >
          <p className="text-gray-500">Conteúdo de relatórios</p>
        </TabsContent>
      </Tabs>
    </div>
  )
}
