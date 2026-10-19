import { apiFetch } from "../hooks/api";

export type PixAgendamento = { pagamentoId: number; valor: number; codigo: string; linkPagamento?: string };

const baseUrl = () => {
  const base = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api").replace(/\/+$/, "");
  return `${base.endsWith("/api") ? base : `${base}/api`}/agendamentos`;
};

export async function gerarPixAgendamento(agendamentoId: number): Promise<PixAgendamento[]> {
  if (!Number.isSafeInteger(agendamentoId) || agendamentoId <= 0) throw new Error("Salve o agendamento antes de gerar o Pix");
  const response = await apiFetch(`${baseUrl()}/${agendamentoId}`);
  const agendamento = await response.json();
  if (!response.ok) throw new Error(agendamento.message || "Não foi possível consultar o agendamento");
  if (agendamento.pedido?.status === "CANCELADO") return [];
  const pagamentos: Array<{ id: number; forma: string; status: string; valor: string | number }> = agendamento.pedido?.pagamentos || [];
  const pendentes = pagamentos.filter(p => p.forma === "PIX" && p.status === "PENDENTE" && Number(p.valor) > 0);
  const pix: PixAgendamento[] = [];
  for (const pagamento of pendentes) {
    // O servidor confere o status novamente e reutiliza a cobrança já gerada.
    const res = await apiFetch(`${baseUrl()}/pagamentos/${pagamento.id}/pix-sicredi/gerar`, { method: "POST" });
    const cobranca = await res.json();
    if (!res.ok) throw new Error(cobranca.message || "Não foi possível gerar o Pix no Sicredi");
    if (typeof cobranca.pixCopiaECola !== "string" || !cobranca.pixCopiaECola.trim()) {
      throw new Error("O Sicredi não retornou o Pix Copia e Cola. Confira a cobrança antes de enviar ao cliente.");
    }
    pix.push({ pagamentoId: pagamento.id, valor: Number(cobranca.valor ?? pagamento.valor), codigo: cobranca.pixCopiaECola.trim(),
      ...(typeof cobranca.pixPagamentoUrl === "string" ? { linkPagamento: cobranca.pixPagamentoUrl } : {}),
    });
  }
  return pix;
}

export function mensagemPixAgendamento(pix: PixAgendamento[]): string {
  if (pix.some(item => !item.linkPagamento)) throw new Error("Atualize o backend para disponibilizar o link de pagamento Pix.");
  const pagamentos = pix.map(item => [
    `*Pagar com Pix — ${item.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}:*`,
    item.linkPagamento,
    "Abra o link e toque em Copiar Pix para pagar.",
  ].join("\n")).join("\n\n");
  return pagamentos ? `NOVIDADE: Pix copia e cola: realizar seu pagamento ficou muito mais prático!\n\n${pagamentos}` : "";
}
