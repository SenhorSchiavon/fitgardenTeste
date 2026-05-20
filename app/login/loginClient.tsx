"use client";

import React, { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { canAccess, firstAllowedPath, screenForPath } from "@/lib/auth-permissions";

export default function LoginClient() {
  const { login, loading } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();

  const nextPath = useMemo(() => sp.get("next") || "/", [sp]);

  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ login: "", senha: "" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = await login(form);
    const nextScreen = screenForPath(nextPath);
    const destination = nextScreen && !canAccess(data.user, nextScreen.key)
      ? firstAllowedPath(data.user)
      : nextPath;
    router.push(destination);
  }

  return (
    <div className="fixed inset-0 min-h-dvh w-screen overflow-y-auto bg-[#123f35]">
      <div className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden p-6 lg:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,246,225,0.12),transparent_34%),linear-gradient(180deg,rgba(18,63,53,0)_0%,rgba(9,38,32,0.72)_100%)]" />
        <div className="relative w-full max-w-md">
          <div className="mb-8 flex items-center justify-center">
            <img
              src="/brand/fitgarden-horizontal.png"
              alt="FitGarden"
              className="h-20 w-full max-w-[360px] object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,0.22)]"
            />
          </div>

          <div className="rounded-2xl border border-white/20 bg-white shadow-2xl shadow-black/25">
            <div className="px-6 pt-6 pb-2">
              <h1 className="text-2xl font-semibold tracking-tight text-[#123f35]">
                Entrar
              </h1>
              <p className="mt-1 text-sm text-[#55736b]">
                Acesse o painel de gestão do FitGarden
              </p>
            </div>

            <form onSubmit={onSubmit} className="px-6 pb-6 pt-4 space-y-5">
              <div className="space-y-2">
                <Label className="text-sm text-[#123f35]">Login</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#55736b]" />
                  <Input
                    value={form.login}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, login: e.target.value }))
                    }
                    placeholder="Ex: admin"
                    autoComplete="username"
                    className="h-11 border-[#d4e1dc] bg-[#f5faf8] pl-10 focus-visible:ring-[#a8c6bb]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-[#123f35]">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#55736b]" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={form.senha}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, senha: e.target.value }))
                    }
                    placeholder="Sua senha"
                    autoComplete="current-password"
                    className="h-11 border-[#d4e1dc] bg-[#f5faf8] pl-10 pr-10 focus-visible:ring-[#a8c6bb]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#55736b] transition-colors hover:text-[#123f35]"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {showPassword ? "Ocultar senha" : "Mostrar senha"}
                    </span>
                  </button>
                </div>
              </div>

              <Button
                className="h-11 w-full rounded-xl bg-[#e8472d] text-white shadow-lg shadow-[#e8472d]/20 hover:bg-[#d83d25]"
                type="submit"
                disabled={loading || !form.login || !form.senha}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Entrando...
                  </span>
                ) : (
                  "Entrar"
                )}
              </Button>

              <div className="text-center text-xs text-[#55736b]">
                {`Ao entrar, você concorda com os `}
                <a className="underline underline-offset-4 hover:text-[#123f35]" href="#">
                  Termos
                </a>
                {` e `}
                <a className="underline underline-offset-4 hover:text-[#123f35]" href="#">
                  Privacidade
                </a>
                .
              </div>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-white/70">
            © {new Date().getFullYear()} FitGarden
          </p>
        </div>
      </div>
    </div>
  );
}
