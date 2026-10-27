/* Camada fina entre o formulário e o núcleo do Matemático Numérico.
   Toda validação/compilação/diagnóstico fica em Metodos.executar.* (js/metodos/validacao.js).
   Aqui só: chamar executar, normalizar os passos (Visual.normalizar) e repassar avisos/códigos. */
(function (g) {
  'use strict';
  var V = g.Visual = g.Visual || {};
  function chamar(metodo, params) {
    var ex = g.Metodos && g.Metodos.executar && g.Metodos.executar[metodo];
    if (!ex) return { passos: [], resultado: null, erro: 'Núcleo numérico não carregado (Metodos.executar.' + metodo + ').', codigoErro: 'ERRO_INTERNO', avisos: [] };
    var bruto;
    try { bruto = ex(params); } catch (e) { bruto = { passos: [], resultado: null, erro: 'Erro interno: ' + (e.mensagem || e.message), codigoErro: 'ERRO_INTERNO', avisos: [] }; }
    var r = V.normalizar(metodo, bruto, V.chamar.compilar(params.f));
    r.codigoErro = bruto.codigoErro || null;
    r.avisos = (bruto.avisos || []).slice();
    r.codigosAviso = (bruto.codigosAviso || (bruto.resultado && bruto.resultado.codigosAviso) || []).slice();
    return r;
  }
  /* ── Critério de parada (absoluto tol | relativo ε) — ÚNICO lugar do mapeamento com o núcleo. ──
     Formato publicado pelo Matemático (js/metodos/comum.js testeParada, validacao.js parametrosIterativos):
     parâmetro `criterio: 'relativo' (padrão) | 'absoluto'`, sempre passado explicitamente; passo.erroCriterio / passo.criterio / passo.criterioFallback;
     resultado.criterio; marcador de etapa `criterioParada`; aviso CRITERIO_RELATIVO_PERTO_DE_ZERO. */
  var CRIT = V.criterio = {
    param: 'criterio', campoErro: 'erroCriterio', etapa: 'criterioParada', codigoPertoZero: 'CRITERIO_RELATIVO_PERTO_DE_ZERO',
    formula: { bisseccao: { absoluto: '(b − a)/2 < tol', relativo: '|cₖ − cₖ₋₁|/|cₖ| < ε' }, newton: { absoluto: '|xₖ₊₁ − xₖ| < tol', relativo: '|xₖ₊₁ − xₖ|/|xₖ₊₁| < ε' } }
  };
  function iterativo(metodo, p) {
    var modo = p.criterio === 'absoluto' ? 'absoluto' : 'relativo', q = Object.assign({}, p); q[CRIT.param] = modo;
    var r = chamar(metodo, q);
    r.criterio = (r.resultado && r.resultado.criterio) || modo;
    r.passos.forEach(function (s) { if (!s.criterio) s.criterio = r.criterio; });
    return r;
  }
  V.chamar = {
    bisseccao: function (p) { return iterativo('bisseccao', p); },
    newton: function (p) { return iterativo('newton', p); },
    /* Gauss: n ≤ 10 → passos por operação; n > 10 → por coluna (contrato docs/contrato-etapas.md).
       Usa Metodos.executar.gauss(A, b, {granularidade, pivoteamento}); a granularidade efetiva vem em resultado.granularidade. */
    gauss: function (p) {
      var M = p.matriz || [], n = M.length, gran = n > 10 ? 'coluna' : 'operacao', ex = g.Metodos && g.Metodos.executar && g.Metodos.executar.gauss;
      if (ex && ex.length >= 2) {
        var A = M.map(function (l) { return l.slice(0, n); }), b = M.map(function (l) { return l[n]; }), bruto;
        try { bruto = ex(A, b, { granularidade: gran, pivoteamento: V.pivo ? V.pivo.paraNucleo(p.pivoteamento) : p.pivoteamento }); } catch (e) { bruto = { passos: [], erro: 'Erro interno: ' + e.message, codigoErro: 'ERRO_INTERNO' }; }
        var r = V.normalizar('gauss', bruto); r.codigoErro = bruto.codigoErro || null; r.avisos = (bruto.avisos || []).slice(); r.codigosAviso = (bruto.codigosAviso || []).slice(); r.modoPivo = p.pivoteamento; if (!r.resultado && bruto.comparacao) r.resultado = { comparacao: bruto.comparacao }; return r;
      }
      var r2 = chamar('gauss', { matriz: p.matriz, pivoteamento: V.pivo ? V.pivo.paraNucleo(p.pivoteamento) : p.pivoteamento }); r2.modoPivo = p.pivoteamento; return r2; // núcleo antigo (só n ≤ 20); nunca força 'operacao' para n grande
    },
    /* Só para desenhar a curva no gráfico (nunca para calcular). */
    compilar: function (s) { try { return g.Expressao.compilar(String(s)); } catch (e) { return function () { return NaN; }; } }
  };
})(window);
