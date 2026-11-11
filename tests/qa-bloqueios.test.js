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
  const proibido = /múltipla|convergem para x\s*=\s*0|raiz em zero|RAIZ_EM_ZERO/i;
  const semRaiz = [
    ['x^2+1', 1e6, 6], ['1*(x^2+1)', 1e6, 6], ['1e-6*(x^2+1)', 100, 6],
    ['1e6*(x^2+1)', -1e6, 6], ['x^2+1', 1, 1], ['x^2+1', 1e-4, 2],
    ['x^2+1', 50, 9], ['cos(x)+2', 0, 6], ['exp(x)', 0, 6], ['x^2+1e-12', 1e3, 4],
  ];
  for (const [f, x0, maxIter] of semRaiz) {
    for (const criterio of ['relativo', 'absoluto']) {
      const r = E.newton({ f, x0, tol: 1e-6, maxIter, criterio });
      const texto = (r.erro || '') + ' ' + (r.avisos || []).join(' ');
      assert.equal(r.resultado.convergiu, false, f + ' ' + x0 + ' ' + maxIter + ' ' + criterio);
      assert.notEqual(r.codigoErro, 'RAIZ_EM_ZERO_CRITERIO_RELATIVO');
      assert.doesNotMatch(texto, proibido, texto);
      if (r.codigoErro === 'NAO_CONVERGIU') {
        assert.match(r.erro, /Último x/);
        assert.match(r.erro, /f\(x\)/);
        assert.match(r.erro, /≠ 0 e o critério de parada não foi atingido/);
      }
    }
  }
  const cubo = E.newton({ f: 'x^3-1e-18', x0: 1, tol: 1e-6, maxIter: 9, criterio: 'relativo' });
  assert.notEqual(cubo.codigoErro, 'RAIZ_EM_ZERO_CRITERIO_RELATIVO');
  assert.ok(!(cubo.avisos || []).some((s) => /múltipla/.test(s)));
  const exata = E.newton({ f: 'x^2', x0: 0, tol: 1e-8, maxIter: 5 });
  assert.equal(exata.resultado.zeroObservado, true);
  assert.equal(exata.resultado.raizCertificada, false);
  assert.ok(exata.avisos.some((s) => /não prova multiplicidade/.test(s)));
});

test('BUG-48 derivada 1 com f grande não é horizontal', () => {
  const r = E.newton({ f: 'x+1e20', x0: 0, tol: 1e-6, maxIter: 5, criterio: 'relativo' });
  assert.notEqual(r.codigoErro, 'DERIVADA_ZERO');
  assert.equal(r.resultado.convergiu, true);
  assert.ok(Math.abs(r.resultado.raiz + 1e20) / 1e20 < 1e-6);
});

test('Bissecção: critério atingido mostra raiz aproximada (sem erro); polo só com evidência', () => {
  const casos = [
    { f: 'x/abs(x)', a: -0.2, b: 0.9, tol: 1e-8, maxIter: 80, criterio: 'absoluto' },
    { f: '1/(x-0.3)', a: 0, b: 1, tol: 1e-8, maxIter: 80, criterio: 'absoluto' },
    { f: 'x/2-tan(x)', a: 1, b: 2, tol: 0.01, maxIter: 50 },
    { f: 'exp(x)-3*x', a: 1, b: 2, tol: 1e-5, maxIter: 80 },
  ];
  for (const c of casos) {
    const r = E.bisseccao(c);
    assert.equal(r.codigoErro, null, c.f);
    assert.equal(r.erro, null);
    assert.equal(r.resultado.convergiu, true);
    assert.equal(r.resultado.parada, 'tolerancia_passo');
  }
  const polo = E.bisseccao(casos[1]);
  assert.ok(polo.avisos.some((t) => /Possível descontinuidade \(polo\)/.test(t) && /c = 0,(2999|3000)\d{3}/.test(t)));
  const continua = E.bisseccao({ f: 'x^2-2', a: 1, b: 2, tol: 1e-8, maxIter: 80, criterio: 'absoluto' });
  assert.equal(continua.codigoErro, null);
  assert.ok(!continua.avisos.some((t) => /polo/.test(t)));
  assert.ok(Math.abs(continua.resultado.raiz - Math.SQRT2) < 1e-7);
  const rel = E.bisseccao({ f: 'x^2-2', a: 1, b: 2, tol: 1e-4, maxIter: 80, criterio: 'relativo' });
  assert.equal(rel.passos[0].erroCriterio, null); // erro relativo só a partir de k = 2
  const u = rel.passos[rel.passos.length - 1], p = rel.passos[rel.passos.length - 2];
  assert.ok(Math.abs(u.erroCriterio - Math.abs(u.c - p.c) / Math.abs(u.c)) < 1e-15);
  const zero = E.bisseccao({ f: 'x', a: -1, b: 1, tol: 1e-8, maxIter: 10, criterio: 'absoluto' });
  assert.equal(zero.codigoErro, null);
  assert.equal(zero.resultado.convergiu, true);
  assert.equal(zero.resultado.zeroObservado, true);
  assert.equal(zero.resultado.raizCertificada, false);
  assert.equal(zero.resultado.raiz, 0);
  const extremo = E.bisseccao({ f: 'x', a: 0, b: 1, tol: 1e-6, maxIter: 5 });
  assert.equal(extremo.resultado.zeroObservado, true);
  assert.equal(extremo.resultado.convergiu, true);
  const saltoNoMeio = E.bisseccao({ f: '(x-0.5)/abs(x-0.5)', a: 0, b: 1, tol: 1e-6, maxIter: 40, criterio: 'absoluto' });
  assert.equal(saltoNoMeio.codigoErro, 'FUNCAO_NAO_DEFINIDA');
  assert.equal(saltoNoMeio.resultado, null);
});

test('BUG-50 ponto médio com extremos opostos enormes', () => {
  const r = M.bisseccao(global.Expressao.compilar('x'), -1e308, 1e308, 1, 2, 'absoluto');
  assert.equal(r.passos[0].c, 0);
  assert.ok(Number.isFinite(r.passos[0].erro));
});

test('BUG-54 derivada infinita, domínio e faixa nas iterações', () => {
  const s = E.newton({ f: 'sqrt(x)-1', x0: 4, tol: 1e-8, maxIter: 10 });
  assert.equal(s.codigoErro, 'DERIVADA_NAO_FINITA');
  assert.match(s.erro, /não pode ser calculado/);
  assert.match(s.erro, /não pode ser calculado/);
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

test('histórico fatiado conta o buffer depois de reconstruir', () => {
  const n = 200;
  const A = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 2 : 0)));
  const b = A.map((_, i) => 1);
  const t = M.criarEliminacao(A, b, 'automatico');
  let p; do { p = t.avancar(n); } while (!p.feito);
  const h = M.passosDeMotor(A, b, t.exportar()).historico;
  const fotos = new Set();
  const antes = h.tamanho();
  let k = 0;
  while (k < n && h.em(k) && h.tamanho() === antes) k++;
  if (k < n) assert.equal(h.tamanho(), antes + n * (n + 1) * 8);
  assert.equal(h.bytesReservados(), (h.fotos() + 1) * n * (n + 1) * 8);
  assert.ok(fotos);
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

test('checklist de status: zero, intervalo, observação, limite, derivada e domínio', () => {
  require('../js/metodos/avisos.js');
  require('../js/visual/avisos.js');
  const AV = global.Visual.avisos;
  function titulos(metodo, res) {
    const cat = AV.conteudo(metodo);
    return AV.detectar(metodo, res).map((i) => cat.problemas[i].titulo);
  }
  function junta(res) { return (res.erro || '') + ' ' + (res.avisos || []).join(' '); }

  const intervalo = E.bisseccao({ f: 'x^2-2', a: 1, b: 2, tol: 1e-8, maxIter: 100, criterio: 'relativo' });
  assert.equal(intervalo.resultado.parada, 'tolerancia_passo');
  assert.equal(intervalo.resultado.garantiaMatematica, false);
  assert.deepEqual(titulos('bisseccao', intervalo), []);

  const cresceu = E.bisseccao({ f: '1/(x-0.3)', a: 0, b: 1, tol: 1e-8, maxIter: 80, criterio: 'absoluto' });
  const titsC = titulos('bisseccao', cresceu);
  assert.ok(titsC.includes('Possível descontinuidade (polo)'));

  const salto = E.bisseccao({ f: 'x/abs(x)', a: -0.2, b: 0.9, tol: 1e-8, maxIter: 80, criterio: 'absoluto' });
  assert.equal(salto.resultado.parada, 'tolerancia_passo');
  assert.equal(salto.resultado.convergiu, true);

  function semCertificado(res) {
    assert.equal(res.resultado.zeroObservado, true);
    assert.equal(res.resultado.raizCertificada, false);
    assert.equal(res.resultado.garantiaMatematica, false);
    assert.equal(res.resultado.parada, 'zero_precisao_dupla');
    assert.match(junta(res), /precisão dupla/);
    assert.doesNotMatch(junta(res), /não é raiz|raiz exata|multiplicidade provada|certificada/i);
  }
  semCertificado(E.bisseccao({ f: '1e-200*(x^2+1e-200)', a: 0, b: 1, tol: 1e-8, maxIter: 50, criterio: 'relativo' }));
  semCertificado(E.newton({ f: '1e-200*(x^2+1e-200)', x0: 0, tol: 1e-8, maxIter: 50 }));
  semCertificado(E.newton({ f: '1e-200*exp(x)', x0: -400, tol: 1e-8, maxIter: 5 }));
  semCertificado(E.bisseccao({ f: '1e-200*exp(x)', a: -400, b: -300, tol: 1e-6, maxIter: 20, criterio: 'absoluto' }));
  const under = E.newton({ f: '1e-200*(x^2+1e-200)', x0: 0, tol: 1e-8, maxIter: 5 });
  assert.ok(titulos('newton', under).includes('f e f\' nulos em precisão dupla'));
  assert.match(junta(under), /não prova multiplicidade/);

  const um = E.newton({ f: 'x-1', x0: 2, tol: 1e-8, maxIter: 1, criterio: 'relativo' });
  assert.equal(um.resultado.raiz, 1);
  assert.equal(um.resultado.fRaiz, 0);
  semCertificado(um);
  assert.notEqual(um.codigoErro, 'NAO_CONVERGIU');
  const dois = E.newton({ f: '2*x-4', x0: 0, tol: 1e-8, maxIter: 1 });
  assert.equal(dois.resultado.raiz, 2);
  assert.equal(dois.resultado.fRaiz, 0);
  semCertificado(dois);
  const quad = E.newton({ f: 'x^2-1', x0: 2, tol: 1e-30, maxIter: 6, criterio: 'absoluto' });
  assert.equal(quad.resultado.fRaiz, 0);
  semCertificado(quad);
  const escala = E.newton({ f: '1e-20*(x-1)', x0: 0, tol: 1e-12, maxIter: 1 });
  assert.equal(escala.resultado.fRaiz, 0);
  semCertificado(escala);

  const sem = E.newton({ f: 'x^2+1', x0: 1e6, tol: 1e-6, maxIter: 6, criterio: 'relativo' });
  assert.equal(sem.codigoErro, 'NAO_CONVERGIU');
  assert.equal(sem.resultado.parada, 'limite_iteracoes');
  assert.match(sem.erro, /≠ 0 e o critério de parada não foi atingido/);
  assert.doesNotMatch(sem.erro, /precisão dupla/);
  assert.ok(titulos('newton', sem).includes('Máximo de iterações atingido'));

  const dom = E.newton({ f: 'x-x*ln(x)', x0: 0.5, tol: 1e-8, maxIter: 1 });
  assert.equal(dom.codigoErro, 'FUNCAO_NAO_DEFINIDA');
  assert.equal(dom.resultado.parada, 'dominio_ou_faixa');
  assert.match(dom.erro, /domínio/);
  const faixa = E.newton({ f: 'exp(x)', x0: 1000, tol: 1e-6, maxIter: 1 });
  assert.match(faixa.erro, /faixa/);
  const der = E.newton({ f: 'sqrt(x)-1', x0: 4, tol: 1e-8, maxIter: 10 });
  assert.equal(der.resultado.parada, 'derivada');
  assert.match(der.erro, /não pode ser calculado/);

  const normal = E.newton({ f: 'x^2-2', x0: 1, tol: 1e-8, maxIter: 20 });
  assert.equal(normal.codigoErro, null);
  assert.equal(normal.resultado.parada, 'tolerancia_passo');
  assert.equal(normal.resultado.zeroObservado, false);
  assert.equal(normal.resultado.raizCertificada, false);
  assert.ok(Math.abs(normal.resultado.raiz - Math.SQRT2) < 1e-6);
});
