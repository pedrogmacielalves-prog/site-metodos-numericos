/* Cálculo grande sem travar a página: Worker (Blob, também em file:// quando o
   navegador deixa) e, se o Worker falhar, fatias na thread principal com o mesmo motor.
   Progresso e Cancelar nos dois caminhos. */
(function (g) {
  'use strict';
  var V = g.Visual = g.Visual || {};
  function scriptWorker() {
    return [
      'var estimar = ' + g.Metodos.estimarCondicao1.toString() + ';',
      'var criar = ' + g.Metodos.criarEliminacao.toString() + ';',
      'self.onmessage = function (e) {',
      '  var d = e.data || {};',
      '  if (d.tipo === "cancelar") { self.close(); return; }',
      '  try {',
      '    var t = criar(d.A, d.b, d.modo);',
      '    var lote = Math.max(1, Math.round(d.A.length / 30));',
      '    function loop() {',
      '      var p = t.avancar(lote);',
      '      self.postMessage({ tipo: "progresso", k: p.k, n: p.n });',
      '      if (!p.feito) { setTimeout(loop, 0); return; }',
      '      var r = t.exportar();',
      '      try { r.condicao = estimar(d.A, r.U, r.mult, r.ordem); } catch (err) { r.condicao = null; }',
      '      r.U = null; r.mult = null;',
      '      if (d.modo === "nunca") {',
      '        var t2 = criar(d.A, d.b, "sempre"), p2;',
      '        do { p2 = t2.avancar(lote); self.postMessage({ tipo: "progresso", k: p2.k, n: p2.n }); } while (!p2.feito);',
      '        r.refX = t2.exportar().x;',
      '      }',
      '      self.postMessage({ tipo: "fim", r: r });',
      '    }',
      '    loop();',
      '  } catch (err) { self.postMessage({ tipo: "erro", mensagem: String(err && err.message || err) }); }',
      '};',
    ].join('\n');
  }
  V.tarefaGauss = function (A, b, modo, cbs) {
    cbs = cbs || {};
    var cancelado = false, worker = null, url = null, encerrado = false;
    function fim(exp, via) { if (!cancelado) cbs.fim(exp, via); }
    function fatiar() {
      if (cancelado || encerrado) return;
      var t = g.Metodos.criarEliminacao(A, b, modo);
      var lote = Math.max(1, Math.round(A.length / 40));
      function tick() {
        if (cancelado) { if (cbs.cancelado) cbs.cancelado(); return; }
        var p = t.avancar(lote);
        if (cbs.progresso) cbs.progresso(p.k, p.n);
        if (!p.feito) { setTimeout(tick, 0); return; }
        var r = t.exportar();
        try { r.condicao = g.Metodos.estimarCondicao1(A, r.U, r.mult, r.ordem); } catch (e) { r.condicao = null; }
        if (modo !== 'nunca') { fim(r, 'fatiado'); return; }
        var t2 = g.Metodos.criarEliminacao(A, b, 'sempre');
        function comparar() {
          if (cancelado) { if (cbs.cancelado) cbs.cancelado(); return; }
          var p2 = t2.avancar(lote);
          if (cbs.progresso) cbs.progresso(p2.k, p2.n);
          if (!p2.feito) { setTimeout(comparar, 0); return; }
          r.refX = t2.exportar().x;
          fim(r, 'fatiado');
        }
        comparar();
      }
      tick();
    }
    try {
      url = URL.createObjectURL(new Blob([scriptWorker()], { type: 'text/javascript' }));
      worker = new Worker(url);
    } catch (e) {
      fatiar();
      return { cancelar: function () { cancelado = true; }, modo: 'fatiado' };
    }
    worker.onmessage = function (ev) {
      if (encerrado) return;
      var d = ev.data || {};
      if (d.tipo === 'progresso') { if (cbs.progresso) cbs.progresso(d.k, d.n); }
      else if (d.tipo === 'fim') { encerrado = true; try { worker.terminate(); } catch (e) {} if (url) URL.revokeObjectURL(url); fim(d.r, 'worker'); }
      else if (d.tipo === 'erro') { encerrado = true; try { worker.terminate(); } catch (e2) {} fatiar(); }
    };
    worker.onerror = function () {
      if (encerrado || cancelado) return;
      encerrado = true;
      try { worker.terminate(); } catch (e) {}
      if (url) URL.revokeObjectURL(url);
      fatiar();
    };
    try { worker.postMessage({ A: A, b: b, modo: modo }); }
    catch (e) { encerrado = true; try { worker.terminate(); } catch (e2) {} fatiar(); return { cancelar: function () { cancelado = true; }, modo: 'fatiado' }; }
    return {
      modo: 'worker',
      cancelar: function () {
        if (cancelado) return;
        cancelado = true; encerrado = true;
        try { worker.terminate(); } catch (e) {}
        if (url) URL.revokeObjectURL(url);
        if (cbs.cancelado) cbs.cancelado();
      },
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
