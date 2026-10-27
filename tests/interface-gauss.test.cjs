// Testes da camada de interface do Gauss (gerador aleatório e redimensionamento). npm test / node --test
const test = require('node:test'), assert = require('assert'), vm = require('vm'), fs = require('fs'), path = require('path');
const ctx = { Math, Number, isFinite, Array, Object, Error, String, RegExp, console }; ctx.window = ctx; ctx.globalThis = ctx; vm.createContext(ctx);
['js/expressao.js', 'js/metodos/comum.js', 'js/metodos/bisseccao.js', 'js/metodos/newton.js', 'js/metodos/gauss.js', 'js/metodos/validacao.js', 'js/visual/adaptador.js', 'js/visual/chamadas.js', 'js/visual/gauss-entrada.js']
  .forEach(f => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), ctx, { filename: f }));
const GE0 = ctx.Visual.gaussEntrada, C = ctx.Visual.chamar;
const J = v => JSON.parse(JSON.stringify(v)); // arrays do vm → arrays deste realm
const GE = { aleatorio: n => J(GE0.aleatorio(n)), redimensionar: (M, n) => J(GE0.redimensionar(M, n)), limitarN: v => J(GE0.limitarN(v)) };
test('Aleatório n=2..10 (50 sorteios cada) sempre tem solução única e inteira, coeficientes em −9..9', () => {
  for (let n = 2; n <= 10; n++) for (let r = 0; r < 50; r++) {
    const { matriz, x } = GE.aleatorio(n);
    assert.equal(matriz.length, n); matriz.forEach(l => { assert.equal(l.length, n + 1); l.slice(0, n).forEach(v => assert(Number.isInteger(v) && v >= -9 && v <= 9)); });
    for (const piv of [true, false]) {
      const res = C.gauss({ matriz: matriz.map(l => l.slice()), pivoteamento: piv });
      assert(!res.erro, `n=${n}: ${res.erro}`);
      res.resultado.x.forEach((v, i) => { assert(Math.abs(v - x[i]) < 1e-8, `n=${n} x${i + 1}=${v} ≠ ${x[i]}`); assert(Math.abs(v - Math.round(v)) < 1e-8); });
    }
  }
});
test('redimensionar preserva valores e mantém b na última coluna', () => {
  const M = [[1, 2, 3, 10], [4, 5, 6, 20], [7, 8, 9, 30]];
  const maior = GE.redimensionar(M, 5);
  assert.deepStrictEqual(maior[0], [1, 2, 3, '', '', 10]); assert.deepStrictEqual(maior[2], [7, 8, 9, '', '', 30]); assert.deepStrictEqual(maior[4], ['', '', '', '', '', '']);
  const menor = GE.redimensionar(M, 2);
  assert.deepStrictEqual(menor, [[1, 2, 10], [4, 5, 20]]);
  assert.deepStrictEqual(GE.redimensionar(GE.redimensionar(M, 5), 3), M); // ida e volta sem perda
});
test('limitarN: 2..100 com ajuste', () => {
  assert.deepStrictEqual({ ...GE.limitarN(1) }, { n: 2, ajustado: true }); assert.deepStrictEqual({ ...GE.limitarN(150) }, { n: 100, ajustado: true }); assert.deepStrictEqual({ ...GE.limitarN(7) }, { n: 7, ajustado: false });
});
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js/visual/gauss-provisorio.js'), 'utf8'), ctx);
test('Aleatório n ∈ {2,5,10,40,100} resolve com solução inteira (modo por coluna p/ n>10)', () => {
  for (const n of [2, 5, 10, 40, 100]) { const { matriz, x } = GE.aleatorio(n);
    const res = J(C.gauss({ matriz, pivoteamento: true })); // núcleo decide a granularidade (coluna se n > 10)
    assert(!res.erro, res.erro); res.resultado.x.forEach((v, i) => assert(Math.abs(v - x[i]) < 1e-6, `n=${n} x${i + 1}`));
    if (n > 10) { assert.equal(res.passos.filter(p => p.tipo === 'coluna').length, n); assert.equal(res.resultado.granularidade, 'coluna');
      const c = res.passos.find(p => p.tipo === 'coluna'); assert(c.k === 0 && c.pivo && c.matriz && Array.isArray(c.fatores) && c.etapa === 'eliminacao' && c.descricao); assert(['substituicao', 'fim'].includes(res.passos.at(-1).tipo)); } }
});
test('colar: tab/;/,/espaço, vírgula decimal, formato n×(n+1)', () => {
  // usa o parser do núcleo (Metodos.lerMatrizTexto) se existir, normalizado como no app.js
  const ler = t => { const f = ctx.Metodos.lerMatrizTexto; if (!f) return J(ctx.Visual.provisorio.lerMatrizTexto(t));
    const r = J(f(t)); return r.erro || !r.b ? { ok: false, ...r } : { ok: true, n: r.linhas, A: r.A, b: r.b }; };
  let r = ler('1\t2\t3\n4\t5\t6'); assert(r.ok && r.n === 2); assert.deepStrictEqual(r.b, [3, 6]);
  r = ler('1,5;2;3\n4;5;6,25'); assert(r.ok); assert.deepStrictEqual(r.A[0], [1.5, 2]); assert.equal(r.b[1], 6.25);
  r = ler('1,2,3\n4,5,6'); assert(r.ok && r.A[1][1] === 5);
  r = ler('1 2.5 3\n4 5 6'); assert(r.ok && r.A[0][1] === 2.5);
  assert(!ler('1 2 3 4 5\n5 6 7 8 9').ok); assert(!ler('1 2\n3 4').ok); assert(!ler('1 2 x\n4 5 6').ok); assert(!ler('1 2\n3').ok); assert(!ler('').ok);
  r = ler(Array.from({ length: 5 }, () => '1 2 3 4 5 6').join('\n')); assert(r.ok && r.n === 5); // 5×6 válido; quem chama compara com o n escolhido
});
test('Metodos.gerarSistema (núcleo) n ∈ {2,5,10,40,100}: solução inteira recuperada', () => {
  if (!ctx.Metodos.gerarSistema) return;
  for (const n of [2, 5, 10, 40, 100]) { const s = J(ctx.Metodos.gerarSistema(n, 7)); const r = J(C.gauss({ matriz: s.A.map((l, i) => l.concat([s.b[i]])), pivoteamento: true }));
    assert(!r.erro, r.erro); r.resultado.x.forEach((v, i) => assert(Math.abs(v - s.x[i]) < 1e-6)); }
});
