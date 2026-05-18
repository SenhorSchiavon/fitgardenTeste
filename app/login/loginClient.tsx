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
    <div className="min-h-screen grid">
      <div className="relative flex items-center justify-center overflow-hidden p-6 lg:p-12 bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--muted))_100%)]">
        <img
          src="/brand/fitgarden-horizontal.png"
          alt=""
          className="pointer-events-none absolute -right-24 top-10 hidden h-36 w-[620px] object-contain opacity-[0.08] lg:block"
        />
        <img
          src="/brand/fitgarden-coral.png"
          alt=""
          className="pointer-events-none absolute -bottom-12 -left-20 hidden h-44 w-[720px] object-contain opacity-[0.06] lg:block"
        />

        <div className="relative w-full max-w-md">
          <div className="mb-8 flex items-center justify-center">
            <img
              src="/brand/fitgarden-horizontal.png"
              alt="FitGarden"
              className="h-20 w-full max-w-[340px] rounded-2xl bg-white object-contain px-5 py-3 shadow-sm ring-1 ring-border"
            />
          </div>

          <div className="rounded-2xl border border-border bg-background/90 backdrop-blur-md shadow-xl">
            <div className="px-6 pt-6 pb-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                Entrar
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Acesse o painel de gestão do FitGarden
              </p>
            </div>

            <form onSubmit={onSubmit} className="px-6 pb-6 pt-4 space-y-5">
              <div className="space-y-2">
                <Label className="text-sm">Login</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={form.login}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, login: e.target.value }))
                    }
                    placeholder="Ex: admin"
                    autoComplete="username"
                    className="h-11 pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={form.senha}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, senha: e.target.value }))
                    }
                    placeholder="Sua senha"
                    autoComplete="current-password"
                    className="h-11 pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
                className="w-full h-11 rounded-xl"
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

              <div className="text-center text-xs text-muted-foreground">
                {`Ao entrar, você concorda com os `}
                <a className="underline underline-offset-4 hover:text-foreground" href="#">
                  Termos
                </a>
                {` e `}
                <a className="underline underline-offset-4 hover:text-foreground" href="#">
                  Privacidade
                </a>
                .
              </div>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} FitGarden
          </p>
        </div>
      </div>
    </div>
  );
}
