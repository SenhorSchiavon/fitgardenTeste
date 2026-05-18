"use client";

import { useEffect, useMemo, useState } from "react";
import { FileClock, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/hooks/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api";

type AuditLog = {
  id: number;
  userLogin: string | null;
  method: string;
  path: string;
  statusCode: number | null;
  ip: string | null;
  userAgent: string | null;
  requestBody: unknown;
  requestQuery: unknown;
  responseTimeMs: number | null;
  createdAt: string;
  user: { nome: string | null; login: string } | null;
};

function methodClass(method: string) {
  if (method === "POST") return "bg-emerald-100 text-emerald-800 hover:bg-emerald-100";
  if (method === "PUT" || method === "PATCH") return "bg-blue-100 text-blue-800 hover:bg-blue-100";
  if (method === "DELETE") return "bg-red-100 text-red-800 hover:bg-red-100";
  return "";
}

function formatJson(value: unknown) {
  if (!value || (typeof value === "object" && Object.keys(value as object).length === 0)) return "-";
  return JSON.stringify(value, null, 2);
}

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState("TODOS");
  const [user, setUser] = useState("");
  const [path, setPath] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("take", "150");
    if (method !== "TODOS") params.set("method", method);
    if (user.trim()) params.set("user", user.trim());
    if (path.trim()) params.set("path", path.trim());
    return params.toString();
  }, [method, user, path]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${API_URL}/auditoria?${queryString}`);
      const data = await res.json();
      setLogs(data);
    } catch (e: any) {
      toast.error(e?.message || "Erro ao carregar auditoria");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLogs();
  }, [queryString]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <FileClock className="h-6 w-6" />
            Auditoria
          </h1>
          <p className="text-sm text-muted-foreground">Registro das alterações feitas no sistema.</p>
        </div>
        <Button variant="outline" onClick={loadLogs} disabled={loading} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      <div className="grid gap-3 rounded-lg border bg-background p-4 md:grid-cols-[180px_1fr_1fr]">
        <Select value={method} onValueChange={setMethod}>
          <SelectTrigger>
            <SelectValue placeholder="Método" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos</SelectItem>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
            <SelectItem value="PATCH">PATCH</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input value={user} onChange={(e) => setUser(e.target.value)} placeholder="Filtrar por usuário" className="pl-9" />
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input value={path} onChange={(e) => setPath(e.target.value)} placeholder="Filtrar por rota" className="pl-9" />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-background">
        <div className="grid grid-cols-[150px_90px_1fr_170px_90px] gap-4 border-b bg-muted/50 px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
          <span>Data</span>
          <span>Método</span>
          <span>Rota</span>
          <span>Usuário</span>
          <span>Status</span>
        </div>

        {loading ? (
          <div className="px-4 py-8 text-sm text-muted-foreground">Carregando...</div>
        ) : logs.length === 0 ? (
          <div className="px-4 py-8 text-sm text-muted-foreground">Nenhum log encontrado.</div>
        ) : (
          logs.map((log) => (
            <details key={log.id} className="group border-b last:border-b-0">
              <summary className="grid cursor-pointer grid-cols-[150px_90px_1fr_170px_90px] items-center gap-4 px-4 py-3 text-sm hover:bg-muted/40">
                <span className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString("pt-BR")}</span>
                <Badge className={methodClass(log.method)}>{log.method}</Badge>
                <span className="truncate font-medium">{log.path}</span>
                <span className="truncate text-muted-foreground">{log.user?.nome || log.userLogin || "Sistema"}</span>
                <span>{log.statusCode || "-"}</span>
              </summary>
              <div className="grid gap-4 border-t bg-muted/20 px-4 py-4 text-sm lg:grid-cols-2">
                <div className="space-y-2">
                  <p><span className="font-medium">IP:</span> {log.ip || "-"}</p>
                  <p><span className="font-medium">Tempo:</span> {log.responseTimeMs ?? "-"} ms</p>
                  <p className="break-all"><span className="font-medium">User agent:</span> {log.userAgent || "-"}</p>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="mb-1 font-medium">Query</p>
                    <pre className="max-h-40 overflow-auto rounded-md bg-black/90 p-3 text-xs text-white">{formatJson(log.requestQuery)}</pre>
                  </div>
                  <div>
                    <p className="mb-1 font-medium">Body</p>
                    <pre className="max-h-64 overflow-auto rounded-md bg-black/90 p-3 text-xs text-white">{formatJson(log.requestBody)}</pre>
                  </div>
                </div>
              </div>
            </details>
          ))
        )}
      </div>
    </div>
  );
}
