"use client";

import { useEffect, useMemo, useState } from "react";
import { Edit, Plus, Save, UserCog } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/hooks/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SCREEN_DEFINITIONS } from "@/lib/auth-permissions";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api";

type SystemUser = {
  id: number;
  login: string;
  nome: string | null;
  role: string;
  isAdmin: boolean;
  ativo: boolean;
  permissions: { screen: string }[];
};

type FormState = {
  id?: number;
  nome: string;
  login: string;
  senha: string;
  isAdmin: boolean;
  ativo: boolean;
  permissions: string[];
};

const emptyForm: FormState = {
  nome: "",
  login: "",
  senha: "",
  isAdmin: false,
  ativo: true,
  permissions: [],
};

export default function UsuariosPage() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const permissionLabels = useMemo(
    () => new Map(SCREEN_DEFINITIONS.map((screen) => [screen.key, screen.label])),
    [],
  );

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${API_URL}/usuarios-sistema`);
      const data = await res.json();
      setUsers(data);
    } catch (e: any) {
      toast.error(e?.message || "Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const startCreate = () => {
    setForm(emptyForm);
    setOpen(true);
  };

  const startEdit = (user: SystemUser) => {
    setForm({
      id: user.id,
      nome: user.nome || "",
      login: user.login,
      senha: "",
      isAdmin: user.isAdmin,
      ativo: user.ativo,
      permissions: user.permissions.map((permission) => permission.screen),
    });
    setOpen(true);
  };

  const togglePermission = (screen: string) => {
    setForm((current) => ({
      ...current,
      permissions: current.permissions.includes(screen)
        ? current.permissions.filter((item) => item !== screen)
        : [...current.permissions, screen],
    }));
  };

  const saveUser = async () => {
    setSaving(true);
    try {
      const payload = {
        nome: form.nome,
        login: form.login,
        senha: form.senha || undefined,
        isAdmin: form.isAdmin,
        ativo: form.ativo,
        permissions: form.isAdmin ? [] : form.permissions,
      };
      const url = form.id ? `${API_URL}/usuarios-sistema/${form.id}` : `${API_URL}/usuarios-sistema`;
      const res = await apiFetch(url, {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Erro ao salvar usuário");

      toast.success("Usuário salvo");
      setOpen(false);
      await loadUsers();
    } catch (e: any) {
      toast.error(e?.message || "Erro ao salvar usuário");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuários</h1>
          <p className="text-sm text-muted-foreground">Controle quem pode acessar cada tela do sistema.</p>
        </div>
        <Button onClick={startCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo usuário
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border bg-background">
        <div className="grid grid-cols-[1.2fr_1fr_120px_120px_96px] gap-4 border-b bg-muted/50 px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
          <span>Nome</span>
          <span>Login</span>
          <span>Perfil</span>
          <span>Status</span>
          <span className="text-right">Ações</span>
        </div>
        {loading ? (
          <div className="px-4 py-8 text-sm text-muted-foreground">Carregando...</div>
        ) : users.length === 0 ? (
          <div className="px-4 py-8 text-sm text-muted-foreground">Nenhum usuário cadastrado.</div>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className="grid grid-cols-[1.2fr_1fr_120px_120px_96px] items-center gap-4 border-b px-4 py-3 text-sm last:border-b-0"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{user.nome || "Sem nome"}</p>
                {!user.isAdmin && (
                  <p className="truncate text-xs text-muted-foreground">
                    {user.permissions.length} tela(s) liberada(s)
                  </p>
                )}
              </div>
              <span className="truncate text-muted-foreground">{user.login}</span>
              <span>{user.isAdmin ? "Admin" : "Funcionário"}</span>
              <span>{user.ativo ? "Ativo" : "Inativo"}</span>
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => startEdit(user)} className="gap-2">
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              {form.id ? "Editar usuário" : "Novo usuário"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input id="nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login">Login</Label>
                <Input id="login" value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha">{form.id ? "Nova senha" : "Senha"}</Label>
                <Input
                  id="senha"
                  type="password"
                  value={form.senha}
                  onChange={(e) => setForm({ ...form, senha: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Usuário ativo</p>
                  <p className="text-xs text-muted-foreground">Contas inativas não conseguem entrar.</p>
                </div>
                <Switch checked={form.ativo} onCheckedChange={(checked) => setForm({ ...form, ativo: checked })} />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
              <div>
                <p className="text-sm font-medium">Administrador</p>
                <p className="text-xs text-muted-foreground">Administradores veem todas as telas.</p>
              </div>
              <Switch checked={form.isAdmin} onCheckedChange={(checked) => setForm({ ...form, isAdmin: checked })} />
            </div>

            {!form.isAdmin && (
              <div className="space-y-3">
                <Label>Telas liberadas</Label>
                <div className="grid max-h-72 gap-2 overflow-y-auto rounded-lg border p-3 sm:grid-cols-2">
                  {SCREEN_DEFINITIONS.filter((screen) => screen.key !== "usuarios").map((screen) => (
                    <label key={screen.key} className="flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted">
                      <Checkbox
                        checked={form.permissions.includes(screen.key)}
                        onCheckedChange={() => togglePermission(screen.key)}
                      />
                      <span>{permissionLabels.get(screen.key)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveUser} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
