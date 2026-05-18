"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, FileClock, RefreshCw, Search } from "lucide-react";
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

type AuditResponse = {
  items: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function methodClass(method: string) {
  if (method === "POST") return "bg-emerald-100 text-emerald-800 hover:bg-emerald-100";
  if (method === "PUT" || method === "PATCH") return "bg-blue-100 text-blue-800 hover:bg-blue-100";
  if (method === "DELETE") return "bg-red-100 text-red-800 hover:bg-red-100";
  return "bg-slate-100 text-slate-800 hover:bg-slate-100";
}

function statusClass(status: number | null) {
  if (!status) return "outline";
  if (status >= 200 && status < 300) return "bg-emerald-100 text-emerald-800 hover:bg-emerald-100";
  if (status >= 400) return "bg-red-100 text-red-800 hover:bg-red-100";
  return "bg-amber-100 text-amber-800 hover:bg-amber-100";
}

function formatJson(value: unknown) {
  if (!value || (typeof value === "object" && Object.keys(value as object).length === 0)) return "-";
  return JSON.stringify(value, null, 2);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState("TODOS");
  const [user, setUser] = useState("");
  const [path, setPath] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState("25");
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", pageSize);
    if (method !== "TODOS") params.set("method", method);
    if (user.trim()) params.set("user", user.trim());
    if (path.trim()) params.set("path", path.trim());
    return params.toString();
  }, [method, page, pageSize, path, user]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${API_URL}/auditoria?${queryString}`);
      const data = (await res.json()) as AuditResponse;
      setLogs(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (e: any) {
      toast.error(e?.message || "Erro ao carregar auditoria");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLogs();
  }, [queryString]);

  useEffect(() => {
    setPage(1);
  }, [method, user, path, pageSize]);

  const from = total === 0 ? 0 : (page - 1) * Number(pageSize) + 1;
  const to = Math.min(page * Number(pageSize), total);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <FileClock className="h-6 w-6" />
            Auditoria
          </h1>
          <p className="text-sm text-muted-foreground">Acompanhe alterações feitas por usuários no sistema.</p>
        </div>
        <Button variant="outline" onClick={loadLogs} disabled={loading} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      <div className="grid gap-3 rounded-lg border bg-background p-4 lg:grid-cols-[160px_1fr_1fr_140px]">
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
          <Input value={user} onChange={(e) => setUser(e.target.value)} placeholder="Buscar usuário" className="pl-9" />
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input value={path} onChange={(e) => setPath(e.target.value)} placeholder="Buscar rota, ex: clientes" className="pl-9" />
        </div>
        <Select value={pageSize} onValueChange={setPageSize}>
          <SelectTrigger>
            <SelectValue placeholder="Itens" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 por página</SelectItem>
            <SelectItem value="25">25 por página</SelectItem>
            <SelectItem value="50">50 por página</SelectItem>
            <SelectItem value="100">100 por página</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-background">
        <div className="flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium">{total} registro(s)</p>
          <p className="text-xs text-muted-foreground">
            Mostrando {from}-{to} de {total}
          </p>
        </div>

        <div className="divide-y">
          {loading ? (
            <div className="px-4 py-8 text-sm text-muted-foreground">Carregando...</div>
          ) : logs.length === 0 ? (
            <div className="px-4 py-8 text-sm text-muted-foreground">Nenhum log encontrado.</div>
          ) : (
            logs.map((log) => (
              <details key={log.id} className="group">
                <summary className="grid cursor-pointer gap-3 px-4 py-3 text-sm hover:bg-muted/40 lg:grid-cols-[115px_82px_minmax(0,1fr)_180px_88px_90px] lg:items-center">
                  <span className="text-xs text-muted-foreground">{formatDate(log.createdAt)}</span>
                  <Badge className={methodClass(log.method)}>{log.method}</Badge>
                  <span className="min-w-0 truncate font-medium">{log.path}</span>
                  <span className="truncate text-muted-foreground">{log.user?.nome || log.userLogin || "Sistema"}</span>
                  <Badge className={statusClass(log.statusCode)}>{log.statusCode || "-"}</Badge>
                  <span className="text-xs text-muted-foreground">{log.responseTimeMs ?? "-"} ms</span>
                </summary>
                <div className="grid gap-4 border-t bg-muted/20 px-4 py-4 text-sm xl:grid-cols-[360px_1fr]">
                  <div className="space-y-2">
                    <p><span className="font-medium">Usuário:</span> {log.user?.nome || log.userLogin || "Sistema"}</p>
                    <p><span className="font-medium">Login:</span> {log.user?.login || log.userLogin || "-"}</p>
                    <p><span className="font-medium">IP:</span> {log.ip || "-"}</p>
                    <p><span className="font-medium">Status:</span> {log.statusCode || "-"}</p>
                    <p className="break-all"><span className="font-medium">Navegador:</span> {log.userAgent || "-"}</p>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-2">
                    <div>
                      <p className="mb-1 font-medium">Query</p>
                      <pre className="max-h-56 overflow-auto rounded-md bg-black/90 p-3 text-xs text-white">{formatJson(log.requestQuery)}</pre>
                    </div>
                    <div>
                      <p className="mb-1 font-medium">Body</p>
                      <pre className="max-h-56 overflow-auto rounded-md bg-black/90 p-3 text-xs text-white">{formatJson(log.requestBody)}</pre>
                    </div>
                  </div>
                </div>
              </details>
            ))
          )}
        </div>

        <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-muted-foreground">
            Página {Math.min(page, totalPages)} de {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(current - 1, 1))} disabled={page <= 1 || loading}>
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.min(current + 1, totalPages))} disabled={page >= totalPages || loading}>
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
