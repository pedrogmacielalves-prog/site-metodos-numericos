/* Cálculo grande sem travar a página: Worker (Blob) e, se ele falhar, fatias
   na thread principal com o mesmo motor. Todo caminho termina em fim, erro ou cancelado. */
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
    var cancelado = false, worker = null, url = null;
    var terminou = false, fallbackPedido = false;
    function acabar(fn) {
      if (terminou) return;
      terminou = true;
      try { if (worker) worker.terminate(); } catch (e) {}
      if (url) { try { URL.revokeObjectURL(url); } catch (e2) {} url = null; }
      fn();
    }
    function falhar(msg) {
      acabar(function () { if (cbs.erro) cbs.erro(msg); else if (cbs.fim) cbs.fim(null, 'erro'); });
    }
    function fatiar() {
      if (terminou || cancelado || fallbackPedido) return;
      fallbackPedido = true;
      var t;
      try { t = g.Metodos.criarEliminacao(A, b, modo); }
      catch (e) { falhar(e && e.message); return; }
      var lote = Math.max(1, Math.round(A.length / 40));
      function tick() {
        if (cancelado) { acabar(function () { if (cbs.cancelado) cbs.cancelado(); }); return; }
        var p;
        try { p = t.avancar(lote); }
        catch (e) { falhar(e && e.message); return; }
        if (terminou || cancelado) return;
        if (cbs.progresso) cbs.progresso(p.k, p.n);
        if (!p.feito) { setTimeout(tick, 0); return; }
        var r;
        try {
          r = t.exportar();
          r.condicao = g.Metodos.estimarCondicao1(A, r.U, r.mult, r.ordem);
        } catch (e2) { if (r) r.condicao = null; else { falhar(e2 && e2.message); return; } }
        if (modo !== 'nunca') { acabar(function () { cbs.fim(r, 'fatiado'); }); return; }
        var t2;
        try { t2 = g.Metodos.criarEliminacao(A, b, 'sempre'); }
        catch (e3) { acabar(function () { cbs.fim(r, 'fatiado'); }); return; }
        function comparar() {
          if (cancelado) { acabar(function () { if (cbs.cancelado) cbs.cancelado(); }); return; }
          var p2;
          try { p2 = t2.avancar(lote); }
          catch (e4) { acabar(function () { cbs.fim(r, 'fatiado'); }); return; }
          if (cbs.progresso) cbs.progresso(p2.k, p2.n);
          if (!p2.feito) { setTimeout(comparar, 0); return; }
          try { r.refX = t2.exportar().x; } catch (e5) {}
          acabar(function () { cbs.fim(r, 'fatiado'); });
        }
        comparar();
      }
      tick();
    }
    function pedirFallback() {
      if (terminou || cancelado) return;
      try { if (worker) worker.terminate(); } catch (e) {}
      worker = null;
      fatiar();
    }
    try {
      url = URL.createObjectURL(new Blob([scriptWorker()], { type: 'text/javascript' }));
      worker = new Worker(url);
    } catch (e) {
      fatiar();
      return { cancelar: cancelar, modo: 'fatiado' };
    }
    worker.onmessage = function (ev) {
      if (terminou) return;
      var d = ev.data || {};
      if (d.tipo === 'progresso') { if (cbs.progresso) cbs.progresso(d.k, d.n); }
      else if (d.tipo === 'fim') acabar(function () { cbs.fim(d.r, 'worker'); });
      else if (d.tipo === 'erro') pedirFallback();
    };
    worker.onerror = function () { pedirFallback(); };
    try { worker.postMessage({ A: A, b: b, modo: modo }); }
    catch (e) { pedirFallback(); }
    function cancelar() {
      if (terminou || cancelado) return;
      cancelado = true;
      acabar(function () { if (cbs.cancelado) cbs.cancelado(); });
    }
    return { modo: fallbackPedido ? 'fatiado' : 'worker', cancelar: cancelar };
  };
})(typeof window !== 'undefined' ? window : globalThis);
