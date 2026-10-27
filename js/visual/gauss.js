/* Visualização da Eliminação de Gauss: consome resultado.passos de Metodos.gauss. */
(function (g) {
  'use strict';
  var V = g.Visual;
  V.gauss = function (el) {
    var passos = [], mapa = null, compacto = false, modo = 'automatico', resultado = null;
    var escala = 0;
    function solucao(x, destaque) {
      var lista = x.length > 10; el.solucao.classList.toggle('solucao--lista', lista);
      if (lista && x.every(function (v) { return v == null; })) { el.solucao.innerHTML = '<p class="solucao__vazia">x calculado na substituição regressiva (último passo).</p>'; return; }
      var t = V.fmtSolucao(x, escala);
      if (lista) { el.solucao.innerHTML = '<table class="tabela-x" aria-label="Solução x"><thead><tr><th scope="col">i</th><th scope="col">xᵢ</th></tr></thead><tbody>' + x.map(function (v, k) { return '<tr><th scope="row">x' + (k + 1) + '</th><td title="' + V.completo(v) + '">' + t[k] + '</td></tr>'; }).join('') + '</tbody></table>'; return; }
      el.solucao.innerHTML = x.map(function (v, k) {
        return '<span class="' + (v == null ? 'vazio' : (destaque === k ? 'novo' : '')) + '"' + (v == null ? '' : ' title="' + V.completo(v) + '"') + '>x' + (k + 1) + ' = ' + t[k] + '</span>';
      }).join('');
    }
    function mostrarCompacto(p) {
      if (!mapa) mapa = new V.MapaMatriz(el.mapa, el.mapaDica, el.mapaStatus);
      mapa.carregar(p.matriz, p);
      var n0 = p.matriz.length; el.descricao.textContent = V.br((p.tipo === 'substituicao' || p.tipo === 'fim') && n0 > 10 ? 'Substituição regressiva concluída: as ' + n0 + ' componentes de x estão na lista abaixo.' : (p.descricao || ''));
      var n = p.matriz.length; solucao(p.x || new Array(n).fill(null), null);
    }
    return {
      carregar: function (res) { passos = res.passos; modo = res.modoPivo || 'automatico'; resultado = res.resultado; if (el.pivo) el.pivo.innerHTML = ''; if (el.comparacao) el.comparacao.innerHTML = ''; if (el.seloMapa) el.seloMapa.hidden = true; escala = V.escalaMatriz(passos[0] && passos[0].matriz); el.matriz.innerHTML = ''; el.solucao.innerHTML = ''; el.solucao.classList.remove('solucao--lista'); el.descricao.textContent = '';
        var p0 = passos[0]; compacto = !!(p0 && p0.matriz && p0.matriz.length > 10) || passos.some(function (q) { return q.tipo === 'coluna'; });
        el.mapaBloco.hidden = !compacto; el.matrizBloco.hidden = compacto; if (el.legendaGrade) el.legendaGrade.hidden = compacto; if (!compacto && el.mapaDica) el.mapaDica.hidden = true; },
      mostrar: function (i, anterior) {
        var p = passos[i]; if (!p) return;
        var inf = V.pivo.info(passos, i, modo);
        if (el.pivo) el.pivo.innerHTML = V.pivo.selo(inf);
        if (el.comparacao) el.comparacao.innerHTML = i === passos.length - 1 ? V.pivo.comparacao(resultado) : '';
        if (compacto) { mostrarCompacto(p);
          if (el.seloMapa) el.seloMapa.hidden = true; // selo fica no HTML acima do mapa (#pivo-gauss)
          return; }
        var M = p.matriz, n = M.length, txt = M.map(function (linha, r) { return linha.map(function (v, c) { var ehPivo = c === r || (p.pivo && p.pivo.linha === r && p.pivo.coluna === c); var w = ehPivo ? v : V.limpar(v, escala); return V.sig(w, 4); }); }),
          temCient = M.some(function (l, r) { return l.some(function (v, c) { var w = c === r ? v : V.limpar(v, escala); return w !== 0 && isFinite(w) && V.extremo(w); }); }),
          largo = V.largo(), cols = 'grid-template-columns: 2.4em repeat(' + (n + 1) + ', ' + (largo ? 'minmax(0, 1fr)' : temCient ? 'minmax(4.5em, 1fr)' : 'minmax(5.2em, 1fr)') + ')';
        var html = '<div class="mv-cabeca" style="' + cols + '"><span></span>' + M.map(function (_, c) { return '<span class="rotulo">x' + (c + 1) + '</span>'; }).join('') + '<span class="rotulo rotulo-b">b</span></div>';
        /* diagonal M[k][k]: sempre o valor real (pivô pequeno não vira 0) */
        M.forEach(function (linha, r) {
          var cls = 'mv-linha';
          if (p.tipo === 'eliminacao' && r === p.linhaAlvo) cls += ' alvo';
          if ((p.tipo === 'eliminacao' || p.tipo === 'pivo') && r === p.linhaPivo) cls += ' origem';
          if (p.tipo === 'substituicao' && r === p.indice) cls += ' alvo';
          if (p.tipo === 'troca' && p.linhas.indexOf(r) >= 0) cls += ' trocando';
          var desloc = p.tipo === 'troca' ? (r === p.linhas[0] ? (p.linhas[1] - p.linhas[0]) : (p.linhas[0] - p.linhas[1])) * 44 : 0;
          html += '<div class="' + cls + '" style="' + cols + ';--desloc:' + desloc + 'px"><span class="rotulo">L' + (r + 1) + '</span>' +
            linha.map(function (v, c) {
              var cc = 'cel' + (c === n ? ' b' : '') + (p.pivo && p.pivo.linha === r && p.pivo.coluna === c ? ' pivo' : '') + (V.limpar(v, escala) === 0 && c < n ? ' zerado' : '');
              var t = txt[r][c], w = c === r || (p.pivo && p.pivo.linha === r && p.pivo.coluna === c) ? v : V.limpar(v, escala), tt = V.completo(w); return '<span class="' + cc + '" data-v="' + w + '" title="' + tt + '" aria-label="' + (c === n ? 'b' + (r + 1) : 'L' + (r + 1) + ', C' + (c + 1)) + ' = ' + tt + '">' + t + '</span>';
            }).join('') + '</div>';
        });
        el.matriz.innerHTML = html; el.matriz.classList.toggle('grade--rola', !largo);
        var celsV = el.matriz.querySelectorAll('.cel[data-v]'), lerV = function (c) { return +c.dataset.v; }, escV = function (c, t) { c.textContent = t; };
        /* piso 4 algarismos (xs): se não couber no fluido, troca para larguras mínimas e rola por dentro (como na largura estreita) */
        if (!V.caberCelulas(celsV, lerV, escV, el.matriz) && largo) { largo = false; var colsR = 'repeat(' + (n + 1) + ', ' + (temCient ? 'minmax(4.5em, 1fr)' : 'minmax(5.2em, 1fr)') + ')';
          el.matriz.classList.add('grade--rola'); el.matriz.querySelectorAll('.mv-cabeca, .mv-linha').forEach(function (l) { l.style.gridTemplateColumns = '2.4em ' + colsR; }); V.caberCelulas(celsV, lerV, escV, el.matriz); } if (p.tipo === 'troca') { var ls = el.matriz.querySelectorAll('.mv-linha'), h = ls[1] ? ls[1].getBoundingClientRect().height + 4 : 44; ls.forEach(function (l) { var d = parseFloat(l.style.getPropertyValue('--desloc')) || 0; if (d) l.style.setProperty('--desloc', (d / 44 * h) + 'px'); }); } if (V.gaussIndicarRolagem) V.gaussIndicarRolagem();
        el.descricao.textContent = V.br((p.fase === 'substituicao' ? 'Substituição regressiva — ' : 'Escalonamento — ') + p.descricao);
        solucao(p.x || new Array(n).fill(null), p.indice);
      }
    };
  };
})(window);
