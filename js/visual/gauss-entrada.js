/* Utilitários de INTERFACE para a entrada do Gauss (não é método numérico):
   - V.gaussEntrada.limitarN(n)        → {n, ajustado} dentro de [2, 10]
   - V.gaussEntrada.redimensionar(M,n) → nova matriz aumentada n×(n+1) preservando valores; b sempre na última coluna
   - V.gaussEntrada.aleatorio(n, rnd)  → {matriz, x}: A inteira estritamente diagonal dominante (logo det ≠ 0),
                                         coeficientes em −9..9, x inteiro em −5..5, b = A·x. */
(function (g) {
  'use strict';
  var V = g.Visual = g.Visual || {};
  var MIN = 2, MAX = 100, MAX_GRADE = 10;
  function inteiro(rnd, a, b) { return a + Math.floor(rnd() * (b - a + 1)); }
  V.gaussEntrada = {
    MIN: MIN, MAX: MAX, MAX_GRADE: MAX_GRADE,
    limitarN: function (v) {
      var n = Math.round(+v); if (!isFinite(n)) return { n: 3, ajustado: true };
      var m = Math.min(MAX, Math.max(MIN, n)); return { n: m, ajustado: m !== +v };
    },
    redimensionar: function (M, n) {
      M = M || []; var nAnt = M.length, R = [];
      for (var i = 0; i < n; i++) {
        var lin = M[i] || [], nova = [];
        for (var j = 0; j < n; j++) nova.push(i < nAnt && j < nAnt && lin[j] != null ? lin[j] : '');
        nova.push(i < nAnt && lin[nAnt] != null ? lin[nAnt] : ''); // b continua na última coluna
        R.push(nova);
      }
      return R;
    },
    aleatorio: function (n, rnd) {
      rnd = rnd || Math.random;
      var A = [], x = [], i, j;
      for (i = 0; i < n; i++) x.push(inteiro(rnd, -5, 5));
      for (i = 0; i < n; i++) {
        var lin = [], soma = 0, naoNulos = 0;
        for (j = 0; j < n; j++) {
          if (j === i) { lin.push(0); continue; }
          // fora da diagonal: |a| ≤ 3, soma dos módulos ≤ 7 → diagonal cabe em −9..9 e domina estritamente
          var v = inteiro(rnd, -3, 3); if (soma + Math.abs(v) > 7) v = 0;
          soma += Math.abs(v); if (v) naoNulos++; lin.push(v);
        }
        var d = inteiro(rnd, soma + 1, 9); lin[i] = rnd() < 0.5 ? -d : d;
        A.push(lin);
      }
      return { matriz: A.map(function (lin) { var b = 0; for (var k = 0; k < n; k++) b += lin[k] * x[k]; return lin.concat([b]); }), x: x };
    }
  };
  /* b colado: uma coluna (um valor por linha) ou uma linha (tab, ; ou espaço; vírgula = decimal, ou separador se for o único). */
  g.Visual.gaussEntrada.lerVetor = function (t) {
    var linhas = String(t || '').split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean), tokens = [];
    if (!linhas.length) return { erro: 'b está vazio.', valores: [] };
    if (linhas.length === 1) { var l = linhas[0]; tokens = /[\t; ]/.test(l) ? l.split(/[\t; ]+/) : l.split(','); if (/[\t; ]/.test(l)) tokens = tokens.map(function (x) { return x.replace(',', '.'); }); }
    else tokens = linhas.map(function (x) { return x.replace(/[;\t]+$/, '').replace(',', '.'); });
    var v = [];
    for (var k = 0; k < tokens.length; k++) { var x = tokens[k].trim(); if (x === '') continue; var num = +x.replace('−', '-');
      if (!isFinite(num)) return { erro: 'b, valor ' + (v.length + 1) + ': "' + x + '" não é um número.', valores: [] }; v.push(num); }
    return { erro: null, valores: v };
  };
})(typeof window !== 'undefined' ? window : globalThis);
