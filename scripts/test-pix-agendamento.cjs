// Executar: node scripts/test-pix-agendamento.cjs. Sem navegador, API real ou banco.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = fs.readFileSync(require('node:path').join(__dirname, '../lib/pix-agendamento.ts'), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
let dados, chamadas, falha, semCodigo;
const mockApi = async (url, options) => {
  chamadas.push({ url, options });
  if (!options) return { ok: true, json: async () => dados };
  const id = url.match(/pagamentos\/(\d+)/)[1];
  return { ok: !falha, json: async () => falha ? { message: 'Falha bancária simulada' } : { pixCopiaECola: semCodigo ? null : `codigo-${id}`, pixPagamentoUrl: `https://fitgarden.levacerto.com.br/pagar-pix#t=fixture-${id}` } };
};
const mod = { exports: {} };
new Function('require', 'module', 'exports', js)(name => { assert.equal(name, '../hooks/api'); return { apiFetch: mockApi }; }, mod, mod.exports);
const { gerarPixAgendamento, mensagemPixAgendamento } = mod.exports;
function reset() { chamadas = []; falha = false; semCodigo = false; dados = { pedido: { status: 'ABERTO', pagamentos: [] } }; }
async function main() {
  reset(); assert.deepEqual(await gerarPixAgendamento(1), []); assert.equal(chamadas.length, 1);
  reset(); dados.pedido.pagamentos = [
    { id: 10, forma: 'PIX', status: 'PENDENTE', valor: '12.50' },
    { id: 11, forma: 'PIX', status: 'CONFIRMADO', valor: '50' },
    { id: 12, forma: 'DINHEIRO', status: 'PENDENTE', valor: '20' },
    { id: 13, forma: 'PIX', status: 'CANCELADO', valor: '20' },
    { id: 14, forma: 'PIX', status: 'PENDENTE', valor: '5' },
  ];
  const pix = await gerarPixAgendamento(1);
  assert.deepEqual(pix, [{ pagamentoId: 10, valor: 12.5, codigo: 'codigo-10', linkPagamento: 'https://fitgarden.levacerto.com.br/pagar-pix#t=fixture-10' }, { pagamentoId: 14, valor: 5, codigo: 'codigo-14', linkPagamento: 'https://fitgarden.levacerto.com.br/pagar-pix#t=fixture-14' }]);
  assert.equal(chamadas.length, 3);
  assert.ok(chamadas.every(call => !call.url.includes('/pix-sicredi/recebidos')));
  assert.match(mensagemPixAgendamento(pix), /pagar-pix#t=fixture-10/); assert.match(mensagemPixAgendamento(pix), /12,50/);
  assert.match(mensagemPixAgendamento(pix), /pagar-pix#t=fixture-14/); assert.doesNotMatch(mensagemPixAgendamento(pix), /codigo-10/);
  assert.equal(mensagemPixAgendamento([]), '');
  assert.throws(() => mensagemPixAgendamento([{ pagamentoId: 10, valor: 12.5, codigo: 'codigo-10' }]), /Atualize o backend/);
  falha = true; await assert.rejects(gerarPixAgendamento(1), /Falha bancária simulada/);
  falha = false; semCodigo = true; await assert.rejects(gerarPixAgendamento(1), /não retornou/);
  reset(); dados.pedido.status = 'CANCELADO'; dados.pedido.pagamentos = [{ id: 10, forma: 'PIX', status: 'PENDENTE', valor: '12.50' }];
  assert.deepEqual(await gerarPixAgendamento(1), []); assert.equal(chamadas.length, 1);
  await assert.rejects(gerarPixAgendamento(0), /Salve o agendamento/);
  console.log('OK: Pix pendentes, pagamentos mistos, valores individuais, mensagem, cancelados, falha bancária e código ausente.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
