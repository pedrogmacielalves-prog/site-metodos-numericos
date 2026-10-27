/* Eliminação de Gauss com substituição regressiva. Validação e mensagens ficam em validacao.js. */
(function (g) {
  'use strict';
  const Metodos = g.Metodos = g.Metodos || {};

  /**
   * Escolhe a linha do pivô da coluna k conforme o modo:
   * 'sempre' (parcial clássico), 'automatico' ou 'nunca'.
   * Devolve { linha, tipo, motivo, pequeno }.
   */
  Metodos.escolherPivo = function escolherPivo(M, k, modo) {
    const m = Metodos.linhaDoMaiorPivo(M, k); // maior |a_ik|
    const pivo = Math.abs(M[k][k]);
    const maior = Math.abs(M[m][k]);
    // Zero numérico: |pivô| ≤ n·ε·max|a_ik| (ε da máquina).
    const zero = pivo <= M.length * Number.EPSILON * maior;
    // Pivô pequeno: o fator l_ik = a_ik/pivô passaria de 10.
    const pequeno = pivo < 0.1 * maior;
    // @etapa:trocaClassica — modo 'sempre': vai o maior |a_ik|
    if (m !== k && modo === 'sempre') {
      return { linha: m, tipo: 'classica',
        motivo: 'maior_modulo', pequeno };
    }
    const auto = m !== k && modo === 'automatico';
    // @etapa:trocaObrigatoria — pivô zero: trocar é obrigatório
    if (auto && zero) {
      return { linha: m, tipo: 'obrigatoria',
        motivo: 'pivo_zero', pequeno };
    }
    // @etapa:trocaRecomendada — pivô pequeno: trocar é recomendado
    if (auto && pequeno) {
      return { linha: m, tipo: 'recomendada',
        motivo: 'pivo_pequeno', pequeno };
    }
    // @etapa:pivoOk — pivô adequado (ou modo 'nunca'): sem troca
    return { linha: k, tipo: null, motivo: null, pequeno };
  };

  /**
   * Resolve A·x = b por eliminação de Gauss.
   * modoPivo: 'automatico', 'sempre' ou 'nunca' (troca de linhas).
   * modo: 'operacao' (um passo por operação) ou 'coluna' (um por
   * coluna de pivô; economiza memória em matrizes grandes).
   * Devolve { passos, x, motivo }.
   */
  Metodos.gauss = function gauss(A, b, modoPivo = 'automatico',
    modo = 'operacao') {
    const n = A.length;
    const M = A.map((linha, i) => [...linha, b[i]]); // [A | b]
    const tolPivo = Metodos.toleranciaPivo(A);
    const passos = [];
    // Guarda cada passo (com foto da matriz) para a animação.
    const registrar = Metodos.registrador(passos, M, modo);

    registrar('inicio', {}); // @etapa:inicio — monta [A | b]

    // ETAPA 1: zerar abaixo da diagonal, coluna por coluna.
    for (let k = 0; k < n; k++) {
      // Pré-condição: coluna k ≤ n·ε·max|a| da diagonal para baixo ⇒
      // matriz singular, sem solução única (em qualquer modo).
      const maior = M[Metodos.linhaDoMaiorPivo(M, k)][k];
      if (Math.abs(maior) <= tolPivo) {
        const motivo = 'MATRIZ_SINGULAR';
        return { passos, x: null, motivo, coluna: k };
      }
      const escolha = Metodos.escolherPivo(M, k, modoPivo);
      const p = escolha.linha;
      // Modo 'nunca' com pivô zero: não dá para dividir por ele.
      if (M[p][k] === 0 || !Number.isFinite(M[p][k])) {
        const motivo = 'PIVO_ZERO_SEM_TROCA';
        return { passos, x: null, motivo, coluna: k };
      }
      // troca = null ou { tipo, motivo, de, para, valores... }
      const info = Metodos.descreverTroca(M, k, escolha);
      if (p !== k) {
        [M[k], M[p]] = [M[p], M[k]]; // @etapa:trocaLinhas — troca
        const novoPivo = { linha: k, coluna: k, valor: M[k][k],
          ...info };
        registrar('troca', { linhas: [k, p], pivo: novoPivo },
          { k, p, troca: info.troca });
      }
      // @etapa:pivo — o pivô é o elemento da diagonal M[k][k]
      const pivo = { linha: k, coluna: k, valor: M[k][k], ...info };
      const valor = pivo.valor;
      registrar('pivo', { pivo, linhaPivo: k }, { k, valor });

      for (let i = k + 1; i < n; i++) {
        // @etapa:eliminacao — Li ← Li − fator·Lk zera M[i][k]
        const fator = M[i][k] / M[k][k];
        for (let j = k; j <= n; j++) M[i][j] -= fator * M[k][j];
        M[i][k] = 0; // zera exatamente (sem resto de arredondamento)
        const campos = { pivo, linhaAlvo: i, linhaPivo: k, fator };
        registrar('eliminacao', campos, { i, k, fator });
      }
    }

    // ETAPA 2: substituição regressiva (da última linha à primeira).
    const x = new Array(n).fill(null);
    for (let i = n - 1; i >= 0; i--) {
      let soma = M[i][n];
      for (let j = i + 1; j < n; j++) soma -= M[i][j] * x[j];
      x[i] = soma / M[i][i]; // @etapa:substituicao — isola x[i]
      registrar('substituicao',
        { indice: i, linhaAlvo: i, x: x.slice() },
        { i, bi: M[i][n], aii: M[i][i], xi: x[i] });
    }
    registrar('fim', { x: x.slice() }); // @etapa:fim — solução pronta
    return { passos, x, motivo: 'SOLUCAO_UNICA' };
  };
})(typeof window !== 'undefined' ? window : globalThis);
