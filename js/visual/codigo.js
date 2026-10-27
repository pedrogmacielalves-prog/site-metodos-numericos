/* Painel "Ver código": mostra Metodos.<metodo>.toString() com destaque de sintaxe próprio (offline),
   números de linha, botão Copiar e destaque da linha da etapa atual.
   Linha ativa: passo.linha (nº relativo à função exibida) ou passo.etapa → linha com "// @etapa:<etapa>";
   sem marcador, tenta heurísticas por método (ver README). */
(function (g) {
  'use strict';
  /* critério de parada (absoluto ou relativo): mesma linha no núcleo — marcador @etapa:criterioParada / Metodos.testeParada */
  function CRIT_LINHA() { return [/@etapa:criterioParada/, /testeParada\(/, /if\s*\(\s*erro\s*<\s*tol\s*\)/, /erro\s*<\s*tol/]; }
  var V = g.Visual = g.Visual || {};
  var KW = /^(var|let|const|function|return|if|else|for|while|do|break|continue|new|typeof|instanceof|in|of|throw|try|catch|finally|class|extends|this|null|undefined|true|false|switch|case|default)$/;
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  /* Tokeniza o código-fonte em [{c: classe|null, t: texto}] */
  V.tokenizarJS = function (src) {
    var re = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|('(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`)|(\b\d+\.?\d*(?:[eE][+-]?\d+)?\b)|([A-Za-z_$][\w$]*)(\s*\()?/g;
    var out = [], ult = 0, m;
    while ((m = re.exec(src))) {
      if (m.index > ult) out.push({ c: null, t: src.slice(ult, m.index) });
      if (m[1]) out.push({ c: 'tok-com', t: m[1] });
      else if (m[2]) out.push({ c: 'tok-str', t: m[2] });
      else if (m[3]) out.push({ c: 'tok-num', t: m[3] });
      else { out.push({ c: KW.test(m[4]) ? 'tok-kw' : (m[5] ? 'tok-fn' : null), t: m[4] }); if (m[5]) out.push({ c: null, t: m[5] }); }
      ult = re.lastIndex;
    }
    if (ult < src.length) out.push({ c: null, t: src.slice(ult) });
    return out;
  };
  /* Converte tokens em linhas HTML (spans quebrados corretamente entre linhas) */
  V.destacarJS = function (src) {
    var linhas = [''];
    V.tokenizarJS(src).forEach(function (tk) {
      tk.t.split('\n').forEach(function (parte, i) {
        if (i > 0) linhas.push('');
        if (parte) linhas[linhas.length - 1] += tk.c ? '<span class="' + tk.c + '">' + esc(parte) + '</span>' : esc(parte);
      });
    });
    return linhas;
  };
  var TITULO_AUX = '// ───── Escolha do pivô: Metodos.';
  function fonteDoMetodo(nome) {
    var M = g.Metodos && g.Metodos[nome];
    if (!M) return { texto: '// window.Metodos.' + nome + ' não foi carregado.', origem: '—' };
    if (typeof M === 'function') {
      /* Gauss: a escolha do pivô fica numa função à parte (Metodos.escolherPivo), mostrada logo abaixo, com divisor e título */
      var aux = nome === 'gauss' && ['escolherPivo', 'escolherLinhaPivo'].filter(function (k) { return typeof g.Metodos[k] === 'function'; })[0];
      if (aux) return { texto: M.toString() + '\n\n' + TITULO_AUX + aux + '\n' + g.Metodos[aux].toString(), origem: 'window.Metodos.' + nome + ' e window.Metodos.' + aux };
      return { texto: M.toString(), origem: 'window.Metodos.' + nome };
    }
    var chaves = ['executar', 'resolver', 'calcular', 'gerarEtapas', 'gerarPassos', 'principal', nome];
    for (var i = 0; i < chaves.length; i++) if (typeof M[chaves[i]] === 'function') return { texto: M[chaves[i]].toString(), origem: 'window.Metodos.' + nome + '.' + chaves[i] };
    var partes = Object.keys(M).filter(function (k) { return typeof M[k] === 'function'; }).map(function (k) { return '// ' + k + '\n' + M[k].toString(); });
    return { texto: partes.join('\n\n') || '// (sem funções)', origem: 'window.Metodos.' + nome + ' (objeto)' };
  }
  /* heurísticas quando o passo não traz etapa/linha */
  var HEUR = {
    /* BUG-13: o núcleo tem um marcador por método; alternamos a linha conforme o passo:
       bissecção: 1º passo = ponto médio; meio = teste de sinal (lado mantido); último = critério de parada.
       Newton: 1º passo = passo da tangente; meio = atualização de x; último = critério. */
    /* BUG-13: a linha muda com o passo. Marcadores do núcleo: bissecção pontoMedio/testeSinal/atualizaIntervalo/criterioParada;
       Newton avaliaDerivada/passoNewton/criterioParada. Passos intermediários alternam entre eles; o último mostra o critério. */
    bisseccao: function (p) {
      if (p.ultimo || p.etapa === 'criterioParada') return CRIT_LINHA(p);
      var seq = [[/@etapa:pontoMedio/, /c\s*=\s*\(\s*a\s*\+\s*b\s*\)\s*\/\s*2/], [/@etapa:testeSinal/, /fa\s*\*\s*fc\s*<\s*0/], [/@etapa:atualizaIntervalo/, /manter\s*===?\s*'esquerda'/]];
      return seq[((p.k || 1) - 1) % 3]; },
    newton: function (p) {
      if (p.ultimo || p.etapa === 'criterioParada') return CRIT_LINHA(p);
      var seq = [[/@etapa:avaliaDerivada/, /dfx\s*=\s*df\(/], [/@etapa:passoNewton/, /xNovo\s*=|x\s*-\s*fx\s*\/\s*dfx/]];
      return seq[(p.k || 0) % 2]; },
    gauss: function (p) {
      return { inicio: [/@etapa:inicio/, /tipo:\s*'inicio'/], troca: [/@etapa:trocaLinhas\b/, /@etapa:troca\b/, /troca de linhas|\[M\[k\],\s*M\[p\]\]/], pivo: [/@etapa:pivo/, /tipo:\s*'pivo'/],
        eliminacao: [/@etapa:eliminacao/, /fator\s*=|multiplicador/], coluna: [/@etapa:coluna/, /@etapa:eliminacao/, /fator\s*=/], substituicao: [/@etapa:substituicao/, /x\[i\]\s*=/], fim: [/@etapa:fim/, /tipo:\s*'fim'/] }[p.tipo] || [];
    }
  };
  /* Gauss: passos de escolha/troca de pivô marcam a linha dentro de escolherPivo (se ela estiver na gaveta).
     Ordem: marcadores // @etapa:<nome> do núcleo (passo.etapa, passo.etapas, nomes conhecidos) e, na falta, o código. */
  function linhaEscolha(linhas, passo) {
    var ini = -1; for (var i = 0; i < linhas.length; i++) if (linhas[i].indexOf(TITULO_AUX) === 0) { ini = i; break; }
    if (ini < 0 || !/^(troca|pivo|coluna)$/.test(passo.tipo) || passo.aposTroca) return -1;
    var t = passo.pivo && passo.pivo.troca, tipo = t && t.tipo ? t.tipo : passo.pivo && passo.pivo.decisao === 'sem_troca' ? 'sem' : passo.tipo === 'troca' || (passo.tipo === 'coluna' && passo.troca) ? 'troca' : 'sem';
    var nomes = [].concat(passo.etapas || [], passo.etapaPivo || [], { obrigatoria: ['trocaObrigatoria', 'pivoZero'], recomendada: ['trocaRecomendada', 'pivoPequeno'], classica: ['trocaClassica', 'maiorModulo'], troca: ['escolhaPivo'], sem: ['semTroca', 'pivoOk'] }[tipo] || [], ['escolhaPivo']);
    var regs = nomes.map(function (n) { return new RegExp('@etapa:' + String(n).replace(/[^\w-]/g, '') + '\\b'); }).concat({ obrigatoria: [/tipo\s*=\s*'obrigatoria'/], recomendada: [/tipo\s*=\s*'recomendada'/], classica: [/tipo\s*=\s*'classica'/], troca: [/maior/], sem: [/return\s*\{\s*linha:/] }[tipo] || []);
    var codigo = function (i) { var l = linhas[i].trim(); return l !== '' && !/^(\/\/|\/\*|\*)/.test(l); };
    for (var r = 0; r < regs.length; r++) for (var j = ini + 1; j < linhas.length; j++) if (regs[r].test(linhas[j])) { while (j < linhas.length - 1 && !codigo(j)) j++; return j; }
    return -1;
  }
  V.linhaDoPasso = function (metodo, texto, passo) {
    if (!passo) return -1;
    var linhas = texto.split('\n');
    if (metodo === 'gauss' && !passo.etapa) { var le = linhaEscolha(linhas, passo); if (le >= 0) return le; }
    if (passo.linha != null && linhas[passo.linha - 1] != null) return passo.linha - 1;
    var regs = [];
    if (passo.etapa) regs.push(new RegExp('@etapa:' + String(passo.etapa).replace(/[^\w-]/g, '') + '\\b'));
    regs = regs.concat(HEUR[metodo] ? HEUR[metodo](passo) : []);
    var codigo = function (i) { var l = linhas[i].trim(); return l !== '' && !/^(\/\/|\/\*|\*)/.test(l); };
    for (var r = 0; r < regs.length; r++) for (var i = 0; i < linhas.length; i++) if (regs[r].test(linhas[i])) {
      while (i < linhas.length - 1 && !codigo(i)) i++; // marcador em comentário → 1ª linha de código depois dele
      return i; }
    return -1;
  };
  var $ = function (id) { return document.getElementById(id); };
  var NOME_ETAPA = { pontoMedio: 'ponto médio', testeSinal: 'teste de sinal', atualizaIntervalo: 'atualiza intervalo', criterioParada: 'critério de parada',
    avaliaDerivada: 'avalia derivada', passoNewton: 'passo de Newton', trocaLinhas: 'troca de linhas', pivo: 'pivô', eliminacao: 'eliminação',
    escolhaPivo: 'escolha do pivô', trocaClassica: 'troca clássica', trocaObrigatoria: 'troca obrigatória', trocaRecomendada: 'troca recomendada', pivoOk: 'pivô ok', substituicao: 'substituição', fim: 'fim' };
  var estado = { metodo: null, texto: '', abridor: null };
  var NOMES = { bisseccao: 'Bissecção', newton: 'Newton-Raphson', gauss: 'Eliminação de Gauss' };
  function statusCopia(msg) {
    var bt = $('copiar-codigo'); $('copiar-status').textContent = msg;
    bt.textContent = /^Copiado/.test(msg) ? 'Copiado!' : 'Copiar';
    setTimeout(function () { bt.textContent = 'Copiar'; }, 1800);
  }
  function copiar(texto) {
    function fallback() {
      var ta = document.createElement('textarea'); ta.value = texto; ta.setAttribute('readonly', ''); ta.className = 'sr-only';
      document.body.appendChild(ta); ta.select(); var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta); $('copiar-codigo').focus();
      statusCopia(ok ? 'Copiado para a área de transferência.' : 'Não foi possível copiar. Selecione o código e use Ctrl+C.');
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texto).then(function () { statusCopia('Copiado para a área de transferência.'); }, fallback);
    else fallback();
  }
  function focaveis() { return Array.prototype.filter.call($('gaveta-codigo').querySelectorAll('button, summary, [tabindex="0"]'), function (e) { return e.offsetParent !== null || e === document.activeElement; }); }
  /* modo da gaveta: 'codigo' (Ver código) ou 'avisos' (mesmo componente, conteúdo diferente) */
  function modo(m) { var gav = $('gaveta-codigo'); gav.dataset.modo = m; gav.querySelector('.gaveta-codigo__corpo:not(#corpo-avisos)').hidden = m !== 'codigo'; $('corpo-avisos').hidden = m !== 'avisos'; $('copiar-codigo').hidden = m !== 'codigo'; gav.querySelector('.gaveta-codigo__rodape').hidden = m !== 'codigo'; $('fechar-codigo').setAttribute('aria-label', m === 'codigo' ? 'Fechar código (Esc)' : 'Fechar avisos (Esc)'); }
  var ligado = false;
  /* Desktop (≥1024px): gaveta lateral; <1024px: tela cheia (CSS). Nos dois: modal, foco preso, body sem rolagem. */
  var MQ = window.matchMedia ? matchMedia('(min-width: 1024px)') : { matches: true };
  function desktop() { return MQ.matches; }
  function aplicarModo() {
    var gav = $('gaveta-codigo'), ov = $('codigo-overlay'); if (!gav) return;
    if (gav.parentNode !== document.body) document.body.appendChild(gav);
    gav.setAttribute('aria-modal', 'true');
    ov.hidden = gav.hidden || !desktop(); ov.classList.toggle('aberto', !gav.hidden && desktop());
  }
  function ligar() {
    if (ligado) return; ligado = true;
    $('copiar-codigo').addEventListener('click', function () { copiar(estado.texto); });
    $('fechar-codigo').addEventListener('click', function () { V.codigo.fechar(); });
    $('codigo-overlay').addEventListener('click', function () { V.codigo.fechar(); });
    document.addEventListener('keydown', function (e) {
      if (!V.codigo.aberto()) return;
      if (e.key === 'Escape') { e.preventDefault(); V.codigo.fechar(); return; }
      if (e.key === 'Tab') { // foco preso (modal em desktop e em tela cheia no mobile)
        var f = focaveis(), pri = f[0], ult = f[f.length - 1];
        if (!$('gaveta-codigo').contains(document.activeElement)) { e.preventDefault(); pri.focus(); }
        else if (e.shiftKey && document.activeElement === pri) { e.preventDefault(); ult.focus(); }
        else if (!e.shiftKey && document.activeElement === ult) { e.preventDefault(); pri.focus(); }
      }
    });
    var reagir = function () { if (V.codigo.aberto()) aplicarModo(); };
    if (MQ.addEventListener) MQ.addEventListener('change', reagir); else if (MQ.addListener) MQ.addListener(reagir);
    window.addEventListener('resize', reagir);
  }
  V.codigo = {
    aberto: function () { var gv = $('gaveta-codigo'); return !!gv && !gv.hidden; },
    /* abre a gaveta com Metodos.<metodo>.toString() e marca a linha do passo atual */
    abrir: function (metodo, passo, abridor) {
      ligar();
      var gav = $('gaveta-codigo'), ov = $('codigo-overlay'), fonte = fonteDoMetodo(metodo);
      estado = { metodo: metodo, texto: fonte.texto, abridor: abridor || document.activeElement };
      gav.className = 'gaveta-codigo metodo-' + metodo; modo('codigo'); estado.modo = 'codigo';
      $('gaveta-metodo').textContent = NOMES[metodo] || metodo;
      $('gaveta-arquivo').textContent = 'js/metodos/' + metodo + '.js';
      $('codigo-origem').textContent = 'Fonte real em execução: ' + fonte.origem.replace(/( e |$)/g, '.toString()$1') + '.';
      $('codigo-fonte').innerHTML = V.destacarJS(fonte.texto).map(function (h) { return '<span class="ln">' + (h || ' ') + '</span>'; }).join('');
      Array.prototype.forEach.call($('codigo-fonte').querySelectorAll('.ln'), function (l) { if (l.textContent.indexOf(TITULO_AUX) === 0) l.classList.add('ln-titulo'); });
      gav.hidden = false; document.documentElement.classList.add('gaveta-aberta');
      void gav.offsetWidth; gav.classList.add('aberto'); aplicarModo();
      if (estado.abridor && estado.abridor.setAttribute) estado.abridor.setAttribute('aria-expanded', 'true');
      V.codigo.marcar(metodo, passo);
      $('fechar-codigo').focus();
    },
    /* "Avisos": vantagens, desvantagens e possíveis problemas; destaca o problema detectado no cálculo atual */
    abrirAvisos: function (metodo, res, abridor) {
      ligar();
      var gav = $('gaveta-codigo');
      estado = { metodo: metodo, texto: '', abridor: abridor || document.activeElement, modo: 'avisos' };
      gav.className = 'gaveta-codigo metodo-' + metodo; modo('avisos');
      $('gaveta-metodo').textContent = NOMES[metodo] || metodo; $('gaveta-arquivo').textContent = 'Avisos';
      var corpo = $('corpo-avisos'); corpo.innerHTML = V.avisos ? V.avisos.render(metodo, res) : '<p class="avisos__vazio">Conteúdo em preparação.</p>';
      gav.hidden = false; document.documentElement.classList.add('gaveta-aberta');
      void gav.offsetWidth; gav.classList.add('aberto'); aplicarModo();
      if (estado.abridor && estado.abridor.setAttribute) estado.abridor.setAttribute('aria-expanded', 'true');
      var d = corpo.querySelector('.is-ativo'); corpo.scrollTop = 0;
      if (d) { d.scrollIntoView({ block: 'nearest' }); d.querySelector('summary').focus(); } else $('fechar-codigo').focus();
    },
    /* linha ativa = passo.etapa; durante a reprodução percorre passo.etapas (sub-ações) e termina em passo.etapa.
       Sem animação com prefers-reduced-motion ou se o núcleo não mandar etapas. */
    marcar: function (metodo, passo, op) {
      if (!V.codigo.aberto() || metodo !== estado.metodo || estado.modo !== 'codigo' || !passo) return;
      clearTimeout(estado.anim);
      var pinta = function (p) {
        var i = V.linhaDoPasso(metodo, estado.texto, p), lns = $('codigo-fonte').children;
        for (var j = 0; j < lns.length; j++) { var at = j === i; lns[j].classList.toggle('linha-ativa', at); if (at) lns[j].setAttribute('aria-current', 'step'); else lns[j].removeAttribute('aria-current'); }
        if (lns[i]) { var corpo = $('gaveta-codigo').querySelector('.gaveta-codigo__corpo'); corpo.scrollTop = Math.max(0, lns[i].offsetTop - corpo.clientHeight / 2); }
      };
      /* Passo a passo: percorre passo.etapas (~250 ms cada) e PARA na última. Reprodução: percorre no ritmo do player.
         prefers-reduced-motion: vai direto à última. Rodapé mostra a sequência com a etapa ativa. */
      var et = Array.isArray(passo.etapas) ? passo.etapas.filter(Boolean) : [];
      var reduz = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      var rot = $('codigo-etapa');
      var mostra = function (k) { if (!rot) return; if (!et.length) { rot.hidden = true; rot.innerHTML = ''; return; }
        rot.hidden = false; rot.innerHTML = 'Etapa: ' + et.map(function (e, i) { var n = NOME_ETAPA[e] || e; return i === k ? '<strong aria-current="step">' + n + '</strong>' : n; }).join(' → ') + '. '; };
      var vai = function (k) { pinta({ etapa: et[k], k: passo.k, tipo: passo.tipo, pivo: passo.pivo, etapas: [] }); mostra(k); };
      if (!et.length) { pinta(passo); mostra(-1); return; }
      if (et.length < 2 || reduz) { vai(et.length - 1); return; }
      var tocando = op && op.tocando, k = 0;
      var dt = tocando ? Math.max(120, Math.min(400, ((op.intervalo || 1200) * 0.8) / et.length)) : 250;
      (function prox() {
        if (!V.codigo.aberto() || estado.modo !== 'codigo') return;
        vai(k); k++;
        if (k < et.length) estado.anim = setTimeout(prox, dt);
      })();
    },
    fechar: function () {
      clearTimeout(estado.anim);
      var gav = $('gaveta-codigo'), ov = $('codigo-overlay'); if (!gav || gav.hidden) return;
      gav.classList.remove('aberto'); ov.classList.remove('aberto'); document.documentElement.classList.remove('gaveta-aberta');
      var dur = !desktop() ? 0 : parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dur-gaveta')) || 0;
      setTimeout(function () { gav.hidden = true; ov.hidden = true; }, dur);
      if (estado.abridor && estado.abridor.focus) { estado.abridor.setAttribute('aria-expanded', 'false'); estado.abridor.focus(); }
    }
  };
})(window);
