"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
const API_URL = process.env.NEXT_PUBLIC_API_LOGIN_URL;

type LoginResponse = {
  success: boolean;
  token: string;
  user: { id: number; nome: string; login: string; role: string };
};
async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  let data: any = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg =
      data?.message ||
      data?.error ||
      `Erro HTTP ${res.status} (${res.statusText})`;
    console.log("fetchJson error details:", {
      url,
      init,
      status: res.status,
      responseText: text,
      parsedData: data,
    });
    throw new Error(msg);
  }

  return data as T;
}
export function useAuth() {
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (input: { login: string; senha: string }) => {
    setLoading(true);
    try {
      const data = await fetchJson<LoginResponse>(`${API_URL}/auth/login`, {
        method: "POST",
        body: JSON.stringify(input),
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      toast.success("Logado!");
      return data;
    } catch (e: any) {
      toast.error(e?.message || "Erro no login");
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast("Saiu da conta");
  }, []);

  return { loading, login, logout };
}
