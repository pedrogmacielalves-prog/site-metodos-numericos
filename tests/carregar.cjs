// Carrega os scripts do site (sem import/export) num contexto isolado, como o navegador faria.
const vm = require('node:vm'), fs = require('node:fs'), path = require('node:path');
module.exports = function carregar() {
  const ctx = { console };
  ctx.window = ctx;
  vm.createContext(ctx);
  ['js/expressao.js', 'js/metodos/comum.js', 'js/metodos/avisos.js', 'js/metodos/bisseccao.js', 'js/metodos/newton.js', 'js/metodos/gauss.js', 'js/metodos/validacao.js']
    .forEach((f) => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), ctx, { filename: f }));
  return { E: ctx.Expressao, M: ctx.Metodos };
};
