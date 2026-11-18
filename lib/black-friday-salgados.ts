export function resolverSalgadosBlackFriday<T extends { nome: string; ativo?: boolean }>(
  pacotes: { id: string; quantidade: number }[],
  salgados: T[],
) {
  const quantidadePacotes = (id: string) => pacotes
    .filter((pacote) => pacote.id === id)
    .reduce((total, pacote) => total + pacote.quantidade, 0);
  const quantidadeMix = quantidadePacotes("mix");
  const unidadesBlackFriday = [
    { nome: "Coxinha de frango", nomes: ["coxinha de frango", "coxinha"], quantidade: 4 * quantidadePacotes("coxinha") + 2 * quantidadeMix },
    { nome: "Bolinha de queijo", nomes: ["bolinha de queijo"], quantidade: 4 * quantidadePacotes("bolinha") + 2 * quantidadeMix },
  ].filter((item) => item.quantidade > 0);

  const itens = [];
  for (const item of unidadesBlackFriday) {
    const candidatos = salgados.filter((salgado) => salgado.ativo !== false && item.nomes.includes(salgado.nome.trim().toLowerCase()));
    if (candidatos.length !== 1) {
      throw new Error(`Confira se existe um único salgado ativo no cadastro para ${item.nome}.`);
    }
    itens.push({ salgado: candidatos[0], quantidade: item.quantidade });
  }
  return itens;
}

export const grupoSalgadoBlackFriday = (pedidoId: number, salgadoId: string | number) =>
  `pedido-publico:${pedidoId}:black-friday:${salgadoId}`;

export function ratearTotalBlackFriday<T extends { salgado: { id: string | number }; quantidade: number }>(
  itens: T[],
  total: number,
) {
  const ordenados = [...itens].sort((a, b) => Number(a.salgado.id) - Number(b.salgado.id));
  const unidades = ordenados.reduce((soma, item) => soma + item.quantidade, 0);
  const centavos = Math.round(total * 100);
  let acumulado = 0;
  let anterior = 0;
  return ordenados.map(item => {
    acumulado += item.quantidade;
    const parcela = Math.round(centavos * acumulado / unidades);
    const valor = (parcela - anterior) / 100;
    anterior = parcela;
    return { ...item, valor };
  });
}
