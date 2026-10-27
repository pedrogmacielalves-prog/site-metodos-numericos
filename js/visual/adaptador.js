/* Adaptador: normaliza o retorno de window.Metodos.* para o formato que as visualizações consomem.
   Tolera variações de nomes (passos/etapas/steps, k/iteracao, c/pontoMedio, xNovo/xProx...), para que a
   versão oficial do Matemático Numérico possa ser plugada sem mexer nas visualizações. */
(function (g) {
  'use strict';
  var V = g.Visual = g.Visual || {};
  function pega(o, nomes, padrao) { for (var i = 0; i < nomes.length; i++) if (o[nomes[i]] !== undefined) return o[nomes[i]]; return padrao; }
  function base(p) { return { etapa: pega(p, ['etapa', 'tag', 'marcador']), linha: pega(p, ['linha', 'linhaCodigo']), descricao: pega(p, ['descricao', 'mensagem', 'texto', 'explicacao'], ''), etapas: pega(p, ['etapas']), criterio: pega(p, ['criterio']), erroCriterio: pega(p, ['erroCriterio']), criterioFallback: !!pega(p, ['criterioFallback'], false) }; }
  var POR_METODO = {
    bisseccao: function (p, i, f) {
      var o = base(p);
      o.k = pega(p, ['k', 'iteracao', 'i'], i + 1); o.a = +pega(p, ['a', 'ak']); o.b = +pega(p, ['b', 'bk']);
      o.c = +pega(p, ['c', 'm', 'pontoMedio', 'medio', 'xm']);
      o.fa = pega(p, ['fa', 'fA', 'f_a']); o.fb = pega(p, ['fb', 'fB', 'f_b']); o.fc = pega(p, ['fc', 'fC', 'fm', 'f_c']);
      if (f) { if (o.fa == null) o.fa = f(o.a); if (o.fb == null) o.fb = f(o.b); if (o.fc == null) o.fc = f(o.c); }
      o.erro = pega(p, ['erro', 'erroEstimado', 'err', 'largura'], (o.b - o.a) / 2); o.manter = pega(p, ['manter', 'lado']);
      return o;
    },
    newton: function (p, i, f) {
      var o = base(p);
      o.k = pega(p, ['k', 'iteracao', 'i'], i); o.x = +pega(p, ['x', 'xk', 'x_k', 'xAtual']);
      o.fx = pega(p, ['fx', 'fxk', 'f_x', 'fX']); if (o.fx == null && f) o.fx = f(o.x);
      o.dfx = +pega(p, ['dfx', 'dfxk', 'derivada', 'df', 'fpx']); o.xNovo = +pega(p, ['xNovo', 'xProx', 'xk1', 'x_k1', 'proximo', 'xSeguinte']);
      o.erro = pega(p, ['erro', 'err', 'erroAbs'], Math.abs(o.xNovo - o.x));
      if (!o.descricao) o.descricao = 'x' + (o.k + 1) + ' = ' + o.xNovo;
      return o;
    },
    gauss: function (p, i, f, ant) {
      var o = base(p), t = String(pega(p, ['tipo', 'acao', 'operacao'], '')).toLowerCase();
      o.tipo = /coluna|column/.test(t) ? 'coluna' : /troca|swap/.test(t) ? 'troca' : /pivo|pivot/.test(t) ? 'pivo' : /elimin/.test(t) ? 'eliminacao' : /subst|regress/.test(t) ? 'substituicao' : /fim|final|solu/.test(t) ? 'fim' : 'inicio';
      o.matriz = pega(p, ['matriz', 'A', 'matrizAumentada', 'estado'], ant && ant.matriz);
      o.fase = pega(p, ['fase'], o.tipo === 'substituicao' || o.tipo === 'fim' ? 'substituicao' : 'eliminacao');
      o.linhas = pega(p, ['linhas', 'trocar', 'troca']); o.pivo = pega(p, ['pivo', 'pivô']);
      if (typeof o.pivo === 'number') o.pivo = { linha: o.pivo, coluna: o.pivo };
      o.linhaAlvo = pega(p, ['linhaAlvo', 'alvo', 'linhaOperada']); o.linhaPivo = pega(p, ['linhaPivo', 'origem', 'linhaOrigem']);
      if (o.linhaPivo == null && o.pivo) o.linhaPivo = o.pivo.linha;
      o.fator = pega(p, ['fator', 'm', 'multiplicador']); o.x = pega(p, ['x', 'solucao', 'xParcial']);
      o.k = pega(p, ['k']); o.etapa = pega(p, ['etapa'], o.etapa); o.descricao = pega(p, ['descricao'], o.descricao); o.troca = pega(p, ['troca']); o.fatores = pega(p, ['fatores']);
      if (o.tipo === 'coluna' && o.pivo == null && o.k != null) o.pivo = { linha: o.k, coluna: o.k };
      if (o.tipo === 'coluna' && Array.isArray(o.troca)) o.linhas = o.troca;
      o.etapas = pega(p, ['etapas']); o.aposTroca = o.tipo === 'pivo' && !!ant && ant.tipo === 'troca';
      o.indice = pega(p, ['indice', 'i', 'variavel']); if (o.tipo === 'substituicao' && o.indice == null) o.indice = o.linhaAlvo;
      return o;
    }
  };
  V.normalizar = function (metodo, res, f) {
    if (Array.isArray(res)) res = { passos: res };
    res = res || {};
    var brutos = pega(res, ['passos', 'etapas', 'steps'], []) || [], passos = [], ant = null;
    brutos.forEach(function (p, i) { ant = POR_METODO[metodo](p || {}, i, f, ant); passos.push(ant); });
    if (passos.length && metodo !== 'gauss') passos[passos.length - 1].ultimo = true; // usado pelo "Ver código" (BUG-13)
    var erro = pega(res, ['erro', 'error', 'mensagemErro'], null);
    return { passos: passos, resultado: pega(res, ['resultado', 'result', 'solucao'], null), erro: erro ? String(erro.message || erro) : null };
  };
})(window);
