// Exercícios das listas 4 (bisseção) e 5 (Newton) contra window.Metodos.
// Gabarito: /workspace/qa-metodos-numericos/lista_ref.py (mpmath, 50 dígitos para a raiz; iterações em float64).
// v5 (QA): cada exercício roda com criterio explícito, 'absoluto' e 'relativo' (contrato §19, desigualdade estrita;
// na bisseção x_k = c_k e a 1ª iteração do relativo não para). Expectativas de lista_ref.json, conferidas de forma
// independente por v5_rel.py (reimplementação do §19). Antes (v4) os testes chamavam executar sem critério e
// presumiam o absoluto como padrão; o padrão agora é o relativo (teste próprio no fim).
// Rodar: node --test tests/lista-exercicios.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const carregar = require('./carregar.cjs');
const { M } = carregar();

const CASOS = [
 {
  "id": "L4-1",
  "metodo": "bis",
  "f": "exp(x)-3*x",
  "tol": 1e-05,
  "N": 20,
  "raiz_ref": 1.5121345516578424,
  "a": 1,
  "b": 2,
  "abs": {
   "it": 17,
   "x": 1.5121383666992188
  },
  "rel": {
   "it": 17,
   "x": 1.5121383666992188
  }
 },
 {
  "id": "L4-2a",
  "metodo": "bis",
  "f": "x/2-tan(x)",
  "tol": 0.0001,
  "N": 20,
  "raiz_ref": 4.274782271458128,
  "a": 4,
  "b": 4.5,
  "abs": {
   "it": 13,
   "x": 4.27484130859375
  },
  "rel": {
   "it": 11,
   "x": 4.274658203125
  }
 },
 {
  "id": "L4-2b",
  "metodo": "bis",
  "f": "2*cos(x)-exp(x)/2",
  "tol": 0.0001,
  "N": 20,
  "raiz_ref": 0.9047882178730189,
  "a": 0,
  "b": 1,
  "abs": {
   "it": 14,
   "x": 0.90484619140625
  },
  "rel": {
   "it": 14,
   "x": 0.90484619140625
  }
 },
 {
  "id": "L4-2c",
  "metodo": "bis",
  "f": "x^5-6",
  "tol": 0.0001,
  "N": 20,
  "raiz_ref": 1.4309690811052556,
  "a": 1,
  "b": 2,
  "abs": {
   "it": 14,
   "x": 1.43096923828125
  },
  "rel": {
   "it": 13,
   "x": 1.4310302734375
  }
 },
 {
  "id": "L4-3",
  "metodo": "bis",
  "f": "x*log10(x)-1",
  "tol": 0.0005,
  "N": 15,
  "raiz_ref": 2.5061841455887692,
  "a": 2,
  "b": 3,
  "abs": {
   "it": 11,
   "x": 2.50634765625
  },
  "rel": {
   "it": 10,
   "x": 2.5068359375
  }
 },
 {
  "id": "L4-4",
  "metodo": "bis",
  "f": "x^3-9*x+3",
  "tol": 0.001,
  "N": 15,
  "raiz_ref": 0.33760895596583773,
  "a": 0,
  "b": 1,
  "abs": {
   "it": 10,
   "x": 0.3369140625
  },
  "rel": {
   "it": 12,
   "x": 0.337646484375
  }
 },
 {
  "id": "L5-5b",
  "metodo": "bis",
  "f": "1+sin(x)-x",
  "tol": 0.01,
  "N": 20,
  "raiz_ref": 1.9345632107520243,
  "a": 1,
  "b": 2,
  "abs": {
   "it": 7,
   "x": 1.9296875
  },
  "rel": {
   "it": 6,
   "x": 1.921875
  }
 },
 {
  "id": "L5-1",
  "metodo": "new",
  "f": "exp(x)-3*x",
  "tol": 1e-07,
  "N": 10,
  "raiz_ref": 1.5121345516578424,
  "x0": 2,
  "abs": {
   "it": 6,
   "x": 1.512134551657842
  },
  "rel": {
   "it": 6,
   "x": 1.512134551657842
  }
 },
 {
  "id": "L5-2a",
  "metodo": "new",
  "f": "x/2-tan(x)",
  "tol": 0.0001,
  "N": 10,
  "raiz_ref": 4.274782271458128,
  "x0": 4.5,
  "abs": {
   "it": 5,
   "x": 4.274782271846084
  },
  "rel": {
   "it": 5,
   "x": 4.274782271846084
  }
 },
 {
  "id": "L5-2b",
  "metodo": "new",
  "f": "2*cos(x)-exp(x)/2",
  "tol": 0.0001,
  "N": 10,
  "raiz_ref": 0.9047882178730189,
  "x0": 1,
  "abs": {
   "it": 3,
   "x": 0.9047882178880454
  },
  "rel": {
   "it": 3,
   "x": 0.9047882178880454
  }
 },
 {
  "id": "L5-2c",
  "metodo": "new",
  "f": "x^5-6",
  "tol": 0.0001,
  "N": 10,
  "raiz_ref": 1.4309690811052556,
  "x0": 1.5,
  "abs": {
   "it": 3,
   "x": 1.4309690847443628
  },
  "rel": {
   "it": 3,
   "x": 1.4309690847443628
  }
 },
 {
  "id": "L5-3",
  "metodo": "new",
  "f": "x^3-2*x^2-3*x+10",
  "tol": 0.0001,
  "N": 10,
  "raiz_ref": -2.0,
  "x0": 1.9,
  "abs": {
   "it": 10,
   "x": -2.0000000000000018
  },
  "rel": {
   "it": 10,
   "x": -2.0000000000000018
  }
 },
 {
  "id": "L5-4",
  "metodo": "new",
  "f": "x-x*ln(x)",
  "tol": 1e-05,
  "N": 10,
  "raiz_ref": 2.718281828459045,
  "x0": 2,
  "abs": {
   "it": 4,
   "x": 2.718281828461957
  },
  "rel": {
   "it": 4,
   "x": 2.718281828461957
  }
 },
 {
  "id": "L5-5c",
  "metodo": "new",
  "f": "1+sin(x)-x",
  "tol": 0.01,
  "N": 10,
  "raiz_ref": 1.9345632107520243,
  "x0": 2,
  "abs": {
   "it": 2,
   "x": 1.9345638738197013
  },
  "rel": {
   "it": 2,
   "x": 1.9345638738197013
  }
 },
 {
  "id": "L5-9",
  "metodo": "new",
  "f": "4*cos(x)-exp(x)",
  "tol": 0.01,
  "N": 10,
  "raiz_ref": 0.9047882178730189,
  "x0": 1,
  "abs": {
   "it": 2,
   "x": 0.9047940616723674
  },
  "rel": {
   "it": 2,
   "x": 0.9047940616723674
  }
 }
];

function rodar(c, criterio) {
  const p = c.metodo === 'bis'
    ? { f: c.f, a: c.a, b: c.b, tol: c.tol, maxIter: c.N }
    : { f: c.f, x0: c.x0, tol: c.tol, maxIter: c.N };
  if (criterio !== undefined) p.criterio = criterio;
  return c.metodo === 'bis' ? M.executar.bisseccao(p) : M.executar.newton(p);
}
const ROT = { absoluto: 'abs', relativo: 'rel' };

for (const c of CASOS) {
  for (const criterio of ['absoluto', 'relativo']) {
    const esp = c[ROT[criterio]];
    test(`${c.id} [${criterio}]: ${c.f} (${c.metodo === 'bis' ? `[${c.a}, ${c.b}]` : `x0 = ${c.x0}`}, ε = ${c.tol}, N = ${c.N})`, () => {
      const r = rodar(c, criterio);
      assert.strictEqual(r.erro, null, 'não deveria haver erro: ' + r.erro);
      assert.strictEqual(r.resultado.convergiu, true);
      assert.strictEqual(r.resultado.criterio, criterio);
      assert.strictEqual(r.resultado.iteracoes, esp.it, `iterações (${criterio})`);
      assert.ok(Math.abs(r.resultado.raiz - esp.x) <= 1e-12 * Math.max(1, Math.abs(esp.x)), `raiz ${r.resultado.raiz} ≠ ${esp.x}`);
      if (criterio === 'absoluto') assert.ok(Math.abs(r.resultado.raiz - c.raiz_ref) <= c.tol, `|raiz − ref| > ε`);
    });
  }
}

test('executar sem criterio usa o relativo (novo padrão)', () => {
  for (const c of CASOS) {
    const r = rodar(c);
    assert.strictEqual(r.resultado.criterio, 'relativo', c.id);
    assert.strictEqual(r.resultado.iteracoes, c.rel.it, c.id);
  }
});

// v6 (QA): após a §20 (BUG-29), a estimativa só existe no critério absoluto.
test('L5-5(b) [absoluto]: estimativa teórica da bisseção em (1,2) com tol = 0,01 é 7 = ⌈log2(1/0,01)⌉', () => {
  const r = M.executar.bisseccao({ f: '1+sin(x)-x', a: 1, b: 2, tol: 0.01, maxIter: 20, criterio: 'absoluto' });
  assert.strictEqual(r.resultado.iteracoesEstimadas, Math.ceil(Math.log2((2 - 1) / 0.01)));
  assert.strictEqual(r.resultado.iteracoesEstimadas, 7);
});

test('L5-5(b) [relativo]: iteracoesEstimadas é null (§20, BUG-29)', () => {
  const r = M.executar.bisseccao({ f: '1+sin(x)-x', a: 1, b: 2, tol: 0.01, maxIter: 20, criterio: 'relativo' });
  assert.strictEqual(r.erro, null);
  assert.strictEqual(r.resultado.iteracoesEstimadas, null);
});

test('L5-3: Newton em x0 = 1,9 salta para x1 ≈ −15,2 mas converge para a única raiz real −2 (sem raiz falsa)', () => {
  const r = M.executar.newton({ f: 'x^3-2*x^2-3*x+10', x0: 1.9, tol: 1e-4, maxIter: 10 });
  assert.strictEqual(r.erro, null);
  assert.ok(Math.abs(r.resultado.raiz + 2) < 1e-4);
  assert.ok(Math.abs(r.passos[0].xNovo + 15.2261) < 1e-3, 'x1 ≈ −15,2261');
});

test('L5-3 com N = 9: não atinge ε e o site avisa (não declara convergência)', () => {
  const r = M.executar.newton({ f: 'x^3-2*x^2-3*x+10', x0: 1.9, tol: 1e-4, maxIter: 9 });
  assert.strictEqual(r.resultado.convergiu, false);
  assert.ok(r.erro);
});

test('L4-2(a) armadilha: intervalo [1, 2] contém a assíntota π/2 — o site NÃO deve devolver π/2 como raiz', () => {
  const r = M.executar.bisseccao({ f: 'x/2-tan(x)', a: 1, b: 2, tol: 1e-4, maxIter: 20 });
  const ok = !!r.erro || (r.resultado && Math.abs(r.resultado.fRaiz) < 1);
  assert.ok(ok, `site devolveu raiz ${r.resultado && r.resultado.raiz} com f = ${r.resultado && r.resultado.fRaiz} e sem erro`);
});

test('L4-2(a) [0, 1]: x = 0 é raiz exata (não positiva) e o site informa isso', () => {
  const r = M.executar.bisseccao({ f: 'x/2-tan(x)', a: 0, b: 1, tol: 1e-4, maxIter: 20 });
  assert.strictEqual(r.resultado.raiz, 0);
  assert.strictEqual(r.resultado.motivo, 'RAIZ_EXATA');
});

test('L5-4 com x0 = 0,5: x1 < 0 sai do domínio de ln; a mensagem não deve mostrar "NaN"', () => {
  const r = M.executar.newton({ f: 'x-x*ln(x)', x0: 0.5, tol: 1e-5, maxIter: 10 });
  assert.ok(r.erro, 'deveria haver erro');
  assert.ok(!/NaN/.test(r.erro), 'mensagem: ' + r.erro);
});
