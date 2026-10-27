/* Plotagem de função em canvas. new Grafico(canvas); g.definir(f, xmin, xmax); g.desenhar(extra(ctx, util)) */
(function (g) {
  'use strict';
  /* Lê a 1ª variável CSS definida da lista (tokens do Designer, com fallback para tokens gerais). Sem cores fixas no JS. */
  function css() { var st = getComputedStyle(document.documentElement); for (var i = 0; i < arguments.length; i++) { var v = st.getPropertyValue(arguments[i]).trim(); if (v) return v; } return ''; }
  function Grafico(canvas) { this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.f = null; this.extra = null; this.margem = 36;
    var self = this; window.addEventListener('resize', function () { self.desenhar(self.extra); }); }
  Grafico.prototype.definir = function (f, xmin, xmax, pontosY, padX) {
    if (xmax - xmin < 1e-9) { xmin -= 1; xmax += 1; }
    var pad = (xmax - xmin) * (padX == null ? 0.08 : padX); this.xmin = xmin - pad; this.xmax = xmax + pad; this.f = f;
    var ys = (pontosY || []).slice(), N = 300;
    for (var i = 0; i <= N; i++) { var y = f(this.xmin + (this.xmax - this.xmin) * i / N); if (isFinite(y)) ys.push(y); }
    ys.sort(function (a, b) { return a - b; });
    // corta extremos (assíntotas) usando percentis
    var lo = ys[Math.floor(ys.length * 0.02)] || -1, hi = ys[Math.ceil(ys.length * 0.98) - 1] || 1;
    (pontosY || []).forEach(function (v) { if (isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); } });
    lo = Math.min(lo, 0); hi = Math.max(hi, 0);
    if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
    var py = (hi - lo) * 0.1; this.ymin = lo - py; this.ymax = hi + py;
  };
  Grafico.prototype.px = function (x) { return this.margem + (x - this.xmin) / (this.xmax - this.xmin) * (this.w - this.margem - 10); };
  Grafico.prototype.py = function (y) { return 10 + (this.ymax - y) / (this.ymax - this.ymin) * (this.h - this.margem - 10); };
  function passoBonito(faixa) { var p = Math.pow(10, Math.floor(Math.log10(faixa / 6))), r = faixa / 6 / p; return p * (r > 5 ? 10 : r > 2 ? 5 : r > 1 ? 2 : 1); }
  Grafico.prototype.desenhar = function (extra) {
    this.extra = extra;
    var c = this.canvas, dpr = window.devicePixelRatio || 1, r = c.getBoundingClientRect();
    if (!r.width) return;
    c.width = r.width * dpr; c.height = r.height * dpr; this.w = r.width; this.h = r.height;
    var ctx = this.ctx; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, this.w, this.h);
    if (!this.f) return;
    var self = this, fonte = '11px ' + css('--fonte-mono');
    // grade e marcas
    ctx.font = fonte; ctx.lineWidth = 1;
    var sx = passoBonito(this.xmax - this.xmin), sy = passoBonito(this.ymax - this.ymin), v;
    ctx.fillStyle = css('--canvas-rotulo', '--cor-texto-suave'); ctx.textAlign = 'center';
    for (v = Math.ceil(this.xmin / sx) * sx; v <= this.xmax; v += sx) {
      ctx.strokeStyle = css('--canvas-grade', '--cor-borda'); ctx.beginPath(); ctx.moveTo(this.px(v), 10); ctx.lineTo(this.px(v), this.h - this.margem); ctx.stroke();
      ctx.fillText(String(+v.toPrecision(6)).replace('.', ',').replace(/-/g, '−'), this.px(v), this.h - this.margem + 14);
    }
    ctx.textAlign = 'right';
    for (v = Math.ceil(this.ymin / sy) * sy; v <= this.ymax; v += sy) {
      ctx.strokeStyle = css('--canvas-grade', '--cor-borda'); ctx.beginPath(); ctx.moveTo(this.margem, this.py(v)); ctx.lineTo(this.w - 10, this.py(v)); ctx.stroke();
      ctx.fillText(String(+v.toPrecision(6)).replace('.', ',').replace(/-/g, '−'), this.margem - 4, this.py(v) + 4);
    }
    // eixos
    ctx.strokeStyle = css('--canvas-eixo', '--cor-texto-suave'); ctx.lineWidth = 1.5; ctx.beginPath();
    ctx.moveTo(this.margem, this.py(0)); ctx.lineTo(this.w - 10, this.py(0));
    if (this.xmin < 0 && this.xmax > 0) { ctx.moveTo(this.px(0), 10); ctx.lineTo(this.px(0), this.h - this.margem); }
    ctx.stroke();
    // recorte da área de plotagem
    ctx.save(); ctx.beginPath(); ctx.rect(this.margem, 10, this.w - this.margem - 10, this.h - this.margem - 10); ctx.clip();
    var util = { ctx: ctx, px: this.px.bind(this), py: this.py.bind(this), css: css, xmin: this.xmin, xmax: this.xmax, ymin: this.ymin, ymax: this.ymax,
      esq: this.margem, dir: this.w - 10, topo: 10, base: this.h - this.margem };
    if (extra && extra.antes) extra.antes(util);
    // função
    ctx.strokeStyle = css('--canvas-funcao', '--cor-texto'); ctx.lineWidth = 2.2; ctx.beginPath();
    var N = Math.max(200, Math.floor(this.w)), aberto = false;
    for (var i = 0; i <= N; i++) {
      var x = this.xmin + (this.xmax - this.xmin) * i / N, y = this.f(x);
      if (!isFinite(y) || Math.abs(this.py(y)) > 1e5) { aberto = false; continue; }
      if (aberto) ctx.lineTo(this.px(x), this.py(y)); else { ctx.moveTo(this.px(x), this.py(y)); aberto = true; }
    }
    ctx.stroke();
    if (extra && extra.depois) extra.depois(util);
    ctx.restore();
  };
  /* forma: 'circulo' (padrão), 'vazado' (borda = cor, fundo --canvas-fundo), 'losango', 'raiz' (r=7, contorno 2px --canvas-fundo) */
  Grafico.ponto = function (u, x, y, cor, rotulo, raio, forma) {
    var ctx = u.ctx, X = u.px(x), Y = u.py(y), r = raio || 5; forma = forma || 'circulo';
    ctx.save(); ctx.beginPath();
    if (forma === 'losango') { r = raio || 7; ctx.moveTo(X, Y - r); ctx.lineTo(X + r, Y); ctx.lineTo(X, Y + r); ctx.lineTo(X - r, Y); ctx.closePath(); ctx.fillStyle = cor; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = u.css('--canvas-fundo'); ctx.stroke(); }
    else if (forma === 'vazado') { ctx.arc(X, Y, r, 0, 7); ctx.fillStyle = u.css('--canvas-fundo'); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = cor; ctx.stroke(); }
    else if (forma === 'raiz') { r = raio || 7; ctx.arc(X, Y, r, 0, 7); ctx.fillStyle = cor; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = u.css('--canvas-fundo'); ctx.stroke(); }
    else { ctx.arc(X, Y, r, 0, 7); ctx.fillStyle = cor; ctx.fill(); }
    ctx.restore();
    if (rotulo) { ctx.font = '600 12px ' + u.css('--fonte-texto'); ctx.textAlign = 'center'; ctx.fillStyle = u.css('--canvas-rotulo', '--cor-texto'); ctx.fillText(rotulo, X, Y - r - 5); }
  };
  /* Rótulos de vários marcadores sem sobreposição: itens [{x, y, texto, r, prioridade}] (prioridade 0 = mais importante).
     Afastados (≥ MIN px na horizontal): acima do ponto, como sempre. Próximos: alternam acima/abaixo do eixo;
     se ainda colidirem, só o de maior prioridade (c na bissecção) é desenhado. */
  Grafico.rotulos = function (u, itens, MIN) {
    MIN = MIN || 28; var ctx = u.ctx, P = itens.map(function (o) { return Object.assign({ X: u.px(o.x), Y: u.py(o.y) }, o); });
    var perto = P.some(function (a, i) { return P.some(function (b, j) { return i < j && Math.abs(a.X - b.X) < MIN; }); });
    function escreve(o, y) { ctx.save(); ctx.font = '600 12px ' + u.css('--fonte-texto'); ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = u.css('--canvas-fundo'); if (perto) ctx.strokeText(o.texto, o.X, y); ctx.fillStyle = u.css('--canvas-rotulo', '--cor-texto'); ctx.fillText(o.texto, o.X, y); ctx.restore(); }
    if (!perto) { P.forEach(function (o) { escreve(o, o.Y - (o.r || 5) - 5); }); return 'normal'; }
    var eixo = u.py(0), ord = P.slice().sort(function (a, b) { return (a.prioridade || 0) - (b.prioridade || 0); }), lados = { acima: [], abaixo: [] }, ok = true;
    ord.forEach(function (o, i) { var pref = i % 2 ? ['abaixo', 'acima'] : ['acima', 'abaixo'];
      var lado = pref.find(function (l) { return lados[l].every(function (q) { return Math.abs(q.X - o.X) >= MIN; }); });
      if (!lado) ok = false; else { lados[lado].push(o); o.lado = lado; } });
    if (!ok) { escreve(ord[0], Math.min(ord[0].Y, eixo) - (ord[0].r || 5) - 8); return 'so-principal'; }
    ord.forEach(function (o) { escreve(o, o.lado === 'acima' ? Math.min(o.Y, eixo) - (o.r || 5) - 8 : Math.max(o.Y, eixo) + (o.r || 5) + 16); });
    return 'empilhado';
  };
  Grafico.css = css;
  /* Redesenha todos os gráficos quando o tema muda (<html data-theme>) */
  if (typeof MutationObserver !== 'undefined') new MutationObserver(function () { window.dispatchEvent(new Event('resize')); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); g.Grafico = Grafico;
})(window);
