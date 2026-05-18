"use client";

import { ShieldAlert } from "lucide-react";

export default function SemAcessoPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-md rounded-lg border bg-background p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <ShieldAlert className="h-6 w-6 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-semibold">Sem telas liberadas</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sua conta está ativa, mas ainda não recebeu permissão para acessar nenhuma tela.
          Peça para um administrador liberar seu acesso em Usuários.
        </p>
      </div>
    </div>
  );
}
