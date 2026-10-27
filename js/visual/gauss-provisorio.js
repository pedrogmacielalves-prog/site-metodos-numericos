/* FALLBACK de interface: usado SÓ se Metodos.lerMatrizTexto não existir (o núcleo já a oferece; ver docs/contrato-etapas.md).
   O agrupador provisório por coluna foi removido: o núcleo entrega granularidade 'coluna' para n > 10. */
(function (g) {
  'use strict';
  var V = g.Visual = g.Visual || {};
  var P = V.provisorio = {};
  /* Texto colado (Excel/CSV): separadores tab, ';', ',' ou espaço; decimal com vírgula ou ponto.
     Devolve {ok, linhas, colunas, M, A, b, n, erro, codigoErro}. Não decide n: quem chama compara com o n escolhido. */
  P.lerMatrizTexto = function (texto) {
    var linhas = String(texto || '').replace(/\r/g, '').split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
    if (!linhas.length) return { ok: false, codigoErro: 'VAZIO', erro: 'Cole ao menos uma linha.' };
    var M = [], i;
    for (i = 0; i < linhas.length; i++) {
      var l = linhas[i], cel;
      if (/\t/.test(l)) cel = l.split('\t');
      else if (/;/.test(l)) cel = l.split(';');                 // ; separa → vírgula é decimal
      else if (/\s/.test(l)) cel = l.split(/\s+/);              // espaço separa → vírgula é decimal
      else cel = l.split(',');                                   // só vírgulas → separador (decimal com ponto)
      var nums = [];
      for (var j = 0; j < cel.length; j++) {
        var s = cel[j].trim().replace(/[|\[\]]/g, ''); if (s === '') continue;
        var v = Number(s.replace(',', '.'));
        if (!isFinite(v)) return { ok: false, codigoErro: 'NUMERO_INVALIDO', erro: 'Linha ' + (i + 1) + ', coluna ' + (j + 1) + ': "' + cel[j].trim() + '" não é um número.' };
        nums.push(v);
      }
      if (nums.length) M.push(nums);
    }
    var k = M.length, c = M[0].length;
    if (M.some(function (r) { return r.length !== c; })) return { ok: false, codigoErro: 'LINHAS_DESIGUAIS', linhas: k, erro: 'As linhas têm quantidades diferentes de valores; o formato esperado é n linhas com n + 1 valores (A | b).' };
    var r = { linhas: k, colunas: c, M: M };
    if (c !== k + 1) { r.ok = false; r.codigoErro = 'FORMATO'; r.erro = 'O texto colado é ' + k + '×' + c + ' (n linhas com n valores de A + 1 de b); o formato esperado é n×(n+1) (n linhas, n coeficientes + b).'; return r; }
    if (k < 2 || k > 100) { r.ok = false; r.codigoErro = 'TAMANHO'; r.erro = 'O texto colado é ' + k + '×' + c + '; n deve estar entre 2 e 100.'; return r; }
    r.ok = true; r.n = k; r.A = M.map(function (l) { return l.slice(0, k); }); r.b = M.map(function (l) { return l[k]; });
    return r;
  };
})(typeof window !== 'undefined' ? window : globalThis);
