"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Calendar,
  ChevronDown,
  ClipboardList,
  CreditCard,
  Layers,
  LayoutDashboard,
  ListChecks,
  Package,
  Settings,
  ShoppingCart,
  Tag,
  Users,
  Utensils,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    cadastros: true,
    pedidos: true,
  });

  const toggleMenu = (menu: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  const isActive = (path: string) => pathname === path;

  return (
    <div className={cn("flex h-screen flex-col border-r bg-white", className)}>
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Utensils className="h-6 w-6 text-blue-600" />
          <span className="text-xl font-bold text-gray-800">FitGarden</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-2 py-2">
          <Link href="/">
            <Button
              variant={isActive("/") ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-2",
                isActive("/")
                  ? "bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                  : "text-gray-700 hover:bg-gray-100",
              )}
              size="sm"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
          </Link>

          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-between text-gray-700 hover:bg-gray-100"
              size="sm"
              onClick={() => toggleMenu("cadastros")}
            >
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span>Cadastros</span>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  openMenus.cadastros ? "rotate-180" : "",
                )}
              />
            </Button>
            {openMenus.cadastros && (
              <div className="ml-4 space-y-1">
                <Link href="/categorias-ingredientes">
                  <Button
                    variant={
                      isActive("/categorias-ingredientes")
                        ? "secondary"
                        : "ghost"
                    }
                    className={cn(
                      "w-full justify-start gap-2",
                      isActive("/categorias-ingredientes")
                        ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                        : "text-gray-600 hover:bg-gray-100",
                    )}
                    size="sm"
                  >
                    <Layers className="h-4 w-4" />
                    Categorias de Ingredientes
                  </Button>
                </Link>
                <Link href="/ingredientes">
                  <Button
                    variant={isActive("/ingredientes") ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-2",
                      isActive("/ingredientes")
                        ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                        : "text-gray-600 hover:bg-gray-100",
                    )}
                    size="sm"
                  >
                    <Package className="h-4 w-4" />
                    Ingredientes
                  </Button>
                </Link>
                <Link href="/preparos">
                  <Button
                    variant={isActive("/preparos") ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-2",
                      isActive("/preparos")
                        ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                        : "text-gray-600 hover:bg-gray-100",
                    )}
                    size="sm"
                  >
                    <Utensils className="h-4 w-4" />
                    Preparos
                  </Button>
                </Link>
                <Link href="/opcoes">
                  <Button
                    variant={isActive("/opcoes") ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-2",
                      isActive("/opcoes")
                        ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                        : "text-gray-600 hover:bg-gray-100",
                    )}
                    size="sm"
                  >
                    <ListChecks className="h-4 w-4" />
                    Opções
                  </Button>
                </Link>
                <Link href="/cardapios">
                  <Button
                    variant={isActive("/cardapios") ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-2",
                      isActive("/cardapios")
                        ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                        : "text-gray-600 hover:bg-gray-100",
                    )}
                    size="sm"
                  >
                    <ClipboardList className="h-4 w-4" />
                    Cardápios
                  </Button>
                </Link>
                <Link href="/tamanhos-valores">
                  <Button
                    variant={
                      isActive("/tamanhos-valores") ? "secondary" : "ghost"
                    }
                    className={cn(
                      "w-full justify-start gap-2",
                      isActive("/tamanhos-valores")
                        ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                        : "text-gray-600 hover:bg-gray-100",
                    )}
                    size="sm"
                  >
                    <Settings className="h-4 w-4" />
                    Tamanhos e Valores
                  </Button>
                </Link>
              </div>
            )}
          </div>
          <Link href="/planos">
            <Button
              variant={isActive("/planos") ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-2",
                isActive("/planos")
                  ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                  : "text-gray-700 hover:bg-gray-100",
              )}
              size="sm"
            >
              <Package className="h-4 w-4" />
              Planos
            </Button>
          </Link>
          <Link href="/clientes">
            <Button
              variant={isActive("/clientes") ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-2",
                isActive("/clientes")
                  ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                  : "text-gray-700 hover:bg-gray-100",
              )}
              size="sm"
            >
              <Users className="h-4 w-4" />
              Clientes
            </Button>
          </Link>

          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-between text-gray-700 hover:bg-gray-100"
              size="sm"
              onClick={() => toggleMenu("pedidos")}
            >
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                <span>Pedidos</span>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  openMenus.pedidos ? "rotate-180" : "",
                )}
              />
            </Button>
            {openMenus.pedidos && (
              <div className="ml-4 space-y-1">
                <Link href="/agendamentos">
                  <Button
                    variant={isActive("/agendamentos") ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-2",
                      isActive("/agendamentos")
                        ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                        : "text-gray-600 hover:bg-gray-100",
                    )}
                    size="sm"
                  >
                    <Calendar className="h-4 w-4" />
                    Agendamentos
                  </Button>
                </Link>
                <Link href="/pedidos-aberto">
                  <Button
                    variant={
                      isActive("/pedidos-aberto") ? "secondary" : "ghost"
                    }
                    className={cn(
                      "w-full justify-start gap-2",
                      isActive("/pedidos-aberto")
                        ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                        : "text-gray-600 hover:bg-gray-100",
                    )}
                    size="sm"
                  >
                    <CreditCard className="h-4 w-4" />
                    Pedidos em Aberto
                  </Button>
                </Link>
                <Link href="/historico-pedidos">
                  <Button
                    variant={
                      isActive("/historico-pedidos") ? "secondary" : "ghost"
                    }
                    className={cn(
                      "w-full justify-start gap-2",
                      isActive("/historico-pedidos")
                        ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                        : "text-gray-600 hover:bg-gray-100",
                    )}
                    size="sm"
                  >
                    <ClipboardList className="h-4 w-4" />
                    Histórico de Pedidos
                  </Button>
                </Link>
                <Link href="/pedido-sem-agendamento">
                  <Button
                    variant={
                      isActive("/pedido-sem-agendamento")
                        ? "secondary"
                        : "ghost"
                    }
                    className={cn(
                      "w-full justify-start gap-2",
                      isActive("/pedido-sem-agendamento")
                        ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                        : "text-gray-600 hover:bg-gray-100",
                    )}
                    size="sm"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Pedido sem Agendamento
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <Link href="/mais-vendidos">
            <Button
              variant={isActive("/mais-vendidos") ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-2",
                isActive("/mais-vendidos")
                  ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                  : "text-gray-700 hover:bg-gray-100",
              )}
              size="sm"
            >
              <BarChart3 className="h-4 w-4" />
              Relatórios
            </Button>
          </Link>

          <Link href="/vouchers">
            <Button
              variant={isActive("/vouchers") ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-2",
                isActive("/vouchers")
                  ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                  : "text-gray-700 hover:bg-gray-100",
              )}
              size="sm"
            >
              <Tag className="h-4 w-4" />
              Vouchers
            </Button>
          </Link>
        </div>
      </ScrollArea>
      <div className="mt-auto border-t p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
            A
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">Admin</p>
            <p className="text-xs text-gray-500">admin@fitgarden.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
