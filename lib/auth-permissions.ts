export type AuthUser = {
  id: number;
  nome: string | null;
  login: string;
  role: string;
  isAdmin?: boolean;
  permissions?: string[];
};

export type ScreenDefinition = {
  key: string;
  label: string;
  path: string;
};

export const SCREEN_DEFINITIONS: ScreenDefinition[] = [
  { key: "dashboard", label: "Dashboard", path: "/" },
  { key: "categorias-ingredientes", label: "Categorias", path: "/categorias-ingredientes" },
  { key: "ingredientes", label: "Ingredientes", path: "/ingredientes" },
  { key: "medidas", label: "Medidas", path: "/medidas" },
  { key: "preparos", label: "Preparos", path: "/preparos" },
  { key: "opcoes", label: "Opções", path: "/opcoes" },
  { key: "cardapios", label: "Cardápios", path: "/cardapios" },
  { key: "salgados", label: "Salgados", path: "/salgados" },
  { key: "montadores", label: "Montadores", path: "/montadores" },
  { key: "tamanhos-valores", label: "Tamanhos e Valores", path: "/tamanhos-valores" },
  { key: "regras-personalizada", label: "Regra Personalizada", path: "/regras-personalizada" },
  { key: "planos", label: "Planos", path: "/planos" },
  { key: "clientes", label: "Clientes", path: "/clientes" },
  { key: "agendamentos", label: "Agendamentos", path: "/agendamentos" },
  { key: "pedidos-aberto", label: "Pedidos em Aberto", path: "/pedidos-aberto" },
  { key: "historico-pedidos", label: "Histórico de Pedidos", path: "/historico-pedidos" },
  { key: "pedido-sem-agendamento", label: "Sem Agendamento", path: "/pedido-sem-agendamento" },
  { key: "congeladas", label: "Congeladas", path: "/congeladas" },
  { key: "mensagens", label: "Mensagens", path: "/mensagens" },
  { key: "whatsapp", label: "WhatsApp", path: "/whatsapp" },
  { key: "mais-vendidos", label: "Relatórios", path: "/mais-vendidos" },
  { key: "vouchers", label: "Vouchers", path: "/vouchers" },
  { key: "usuarios", label: "Usuários", path: "/usuarios" },
];

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function canAccess(user: AuthUser | null, screenKey: string) {
  if (!user) return false;
  if (user.isAdmin || user.role === "ADMIN") return true;
  return Boolean(user.permissions?.includes(screenKey));
}

export function screenForPath(pathname: string) {
  return SCREEN_DEFINITIONS.find((screen) => screen.path === pathname);
}

export function firstAllowedPath(user: AuthUser | null) {
  return SCREEN_DEFINITIONS.find((screen) => canAccess(user, screen.key))?.path || "/login";
}
