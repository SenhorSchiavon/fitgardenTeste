import { redirect } from "next/navigation";

export default function OrcamentoPage() {
  redirect("/agendamentos?orcamento=1");
}
