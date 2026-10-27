/* Utilidades pequenas usadas pelos métodos (formatação e matrizes).
   Carregar ANTES de bisseccao.js, newton.js e gauss.js. */
(function (g) {
  'use strict';
  const Metodos = g.Metodos = g.Metodos || {};

  /** Formata um número com 6 algarismos significativos, sem "lixo" de ponto flutuante. */
  Metodos.fmt = function (v) {
    if (typeof v !== 'number' || !Number.isFinite(v)) return String(v);
    if (v === 0) return '0'; // números minúsculos (ex.: pivô 1e−17) aparecem como são
    // Mesmo formato da UI (Visual.extremo/fmtE): |v| ≥ 1e6 ou |v| < 1e−4 ⇒
    // notação científica com 4 algarismos (1.000e+17; fmtBR → 1,000e+17).
    if (Metodos.extremo(v)) return v.toExponential(3);
    return String(Number(v.toPrecision(6)));
  };
  Metodos.extremo = (v) => v !== 0 && Number.isFinite(v) && (Math.abs(v) >= 1e6 || Math.abs(v) < 1e-4);
  /** d algarismos significativos; extremos em notação científica (d algarismos na mantissa). */
  Metodos.fmtSig = function (v, d) {
    if (!Number.isFinite(v) || v === 0) return String(v);
    return Metodos.extremo(v) ? v.toExponential(d - 1) : String(Number(v.toPrecision(d)));
  };
  /**
   * Formata dois números comparados (a > b) em fmtBR com algarismos suficientes para
   * que não pareçam iguais: 6 por padrão, até 17 (ex.: 0,0833333 vs 0,0833333 →
   * 0,08333333333333333 vs 0,08333333333333331). Devolve [textoA, textoB].
   */
  Metodos.fmtPar = function (a, b) {
    const br = (t) => t.replace(/\./g, ',').replace(/-/g, '−');
    let d = Metodos.extremo(a) || Metodos.extremo(b) ? 4 : 6;
    while (d < 17 && a !== b && Metodos.fmtSig(a, d) === Metodos.fmtSig(b, d)) d++;
    return [br(Metodos.fmtSig(a, d)), br(Metodos.fmtSig(b, d))];
  };

  /**
   * Como fmt, mas no padrão brasileiro, usado em TODO texto gerado pelo núcleo:
   * vírgula decimal e sinal de menos "−" (ex.: −0,72; 1,5e−7). Listas de números
   * nesses textos são separadas por "; " para não confundir com a vírgula decimal.
   */
  Metodos.fmtBR = function (v) {
    return Metodos.fmt(v).replace(/\./g, ',').replace(/-/g, '−');
  };

  /** Erro relativo |erro| / |valor|; se o valor for ~0, devolve o próprio erro (evita dividir por zero). */
  Metodos.erroRelativo = function (erro, valor) {
    return Math.abs(valor) < 1e-12 ? Math.abs(erro) : Math.abs(erro / valor);
  };

  /**
   * Teste de parada da Bissecção e do Newton (contrato §19).
   * 'absoluto': erro = erroAbs ((b − a)/2 na bissecção, |Δx| no Newton).
   * 'relativo' (padrão): erro = |x_{k+1} − x_k| / |x_{k+1}|; sem anterior (1ª iteração da
   * bissecção) o erro é indefinido (null) e não para. Se |x_{k+1}| < LIMIAR_ZERO (1e−12),
   * não divide: usa |x_{k+1} − x_k| (absoluto) e marca fallback = true.
   * Parada com desigualdade estrita: erro < tol.
   */
  Metodos.LIMIAR_ZERO_RELATIVO = 1e-12;
  // Limiar FIXO (BUG-32): o critério não muda por causa do tamanho de x.
  // Raiz múltipla em 0 no relativo é diagnosticada em validacao.js (RAIZ_EM_ZERO_CRITERIO_RELATIVO).
  Metodos.testeParada = function (criterio, novo, anterior, erroAbs, tol) {
    if (criterio === 'absoluto') return { criterio: 'absoluto', erro: erroAbs, parou: erroAbs < tol, fallback: false };
    if (anterior == null) return { criterio: 'relativo', erro: null, parou: false, fallback: false };
    const d = Math.abs(novo - anterior);
    if (Math.abs(novo) < Metodos.LIMIAR_ZERO_RELATIVO) return { criterio: 'relativo', erro: d, parou: d < tol, fallback: true };
    const e = d / Math.abs(novo);
    return { criterio: 'relativo', erro: e, parou: e < tol, fallback: false };
  };
  /** Texto do critério usado num passo, ex.: "|cₖ − cₖ₋₁|/|cₖ| = 3,2e−5 < ε". */
  Metodos.textos_criterio = function (crit, simbolo) {
    const F = Metodos.fmtBR;
    if (crit.criterio === 'absoluto') return simbolo === 'c' ? `(b − a)/2 = ${F(crit.erro)}` : `|Δx| = ${F(crit.erro)}`;
    if (crit.erro == null) return 'erro relativo: — na 1ª iteração, sem ponto médio anterior';
    if (crit.fallback) return `|${simbolo}| ≈ 0: usei o erro absoluto |Δ${simbolo}| = ${F(crit.erro)}`;
    return `erro relativo |Δ${simbolo}|/|${simbolo}| = ${F(crit.erro)}`;
  };

  /** Cópia profunda de uma matriz. */
  // Contador de cópias de matriz (diagnóstico de memória; zere à vontade).
  Metodos.copiasDeMatriz = 0;
  Metodos.copiarMatriz = function (M) {
    Metodos.copiasDeMatriz++;
    return M.map(function (linha) { return linha.slice(); });
  };

  // Etapas (marcadores @etapa) de cada passo do Gauss: decisão de pivô (em escolherPivo),
  // troca efetiva das linhas (trocaLinhas, em gauss) e as ações de gauss.
  const DECISAO = { classica: 'trocaClassica', obrigatoria: 'trocaObrigatoria', recomendada: 'trocaRecomendada' };
  Metodos.etapasGauss = function (tipo, pivo, comEliminacao) {
    const decisao = pivo && pivo.troca ? DECISAO[pivo.troca.tipo] : 'pivoOk';
    const troca = pivo && pivo.troca ? ['trocaLinhas'] : [];
    if (tipo === 'troca') return { etapa: 'trocaLinhas', etapas: [decisao, 'trocaLinhas'] };
    if (tipo === 'pivo') return { etapa: 'pivo', etapas: [decisao, ...troca, 'pivo'] };
    if (tipo === 'coluna') {
      const etapas = [decisao, ...troca, 'pivo', ...(comEliminacao ? ['eliminacao'] : [])];
      return { etapa: comEliminacao ? 'eliminacao' : 'pivo', etapas };
    }
    return { etapa: tipo, etapas: [tipo] };
  };

  const faseDe = (tipo) => (tipo === 'substituicao' || tipo === 'fim' ? 'substituicao' : 'eliminacao');

  /**
   * Cria a função registrar(tipo, campos, dados) usada por Metodos.gauss.
   * - modo 'operacao': um passo por operação, cada um com cópia da matriz.
   * - modo 'coluna': um passo por coluna de pivô; guarda só pivô/troca/fatores e
   *   copia a matriz UMA vez, ao fim da coluna (n + 3 cópias no total).
   */
  Metodos.registrador = function (passos, M, modo) {
    const n = M.length;
    if (modo !== 'coluna') {
      return function (tipo, campos, dados) {
        passos.push(Object.assign({ tipo }, campos, Metodos.etapasGauss(tipo, campos.pivo), {
          fase: faseDe(tipo),
          descricao: Metodos.textos.gauss(tipo, dados || campos),
          matriz: Metodos.copiarMatriz(M),
        }));
      };
    }
    let coluna = null;
    const fecharColuna = function () {
      coluna.matriz = Metodos.copiarMatriz(M);
      coluna.descricao = Metodos.textos.gauss('coluna', coluna);
      Object.assign(coluna, Metodos.etapasGauss('coluna', coluna.pivo, coluna.fatores.length > 0));
      passos.push(coluna);
      coluna = null;
    };
    return function (tipo, campos, dados) {
      if (tipo === 'troca' || tipo === 'pivo') {
        const k = campos.pivo.coluna;
        if (!coluna) coluna = { tipo: 'coluna', etapa: 'eliminacao', fase: 'eliminacao', k, troca: null, fatores: [] };
        if (tipo === 'troca') coluna.troca = [campos.linhas[1], campos.linhas[0]];
        coluna.pivo = campos.pivo;
        coluna.linhaPivo = k;
        if (tipo === 'pivo' && k === n - 1) fecharColuna(); // última coluna: nada a eliminar
      } else if (tipo === 'eliminacao') {
        coluna.fatores.push({ linha: campos.linhaAlvo, fator: campos.fator });
        if (campos.linhaAlvo === n - 1) fecharColuna(); // última linha da coluna
      } else if (tipo === 'substituicao') {
        if (campos.indice !== 0) return; // só o passo final, com o x completo
        passos.push(Object.assign({ tipo }, campos, { etapa: 'substituicao', etapas: ['substituicao'] }, {
          fase: 'substituicao', matriz: Metodos.copiarMatriz(M),
          descricao: `Substituição regressiva: x${n} até x1 calculados de baixo para cima.`,
        }));
      } else {
        passos.push(Object.assign({ tipo }, campos, Metodos.etapasGauss(tipo), {
          fase: faseDe(tipo), descricao: Metodos.textos.gauss(tipo, dados || campos), matriz: Metodos.copiarMatriz(M),
        }));
      }
    };
  };

  /** Pivoteamento parcial: índice da linha (de k para baixo) com o maior |M[i][k]|. */
  Metodos.linhaDoMaiorPivo = function (M, k) {
    let melhor = k;
    for (let i = k + 1; i < M.length; i++) {
      if (Math.abs(M[i][k]) > Math.abs(M[melhor][k])) melhor = i;
    }
    return melhor;
  };

  /**
   * Monta a decisão de pivô da coluna k (antes da troca) a partir de Metodos.escolherPivo:
   * { troca: null | { tipo, motivo, descricao, de, para, valorOriginal, valorNovo },
   *   decisao: 'troca' | 'sem_troca', pequeno }.
   */
  Metodos.descreverTroca = function (M, k, escolha) {
    if (!escolha.tipo) return { troca: null, decisao: 'sem_troca', pequeno: escolha.pequeno };
    const p = escolha.linha, f = Metodos.fmtBR;
    const original = M[k][k], novo = M[p][k];
    const [tNovo, tOrig] = Metodos.fmtPar(Math.abs(novo), Math.abs(original));
    const textos = {
      pivo_zero: `pivô a${k + 1}${k + 1} = ${f(original)} é zero numérico: troca obrigatória com L${p + 1} (|a| = ${f(Math.abs(novo))})`,
      pivo_pequeno: `|pivô| = ${tOrig} < 0,1·${tNovo}: troca recomendada com L${p + 1} (fatores ficariam > 10)`,
      maior_modulo: `pivoteamento parcial: L${p + 1} tem o maior |a| da coluna (${tNovo} > ${tOrig})`,
    };
    return {
      troca: { tipo: escolha.tipo, motivo: escolha.motivo, descricao: textos[escolha.motivo], de: p, para: k, valorOriginal: original, valorNovo: novo },
      decisao: 'troca', pequeno: escolha.pequeno,
    };
  };

  /** Tolerância para considerar um pivô "zero", relativa ao tamanho dos números da matriz. */
  Metodos.toleranciaPivo = function (M) {
    let maior = 0;
    M.forEach(function (linha) { linha.forEach(function (v) { maior = Math.max(maior, Math.abs(v)); }); });
    // Relativa à escala da matriz original: n·ε·max|a_ij| (coerente com escolherPivo).
    return M.length * Number.EPSILON * (maior || 1);
  };

  // Textos curtos exibidos em cada passo (campo "descricao").
  // Ficam aqui para a função principal mostrar só a matemática.
  const fmt = (v) => Metodos.fmtBR(v);
  Metodos.textos = {
    bisseccao: function (manter, parou, crit) {
      if (manter === 'raiz') return 'f(c) = 0: raiz exata encontrada.';
      if (parou) {
        if (!crit || crit.criterio === 'absoluto') return '(b − a)/2 < tolerância: critério atingido, raiz ≈ c.';
        return `${Metodos.textos_criterio(crit, 'c')} < ε: critério relativo atingido, raiz ≈ c.`;
      }
      const lado = manter === 'esquerda' ? 'f(a)·f(c) < 0 → raiz em [a, c]; b ← c' : 'f(a)·f(c) > 0 → raiz em [c, b]; a ← c';
      return crit && crit.criterio === 'relativo' ? `${lado} (${Metodos.textos_criterio(crit, 'c')})` : lado;
    },
    newton: function (k, x, fx, dfx, xNovo, crit, parou) {
      const base = `x${k + 1} = x${k} − f(x${k})/f'(x${k}) = ${fmt(x)} − (${fmt(fx)})/(${fmt(dfx)}) = ${fmt(xNovo)}`;
      if (!crit || crit.criterio === 'absoluto') return base;
      return `${base}; ${Metodos.textos_criterio(crit, 'x')} ${parou ? '< ε: critério relativo atingido' : '≥ ε'}`;
    },
    gauss: function (tipo, d) {
      switch (tipo) {
        case 'inicio': return 'Matriz aumentada inicial [A | b].';
        case 'troca': return `L${d.k + 1} ↔ L${d.p + 1}: ${d.troca.descricao}`;
        case 'pivo': return `Pivô a${d.k + 1}${d.k + 1} = ${fmt(d.valor)}`;
        case 'eliminacao': return `L${d.i + 1} ← L${d.i + 1} − (${fmt(d.fator)})·L${d.k + 1}`;
        case 'substituicao': return `x${d.i + 1} = (${fmt(d.bi)} − Σ a${d.i + 1}j·xj) / ${fmt(d.aii)} = ${fmt(d.xi)}`;
        case 'coluna': return `Coluna ${d.k + 1}: ` + (d.troca ? `L${d.k + 1} ↔ L${d.troca[0] + 1}; ` : '') +
          `pivô ${fmt(d.pivo.valor)}; ${d.fatores.length} linha(s) zerada(s) abaixo dele.`;
        case 'fim': return 'Solução: ' + d.x.map((v, i) => `x${i + 1} = ${fmt(v)}`).join('; ');
      }
      return '';
    },
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Metodos;
})(typeof window !== 'undefined' ? window : globalThis);
