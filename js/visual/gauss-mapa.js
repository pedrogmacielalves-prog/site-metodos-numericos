/* Mapa de cores (canvas) da matriz aumentada para n > 10 — modo compacto do Gauss.
   Cor: sinal (+ → --canvas-intervalo-borda, − → --canvas-erro); intensidade em escala log de |v|;
   zeros eliminados quase transparentes; pivô em --canvas-pivo; coluna k atual tracejada; b separada por um vão.
   Interação: roda/pinça = zoom, arrastar = mover, passar o mouse/tocar = dica "Li, Cj = valor";
   teclado (canvas focável): setas movem o cursor de célula, +/− zoom, 0 restaura. */
(function (g) {
  'use strict';
  var V = g.Visual;
  V.MapaMatriz = function (canvas, dica, status) {
    this.c = canvas; this.dica = dica; this.status = status; this.M = null; this.passo = null;
    this.z = 1; this.ox = 0; this.oy = 0; this.cur = null; this.toques = {};
    var self = this;
    canvas.addEventListener('wheel', function (e) { e.preventDefault(); var r = canvas.getBoundingClientRect(); self.zoom(e.deltaY < 0 ? 1.25 : 0.8, e.clientX - r.left, e.clientY - r.top); }, { passive: false });
    canvas.addEventListener('pointerdown', function (e) { canvas.setPointerCapture(e.pointerId); self.toques[e.pointerId] = { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY }; });
    canvas.addEventListener('pointermove', function (e) {
      var t = self.toques[e.pointerId], ids = Object.keys(self.toques), r = canvas.getBoundingClientRect();
      if (t && ids.length === 2) { // pinça
        var o = self.toques[ids[0] == e.pointerId ? ids[1] : ids[0]];
        var d0 = Math.hypot(t.x - o.x, t.y - o.y), d1 = Math.hypot(e.clientX - o.x, e.clientY - o.y);
        if (d0 > 0) self.zoom(d1 / d0, (e.clientX + o.x) / 2 - r.left, (e.clientY + o.y) / 2 - r.top);
      } else if (t && ids.length === 1 && Math.hypot(e.clientX - t.x0, e.clientY - t.y0) > 4) { self.ox += e.clientX - t.x; self.oy += e.clientY - t.y; self.limitar(); self.desenhar(); }
      if (t) { t.x = e.clientX; t.y = e.clientY; }
      if (e.pointerType === 'mouse' || !t) self.mostrarDica(e.clientX - r.left, e.clientY - r.top);
    });
    var soltar = function (e) { var t = self.toques[e.pointerId]; delete self.toques[e.pointerId];
      if (t && Math.hypot(e.clientX - t.x0, e.clientY - t.y0) <= 4) { var r = canvas.getBoundingClientRect(); self.mostrarDica(e.clientX - r.left, e.clientY - r.top, true); } };
    canvas.addEventListener('pointerup', soltar); canvas.addEventListener('pointercancel', soltar);
    canvas.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') self.dica.hidden = true; });
    canvas.addEventListener('keydown', function (e) {
      if (!self.M) return; var n = self.M.length, c = self.cur || { i: 0, j: 0 };
      var mapa = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[e.key];
      if (mapa) { e.preventDefault(); self.cur = { i: Math.max(0, Math.min(n - 1, c.i + mapa[0])), j: Math.max(0, Math.min(n, c.j + mapa[1])) }; self.anunciar(); self.desenhar(); }
      else if (e.key === '+' || e.key === '=') { self.zoom(1.25); } else if (e.key === '-') { self.zoom(0.8); } else if (e.key === '0') { self.z = 1; self.ox = self.oy = 0; self.desenhar(); }
    });
    window.addEventListener('resize', function () { if (self.M && !canvas.hidden) self.desenhar(); });
  };
  var P = V.MapaMatriz.prototype;
  P.geo = function () {
    var n = this.M.length, W = this.c.clientWidth, H = this.c.clientHeight, rot = 26, gap = 1, cols = n + 1 + gap;
    var cel = Math.max(0.5, Math.min((W - rot - 4) / cols, (H - rot - 4) / n)) * this.z; // BUG-14: z = 1 enquadra a matriz inteira (largura e altura)
    return { n: n, rot: rot, cel: cel, gap: gap, x0: rot + this.ox, y0: rot + this.oy };
  };
  /* centro (px CSS) da coluna j, para o selo da troca; null se fora da área visível */
  P.xColuna = function (j) { if (!this.M) return null; var gg = this.geo(), x = gg.x0 + (j + 0.5) * gg.cel; return x < gg.rot || x > this.c.clientWidth ? null : x; };
  P.limitar = function () { var gg = this.geo(), W = this.c.clientWidth, H = this.c.clientHeight, lw = (gg.n + 1 + gg.gap) * gg.cel, lh = gg.n * gg.cel;
    this.ox = Math.min(0, Math.max(this.ox, W - gg.rot - lw - 4)); this.oy = Math.min(0, Math.max(this.oy, H - gg.rot - lh - 4)); };
  P.zoom = function (f, cx, cy) {
    var z = Math.max(1, Math.min(12, this.z * f)); f = z / this.z; if (f === 1) return;
    cx = cx == null ? this.c.clientWidth / 2 : cx; cy = cy == null ? this.c.clientHeight / 2 : cy;
    var gg = this.geo(); this.ox = (gg.x0 - cx) * f + cx - gg.rot; this.oy = (gg.y0 - cy) * f + cy - gg.rot; this.z = z; this.limitar(); this.desenhar();
  };
  P.celula = function (x, y) {
    var gg = this.geo(), i = Math.floor((y - gg.y0) / gg.cel), xx = (x - gg.x0) / gg.cel, j = xx < gg.n ? Math.floor(xx) : (xx >= gg.n + gg.gap ? gg.n : -1);
    return i >= 0 && i < gg.n && j >= 0 && j <= gg.n && y >= gg.rot && x >= gg.rot ? { i: i, j: j } : null;
  };
  P.texto = function (c) { var v = this.M[c.i][c.j]; return 'L' + (c.i + 1) + ', ' + (c.j === this.M.length ? 'b' + (c.i + 1) : 'C' + (c.j + 1)) + ' = ' + V.completo(v) + (this.passo && this.passo.pivo && this.passo.pivo.linha === c.i && this.passo.pivo.coluna === c.j ? ' (pivô)' : ''); };
  P.mostrarDica = function (x, y, anunciar) {
    var c = this.celula(x, y); if (!c) { this.dica.hidden = true; return; }
    this.dica.textContent = this.texto(c); this.dica.hidden = false;
    var W = this.c.clientWidth; this.dica.style.left = Math.min(W - 150, x + 12) + 'px'; this.dica.style.top = (y + 14) + 'px';
    if (anunciar) { this.cur = c; this.anunciar(); this.desenhar(); }
  };
  P.anunciar = function () { if (this.cur) this.status.textContent = this.texto(this.cur); };
  P.carregar = function (M, passo) { var mudouN = !this.M || this.M.length !== M.length; this.M = M; this.passo = passo; if (mudouN) { this.z = 1; this.ox = this.oy = 0; this.cur = null; } this.desenhar(); };
  P.desenhar = function () {
    var cv = this.c, css = g.Grafico.css, dpr = window.devicePixelRatio || 1, W = cv.clientWidth, n = this.M.length;
    var base = (W - 30) / (n + 2); cv.style.height = Math.round(Math.min(Math.max(220, base * n + 30), 640)) + 'px';
    var H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr;
    var ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = css('--canvas-fundo'); ctx.fillRect(0, 0, W, H);
    var gg = this.geo(), M = this.M, p = this.passo || {}, mx = 0, i, j;
    for (i = 0; i < n; i++) for (j = 0; j < n; j++) mx = Math.max(mx, Math.abs(M[i][j]));
    var mxb = 0; for (i = 0; i < n; i++) mxb = Math.max(mxb, Math.abs(M[i][n])); var lmxb = Math.log10(1 + mxb) || 1, cBpos = css('--canvas-vetor-b'), cBneg = cBpos, cBborda = css('--canvas-vetor-b-borda');
    var lmx = Math.log10(1 + mx) || 1, cPos = css('--canvas-intervalo-borda'), cNeg = css('--canvas-erro'), cZero = css('--canvas-grade'), cPiv = css('--canvas-pivo');
    var X = function (jj) { return gg.x0 + (jj < n ? jj : n + gg.gap) * gg.cel; };
    ctx.save(); ctx.beginPath(); ctx.rect(gg.rot, gg.rot, W - gg.rot, H - gg.rot); ctx.clip();
    var s = Math.max(gg.cel - (gg.cel > 6 ? 1 : 0), 0.5);
    for (i = 0; i < n; i++) { var y = gg.y0 + i * gg.cel; if (y > H || y + gg.cel < 0) continue;
      for (j = 0; j <= n; j++) { var x = X(j); if (x > W || x + gg.cel < 0) continue; var v = M[i][j];
        if (Math.abs(v) < 1e-12) { ctx.globalAlpha = 0.25; ctx.fillStyle = cZero; }
        else if (j === n) { ctx.globalAlpha = 0.25 + 0.75 * Math.min(1, Math.log10(1 + Math.abs(v)) / lmxb); ctx.fillStyle = v > 0 ? cBpos : cBneg; } // b: escala e tons próprios
        else { ctx.globalAlpha = 0.2 + 0.8 * Math.min(1, Math.log10(1 + Math.abs(v)) / lmx); ctx.fillStyle = v > 0 ? cPos : cNeg; }
        ctx.fillRect(x, y, s, s); } }
    ctx.globalAlpha = 1;
    // separação A | b
    ctx.strokeStyle = cBborda; ctx.lineWidth = 2; ctx.beginPath(); var xb = gg.x0 + (n + gg.gap / 2) * gg.cel; ctx.moveTo(xb, gg.rot); ctx.lineTo(xb, gg.y0 + n * gg.cel); ctx.stroke();
    ctx.strokeStyle = cBborda; ctx.lineWidth = 1.5; ctx.strokeRect(X(n) - 1.5, gg.y0 - 1.5, gg.cel + 2, n * gg.cel + 2);
    // coluna atual e pivô
    if (p.pivo) { var k = p.pivo.coluna;
      ctx.setLineDash([4, 3]); ctx.strokeStyle = cPiv; ctx.lineWidth = 1.5; ctx.strokeRect(X(k), gg.y0 + k * gg.cel, gg.cel, (n - k) * gg.cel); ctx.setLineDash([]);
      ctx.fillStyle = cPiv; ctx.fillRect(X(k), gg.y0 + p.pivo.linha * gg.cel, s, s);
      ctx.lineWidth = 2; ctx.strokeStyle = css('--canvas-fundo'); ctx.strokeRect(X(k) - 1, gg.y0 + p.pivo.linha * gg.cel - 1, s + 2, s + 2); }
    if (p.troca) { ctx.strokeStyle = css('--canvas-linha-operada-borda'); ctx.lineWidth = 2; ctx.setLineDash([5, 3]); p.troca.forEach(function (r) { ctx.strokeRect(gg.x0 - 2, gg.y0 + r * gg.cel, (n + 1 + gg.gap) * gg.cel + 2, gg.cel); }); ctx.setLineDash([]); }
    if (this.cur) { ctx.strokeStyle = css('--canvas-rotulo', '--canvas-funcao'); ctx.lineWidth = 2; ctx.strokeRect(X(this.cur.j) - 1, gg.y0 + this.cur.i * gg.cel - 1, gg.cel + 1, gg.cel + 1); }
    ctx.restore();
    // rótulos L / x (espaçados para não colidir)
    ctx.fillStyle = css('--canvas-rotulo', '--cor-texto'); ctx.font = '11px ' + css('--fonte-mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var passo = Math.max(1, Math.ceil(22 / gg.cel));
    for (i = 0; i < n; i += passo) { var yy = gg.y0 + (i + 0.5) * gg.cel; if (yy > gg.rot && yy < H) ctx.fillText('L' + (i + 1), gg.rot / 2, yy); }
    var passoX = Math.max(1, Math.ceil(30 / gg.cel)); if (passoX > 1) passoX = Math.ceil(passoX / 10) * 10;
    for (j = 0; j < n; j += passoX) { var xx = X(j) + gg.cel / 2; var tx = 'x' + (j + 1), lw2 = ctx.measureText(tx).width / 2; if (xx - lw2 > gg.rot - 10 && xx + lw2 < X(n) - 2 && xx + lw2 < W) ctx.fillText(tx, xx, gg.rot / 2); }
    var xbl = X(n) + gg.cel / 2; if (xbl < W) ctx.fillText('b', xbl, gg.rot / 2);
  };
})(window);
