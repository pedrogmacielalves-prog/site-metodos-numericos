const test = require('node:test'), assert = require('node:assert');
const { M } = require('./carregar.cjs')();
const perto = (a, b, tol) => assert.ok(Math.abs(a - b) < tol, `${a} ≠ ${b}`);

// ---------- Bissecção
test('bissecção: x^2-2 em [1,2] ≈ √2', () => {
  const r = M.executar.bisseccao({ f: 'x^2 - 2', a: 1, b: 2, tol: 1e-6, maxIter: 100, criterio: 'absoluto' });
  assert.strictEqual(r.erro, null); perto(r.resultado.raiz, Math.SQRT2, 1e-6);
  assert.strictEqual(r.resultado.iteracoesEstimadas, 20);
  const p = r.passos[0];
  assert.deepStrictEqual([p.k, p.a, p.b, p.c, p.manter], [1, 1, 2, 1.5, 'esquerda']);
  assert.ok('erroRelativo' in p && 'descricao' in p);
});
test('bissecção: sem troca de sinal → SEM_TROCA_DE_SINAL', () => {
  const r = M.executar.bisseccao({ f: 'x^2 + 1', a: -1, b: 1, tol: 1e-6, maxIter: 50 });
  assert.strictEqual(r.codigoErro, 'SEM_TROCA_DE_SINAL'); assert.match(r.erro, /mesmo sinal/);
});
test('bissecção: extremos invertidos, raiz exata e não finito', () => {
  assert.strictEqual(M.executar.bisseccao({ f: 'x^2-2', a: 2, b: 1, tol: 1e-6, maxIter: 100 }).avisos.length, 1);
  assert.strictEqual(M.executar.bisseccao({ f: 'x-1', a: 1, b: 3, tol: 1e-6, maxIter: 100 }).resultado.motivo, 'RAIZ_EXATA');
  assert.strictEqual(M.executar.bisseccao({ f: '1/x', a: -1, b: 0, tol: 1e-6, maxIter: 100 }).codigoErro, 'FUNCAO_NAO_DEFINIDA');
  assert.strictEqual(M.executar.bisseccao({ f: 'x^2-2', a: 1, b: 2, tol: 1e-12, maxIter: 5 }).codigoErro, 'NAO_CONVERGIU');
});
test('bissecção: função principal pura', () => {
  const r = M.bisseccao((x) => x * x - 2, 1, 2, 1e-6, 100);
  assert.ok(r.convergiu); perto(r.raiz, Math.SQRT2, 1e-6);
});

// ---------- Newton
test('newton: x^2-2 com derivada simbólica, fornecida e numérica', () => {
  for (const extra of [{}, { df: '2x' }, { derivadaNumerica: true }]) {
    const r = M.executar.newton({ f: 'x^2 - 2', x0: 1, tol: 1e-10, maxIter: 50, ...extra });
    assert.strictEqual(r.erro, null); perto(r.resultado.raiz, Math.SQRT2, 1e-9);
  }
  const r = M.executar.newton({ f: 'x^2 - 2', x0: 1, tol: 1e-10, maxIter: 50 });
  assert.strictEqual(r.resultado.tipoDerivada, 'simbolica'); assert.strictEqual(r.resultado.derivadaTexto, '2 * x');
  const p = r.passos[0];
  assert.deepStrictEqual([p.k, p.x, p.fx, p.dfx, p.xNovo], [0, 1, -1, 2, 1.5]);
  assert.deepStrictEqual({ ...p.tangente }, { inclinacao: 2, intercepto: -3 });
});
test('newton: derivada zero (x^3-1 com x0=0)', () => {
  const r = M.executar.newton({ f: 'x^3 - 1', x0: 0, tol: 1e-8, maxIter: 50 });
  assert.strictEqual(r.codigoErro, 'DERIVADA_ZERO'); assert.match(r.erro, /Derivada/);
});
test('newton: x^3 com x0=0 já é raiz exata (com aviso de derivada zero)', () => {
  const r = M.executar.newton({ f: 'x^3', x0: 0, tol: 1e-8, maxIter: 50 });
  assert.strictEqual(r.resultado.motivo, 'RAIZ_EXATA'); assert.ok(r.avisos.some((a) => /derivada também é zero/.test(a)));
});
test('newton: divergência em atan(x) com x0=2', () => {
  assert.strictEqual(M.executar.newton({ f: 'atan(x)', x0: 2, tol: 1e-8, maxIter: 50 }).codigoErro, 'DIVERGENCIA');
});
test('newton: divergência em cbrt(x) com x0=1', () => {
  assert.strictEqual(M.executar.newton({ f: 'cbrt(x)', x0: 1, tol: 1e-8, maxIter: 100 }).codigoErro, 'DIVERGENCIA');
});
test('newton: oscilação em x^3-2x+2 com x0=0', () => {
  assert.strictEqual(M.executar.newton({ f: 'x^3 - 2x + 2', x0: 0, tol: 1e-8, maxIter: 20 }).codigoErro, 'OSCILACAO');
});
test('newton: f não definida e sintaxe inválida', () => {
  assert.strictEqual(M.executar.newton({ f: 'ln(x)', x0: -1, tol: 1e-8, maxIter: 20 }).codigoErro, 'FUNCAO_NAO_DEFINIDA');
  assert.strictEqual(M.executar.newton({ f: 'alert(1)', x0: 1, tol: 1e-8, maxIter: 20 }).codigoErro, 'ERRO_SINTAXE');
});

// ---------- Gauss
test('gauss: 3×3 conhecido → (2, 3, −1), com e sem pivoteamento', () => {
  for (const piv of [false, true]) {
    const r = M.executar.gauss({ matriz: [[2, 1, -1, 8], [-3, -1, 2, -11], [-2, 1, 2, -3]], pivoteamento: piv });
    assert.strictEqual(r.erro, null);
    [2, 3, -1].forEach((v, i) => perto(r.resultado.x[i], v, 1e-9));
    perto(r.resultado.determinante, -1, 1e-9); assert.ok(r.resultado.residuo < 1e-12);
    assert.strictEqual(r.passos[0].tipo, 'inicio'); assert.strictEqual(r.passos.at(-1).tipo, 'fim');
    const e = r.passos.find((s) => s.tipo === 'eliminacao');
    assert.ok(Array.isArray(e.matriz) && e.pivo && typeof e.fator === 'number' && /L\d ← L\d − \(/.test(e.descricao));
    if (piv) assert.ok(r.passos.some((s) => s.tipo === 'troca'));
  }
});
test('gauss: caso que exige pivoteamento (pivô zero)', () => {
  const r = M.executar.gauss({ A: [[0, 1], [1, 1]], b: [1, 2], pivoteamento: 'automatico' });
  assert.strictEqual(r.erro, null); assert.ok(r.passos.some((s) => s.tipo === 'troca'));
  perto(r.resultado.x[0], 1, 1e-12); perto(r.resultado.x[1], 1, 1e-12);
  // pivô minúsculo: sem pivoteamento perde precisão; com parcial, acerta
  const A = [[1e-11, 1], [1, 1]], b = [1, 2];
  const sem = M.gauss(A, b, 'nunca').x, com = M.gauss(A, b, 'sempre').x;
  assert.ok(Math.abs(sem[0] - 1) > 1e-8, `sem pivoteamento: ${sem[0]}`); perto(com[0], 1, 1e-9);
});
test('gauss: singular → impossível vs infinitas soluções', () => {
  const imp = M.executar.gauss({ A: [[1, 1], [2, 2]], b: [1, 3] });
  assert.strictEqual(imp.codigoErro, 'MATRIZ_SINGULAR'); assert.strictEqual(imp.resultado.classificacao, 'impossivel'); assert.match(imp.erro, /singular/);
  assert.strictEqual(M.executar.gauss({ A: [[1, 1], [2, 2]], b: [1, 2] }).resultado.classificacao, 'infinitas_solucoes');
});
test('gauss: validação de dimensões', () => {
  assert.strictEqual(M.executar.gauss({ A: [[1, 2, 3], [4, 5, 6]], b: [1, 2] }).codigoErro, 'MATRIZ_NAO_QUADRADA');
  assert.strictEqual(M.executar.gauss({ A: [[1, 0], [0, 1]], b: [1, 2, 3] }).codigoErro, 'DIMENSOES_INCOMPATIVEIS');
  assert.strictEqual(M.executar.gauss({ A: [[NaN, 0], [0, 1]], b: [1, 1] }).codigoErro, 'ENTRADA_INVALIDA');
  assert.strictEqual(M.executar.gauss({ A: [[1]], b: [1] }).codigoErro, 'ENTRADA_INVALIDA'); // n < 2
  const g101 = M.gerarSistema(100, 1);
  const A101 = [...g101.A.map((l) => [...l, 0]), Array(101).fill(1)];
  assert.strictEqual(M.executar.gauss({ A: A101, b: [...g101.b, 1] }).codigoErro, 'ENTRADA_INVALIDA'); // n > 100
});

// ---------- "Ver código": legibilidade e marcadores de linha
test('Ver código: nenhuma linha das funções principais passa de 70 caracteres', () => {
  for (const m of ['bisseccao', 'newton', 'gauss', 'escolherPivo']) {
    M[m].toString().split('\n').forEach((l, i) => assert.ok(l.length <= 70, `${m}, linha ${i + 1} (${l.length}): ${l}`));
  }
});

// Linha que o codigo.js do Dev destaca para um marcador: o próprio comentário @etapa
// é pulado e vale a 1ª linha de código depois dele.
function linhaDoMarcador(fonte, nome) {
  const linhas = fonte.split('\n');
  let i = linhas.findIndex((l) => new RegExp('@etapa:' + nome + '\\b').test(l));
  if (i < 0) return -1;
  while (i < linhas.length - 1 && /^(\/\/|\/\*|\*|$)/.test(linhas[i].trim())) i++;
  return i;
}
test('Ver código: cada tipo de passo encontra sua linha marcada (mesmo mapeamento de js/visual/codigo.js)', () => {
  const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
  const ctx = { console, document: {}, navigator: {} }; ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js/visual/codigo.js'), 'utf8'), ctx);
  const linha = (m, p) => ctx.Visual.linhaDoPasso(m, M[m].toString(), p);
  const casos = {
    bisseccao: [M.executar.bisseccao({ f: 'x^2-2', a: 1, b: 2, tol: 1e-3, maxIter: 50 }), 'etapa'],
    newton: [M.executar.newton({ f: 'x^2-2', x0: 1, tol: 1e-8, maxIter: 50 }), 'etapa'],
    gauss: [M.executar.gauss({ A: [[0, 1, 2], [1, 1, 1], [2, 1, 3]], b: [1, 2, 3], pivoteamento: true }), null],
  };
  for (const [m, [r, tag]] of Object.entries(casos)) {
    const fonte = M[m].toString().split('\n');
    const tipos = new Set();
    for (const p of r.passos) {
      const i = linha(m, p);
      assert.ok(i >= 0, `${m}: passo ${p.tipo || p.k} sem linha`);
      assert.strictEqual(i, linhaDoMarcador(M[m].toString(), tag ? p[tag] : p.etapa));
      tipos.add(p.tipo);
    }
    if (m === 'gauss') assert.deepStrictEqual([...tipos].sort(), ['eliminacao', 'fim', 'inicio', 'pivo', 'substituicao', 'troca']);
  }
});

// ---------- Regressões do relatório de QA v1
test('BUG-01: atan(x) com x0=1.5 é DIVERGENCIA (não derivada zero)', () => {
  const r = M.executar.newton({ f: 'atan(x)', x0: 1.5, tol: 1e-6, maxIter: 100 });
  assert.strictEqual(r.codigoErro, 'DIVERGENCIA'); assert.match(r.erro, /divergiu/);
  assert.strictEqual(M.newton(Math.atan, (x) => 1 / (1 + x * x), 1.5, 1e-6, 100).motivo, 'DIVERGENCIA');
  // derivada nula continua sendo detectada
  assert.strictEqual(M.executar.newton({ f: 'x^2-2', x0: 0, tol: 1e-6, maxIter: 100 }).codigoErro, 'DERIVADA_ZERO');
});
test('BUG-04: pré-condições matemáticas dentro das funções principais', () => {
  const b = M.bisseccao((x) => x * x + 1, -1, 1, 1e-6, 100);
  assert.strictEqual(b.motivo, 'SEM_TROCA_DE_SINAL'); assert.strictEqual(b.passos.length, 0);
  assert.strictEqual(M.newton((x) => x * x - 2, (x) => 2 * x, 0, 1e-6, 50).motivo, 'DERIVADA_ZERO');
  assert.strictEqual(M.gauss([[1, 2], [2, 4]], [1, 2]).motivo, 'MATRIZ_SINGULAR');
  for (const m of ['bisseccao', 'newton', 'gauss']) assert.match(M[m].toString(), /Pré-condição|Divergência/);
});
test('BUG-06: raiz múltipla avisa convergência linear', () => {
  const r = M.executar.newton({ f: '(x-1)^2', x0: 2, tol: 1e-6, maxIter: 100 });
  assert.strictEqual(r.resultado.iteracoes, 20); assert.ok(r.avisos.some((a) => /raiz múltipla/.test(a)));
  assert.ok(!M.executar.newton({ f: 'x^2-2', x0: 1, tol: 1e-10, maxIter: 50 }).avisos.some((a) => /múltipla/.test(a)));
});
test('BUG-07: mensagem sem "NaN"', () => {
  const r = M.executar.bisseccao({ f: 'sqrt(x)-1', a: -1, b: 4, tol: 1e-6, maxIter: 100 });
  assert.strictEqual(r.codigoErro, 'FUNCAO_NAO_DEFINIDA'); assert.doesNotMatch(r.erro, /NaN/); assert.match(r.erro, /x = −1/);
});
test('BUG-08: vírgula decimal aceita nos campos numéricos', () => {
  assert.strictEqual(M.executar.bisseccao({ f: 'x^2-2', a: '1,0', b: '2', tol: '1e-6', maxIter: '100' }).erro, null);
  assert.strictEqual(M.executar.gauss({ A: [['2', '1,5'], [1, -3]], b: [5, -1] }).erro, null);
});
test('BUG-10: raiz no extremo não exibe estimativa teórica', () => {
  const r = M.executar.bisseccao({ f: 'x^2-4', a: 2, b: 3, tol: 1e-6, maxIter: 100 });
  assert.strictEqual(r.resultado.iteracoes, 0); assert.strictEqual(r.resultado.iteracoesEstimadas, null);
});
test('BUG-11: erro de célula indica linha e coluna', () => {
  assert.match(M.executar.gauss({ A: [[1, 2], [3, 'abc']], b: [1, 2] }).erro, /linha 2, coluna 2/);
  assert.match(M.executar.gauss({ matriz: [[1, 2, 3], [3, 4, '']] }).erro, /linha 2, coluna b/);
});
test('BUG-12: último passo da bissecção anuncia o critério atingido', () => {
  const r = M.executar.bisseccao({ f: 'x^3-x-2', a: 1, b: 2, tol: 1e-6, maxIter: 100, criterio: 'absoluto' });
  assert.match(r.passos.at(-1).descricao, /critério atingido/);
  const rel = M.executar.bisseccao({ f: 'x^3-x-2', a: 1, b: 2, tol: 1e-6, maxIter: 100 });
  assert.match(rel.passos.at(-1).descricao, /critério relativo atingido/);
  assert.doesNotMatch(r.passos.at(-2).descricao, /critério/);
});

// ---------- Gauss: granularidade por coluna (n > 10) e matriz colada
function sistema(n) {
  const A = [], b = [];
  for (let i = 0; i < n; i++) {
    A.push([]); let s = 0;
    for (let j = 0; j < n; j++) { const a = i === j ? n + 2 : ((i + 2 * j) % 3) - 1; A[i].push(a); s += a * (j + 1); }
    b.push(s);
  }
  return { A, b };
}
test('gauss: n > 10 usa automaticamente um passo por coluna', () => {
  const { A, b } = sistema(12);
  const r = M.executar.gauss(A, b, {});
  assert.strictEqual(r.erro, null); assert.strictEqual(r.resultado.granularidade, 'coluna');
  r.resultado.x.forEach((v, i) => perto(v, i + 1, 1e-9));
  const tipos = Array.from(r.passos, (s) => s.tipo);
  assert.deepStrictEqual(tipos, ['inicio', ...Array(12).fill('coluna'), 'substituicao', 'fim']);
  const c = r.passos[1];
  assert.strictEqual(c.k, 0); assert.ok(c.pivo && 'valor' in c.pivo);
  assert.ok(c.troca === null || c.troca.length === 2);
  assert.strictEqual(c.fatores.length, 11); assert.ok('linha' in c.fatores[0] && 'fator' in c.fatores[0]);
  assert.strictEqual(r.passos.filter((s) => s.matriz).length, 1 + 12 + 1 + 1);
  assert.ok(r.passos[13].x.every((v) => v !== null));
  // passos 'coluna' apontam para a linha de eliminação no Ver código
  const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
  const ctx = { console, document: {}, navigator: {} }; ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js/visual/codigo.js'), 'utf8'), ctx);
  const fonte = M.gauss.toString();
  assert.strictEqual(ctx.Visual.linhaDoPasso('gauss', fonte, c), linhaDoMarcador(fonte, 'eliminacao'));
});
test('gauss: granularidade explícita e n ≤ 10 inalterado', () => {
  const { A, b } = sistema(12);
  assert.strictEqual(M.executar.gauss(A, b, { granularidade: 'operacao' }).resultado.granularidade, 'operacao');
  const p = sistema(3);
  const r = M.executar.gauss(p.A, p.b);
  assert.ok(r.passos.some((s) => s.tipo === 'eliminacao')); assert.strictEqual(r.resultado.granularidade, 'operacao');
  assert.strictEqual(M.executar.gauss(p.A, p.b, { granularidade: 'coluna' }).passos.filter((s) => s.tipo === 'coluna').length, 3);
  assert.strictEqual(M.executar.gauss(p.A, p.b, { granularidade: 'xyz' }).codigoErro, 'ENTRADA_INVALIDA');
});
test('lerMatrizTexto: Excel (TAB, vírgula decimal), CSV e erros', () => {
  const ex = M.lerMatrizTexto('2\t1,5\t5\n1\t-3\t-1\n');
  assert.strictEqual(ex.erro, null); assert.deepStrictEqual(JSON.parse(JSON.stringify([ex.A, ex.b])), [[[2, 1.5], [1, -3]], [5, -1]]);
  const csv = M.lerMatrizTexto('1,2\n3,4');
  assert.deepStrictEqual(JSON.parse(JSON.stringify([csv.A, csv.b])), [[[1, 2], [3, 4]], null]);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(M.lerMatrizTexto('1 2 3\n4 5 6').b)), [3, 6]);
  assert.match(M.lerMatrizTexto('1;x\n2;3').erro, /Linha 1, coluna 2/);
  assert.strictEqual(M.lerMatrizTexto('1 2\n3').codigoErro, 'MATRIZ_TEXTO_INVALIDA');
  assert.strictEqual(M.lerMatrizTexto('').codigoErro, 'MATRIZ_TEXTO_INVALIDA');
});

// ---------- Gauss até 100×100: gerador, desempenho, memória, leitura de texto
test('gerarSistema: reprodutível, inteiro, diagonal estritamente dominante', () => {
  const s1 = M.gerarSistema(30, 7), s2 = M.gerarSistema(30, 7);
  assert.strictEqual(JSON.stringify(s1), JSON.stringify(s2));
  assert.notStrictEqual(JSON.stringify(M.gerarSistema(30, 8)), JSON.stringify(s1));
  s1.A.forEach((l, i) => {
    assert.ok(l.every(Number.isInteger));
    const fora = l.reduce((s, v, j) => s + (j === i ? 0 : Math.abs(v)), 0);
    assert.ok(Math.abs(l[i]) > fora);
    assert.strictEqual(l.reduce((s, a, j) => s + a * s1.x[j], 0), s1.b[i]);
  });
  assert.throws(() => M.gerarSistema(1, 1)); assert.throws(() => M.gerarSistema(101, 1));
});

for (const gran of ['coluna', 'operacao']) {
  test(`gauss n=100 (${gran}): rápido, resíduo pequeno, solução inteira`, () => {
    const { A, b, x } = M.gerarSistema(100, 2026);
    M.copiasDeMatriz = 0;
    const t0 = performance.now();
    const r = M.executar.gauss(A, b, { granularidade: gran });
    const ms = performance.now() - t0;
    assert.strictEqual(r.erro, null);
    assert.ok(ms < (gran === 'coluna' ? 300 : 1000), `${ms} ms`);
    const nb = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
    assert.ok(r.resultado.residuo / nb < 1e-10);
    assert.deepStrictEqual(Array.from(r.resultado.x, (v) => Math.round(v) + 0), [...x]);
    if (gran === 'coluna') {
      assert.strictEqual(r.passos.filter((p) => p.tipo === 'coluna').length, 100);
      assert.ok(M.copiasDeMatriz <= 103, `${M.copiasDeMatriz} cópias`);
      assert.strictEqual(r.passos[1].fatores.length, 99);
    }
  });
}

test('gauss coluna x operacao: mesma solução; coluna n=4 tem 4 passos de coluna', () => {
  const { A, b } = M.gerarSistema(4, 3);
  const c = M.executar.gauss(A, b, { granularidade: 'coluna' });
  const o = M.executar.gauss(A, b, { granularidade: 'operacao' });
  assert.deepStrictEqual(Array.from(c.resultado.x), Array.from(o.resultado.x));
  assert.deepStrictEqual([...c.passos.map((p) => p.tipo)], ['inicio', 'coluna', 'coluna', 'coluna', 'coluna', 'substituicao', 'fim']);
  assert.deepStrictEqual(c.passos[4].matriz.map((l) => [...l]), o.passos.find((p) => p.tipo === 'substituicao').matriz.map((l) => [...l]));
});

test('lerMatrizTexto: separadores, vírgula decimal, limites 2..100', () => {
  const esperado = [[1, 2], [3, 4]];
  for (const sep of ['\t', ';', '|', ' ', ',']) {
    const r = M.lerMatrizTexto(`1${sep}2${sep}5\n3${sep}4${sep}6`);
    assert.strictEqual(r.erro, null, sep + ': ' + r.erro);
    assert.deepStrictEqual([...r.A.map((l) => [...l])], esperado, 'sep ' + JSON.stringify(sep));
    assert.deepStrictEqual([...r.b], [5, 6]);
  }
  assert.deepStrictEqual([...M.lerMatrizTexto('1,5;2\n3;4,25').A[1]], [3, 4.25]);
  assert.deepStrictEqual([...M.lerMatrizTexto('1,5\t2\n3\t4').A[0]], [1.5, 2]);
  assert.strictEqual(M.lerMatrizTexto('7 8').codigoErro, 'MATRIZ_TEXTO_INVALIDA'); // n = 1
  assert.strictEqual(M.lerMatrizTexto('a b\nc d').codigoErro, 'MATRIZ_TEXTO_INVALIDA');
  const linha = (n, v) => Array(n).fill(v).join('\t');
  const t100 = Array.from({ length: 100 }, () => linha(101, 1)).join('\n');
  const r100 = M.lerMatrizTexto(t100);
  assert.strictEqual(r100.A.length, 100); assert.strictEqual(r100.b.length, 100);
  const t101 = Array.from({ length: 101 }, () => linha(102, 1)).join('\n');
  assert.match(M.lerMatrizTexto(t101).erro, /entre 2 e 100/);
});

// ---------- lerSistemaTexto: A e b em textos separados
test('lerSistemaTexto: casos válidos', () => {
  const ok = (r, A, b) => {
    assert.strictEqual(r.erro, null, r.erro); assert.strictEqual(r.campo, null);
    assert.deepStrictEqual([...r.A.map((l) => [...l])], A); assert.deepStrictEqual([...r.b], b);
    assert.strictEqual(r.n, A.length);
  };
  ok(M.lerSistemaTexto('2 1\n1 -3', '5\n-1'), [[2, 1], [1, -3]], [5, -1]);          // b em coluna
  ok(M.lerSistemaTexto('2 1\n1 -3', '5 -1'), [[2, 1], [1, -3]], [5, -1]);           // b em linha (espaço)
  ok(M.lerSistemaTexto('2,1\n1,-3', '5,-1'), [[2, 1], [1, -3]], [5, -1]);           // vírgula separa
  ok(M.lerSistemaTexto('1,5;2\n3;4,25', '0,5;1'), [[1.5, 2], [3, 4.25]], [0.5, 1]); // ; e vírgula decimal
  ok(M.lerSistemaTexto('1,5\t2\n3\t4', '0,5\t1'), [[1.5, 2], [3, 4]], [0.5, 1]);     // TAB
  ok(M.lerSistemaTexto('1 2\n3 4', '0,5\n1,25'), [[1, 2], [3, 4]], [0.5, 1.25]);     // coluna ⇒ vírgula decimal
  const { A, b } = M.gerarSistema(100, 5);
  const r = M.lerSistemaTexto(A.map((l) => l.join('\t')).join('\n'), b.join('\n'));
  assert.strictEqual(r.erro, null); assert.strictEqual(r.n, 100); assert.strictEqual(r.b.length, 100);
});

test('lerSistemaTexto: erros didáticos com campo/linha/coluna', () => {
  const erro = (r, campo, re) => {
    assert.strictEqual(r.codigoErro, 'MATRIZ_TEXTO_INVALIDA'); assert.strictEqual(r.campo, campo);
    assert.match(r.erro, re); assert.strictEqual(r.A, null); assert.strictEqual(r.b, null);
  };
  erro(M.lerSistemaTexto('1 2 3\n4 5 6', '1\n2'), 'A', /A tem 2 linhas, mas a linha 1 tem 3 valores \(A precisa ser quadrada\)/);
  const irr = M.lerSistemaTexto('1 2 3\n4 5 6 7\n8 9 1', '1 2 3');
  erro(irr, 'A', /A tem 3 linhas, mas a linha 2 tem 4 valores/); assert.strictEqual(irr.linha, 2);
  const inv = M.lerSistemaTexto('1 2 3\n4 5 abc\n7 8 9', '1 2 3');
  erro(inv, 'A', /Valor inválido em A, linha 2, coluna 3: "abc"/);
  assert.strictEqual(inv.linha, 2); assert.strictEqual(inv.coluna, 3);
  erro(M.lerSistemaTexto('1 0\n0 1', '1\nxyz'), 'b', /Valor inválido em b, posição 2: "xyz"/);
  erro(M.lerSistemaTexto('1 0 0\n0 1 0\n0 0 1', '1 2'), 'b', /A é 3×3, então b precisa ter 3 valores; encontrei 2/);
  erro(M.lerSistemaTexto('1 0\n0 1', '1\n2\n3'), 'b', /encontrei 3/);
  erro(M.lerSistemaTexto('1 0\n0 1', '1 2\n3 4'), 'b', /um valor por linha/);
  erro(M.lerSistemaTexto('1 0\n0 1', '  \n'), 'b', /^b está vazio$/);
  erro(M.lerSistemaTexto('', '1 2'), 'A', /A está vazia/);
  erro(M.lerSistemaTexto('5', '1'), 'A', /entre 2 e 100/);
  const g = M.gerarSistema(100, 1);
  const A101 = [...g.A.map((l) => [...l, 0]), Array(101).fill(1)].map((l) => l.join(' ')).join('\n');
  erro(M.lerSistemaTexto(A101, Array(101).fill(1).join('\n')), 'A', /entre 2 e 100/);
});

// ---------- BUG-13: sub-etapas de cada iteração (bissecção e Newton)
test('BUG-13: etapa/etapas de cada passo e cada nome encontra sua linha no codigo.js', () => {
  const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
  const ctx = { console, document: {}, navigator: {} }; ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js/visual/codigo.js'), 'utf8'), ctx);
  const nomes = {
    bisseccao: ['pontoMedio', 'testeSinal', 'atualizaIntervalo', 'criterioParada'],
    newton: ['avaliaDerivada', 'passoNewton', 'criterioParada'],
  };
  for (const [m, lista] of Object.entries(nomes)) {
    const fonte = M[m].toString(), vistas = new Set();
    for (const nome of lista) {
      const i = ctx.Visual.linhaDoPasso(m, fonte, { etapa: nome });
      assert.ok(i >= 0 && i === linhaDoMarcador(fonte, nome), `${m}/${nome}`);
      assert.ok(!vistas.has(i), `${m}/${nome}: linha repetida`); vistas.add(i);
    }
  }
  const b = M.executar.bisseccao({ f: 'x^2-2', a: 1, b: 2, tol: 1e-3, maxIter: 50 }).passos;
  b.slice(0, -1).forEach((p) => {
    assert.strictEqual(p.etapa, 'pontoMedio');
    assert.deepStrictEqual([...p.etapas], ['pontoMedio', 'testeSinal', 'atualizaIntervalo']);
  });
  assert.strictEqual(b.at(-1).etapa, 'criterioParada');
  assert.deepStrictEqual([...b.at(-1).etapas], ['pontoMedio', 'testeSinal', 'criterioParada']);
  const n = M.executar.newton({ f: 'x^2-2', x0: 1, tol: 1e-8, maxIter: 50 }).passos;
  n.slice(0, -1).forEach((p) => {
    assert.strictEqual(p.etapa, 'passoNewton'); assert.deepStrictEqual([...p.etapas], ['avaliaDerivada', 'passoNewton']);
  });
  assert.strictEqual(n.at(-1).etapa, 'criterioParada');
  assert.deepStrictEqual([...n.at(-1).etapas], ['avaliaDerivada', 'passoNewton', 'criterioParada']);
});

test('codigosAviso: paralelo a avisos (texto), no topo e em resultado', () => {
  const r = M.executar.bisseccao({ f: 'x^2-4', a: 3, b: 0, tol: 1e-6, maxIter: 50 });
  assert.deepStrictEqual([...r.codigosAviso], ['EXTREMOS_TROCADOS']);
  assert.deepStrictEqual([...r.resultado.codigosAviso], ['EXTREMOS_TROCADOS']);
  assert.strictEqual(typeof r.avisos[0], 'string'); assert.strictEqual(r.avisos.length, 1);
  const e = M.executar.newton({ f: '', x0: 1 });
  assert.deepStrictEqual([...e.codigosAviso], []);
});

// ---------- Avisos (Metodos.textos.avisos) e robustez de diagnóstico
const B = (p) => M.executar.bisseccao(Object.assign({ tol: 1e-6, maxIter: 100 }, p));
const N = (p) => M.executar.newton(Object.assign({ tol: 1e-6, maxIter: 50 }, p));
// Um caso real para cada código citado nos Avisos.
const HILBERT = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => 1 / (i + j + 1)));
const somaLinha = (l) => l.reduce((s, v) => s + v, 0);
const CASOS_CODIGO = {
  bisseccao: {
    SEM_TROCA_DE_SINAL: () => B({ f: '(x-1)^2', a: 0, b: 3 }),
    DESCONTINUIDADE: () => B({ f: 'x/2-tan(x)', a: 1, b: 2, tol: 1e-4, maxIter: 20 }),
    FUNCAO_NAO_DEFINIDA: () => B({ f: '1/x', a: -1, b: 1 }),
    NAO_CONVERGIU: () => B({ f: 'x^2-2', a: 0, b: 2, tol: 1e-12, maxIter: 5 }),
    CRITERIO_RELATIVO_PERTO_DE_ZERO: () => B({ f: 'x', a: -1, b: 0.5, tol: 1e-6, maxIter: 100, criterio: 'relativo' }),
    RAIZ_NO_EXTREMO: () => B({ f: 'x^2-4', a: 0, b: 2 }),
    EXTREMOS_TROCADOS: () => B({ f: 'x^2-4', a: 3, b: 0 }),
  },
  newton: {
    RAIZ_EM_ZERO_CRITERIO_RELATIVO: () => N({ f: 'x^3', x0: 1, tol: 1e-4 }),
    DERIVADA_ZERO: () => N({ f: 'x^3-1', x0: 0 }),
    SALTO_GRANDE: () => N({ f: 'x^3-2x^2-3x+10', x0: 1.9, tol: 1e-4, maxIter: 10 }),
    OSCILACAO: () => N({ f: 'x^3-2x+2', x0: 0 }),
    DIVERGENCIA: () => N({ f: 'atan(x)', x0: 1.5 }),
    FUNCAO_NAO_DEFINIDA: () => N({ f: 'x-x*ln(x)', x0: 0.5, tol: 1e-5, maxIter: 10 }),
    DERIVADA_NAO_DEFINIDA: () => N({ f: 'sqrt(x)-1', x0: 4 }),
    CRITERIO_RELATIVO_PERTO_DE_ZERO: () => N({ f: 'x^3+x', x0: 1, tol: 1e-6, criterio: 'relativo' }),
    NAO_CONVERGIU: () => N({ f: 'x^2-2', x0: 1, maxIter: 2 }),
    CONVERGENCIA_LENTA: () => N({ f: '(x-1)^2', x0: 3 }),
    RAIZ_MULTIPLA: () => N({ f: 'x^3', x0: 0 }),
  },
  gauss: {
    MATRIZ_SINGULAR: () => M.executar.gauss([[1, 2], [2, 4]], [3, 7]),
    SISTEMA_IMPOSSIVEL: () => M.executar.gauss([[1, 2], [2, 4]], [3, 7]),
    SISTEMA_INDETERMINADO: () => M.executar.gauss([[1, 2], [2, 4]], [3, 6]),
    MAL_CONDICIONADA: () => { const A = HILBERT(8); return M.executar.gauss(A, A.map(somaLinha), { pivoteamento: 'sempre' }); },
    MODO_COLUNA: () => { const s = M.gerarSistema(12, 1); return M.executar.gauss(s.A, s.b); },
    PIVO_ZERO_SEM_TROCA: () => M.executar.gauss([[0, 1], [1, 1]], [1, 2], { pivoteamento: 'nunca' }),
    PIVO_PEQUENO_SEM_TROCA: () => M.executar.gauss([[1e-4, 1], [1, 1]], [1, 2], { pivoteamento: 'nunca' }),
  },
};
const MENSAGENS_EXTRA = { gauss: [() => M.executar.gauss([[1, 2], [2, 4]], [3, 6])] };

test('Avisos: estrutura, contagens, textos curtos e não vazios', () => {
  const av = M.textos.avisos;
  assert.deepStrictEqual(Object.keys(av).sort(), ['bisseccao', 'gauss', 'newton']);
  const texto = (s, onde) => {
    assert.strictEqual(typeof s, 'string', onde); assert.ok(s.trim().length > 0, onde);
    assert.ok(s.length <= 140, `${onde}: ${s.length} caracteres`); assert.ok(!/<\/?[a-z]/i.test(s), `${onde}: sem HTML`);
    assert.ok(!/\n/.test(s), `${onde}: uma linha`);
  };
  for (const [m, a] of Object.entries(av)) {
    assert.ok(a.vantagens.length >= 3 && a.vantagens.length <= 5, m);
    assert.ok(a.desvantagens.length >= 3 && a.desvantagens.length <= 5, m);
    assert.ok(a.problemas.length >= 3 && a.problemas.length <= 9, m);
    [...a.vantagens, ...a.desvantagens].forEach((s, i) => texto(s, `${m}[${i}]`));
    const ids = new Set();
    for (const p of a.problemas) {
      assert.match(p.id, /^[a-z0-9]+(-[a-z0-9]+)*$/); assert.ok(!ids.has(p.id), p.id); ids.add(p.id);
      for (const k of ['titulo', 'quando', 'solucao']) texto(p[k], `${m}/${p.id}.${k}`);
      assert.ok(Array.isArray(p.codigos), p.id); p.codigos.forEach((c) => assert.match(c, /^[A-Z_]+$/));
      assert.ok(!('oQueFazer' in p));
    }
    texto(a.resumo.convergencia, m); texto(a.resumo.custo, m);
  }
});

test('Avisos: todo código citado é produzido por executar.*, e cada mensagem existe de fato', () => {
  for (const [m, a] of Object.entries(M.textos.avisos)) {
    const textosReais = [];
    const produzidos = new Set();
    for (const [codigo, rodar] of Object.entries(CASOS_CODIGO[m])) {
      const r = rodar();
      assert.ok(r.codigoErro === codigo || r.codigosAviso.includes(codigo), `${m}: ${codigo} não produzido`);
      produzidos.add(codigo); textosReais.push(r.erro, ...r.avisos);
    }
    for (const rodar of MENSAGENS_EXTRA[m] || []) { const r = rodar(); textosReais.push(r.erro, ...r.avisos); }
    for (const p of a.problemas) {
      p.codigos.forEach((c) => assert.ok(produzidos.has(c), `${m}/${p.id}: código ${c} sem caso real`));
      if (p.mensagem) assert.ok(textosReais.includes(p.mensagem), `${m}/${p.id}: mensagem não aparece em execução real`);
    }
  }
});

test('L-01: descontinuidade detectada sem falso positivo em raízes com derivada grande', () => {
  for (const [f, a, b] of [['x/2-tan(x)', 1, 2], ['tan(x)', 1, 2], ['1/(x-1)', 0, 3]]) {
    const r = B({ f, a, b });
    assert.strictEqual(r.codigoErro, 'DESCONTINUIDADE', f);
    assert.strictEqual(r.resultado.convergiu, false); assert.ok(r.passos.length > 0, 'passos mantidos');
    assert.match(r.erro, /descontinuidade, não raiz/);
  }
  for (const [f, a, b, raiz] of [['tan(x)', 3, 3.5, Math.PI], ['x^9-1', 0, 2, 1], ['exp(10x)-1', -1, 1, 0],
    ['exp(10x)-1', -1, 1.5, 0], ['x^2-2', 0, 2, Math.SQRT2]]) {
    for (const tol of [1e-4, 1e-12]) {
      const r = B({ f, a, b, tol });
      assert.strictEqual(r.erro, null, `${f} [${a}, ${b}] tol ${tol}: ${r.erro}`);
      assert.ok(Math.abs(r.resultado.raiz - raiz) < 1e-3);
    }
  }
});

test('L-02: Newton fora do domínio cita o x e a causa, sem NaN', () => {
  const r = N({ f: 'x-x*ln(x)', x0: 0.5, tol: 1e-5, maxIter: 10 });
  assert.strictEqual(r.codigoErro, 'FUNCAO_NAO_DEFINIDA');
  assert.strictEqual(r.erro, 'x1 = −0,721348 está fora do domínio de f (ln de número negativo); tente um x0 mais perto da raiz.');
  assert.match(N({ f: 'sqrt(x)-0.1', x0: 3 }).erro || '', /fora do domínio de f \(raiz quadrada de número negativo\)/);
});

test('SALTO_GRANDE e OSCILACAO com os exemplos reais', () => {
  const s = N({ f: 'x^3-2x^2-3x+10', x0: 1.9, tol: 1e-4, maxIter: 10 });
  assert.strictEqual(s.erro, null); assert.ok(Math.abs(s.resultado.raiz + 2) < 1e-6);
  assert.ok(s.codigosAviso.includes('SALTO_GRANDE')); assert.ok(!s.codigosAviso.includes('OSCILACAO'));
  const xs = N({ f: 'x^3-2x+2', x0: 0 });
  assert.strictEqual(xs.codigoErro, 'OSCILACAO');
  assert.deepStrictEqual([...xs.passos.slice(0, 4).map((p) => p.x)], [0, 1, 0, 1]);
  assert.ok(!N({ f: 'x^2-2', x0: 1 }).codigosAviso.includes('SALTO_GRANDE'));
});

// ---------- BUG-16: todo texto gerado usa vírgula decimal e "−"
test('BUG-16: mensagens, avisos e descrições de execuções reais não têm número com ponto decimal', () => {
  const textos = [];
  const colher = (r) => {
    textos.push(r.erro, ...r.avisos);
    for (const p of r.passos) textos.push(p.descricao);
  };
  const casos = [
    () => B({ f: 'x^2-2', a: 0.5, b: 2.5 }), () => B({ f: 'x^2-4', a: 3, b: 0 }), () => B({ f: 'x/2-tan(x)', a: 1, b: 2 }),
    () => B({ f: '(x-1)^2', a: 0.5, b: 3 }), () => B({ f: 'sqrt(x)-1', a: -1.5, b: 4 }), () => B({ f: 'x^2-2', a: 0, b: 2, maxIter: 3 }),
    () => N({ f: 'cos(x)-x', x0: 0.5 }), () => N({ f: 'x^3-2x^2-3x+10', x0: 1.9 }), () => N({ f: 'x-x*ln(x)', x0: 0.5 }),
    () => N({ f: 'atan(x)', x0: 1.5 }), () => N({ f: 'x^3-1', x0: 0 }), () => N({ f: 'x^2+1', x0: 0.5 }),
    () => N({ f: '(x-1)^2', x0: 3.5 }), () => N({ f: 'x^2-2', x0: 1, derivadaNumerica: true }),
    () => M.executar.gauss([[2, 1, -1], [-3, -1, 2], [-2, 1, 2]], [8, -11, -3]),
    () => M.executar.gauss([[0.1, 0.25], [1.5, -0.3]], [0.2, 1.1], { pivoteamento: false }),
    () => M.executar.gauss([[1, 2], [2, 4]], [3, 7]), () => { const s = M.gerarSistema(12, 4); return M.executar.gauss(s.A, s.b); },
  ];
  casos.forEach((rodar) => colher(rodar()));
  for (const a of Object.values(M.textos.avisos)) a.problemas.forEach((p) => p.mensagem && textos.push(p.mensagem));
  const comPonto = /\d\.\d/; // número com ponto decimal
  for (const t of textos.filter((t) => typeof t === 'string')) {
    // Exceção documentada: a fórmula de f'(x) é expressão do parser (que exige ponto).
    const semFormula = t.replace(/^Derivada calculada simbolicamente: .*/, '');
    assert.doesNotMatch(semFormula, comPonto, t);
    assert.doesNotMatch(semFormula, /(^|[\s(=])-\d/, 'menos deve ser "−": ' + t);
  }
  assert.ok(textos.some((t) => /\d,\d/.test(t)), 'deveria haver números com vírgula');
  const fim = M.executar.gauss([[2, 0], [0, 4]], [1, 1]).passos.at(-1).descricao;
  assert.strictEqual(fim, 'Solução: x1 = 0,5; x2 = 0,25');
});

// ---------- BUG-19: célula vazia na colagem
test('BUG-19: célula vazia com TAB, ";" e "," vira erro com linha e coluna', () => {
  const r = M.lerMatrizTexto('2\t\t-1\t8\n-3\t-1\t2\t-11\n-2\t1\t2\t-3');
  assert.strictEqual(r.erro, 'Linha 1, coluna 2 vazia.'); assert.strictEqual(r.codigoErro, 'MATRIZ_TEXTO_INVALIDA');
  assert.strictEqual(M.lerMatrizTexto('1;2;3\n4;;6').erro, 'Linha 2, coluna 2 vazia.');
  assert.strictEqual(M.lerMatrizTexto('1,2,3\n4,5,,6').erro, 'Linha 2, coluna 3 vazia.');
  assert.strictEqual(M.lerMatrizTexto('\t1\t2\n3\t4\t5').erro, 'Linha 1, coluna 1 vazia.');
  // um separador sobrando no fim da linha (export) não é erro; dois sim
  for (const t of ['1\t2\t5\t\n3\t4\t6\t', '1;2;5;\n3;4;6;', '1,2,5,\n3,4,6,', '1\t2\t5 \t \n3\t4\t6']) {
    const ok = M.lerMatrizTexto(t);
    assert.strictEqual(ok.erro, null, JSON.stringify(t) + ': ' + ok.erro); assert.deepStrictEqual([...ok.b], [5, 6]);
  }
  assert.strictEqual(M.lerMatrizTexto('1\t2\t5\t\t\n3\t4\t6').erro, 'Linha 1, coluna 4 vazia.');
  // espaços continuam colapsando; espaços em volta de TAB são ignorados
  assert.strictEqual(M.lerMatrizTexto('1    2   5\n3  4  6').erro, null);
  assert.deepStrictEqual([...M.lerMatrizTexto('1 \t 2,5 \t 5\n3\t4\t6').A[0]], [1, 2.5]);
  // lerSistemaTexto: A e b
  const s = M.lerSistemaTexto('1\t2\t3\n4\t\t6\n7\t8\t9', '1\n2\n3');
  assert.strictEqual(s.erro, 'Célula vazia em A, linha 2, coluna 2'); assert.strictEqual(s.campo, 'A');
  assert.strictEqual(s.linha, 2); assert.strictEqual(s.coluna, 2);
  const sb = M.lerSistemaTexto('1 0\n0 1', '1;;2');
  assert.strictEqual(sb.erro, 'Valor vazio em b, posição 2'); assert.strictEqual(sb.campo, 'b');
  assert.strictEqual(M.lerSistemaTexto('1\t0\t\n0\t1\t', '1\t2\t').erro, null);
});

// ---------- Modos de pivoteamento: automatico | sempre | nunca
const G = (A, b, pivoteamento, granularidade) => M.executar.gauss(A, b, { pivoteamento, granularidade });
const decisoes = (r) => r.passos.filter((p) => p.tipo === 'pivo' || p.tipo === 'coluna').map((p) => p.pivo);
const GRANS = ['operacao', 'coluna'];

test('pivô: compatibilidade, alias e padrão "automatico"', () => {
  const A = [[2, 1], [1, 3]], b = [3, 4];
  assert.strictEqual(G(A, b).resultado.pivoteamento, 'automatico');
  assert.strictEqual(G(A, b, 'auto').resultado.pivoteamento, 'automatico');
  assert.strictEqual(G(A, b, true).resultado.pivoteamento, 'sempre');
  assert.strictEqual(G(A, b, false).resultado.pivoteamento, 'nunca');
  assert.strictEqual(G(A, b, 'parcial').resultado.pivoteamento, 'sempre');
  assert.strictEqual(G(A, b, 'xyz').codigoErro, 'ENTRADA_INVALIDA');
  // 3×3 clássico: sempre troca (|−3| > 2); nunca não troca; automático não precisa (2 ≥ 0,1·3)
  const A3 = [[2, 1, -1], [-3, -1, 2], [-2, 1, 2]], b3 = [8, -11, -3];
  for (const g of GRANS) {
    assert.ok(G(A3, b3, true, g).resultado.trocas.classicas > 0);
    assert.strictEqual(G(A3, b3, false, g).resultado.trocas.total, 0);
    assert.strictEqual(G(A3, b3, undefined, g).resultado.trocas.total, 0);
  }
});

test('pivô (a) [[0,1],[1,1]]: automático troca obrigatória; nunca para; sempre troca', () => {
  const A = [[0, 1], [1, 1]], b = [1, 2];
  for (const g of GRANS) {
    const auto = G(A, b, 'automatico', g);
    assert.strictEqual(auto.erro, null);
    const d = decisoes(auto)[0];
    assert.strictEqual(d.decisao, 'troca');
    assert.deepStrictEqual({ ...d.troca }, { tipo: 'obrigatoria', motivo: 'pivo_zero', descricao: d.troca.descricao, de: 1, para: 0, valorOriginal: 0, valorNovo: 1 });
    assert.match(d.troca.descricao, /zero numérico: troca obrigatória com L2/);
    assert.deepStrictEqual({ ...auto.resultado.trocas }, { total: 1, obrigatorias: 1, recomendadas: 0, classicas: 0 });
    const nunca = G(A, b, 'nunca', g);
    assert.strictEqual(nunca.codigoErro, 'PIVO_ZERO_SEM_TROCA');
    assert.strictEqual(nunca.erro, 'Pivô a11 = 0 e o modo “nunca” não permite trocar linhas: ative o pivoteamento (automático ou sempre).');
    const sempre = G(A, b, 'sempre', g);
    assert.strictEqual(decisoes(sempre)[0].troca.tipo, 'classica'); assert.strictEqual(decisoes(sempre)[0].troca.motivo, 'maior_modulo');
    assert.deepStrictEqual([...sempre.resultado.x], [1, 1]);
  }
  // matriz realmente singular continua MATRIZ_SINGULAR também no "nunca"
  assert.strictEqual(G([[0, 1], [0, 2]], [1, 2], 'nunca').codigoErro, 'MATRIZ_SINGULAR');
});

test('pivô (b) 1e−17: automático obrigatória; nunca segue, erra feio e compara; 1e−4: recomendada', () => {
  const A = [[1e-17, 1], [1, 1]], b = [1, 2];
  for (const g of GRANS) {
    const auto = G(A, b, 'automatico', g);
    assert.strictEqual(decisoes(auto)[0].troca.tipo, 'obrigatoria');
    assert.ok(Math.abs(auto.resultado.x[0] - 1) < 1e-12);
    const nunca = G(A, b, 'nunca', g);
    assert.strictEqual(nunca.erro, null);
    assert.strictEqual(decisoes(nunca)[0].decisao, 'sem_troca'); assert.strictEqual(decisoes(nunca)[0].troca, null);
    assert.ok(Math.abs(nunca.resultado.x[0]) < 1e-6, `x1 = ${nunca.resultado.x[0]}`);
    const c = nunca.resultado.comparacao;
    assert.ok(c.semPivo.erro > 0.5); assert.ok(c.semPivo.residuo > 0.1);
    assert.strictEqual(c.comPivo.erro, 0); assert.ok(c.comPivo.residuo < 1e-15);
    assert.ok(Math.abs(c.comPivo.x[0] - 1) < 1e-12);
    assert.ok(nunca.codigosAviso.includes('PIVO_PEQUENO_SEM_TROCA'));
    assert.match(nunca.avisos.find((t) => /Pivô pequeno/.test(t)), /a11 = 1,000e−17/);
    const rec = G([[1e-4, 1], [1, 1]], b, 'automatico', g);
    const d = decisoes(rec)[0];
    assert.deepStrictEqual([d.troca.tipo, d.troca.motivo, d.troca.valorOriginal, d.troca.valorNovo], ['recomendada', 'pivo_pequeno', 1e-4, 1]);
    assert.strictEqual(rec.resultado.trocas.recomendadas, 1);
  }
});

test('pivô (c) diagonal dominante: nenhum modo troca, soluções iguais; nunca sempre traz comparacao', () => {
  const { A, b } = M.gerarSistema(6, 11);
  for (const g of GRANS) {
    const xs = ['automatico', 'sempre', 'nunca'].map((m) => {
      const r = G(A, b, m, g);
      assert.strictEqual(r.resultado.trocas.total, 0, m);
      decisoes(r).forEach((d) => { assert.strictEqual(d.decisao, 'sem_troca'); assert.strictEqual(d.troca, null); });
      return [...r.resultado.x];
    });
    assert.deepStrictEqual(xs[0], xs[1]); assert.deepStrictEqual(xs[0], xs[2]);
    const c = G(A, b, 'nunca', g).resultado.comparacao;
    assert.strictEqual(c.semPivo.erro, 0); assert.ok(!G(A, b, 'nunca', g).codigosAviso.includes('PIVO_PEQUENO_SEM_TROCA'));
    assert.strictEqual(G(A, b, 'sempre', g).resultado.comparacao, undefined);
  }
});

test('pivô (d) n = 100 nos 3 modos', () => {
  const { A, b, x } = M.gerarSistema(100, 9);
  for (const m of ['automatico', 'sempre', 'nunca']) {
    const r = G(A, b, m);
    assert.strictEqual(r.erro, null, m); assert.strictEqual(r.resultado.granularidade, 'coluna');
    assert.deepStrictEqual(Array.from(r.resultado.x, (v) => Math.round(v) + 0), [...x]);
    assert.strictEqual(r.passos.filter((p) => p.tipo === 'coluna').length, 100);
  }
});

test('pivô: etapa/etapas de pivô, troca e coluna existem como marcadores (gauss ou escolherPivo)', () => {
  const fontes = M.gauss.toString() + '\n' + M.escolherPivo.toString();
  const casos = [[[[0, 1], [1, 1]], [1, 2]], [[[1e-4, 1], [1, 1]], [1, 2]], [[[2, 1, -1], [-3, -1, 2], [-2, 1, 2]], [8, -11, -3]]];
  const vistos = new Set();
  for (const [A, b] of casos) for (const m of ['automatico', 'sempre', 'nunca']) for (const g of GRANS) {
    for (const p of G(A, b, m, g).passos) {
      assert.ok(p.etapa && Array.isArray(p.etapas) && p.etapas.includes(p.etapa) || p.tipo === 'coluna', `${p.tipo}`);
      for (const nome of [p.etapa, ...p.etapas]) {
        assert.match(fontes, new RegExp('// @etapa:' + nome + ' — '), nome); vistos.add(nome);
      }
    }
  }
  for (const n of ['pivoOk', 'trocaObrigatoria', 'trocaRecomendada', 'trocaClassica', 'trocaLinhas']) assert.ok(vistos.has(n), n);
  // linhaDoPasso do Dev encontra a linha dos novos nomes em escolherPivo
  const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
  const ctx = { console, document: {}, navigator: {} }; ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js/visual/codigo.js'), 'utf8'), ctx);
  const ep = M.escolherPivo.toString();
  for (const n of ['pivoOk', 'trocaObrigatoria', 'trocaRecomendada', 'trocaClassica']) {
    assert.strictEqual(ctx.Visual.linhaDoPasso('gauss', ep, { etapa: n }), linhaDoMarcador(ep, n));
  }
  assert.ok(ep.split('\n').length <= 30);
});

// ---------- QA v3
test('BUG-20: Hilbert 10 e 12 não são singulares (3 modos × 2 granularidades) e avisam MAL_CONDICIONADA', () => {
  const limite = { 10: 1e-2, 12: 1 }; // erro esperado ~cond·ε: 1e−3 (n=10) e O(1) (n=12)
  for (const n of [10, 12]) {
    const A = HILBERT(n), b = A.map(somaLinha);
    for (const m of ['automatico', 'sempre', 'nunca']) for (const g of ['operacao', 'coluna']) {
      const r = M.executar.gauss(A, b, { pivoteamento: m, granularidade: g });
      assert.strictEqual(r.codigoErro, null, `${n} ${m} ${g}: ${r.erro}`);
      assert.strictEqual(r.resultado.classificacao, 'unica');
      assert.ok(r.codigosAviso.includes('MAL_CONDICIONADA'));
      assert.ok(r.resultado.condicao > 1e13);
      const erro = Math.max(...r.resultado.x.map((v) => Math.abs(v - 1)));
      assert.ok(erro < limite[n], `${n} ${m} ${g}: erro ${erro}`);
      assert.ok(r.resultado.residuo < 1e-12);
    }
  }
  const aviso = M.executar.gauss(HILBERT(10), HILBERT(10).map(somaLinha)).avisos.find((t) => /mal condicionada/.test(t));
  assert.match(aviso, /cond∞\(A\) ≈ \d,\d{3}e\+13 > 1,000e\+8/); assert.doesNotMatch(aviso, /\d\.\d/);
  // bem condicionada: sem aviso
  assert.ok(!M.executar.gauss([[2, 1], [1, 3]], [3, 4]).codigosAviso.includes('MAL_CONDICIONADA'));
});

test('BUG-20: singulares de verdade continuam classificadas (2×2 e 3×3, impossível × infinitas)', () => {
  const casos = [[[[1, 2], [2, 4]], [3, 6], 'infinitas_solucoes', 'SISTEMA_INDETERMINADO'], [[[1, 2], [2, 4]], [3, 7], 'impossivel', 'SISTEMA_IMPOSSIVEL'],
    [[[1, 2, 3], [4, 5, 6], [7, 8, 9]], [6, 15, 24], 'infinitas_solucoes', 'SISTEMA_INDETERMINADO'], [[[1, 2, 3], [4, 5, 6], [7, 8, 9]], [6, 15, 25], 'impossivel', 'SISTEMA_IMPOSSIVEL']];
  for (const [A, b, cl, cod] of casos) for (const m of ['automatico', 'sempre', 'nunca']) {
    const r = M.executar.gauss(A, b, { pivoteamento: m });
    assert.strictEqual(r.codigoErro, 'MATRIZ_SINGULAR'); assert.strictEqual(r.resultado.classificacao, cl);
    assert.deepStrictEqual([...r.codigosAviso], [cod]);
  }
});

test('BUG-22: sqrt(x)−1, x0 = 4: f está definida em 0, f′ não', () => {
  const r = M.executar.newton({ f: 'sqrt(x)-1', x0: 4, tol: 1e-8, maxIter: 50 });
  assert.strictEqual(r.codigoErro, 'DERIVADA_NAO_DEFINIDA'); assert.strictEqual(r.resultado.motivo, 'DERIVADA_NAO_DEFINIDA');
  assert.match(r.erro, /f\(x1\) = −1 está definida, mas f'\(x1\) não é finita/); assert.doesNotMatch(r.erro, /f não está definida/);
  assert.strictEqual(r.resultado.raiz, null);
  // f indefinida continua FUNCAO_NAO_DEFINIDA
  assert.strictEqual(M.executar.newton({ f: 'x-x*ln(x)', x0: 0.5, tol: 1e-5, maxIter: 10 }).codigoErro, 'FUNCAO_NAO_DEFINIDA');
});

test('BUG-27/26: números comparados não parecem iguais; valores enormes em notação científica', () => {
  const A = HILBERT(8), r = M.executar.gauss(A, A.map(somaLinha), { pivoteamento: 'sempre' });
  for (const p of r.passos) if (p.pivo && p.pivo.troca) {
    const [a, b] = p.pivo.troca.descricao.match(/\(([^ ]+) > ([^ )]+)\)/).slice(1);
    assert.notStrictEqual(a, b, p.pivo.troca.descricao);
  }
  assert.deepStrictEqual([...M.fmtPar(1 / 12 + 3e-17, 1 / 12 - 2e-17)], ['0,0833333333333334', '0,0833333333333333']);
  assert.deepStrictEqual([...M.fmtPar(2, 1)], ['2', '1']);
  // mesmo formato da UI (Visual.fmtE): 4 algarismos, vírgula, − (U+2212) na mantissa e no expoente
  for (const [v, t] of [[-1e17, '−1,000e+17'], [3.38728e10, '3,387e+10'], [1e-17, '1,000e−17'], [-2.5e-5, '−2,500e−5'], [1e6, '1,000e+6'], [123456, '123456'], [1e-4, '0,0001']]) assert.strictEqual(M.fmtBR(v), t);
  assert.deepStrictEqual([...M.fmtPar(1e17, 1e17 * (1 + 1e-6))], ['1,000000e+17', '1,000001e+17']);
  assert.deepStrictEqual([...M.fmtPar(1, 1e-17)], ['1', '1,000e−17']);
  const d = M.executar.gauss([[1e-17, 1], [1, 1]], [1, 2], { pivoteamento: 'nunca' }).passos.map((p) => p.descricao).join(' ');
  assert.doesNotMatch(d, /\d{8}/); assert.match(d, /L2 ← L2 − \(1,000e\+17\)·L1/); assert.match(d, /Pivô a22 = −1,000e\+17/); assert.match(d, /Pivô a11 = 1,000e−17/);
});

// ---------- Critério de parada: absoluto (padrão) × relativo
const LISTA_REF = require('/workspace/qa-metodos-numericos/lista_ref.json');
const rodarLista = (c, criterio) => (c.metodo === 'bis'
  ? M.executar.bisseccao({ f: c.f, a: c.a, b: c.b, tol: c.tol, maxIter: c.N, criterio })
  : M.executar.newton({ f: c.f, x0: c.x0, tol: c.tol, maxIter: c.N, criterio }));

test('critério relativo: todos os exercícios das listas batem com o gabarito (iterações e raiz)', () => {
  assert.strictEqual(LISTA_REF.length, 15);
  for (const c of LISTA_REF) {
    const r = rodarLista(c, 'relativo');
    assert.strictEqual(r.resultado.criterio, 'relativo');
    assert.strictEqual(r.resultado.iteracoes, c.it.rel[0], `${c.id}: iterações`);
    assert.ok(Math.abs(r.resultado.raiz - c.it.rel[1]) <= 4 * Number.EPSILON * Math.abs(c.it.rel[1]), `${c.id}: raiz ${r.resultado.raiz} vs ${c.it.rel[1]}`);
    const ult = r.passos[r.passos.length - 1];
    assert.ok(ult.erroCriterio < c.tol); // desigualdade estrita
    r.passos.slice(0, -1).forEach((p) => assert.ok(p.erroCriterio === null || p.erroCriterio >= c.tol, c.id));
  }
});

test('critério absoluto (explícito) inalterado: mesmas iterações do site antigo; erroCriterio = erro', () => {
  for (const c of LISTA_REF) {
    const pad = rodarLista(c, 'abs'), abs = rodarLista(c, 'absoluto');
    assert.strictEqual(pad.resultado.criterio, 'absoluto');
    assert.strictEqual(pad.resultado.iteracoes, c.it.site[0], c.id);
    assert.deepStrictEqual(pad.passos.map((p) => p.erro), abs.passos.map((p) => p.erro));
    pad.passos.forEach((p) => { assert.strictEqual(p.criterio, 'absoluto'); assert.strictEqual(p.erroCriterio, p.erro); assert.strictEqual(p.criterioFallback, false); });
  }
  // chamadas diretas com 'absoluto' explícito
  assert.strictEqual(M.bisseccao((x) => x * x - 2, 1, 2, 1e-6, 100, 'absoluto').passos.length, 20);
  assert.strictEqual(M.newton((x) => x * x - 2, (x) => 2 * x, 1, 1e-10, 50, 'absoluto').passos.length, 5);
  assert.strictEqual(B({ f: 'x^2-2', a: 1, b: 2, criterio: 'xyz' }).codigoErro, 'ENTRADA_INVALIDA');
  assert.strictEqual(N({ f: 'x^2-2', x0: 1, criterio: 'rel' }).resultado.criterio, 'relativo');
});

test('critério relativo: 1ª iteração da bissecção tem erro indefinido (null) e nunca para', () => {
  const r = B({ f: 'x-1.4', a: 1, b: 2, tol: 0.9, criterio: 'relativo' });
  assert.strictEqual(r.passos[0].erroCriterio, null); assert.ok(r.passos.length >= 2);
  assert.match(r.passos[0].descricao, /— na 1ª iteração/);
  const p = r.passos[1];
  assert.ok(Math.abs(p.erroCriterio - Math.abs(p.c - r.passos[0].c) / Math.abs(p.c)) < 1e-15);
  // Newton: erroCriterio = |x_{k+1} − x_k| / |x_{k+1}|
  const n = N({ f: 'x^2-2', x0: 1, tol: 1e-8, criterio: 'relativo' });
  n.passos.forEach((s) => assert.ok(Math.abs(s.erroCriterio - Math.abs(s.xNovo - s.x) / Math.abs(s.xNovo)) < 1e-15));
  assert.match(n.passos[n.passos.length - 1].descricao, /erro relativo \|Δx\|\/\|x\| = .* < ε: critério relativo atingido/);
});

test('critério relativo perto de zero: fallback absoluto + aviso CRITERIO_RELATIVO_PERTO_DE_ZERO', () => {
  const r = N({ f: 'x^3+x', x0: 1, tol: 1e-6, criterio: 'relativo' });
  assert.strictEqual(r.resultado.convergiu, true); assert.strictEqual(r.resultado.iteracoes, 5);
  const u = r.passos[4];
  assert.strictEqual(u.criterioFallback, true); assert.strictEqual(u.erroCriterio, Math.abs(u.xNovo - u.x));
  assert.ok(r.codigosAviso.includes('CRITERIO_RELATIVO_PERTO_DE_ZERO'));
  const t = r.avisos.find((a) => /perto de zero/.test(a));
  assert.match(t, /\|x\| = 7,300e−20 < 1,000e−12/); assert.doesNotMatch(t, /\d\.\d|-/);
  const b = B({ f: 'x', a: -1, b: 0.5, tol: 1e-6, maxIter: 100, criterio: 'relativo' });
  assert.strictEqual(b.resultado.convergiu, true); assert.ok(b.passos.some((p) => p.criterioFallback));
  assert.ok(!N({ f: 'x^3+x', x0: 1, tol: 1e-6, criterio: 'absoluto' }).codigosAviso.includes('CRITERIO_RELATIVO_PERTO_DE_ZERO'));
});

test('critério: marcador criterioParada continua batendo com linhaDoPasso; ≤ 70 colunas', () => {
  for (const m of ['bisseccao', 'newton']) {
    const fonte = M[m].toString();
    const linha = fonte.split('\n')[linhaDoMarcador(fonte, 'criterioParada')];
    assert.match(linha, /Metodos\.testeParada\(criterio/);
    fonte.split('\n').forEach((l) => assert.ok(l.length <= 70, l));
  }
});

test('critério PADRÃO é relativo (executar.* e funções exibidas)', () => {
  for (const c of LISTA_REF) {
    const r = rodarLista(c); // sem criterio
    assert.strictEqual(r.resultado.criterio, 'relativo', c.id);
    assert.strictEqual(r.resultado.iteracoes, c.it.rel[0], c.id);
    r.passos.forEach((p) => assert.strictEqual(p.criterio, 'relativo'));
  }
  assert.strictEqual(B({ f: 'x^2-2', a: 1, b: 2, criterio: null }).resultado.criterio, 'relativo');
  assert.match(M.bisseccao.toString(), /criterio = 'relativo'/); assert.match(M.newton.toString(), /criterio = 'relativo'/);
  const f = (x) => x * x - 2;
  assert.deepStrictEqual(M.bisseccao(f, 1, 2, 1e-6, 100).passos.map((p) => p.c), M.bisseccao(f, 1, 2, 1e-6, 100, 'relativo').passos.map((p) => p.c));
  const g = (x) => x ** 3 - 9 * x + 3; // L4-4: relativo 12, absoluto 10
  assert.strictEqual(M.bisseccao(g, 0, 1, 1e-3, 15).passos.length, 12);
  assert.strictEqual(M.bisseccao(g, 0, 1, 1e-3, 15, 'absoluto').passos.length, 10);
});

test('BUG-29: estimativa teórica só no absoluto', () => {
  assert.strictEqual(B({ f: 'x^2-2', a: 1, b: 2, tol: 1e-4 }).resultado.iteracoesEstimadas, null);
  assert.strictEqual(B({ f: 'x^2-2', a: 1, b: 2, tol: 1e-4, criterio: 'absoluto' }).resultado.iteracoesEstimadas, 14);
});
test('BUG-30: aviso de fallback só quando o fallback decide a parada', () => {
  const r = N({ f: 'x', x0: 0.5 });
  assert.strictEqual(r.resultado.motivo, 'RAIZ_EXATA');
  assert.ok(!r.codigosAviso.includes('CRITERIO_RELATIVO_PERTO_DE_ZERO'));
  const s = N({ f: 'sin(x)', x0: 0.5 });
  assert.strictEqual(s.resultado.motivo, 'TOLERANCIA');
  assert.ok(s.passos.at(-1).criterioFallback && s.codigosAviso.includes('CRITERIO_RELATIVO_PERTO_DE_ZERO'));
  const b = B({ f: 'x', a: -1, b: 2, tol: 1e-4 });
  assert.ok(b.passos.at(-1).criterioFallback && b.codigosAviso.includes('CRITERIO_RELATIVO_PERTO_DE_ZERO'));
  const e = B({ f: 'x-0.5', a: 0, b: 1, tol: 1e-4 }); // raiz exata no 1º ponto médio
  assert.ok(!e.codigosAviso.includes('CRITERIO_RELATIVO_PERTO_DE_ZERO'));
});
test('BUG-31/32: x³ no relativo termina com RAIZ_EM_ZERO_CRITERIO_RELATIVO', () => {
  assert.strictEqual(M.limiarZeroRelativo, undefined);
  assert.strictEqual(M.LIMIAR_ZERO_RELATIVO, 1e-12);
  const r = N({ f: 'x^3', x0: 1, tol: 1e-4, maxIter: 100 });
  assert.strictEqual(r.codigoErro, 'RAIZ_EM_ZERO_CRITERIO_RELATIVO');
  assert.strictEqual(r.resultado.motivo, 'RAIZ_EM_ZERO_CRITERIO_RELATIVO');
  assert.strictEqual(r.resultado.convergiu, false);
  assert.ok(Math.abs(r.resultado.raiz) < 1e-6);
  assert.match(r.erro, /convergem para x = 0, uma raiz múltipla.*fica em ≈ 0,5\). Use o critério absoluto\./);
  assert.ok(r.codigosAviso.includes('CONVERGENCIA_LENTA'));
  assert.ok(!r.codigosAviso.includes('CRITERIO_RELATIVO_PERTO_DE_ZERO'));
  const a = N({ f: 'x^3', x0: 1, tol: 1e-4, criterio: 'absoluto' });
  assert.strictEqual(a.codigoErro, null); assert.ok(a.codigosAviso.includes('CONVERGENCIA_LENTA'));
  const m = N({ f: '(x-1)^2', x0: 2, tol: 1e-6 }); // raiz múltipla ≠ 0: continua convergindo
  assert.strictEqual(m.codigoErro, null); assert.ok(m.codigosAviso.includes('CONVERGENCIA_LENTA'));
});
test('BUG-32: raízes simples do tamanho de ε não param cedo nem disparam raiz múltipla', () => {
  const ruins = ['CONVERGENCIA_LENTA', 'RAIZ_MULTIPLA', 'CRITERIO_RELATIVO_PERTO_DE_ZERO'];
  const b = B({ f: 'x-5e-5', a: -1, b: 2, tol: 1e-4 });
  assert.ok(Math.abs(b.resultado.raiz - 5e-5) / 5e-5 < 1e-4);
  ruins.forEach((c) => assert.ok(!b.codigosAviso.includes(c), c));
  for (const x0 of [1, 10, 0.001]) {
    const r = N({ f: 'x^2-2.5e-9', x0, tol: 1e-4, maxIter: 100 });
    assert.strictEqual(r.codigoErro, null);
    assert.ok(Math.abs(r.resultado.raiz - 5e-5) / 5e-5 < 1e-4, String(x0));
    ruins.forEach((c) => assert.ok(!r.codigosAviso.includes(c), c + ' x0=' + x0));
  }
  const x = B({ f: 'x', a: -1, b: 2, tol: 1e-4 });
  assert.strictEqual(x.resultado.iteracoes, 40); assert.ok(x.codigosAviso.includes('CRITERIO_RELATIVO_PERTO_DE_ZERO'));
  for (const crit of ['relativo', 'absoluto']) for (const c of LISTA_REF) {
    const r = rodarLista(c, crit);
    assert.strictEqual(r.resultado.iteracoes, c.it[crit === 'relativo' ? 'rel' : 'site'][0], c.id + ' ' + crit);
  }
});

test('ε padrão do relativo = 0,01 (TOL_PADRAO); absoluto continua exigindo tol', () => {
  assert.deepStrictEqual({ ...M.TOL_PADRAO }, { relativo: 0.01, absoluto: null });
  for (const tol of [undefined, null, '', '  ']) {
    const r = M.executar.bisseccao({ f: 'x^3-9*x+3', a: 0, b: 1, maxIter: 50, tol });
    assert.strictEqual(r.resultado.tol, 0.01); assert.strictEqual(r.resultado.criterio, 'relativo');
    assert.strictEqual(r.resultado.iteracoes, 9); assert.strictEqual(r.resultado.raiz, 0.337890625); // caso do Dev
  }
  const n = M.executar.newton({ f: 'x^2 - 2', x0: 3, maxIter: 30 });
  assert.strictEqual(n.resultado.tol, 0.01); assert.strictEqual(n.resultado.iteracoes, 4);
  assert.strictEqual(M.executar.newton({ f: 'x^2-2', x0: 3, maxIter: 30, tol: '0,000001' }).resultado.tol, 1e-6);
  for (const tol of [undefined, '']) {
    const a = M.executar.bisseccao({ f: 'x^2-2', a: 1, b: 2, maxIter: 50, tol, criterio: 'absoluto' });
    assert.strictEqual(a.codigoErro, 'ENTRADA_INVALIDA');
  }
  assert.strictEqual(M.executar.bisseccao({ f: 'x^2-2', a: 1, b: 2, maxIter: 50, tol: 0 }).codigoErro, 'ENTRADA_INVALIDA');
  assert.doesNotMatch(M.bisseccao.toString().split('\n')[0], /tol\s*=/);
  assert.doesNotMatch(M.newton.toString().split('\n')[0], /tol\s*=/);
});
