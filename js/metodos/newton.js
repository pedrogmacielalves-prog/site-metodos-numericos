/* Método de Newton-Raphson. Validação e mensagens de erro ficam em validacao.js. */
(function (g) {
  'use strict';
  const Metodos = g.Metodos = g.Metodos || {};

  /**
   * A partir de x0, segue retas tangentes até chegar perto de uma
   * raiz de f. df é a derivada f'(x).
   * Devolve { passos, raiz, convergiu, motivo }.
   */
  Metodos.newton = function newton(f, df, x0, tol, maxIter,
    criterio = 'relativo') {
    const passos = [];
    let x = x0;
    const fim = (convergiu, motivo) => (
      { passos, raiz: x, convergiu, motivo }
    );

    // Divergência: x se afastou demais do chute inicial.
    const limite = 1e6 * Math.max(1, Math.abs(x0));

    for (let k = 0; k < maxIter; k++) {
      const fx = f(x);
      // @etapa:avaliaDerivada — inclinação da tangente em x
      const dfx = df(x);

      // Se f(x) = 0, já estamos exatamente na raiz.
      if (fx === 0) return fim(true, 'RAIZ_EXATA');

      // 1º) Divergência: x "explodiu" (ou deixou de ser número).
      const explodiu = !Number.isFinite(x) || Math.abs(x) > limite;
      if (explodiu) return fim(false, 'DIVERGENCIA');

      // 2º) Tangente horizontal (f'(x) ≈ 0) nunca cruza o eixo x.
      if (Math.abs(dfx) < 1e-12) return fim(false, 'DERIVADA_ZERO');

      // @etapa:passoNewton — a tangente em x cruza o eixo x em xNovo
      const xNovo = x - fx / dfx;
      const erro = Math.abs(xNovo - x);
      const erroRelativo = Metodos.erroRelativo(erro, xNovo);

      // @etapa:criterioParada — o passo ficou menor que tol?
      const crit = Metodos.testeParada(criterio, xNovo, x, erro, tol);
      const parou = crit.parou;
      const etapas = ['avaliaDerivada', 'passoNewton'];
      if (parou) etapas.push('criterioParada');
      passos.push({
        k, x, fx, dfx, xNovo, erro, erroRelativo, etapas,
        criterio: crit.criterio, erroCriterio: crit.erro,
        criterioFallback: crit.fallback,
        etapa: parou ? 'criterioParada' : 'passoNewton',
        tangente: { inclinacao: dfx, intercepto: fx - dfx * x },
        descricao: Metodos.textos.newton(k, x, fx, dfx, xNovo,
          crit, parou),
      });

      x = xNovo;

      // Paramos quando o erro do critério ficou menor que tol.
      if (parou) return fim(true, 'TOLERANCIA');
    }
    return fim(false, 'MAX_ITERACOES');
  };
})(typeof window !== 'undefined' ? window : globalThis);
