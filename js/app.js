/* Navegação entre abas e ligação formulário → método → visualização → player. */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  /* Mensagens como .toast (componentes.css): erro, sucesso e avisos do núcleo (Metodos.executar). */
  var ICONES = { erro: '✕', sucesso: '✓', aviso: '!' }, TITULOS = { erro: 'Erro', sucesso: 'Resultado', aviso: 'Aviso' };
  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function toast(tipo, texto, extra) {
    return '<div class="toast toast--' + tipo + '"' + (tipo === 'erro' ? ' role="alert"' : '') + '><span class="toast__icone" aria-hidden="true">' + ICONES[tipo] + '</span><div><p class="toast__titulo">' + TITULOS[tipo] + '</p><p class="toast__texto">' + esc(window.Visual.br(texto)) + '</p>' + (extra || '') + '</div></div>';
  }
  /* Gauss n > 3: solução numa tabela compacta (xᵢ | valor), fmtTab (vírgula, −), rolagem interna */
  function tabelaSolucao(r) { var V = window.Visual, x = (r.resultado && r.resultado.x) || []; if (x.length <= 3) return '';
    return '<div class="solucao-tabela" tabindex="0" role="region" aria-label="Solução x"><table class="tabela tabela--solucao"><thead><tr><th scope="col">xᵢ</th><th scope="col">valor</th></tr></thead><tbody>' +
      x.map(function (v, k) { var t = V.fmtTab(v); if (/^−0(,0*)?$/.test(t)) t = t.slice(1); return '<tr><th scope="row">x' + (k + 1) + '</th><td title="' + V.completo(v) + '" aria-label="x' + (k + 1) + ' = ' + V.completo(v) + '">' + t + '</td></tr>'; }).join('') + '</tbody></table></div>'; }
  /* notas discretas sob o resultado (não substituem o resultado) */
  var NOTAS = { bisseccao: 'Nota: vale se f for contínua em [a, b]. Confira se o ε pedido está em % (multiplique o erro por 100) ou em decimal.', newton: 'Nota: confira se o ε pedido está em % (multiplique o erro por 100) ou em decimal.' };
  function mostrarMensagens(id, res, resumo) {
    var h = '';
    if (res.erro && id === 'newton' && res.codigoErro === 'OSCILACAO' && window.Visual.cicloNoLimite(res.passos)) {
      var u = res.passos[res.passos.length - 1];
      h += toast('aviso', 'Parou no limite de precisão do computador (precisão dupla, ~16 dígitos): os iterados pararam de mudar em precisão dupla (xₖ alterna entre dois números vizinhos), então o ' + ((res.criterio || 'relativo') === 'relativo' ? 'ε' : 'tol') + ' pedido não pôde ser alcançado. Raiz ≈ ' + window.Visual.oito(u.xNovo) + ' após ' + res.passos.length + ' iterações; este é o resultado mais preciso possível em precisão dupla.');
    } else if (res.erro) h += toast(res.codigoErro === 'NAO_CONVERGIU' ? 'aviso' : 'erro', res.erro);
    else if (res.resultado) h += toast('sucesso', resumo(res), (id === 'gauss' ? tabelaSolucao(res) : '') + (NOTAS[id] ? '<p class="nota-resultado">' + NOTAS[id] + '</p>' : ''));
    (res.avisos || []).forEach(function (a) { h += toast('aviso', a); });
    if (id === 'gauss' && window.Visual.pivo) h = h.replace(/\[(!|i|⇅)\] /g, function (_, g) { return window.Visual.pivo.glifo({ '!': 'obrigatoria', i: 'recomendada', '⇅': 'classica' }[g]) + ' '; });
    $('#msg-' + id).innerHTML = h;
  }
  /* campos numéricos aceitam vírgula decimal ("1,5" → "1.5"), como no Gauss; f e f' ficam intactas */
  var NUMERICOS = { a: 1, b: 1, x0: 1, tol: 1, maxIter: 1 };
  function dados(form) { var o = {}; new FormData(form).forEach(function (v, k) { o[k] = NUMERICOS[k] && typeof v === 'string' && /^\s*-?\d*,\d+(e-?\d+)?\s*$/i.test(v) ? v.replace(',', '.') : v; }); return o; }
  function plural(n, s, p) { return n + ' ' + (n === 1 ? s : p); }
  var tarefaGrande = null;
  function executarGaussGrande(p, concluir) {
    if (tarefaGrande) tarefaGrande.cancelar();
    var n = p.matriz.length;
    var A = p.matriz.map(function (l) { return l.slice(0, n); }), b = p.matriz.map(function (l) { return l[n]; });
    var box = $('#progresso-gauss'), barra = $('#progresso-gauss-barra'), texto = $('#progresso-gauss-texto');
    var msg = $('#msg-gauss'); if (msg) msg.innerHTML = '';
    box.hidden = false; barra.max = n; barra.value = 0;
    texto.textContent = 'Eliminando o sistema ' + n + '×' + n + ' (A ' + n + '×' + n + ', b ' + n + '×1)…';
    tarefaGrande = window.Visual.tarefaGauss(A, b, p.pivoteamento || 'automatico', {
      progresso: function (k, nT) { barra.value = k; texto.textContent = 'Coluna ' + k + ' de ' + nT + ' · Sistema ' + nT + '×' + nT + ' · A: ' + nT + '×' + nT + ', b: ' + nT + '×1'; },
        erro: function () {
          tarefaGrande = null; box.hidden = true;
          concluir({ passos: [], resultado: null, erro: 'Não foi possível calcular em segundo plano. Tente de novo ou reduza n.', codigoErro: 'ERRO_INTERNO', avisos: [] });
        },
        fim: function (exp) {
        tarefaGrande = null; box.hidden = true;
        if (!exp) { concluir({ passos: [], resultado: null, erro: 'O cálculo em segundo plano não devolveu resultado.', codigoErro: 'ERRO_INTERNO', avisos: [] }); return; }
        var bruto;
        try { bruto = window.Metodos.apresentarMotor({ A: A, b: b, pivoteamento: p.pivoteamento }, exp); }
        catch (e) { bruto = { passos: [], erro: 'Erro interno: ' + e.message, codigoErro: 'ERRO_INTERNO', avisos: [] }; }
        var res = window.Visual.normalizar('gauss', bruto);
        res.codigoErro = bruto.codigoErro || null; res.avisos = (bruto.avisos || []).slice(); res.codigosAviso = (bruto.codigosAviso || []).slice(); res.modoPivo = p.pivoteamento;
        if (!res.resultado && bruto.resultado) res.resultado = bruto.resultado;
        concluir(res);
      },
      cancelado: function () {
        tarefaGrande = null; box.hidden = true;
        concluir({ passos: [], resultado: null, erro: 'Cálculo cancelado. Nada foi alterado no sistema.', codigoErro: 'CANCELADO', avisos: [] });
      },
    });
    var bt = $('#cancelar-gauss');
    bt.onclick = function () { if (tarefaGrande) tarefaGrande.cancelar(); };
  }

  var NOMES = { bisseccao: 'Bissecção', newton: 'Newton-Raphson', gauss: 'Eliminação de Gauss' };
  /* Monta uma aba: obter(form) -> parâmetros; Visual.chamar[id] -> resultado normalizado; visual consome passos. */
  function montarAba(id, obter, resumo) {
    var el = { descricao: $('#desc-' + id) }, visual, passos = [];
    el.player = new window.Player($('#player-' + id), { aoMudar: function (i, ant) { visual.mostrar(i, ant); window.Visual.codigo.marcar(id, passos[i], { tocando: !!(el.player && el.player.timer), intervalo: el.player ? el.player.intervalo() : 1200 }); } });
    if (id === 'gauss') { el.matriz = $('#matriz-gauss'); el.solucao = $('#solucao-gauss'); el.mapa = $('#mapa-gauss'); el.mapaDica = $('#mapa-dica'); el.mapaStatus = $('#mapa-status'); el.mapaBloco = $('#bloco-mapa'); el.matrizBloco = $('#bloco-matriz'); el.legendaGrade = $('#legenda-grade'); el.pivo = $('#pivo-gauss'); el.comparacao = $('#comparacao-gauss'); el.seloMapa = $('#selo-mapa'); }
    else { el.canvas = $('#canvas-' + id); el.tbody = $('#tabela-' + id); }
    visual = window.Visual[id](el);
    var form = $('#form-' + id);
    function concluir(res, p) {
      p = p || {};
      passos = res.passos;
      visual.carregar(res, p.f !== undefined ? window.Visual.chamar.compilar(p.f) : null);
      el.player.carregar(passos.length);
      indicarRolagem();
      mostrarMensagens(id, res, resumo);
      ultimoRes = res; atualizarSelo(); marcarDesatualizado(false);
      if (passos.length) el.player.tocar(true);
    }
    function executar() {
      var p = obter(form);
      var grande = (window.Metodos && window.Metodos.N_MODO_GRANDE) || 120;
      if (id === 'gauss' && window.Visual.tarefaGauss && p && p.matriz && !p.erroLocal && p.matriz.length > grande) {
        executarGaussGrande(p, function (res) { concluir(res, p); });
        return;
      }
      var res = p.erroLocal ? { passos: [], resultado: null, erro: p.erroLocal, codigoErro: 'ENTRADA', avisos: [] } : window.Visual.chamar[id](p);
      concluir(res, p);
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); executar(); });
    /* BUG-28: resultado desatualizado. Texto editado → aviso discreto (sem recalcular a cada tecla); nunca há resultado que não corresponda às entradas sem esse aviso. */
    var desat = document.createElement('p'); desat.className = 'desatualizado'; desat.id = 'desat-' + id; desat.setAttribute('role', 'status'); desat.hidden = true;
    desat.innerHTML = '<span class="badge badge--aviso">Desatualizado</span> <span>Entradas alteradas: o resultado abaixo é do cálculo anterior. Clique em Calcular para atualizar.</span>';
    var msgEl = $('#msg-' + id); msgEl.parentNode.insertBefore(desat, msgEl);
    var resultados = $('#painel-' + id + ' .coluna:last-child');
    function marcarDesatualizado(sim) { desat.hidden = !sim; if (resultados) resultados.classList.toggle('resultado-desatualizado', !!sim); }
    document.addEventListener('input', function (e) { var t = e.target; if (!ultimoRes || !t.matches || t.form !== form || t.type === 'radio' || t.closest('#painel-colar')) return; marcarDesatualizado(true); });
    function recalcularSeHouver() { if (ultimoRes) executar(); }
    var ultimoRes = null, btAv = $('#avisos-' + id);
    function atualizarSelo() { // selo (design §8): .btn-selo aria-hidden + aria-label com o número
      var k = window.Visual.avisos ? (window.Visual.avisos.contar ? window.Visual.avisos.contar(id, ultimoRes) : window.Visual.avisos.detectar(id, ultimoRes).length) : 0, selo = btAv.querySelector('.btn-selo');
      if (k && !selo) { selo = document.createElement('span'); selo.className = 'btn-selo'; selo.setAttribute('aria-hidden', 'true'); btAv.appendChild(selo); }
      if (selo && !k) selo.remove(); else if (selo) selo.textContent = String(k);
      btAv.setAttribute('aria-label', k ? 'Avisos (' + k + (k > 1 ? ' problemas' : ' problema') + ' no cálculo atual)' : 'Avisos');
    }
    btAv.addEventListener('click', function () { window.Visual.codigo.abrirAvisos(id, ultimoRes, this); });
    $('#codigo-' + id).addEventListener('click', function () { window.Visual.codigo.abrir(id, passos[el.player.indice], this); });
    return { executar: executar, player: el.player, recalcularSeHouver: recalcularSeHouver, marcarDesatualizado: function (v) { if (ultimoRes) marcarDesatualizado(v); } };
  }
  function n6(v, d) { return v == null || !isFinite(v) ? '—' : String(+(+v).toPrecision(d || 10)); }

  var abas = {
    bisseccao: montarAba('bisseccao', dados, function (r) { var n = r.passos.length, u = r.passos[n - 1], est = r.resultado.iteracoesEstimadas;
      if (r.resultado.zeroObservado || r.resultado.parada === 'zero_precisao_dupla') return 'Raiz aproximada: c = ' + window.Visual.oito(r.resultado.raiz) + ' (f(c) = 0 em precisão dupla) após ' + plural(n, 'iteração', 'iterações') + '.';
      return 'Raiz aproximada: c = ' + window.Visual.oito(r.resultado.raiz) + ' após ' + plural(n, 'iteração', 'iterações') + (est ? ' (estimativa teórica: ' + est + ').' : '.') + ' f(c) = ' + window.Visual.oito(r.resultado.fRaiz) + (u && isFinite(u.erroCriterio) ? '; erro = ' + window.Visual.oito(u.erroCriterio) : '') + '. Parou porque ' + motivoCrit('bisseccao', r) + '.' + limite('bisseccao', r); }),
    newton: montarAba('newton', dados, function (r) { var n = r.passos.length, u = r.passos[n - 1];
      if (r.resultado.zeroObservado || r.resultado.parada === 'zero_precisao_dupla') return 'Zero observado em precisão dupla em x = ' + window.Visual.oito(r.resultado.raiz) + '. f vale 0 nessa aritmética. É a parada do método, não uma certificação matemática de raiz.';
      var porPasso = r.resultado.motivo ? r.resultado.motivo !== 'ZERO_PRECISAO_DUPLA' : (u && isFinite(u.erro) && u.fx !== 0);
      return 'Raiz ≈ ' + window.Visual.oito(r.resultado.raiz) + ' após ' + plural(n, 'iteração', 'iterações') + ({ simbolica: ' (derivada simbólica).', numerica: ' (derivada numérica).', fornecida: ' (derivada informada).' }[r.resultado.tipoDerivada] || '.') + (porPasso ? ' Parou porque ' + motivoCrit('newton', r) + '.' : ' Parou porque f(x) = 0 em precisão dupla.') + limite('newton', r); }),
    gauss: montarAba('gauss', function (form) {
      var n = nAtual, M = [], erros = [];
      function nome(i, j) { return j === n ? 'b[' + (i + 1) + '] (vetor n×1)' : 'A[' + (i + 1) + '][' + (j + 1) + '] (matriz n×n)'; }
      if (n > GE.MAX_GRADE) {
        for (var a = 0; a < n; a++) { M.push([]); for (var c2 = 0; c2 <= n; c2++) {
          var bruto = modelo[a] ? modelo[a][c2] : '';
          var lido = window.Metodos.analisarNumero(bruto);
          if (!lido.ok) erros.push({ i: a, j: c2, msg: nome(a, c2) + (String(bruto == null ? '' : bruto).trim() === '' ? ' está vazio.' : ': "' + bruto + '" — ' + lido.erro + (lido.posicao != null ? ' (posição ' + (lido.posicao + 1) + ')' : '') + '.') });
          M[a].push(lido.ok ? lido.valor : NaN);
        } }
        if (erros.length) return { erroLocal: 'A é ' + n + '×' + n + ' e b é ' + n + '×1. ' + erros.length + ' valor(es) inválido(s). ' + erros[0].msg + ' Use Colar A e b, Aleatório ou Exemplo.' };
        esconderErros();
        return { matriz: M, pivoteamento: form.pivoteamento.value || 'automatico' };
      }
      for (var i = 0; i < n; i++) { M.push([]); for (var j = 0; j <= n; j++) {
        var inp = document.querySelector('#rolagem-entrada [data-l="' + i + '"][data-c="' + j + '"]');
        var brutoG = valorCel(inp), lidoG = window.Metodos.analisarNumero(brutoG);
        if (lidoG.ok) { inp.removeAttribute('aria-invalid'); inp.setAttribute('aria-describedby', 'dimensao-gauss'); M[i].push(lidoG.valor); }
        else {
          var msg = nome(i, j) + (String(brutoG).trim() === '' ? ' está vazio.' : ': "' + brutoG + '" — ' + lidoG.erro + (lidoG.posicao != null ? ' (posição ' + (lidoG.posicao + 1) + ')' : '') + '.');
          inp.setAttribute('aria-invalid', 'true'); inp.setAttribute('aria-describedby', 'erro-item-' + i + '-' + j);
          erros.push({ inp: inp, i: i, j: j, msg: msg }); M[i].push(NaN);
        }
      } }
      if (erros.length) { mostrarErros(erros); erros[0].inp.focus(); return { erroLocal: erros.length + (erros.length > 1 ? ' valores inválidos. ' : ' valor inválido. ') + erros[0].msg }; }
      esconderErros();
      return { matriz: M, pivoteamento: form.pivoteamento.value || 'automatico' };
    }, function (r) { var V = window.Visual, x = r.resultado.x || [], d = r.resultado.determinante, t = V.fmtSolucao(x);
      var tr = V.pivo ? ' ' + V.pivo.resumo(r.passos, r.modoPivo, r.resultado) : '';
      var dim = 'Sistema ' + x.length + '×' + x.length + '. A: ' + x.length + '×' + x.length + ', b: ' + x.length + '×1. ';
      return dim + 'Solução única' + (d != null && isFinite(d) ? ' (det A = ' + (V.extremo(d) ? V.fmtE(d) : V.fmtCient(d)) + ')' : '') + (x.length > 3 ? ' com ' + x.length + ' incógnitas.' : ': ' + t.map(function (s, i) { return 'x' + (i + 1) + ' = ' + s; }).join('; ') + '.') + tr; })
  };
  /* Critério de parada (Bissecção/Newton): mapeamento com o núcleo em js/visual/chamadas.js (Visual.criterio). */
  /* Parada no limite de precisão do computador (detectada nos passos, não pelo valor de ε). */
  function limite(m, r) { var V = window.Visual; if (!r.resultado || r.resultado.zeroObservado || r.resultado.motivo === 'ZERO_PRECISAO_DUPLA' || !V.paradaNoLimite(m, r.passos)) return '';
    var modo = r.criterio || 'relativo', nome = modo === 'relativo' ? 'ε' : 'tol', form = $('#form-' + m);
    var tol = Number(String(form.tol.value).trim().replace(/−/g, '-').replace(',', '.')), esc = m === 'bisseccao' ? Math.max(Math.abs(+String(form.a.value).replace(',', '.').replace(/−/g, '-')) || 0, Math.abs(+String(form.b.value).replace(',', '.').replace(/−/g, '-')) || 0) : Math.abs(r.resultado.raiz) || 0;
    var inalcancavel = V.tolAbaixoDoPiso(tol, modo, Math.max(esc, Math.abs(r.resultado.raiz) || 0));
    return ' Atenção: parou no limite de precisão do computador (precisão dupla, ~16 dígitos): ' + (m === 'bisseccao' ? 'o ponto médio deixou de mudar' : 'xₖ₊₁ ficou igual a xₖ') +
      (inalcancavel ? ', e o ' + nome + ' pedido (' + V.sig(tol, 3) + ') é menor do que o computador consegue distinguir, então não pôde ser alcançado de fato.' : ', então o erro mostrado (0) é o limite da representação, não um ganho real de precisão.') +
      ' Este resultado é o mais preciso possível em precisão dupla.'; }
  function motivoCrit(m, r) { var C = window.Visual.criterio, modo = r.criterio || 'relativo'; var u = r.passos[r.passos.length - 1]; return C.formula[m][modo] + (u && u.criterioFallback ? ' (|x| ≈ 0: usou o erro absoluto contra ε)' : ''); }
  var CRIT_TXT = {
    bisseccao: { absoluto: 'Critério de parada: <strong>(b − a)/2 &lt; tol</strong> (meia largura do intervalo), ou f(c) = 0.', relativo: 'Critério de parada: <strong>|cₖ − cₖ₋₁|/|cₖ| &lt; ε</strong> (variação do ponto médio relativa a |c|), ou f(c) = 0.' },
    newton: { absoluto: 'Critério de parada: <strong>|xₖ₊₁ − xₖ| &lt; tol</strong> (tamanho do passo), ou f(xₖ) = 0.', relativo: 'Critério de parada: <strong>|xₖ₊₁ − xₖ|/|xₖ₊₁| &lt; ε</strong> (passo relativo a |x|), ou f(xₖ) = 0.' } };
  ['bisseccao', 'newton'].forEach(function (m) {
    var form = $('#form-' + m);
    function sync() { var modo = form.criterio.value || 'relativo', rel = modo === 'relativo';
      form.querySelector('.rotulo-tol').textContent = rel ? 'ε' : 'Tolerância (tol)';
      $('#criterio-' + m).innerHTML = CRIT_TXT[m][modo];
      var th = $('#painel-' + m + ' .th-erro'); if (th) th.textContent = window.Visual.thErro(m, rel); dica(); }
    /* Dica não bloqueante: tolerância abaixo do que a precisão dupla consegue distinguir */
    var dicaEl = document.createElement('p'); dicaEl.className = 'campo__ajuda dica-precisao'; dicaEl.id = 'dica-precisao-' + m; dicaEl.hidden = true; dicaEl.setAttribute('aria-live', 'polite');
    $('#criterio-' + m).parentNode.insertBefore(dicaEl, $('#criterio-' + m).nextSibling);
    form.tol.setAttribute('aria-describedby', 'criterio-' + m + ' dica-precisao-' + m);
    function lerN(v) { var t = String(v || '').trim().replace(/−/g, '-').replace(',', '.'); return t === '' ? NaN : Number(t); }
    function dica() { var V = window.Visual, modo = form.criterio.value || 'relativo', tol = lerN(form.tol.value);
      var esc = m === 'bisseccao' ? Math.max(Math.abs(lerN(form.a.value)) || 0, Math.abs(lerN(form.b.value)) || 0) : Math.abs(lerN(form.x0.value)) || 0;
      var mostra = V.tolAbaixoDoPiso(tol, modo, esc); dicaEl.hidden = !mostra; if (!mostra) return;
      dicaEl.innerHTML = '<span class="badge badge--aviso">Limite de precisão</span> ' + (modo === 'relativo'
        ? 'Abaixo de ~2,2·10⁻¹⁶ o computador não consegue distinguir números (precisão dupla, ~16 dígitos). O método vai parar quando os valores deixarem de mudar.'
        : 'Perto de ' + (esc > 1 ? '|x| ≈ ' + V.sig(esc, 3) : 'x = 1') + ', o computador não distingue diferenças menores que ~' + V.sig(V.pisoTol(modo, esc), 2) + ' (precisão dupla, ~16 dígitos). O método vai parar quando os valores deixarem de mudar.'); }
    ['tol', 'a', 'b', 'x0'].forEach(function (k) { if (form[k] && form[k].addEventListener) form[k].addEventListener('input', dica); });
    /* BUG-28: trocar o critério recalcula se a aba já tem resultado (senão só rótulo e ajuda) */
    /* ε padrão: relativo = Metodos.TOL_PADRAO.relativo (fallback 0,01); absoluto = 0,0001 (sem padrão no core). Um valor guardado por critério; o campo nunca fica vazio. */
    var TP = (window.Metodos && window.Metodos.TOL_PADRAO) || {}, fmtTol = function (v) { return String(v).replace('.', ','); };
    var tolGuardada = { relativo: fmtTol(TP.relativo != null ? TP.relativo : 0.01), absoluto: fmtTol(TP.absoluto != null ? TP.absoluto : 0.0001) }, critAnt = form.criterio.value || 'relativo';
    form.tol.value = tolGuardada[critAnt];
    $('#seg-criterio-' + m).addEventListener('change', function () { var novo = form.criterio.value || 'relativo';
      if (novo !== critAnt) { if (form.tol.value.trim() !== '') tolGuardada[critAnt] = form.tol.value; form.tol.value = tolGuardada[novo]; critAnt = novo; }
      sync(); abas[m].recalcularSeHouver(); }); sync();
  });
  /* ajuda do seletor de pivoteamento */
  var AJUDA_PIVO = { automatico: 'Troca só quando o pivô é zero ou pequeno demais perto dos outros da coluna.', sempre: 'Pivoteamento parcial clássico: sempre usa o maior |a| da coluna.', nunca: 'Nunca troca por escolha; mostra o erro que isso causa. Pivô zero interrompe.' };
  var selPivo = $('#pivoteamento-gauss');
  function ajudaPivo() { var v = $('#form-gauss').pivoteamento.value; $('#ajuda-pivo').textContent = AJUDA_PIVO[v] || ''; }
  selPivo.addEventListener('change', function () { ajudaPivo(); abas.gauss.recalcularSeHouver(); }); ajudaPivo();

  /* Tema: escuro é o padrão; claro via <html data-theme="light"> (tokens do Designer). */
  var btTema = $('#alternar-tema');
  function syncTema() { var claro = document.documentElement.dataset.theme === 'light'; btTema.setAttribute('aria-pressed', String(claro)); var rot = claro ? 'Tema escuro' : 'Tema claro'; btTema.querySelector('.btn-tema-texto').textContent = rot; btTema.setAttribute('aria-label', rot); }
  btTema.addEventListener('click', function () {
    var claro = document.documentElement.dataset.theme !== 'light';
    if (claro) document.documentElement.dataset.theme = 'light'; else document.documentElement.removeAttribute('data-theme');
    try { localStorage.setItem('tema', claro ? 'light' : ''); } catch (e) {}
    syncTema();
  });
  syncTema();

  /* Entrada da matriz do Gauss */
  var EXEMPLOS = {
    2: [[2, 1, 5], [1, -3, -1]],
    3: [[2, 1, -1, 8], [-3, -1, 2, -11], [-2, 1, 2, -3]],
    4: [[4, -1, 0, 0, 3], [-1, 4, -1, 0, 2], [0, -1, 4, -1, 2], [0, 0, -1, 3, 2]]
  };
  function exemplo(n) {
    if (EXEMPLOS[n]) return EXEMPLOS[n];
    var M = []; // diagonal dominante com solução x = (1, 2, ..., n)
    for (var i = 0; i < n; i++) { M.push([]); var b = 0; for (var j = 0; j < n; j++) { var a = i === j ? n + 2 : ((i + 2 * j) % 3) - 1; M[i].push(a); b += a * (j + 1); } M[i].push(b); }
    return M;
  }
  var GE = window.Visual.gaussEntrada, nAtual = 3, modelo = [], acervoA = [], acervoB = [], origem = '';
  var M_ = window.Metodos || {};
  var INPUTS = '#rolagem-entrada input[data-l]';
  function lerEntrada() { // n ≤ 10: grades A e b → modelo (aumentado internamente; b na última coluna)
    if (nAtual > GE.MAX_GRADE) return modelo;
    document.querySelectorAll(INPUTS).forEach(function (inp) { var i = +inp.dataset.l, j = +inp.dataset.c; (modelo[i] = modelo[i] || [])[j] = valorCel(inp); }); return modelo;
  }
  /* tooltip da célula: valor completo com vírgula e − (o dado bruto fica em data-valor) */
  function tituloCel(v) { return String(v).replace(/-/g, '−').replace(/\./g, ','); }
  function revelarCelula(inp) {
    var rol = $('#rolagem-entrada'), bloco = document.querySelector('.entrada-bloco--b');
    if (!rol || !inp || !inp.getBoundingClientRect) return;
    var ir = inp.getBoundingClientRect(), rr = rol.getBoundingClientRect();
    if (bloco && String(inp.dataset.c) !== String(nAtual)) {
      var br = bloco.getBoundingClientRect();
      if (ir.right > br.left - 6) rol.scrollLeft += ir.right - br.left + 18;
    }
    if (ir.left < rr.left + 40) rol.scrollLeft -= rr.left + 40 - ir.left;
  }
  function celula(i, j, n) { return '<input form="form-gauss" size="5" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" data-l="' + i + '" data-c="' + j + '" class="input input--num' + (j === n ? ' col-b' : '') + '" aria-label="' + (j === n ? 'b linha ' + (i + 1) + ', vetor n×1' : 'A linha ' + (i + 1) + ', coluna ' + (j + 1) + ', matriz n×n') + '" aria-describedby="dimensao-gauss" value="' + esc(curtoCel(modelo[i][j])) + '" data-valor="' + esc(modelo[i][j] == null ? '' : modelo[i][j]) + '" title="' + esc(modelo[i][j] == null ? '' : tituloCel(modelo[i][j])) + '">'; }
  function esconderErros() { var box = $('#resumo-erros'); if (box) { box.hidden = true; box.innerHTML = ''; } }
  function mostrarErros(erros) {
    var box = $('#resumo-erros'); if (!box) return;
    box.hidden = false;
    box.innerHTML = '<p><strong>' + erros.length + (erros.length > 1 ? ' valores inválidos' : ' valor inválido') + '.</strong> Escolha um item para ir à célula.</p><ul>' + erros.map(function (e) {
      return '<li><button type="button" id="erro-item-' + e.i + '-' + e.j + '" data-l="' + e.i + '" data-c="' + e.j + '">' + esc(e.msg) + '</button></li>';
    }).join('') + '</ul>';
    box.querySelectorAll('button').forEach(function (bt) { bt.addEventListener('click', function () {
      var inp = document.querySelector('#rolagem-entrada [data-l="' + bt.dataset.l + '"][data-c="' + bt.dataset.c + '"]');
      if (inp) { inp.focus(); revelarCelula(inp); }
    }); });
  }
  /* Células de entrada: fora do foco mostram 4 algarismos significativos; o valor completo fica em data-valor (vai para o cálculo). */
  function curtoCel(t) {
    t = t == null ? '' : String(t); var v = Number(t.trim().replace(',', '.').replace(/[−–]/g, '-'));
    if (t.trim() === '' || !isFinite(v)) return t;
    if (window.Visual.extremo(v)) return window.Visual.fmtE(v, 3);
    return String(+v.toPrecision(4)).replace('.', ',').replace('-', '−');
  }
  /* Layout da grade de entrada: fluido (≥ 1024px, sem rolagem) ou com larguras mínimas (rola por dentro, rótulos L sticky, bloco b visível). */
  function layoutEntrada(rola) { var box = $('#entrada-matriz'), n = nAtual; if (!box || n > GE.MAX_GRADE) return;
    box.style.gridTemplateColumns = '2.2em repeat(' + n + ', ' + (rola ? 'minmax(4.6em, 1fr)' : 'minmax(0, 1fr)') + ')'; box.style.minWidth = rola ? 'calc(' + (2.2 + n * 4.6).toFixed(1) + 'em + ' + n + ' * var(--esp-1))' : '';
    $('#rolagem-entrada').classList.toggle('grade--rola', rola); }
  /* piso de 4 algarismos (xs): se não couber no layout fluido, a grade passa a rolar (igual à largura estreita) */
  function caberEntrada() { var grade = $('#rolagem-entrada'); if (nAtual > GE.MAX_GRADE) return;
    var cels = Array.prototype.filter.call(document.querySelectorAll(INPUTS), function (i) { return i !== document.activeElement; });
    var ler = function (i) { var v = Number(String(i.dataset.valor || '').trim().replace(',', '.').replace(/[−–]/g, '-')); return String(i.dataset.valor || '').trim() === '' ? null : v; }, esc_ = function (i, t) { i.value = t; };
    var rola = !window.Visual.largo(); layoutEntrada(rola);
    if (!window.Visual.caberCelulas(cels, ler, esc_, grade) && !rola) { layoutEntrada(true); window.Visual.caberCelulas(cels, ler, esc_, grade); }
    indicarRolagem(); }
  function valorCel(inp) { return document.activeElement === inp || inp.dataset.valor == null ? inp.value : inp.dataset.valor; }
  (function () {
    var raiz = document.getElementById('rolagem-entrada'); if (!raiz) return;
    function focarCel(i, j) { var el = document.querySelector('#rolagem-entrada [data-l="' + i + '"][data-c="' + j + '"]'); if (el) { el.focus(); revelarCelula(el); } }
    raiz.addEventListener('focusin', function (e) { var t = e.target; if (!t.matches || !t.matches('input[data-l]')) return; if (t.dataset.valor != null) t.value = t.dataset.valor; t.select && t.select(); revelarCelula(t); });
    raiz.addEventListener('keydown', function (e) {
      var t = e.target; if (!t.matches || !t.matches('input[data-l]')) return;
      if ((e.key === 'Enter' && (e.ctrlKey || e.metaKey))) { e.preventDefault(); formG.requestSubmit(); return; }
      var i = +t.dataset.l, j = +t.dataset.c, ni = i, nj = j, n = nAtual;
      if (e.key === 'Enter') { nj = j + 1; if (nj > n) { nj = 0; ni = i + 1; } }
      else if (e.key === 'ArrowLeft') nj = j - 1;
      else if (e.key === 'ArrowRight') nj = j + 1;
      else if (e.key === 'ArrowUp') ni = i - 1;
      else if (e.key === 'ArrowDown') ni = i + 1;
      else return;
      if (nj < 0) { nj = n; ni--; } if (nj > n) { nj = 0; ni++; }
      if (ni < 0 || ni >= n) return;
      e.preventDefault(); focarCel(ni, nj);
    });
    raiz.addEventListener('paste', function (e) {
      var t = e.target; if (!t.matches || !t.matches('input[data-l]')) return;
      var texto = e.clipboardData && e.clipboardData.getData('text/plain');
      if (!texto || !/[\n\t;|]/.test(texto)) return;
      e.preventDefault();
      var bloco = window.Metodos.lerBlocoTexto(texto);
      if (bloco.invalido) {
        var inv = bloco.invalido;
        mostrarErros([{ i: +t.dataset.l, j: +t.dataset.c, inp: t, msg: 'Colagem: linha ' + inv.linha + ', coluna ' + inv.coluna + ' — "' + inv.celula + '" ' + (inv.erro || 'não é um número') + (inv.posicao != null ? ' (posição ' + (inv.posicao + 1) + ')' : '') + '.' }]);
        t.setAttribute('aria-invalid', 'true'); return;
      }
      var dadosB = bloco.matriz, li = +t.dataset.l, co = +t.dataset.c, linhas = dadosB.length, cols = dadosB[0].length;
      if (li === 0 && co === 0 && (cols === linhas || cols === linhas + 1) && linhas >= 2 && linhas <= GE.MAX) {
        var bVet = cols === linhas + 1 ? dadosB.map(function (l) { return l[linhas]; }) : null;
        var AA = dadosB.map(function (l) { return l.slice(0, linhas); });
        if (bVet) carregarColado({ n: linhas, M: dadosB });
        else { var Mb = GE.redimensionar(lerEntrada(), linhas); for (var r = 0; r < linhas; r++) for (var c = 0; c < linhas; c++) Mb[r][c] = AA[r][c]; montarEntrada(linhas, Mb, 'colados'); }
        return;
      }
      lerEntrada();
      for (var rr = 0; rr < linhas; rr++) for (var cc = 0; cc < cols; cc++) {
        var ii = li + rr, jj = co + cc; if (ii >= nAtual || jj > nAtual) continue;
        (modelo[ii] = modelo[ii] || [])[jj] = dadosB[rr][cc];
      }
      montarEntrada(nAtual, modelo, 'colados');
    });
    raiz.addEventListener('input', function (e) { var t = e.target; if (t.matches && t.matches('input[data-l]')) { t.dataset.valor = t.value; t.title = tituloCel(t.value); if (document.activeElement !== t) t.value = curtoCel(t.value); } });
    raiz.addEventListener('focusout', function (e) { var t = e.target; if (!t.matches || !t.matches('input[data-l]')) return; if (t.value !== t.dataset.valor) { t.dataset.valor = t.value; t.title = tituloCel(t.value); } t.value = curtoCel(t.dataset.valor); caberEntrada(); });
  })();
  function montarEntrada(n, valores, fonte) {
    modelo = GE.redimensionar(valores || [], n); nAtual = n; origem = fonte || origem;
    var box = $('#entrada-matriz'), boxB = $('#entrada-b'), resumo = $('#resumo-grande'), grande = n > GE.MAX_GRADE;
    $('#rolagem-entrada').hidden = grande; resumo.hidden = !grande; $('#titulo-a').textContent = 'Matriz A (' + n + '×' + n + ')'; $('#titulo-b').textContent = 'Vetor b (' + n + '×1)';
    var dimEl = $('#dimensao-gauss'); if (dimEl) dimEl.textContent = 'Sistema ' + n + '×' + n + ' · A: ' + n + '×' + n + ', b: ' + n + '×1';
    var legA = $('#legenda-a'); if (legA) legA.textContent = 'A (' + n + '×' + n + ')';
    if (grande) { // sem inputs por célula
      box.innerHTML = ''; boxB.innerHTML = '';
      var preenchidas = 0; modelo.forEach(function (l) { l.forEach(function (v) { if (String(v).trim() !== '') preenchidas++; }); });
      resumo.textContent = preenchidas ? 'Matriz A ' + n + '×' + n + ' e vetor b carregados' + (origem ? ' (' + origem + ')' : '') + '. Para n > ' + GE.MAX_GRADE + ' a entrada é por Colar A e b, Aleatório ou Exemplo; a visualização é um mapa de cores.'
        : 'Matriz A ' + n + '×' + n + ' e vetor b vazios. Use Colar A e b, Aleatório ou Exemplo (para n > ' + GE.MAX_GRADE + ' não há grade de digitação).';
    } else {
      var h = '<span class="rotulo-canto" aria-hidden="true"></span>', hb = '<span class="rotulo-col">b</span>';
      for (var c = 0; c < n; c++) h += '<span class="rotulo-col">x' + (c + 1) + '</span>';
      for (var i = 0; i < n; i++) { h += '<span class="rotulo-lin">L' + (i + 1) + '</span>'; for (var j = 0; j < n; j++) h += celula(i, j, n); hb += celula(i, n, n); }
      box.innerHTML = h; boxB.innerHTML = hb;
    }
    sincronizarN(); caberEntrada(); indicarRolagem();
  }
  function estadoAcervo() { return { A: acervoA, B: acervoB }; }
  function gravarAcervo() { var e = GE.gravar(estadoAcervo(), lerEntrada(), nAtual); acervoA = e.A; acervoB = e.B; }
  function matrizDoAcervo(n) { return GE.recortar(estadoAcervo(), n); }
  function zerarAcervo() { acervoA = []; acervoB = []; }
  var ROTULO_ROLAGEM = { '#rolagem-tab-bisseccao': 'Tabela de iterações, role para ver mais colunas', '#rolagem-tab-newton': 'Tabela de iterações, role para ver mais colunas', '#rolagem-entrada': 'Matriz A, role para ver mais colunas', '#rolagem-matriz': 'Matriz da etapa, role para ver mais colunas' };
  function bordas(r) { var max = r.scrollWidth - r.clientWidth; r.classList.toggle('tem-esq', r.scrollLeft > 1); r.classList.toggle('tem-dir', r.scrollLeft < max - 1); }
  function indicarRolagem() {
    [['#rolagem-entrada', '#dica-entrada'], ['#rolagem-matriz', '#dica-matriz'], ['#rolagem-tab-bisseccao'], ['#rolagem-tab-newton']].forEach(function (par) { var r = $(par[0]), d = par[1] ? $(par[1]) : null; if (!r || (par[1] && !d)) return;
      var tem = !r.hidden && r.offsetParent !== null && r.scrollWidth > r.clientWidth + 2; if (d) d.hidden = !tem; r.classList.toggle('tem-rolagem', tem);
      if (tem) { r.setAttribute('tabindex', '0'); r.setAttribute('role', 'region'); r.setAttribute('aria-label', ROTULO_ROLAGEM[par[0]]); bordas(r); }
      else { r.removeAttribute('tabindex'); r.removeAttribute('role'); r.removeAttribute('aria-label'); r.classList.remove('tem-esq', 'tem-dir'); }
      if (!r.dataset.bordas) { r.dataset.bordas = '1'; r.addEventListener('scroll', function () { if (r.classList.contains('tem-rolagem')) bordas(r); }, { passive: true }); } });
  }

  var largoAnt = window.Visual.largo(); window.addEventListener('resize', function () { var lg = window.Visual.largo(); if (lg !== largoAnt && nAtual <= GE.MAX_GRADE) { largoAnt = lg; montarEntrada(nAtual, lerEntrada()); } else caberEntrada(); indicarRolagem(); clearTimeout(tRedesenho); tRedesenho = setTimeout(function () { if (!$('#painel-gauss').hidden && abas.gauss.player.total) abas.gauss.player.irPara(abas.gauss.player.indice); }, 150); });
  var tRedesenho;
  var formG = $('#form-gauss');
  function sincronizarN() {
    var max = GE.MAX, min = GE.MIN;
    formG.n.min = min; formG.n.max = max; formG.n.value = nAtual;
    $('#n-menos').disabled = nAtual <= min; $('#n-mais').disabled = nAtual >= max;
    var ajuda = $('#ajuda-n');
    if (ajuda) ajuda.textContent = 'A é uma matriz n×n e b é um vetor n×1. Até n = ' + GE.MAX_GRADE + ' a grade é editável; acima disso use Colar, Aleatório ou Exemplo e o mapa de cores.';
  }
  var reducaoPendente = null;
  function textoCelula(v) { return v == null ? '' : String(v).trim(); }
  function reducaoEscondeDado(novo) {
    var M = lerEntrada(), i, j;
    for (i = 0; i < nAtual; i++) for (j = 0; j <= nAtual; j++) {
      if (i < novo && (j < novo || j === nAtual)) continue;
      if (textoCelula(M[i] && M[i][j]) !== '') return true;
    }
    return false;
  }
  function aplicarN(n) {
    gravarAcervo();
    montarEntrada(n, matrizDoAcervo(n));
    abas.gauss.marcarDesatualizado(true);
  }
  function fecharConfirmacaoN() {
    reducaoPendente = null;
    var box = $('#confirma-n');
    if (box) box.hidden = true;
    formG.n.value = nAtual;
  }
  function pedirReducao(n) {
    reducaoPendente = n;
    var box = $('#confirma-n');
    $('#confirma-n-texto').textContent = 'Reduzir de ' + nAtual + ' para ' + n + ' esconde linhas ou colunas que têm valor. Cancelar mantém n e todos os coeficientes de A e de b.';
    box.hidden = false;
    formG.n.value = nAtual;
    $('#confirma-n-cancelar').focus();
  }
  function mudarN(v) {
    if (reducaoPendente != null) { formG.n.value = nAtual; return; }
    var r = GE.limitarN(v);
    if (r.n === nAtual) {
      if (r.ajustado) $('#msg-gauss').innerHTML = toast('aviso', 'n deve ser inteiro entre ' + GE.MIN + ' e ' + GE.MAX + '; usei n = ' + r.n + '.');
      sincronizarN();
      return;
    }
    if (r.n < nAtual && reducaoEscondeDado(r.n)) { pedirReducao(r.n); return; }
    if (r.ajustado) $('#msg-gauss').innerHTML = toast('aviso', 'n deve ser inteiro entre ' + GE.MIN + ' e ' + GE.MAX + '; usei n = ' + r.n + '.');
    aplicarN(r.n);
  }
  formG.n.addEventListener('change', function () { mudarN(formG.n.value); });
  formG.n.addEventListener('blur', function () {
    if (reducaoPendente != null) return;
    if (String(formG.n.value) !== String(nAtual)) mudarN(formG.n.value);
  });
  formG.n.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); mudarN(formG.n.value); } });
  $('#n-menos').addEventListener('click', function () { if (reducaoPendente == null) mudarN(nAtual - 1); });
  $('#n-mais').addEventListener('click', function () { if (reducaoPendente == null) mudarN(nAtual + 1); });
  $('#confirma-n-cancelar').addEventListener('click', function () { fecharConfirmacaoN(); formG.n.focus(); });
  $('#confirma-n-ok').addEventListener('click', function () {
    var n = reducaoPendente;
    fecharConfirmacaoN();
    if (n != null && n < nAtual) aplicarN(n);
  });
  function gerar(n) { // prefere o gerador do núcleo (Metodos.gerarSistema), senão o utilitário de interface
    if (typeof M_.gerarSistema === 'function') { try { var r = M_.gerarSistema(n, Date.now() % 100000);
      if (r && r.A && r.b) return r.A.map(function (l, i) { return l.concat([r.b[i]]); }); if (r && r.matriz) return r.matriz; if (Array.isArray(r)) return r; } catch (e) {} }
    return GE.aleatorio(n).matriz;
  }
  function substituirSistema(n, valores, fonte) { fecharConfirmacaoN(); zerarAcervo(); montarEntrada(n, valores, fonte); gravarAcervo(); }
  $('#exemplo-gauss').addEventListener('click', function () { avisoColar.hidden = true; pendente = null; substituirSistema(nAtual, exemplo(nAtual), 'exemplo'); abas.gauss.executar(); });
  $('#aleatorio-gauss').addEventListener('click', function () { avisoColar.hidden = true; pendente = null; substituirSistema(nAtual, gerar(nAtual), 'aleatório, solução inteira'); abas.gauss.executar(); });
  $('#limpar-gauss').addEventListener('click', function () { fecharConfirmacaoN(); avisoColar.hidden = true; pendente = null; origem = ''; zerarAcervo(); montarEntrada(nAtual, null); $('#msg-gauss').innerHTML = ''; abas.gauss.marcarDesatualizado(true); var p = $(INPUTS); (p || $('#colar-gauss')).focus(); });
  /* Colar A e b (separados ou aumentada): valida contra o n escolhido; nunca muda n sozinho */
  var painelColar = $('#painel-colar'), avisoColar = $('#aviso-colar'), pendente = null;
  function modoColar() { return (formG.querySelector('[name=modo-colar]:checked') || {}).value || 'separado'; }
  function areaAtiva() { return modoColar() === 'aumentada' ? $('#texto-colar') : $('#texto-colar-a'); }
  function limparInvalidas() { ['#texto-colar', '#texto-colar-a', '#texto-colar-b'].forEach(function (s) { var t = $(s); t.removeAttribute('aria-invalid'); t.removeAttribute('aria-describedby'); }); }
  function mostrarColar(abrir) { painelColar.hidden = !abrir; $('#colar-gauss').setAttribute('aria-expanded', String(abrir)); avisoColar.hidden = true; pendente = null; limparInvalidas(); if (abrir) areaAtiva().focus(); }
  formG.querySelectorAll('[name=modo-colar]').forEach(function (r) { r.addEventListener('change', function () { var aum = modoColar() === 'aumentada'; $('#colar-aumentada').hidden = !aum; $('#colar-separado').hidden = aum; avisoColar.hidden = true; limparInvalidas(); }); });
  $('#colar-gauss').addEventListener('click', function () { mostrarColar(painelColar.hidden); });
  $('#cancelar-colar').addEventListener('click', function () { mostrarColar(false); $('#colar-gauss').focus(); });
  function aumentar(A, b) { return A.map(function (l, i) { return l.concat([b[i]]); }); }
  /* Aumentada: Metodos.lerMatrizTexto (fallback provisório). Normaliza para {ok, n, M, erro, campo}. */
  function lerAumentada(t) {
    if (typeof M_.lerMatrizTexto !== 'function') { var q = window.Visual.provisorio.lerMatrizTexto(t); q.campo = 'aumentada'; return q; }
    var r = M_.lerMatrizTexto(t) || {}, o = { linhas: r.linhas, colunas: r.colunas, erro: r.erro, codigoErro: r.codigoErro, campo: 'aumentada' };
    if (r.erro) { o.ok = false; return o; }
    if (!r.b) { o.ok = false; o.erro = 'Colado ' + r.linhas + '×' + r.colunas + ': isso é só a matriz A, sem b. Em "Aumentada [A | b]" cada linha precisa de n + 1 valores; para colar A e b separados, escolha "A e b separados".'; return o; }
    o.ok = true; o.n = r.linhas; o.M = r.matriz; return o;
  }
  /* Separados: Metodos.lerSistemaTexto(textoA, textoB) → {A, b, n, erro, codigoErro, campo, linha, coluna} */
  function lerSeparado(tA, tB) {
    var r;
    if (typeof M_.lerSistemaTexto === 'function') r = M_.lerSistemaTexto(tA, tB) || {};
    else { var a = typeof M_.lerMatrizTexto === 'function' ? M_.lerMatrizTexto(tA) : {}, v = GE.lerVetor(tB);
      r = a.erro ? { erro: a.erro, campo: 'A' } : (a.b ? { erro: 'A precisa ser quadrada (n×n); recebi ' + a.linhas + '×' + a.colunas + '.', campo: 'A' } : v.erro ? { erro: v.erro, campo: 'b' } : v.valores.length !== a.linhas ? { erro: 'A é ' + a.linhas + '×' + a.linhas + ', então b precisa ter ' + a.linhas + ' valores; encontrei ' + v.valores.length, campo: 'b' } : { A: a.matriz, b: v.valores, n: a.linhas }); }
    if (r.erro || !r.A) return { ok: false, erro: r.erro || 'Não foi possível ler A e b.', campo: r.campo || 'A', linha: r.linha, coluna: r.coluna };
    return { ok: true, n: r.n || r.A.length, M: aumentar(r.A, r.b) };
  }
  function carregarColado(r) { substituirSistema(r.n, r.M, 'colados'); mostrarColar(false); abas.gauss.executar(); }
  $('#carregar-colar').addEventListener('click', function () {
    var aum = modoColar() === 'aumentada', r = aum ? lerAumentada($('#texto-colar').value) : lerSeparado($('#texto-colar-a').value, $('#texto-colar-b').value);
    limparInvalidas(); avisoColar.hidden = false;
    if (!r.ok) {
      var alvo = r.campo === 'b' ? $('#texto-colar-b') : r.campo === 'A' ? $('#texto-colar-a') : $('#texto-colar');
      var pos = r.linha ? ' (' + (r.campo === 'b' ? 'b' : r.campo === 'A' ? 'A' : 'texto') + ', linha ' + r.linha + (r.coluna ? ', coluna ' + r.coluna : '') + ')' : '';
      var msg = r.erro.replace(/\.?$/, '') + (pos && r.erro.indexOf('linha ' + r.linha) < 0 ? pos : '') + '.';
      if (aum && !/não é um número|limite prático|só a matriz A/.test(msg)) msg += ' Para n = ' + nAtual + ', cole ' + nAtual + ' linhas com ' + (nAtual + 1) + ' valores.';
      avisoColar.className = 'aviso-colar toast toast--erro'; avisoColar.innerHTML = '<p class="toast__texto">' + esc(window.Visual.br(msg)) + '</p>';
      alvo.setAttribute('aria-invalid', 'true'); alvo.setAttribute('aria-describedby', 'aviso-colar'); alvo.focus(); return;
    }
    if (r.n !== nAtual) {
      pendente = r; avisoColar.className = 'aviso-colar toast toast--aviso';
      avisoColar.innerHTML = '<p class="toast__texto">' + (aum ? 'A colada é ' + r.n + '×' + r.n + ' e b tem ' + r.n + ' valores' : 'A colada é ' + r.n + '×' + r.n) + ', mas n = ' + nAtual + '. Ajustar n para ' + r.n + '?</p><div class="acoes"><button type="button" class="btn btn--primario" id="ajustar-n">Ajustar n para ' + r.n + '</button><button type="button" class="btn btn--secundario" id="cancelar-ajuste">Cancelar</button></div>';
      $('#ajustar-n').addEventListener('click', function () { carregarColado(pendente); });
      $('#cancelar-ajuste').addEventListener('click', function () { avisoColar.hidden = true; pendente = null; areaAtiva().focus(); });
      $('#ajustar-n').focus(); return;
    }
    carregarColado(r);
  });
  window.Visual.gaussIndicarRolagem = indicarRolagem;
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { caberEntrada(); indicarRolagem(); });
  montarEntrada(3, exemplo(3), 'exemplo');

  /* Abas */
  var executadas = {};
  function abrir(nome) {
    document.querySelectorAll('.aba').forEach(function (b) { var at = b.dataset.aba === nome; b.setAttribute('aria-selected', String(at)); b.tabIndex = at ? 0 : -1; if (at && b.scrollIntoView) b.scrollIntoView({ block: 'nearest', inline: 'nearest' }); });
    document.querySelectorAll('.painel').forEach(function (p) { p.hidden = p.id !== 'painel-' + nome; });
    Object.keys(abas).forEach(function (k) { if (k !== nome) abas[k].player.pausar(); });
    if (!executadas[nome]) { executadas[nome] = true; abas[nome].executar(); }
    else window.dispatchEvent(new Event('resize'));
    if (location.hash !== '#' + nome) history.replaceState(null, '', '#' + nome);
  }
  document.querySelector('.abas').addEventListener('click', function (e) { var b = e.target.closest('.aba'); if (b) abrir(b.dataset.aba); });
  /* roving tabindex: ←/→ (circular), Home/End movem o foco e ativam a aba */
  document.querySelector('.abas').addEventListener('keydown', function (e) {
    var lista = Array.prototype.slice.call(document.querySelectorAll('.aba')), i = lista.indexOf(e.target), n = lista.length, j;
    if (i < 0) return;
    if (e.key === 'ArrowRight') j = (i + 1) % n; else if (e.key === 'ArrowLeft') j = (i - 1 + n) % n;
    else if (e.key === 'Home') j = 0; else if (e.key === 'End') j = n - 1; else return;
    e.preventDefault(); lista[j].focus(); abrir(lista[j].dataset.aba);
  });
  abrir(abas[location.hash.slice(1)] ? location.hash.slice(1) : 'bisseccao');
})();
