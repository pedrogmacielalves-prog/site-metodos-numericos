/* Visualização do Newton-Raphson: consome os passos normalizados ({k, x, fx, dfx, xNovo, erro, descricao}).
   Enquadramento:
   - "Seguir passo" (padrão): a janela anima suavemente até cobrir x_k, x_{k+1} e a raiz (se não for outlier), com margem
     e largura mínima (legibilidade).
   - "Ver tudo": janela robusta sobre todos os iterados (quartis ± 3·IQR), ignorando outliers.
   Pontos fora da janela aparecem como setas na borda com rótulo; só x_k e x_{k+1} têm rótulo (iterados antigos: pontos discretos). */
(function (g) {
  'use strict';
  var V = g.Visual;
  var GPonto = function (u, x, y, cor, r) { var c = u.ctx; c.fillStyle = cor; c.beginPath(); c.arc(u.px(x), u.py(y), r || 5, 0, 7); c.fill(); };
  function rotulo(u, texto, px, py, alinhar) {
    var c = u.ctx; c.font = '600 12px ' + u.css('--fonte-texto'); c.textAlign = alinhar || 'center';
    c.lineWidth = 3; c.strokeStyle = u.css('--canvas-fundo'); c.strokeText(texto, px, py);
    c.fillStyle = u.css('--canvas-rotulo', '--cor-texto'); c.fillText(texto, px, py);
  }
  /* seta na borda para um ponto fora da área visível; devolve true se desenhou */
  function setaFora(u, x, y, texto, cor) {
    var px = u.px(x), py = u.py(y), dentroX = px >= u.esq && px <= u.dir, dentroY = py >= u.topo && py <= u.base;
    if (dentroX && dentroY) return false;
    var cx = Math.min(u.dir - 10, Math.max(u.esq + 10, px)), cy = Math.min(u.base - 10, Math.max(u.topo + 10, py));
    var ang = Math.atan2(py - cy, px - cx), c = u.ctx;
    c.save(); c.translate(cx, cy); c.rotate(ang); c.fillStyle = cor; c.beginPath(); c.moveTo(9, 0); c.lineTo(-6, -7); c.lineTo(-6, 7); c.closePath(); c.fill(); c.restore();
    var lx = cx - Math.cos(ang) * 16, ly = cy - Math.sin(ang) * 16 + 4;
    rotulo(u, texto + ' fora da tela', lx, ly, cx > (u.esq + u.dir) / 2 ? 'right' : 'left');
    return true;
  }
  function finitos(v) { return v.filter(function (x) { return isFinite(x); }); }
  function quantil(ord, q) { var p = (ord.length - 1) * q, i = Math.floor(p); return ord[i] + (ord[Math.min(i + 1, ord.length - 1)] - ord[i]) * (p - i); }

  V.newton = function (el) {
    var grafico = new g.Grafico(el.canvas), passos = [], f = null, raiz = null, cancelar = null;
    var modo = 'seguir', janela = null, larguraMin = 1e-6, janelaTudo = null;
    var tabela = new V.Tabela(el.tbody, function (i) { el.player.pausar(); el.player.irPara(i); });
    var btModo = document.getElementById('enquadrar-newton'), indice = 0;

    function janelaDoPasso(i) {
      if (!passos[i]) return [-1, 1];
      var p = passos[i], xs = finitos([p.x, p.xNovo]);
      var passo = Math.abs(p.xNovo - p.x) || larguraMin;
      // a raiz entra só se estiver "perto" do passo (senão é tratada como fora da tela)
      if (raiz != null && isFinite(raiz) && Math.abs(raiz - (p.x + p.xNovo) / 2) < 4 * passo + larguraMin) xs.push(raiz);
      var lo = Math.min.apply(null, xs), hi = Math.max.apply(null, xs), larg = Math.max(hi - lo, larguraMin), meio = (lo + hi) / 2;
      larg *= 1.5; // margem
      // divergência: se o passo explodir (> 20× a janela robusta), recorta na janela robusta e mostra setas de "fora da tela"
      if (janelaTudo && larg > 20 * (janelaTudo[1] - janelaTudo[0])) return janelaTudo;
      return [meio - larg / 2, meio + larg / 2];
    }
    function calcJanelaTudo() {
      var xs = []; passos.forEach(function (p) { xs.push(p.x, p.xNovo); }); if (raiz != null) xs.push(raiz);
      xs = finitos(xs).sort(function (a, b) { return a - b; });
      if (!xs.length) return [-1, 1];
      var q1 = quantil(xs, 0.25), q3 = quantil(xs, 0.75), iqr = Math.max(q3 - q1, larguraMin), lo = q1 - 3 * iqr, hi = q3 + 3 * iqr;
      var dentro = xs.filter(function (x) { return x >= lo && x <= hi; });
      lo = Math.min.apply(null, dentro); hi = Math.max.apply(null, dentro);
      var larg = Math.max(hi - lo, larguraMin) * 1.15, meio = (lo + hi) / 2;
      return [meio - larg / 2, meio + larg / 2];
    }
    function alvo(i) { return modo === 'tudo' ? janelaTudo : janelaDoPasso(i); }
    function desenhar(i, t, jan) {
      var p = passos[i]; if (!p) return;
      grafico.definir(f, jan[0], jan[1], isFinite(p.fx) ? [0, p.fx] : [0], 0);
      grafico.desenhar({ depois: function (u) {
        var c = u.ctx, corEixo = u.css('--canvas-eixo'), corRaiz = u.css('--canvas-raiz');
        // rastro: iterados anteriores sem rótulo
        for (var j = 0; j < i; j++) { var xj = passos[j].x; if (u.px(xj) >= u.esq && u.px(xj) <= u.dir) GPonto(u, xj, 0, corEixo, 3); }
        // guia vertical x_k → f(x_k)
        c.strokeStyle = corEixo; c.setLineDash([4, 4]); c.lineWidth = 1; c.beginPath(); c.moveTo(u.px(p.x), u.py(0)); c.lineTo(u.px(p.x), u.py(p.fx)); c.stroke(); c.setLineDash([]);
        // tangente crescendo de (x_k, f(x_k)) até x_{k+1} e um pouco além
        var ext = (p.xNovo - p.x) * 0.25, x1 = p.x - ext * t, x2 = V.lerp(p.x, p.xNovo + ext, t);
        var tg = function (x) { return p.fx + p.dfx * (x - p.x); };
        c.strokeStyle = u.css('--canvas-tangente'); c.lineWidth = 2; c.beginPath(); c.moveTo(u.px(x1), u.py(tg(x1))); c.lineTo(u.px(x2), u.py(tg(x2))); c.stroke();
        // x_k (rótulo acima do ponto) e x_{k+1} (rótulo abaixo do eixo) — nunca no mesmo lugar
        if (!setaFora(u, p.x, p.fx, 'x' + p.k, u.css('--canvas-funcao'))) {
          GPonto(u, p.x, p.fx, u.css('--canvas-funcao'), 5); GPonto(u, p.x, 0, u.css('--canvas-funcao'), 3);
          rotulo(u, 'x' + p.k, u.px(p.x), u.py(p.fx) + (p.fx >= 0 ? -10 : 18));
        }
        if (t > 0.85 && !setaFora(u, p.xNovo, 0, 'x' + (p.k + 1), corRaiz)) {
          g.Grafico.ponto(u, p.xNovo, 0, corRaiz, null, 7, 'losango');
          var dx = Math.abs(u.px(p.xNovo) - u.px(p.x));
          rotulo(u, 'x' + (p.k + 1), u.px(p.xNovo) + (dx < 30 ? 22 : 0), u.py(0) + (p.fx >= 0 ? 20 : -12));
        }
        if (raiz != null && i === passos.length - 1 && t > 0.85 && !setaFora(u, raiz, 0, 'raiz', corRaiz)) g.Grafico.ponto(u, raiz, 0, corRaiz, null, 7, 'raiz');
      } });
    }
    function mostrar(i, animarJanela) { if (!passos[i]) return; // BUG-02: sem passos (ex.: derivada nula em x0)
      if (!passos[i]) return; if (cancelar) cancelar();
      indice = i; tabela.destacar(i);
      el.descricao.textContent = V.br(passos[i].descricao + (/erro/i.test(passos[i].descricao) ? '' : ' · erro = ' + V.fmt(passos[i].erro)));
      var de = janela || alvo(i), para = alvo(i);
      cancelar = V.animar(function (t) {
        // zoom em escala logarítmica da largura (suave mesmo com mudanças de várias ordens de grandeza)
        var l0 = de[1] - de[0], l1 = para[1] - para[0], l = Math.exp(V.lerp(Math.log(l0), Math.log(l1), t));
        var m = V.lerp((de[0] + de[1]) / 2, (para[0] + para[1]) / 2, t);
        janela = [m - l / 2, m + l / 2];
        desenhar(i, animarJanela === false ? 1 : t, janela);
      });
    }
    if (btModo) btModo.addEventListener('click', function () {
      modo = modo === 'seguir' ? 'tudo' : 'seguir';
      btModo.textContent = modo === 'seguir' ? 'Ver tudo' : 'Seguir passo';
      btModo.setAttribute('aria-pressed', String(modo === 'tudo'));
      mostrar(indice, false);
    });
    window.addEventListener('resize', function () { if (passos[indice] && janela) desenhar(indice, 1, janela); });
    return {
      carregar: function (res, fn) {
        var campo = res.criterio === 'relativo' ? V.criterio.campoErro : 'erro';
        passos = res.passos; f = fn; janela = null; indice = 0;
        raiz = res.resultado && res.resultado.convergiu && isFinite(res.resultado.raiz) ? res.resultado.raiz : null;
        var p0 = passos[0];
        // largura mínima: 2% do 1º passo (ou 1e-3·escala), para a curva continuar legível nos passos finais
        larguraMin = p0 ? Math.max(Math.abs(p0.xNovo - p0.x) * 0.02, 1e-9 * (1 + Math.abs(p0.x)), 1e-3 * Math.min(1, Math.abs(p0.xNovo - p0.x) || 1)) : 1;
        if (!isFinite(larguraMin) || larguraMin <= 0) larguraMin = 1e-3;
        janelaTudo = calcJanelaTudo();
        tabela.preencher(passos.map(function (p) { return [p.k + 1, V.sig6(p.x), V.sig6(p.fx), V.sig6(p.dfx), V.sig6(p.xNovo), (p[campo] == null ? '—' : V.sig6(p[campo])) + (p.criterioFallback ? V.FALLBACK_HTML : '')]; }), passos.map(function (p) { return [null, p.x, p.fx, p.dfx, p.xNovo, p[campo]]; }));
        tabela.marcarRaiz(!!(res.resultado && res.resultado.convergiu));
        var th = el.tbody.closest('table').querySelector('.th-erro'); if (th) th.textContent = V.thErro('newton', res.criterio === 'relativo');
        if (!passos.length) { grafico.definir(fn, -1, 1, []); grafico.desenhar(null); el.descricao.textContent = ''; }
      },
      mostrar: function (i) { mostrar(i); }
    };
  };
})(window);
