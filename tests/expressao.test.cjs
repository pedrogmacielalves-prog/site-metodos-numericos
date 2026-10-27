const test = require('node:test'), assert = require('node:assert');
const { E } = require('./carregar.cjs')();
const perto = (a, b, tol = 1e-12) => assert.ok(Math.abs(a - b) < tol, `${a} ≠ ${b}`);
const v = (s, x = 0) => E.compilar(s)(x);

test('precedência e associatividade', () => {
  perto(v('2+3*4'), 14); perto(v('2^3^2'), 512); perto(v('(2^3)^2'), 64); perto(v('8/4/2'), 1); perto(v('10-4-3'), 3);
});
test('menos unário: -x^2 = -(x^2)', () => {
  perto(v('-x^2', 3), -9); perto(v('2^-1'), 0.5); perto(v('--x', 2), 2); perto(v('(-x)^2', 3), 9);
});
test('multiplicação implícita', () => {
  perto(v('2x', 3), 6); perto(v('3(x+1)', 1), 6); perto(v('2pi'), 2 * Math.PI); perto(v('(x+1)(x-1)', 3), 8); perto(v('2x^2', 3), 18);
});
test('funções, aliases e constantes', () => {
  perto(v('sen(pi/2) + tg(0) + exp(0) + ln(e) + sqrt(4) + log(100) + log2(8) + cbrt(27) + abs(-1)'), 1 + 0 + 1 + 1 + 2 + 2 + 3 + 3 + 1);
  perto(v('1e-3'), 0.001); perto(v('x**2', 3), 9);
});
test('rejeita código malicioso e nomes perigosos', () => {
  ['alert(1)', 'constructor', '__proto__', 'x.constructor', 'this', '`x`', 'x[0]', 'x;1', 'eval("1")', 'Function("return 1")()', 'toString(x)', 'hasOwnProperty(x)']
    .forEach((s) => assert.throws(() => E.compilar(s), /./, s));
});
test('erros didáticos com posição', () => {
  assert.throws(() => E.compilar('2,5'), /ponto/);
  assert.throws(() => E.compilar('(x+1'), /parêntese/);
  assert.throws(() => E.compilar('x+'), (e) => e.codigo === 'ERRO_SINTAXE' && e.detalhes.posicao === 2);
  assert.throws(() => E.compilar('x+'.repeat(200) + 'x'), (e) => e.codigo === 'EXPRESSAO_LONGA_DEMAIS');
  assert.throws(() => E.compilar('('.repeat(100) + 'x' + ')'.repeat(100)), (e) => e.codigo === 'EXPRESSAO_PROFUNDA_DEMAIS');
});
test('derivada simbólica com simplificação', () => {
  assert.strictEqual(E.derivar('x^2 - 2').texto, '2 * x');
  assert.strictEqual(E.derivar('atan(x)').texto, '1 / (1 + x^2)');
  const d = E.derivar('x^3*sin(x)'), x = 1.3;
  perto(d(x), 3 * x * x * Math.sin(x) + x ** 3 * Math.cos(x), 1e-12);
  perto(E.derivadaNumerica(E.compilar('exp(x)'), 1), Math.E, 1e-8);
});
