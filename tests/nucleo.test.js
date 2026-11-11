'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

require('../js/expressao.js');
require('../js/metodos/comum.js');
require('../js/metodos/bisseccao.js');
require('../js/metodos/newton.js');
require('../js/metodos/gauss.js');
require('../js/metodos/validacao.js');

const M = global.Metodos;
const E = M.executar;

function sistema(n) {
  const A = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? n + 2 : ((i + 2 * j) % 3) - 1)));
  const b = A.map((l) => l.reduce((s, a, j) => s + a * (j + 1), 0));
  return { A, b };
}
function iguais(A, B) {
  assert.equal(A.length, B.length);
  for (let i = 0; i < A.length; i++) {
    assert.equal(A[i].length, B[i].length);
    for (let j = 0; j < A[i].length; j++) assert.equal(A[i][j], B[i][j]);
  }
}

test('N_MAX é a constante única da faixa', () => {
  assert.equal(M.N_MIN, 2);
  assert.ok(M.N_MAX >= 100);
  assert.match(M.msgTamanhoN(1), new RegExp(String(M.N_MAX)));
  assert.match(M.msgTamanhoN(1), /limite prático/);
  assert.doesNotMatch(M.msgTamanhoN(1), /máximo possível/);
});

test('validação aceita N_MAX e recusa N_MAX+1', () => {
  const ok = sistema(M.N_MAX);
  const bom = E.gauss({ A: ok.A, b: ok.b, pivoteamento: 'automatico' });
  assert.equal(bom.codigoErro, null);
  assert.equal(bom.resultado.classificacao, 'unica');
  const ruim = E.gauss({ A: sistema(M.N_MAX + 1).A, b: sistema(M.N_MAX + 1).b });
  assert.equal(ruim.codigoErro, 'ENTRADA_INVALIDA');
  assert.match(ruim.erro, new RegExp(String(M.N_MAX)));
});

test('histórico compacto reproduz o completo em n pequeno', () => {
  const { A, b } = sistema(6);
  const op = M.gauss(A, b, 'sempre', 'operacao');
  const col = M.gauss(A, b, 'sempre', 'coluna');
  assert.deepEqual(op.x, col.x);
  col.passos.filter((p) => p.tipo === 'coluna').forEach((p) => {
    const foto = M.matrizDoPasso(p);
    const ult = op.passos.filter((s) => s.matriz && s.pivo && s.pivo.coluna === p.k).pop();
    assert.ok(ult, 'passo de operação da coluna ' + p.k);
    iguais(foto, ult.matriz);
  });
  const motor = M.criarEliminacao(A, b, 'sempre');
  let p; do { p = motor.avancar(2); } while (!p.feito);
  const exp = motor.exportar();
  assert.deepEqual(exp.x, op.x);
  const montado = M.passosDeMotor(A, b, exp);
  montado.passos.filter((s) => s.tipo === 'coluna').forEach((s) => {
    const ult = op.passos.filter((q) => q.matriz && q.pivo && q.pivo.coluna === s.k).pop();
    iguais(montado.historico.em(s.k), ult.matriz);
  });
});

test('BUG posto: impossível com b enorme e diagonal mista é única', () => {
  const imp = E.gauss({ A: [[1, 0, 0], [0, 1, 0], [0, 0, 0]], b: [0, 0, 1e20] });
  assert.equal(imp.resultado.classificacao, 'impossivel');
  assert.equal(imp.resultado.postoA, 2);
  assert.equal(imp.resultado.postoAumentada, 3);
  assert.match(imp.erro, /impossível/);
  const uni = E.gauss({ A: [[1e20, 0], [0, 1]], b: [1e20, 2] });
  assert.equal(uni.codigoErro, null);
  assert.equal(uni.resultado.classificacao, 'unica');
  assert.ok(Math.abs(uni.resultado.x[0] - 1) < 1e-6);
  assert.ok(Math.abs(uni.resultado.x[1] - 2) < 1e-6);
});

test('BUG quase singular não afirma infinitas soluções', () => {
  const r = E.gauss({ A: [[1, 1], [1, 1 + 2e-16]], b: [1, 1] });
  assert.equal(r.codigoErro, 'MATRIZ_SINGULAR');
  assert.equal(r.resultado.classificacao, 'quase_singular');
  assert.match(r.erro, /não prova que existam infinitas soluções/);
  assert.doesNotMatch(r.erro, /O sistema tem infinitas soluções/);
  const inf = E.gauss({ A: [[1, 1], [1, 1]], b: [2, 2] });
  assert.equal(inf.resultado.classificacao, 'infinitas_solucoes');
});

test('BUG faixa: x infinito vira erro, não resíduo NaN', () => {
  const r = E.gauss({ A: [[1e-10, 0], [0, 1e-10]], b: [1e308, 1] });
  assert.equal(r.codigoErro, 'FORA_DA_FAIXA');
  assert.equal(r.resultado.x, null);
  assert.match(r.erro, /estouro numérico/i);
  assert.ok(!r.avisos.some((a) => /NaN/.test(a)));
});

test('BUG normas escaladas', () => {
  const n = M.norma2([1e200, 1e200]);
  assert.ok(Math.abs(n / 1e200 - Math.SQRT2) < 1e-9);
});

test('BUG bissecção: sinal sem produto, ponto médio estável', () => {
  const mesmo = E.bisseccao({ f: '1e-200', a: 0, b: 1, tol: 1e-3, maxIter: 5 });
  assert.equal(mesmo.codigoErro, 'SEM_TROCA_DE_SINAL');
  const f = global.Expressao.compilar('x-1.2e308');
  const r = M.bisseccao(f, 1e308, 1.5e308, 1e307, 2, 'absoluto');
  assert.equal(r.passos[0].c, 1.25e308);
  const raiz = E.bisseccao({ f: '1e-200*(x-1)', a: 0, b: 2, tol: 1e-6, maxIter: 40, criterio: 'absoluto' });
  assert.equal(raiz.codigoErro, null);
  assert.equal(raiz.resultado.zeroObservado, true);
  assert.equal(raiz.resultado.raizCertificada, false);
  assert.equal(raiz.resultado.garantiaMatematica, false);
  assert.equal(raiz.resultado.raiz, 1);
  assert.match(raiz.avisos.join(' '), /precisão dupla/);
});

test('BUG Newton: sem raiz falsa e derivada relativa', () => {
  const sem = E.newton({ f: 'x^2+1', x0: 100, tol: 1e-8, maxIter: 6 });
  assert.equal(sem.codigoErro, 'NAO_CONVERGIU');
  assert.match(sem.erro, /≠ 0 e o critério de parada não foi atingido/);
  assert.ok(!sem.avisos.some((a) => /raiz múltipla/.test(a)));
  const lin = E.newton({ f: '1e-20*(x-1)', x0: 0, tol: 1e-12, maxIter: 5 });
  assert.equal(lin.codigoErro, null);
  assert.ok(Math.abs(lin.resultado.raiz - 1) < 1e-9);
  assert.ok(!lin.avisos.some((a) => /raiz múltipla|horizontal/.test(a)));
  const cubo = E.newton({ f: 'x^3-1e-18', x0: 1, tol: 1e-12, maxIter: 30 });
  assert.notEqual(cubo.codigoErro, 'RAIZ_EM_ZERO_CRITERIO_RELATIVO');
  const zero = E.newton({ f: 'x^3', x0: 1, tol: 1e-4, maxIter: 80, criterio: 'relativo' });
  assert.equal(zero.codigoErro, null);
  assert.equal(zero.resultado.motivo, 'TOLERANCIA');
  assert.ok(Math.abs(zero.resultado.raiz) < 1e-8);
});

test('BUG mensagens de maxIter, domínio e faixa', () => {
  const b = E.bisseccao({ f: 'x^2-2', a: 1, b: 2, tol: 1e-12, maxIter: 1 });
  assert.match(b.erro, /1 iteração/);
  assert.match(b.erro, /Aumente/);
  const n = E.newton({ f: 'x^2-2', x0: 1, tol: 1e-12, maxIter: 1 });
  assert.match(n.erro, /1 passo/);
  const log = E.newton({ f: 'log(x)', x0: -1, tol: 1e-6, maxIter: 5 });
  assert.match(log.erro, /domínio/);
  assert.match(log.erro, /x > 0/);
  const exp = E.newton({ f: 'exp(x)', x0: 1000, tol: 1e-6, maxIter: 5 });
  assert.match(exp.erro, /estouro numérico/);
  assert.match(exp.erro, /1,8e308/);
});

test('BUG parser 1e-999, hex e gerarSistema decimal', () => {
  assert.throws(() => global.Expressao.compilar('1e-999'), (e) => /faixa normal/.test(e.mensagem) && e.detalhes.posicao === 0);
  const cel = M.analisarNumero('1e-999');
  assert.equal(cel.ok, false);
  assert.equal(cel.posicao, 0);
  assert.equal(M.analisarNumero('−1,5e-3').valor, -0.0015);
  assert.equal(M.analisarNumero('0x10').ok, false);
  assert.equal(M.analisarNumero('1e-320').ok, true);
  assert.notEqual(M.analisarNumero('1e-320').valor, 0);
  assert.equal(M.analisarNumero('0').valor, 0);
  assert.throws(() => M.gerarSistema(2.5, 1), /inteiro/);
  const g = M.gerarSistema(4, 1);
  assert.equal(g.A.length, 4);
  assert.equal(g.b.length, 4);
});

test('estimativa de condição na ordem de grandeza', () => {
  const n = 10;
  const A = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => 1 / (i + j + 1)));
  const b = A.map(() => 1);
  const r = E.gauss({ A, b, pivoteamento: 'sempre' });
  const c = r.resultado.condicao;
  assert.ok(c > 1e12 && c < 1e15, 'cond Hilbert 10 ≈ 1e13, veio ' + c);
  assert.ok(r.avisos.some((a) => /cond₁ estimada/.test(a)));
  const id = E.gauss({ A: [[1, 0], [0, 1]], b: [3, 4] });
  assert.ok(id.resultado.condicao < 5);
  const conhecido = E.gauss({ A: [[1, 2], [3, 4]], b: [5, 6] });
  assert.ok(Math.abs(conhecido.resultado.condicao - 21) < 1);
});

test('condição indisponível não vira mal condicionada', () => {
  const A = [[2, 1], [1, 2]], b = [1, 1];
  const t = M.criarEliminacao(A, b, 'automatico');
  let p; do { p = t.avancar(2); } while (!p.feito);
  const exp = t.exportar();
  exp.condicao = null; exp.U = null; exp.mult = null;
  const r = M.apresentarMotor({ A, b, pivoteamento: 'automatico' }, exp);
  assert.ok(r.avisos.includes('Não foi possível estimar a condição nesta escala numérica.'));
  assert.ok(!r.avisos.some((a) => /mal condicionada/.test(a)));
  assert.equal(M.estimarCondicao1(A, [[0, 0], [0, 0]], [[0, 0], [0, 0]], [0, 1]), null);
});
