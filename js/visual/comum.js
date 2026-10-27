/* Utilidades compartilhadas pelas visualizações. */
(function (g) {
  'use strict';
  var V = g.Visual = g.Visual || {};
  V.fmt = function (v, d) { if (v == null || !isFinite(v)) return '—'; if (v !== 0 && (Math.abs(v) < 1e-4 || Math.abs(v) >= 1e6)) return V.fmtE(v, 3); return (+v.toFixed(d == null ? 6 : d)).toString().replace('.', ',').replace('-', '−'); };
  /* V.fmt: só exibição (vírgula, −); nunca usar em inputs nem na gaveta de código */
  /* formato de tabela: vírgula decimal, menos tipográfico, casas fixas */
  V.fmtTab = function (v, d) { if (v == null || !isFinite(v)) return '—'; if (v !== 0 && (Math.abs(v) < 1e-4 || Math.abs(v) >= 1e6)) return v.toExponential(3).replace('.', ',').replace(/-/g, '−'); return v.toFixed(d == null ? 6 : d).replace('.', ',').replace('-', '−'); };
  /* Exibição apenas (não altera dados): resíduos |v| < 1e-12·max(1,escala) viram 0. */
  V.limpar = function (v, escala) { return v != null && isFinite(v) && Math.abs(v) < 1e-12 * Math.max(1, Math.abs(escala || 0)) ? 0 : v; };
  V.escalaMatriz = function (M) { var m = 0; (M || []).forEach(function (l) { l.forEach(function (v) { if (isFinite(v) && Math.abs(v) > m) m = Math.abs(v); }); }); return m; };
  var SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
  /* notação científica legível: −1,569 × 10²²³ */
  V.fmtCient = function (v, d) { if (v == null || !isFinite(v)) return '—'; if (v === 0) return '0';
    var a = Math.abs(v); if (a >= 1e-4 && a < 1e6) return String(+v.toPrecision(d || 6)).replace('.', ',').replace('-', '−');
    var p = v.toExponential((d || 4) - 1).split('e'); return p[0].replace('.', ',').replace(/-/g, '−') + ' × 10' + String(+p[1]).replace(/./g, function (c) { return SUP[c]; }); };
  /* notação da matriz: 1,000e+17 / −1,000e−17 (vírgula, − tipográfico) */
  V.fmtE = function (v, d) { if (v == null || !isFinite(v)) return '—'; return v.toExponential(d == null ? 3 : d).replace('.', ',').replace(/-/g, '−'); };
  V.extremo = function (v) { return v !== 0 && isFinite(v) && (Math.abs(v) >= 1e6 || Math.abs(v) < 1e-4); };
  /* k algarismos significativos para exibição compacta (vírgula, −) */
  V.sig = function (v, k) { if (v == null || !isFinite(v)) return '—'; if (v === 0) return '0'; if (V.extremo(v)) return V.fmtE(v, k - 1); return String(+v.toPrecision(k)).replace('.', ',').replace(/-/g, '−'); };
  /* BUG-35: valor completo (representação mais curta que faz ida e volta), vírgula e −; extremos em notação e. Para title/aria-label. */
  V.completo = function (v) { if (v == null) return ''; v = Number(v); if (!isFinite(v)) return '—'; if (v === 0) return '0';
    var s = V.extremo(v) ? v.toExponential().replace('e+', 'e') : String(v); return s.replace('.', ',').replace(/-/g, '−'); };
  V.largo = function () { return !!(window.matchMedia && matchMedia('(min-width: 1024px)').matches); };
  /* células que transbordam: 4 → 3 algarismos e, se ainda faltar, fonte menor (nunca corte no meio do dígito) */
  /* BUG-33: mede o texto com canvas (fonte computada da célula) contra a área útil (clientWidth − padding); scrollWidth de <input> não é confiável.
     Célula ainda sem layout (largura 0, aba oculta) fica como está; remede no resize / fonts.ready. */
  var ctxMedida = null;
  function cabe(c, t) {
    var cs = getComputedStyle(c), util = c.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    if (!(util > 0)) return null;
    ctxMedida = ctxMedida || document.createElement('canvas').getContext('2d');
    ctxMedida.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
    var ls = parseFloat(cs.letterSpacing) || 0;
    return ctxMedida.measureText(t).width + ls * t.length <= util - 1;
  }
  /* Nível único por grade (Designer, piso = 4 algarismos em xs): 0 = 4 alg., 1 = 4 alg. xs. Notação científica só para magnitudes extremas (V.sig).
     Não há nível de 3 ou 2 algarismos: as duas grades (entrada e matriz) ficam dentro de .rolagem-x, então quando nem 4 alg. xs cabe a grade passa a rolar por dentro.
     Retorna true se coube; false = quem chamou deve trocar para o layout com rolagem (larguras mínimas) e chamar de novo.
     O valor completo fica em data-valor/title (e no foco, nas entradas). */
  var NIVEIS = [[4, 0], [4, 1]];
  V.caberCelulas = function (cels, ler, escrever, grade) {
    cels = Array.prototype.slice.call(cels); var nivel = 0, coube = true;
    cels.forEach(function (c) { var v = ler(c); if (v == null || !isFinite(v)) return;
      for (var n = nivel; n < NIVEIS.length; n++) { c.classList.toggle('cel--xs', !!NIVEIS[n][1]); var ok = cabe(c, V.sig(v, 4)); if (ok === null) return; if (ok) break; }
      if (n >= NIVEIS.length) { coube = false; n = NIVEIS.length - 1; } nivel = n; });
    cels.forEach(function (c) { c.classList.toggle('cel--xs', !!NIVEIS[nivel][1]); var v = ler(c); if (v != null && isFinite(v)) escrever(c, V.sig(v, 4)); });
    if (grade) { grade.dataset.nivel = nivel; grade.classList.toggle('grade--xs', !!NIVEIS[nivel][1]); }
    return coube;
  };



  /* vetor solução: inteiros se todos quase-inteiros; senão mesmo nº de casas (vírgula decimal) */
  V.fmtSolucao = function (x, escala, casas) {
    var y = x.map(function (v) { return V.limpar(v, escala); }), ok = y.filter(function (v) { return v != null && isFinite(v); });
    var inteiros = ok.every(function (v) { return Math.abs(v - Math.round(v)) < 1e-9 * Math.max(1, Math.abs(v)); });
    return y.map(function (v) { if (v == null) return '?'; if (!isFinite(v)) return '—';
      if (V.extremo(v)) return V.fmtE(v);
      var s = inteiros ? String(Math.round(v)) : v.toFixed(casas == null ? 6 : casas); if (/^-0(,0*|\.0*)?$/.test(s)) s = s.slice(1); return s.replace('.', ',').replace('-', '−'); });
  };
  /* BUG-16: texto de exibição em PT-BR — vírgula decimal e sinal de menos tipográfico (não mexe no código da gaveta). */
  /* números por extenso (≥ 1e6 ou 0 < |v| < 1e-4) viram notação da matriz; não toca em 1e-17, x1, a11, L10 etc. */
  function extenso(t) {
    return t.replace(/(^|[^\w.,e+−-])([−-]?)(\d+(?:[.,]\d+)?)(?![\w.,]*\d*e[+−-]?\d)(?=$|[^\w.,]|[.,](?!\d))/g, function (m, pre, sin, num) {
      var v = parseFloat(num.replace(',', '.')); if (!isFinite(v) || !V.extremo(v)) return m;
      return pre + V.fmtE((sin ? -1 : 1) * v);
    });
  }
  V.br = function (s) { return extenso(String(s == null ? '' : s)).replace(/(\d), (?=[−-]?\d)/g, '$1; ').replace(/(\d)\.(\d)/g, '$1,$2').replace(/(^|[\s(\[=:≈;|/·])-(?=[\d.])/g, '$1−').replace(/e-(\d)/g, 'e−$1'); };
  V.sinal = function (v) { return v > 0 ? '(+)' : v < 0 ? '(−)' : '(0)'; };
  V.duracao = function () { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dur-passo')) || 600; };
  /* anima t de 0 a 1; retorna função para cancelar */
  V.animar = function (cb) {
    var ini = performance.now(), dur = V.duracao(), id, vivo = true;
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) dur = 1;
    function quadro(agora) { if (!vivo) return; var t = Math.min(1, (agora - ini) / dur); cb(1 - Math.pow(1 - t, 3)); if (t < 1) id = requestAnimationFrame(quadro); }
    id = requestAnimationFrame(quadro);
    return function () { vivo = false; cancelAnimationFrame(id); };
  };
  V.lerp = function (a, b, t) { return a + (b - a) * t; };
  /* Tabela sincronizada: linhas = array de arrays de HTML */
  /* indicador de criterioFallback (|x| ≈ 0 → o núcleo usou |Δx|): ícone + texto acessível */
  V.FALLBACK_HTML = ' <span class="fallback" title="x perto de zero: usou o erro absoluto |Δx|"><span aria-hidden="true">⚠ |Δx|</span><span class="sr-only">aviso: x perto de zero, usou erro absoluto</span></span>';
  V.Tabela = function (tbody, aoClicar) {
    this.tbody = tbody;
    tbody.addEventListener('click', function (e) { var tr = e.target.closest('tr'); if (tr && tr.dataset.i) aoClicar(+tr.dataset.i); });
    tbody.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
      var tr = e.target.closest && e.target.closest('tr'); if (!tr || tr.dataset.i == null) return;
      e.preventDefault(); aoClicar(+tr.dataset.i);
    });
  };
  // Cabeçalho da coluna de erro na notação da professora (segue o critério ativo).
  V.thErro = function (metodo, relativo) { return relativo ? '|xᵢ₊₁ − xᵢ|/|xᵢ₊₁|' : (metodo === 'bisseccao' ? '(b − a)/2' : '|xᵢ₊₁ − xᵢ|'); };
  // 6 algarismos significativos sem zeros à direita (0,5 · −0,322266 · 4,14632e−6), vírgula e − (U+2212).
  V.sig6 = function (v) { if (v == null || !isFinite(v)) return '—'; var x = Number(v.toPrecision(6)), a = Math.abs(x);
    var s = x === 0 ? '0' : (a >= 1e-4 && a < 1e7 ? String(x) : x.toExponential().replace('e+', 'e'));
    return s.replace('.', ',').replace(/-/g, '−'); };
  // Última linha = a raiz (destaque âmbar), só quando o método convergiu.
  V.Tabela.prototype.marcarRaiz = function (sim) { var u = this.tbody.lastElementChild; [].forEach.call(this.tbody.children, function (tr) { tr.classList.remove('linha-raiz'); }); if (sim && u) { u.classList.add('linha-raiz'); u.setAttribute('aria-label', 'Linha ' + u.firstElementChild.textContent + ': aproximação da raiz'); } };
  /* valores (opcional): números crus por célula → title/aria-label com o valor completo (BUG-35) */
  V.Tabela.prototype.preencher = function (linhas, valores) {
    this.tbody.innerHTML = linhas.map(function (l, i) { return '<tr data-i="' + i + '" tabindex="0">' + l.map(function (c, j) { var v = valores && valores[i] ? valores[i][j] : null, t = typeof v === 'number' && isFinite(v) ? V.completo(v) : ''; return '<td' + (t ? ' title="' + t + '" aria-label="' + t + '"' : '') + '>' + c + '</td>'; }).join('') + '</tr>'; }).join('');
  };
  V.Tabela.prototype.destacar = function (i) {
    var trs = this.tbody.children;
    for (var j = 0; j < trs.length; j++) { trs[j].classList.toggle('atual', j === i); if (j === i) trs[j].setAttribute('aria-current', 'step'); else trs[j].removeAttribute('aria-current'); trs[j].classList.toggle('futura', j > i); }
    if (trs[i]) { var cont = this.tbody.closest('.tabela-rolagem'), tr = trs[i];
      if (cont && (tr.offsetTop < cont.scrollTop + 30 || tr.offsetTop > cont.scrollTop + cont.clientHeight - 30)) cont.scrollTop = tr.offsetTop - cont.clientHeight / 2; }
  };
})(window);
