"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Calendar,
  ChevronDown,
  ClipboardList,
  Cookie,
  CreditCard,
  FileClock,
  Layers,
  LayoutDashboard,
  ListChecks,
  LogOut,
  MessageCircle,
  Package,
  Settings,
  ShoppingCart,
  Smartphone,
  Snowflake,
  Tag,
  UserCog,
  Users,
  Utensils,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { canAccess, getStoredUser, type AuthUser } from "@/lib/auth-permissions";

interface SidebarProps {
  className?: string;
  onClose?: () => void;
  onNavigate?: () => void;
}

type NavItem = {
  href: string;
  label: string;
  screen: string;
  icon: ComponentType<{ className?: string }>;
};

const cadastroItems: NavItem[] = [
  { href: "/categorias-ingredientes", label: "Categorias", icon: Layers, screen: "categorias-ingredientes" },
  { href: "/ingredientes", label: "Ingredientes", icon: Package, screen: "ingredientes" },
  { href: "/medidas", label: "Medidas", icon: Settings, screen: "medidas" },
  { href: "/preparos", label: "Preparos", icon: Utensils, screen: "preparos" },
  { href: "/opcoes", label: "Opções", icon: ListChecks, screen: "opcoes" },
  { href: "/cardapios", label: "Cardápios", icon: ClipboardList, screen: "cardapios" },
  { href: "/salgados", label: "Salgados", icon: Cookie, screen: "salgados" },
  { href: "/montadores", label: "Montadores", icon: UserCog, screen: "montadores" },
  { href: "/tamanhos-valores", label: "Tamanhos e Valores", icon: Settings, screen: "tamanhos-valores" },
  { href: "/regras-personalizada", label: "Regra Personalizada", icon: Settings, screen: "regras-personalizada" },
];

const pedidosItems: NavItem[] = [
  { href: "/agendamentos", label: "Agendamentos", icon: Calendar, screen: "agendamentos" },
  { href: "/pedidos-aberto", label: "Em Aberto", icon: CreditCard, screen: "pedidos-aberto" },
  { href: "/historico-pedidos", label: "Histórico", icon: ClipboardList, screen: "historico-pedidos" },
  { href: "/pedido-sem-agendamento", label: "Sem Agendamento", icon: ShoppingCart, screen: "pedido-sem-agendamento" },
  { href: "/congeladas", label: "Congeladas", icon: Snowflake, screen: "congeladas" },
];

export function Sidebar({ className, onClose, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    cadastros: true,
    pedidos: true,
  });

  useEffect(() => {
    setUser(getStoredUser());
  }, [pathname]);

  const toggleMenu = (menu: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  const isActive = (path: string) => pathname === path;
  const canShow = (screen: string) => canAccess(user, screen);
  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  const renderNavButton = (item: NavItem, compact = false) => (
    <Link key={item.href} href={item.href} onClick={onNavigate}>
      <Button
        variant={isActive(item.href) ? "secondary" : "ghost"}
        className={cn(
          "w-full justify-start gap-3 transition-all",
          compact ? "h-9" : "h-10 px-4",
          isActive(item.href)
            ? "bg-secondary text-white shadow-md shadow-secondary/20"
            : "text-white/60 hover:bg-white/5 hover:text-white",
        )}
        size="sm"
      >
        <item.icon className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4", isActive(item.href) ? "text-white" : "text-secondary")} />
        <span className={compact ? "text-xs" : "font-medium"}>{item.label}</span>
      </Button>
    </Link>
  );

  const visibleCadastros = cadastroItems.filter((item) => canShow(item.screen));
  const visiblePedidos = pedidosItems.filter((item) => canShow(item.screen));

  return (
    <div className={cn("flex h-screen flex-col border-r border-white/10 bg-sidebar text-sidebar-foreground", className)}>
      <div className="flex h-24 items-center justify-between gap-3 px-4">
        <Link href="/" className="block min-w-0 flex-1" onClick={onNavigate}>
          <img
            src="/brand/fitgarden-sidebar.png"
            alt="FitGarden"
            className="mx-auto h-16 w-[180px] object-contain object-center"
          />
        </Link>
        {onClose && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-white/70 hover:bg-white/10 hover:text-white md:hidden"
            onClick={onClose}
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-6 py-4">
          {canShow("dashboard") && renderNavButton({ href: "/", label: "Dashboard", icon: LayoutDashboard, screen: "dashboard" })}

          <div className="space-y-1">
            <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2">Administração</h3>
            {visibleCadastros.length > 0 && (
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
                  <ChevronDown className={cn("h-3 w-3 transition-transform text-white/40", openMenus.cadastros ? "rotate-180" : "")} />
                </Button>
                {openMenus.cadastros && (
                  <div className="ml-4 space-y-1 pl-3 border-l border-white/10 mt-1">
                    {visibleCadastros.map((item) => renderNavButton(item, true))}
                  </div>
                )}
              </div>
            )}

            {canShow("planos") && renderNavButton({ href: "/planos", label: "Planos", icon: Package, screen: "planos" })}
            {canShow("clientes") && renderNavButton({ href: "/clientes", label: "Clientes", icon: Users, screen: "clientes" })}
            {canShow("usuarios") && renderNavButton({ href: "/usuarios", label: "Usuários", icon: UserCog, screen: "usuarios" })}
            {canShow("auditoria") && renderNavButton({ href: "/auditoria", label: "Auditoria", icon: FileClock, screen: "auditoria" })}
          </div>

          <div className="space-y-1">
            <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2">Operacional</h3>
            {visiblePedidos.length > 0 && (
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
                  <ChevronDown className={cn("h-3 w-3 transition-transform text-white/40", openMenus.pedidos ? "rotate-180" : "")} />
                </Button>
                {openMenus.pedidos && (
                  <div className="ml-4 space-y-1 pl-3 border-l border-white/10 mt-1">
                    {visiblePedidos.map((item) => renderNavButton(item, true))}
                  </div>
                )}
              </div>
            )}

            {canShow("mensagens") && renderNavButton({ href: "/mensagens", label: "Mensagens", icon: MessageCircle, screen: "mensagens" })}
            {canShow("whatsapp") && renderNavButton({ href: "/whatsapp", label: "WhatsApp", icon: Smartphone, screen: "whatsapp" })}
            {canShow("mais-vendidos") && renderNavButton({ href: "/mais-vendidos", label: "Relatórios", icon: BarChart3, screen: "mais-vendidos" })}
            {canShow("vouchers") && renderNavButton({ href: "/vouchers", label: "Vouchers", icon: Tag, screen: "vouchers" })}
          </div>
        </div>
      </ScrollArea>

      <div className="mt-auto border-t border-white/10 p-4 bg-black/10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-secondary/70"
            >
              <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center text-white font-black shadow-lg shadow-secondary/20">
                {(user?.nome || user?.login || "U").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{user?.nome || user?.login || "Usuário"}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-tighter">{user?.isAdmin ? "Administrador" : "Funcionário"}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-48">
            <DropdownMenuItem onClick={handleLogout} className="gap-2 text-red-600 focus:text-red-600">
              <LogOut className="h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
