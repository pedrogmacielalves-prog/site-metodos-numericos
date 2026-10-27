/* Método da Bissecção. Validação e mensagens de erro ficam em validacao.js. */
(function (g) {
  'use strict';
  const Metodos = g.Metodos = g.Metodos || {};

  /**
   * Procura uma raiz de f em [a, b], sabendo que f(a) e f(b) têm
   * sinais opostos. Devolve { passos, raiz, convergiu, motivo }.
   */
  Metodos.bisseccao = function bisseccao(f, a, b, tol, maxIter,
    criterio = 'relativo') {
    const passos = [];
    const fim = (convergiu, motivo) => (
      { passos, raiz: c, convergiu, motivo }
    );
    let fa = f(a);
    let fb = f(b);
    let c = null;
    let cAnt = null; // ponto médio anterior (critério relativo)

    // Pré-condição: se f(a) e f(b) têm o mesmo sinal, não há
    // garantia de raiz em [a, b] e o método não se aplica.
    if (fa * fb > 0) return fim(false, 'SEM_TROCA_DE_SINAL');

    for (let k = 1; k <= maxIter; k++) {
      // @etapa:pontoMedio — divide o intervalo ao meio
      c = (a + b) / 2;
      const fc = f(c);

      // A raiz está a no máximo meio intervalo de c: esse é o erro.
      const erro = (b - a) / 2;
      const erroRelativo = Metodos.erroRelativo(erro, c);

      // @etapa:testeSinal — a raiz fica na metade com troca de sinal
      let manter;
      if (fc === 0) manter = 'raiz';
      else if (fa * fc < 0) manter = 'esquerda';
      else manter = 'direita';
      // @etapa:criterioParada — raiz exata ou erro menor que tol
      const crit = Metodos.testeParada(criterio, c, cAnt, erro, tol);
      const parou = fc === 0 || crit.parou;
      const etapas = ['pontoMedio', 'testeSinal',
        parou ? 'criterioParada' : 'atualizaIntervalo'];
      passos.push({
        k, a, b, c, fa, fb, fc, erro, erroRelativo, manter,
        criterio: crit.criterio, erroCriterio: crit.erro,
        criterioFallback: crit.fallback,
        etapa: parou ? 'criterioParada' : 'pontoMedio', etapas,
        descricao: Metodos.textos.bisseccao(manter, parou, crit),
      });
      if (fc === 0) return fim(true, 'RAIZ_EXATA');
      if (crit.parou) return fim(true, 'TOLERANCIA');
      cAnt = c;
      // @etapa:atualizaIntervalo — fica a metade que contém a raiz
      if (manter === 'esquerda') {
        b = c;
        fb = fc;
      } else {
        a = c;
        fa = fc;
      }
    }
    return fim(false, 'MAX_ITERACOES');
  };
})(typeof window !== 'undefined' ? window : globalThis);
