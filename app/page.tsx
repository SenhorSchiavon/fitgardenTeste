import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronRight, Utensils, Users, ShoppingCart, BarChart, Tag } from "lucide-react"

export default function Dashboard() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-3xl font-bold">FitGarden Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">Cadastros</CardTitle>
            <Utensils className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link
                href="/categorias-ingredientes"
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted"
              >
                <span>Categorias de Ingredientes</span>
                <ChevronRight className="h-5 w-5" />
              </Link>
              <Link
                href="/ingredientes"
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted"
              >
                <span>Ingredientes</span>
                <ChevronRight className="h-5 w-5" />
              </Link>
              <Link href="/preparos" className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted">
                <span>Preparos</span>
                <ChevronRight className="h-5 w-5" />
              </Link>
              <Link href="/opcoes" className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted">
                <span>Opções</span>
                <ChevronRight className="h-5 w-5" />
              </Link>
              <Link
                href="/cardapios"
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted"
              >
                <span>Cardápios</span>
                <ChevronRight className="h-5 w-5" />
              </Link>
              <Link
                href="/tamanhos-valores"
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted"
              >
                <span>Tamanhos e Valores</span>
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">Clientes</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/clientes" className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted">
                <span>Cadastro de Clientes</span>
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">Pedidos</CardTitle>
            <ShoppingCart className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link
                href="/agendamentos"
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted"
              >
                <span>Agendamentos</span>
                <ChevronRight className="h-5 w-5" />
              </Link>
              <Link
                href="/pedidos-aberto"
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted"
              >
                <span>Pedidos em Aberto</span>
                <ChevronRight className="h-5 w-5" />
              </Link>
              <Link
                href="/historico-pedidos"
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted"
              >
                <span>Histórico de Pedidos</span>
                <ChevronRight className="h-5 w-5" />
              </Link>
              <Link
                href="/pedido-sem-agendamento"
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted"
              >
                <span>Pedido sem Agendamento</span>
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">Relatórios</CardTitle>
            <BarChart className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link
                href="/mais-vendidos"
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted"
              >
                <span>Mais Vendidos</span>
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">Vouchers</CardTitle>
            <Tag className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/vouchers" className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted">
                <span>Gerenciar Vouchers</span>
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
