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

    // Avalia f sem interromper o método: um erro na avaliação vira NaN.
    const avaliar = (t) => {
      try { return f(t); } catch (e) { return NaN; }
    };
    // f no ponto atual; depois de cada passo recebe f(xNovo), já calculado.
    let fx = avaliar(x);

    // Divergência: x se afastou demais do chute inicial.
    const limite = 1e6 * Math.max(1, Math.abs(x0));

    for (let k = 0; k < maxIter; k++) {
      // @etapa:avaliaDerivada — inclinação da tangente em x
      const dfx = df(x);

      // f(x) = 0 em precisão dupla: parada observada, antes de chamar isso de divergência.
      if (fx === 0) return fim(true, 'ZERO_PRECISAO_DUPLA');
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
      // O candidato recém-calculado é visto antes de esgotar o limite de passos.
      let fNovo = NaN;
      if (Number.isFinite(xNovo)) fNovo = avaliar(xNovo);
      const zeroNovo = fNovo === 0;
      const parou = crit.parou || zeroNovo;
      const etapas = ['avaliaDerivada', 'passoNewton'];
      if (parou) etapas.push('criterioParada');
      const descricao = zeroNovo
        ? Metodos.textos.newton(k, x, fx, dfx, xNovo, crit, false) + ' f no candidato vale 0 em precisão dupla: zero observado, não certificação matemática.'
        : Metodos.textos.newton(k, x, fx, dfx, xNovo, crit, crit.parou);
      passos.push({
        k, x, fx, dfx, xNovo, erro, erroRelativo, etapas,
        criterio: crit.criterio, erroCriterio: crit.erro,
        criterioFallback: crit.fallback,
        etapa: parou ? 'criterioParada' : 'passoNewton',
        tangente: { inclinacao: dfx, intercepto: fx - dfx * x },
        fNovo, descricao,
      });

      x = xNovo;
      fx = fNovo;
      if (!Number.isFinite(xNovo)) return fim(false, 'DIVERGENCIA');
      if (!Number.isFinite(fNovo)) return fim(false, 'FUNCAO_NAO_DEFINIDA');
      if (zeroNovo) return fim(true, 'ZERO_PRECISAO_DUPLA');
      if (crit.parou) return fim(true, 'TOLERANCIA');
    }
    return fim(false, 'MAX_ITERACOES');
  };
})(typeof window !== 'undefined' ? window : globalThis);
