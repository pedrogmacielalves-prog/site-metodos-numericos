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

  /** Pivô utilizável: relativo à escala original da linha, não ao maior número da matriz inteira. */
  Metodos.pivoUtil = function (valor, escala, n) {
    if (!Number.isFinite(valor)) return false;
    const base = escala > 0 ? escala : 1;
    return Math.abs(valor) > n * Number.EPSILON * base;
  };

  /**
   * Estimativa de cond₁(A) = ‖A‖₁·‖A⁻¹‖₁ (Hager/Higham) usando a LU já calculada.
   * PA = LU, com ordem[i] = linha original que está na posição i, mult = multiplicadores
   * na ordem final e U nas colunas 0..n-1 de M. Devolve um número finito ≥ 1, ou null se
   * a conta sair da faixa (não é “infinito = mal condicionada”).
   */
  Metodos.estimarCondicao1 = function (A, M, mult, ordem) {
    const n = A.length;
    if (!M || !mult || !ordem || ordem.length !== n) return null;
    let normaA = 0;
    for (let j = 0; j < n; j++) {
      let s = 0;
      for (let i = 0; i < n; i++) {
        const a = Math.abs(A[i][j]);
        if (!Number.isFinite(a)) return null;
        s += a;
      }
      if (!Number.isFinite(s)) return null;
      if (s > normaA) normaA = s;
    }
    if (!(normaA > 0)) return null;
    function resolver(rhs) {
      const z = new Array(n);
      for (let i = 0; i < n; i++) {
        let s = rhs[ordem[i]];
        for (let k = 0; k < i; k++) s -= mult[i][k] * z[k];
        if (!Number.isFinite(s)) return null;
        z[i] = s;
      }
      const y = new Array(n);
      for (let i = n - 1; i >= 0; i--) {
        let s = z[i];
        for (let k = i + 1; k < n; k++) s -= M[i][k] * y[k];
        const d = M[i][i];
        if (!(d !== 0) || !Number.isFinite(d) || !Number.isFinite(s)) return null;
        y[i] = s / d;
        if (!Number.isFinite(y[i])) return null;
      }
      return y;
    }
    function resolverT(rhs) {
      const q = new Array(n);
      for (let i = 0; i < n; i++) {
        let s = rhs[i];
        for (let k = 0; k < i; k++) s -= M[k][i] * q[k];
        const d = M[i][i];
        if (!(d !== 0) || !Number.isFinite(d) || !Number.isFinite(s)) return null;
        q[i] = s / d;
        if (!Number.isFinite(q[i])) return null;
      }
      const v = new Array(n);
      for (let i = n - 1; i >= 0; i--) {
        let s = q[i];
        for (let k = i + 1; k < n; k++) s -= mult[k][i] * v[k];
        if (!Number.isFinite(s)) return null;
        v[i] = s;
      }
      const w = new Array(n);
      for (let i = 0; i < n; i++) w[ordem[i]] = v[i];
      return w;
    }
    function norma1(v) {
      let s = 0;
      for (let i = 0; i < v.length; i++) {
        const a = Math.abs(v[i]);
        if (!Number.isFinite(a)) return null;
        s += a;
      }
      return Number.isFinite(s) ? s : null;
    }
    const x = new Array(n);
    for (let i = 0; i < n; i++) x[i] = 1 / n;
    let est = 0;
    for (let it = 0; it < 4; it++) {
      const y = resolver(x);
      if (!y) return null;
      const estY = norma1(y);
      if (estY == null) return null;
      if (it > 0 && estY <= est) break;
      est = estY;
      const sinal = y.map((v) => (v < 0 ? -1 : 1));
      const z = resolverT(sinal);
      if (!z) return null;
      let j = 0;
      for (let i = 1; i < n; i++) if (Math.abs(z[i]) > Math.abs(z[j])) j = i;
      let ztx = 0;
      for (let i = 0; i < n; i++) ztx += z[i] * x[i];
      if (!Number.isFinite(ztx) || Math.abs(z[j]) <= ztx) break;
      for (let i = 0; i < n; i++) x[i] = 0;
      x[j] = 1;
    }
    const alt = new Array(n);
    const den = Math.max(1, n - 1);
    for (let i = 0; i < n; i++) alt[i] = ((i % 2 === 0) ? 1 : -1) * (1 + i / den);
    const yAlt = resolver(alt);
    if (!yAlt) return null;
    const nAlt = norma1(alt), nY = norma1(yAlt);
    if (nAlt == null || nY == null || !(nAlt > 0)) return null;
    const inv = Math.max(est, nY / nAlt);
    if (!Number.isFinite(inv) || !(inv > 0)) return null;
    const cond = normaA * inv;
    if (!Number.isFinite(cond) || cond < 1) return cond >= 1 ? cond : (Number.isFinite(cond) && cond > 0 ? 1 : null);
    return cond;
  };

  /**
   * Resolve A·x = b por eliminação de Gauss.
   * modoPivo: 'automatico', 'sempre' ou 'nunca' (troca de linhas).
   * modo: 'operacao' (um passo por operação), 'coluna' (um por coluna, histórico compacto)
   * ou 'nenhum' (só o resultado, sem passos — comparação do modo Nunca).
   * Devolve { passos, x, motivo }.
   */
  Metodos.gauss = function gauss(A, b, modoPivo = 'automatico', modo = 'operacao') {
    const n = A.length;
    const M = A.map((linha, i) => [...linha, b[i]]);
    const escalas = M.map((linha) => {
      let m = 0;
      for (let j = 0; j < n; j++) m = Math.max(m, Math.abs(linha[j]));
      return m;
    });
    const mult = Array.from({ length: n }, () => new Array(n).fill(0));
    const ordem = Array.from({ length: n }, (_, i) => i);
    const passos = [];
    let modoUsado = modo;
    const bytesPasso = n * (n + 1) * 8;
    const copiasOperacao = 3 + n + n * (n + 1) / 2;
    if (modoUsado === 'operacao' && copiasOperacao * bytesPasso > Metodos.ORCAMENTO_HISTORICO) modoUsado = 'coluna';
    const hist = modoUsado === 'coluna' ? Metodos.criarHistorico(M) : null;
    const registrar = modoUsado === 'nenhum' ? function () {} : Metodos.registrador(passos, M, modoUsado, hist);
    const falha = (motivo, coluna) => ({ passos, x: null, motivo, coluna, mult, ordem, historico: hist, escalas });

    registrar('inicio', {}); // @etapa:inicio — monta [A | b]

    // ETAPA 1: zerar abaixo da diagonal, coluna por coluna.
    for (let k = 0; k < n; k++) {
      // Coluna singular se nenhum candidato passa da tolerância relativa à sua linha.
      let util = false;
      for (let i = k; i < n; i++) if (Metodos.pivoUtil(M[i][k], escalas[i], n)) { util = true; break; }
      if (!util) return falha('MATRIZ_SINGULAR', k);
      const escolha = Metodos.escolherPivo(M, k, modoPivo);
      const p = escolha.linha;
      // Modo 'nunca' com pivô zero: não dá para dividir por ele.
      if (M[p][k] === 0 || !Number.isFinite(M[p][k])) return falha('PIVO_ZERO_SEM_TROCA', k);
      const info = Metodos.descreverTroca(M, k, escolha);
      if (p !== k) {
        [M[k], M[p]] = [M[p], M[k]]; // @etapa:trocaLinhas — troca
        [escalas[k], escalas[p]] = [escalas[p], escalas[k]];
        [mult[k], mult[p]] = [mult[p], mult[k]];
        [ordem[k], ordem[p]] = [ordem[p], ordem[k]];
        const novoPivo = { linha: k, coluna: k, valor: M[k][k], ...info };
        registrar('troca', { linhas: [k, p], pivo: novoPivo }, { k, p, troca: info.troca });
      }
      // @etapa:pivo — o pivô é o elemento da diagonal M[k][k]
      const pivo = { linha: k, coluna: k, valor: M[k][k], ...info };
      const valor = pivo.valor;
      if (!Number.isFinite(valor)) return falha('FORA_DA_FAIXA', k);
      registrar('pivo', { pivo, linhaPivo: k }, { k, valor });

      for (let i = k + 1; i < n; i++) {
        // @etapa:eliminacao — Li ← Li − fator·Lk zera M[i][k]
        const fator = M[i][k] / M[k][k];
        if (!Number.isFinite(fator)) return falha('FORA_DA_FAIXA', k);
        mult[i][k] = fator;
        for (let j = k; j <= n; j++) {
          const prod = fator * M[k][j];
          if (!Number.isFinite(prod) || !Number.isFinite(M[i][j])) return falha('FORA_DA_FAIXA', k);
          const novo = M[i][j] - prod;
          if (!Number.isFinite(novo)) return falha('FORA_DA_FAIXA', k);
          M[i][j] = novo;
        }
        M[i][k] = 0; // zera exatamente (sem resto de arredondamento)
        registrar('eliminacao', { pivo, linhaAlvo: i, linhaPivo: k, fator }, { i, k, fator });
      }
    }

    // ETAPA 2: substituição regressiva (da última linha à primeira).
    const x = new Array(n).fill(null);
    for (let i = n - 1; i >= 0; i--) {
      let soma = M[i][n];
      for (let j = i + 1; j < n; j++) soma -= M[i][j] * x[j];
      x[i] = soma / M[i][i]; // @etapa:substituicao — isola x[i]
      if (!Number.isFinite(x[i])) return falha('FORA_DA_FAIXA', i);
      registrar('substituicao', { indice: i, linhaAlvo: i, x: x.slice() },
        { i, bi: M[i][n], aii: M[i][i], xi: x[i] });
    }
    registrar('fim', { x: x.slice() }); // @etapa:fim — solução pronta
    const diag = [];
    for (let i = 0; i < n; i++) diag.push(M[i][i]);
    return { passos, x, motivo: 'SOLUCAO_UNICA', diag, mult, ordem, historico: hist, escalas, U: M };
  };

  /**
   * Mesma eliminação, fatiável (progresso e cancelar). Não usa o registrador:
   * o histórico é montado depois, no fio principal. Autossuficiente para um Worker.
   */
  Metodos.criarEliminacao = function (A, b, modoPivo) {
    const n = A.length;
    const M = A.map((linha, i) => linha.concat([b[i]]));
    const escalas = M.map((linha) => {
      let m = 0;
      for (let j = 0; j < n; j++) if (Math.abs(linha[j]) > m) m = Math.abs(linha[j]);
      return m;
    });
    const ordem = Array.from({ length: n }, (_, i) => i);
    const mult = Array.from({ length: n }, () => new Array(n).fill(0));
    const ops = [];
    const bytes = n * (n + 1) * 8;
    const orc = 48 * 1024 * 1024;
    const maxMat = Math.max(1, Math.floor(orc / Math.max(bytes, 1)));
    const maxChecks = Math.max(1, maxMat > 1 ? maxMat - 1 : 1);
    const stride = maxChecks <= 1 ? n : Math.ceil(n / (maxChecks - 1));
    const checks = [];
    function foto(kk) {
      if (checks.length >= maxChecks) return;
      const data = new Float64Array(n * (n + 1));
      for (let i = 0; i < n; i++) for (let j = 0; j <= n; j++) data[i * (n + 1) + j] = M[i][j];
      checks.push({ k: kk, data: data });
    }
    foto(-1);
    let k = 0, fase = 'elim', motivo = null, colunaParou = null;
    const x = new Array(n).fill(null);
    function util(valor, escala) {
      if (!Number.isFinite(valor)) return false;
      return Math.abs(valor) > n * Number.EPSILON * (escala > 0 ? escala : 1);
    }
    function escolher(kk) {
      let m = kk, maior = Math.abs(M[kk][kk]);
      for (let i = kk + 1; i < n; i++) {
        const a = Math.abs(M[i][kk]);
        if (a > maior) { maior = a; m = i; }
      }
      const pivo = Math.abs(M[kk][kk]);
      const zero = pivo <= n * Number.EPSILON * (maior || 1);
      const pequeno = pivo < 0.1 * maior;
      if (m !== kk && modoPivo === 'sempre') return { linha: m, tipo: 'classica', motivo: 'maior_modulo', pequeno: pequeno };
      if (m !== kk && modoPivo === 'automatico' && zero) return { linha: m, tipo: 'obrigatoria', motivo: 'pivo_zero', pequeno: pequeno };
      if (m !== kk && modoPivo === 'automatico' && pequeno) return { linha: m, tipo: 'recomendada', motivo: 'pivo_pequeno', pequeno: pequeno };
      return { linha: kk, tipo: null, motivo: null, pequeno: pequeno };
    }
    function avancar(qtd) {
      let feitos = 0;
      while (feitos < (qtd || 1) && fase === 'elim' && k < n) {
        let algum = false;
        for (let i = k; i < n; i++) if (util(M[i][k], escalas[i])) { algum = true; break; }
        if (!algum) { motivo = 'MATRIZ_SINGULAR'; colunaParou = k; fase = 'fim'; break; }
        const esc = escolher(k);
        const p = esc.linha;
        if (M[p][k] === 0 || !Number.isFinite(M[p][k])) { motivo = 'PIVO_ZERO_SEM_TROCA'; colunaParou = k; fase = 'fim'; break; }
        const valorOriginal = M[k][k], valorNovo = M[p][k];
        if (p !== k) {
          const rm = M[k]; M[k] = M[p]; M[p] = rm;
          const re = escalas[k]; escalas[k] = escalas[p]; escalas[p] = re;
          const rmu = mult[k]; mult[k] = mult[p]; mult[p] = rmu;
          const ro = ordem[k]; ordem[k] = ordem[p]; ordem[p] = ro;
        }
        if (!Number.isFinite(M[k][k])) { motivo = 'FORA_DA_FAIXA'; colunaParou = k; fase = 'fim'; break; }
        const fatores = [];
        let estourou = false;
        for (let i = k + 1; i < n && !estourou; i++) {
          const fator = M[i][k] / M[k][k];
          if (!Number.isFinite(fator)) { estourou = true; break; }
          mult[i][k] = fator;
          for (let j = k; j <= n; j++) {
            const prod = fator * M[k][j];
            if (!Number.isFinite(prod) || !Number.isFinite(M[i][j])) { estourou = true; break; }
            const novo = M[i][j] - prod;
            if (!Number.isFinite(novo)) { estourou = true; break; }
            M[i][j] = novo;
          }
          M[i][k] = 0;
          fatores.push({ linha: i, fator: fator });
        }
        if (estourou) { motivo = 'FORA_DA_FAIXA'; colunaParou = k; fase = 'fim'; break; }
        ops.push({ k: k, linha: p, tipo: esc.tipo, motivo: esc.motivo, pequeno: esc.pequeno, valorOriginal: valorOriginal, valorNovo: valorNovo, fatores: fatores });
        if (checks.length < maxChecks && ((k + 1) % stride === 0 || k === n - 1)) foto(k);
        k++; feitos++;
      }
      if (fase === 'elim' && k >= n) fase = 'subs';
      if (fase === 'subs') {
        for (let i = n - 1; i >= 0; i--) {
          let soma = M[i][n];
          for (let j = i + 1; j < n; j++) soma -= M[i][j] * x[j];
          x[i] = soma / M[i][i];
          if (!Number.isFinite(x[i])) { motivo = 'FORA_DA_FAIXA'; colunaParou = i; fase = 'fim'; break; }
        }
        if (fase === 'subs') { motivo = 'SOLUCAO_UNICA'; fase = 'fim'; }
      }
      return { k: Math.min(k, n), n: n, feito: fase === 'fim', motivo: motivo };
    }
    function exportar() {
      const diag = [];
      for (let i = 0; i < n; i++) diag.push(M[i][i]);
      return {
        motivo: motivo, coluna: colunaParou,
        x: motivo === 'SOLUCAO_UNICA' ? x.slice() : null,
        diag: diag, mult: mult, ordem: ordem, ops: ops, checks: checks, U: M, escalas: escalas.slice(),
      };
    }
    return { avancar: avancar, exportar: exportar, n: n };
  };

  /** Monta os passos (histórico compacto) a partir do motor fatiável. */
  Metodos.passosDeMotor = function (A, b, exp) {
    const n = A.length;
    const checks = (exp.checks || []).map((c) => {
      const data = c.data;
      const M = [];
      if (data && data.length) {
        for (let i = 0; i < n; i++) {
          const lin = new Array(n + 1);
          for (let j = 0; j <= n; j++) lin[j] = data[i * (n + 1) + j];
          M.push(lin);
        }
      }
      return { k: c.k, M: M };
    });
    const ops = exp.ops || [];
    const trabalho = { k: -2, M: null };
    function aplicar(M, op) {
      const k = op.k, p = op.linha;
      if (p != null && p !== k) { const tmp = M[k]; M[k] = M[p]; M[p] = tmp; }
      (op.fatores || []).forEach((f) => {
        for (let j = k; j <= n; j++) M[f.linha][j] -= f.fator * M[k][j];
        M[f.linha][k] = 0;
      });
    }
    const hist = {
      n: n,
      fotos: function () { return checks.length; },
      tamanho: function () { return (checks.length + (trabalho.M ? 1 : 0)) * n * (n + 1) * 8; },
      bytesReservados: function () { return (checks.length + 1) * n * (n + 1) * 8; },
      em: function (alvo) {
        let ck = checks[0];
        for (let i = 0; i < checks.length; i++) if (checks[i].k <= (alvo == null ? -1 : alvo) && checks[i].M.length) ck = checks[i];
        if (alvo == null || alvo < 0 || ck.k === alvo) return ck.M;
        let M, k0;
        if (trabalho.M && trabalho.k <= alvo && trabalho.k >= ck.k) { M = trabalho.M; k0 = trabalho.k; }
        else { M = ck.M.map((l) => l.slice()); k0 = ck.k; }
        for (let o = 0; o < ops.length; o++) if (ops[o].k > k0 && ops[o].k <= alvo) aplicar(M, ops[o]);
        trabalho.k = alvo; trabalho.M = M;
        return M;
      },
    };
    const passos = [{
      tipo: 'inicio', fase: 'eliminacao', etapa: 'inicio', etapas: ['inicio'],
      descricao: Metodos.textos.gauss('inicio'), matriz: hist.em(-1), _hist: hist, _i: -1,
    }];
    ops.forEach((op) => {
      const info = Metodos.montarTroca(op.k, { linha: op.linha, tipo: op.tipo, motivo: op.motivo, pequeno: op.pequeno }, op.valorOriginal, op.valorNovo);
      const pivo = { linha: op.k, coluna: op.k, valor: op.tipo ? op.valorNovo : op.valorOriginal, pequeno: op.pequeno, ...info };
      const passo = {
        tipo: 'coluna', k: op.k, pivo: pivo, linhaPivo: op.k,
        fatores: op.fatores, troca: op.tipo ? [op.linha, op.k] : null,
        _hist: hist, _i: op.k, fase: 'eliminacao',
      };
      passo.descricao = Metodos.textos.gauss('coluna', passo);
      Object.assign(passo, Metodos.etapasGauss('coluna', pivo, (op.fatores || []).length > 0));
      passos.push(passo);
    });
    if (exp.motivo === 'SOLUCAO_UNICA') {
      passos.push({
        tipo: 'substituicao', fase: 'substituicao', etapa: 'substituicao', etapas: ['substituicao'],
        indice: 0, x: exp.x.slice(), _hist: hist, _i: n - 1,
        descricao: `Substituição regressiva: x${n} até x1 calculados de baixo para cima.`,
      });
      passos.push({
        tipo: 'fim', fase: 'substituicao', etapa: 'fim', etapas: ['fim'], x: exp.x.slice(),
        _hist: hist, _i: n - 1, descricao: Metodos.textos.gauss('fim', { x: exp.x }),
      });
    }
    return { passos: passos, historico: hist };
  };
})(typeof window !== 'undefined' ? window : globalThis);
