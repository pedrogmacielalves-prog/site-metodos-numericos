'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

global.window = global;
require('../js/expressao.js');
require('../js/metodos/comum.js');
require('../js/metodos/bisseccao.js');
require('../js/metodos/newton.js');
require('../js/metodos/gauss.js');
require('../js/metodos/validacao.js');
require('../js/visual/comum.js');
require('../js/visual/gauss-entrada.js');

const M = global.Metodos;
const E = M.executar;
const V = global.Visual;

test('BUG-43 fmtSolucao não zera componente legítimo', () => {
  const t = V.fmtSolucao([1, 1e20]);
  assert.equal(t[0], '1,00000000');
  assert.match(t[1], /1,00000000e\+20/);
  const r = E.gauss({ A: [[1, 0], [0, 1]], b: [1, 1e20] });
  assert.equal(V.fmtSolucao(r.resultado.x)[0], '1,00000000');
});

test('BUG-47 não inventa raiz zero nem múltipla', () => {
  const a = E.newton({ f: '1e-6*(x^2+1)', x0: 100, tol: 1e-6, maxIter: 6, criterio: 'relativo' });
  assert.equal(a.codigoErro, 'NAO_CONVERGIU');
  assert.match(a.erro, /Aumente/);
  assert.ok(!a.avisos.some((s) => /raiz múltipla|convergem para x = 0/.test(s)));
  const b = E.newton({ f: 'x^3-1e-18', x0: 1, tol: 1e-6, maxIter: 9, criterio: 'relativo' });
  assert.notEqual(b.codigoErro, 'RAIZ_EM_ZERO_CRITERIO_RELATIVO');
  assert.ok(!b.avisos.some((s) => /raiz múltipla/.test(s)));
});

test('BUG-48 derivada 1 com f grande não é horizontal', () => {
  const r = E.newton({ f: 'x+1e20', x0: 0, tol: 1e-6, maxIter: 5, criterio: 'relativo' });
  assert.notEqual(r.codigoErro, 'DERIVADA_ZERO');
  assert.equal(r.resultado.convergiu, true);
  assert.ok(Math.abs(r.resultado.raiz + 1e20) / 1e20 < 1e-6);
});

test('BUG-49 polos não são raiz certificada', () => {
  const a = E.bisseccao({ f: '1/(x-0.3)', a: 0, b: 1, tol: 1e-8, maxIter: 80, criterio: 'absoluto' });
  const b = E.bisseccao({ f: 'x/2-tan(x)', a: 1, b: 2, tol: 0.01, maxIter: 50 });
  for (const r of [a, b]) {
    assert.equal(r.codigoErro, 'DESCONTINUIDADE');
    assert.equal(r.resultado.convergiu, false);
    assert.match(r.erro, /não uma certificação/);
    assert.match(r.erro, /heurística/i);
  }
});

test('BUG-50 ponto médio com extremos opostos enormes', () => {
  const r = M.bisseccao(global.Expressao.compilar('x'), -1e308, 1e308, 1, 2, 'absoluto');
  assert.equal(r.passos[0].c, 0);
  assert.ok(Number.isFinite(r.passos[0].erro));
});

test('BUG-54 derivada infinita, domínio e faixa nas iterações', () => {
  const s = E.newton({ f: 'sqrt(x)-1', x0: 4, tol: 1e-8, maxIter: 10 });
  assert.equal(s.codigoErro, 'DERIVADA_NAO_FINITA');
  assert.match(s.erro, /explode/);
  assert.match(s.erro, /não é uma tangente horizontal/);
  const ln = E.newton({ f: 'x-x*ln(x)', x0: 0.5, tol: 1e-8, maxIter: 10 });
  assert.equal(ln.codigoErro, 'FUNCAO_NAO_DEFINIDA');
  assert.match(ln.erro, /domínio|negativ/);
  const exp = E.newton({ f: 'exp(x)-3', x0: -10, tol: 1e-6, maxIter: 8 });
  assert.equal(exp.codigoErro, 'FUNCAO_NAO_DEFINIDA');
  assert.match(exp.erro, /faixa/);
});

test('BUG-55 apresentarMotor usa refX e não resolve de novo', () => {
  const A = [[2, 1], [1, 3]], b = [1, 1];
  const t = M.criarEliminacao(A, b, 'nunca');
  let p; do { p = t.avancar(2); } while (!p.feito);
  const exp = t.exportar();
  exp.refX = [9, 8];
  exp.condicao = 1;
  exp.U = null; exp.mult = null;
  const orig = M.gauss;
  let chamadas = 0;
  M.gauss = function () { chamadas++; return orig.apply(this, arguments); };
  try {
    const r = M.apresentarMotor({ A, b, pivoteamento: 'nunca' }, exp);
    assert.equal(chamadas, 0);
    assert.deepEqual(r.resultado.comparacao.comPivo.x, [9, 8]);
  } finally { M.gauss = orig; }
});

test('BUG-56 diminuir e aumentar n preserva A e b', () => {
  const est = { A: [], B: [] };
  const cheia = [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]];
  V.gaussEntrada.gravar(est, cheia, 3);
  const dois = V.gaussEntrada.recortar(est, 2);
  assert.deepEqual(dois, [[1, 2, 4], [5, 6, 8]]);
  V.gaussEntrada.gravar(est, dois, 2);
  assert.deepEqual(V.gaussEntrada.recortar(est, 3), cheia);
});

test('posto inteiro exato continua infinitas; perturbação de 1 ulp não', () => {
  const inf = E.gauss({ A: [[1, 2, 3], [4, 5, 6], [7, 8, 9]], b: [6, 15, 24] });
  assert.equal(inf.resultado.classificacao, 'infinitas_solucoes');
  assert.equal(inf.resultado.postoA, 2);
  assert.equal(inf.resultado.postoAumentada, 2);
  const q = E.gauss({ A: [[1, 1], [1, 1 + 2e-16]], b: [1, 1] });
  assert.equal(q.resultado.classificacao, 'quase_singular');
});

test('orçamento de fotos cabe em 48 MiB, com buffer de reconstrução', () => {
  const n = 1000;
  const A = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
  const b = A.map((_, i) => i);
  const r = M.gauss(A, b, 'automatico', 'coluna');
  assert.ok(r.historico.bytesReservados() <= M.ORCAMENTO_HISTORICO);
  assert.ok(r.historico.fotos() >= 1);
  const op = M.gauss(A, b, 'automatico', 'operacao');
  assert.equal(op.passos.some((p) => p.tipo === 'coluna'), true);
});

test('BUG-53 erro do Worker cai no fallback e termina', async () => {
  global.Blob = class Blob { constructor(parts) { this.parts = parts; } };
  global.URL = { createObjectURL() { return 'blob:teste'; }, revokeObjectURL() {} };
  const casos = [];
  function instalar(tipo) {
    global.Worker = class Worker {
      constructor() {
        const self = this;
        if (tipo === 'construtor') throw new Error('bloqueado');
        setTimeout(() => {
          if (tipo === 'evento' && self.onerror) self.onerror(new Error('evento'));
          if (tipo === 'mensagem' && self.onmessage) self.onmessage({ data: { tipo: 'erro', mensagem: 'script' } });
        }, 0);
      }
      postMessage() { if (tipo === 'post') throw new Error('post'); }
      terminate() {}
    };
  }
  for (const tipo of ['construtor', 'evento', 'mensagem', 'post']) {
    instalar(tipo);
    delete require.cache[require.resolve('../js/visual/gauss-tarefa.js')];
    require('../js/visual/gauss-tarefa.js');
    const r = await new Promise((resolve) => {
      global.Visual.tarefaGauss([[2, 0], [0, 2]], [2, 4], 'automatico', {
        progresso() {},
        fim(exp, via) { resolve({ via, x: exp && exp.x }); },
        erro(m) { resolve({ erro: String(m) }); },
        cancelado() { resolve({ cancelado: true }); },
      });
    });
    casos.push(r);
    assert.equal(r.via, 'fatiado', tipo + ' ' + JSON.stringify(r));
    assert.ok(Math.abs(r.x[0] - 1) < 1e-9, tipo);
  }
});
