import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const PESAGENS = ["200g", "300g", "400g", "500g"] as const;

const PRICING_TABLE = [
  { titulo: "Plano Semanal (10 refeições)", referencia: "Acima de 10 un (Semanal)", valores: [107, 135, 157, 200] },
  { titulo: "Plano Quinzenal (20 refeições)", referencia: "Acima de 20 un (Quinzenal)", valores: [195, 257, 305, 390] },
  { titulo: "Plano Mensal (40 refeições)", referencia: "Acima de 40 un (Mensal)", valores: [375, 492, 567, 720] },
  { titulo: "Refeições Avulsas", referencia: "Avulso", valores: [14, 16, 18, 22] },
];

const SALGADOS = [
  ["01 unidade", 8.5],
  ["04 unidades", 32],
  ["08 unidades", 60],
] as const;

const reais = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const modalClass = "w-[calc(100%-1.5rem)] max-h-[85dvh] grid-rows-[auto_minmax(0,1fr)] rounded-2xl border-[#e3d8c8] bg-[#fffdf8] p-4 text-[#14332f] sm:p-6";

function Valores({ linhas }: { linhas: ReadonlyArray<readonly [string, number, string?]> }) {
  return (
    <dl className="divide-y divide-[#e3d8c8] text-sm">
      {linhas.map(([rotulo, preco, unidade]) => (
        <div key={rotulo} className="flex items-baseline justify-between gap-3 py-1.5">
          <dt>{rotulo}</dt>
          <dd className="shrink-0 font-semibold tabular-nums">{reais.format(preco)}{unidade}</dd>
        </div>
      ))}
    </dl>
  );
}

export function InformacoesCardapio() {
  return (
    <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
      <Dialog>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" className="rounded-xl border-[#d8cbbd]">Como funciona o pedido</Button>
        </DialogTrigger>
        <DialogContent className={modalClass} aria-describedby={undefined}>
          <DialogTitle className="pr-7">Como funciona o pedido</DialogTitle>
          <div className="space-y-3 overflow-y-auto pr-2 text-sm leading-relaxed">
            <p>🍽️ As marmitas são entregues frescas, produzidas no dia da entrega<br />❄️ Assim que receber, congele imediatamente<br />👉 Descongele apenas no momento do consumo!</p>
            <div>
              <p>📝 <strong>Para pedir:</strong></p>
              <ul className="list-disc pl-5">
                <li>Pode escolher quantas opções desejar</li>
                <li>Preencha seu nome e número de telefone e clique em enviar</li>
                <li>O pedido é confirmado e finalizado pelo Whatsapp, neste site é feita apenas a escolha das opções.</li>
              </ul>
            </div>
            <p>⏰ Pedidos devem ser feitos com 1 a 2 dias de antecedência (conforme disponibilidade de agenda)</p>
            <p>✅ Caso necessite de marmitas com pesagens diferentes em um mesmo pedido, pode gerar um pedido para cada tamanho, e associamos no momento do agendamento.</p>
            <p>💡 Produzimos somente o que foi agendado, garantindo marmitas fresquinhas e sem desperdício!</p>
            <p>Qualquer dúvida, estou por aqui! 💚</p>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" className="rounded-xl border-[#d8cbbd]">Tabela de valores</Button>
        </DialogTrigger>
        <DialogContent className={modalClass}>
          <DialogTitle className="pr-7">Tabela de valores</DialogTitle>
          <div className="space-y-4 overflow-y-auto pr-2">
            {PRICING_TABLE.map(({ titulo, valores }) => (
              <section key={titulo}>
                <h3 className="font-bold">{titulo}</h3>
                <Valores linhas={PESAGENS.map((peso, index) => [peso, valores[index]])} />
              </section>
            ))}
            <section>
              <h3 className="font-bold">Salgados Fit</h3>
              <Valores linhas={SALGADOS} />
            </section>
            <DialogDescription className="text-[#47625d]">
              Valores válidos para montagens padrão. Em caso de personalizações o orçamento será realizado conforme o plano alimentar solicitado.
            </DialogDescription>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function ReferenciaPersonalizado() {
  const [peso, setPeso] = useState("");
  const indice = PESAGENS.findIndex((pesagem) => pesagem === peso);
  const ordemReferencia = [PRICING_TABLE[3], ...PRICING_TABLE.slice(0, 3)];

  return (
    <div className="mt-3 space-y-2">
      <label className="block text-sm font-semibold" htmlFor="pesagem-referencia">Pesagem de referência</label>
      <select
        id="pesagem-referencia"
        className="h-11 w-full rounded-xl border border-[#d8cbbd] bg-[#fffdf8] px-3 text-sm sm:w-auto"
        value={peso}
        onChange={(event) => setPeso(event.target.value)}
      >
        <option value="" disabled>Selecionar</option>
        {PESAGENS.map((pesagem) => <option key={pesagem}>{pesagem}</option>)}
      </select>
      <div aria-live="polite">
        {indice >= 0 && (
          <section className="space-y-2 rounded-xl border border-[#e9d8c8] bg-[#fffdf8] p-3">
            <h3 className="text-sm font-bold">Tabela de valores de referência (Montagem Padrão - {peso})</h3>
            <Valores linhas={ordemReferencia.map(({ referencia, valores }) => [
              referencia, valores[indice], referencia === "Avulso" ? "/un" : undefined,
            ])} />
            <p className="text-xs leading-relaxed text-[#47625d]">
              ⚠️ Valores base para referência. Adições ou alterações de itens (ex.: inclusão de feijão ou aumento de proteína) alteram o valor final, que será orçado e confirmado pelo WhatsApp.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
