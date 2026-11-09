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

      // Raiz exata antes do limite de divergência (x = −1e20 pode ser a raiz).
      if (fx === 0) return fim(true, 'RAIZ_EXATA');
      // f não finita não é tangente horizontal.
      if (!Number.isFinite(fx)) return fim(false, 'FUNCAO_NAO_DEFINIDA');

      // 1º) Divergência: x "explodiu" (ou deixou de ser número).
      const explodiu = !Number.isFinite(x) || Math.abs(x) > limite;
      if (explodiu) return fim(false, 'DIVERGENCIA');

      // 2º) f' infinita (explode) é outro caso que f' = 0.
      if (!Number.isFinite(dfx)) return fim(false, 'DERIVADA_NAO_FINITA');
      // Tangente horizontal só se o passo não existe. f' = 1 com f = 1e20
      // ainda dá um passo finito; f' = 1e−20·(x−1) também.
      if (dfx === 0 || !Number.isFinite(fx / dfx)) return fim(false, 'DERIVADA_ZERO');

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
