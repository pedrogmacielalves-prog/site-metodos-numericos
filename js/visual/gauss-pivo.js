/* Pivoteamento do Gauss na interface: modo (automatico|sempre|nunca), selo do motivo da troca,
   contagem de trocas e comparação do modo Nunca. Lê pivo.troca = {tipo, motivo, de, para} do núcleo;
   na falta, deduz: obrigatória se o pivô original for ~0, recomendada caso contrário (modo automático). */
(function (g) {
  'use strict';
  var V = g.Visual = g.Visual || {};
  var P = V.pivo = {};
  var ROT = { obrigatoria: 'obrigatória', recomendada: 'recomendada', classica: 'maior |a|' };
  /* Valor a passar para executar.gauss. Núcleo novo (Metodos.escolherPivo ou modosPivoteamento) recebe a string;
     núcleo antigo só entende booleano, e 'nunca' como string seria verdadeiro. */
  P.paraNucleo = function (modo) {
    var M = g.Metodos || {};
    if (M.escolherPivo || M.modosPivoteamento) return modo; // núcleo novo: 'automatico'|'sempre'|'nunca'
    return modo !== 'nunca';
  };
  function absBR(v) { return '|' + V.br(V.fmt(Math.abs(v) < 1e-300 ? 0 : v, 4)) + '|'; }
  /* Informação de troca de um passo (troca, pivo ou coluna). anterior = passo anterior (para deduzir o pivô original). */
  P.info = function (passos, i, modo) {
    var p = passos[i]; if (!p || !/^(troca|pivo|coluna)$/.test(p.tipo)) return null;
    var k = p.pivo ? p.pivo.coluna : p.k, t = p.pivo && p.pivo.troca && typeof p.pivo.troca === 'object' && !Array.isArray(p.pivo.troca) ? p.pivo.troca : null;
    if (!t && p.trocaInfo) t = p.trocaInfo;
    var linhas = p.tipo === 'troca' ? p.linhas : p.tipo === 'coluna' && Array.isArray(p.troca) ? p.troca : null;
    if (p.tipo === 'pivo' && passos[i - 1] && passos[i - 1].tipo === 'troca') { linhas = passos[i - 1].linhas; if (!t) return P.info(passos, i - 1, modo); }
    var decisao = p.pivo && p.pivo.decisao;
    var houve = t ? t.tipo != null : decisao ? decisao === 'troca' : !!linhas;
    var de = t && t.de != null ? t.de : linhas ? Math.max(linhas[0], linhas[1]) : null;
    var j = p.tipo === 'pivo' && linhas ? i - 2 : i - 1; while (j > 0 && passos[j] && !passos[j].matriz) j--;
    var Mant = passos[j] && passos[j].matriz, orig = Mant && k != null && Mant[k] ? Mant[k][k] : null, novo = p.pivo && p.pivo.valor != null ? p.pivo.valor : (Mant && de != null && Mant[de] ? Mant[de][k] : null);
    if (!houve) return modo === 'automatico' ? { tipo: null, texto: 'Pivô ok, sem troca', k: k } : null;
    var tipo = t && t.tipo ? t.tipo : modo === 'sempre' ? 'classica' : (orig == null || Math.abs(orig) < 1e-12 ? 'obrigatoria' : 'recomendada');
    if (t && t.valorOriginal != null) orig = t.valorOriginal; if (t && t.valorNovo != null) novo = t.valorNovo;
    var texto;
    var lin = de != null && k != null ? 'L' + (k + 1) + ' ↔ L' + (de + 1) : '', detalhe = lin;
    if (tipo === 'obrigatoria') texto = 'Troca obrigatória: pivô zero';
    else if (tipo === 'recomendada') { texto = 'Troca recomendada: pivô pequeno'; if (orig != null && novo != null) detalhe = absBR(orig) + ' ≪ ' + absBR(novo); }
    else texto = 'Pivoteamento parcial: maior |a| da coluna';
    return { tipo: tipo, texto: texto, detalhe: detalhe, descricao: t && t.descricao ? V.br(String(t.descricao)) : '', k: k, de: de, para: t && t.para != null ? t.para : k };
  };
  /* Contagem por coluna (cada coluna conta uma vez). */
  P.contar = function (passos, modo) {
    var c = { total: 0, obrigatoria: 0, recomendada: 0, classica: 0 };
    passos.forEach(function (p, i) { if (p.tipo !== 'troca' && p.tipo !== 'coluna') return; var inf = P.info(passos, i, modo); if (inf && inf.tipo) { c.total++; c[inf.tipo] = (c[inf.tipo] || 0) + 1; } });
    return c;
  };
  P.resumo = function (passos, modo, resultado) {
    var tr = resultado && resultado.trocas, c = tr && typeof tr === 'object' ? { total: tr.total || 0, obrigatoria: tr.obrigatorias || 0, recomendada: tr.recomendadas || 0, classica: tr.classicas || 0 } : P.contar(passos, modo); if (!c.total) return 'Nenhuma troca de linha.';
    var partes = ['obrigatoria', 'recomendada', 'classica'].filter(function (t) { return c[t]; }).map(function (t) { return '[' + GLIFO[t] + '] ' + c[t] + ' ' + (t === 'classica' ? (c[t] > 1 ? 'clássicas' : 'clássica') : ROT[t] + (c[t] > 1 ? 's' : '')); });
    return c.total + (c.total === 1 ? ' troca: ' : ' trocas: ') + partes.join(', ') + '.';
  };
  var GLIFO = { obrigatoria: '!', recomendada: 'i', classica: '⇅' };
  P.glifo = function (tipo) { return '<span class="selo-troca selo-troca--' + tipo + ' resumo-glifo"><span class="selo-troca__glifo" aria-hidden="true"><span>' + GLIFO[tipo] + '</span></span></span>'; };
  P.selo = function (inf) {
    if (!inf) return '';
    if (!inf.tipo) return '<span class="pivo-ok">' + inf.texto + '</span>';
    return '<span class="selo-troca selo-troca--' + inf.tipo + '"' + (inf.descricao ? ' title="' + inf.descricao.replace(/"/g, '&quot;') + '"' : '') + '><span class="selo-troca__glifo" aria-hidden="true"><span>' + GLIFO[inf.tipo] + '</span></span><span class="selo-troca__texto">' + inf.texto + (inf.detalhe ? ' <span class="selo-troca__detalhe">' + inf.detalhe + '</span>' : '') + '</span></span>';
  };
  /* resultado.comparacao: aceita {sem|semPivoteamento|nunca, com|comPivoteamento|pivoteada} com {x, residuo, erro}. */
  function lado(c, nomes) { for (var i = 0; i < nomes.length; i++) if (c[nomes[i]]) return c[nomes[i]]; return null; }
  P.comparacao = function (res) {
    var c = res && (res.comparacao || res.comparação); if (!c) return '';
    var sem = lado(c, ['semPivo', 'sem', 'semPivoteamento', 'nunca', 'semPivo']), com = lado(c, ['comPivo', 'com', 'comPivoteamento', 'pivoteada', 'pivoteado', 'comPivo']);
    if (!sem || !com) return '';
    function num(v) { var t = v == null || !isFinite(v) ? '—' : v === 0 ? '0' : V.extremo(v) ? V.fmtE(v) : V.fmtCient(v); return v == null || !isFinite(v) ? t : '<span title="' + V.completo(v) + '">' + t + '</span>'; }
    function col(t, o, cls, id) { var x = o.x || []; return '<section class="caixa-comparacao' + cls + '" aria-labelledby="' + id + '"><h3 id="' + id + '">' + t + '</h3><dl><dt>Erro relativo à solução pivoteada</dt><dd>' + num(o.erro) + '</dd><dt>Resíduo relativo ‖Ax − b‖ / ‖b‖</dt><dd>' + num(o.residuo) + '</dd>' +
      (x.length && x.length <= 10 ? '<dt>x</dt><dd>' + V.fmtSolucao(x, 0).map(function (s, i) { return '<span title="' + V.completo(x[i]) + '">x' + (i + 1) + ' = ' + s + '</span>'; }).join('; ') + '</dd>' : '') + '</dl></section>'; }
    return '<section class="comparacao" aria-label="Comparação com pivoteamento"><h3 class="comparacao__titulo">Modo Nunca: comparação com a solução pivoteada</h3><div class="comparacao__grade">' + col('Sem pivoteamento (este cálculo)', sem, '', 'cmp-sem') + col('Com pivoteamento parcial', com, ' caixa-comparacao--referencia', 'cmp-com') + '</div></section>';
  };
})(window);
