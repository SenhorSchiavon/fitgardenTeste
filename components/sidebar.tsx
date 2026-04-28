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
  MessageCircle,
  Package,
  Settings,
  ShoppingCart,
  Tag,
  Users,
  Utensils,
  Cookie,
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
    <div className={cn("flex h-screen flex-col border-r border-white/10 bg-sidebar text-sidebar-foreground", className)}>
      <div className="flex h-20 items-center px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-10 w-10 bg-secondary rounded-xl flex items-center justify-center p-2 shadow-lg shadow-secondary/20">
             <Utensils className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-serif font-bold text-white tracking-tight">FitGarden</span>
        </Link>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-6 py-4">
          <div className="space-y-1">
            <Link href="/">
              <Button
                variant={isActive("/") ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-10 px-4 transition-all duration-200",
                  isActive("/")
                    ? "bg-secondary text-white shadow-lg shadow-secondary/20"
                    : "text-white/70 hover:bg-white/5 hover:text-white",
                )}
                size="sm"
              >
                <LayoutDashboard className={cn("h-4 w-4", isActive("/") ? "text-white" : "text-secondary")} />
                <span className="font-medium">Dashboard</span>
              </Button>
            </Link>
          </div>

          <div className="space-y-1">
            <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2">Administração</h3>
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-between h-10 px-4 text-white/70 hover:bg-white/5 hover:text-white"
                size="sm"
                onClick={() => toggleMenu("cadastros")}
              >
                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4 text-secondary" />
                  <span className="font-medium">Cadastros</span>
                </div>
                <ChevronDown
                  className={cn(
                    "h-3 w-3 transition-transform text-white/40",
                    openMenus.cadastros ? "rotate-180" : "",
                  )}
                />
              </Button>
              {openMenus.cadastros && (
                <div className="ml-4 space-y-1 pl-3 border-l border-white/10 mt-1">
                  {[
                    { href: "/categorias-ingredientes", label: "Categorias", icon: Layers },
                    { href: "/ingredientes", label: "Ingredientes", icon: Package },
                    { href: "/medidas", label: "Medidas", icon: Settings },
                    { href: "/preparos", label: "Preparos", icon: Utensils },
                    { href: "/opcoes", label: "Opções", icon: ListChecks },
                    { href: "/cardapios", label: "Cardápios", icon: ClipboardList },
                    { href: "/salgados", label: "Salgados", icon: Cookie },
                    { href: "/tamanhos-valores", label: "Tamanhos e Valores", icon: Settings },
                    { href: "/regras-personalizada", label: "Regra Personalizada", icon: Settings },
                  ].map((item) => (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive(item.href) ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start gap-3 h-9 transition-all",
                          isActive(item.href)
                            ? "bg-secondary text-white shadow-md shadow-secondary/20"
                            : "text-white/60 hover:bg-white/5 hover:text-white",
                        )}
                        size="sm"
                      >
                        <item.icon className={cn("h-3.5 w-3.5", isActive(item.href) ? "text-white" : "text-secondary/60")} />
                        <span className="text-xs">{item.label}</span>
                      </Button>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href="/planos">
              <Button
                variant={isActive("/planos") ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-10 px-4 transition-all",
                  isActive("/planos")
                    ? "bg-secondary text-white shadow-lg shadow-secondary/20"
                    : "text-white/70 hover:bg-white/5 hover:text-white",
                )}
                size="sm"
              >
                <Package className={cn("h-4 w-4", isActive("/planos") ? "text-white" : "text-secondary")} />
                <span className="font-medium">Planos</span>
              </Button>
            </Link>

            <Link href="/clientes">
              <Button
                variant={isActive("/clientes") ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-10 px-4 transition-all",
                  isActive("/clientes")
                    ? "bg-secondary text-white shadow-lg shadow-secondary/20"
                    : "text-white/70 hover:bg-white/5 hover:text-white",
                )}
                size="sm"
              >
                <Users className={cn("h-4 w-4", isActive("/clientes") ? "text-white" : "text-secondary")} />
                <span className="font-medium">Clientes</span>
              </Button>
            </Link>
          </div>

          <div className="space-y-1">
            <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2">Operacional</h3>
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-between h-10 px-4 text-white/70 hover:bg-white/5 hover:text-white"
                size="sm"
                onClick={() => toggleMenu("pedidos")}
              >
                <div className="flex items-center gap-3">
                  <ShoppingCart className="h-4 w-4 text-secondary" />
                  <span className="font-medium">Pedidos</span>
                </div>
                <ChevronDown
                  className={cn(
                    "h-3 w-3 transition-transform text-white/40",
                    openMenus.pedidos ? "rotate-180" : "",
                  )}
                />
              </Button>
              {openMenus.pedidos && (
                <div className="ml-4 space-y-1 pl-3 border-l border-white/10 mt-1">
                  {[
                    { href: "/agendamentos", label: "Agendamentos", icon: Calendar },
                    { href: "/pedidos-aberto", label: "Em Aberto", icon: CreditCard },
                    { href: "/historico-pedidos", label: "Histórico", icon: ClipboardList },
                    { href: "/pedido-sem-agendamento", label: "Sem Agendamento", icon: ShoppingCart },
                  ].map((item) => (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive(item.href) ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start gap-3 h-9 transition-all",
                          isActive(item.href)
                            ? "bg-secondary text-white shadow-md shadow-secondary/20"
                            : "text-white/60 hover:bg-white/5 hover:text-white",
                        )}
                        size="sm"
                      >
                        <item.icon className={cn("h-3.5 w-3.5", isActive(item.href) ? "text-white" : "text-secondary/60")} />
                        <span className="text-xs">{item.label}</span>
                      </Button>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href="/mensagens">
              <Button
                variant={isActive("/mensagens") ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-10 px-4 transition-all",
                  isActive("/mensagens")
                    ? "bg-secondary text-white shadow-lg shadow-secondary/20"
                    : "text-white/70 hover:bg-white/5 hover:text-white",
                )}
                size="sm"
              >
                <MessageCircle className={cn("h-4 w-4", isActive("/mensagens") ? "text-white" : "text-secondary")} />
                <span className="font-medium">Mensagens</span>
              </Button>
            </Link>

            <Link href="/mais-vendidos">
              <Button
                variant={isActive("/mais-vendidos") ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-10 px-4 transition-all",
                  isActive("/mais-vendidos")
                    ? "bg-secondary text-white shadow-lg shadow-secondary/20"
                    : "text-white/70 hover:bg-white/5 hover:text-white",
                )}
                size="sm"
              >
                <BarChart3 className={cn("h-4 w-4", isActive("/mais-vendidos") ? "text-white" : "text-secondary")} />
                <span className="font-medium">Relatórios</span>
              </Button>
            </Link>

            <Link href="/vouchers">
              <Button
                variant={isActive("/vouchers") ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-10 px-4 transition-all",
                  isActive("/vouchers")
                    ? "bg-secondary text-white shadow-lg shadow-secondary/20"
                    : "text-white/70 hover:bg-white/5 hover:text-white",
                )}
                size="sm"
              >
                <Tag className={cn("h-4 w-4", isActive("/vouchers") ? "text-white" : "text-secondary")} />
                <span className="font-medium">Vouchers</span>
              </Button>
            </Link>
          </div>
        </div>
      </ScrollArea>

      <div className="mt-auto border-t border-white/10 p-6 bg-black/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center text-white font-black shadow-lg shadow-secondary/20">
            A
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">Administrador</p>
            <p className="text-[10px] text-white/40 uppercase tracking-tighter">FitGarden Ops</p>
          </div>
        </div>
      </div>
    </div>
  );
}
