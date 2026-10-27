// Executar: node tests/teste-metodos.cjs
// Carrega, com vm, os arquivos do Matemático (js/expressao.js, js/metodos/*.js) e a camada de interface
// que os chama (js/visual/adaptador.js e js/visual/chamadas.js), conferindo o pipeline completo.
const vm = require('vm'), fs = require('fs'), path = require('path'), assert = require('assert');
const ctx = { Math, Number, isFinite, Array, Object, Error, String, RegExp, console }; ctx.window = ctx; ctx.globalThis = ctx; vm.createContext(ctx);
['js/expressao.js', 'js/metodos/comum.js', 'js/metodos/bisseccao.js', 'js/metodos/newton.js', 'js/metodos/gauss.js', 'js/metodos/validacao.js', 'js/visual/adaptador.js', 'js/visual/chamadas.js']
  .forEach(f => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), ctx, { filename: f }));
const C = ctx.Visual.chamar, E = ctx.Expressao; let ok = 0, total = 0;
function t(nome, fn) { total++; try { fn(); ok++; console.log('✔', nome); } catch (e) { console.log('✘', nome, '-', e.message); process.exitCode = 1; } }
const perto = (a, b, tol) => assert(Math.abs(a - b) < tol, `${a} ≠ ${b}`);

t('parser: funções e constantes', () => perto(E.compilar('sin(pi/2) + exp(0) + ln(e) + sqrt(4)')(0), 5, 1e-12));
t('parser: rejeita código arbitrário', () => ['alert(1)', 'constructor', 'x;1', 'this', '`x`'].forEach(s => assert.throws(() => E.compilar(s))));
t('bissecção x^3-x-2 em [1,2] ≈ 1.5214', () => {
  const r = C.bisseccao({ f: 'x^3 - x - 2', a: '1', b: '2', tol: '1e-6', maxIter: '100' });
  assert(!r.erro, r.erro); perto(r.resultado.raiz, 1.5213797, 1e-5);
  const p = r.passos[0]; assert.deepStrictEqual([p.k, p.a, p.b, p.c], [1, 1, 2, 1.5]); assert('fc' in p && 'erro' in p);
});
t('bissecção: f(a)f(b)>0 → SEM_TROCA_DE_SINAL', () => assert.equal((C.bisseccao({ f: 'x^2+1', a: -1, b: 1, tol: 1e-6, maxIter: 50 }).codigoErro), 'SEM_TROCA_DE_SINAL'));
t('newton x^2-2, x0=1 ≈ 1.41421 (derivada informada)', () => { const r = C.newton({ f: 'x^2 - 2', df: '2*x', x0: 1, tol: 1e-10, maxIter: 50 }); assert(!r.erro, r.erro); perto(r.resultado.raiz, Math.SQRT2, 1e-9); });
t('newton x^2-2, x0=1 (derivada simbólica automática)', () => { const r = C.newton({ f: 'x^2 - 2', df: '', x0: 1, tol: 1e-10, maxIter: 50 }); assert(!r.erro, r.erro); assert.equal(r.resultado.tipoDerivada, 'simbolica'); perto(r.resultado.raiz, Math.SQRT2, 1e-9); });
t('bissecção: a>b troca extremos com aviso', () => { const r = C.bisseccao({ f: 'x^3 - x - 2', a: 2, b: 1, tol: 1e-6, maxIter: 100 }); assert(!r.erro && r.avisos.length); perto(r.resultado.raiz, 1.5213797, 1e-5); });
t('parser: log = log10, ln = natural', () => { perto(E.compilar('log(100)')(0), 2, 1e-12); perto(E.compilar('ln(e)')(0), 1, 1e-12); });
t("newton: f'(x0)=0 → erro", () => assert.equal(C.newton({ f: 'x^2 - 2', df: '', x0: 0, tol: 1e-8, maxIter: 50 }).codigoErro, 'DERIVADA_ZERO'));
t('newton: divergência/estagnação reportada', () => assert(C.newton({ f: 'atan(x)', df: '', x0: 3, tol: 1e-8, maxIter: 50 }).erro));
t('gauss 3×3 conhecido → (2, 3, -1), com e sem pivoteamento', () => [false, true].forEach(piv => {
  const r = C.gauss({ matriz: [[2, 1, -1, 8], [-3, -1, 2, -11], [-2, 1, 2, -3]], pivoteamento: piv });
  assert(!r.erro, r.erro); [2, 3, -1].forEach((v, i) => perto(r.resultado.x[i], v, 1e-9));
  assert(r.passos.some(p => p.tipo === 'eliminacao') && r.passos.at(-1).tipo === 'fim' && r.passos.every(p => p.matriz));
  if (piv) assert(r.passos.some(p => p.tipo === 'troca'));
}));
t('gauss: singular → erro', () => { const r = C.gauss({ matriz: [[1, 2, 3], [2, 4, 6]], pivoteamento: true }); assert.equal(r.codigoErro, 'MATRIZ_SINGULAR'); assert.equal(r.resultado.classificacao, 'infinitas_solucoes'); });
t('adaptador tolera nomes alternativos', () => {
  const r = ctx.Visual.normalizar('newton', { etapas: [{ iteracao: 0, xk: 1, fxk: -1, derivada: 2, xProx: 1.5 }] });
  assert.deepStrictEqual([r.passos[0].k, r.passos[0].x, r.passos[0].xNovo], [0, 1, 1.5]);
});
console.log(`\n${ok}/${total} testes passaram.`);
