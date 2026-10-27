const test = require('node:test'), assert = require('node:assert'), fs = require('fs'), vm = require('vm'), path = require('path');
const ctx = { window: {}, performance: { now: () => 0 }, requestAnimationFrame() {}, getComputedStyle: () => ({ getPropertyValue: () => '' }) };
ctx.window = ctx; vm.createContext(ctx); vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/visual/comum.js'), 'utf8'), ctx);
const V = ctx.Visual;
test('resíduos viram 0 e quase-inteiros saem inteiros', () => {
  assert.deepStrictEqual(JSON.parse(JSON.stringify(V.fmtSolucao([-3, -2, -5.742e-17, 2.9999999999], 9))), ['−3', '−2', '0', '3']);
});
test('casas consistentes quando não são inteiros', () => {
  assert.deepStrictEqual(JSON.parse(JSON.stringify(V.fmtSolucao([0.5, 1, 1e-17], 1))), ['0,500000', '1,000000', '0,000000']);
});
test('det em notação científica com vírgula', () => {
  assert.strictEqual(V.fmtCient(-1.56879e223), '−1,569 × 10²²³');
  assert.strictEqual(V.fmtCient(272), '272');
  assert.strictEqual(V.fmtCient(2.5e-7), '2,500 × 10⁻⁷');
});
