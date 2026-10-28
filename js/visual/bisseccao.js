/* Visualização da Bissecção: consome resultado.passos de Metodos.bisseccao. */
(function (g) {
  'use strict';
  var V = g.Visual;
  V.bisseccao = function (el) {
    var grafico = new g.Grafico(el.canvas), passos = [], cancelar = null, atual = null;
    var tabela = new V.Tabela(el.tbody, function (i) { el.player.pausar(); el.player.irPara(i); });
    var convergiu = false, ultimoLayout = '';
    function desenhar(a, b, p) {
      grafico.desenhar({
        antes: function (u) { var c = u.ctx; c.fillStyle = u.css('--canvas-intervalo-preenchimento'); c.fillRect(u.px(a), 0, u.px(b) - u.px(a), 9999);
          c.strokeStyle = u.css('--canvas-intervalo-borda'); c.setLineDash([5, 4]); c.beginPath(); c.moveTo(u.px(a), 0); c.lineTo(u.px(a), 9999); c.moveTo(u.px(b), 0); c.lineTo(u.px(b), 9999); c.stroke(); c.setLineDash([]); },
        depois: function (u) {
          var cor = function (v) { return (v > 0 ? u.css('--canvas-intervalo-borda') : u.css('--canvas-erro')); };
          g.Grafico.ponto(u, a, p.fa, u.css('--canvas-intervalo-borda'), null, 6, 'vazado');
          g.Grafico.ponto(u, b, p.fb, u.css('--canvas-intervalo-borda'), null, 6, 'vazado');
          var c = u.ctx; c.strokeStyle = u.css('--canvas-ponto-medio'); c.lineWidth = 1.5; c.beginPath(); c.moveTo(u.px(p.c), u.py(0)); c.lineTo(u.px(p.c), u.py(p.fc)); c.stroke();
          g.Grafico.ponto(u, p.c, p.fc, u.css('--canvas-ponto-medio'), null, 6);
          g.Grafico.ponto(u, p.c, 0, u.css('--canvas-ponto-medio'), null, 3);
          ultimoLayout = g.Grafico.rotulos(u, [{ x: p.c, y: p.fc, r: 6, prioridade: 0, texto: 'c ' + (p.fc > 0 ? '(+)' : p.fc < 0 ? '(−)' : '(0)') }, { x: a, y: p.fa, r: 6, prioridade: 1, texto: 'a ' + (p.fa > 0 ? '(+)' : '(−)') }, { x: b, y: p.fb, r: 6, prioridade: 2, texto: 'b ' + (p.fb > 0 ? '(+)' : '(−)') }]);
          if (el.canvas) el.canvas.dataset.rotulos = ultimoLayout;
          if (p.ultimo) g.Grafico.ponto(u, p.c, 0, u.css('--canvas-raiz'), null, 7, 'raiz');
        }
      });
    }
    return {
      carregar: function (res, f) {
        var campo = res.criterio === 'relativo' ? V.criterio.campoErro : 'erro';
        passos = res.passos; atual = null; convergiu = !!(res.resultado && res.resultado.convergiu);
        var p0 = passos[0] || {};
        grafico.definir(f, p0.a, p0.b, passos.length ? [p0.fa, p0.fb] : []);
        tabela.preencher(passos.map(function (p) { return [p.k, V.oito(p.a), V.oito(p.b), V.oito(p.c), V.oito(p.fa), V.oito(p.fb), V.oito(p.fc), (p[campo] == null ? '—' : V.oito(p[campo])) + (p.criterioFallback ? V.FALLBACK_HTML : '')]; }), passos.map(function (p) { return [null, p.a, p.b, p.c, p.fa, p.fb, p.fc, p[campo]]; }));
        tabela.marcarRaiz(convergiu);
        var th = el.tbody.closest('table').querySelector('.th-erro'); if (th) th.textContent = V.thErro('bisseccao', res.criterio === 'relativo');
        if (!passos.length) { grafico.desenhar(null); el.descricao.textContent = ''; }
      },
      mostrar: function (i) {
        var p = passos[i]; if (!p) return;
        p = Object.assign({}, p, { ultimo: convergiu && i === passos.length - 1 });
        if (cancelar) cancelar();
        var de = atual || p; atual = p;
        tabela.destacar(i);
        el.descricao.textContent = V.br('k = ' + p.k + ': c = (a + b)/2 = ' + V.fmt(p.c, 8) + ' · f(c) = ' + V.fmt(p.fc) + ' · ' + p.descricao);
        cancelar = V.animar(function (t) { desenhar(V.lerp(de.a, p.a, t), V.lerp(de.b, p.b, t), p); });
      }
    };
  };
})(window);
