'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs'), path = require('path');
require('../js/expressao.js');
['comum', 'bisseccao', 'newton', 'gauss', 'validacao'].forEach((m) => require('../js/metodos/' + m + '.js'));
const M = global.Metodos, E = M.executar;
const APP = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');

test('Bissecção: limite da precisão dupla em vez de "aumente o máximo"', () => {
  for (const p of [{ f: 'x^2-2', a: 1, b: 2 }, { f: 'x^2-3', a: 1, b: 2 }, { f: 'x^3-x-1', a: 1, b: 2 }]) {
    const r = E.bisseccao(Object.assign({ tol: 1e-300, maxIter: 10000, criterio: 'absoluto' }, p));
    assert.equal(r.codigoErro, 'LIMITE_PRECISAO', p.f);
    assert.match(r.erro, /precisão dupla/);
    assert.doesNotMatch(r.erro, /Aumente o máximo/);
    assert.ok(r.passos.length < 1200);
  }
  assert.equal(E.bisseccao({ f: 'x^2-2', a: 1, b: 2, tol: 1e-8, maxIter: 10, criterio: 'absoluto' }).codigoErro, 'NAO_CONVERGIU');
});

test('Newton: estouro ≠ domínio; código coerente; sem aviso de derivada com x0 inválido', () => {
  for (const [f, x0] of [['x^2', 1e200], ['x^3-1', 1e120], ['exp(x)-1', 800], ['x*x*x', 1e150]]) {
    const r = E.newton({ f, x0, tol: 1e-8, maxIter: 50 });
    assert.equal(r.codigoErro, 'ESTOURO_NUMERICO', f); assert.match(r.erro, /estouro numérico \(valor acima de ~1,8e308\)/);
    assert.doesNotMatch(r.erro, /domínio/);
  }
  for (const [f, x0] of [['sqrt(x)-1', -1], ['log(x)', -1]]) {
    const r = E.newton({ f, x0, tol: 1e-8, maxIter: 50 });
    assert.equal(r.codigoErro, 'FUNCAO_NAO_DEFINIDA'); assert.match(r.erro, /domínio/);
    assert.ok(!r.avisos.some((a) => /Derivada calculada/.test(a)));
  }
  const d = E.newton({ f: 'sqrt(x)-1', x0: 0, tol: 1e-8, maxIter: 50 });
  assert.equal(d.codigoErro, 'DERIVADA_NAO_FINITA'); assert.match(d.erro, /f está definida/);
  assert.ok(E.newton({ f: 'x^2-2', x0: 1, tol: 1e-8, maxIter: 50 }).avisos.some((a) => /Derivada calculada/.test(a)));
});

test('maxIter não inteiro avisa o arredondamento', () => {
  for (const r of [E.bisseccao({ f: 'x^2-2', a: 1, b: 2, tol: 1e-8, maxIter: 2.7 }), E.newton({ f: 'x^2-2', x0: 1, tol: 1e-8, maxIter: '2.7' })]) {
    assert.ok(r.avisos.some((a) => /2,7 foi arredondado para baixo, 2/.test(a)));
  }
  assert.ok(!E.newton({ f: 'x^2-2', x0: 1, tol: 1e-8, maxIter: 5 }).avisos.some((a) => /arredondado/.test(a)));
});

test('Gauss: colar com vírgula decimal sugere ";" ou ponto; det fora da faixa explicado', () => {
  assert.match(M.lerMatrizTexto('1,5 2 3\n4 5 6').erro, /separe as colunas com ";" ou use ponto/);
  assert.doesNotMatch(M.lerMatrizTexto('1 2 3\n4 5').erro, /vírgula/);
  const r = E.gauss({ A: [[1e200, 0], [0, 1e200]], b: [1, 1] });
  assert.equal(r.resultado.determinante, null);
  assert.ok(r.avisos.some((a) => /saiu da faixa do double/.test(a)));
});

test('UI: n ajustado tem aviso visível; Colar pausa o autoplay', () => {
  assert.match(APP, /passa do limite prático de/);
  assert.match(APP, /id = 'aviso-n'/);
  assert.match(APP, /painelColar\.addEventListener\(ev, function \(\) \{ var pl = abas\.gauss\.player; if \(pl && pl\.timer\) pl\.pausar\(\)/);
});
