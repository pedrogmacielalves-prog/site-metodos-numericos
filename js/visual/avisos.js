/* Painel "Avisos" (vantagens, desvantagens, possíveis problemas) na mesma gaveta do "Ver código".
   Conteúdo: Metodos.textos.avisos.<metodo> (js/metodos/avisos.js, do Matemático; formato em docs/contrato-etapas.md §12).
   Marcação: design/INTEGRACAO.md §8. Renderizador tolerante: sem conteúdo → "Conteúdo em preparação".
   Casamento do selo: 1) problema.codigos × (codigoErro + codigosAviso/códigos dos avisos); 2) problema.mensagem × texto;
   3) mapa local código→palavra-chave no título (só se o problema não tem codigos nem mensagem). */
(function (g) {
  'use strict';
  var V = g.Visual = g.Visual || {};
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var PALAVRAS = { DIVERGENCIA: /diverg/i, OSCILACAO: /oscila|ciclo/i, DERIVADA_ZERO: /derivada/i, SEM_TROCA_DE_SINAL: /sinal/i, MATRIZ_SINGULAR: /piv[oô]|singular/i, NAO_CONVERGIU: /n[aã]o converg/i, MAL_CONDICIONADA: /condicion/i };
  var NOME = { bisseccao: 'bis', newton: 'nwt', gauss: 'gau' };
  function conteudo(m) { var t = g.Metodos && g.Metodos.textos && g.Metodos.textos.avisos; return t && t[m] ? t[m] : null; }
  function norm(s) { return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim(); }
  function codigosDo(res) {
    var c = [];
    if (res.codigoErro) c.push(res.codigoErro);
    (res.codigosAviso || []).forEach(function (x) { if (x) c.push(x); });
    (res.avisos || []).forEach(function (a) { if (a && typeof a === 'object' && a.codigo) c.push(a.codigo); });
    return c;
  }
  function textosDo(res) { return [res.erro].concat((res.avisos || []).map(function (a) { return a && typeof a === 'object' ? (a.texto || a.mensagem) : a; })).filter(Boolean).map(norm); }
  function detectar(metodo, res) {
    var c = conteudo(metodo), out = []; if (!c || !res || !Array.isArray(c.problemas)) return out;
    var cods = codigosDo(res), txt = textosDo(res);
    c.problemas.forEach(function (p, i) {
      var tem = Array.isArray(p.codigos) && p.codigos.length, hit = tem && p.codigos.some(function (k) { return cods.indexOf(k) >= 0; });
      if (!hit && p.mensagem) { var m = norm(p.mensagem); hit = txt.some(function (t) { return t.indexOf(m) >= 0 || m.indexOf(t) >= 0; }); }
      if (!hit && !tem && !p.mensagem) hit = cods.some(function (k) { return PALAVRAS[k] && PALAVRAS[k].test(p.titulo || ''); });
      if (hit) out.push(i);
    });
    return out;
  }
  /* códigos só informativos não contam no selo do botão (Designer rev. 2, item 7) */
  var INFORMATIVOS = { MODO_COLUNA: 1, MATRIZ_GRANDE: 1, GRANULARIDADE_COLUNA: 1 };
  function contarProblemas(metodo, res) {
    var c = conteudo(metodo); if (!c) return 0;
    return detectar(metodo, res).filter(function (i) { var p = c.problemas[i], cs = p.codigos || [];
      return !(cs.length && cs.every(function (k) { return INFORMATIVOS[k]; })) && !/grande|modo compacto/i.test(cs.length ? '' : p.titulo || ''); }).length;
  }
  function render(metodo, res) {
    var c = conteudo(metodo);
    if (!c) return '<div class="avisos"><p class="avisos__vazio">Conteúdo em preparação.</p></div>';
    var det = detectar(metodo, res), r = c.resumo || {}, s = NOME[metodo] || metodo, h = '<div class="avisos">';
    function met(rot, v) { return v ? '<span class="aviso-metrica"><span class="aviso-metrica__rotulo">' + rot + '</span><span class="aviso-metrica__valor">' + esc(v) + '</span></span>' : ''; }
    if (r.convergencia || r.custo) h += '<div class="aviso-resumo" role="group" aria-label="Resumo do método">' + met('Convergência', r.convergencia) + met('Custo por iteração', r.custo) + '</div>';
    function sec(tipo, sig, tit, id, corpo) { return '<section class="aviso-secao aviso-secao--' + tipo + '" aria-labelledby="' + id + '"><h3 class="aviso-secao__titulo" id="' + id + '"><span aria-hidden="true">' + sig + '</span> ' + tit + '</h3>' + corpo + '</section>'; }
    function ul(xs) { return '<ul>' + xs.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'; }
    if ((c.vantagens || []).length) h += sec('vantagens', '✓', 'Vantagens', 'av-v-' + s, ul(c.vantagens));
    if ((c.desvantagens || []).length) h += sec('desvantagens', '–', 'Desvantagens', 'av-d-' + s, ul(c.desvantagens));
    if ((c.problemas || []).length) h += sec('problemas', '⚠', 'Possíveis problemas', 'av-p-' + s, '<div class="aviso-lista">' + c.problemas.map(function (p, i) {
      var at = det.indexOf(i) >= 0, faz = p.solucao != null ? p.solucao : p.oQueFazer;
      return '<details class="aviso-item' + (at ? ' is-ativo' : '') + '"' + (at ? ' open' : '') + ' data-problema="' + esc(p.id || 'p' + i) + '"><summary>' +
        (at ? '<span class="aviso-item__selo"><span aria-hidden="true">●</span> No cálculo atual</span>' : '') + esc(p.titulo || 'Problema') + '</summary><div class="aviso-item__corpo">' +
        (p.quando ? '<p class="aviso-item__quando"><strong>Quando acontece</strong>' + esc(p.quando) + '</p>' : '') +
        (faz ? '<p class="aviso-item__fazer"><strong>O que fazer</strong>' + esc(faz) + '</p>' : '') + '</div></details>';
    }).join('') + '</div>');
    return h + '</div>';
  }
  V.avisos = { conteudo: conteudo, detectar: detectar, contar: contarProblemas, render: render };
})(window);
