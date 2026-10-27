/* Validação de entrada, mensagens de erro e pós-análise dos métodos.
   O site deve chamar Metodos.executar.<metodo>(parametrosDoFormulario): ele valida,
   chama a função principal (Metodos.bisseccao / newton / gauss) e devolve
   { passos, resultado, erro, codigoErro, avisos } — ver docs/contrato-etapas.md.
   Carregar DEPOIS de expressao.js, comum.js, bisseccao.js, newton.js e gauss.js. */
(function (g) {
  'use strict';
  const Metodos = g.Metodos = g.Metodos || {};
  const fmt = (v) => Metodos.fmtBR(v); // textos sempre com vírgula decimal

  // Erro de validação com código estável (a interface pode traduzir/estilizar por código).
  function Falha(codigo, mensagem) { this.codigo = codigo; this.mensagem = mensagem; }
  const falhar = (codigo, mensagem) => { throw new Falha(codigo, mensagem); };

  function compilarExpressao(texto, rotulo) {
    try { return g.Expressao.compilar(String(texto == null ? '' : texto)); }
    catch (e) { return falhar(e.codigo || 'ERRO_SINTAXE', rotulo + ': ' + (e.mensagem || e.message)); }
  }
  function numero(v, rotulo) {
    // Aceita vírgula decimal ("1,5"), como o formulário do Gauss.
    const n = typeof v === 'string' && v.trim() !== '' ? Number(v.trim().replace(',', '.')) : v;
    if (typeof n !== 'number' || !Number.isFinite(n)) falhar('ENTRADA_INVALIDA', `"${rotulo}" deve ser um número válido.`);
    return n;
  }
  // ε/tol padrão quando o campo vem ausente/null/'' (decisão do usuário: relativo = 0,01,
  // como a tabela da professora). Absoluto: sem padrão (null), tol continua obrigatório.
  Metodos.TOL_PADRAO = Object.freeze({ relativo: 0.01, absoluto: null });
  function parametrosIterativos(p) {
    const criterio = criterioDeParada(p.criterio);
    const vazio = p.tol == null || (typeof p.tol === 'string' && p.tol.trim() === '');
    const padrao = Metodos.TOL_PADRAO[criterio];
    const tol = vazio && padrao != null ? padrao : numero(p.tol, 'tolerância');
    const maxIter = Math.floor(numero(p.maxIter, 'máx. iterações'));
    if (tol <= 0) falhar('ENTRADA_INVALIDA', 'A tolerância deve ser maior que zero.');
    if (maxIter < 1 || maxIter > 10000) falhar('ENTRADA_INVALIDA', 'Máx. iterações deve estar entre 1 e 10000.');
    return { tol, maxIter, criterio, tolPadrao: vazio && padrao != null };
  }
  // Critério de parada: 'relativo' (padrão) ou 'absoluto' (aliases 'rel'/'abs').
  function criterioDeParada(c) {
    if (c == null || c === 'relativo' || c === 'rel') return 'relativo';
    if (c === 'absoluto' || c === 'abs') return 'absoluto';
    falhar('ENTRADA_INVALIDA', 'criterio deve ser "absoluto" ou "relativo".');
  }
  // BUG-30: só avisa quando o fallback DECIDIU a parada (último passo, motivo TOLERANCIA).
  function avisarFallback(avisos, passos, tol, motivo) {
    const p = passos[passos.length - 1];
    if (!p || !p.criterioFallback || motivo !== 'TOLERANCIA') return;
    const x = p.c != null ? p.c : p.xNovo, F = Metodos.fmtBR;
    avisar(avisos, 'CRITERIO_RELATIVO_PERTO_DE_ZERO', `Critério relativo perto de zero: na iteração ${p.c != null ? p.k : p.k + 1}, |x| = ${F(Math.abs(x))} < ${F(Metodos.LIMIAR_ZERO_RELATIVO)}, e dividir por ele não faz sentido; usei o erro absoluto |Δx| = ${F(p.erroCriterio)} comparado com ε = ${F(tol)}.`);
  }
  const finito = Number.isFinite;

  // Envolve uma execução: transforma Falha em { erro, codigoErro } sem lançar exceção.
  // Avisos: `avisos` continua sendo uma lista de textos (compatível); o código estável de
  // cada aviso vai, na mesma ordem, em `codigosAviso` (topo e resultado.codigosAviso).
  function avisar(avisos, codigo, mensagem) {
    avisos.push(mensagem);
    avisos.codigos.push(codigo);
  }

  function executarComSeguranca(fn) {
    const avisos = [];
    Object.defineProperty(avisos, 'codigos', { value: [], enumerable: false });
    let r;
    try { r = Object.assign({ avisos }, fn(avisos)); }
    catch (e) {
      if (e instanceof Falha) r = { passos: [], resultado: null, erro: e.mensagem, codigoErro: e.codigo, avisos };
      else r = { passos: [], resultado: null, erro: 'Erro interno: ' + e.message, codigoErro: 'ERRO_INTERNO', avisos };
    }
    r.codigosAviso = avisos.codigos.slice();
    if (r.resultado) r.resultado.codigosAviso = r.codigosAviso.slice();
    return r;
  }

  // ------------------------------------------------------------------ Bissecção
  function validarBisseccao(p, avisos) {
    const f = compilarExpressao(p.f, 'f(x)');
    let a = numero(p.a, 'a'), b = numero(p.b, 'b');
    const { tol, maxIter, criterio } = parametrosIterativos(p);
    if (a === b) falhar('ENTRADA_INVALIDA', 'Os extremos a e b não podem ser iguais.');
    if (a > b) { [a, b] = [b, a]; avisar(avisos, 'EXTREMOS_TROCADOS', `Os extremos estavam invertidos; usei a = ${fmt(a)} e b = ${fmt(b)}.`); }
    const fa = f(a), fb = f(b);
    if (!finito(fa)) falhar('FUNCAO_NAO_DEFINIDA', `f não está definida em x = ${fmt(a)} (extremo a). Escolha outro intervalo.`);
    if (!finito(fb)) falhar('FUNCAO_NAO_DEFINIDA', `f não está definida em x = ${fmt(b)} (extremo b). Escolha outro intervalo.`);
    if (fa * fb > 0) falhar('SEM_TROCA_DE_SINAL', `f(a)·f(b) > 0: f(${fmt(a)}) = ${fmt(fa)} e f(${fmt(b)}) = ${fmt(fb)} têm o mesmo sinal. Escolha um intervalo onde f troque de sinal.`);
    return { f, a, b, fa, fb, tol, maxIter, criterio };
  }

  function executarBisseccao(p) {
    return executarComSeguranca(function (avisos) {
      const v = validarBisseccao(p, avisos);
      // BUG-29: log2((b−a)/tol) só vale para o critério absoluto; no relativo, null.
      const iteracoesEstimadas = v.criterio === 'relativo' ? null : Math.max(0, Math.ceil(Math.log2((v.b - v.a) / v.tol)));
      if (v.fa === 0 || v.fb === 0) {
        const raiz = v.fa === 0 ? v.a : v.b;
        avisar(avisos, 'RAIZ_NO_EXTREMO', `O extremo x = ${fmt(raiz)} já é uma raiz exata; nenhuma iteração foi necessária.`);
        return { passos: [], resultado: { raiz, fRaiz: 0, iteracoes: 0, convergiu: true, motivo: 'RAIZ_EXATA', iteracoesEstimadas: null, criterio: v.criterio, tol: v.tol }, erro: null, codigoErro: null };
      }
      const r = Metodos.bisseccao(v.f, v.a, v.b, v.tol, v.maxIter, v.criterio);
      avisarFallback(avisos, r.passos, v.tol, r.motivo);
      const ruim = r.passos.findIndex((s) => !finito(s.fc));
      if (ruim >= 0) {
        const passos = r.passos.slice(0, ruim);
        return { passos, resultado: null, erro: `f(c) não é finito em c = ${fmt(r.passos[ruim].c)} (função não definida ali).`, codigoErro: 'FUNCAO_NAO_DEFINIDA' };
      }
      const resultado = { raiz: r.raiz, fRaiz: v.f(r.raiz), iteracoes: r.passos.length, convergiu: r.convergiu, motivo: r.motivo, iteracoesEstimadas, criterio: v.criterio, tol: v.tol };
      if (pareceDescontinuidade(r.passos, v.fa, v.fb)) {
        resultado.convergiu = false; resultado.motivo = 'DESCONTINUIDADE';
        const c = r.passos[r.passos.length - 1];
        return { passos: r.passos, resultado, codigoErro: 'DESCONTINUIDADE',
          erro: `Provável descontinuidade, não raiz: o intervalo encolheu perto de x = ${fmt(c.c)}, mas |f(c)| cresceu (f(c) = ${fmt(c.fc)}). f deve ter um polo ali (troca de sinal sem raiz). Escolha um intervalo onde f seja contínua.` };
      }
      if (!r.convergiu) return { passos: r.passos, resultado, erro: 'Máximo de iterações atingido sem atingir a tolerância.', codigoErro: 'NAO_CONVERGIU' };
      return { passos: r.passos, resultado, erro: null, codigoErro: null };
    });
  }

  /**
   * Bissecção sobre um polo (ex.: tan x perto de π/2): f troca de sinal sem ter raiz, e |f(c)|
   * CRESCE enquanto o intervalo encolhe. Numa raiz legítima |f(c)| tende a 0, mesmo com f' grande.
   * Critério: |f(c)| final > 10·max(|f(a0)|, |f(b0)|) E |f(c)| final > 10·|f(c1)| E a média de |f(c)|
   * nas 3 últimas iterações é maior que nas 3 primeiras.
   */
  function pareceDescontinuidade(passos, fa0, fb0) {
    if (passos.length < 6) return false;
    const m = (lista) => lista.reduce((s, p) => s + Math.abs(p.fc), 0) / lista.length;
    const fim = Math.abs(passos[passos.length - 1].fc);
    return fim > 10 * Math.max(Math.abs(fa0), Math.abs(fb0)) &&
      fim > 10 * Math.abs(passos[0].fc) && m(passos.slice(-3)) > m(passos.slice(0, 3));
  }

  // ------------------------------------------------------------------ Newton
  function validarNewton(p, avisos) {
    const f = compilarExpressao(p.f, 'f(x)');
    let df, tipoDerivada, derivadaTexto = null;
    if (p.df != null && String(p.df).trim() !== '') {
      df = compilarExpressao(p.df, "f'(x)"); tipoDerivada = 'fornecida'; derivadaTexto = df.texto;
    } else if (!p.derivadaNumerica) {
      df = g.Expressao.derivar(f); tipoDerivada = 'simbolica'; derivadaTexto = df.texto;
      avisar(avisos, 'DERIVADA_SIMBOLICA', `Derivada calculada simbolicamente: f'(x) = ${derivadaTexto}`);
    } else {
      df = (x) => g.Expressao.derivadaNumerica(f, x); tipoDerivada = 'numerica';
      avisar(avisos, 'DERIVADA_NUMERICA', "Derivada aproximada numericamente (diferença central).");
    }
    const x0 = numero(p.x0, 'x0');
    const { tol, maxIter, criterio } = parametrosIterativos(p);
    if (!finito(f(x0)) || !finito(df(x0))) falhar('FUNCAO_NAO_DEFINIDA', `f ou f' não é finita em x0 = ${fmt(x0)}.`);
    return { f, df, x0, tol, maxIter, criterio, tipoDerivada, derivadaTexto };
  }

  // Analisa uma execução que NÃO convergiu: oscilação? erro crescendo?
  function diagnosticarNewton(passos) {
    const xs = passos.map((s) => s.x);
    const ultimo = passos[passos.length - 1];
    if (ultimo && xs.slice(0, -1).some((x) => Math.abs(x - ultimo.xNovo) < 1e-9 * Math.max(1, Math.abs(x)))) return 'OSCILACAO';
    let crescendo = 0;
    for (let i = 1; i < passos.length; i++) crescendo = passos[i].erro > passos[i - 1].erro ? crescendo + 1 : 0;
    return crescendo >= 4 ? 'DIVERGENCIA' : 'NAO_CONVERGIU';
  }

  // Newton converge quadraticamente em raízes simples; se a razão entre erros
  // seguidos fica estável (~constante < 1), a convergência é linear (raiz múltipla).
  function convergenciaLinear(passos) {
    if (passos.length < 5) return false;
    const e = passos.slice(-4).map((s) => s.erro);
    const razoes = [e[1] / e[0], e[2] / e[1], e[3] / e[2]];
    // BUG-32: só a fase final. Razões estáveis (linear, ≈ (m−1)/m) e sem
    // aceleração quadrática no fim (a última razão não despenca).
    return razoes.every((q) => q > 0.2 && q < 0.95) && razoes[2] >= 0.7 * razoes[0];
  }
  // BUG-32: relativo + raiz em 0 (ex.: x³). Últimos 6 passos com |x| decrescendo
  // monotonamente e erro relativo estagnado (≥ 0,9× o de 5 passos antes).
  function raizEmZeroRelativo(passos) {
    if (passos.length < 6) return false;
    const u = passos.slice(-6), ax = u.map((s) => Math.abs(s.xNovo));
    const decresce = ax.every((v, i) => i === 0 || v < ax[i - 1]);
    const e0 = u[0].erroCriterio, e5 = u[5].erroCriterio;
    return decresce && e0 != null && e5 != null && e5 >= 0.9 * e0;
  }

  const MENSAGENS_NEWTON = {
    DERIVADA_ZERO: (x) => `Derivada ≈ 0 em x = ${fmt(x)}: a tangente é horizontal e não cruza o eixo x. Tente outro x0.`,
    DIVERGENCIA: () => 'O método divergiu (|x| ou o erro cresceu demais). Tente um x0 mais perto da raiz.',
    OSCILACAO: () => 'Os valores de x entraram em ciclo (oscilação) e não convergem. Tente outro x0.',
    NAO_CONVERGIU: () => 'Máximo de iterações atingido sem convergir.',
    RAIZ_EM_ZERO_CRITERIO_RELATIVO: (x) => `Os iterados convergem para x = 0, uma raiz múltipla (último x = ${fmt(x)}); o erro relativo |Δx|/|x| não diminui quando a raiz é 0 (fica em ≈ 0,5). Use o critério absoluto.`,
    FUNCAO_NAO_DEFINIDA: (x) => `f ou f' não está definida em x = ${fmt(x)} (o passo saiu do domínio de f). Tente outro x0.`,
  };

  // Procura, na árvore de f, a operação que deixou f(x) indefinida e devolve a causa em palavras.
  function causaForaDoDominio(no, x) {
    if (!no || typeof no !== 'object') return null;
    for (const filho of [no.arg, no.esq, no.dir]) {
      const c = causaForaDoDominio(filho, x);
      if (c) return c;
    }
    const val = (n) => g.Expressao.avaliarAst(n, x);
    if (no.tipo === 'func') {
      const a = val(no.arg);
      if (!finito(a) || finito(val(no))) return null;
      if (/^(ln|log|log10|log2)$/.test(no.nome)) return `${no.nome} de ${a === 0 ? 'zero' : 'número negativo'}`;
      if (no.nome === 'sqrt') return 'raiz quadrada de número negativo';
      if (/^(asin|acos)$/.test(no.nome)) return `${no.nome} fora de [−1, 1]`;
      return `${no.nome} não definida nesse ponto`;
    }
    if (no.tipo === 'bin' && finito(val(no.esq)) && finito(val(no.dir)) && !finito(val(no))) {
      if (no.op === '/') return 'divisão por zero';
      if (no.op === '^') return 'potência não definida (base negativa com expoente não inteiro, ou 0 elevado a negativo)';
    }
    return null;
  }

  function executarNewton(p) {
    return executarComSeguranca(function (avisos) {
      const v = validarNewton(p, avisos);
      const r = Metodos.newton(v.f, v.df, v.x0, v.tol, v.maxIter, v.criterio);
      let passos = r.passos, codigo = null;
      const ruim = passos.findIndex((s) => !finito(s.fx) || !finito(s.dfx));
      let erroDominio = null;
      if (ruim >= 0) {
        const { k, x } = passos[ruim];
        const F = Metodos.fmtBR, fx = passos[ruim].fx;
        if (finito(fx)) { // f está definida; quem não é finita é f'
          const formula = v.tipoDerivada === 'numerica' ? '' : ` (f'(x) = ${v.derivadaTexto})`;
          erroDominio = `Em x${k} = ${F(x)}, f(x${k}) = ${F(fx)} está definida, mas f'(x${k}) não é finita${formula}; o passo de Newton não pode ser calculado. Tente um x0 mais perto da raiz.`;
          codigo = 'DERIVADA_NAO_DEFINIDA';
        } else {
          const causa = causaForaDoDominio(v.f.ast, x) || 'f não está definida';
          erroDominio = `x${k} = ${F(x)} está fora do domínio de f (${causa}); tente um x0 mais perto da raiz.`;
          codigo = 'FUNCAO_NAO_DEFINIDA';
        }
        passos = passos.slice(0, ruim);
      }
      else if (r.motivo === 'MAX_ITERACOES') codigo = diagnosticarNewton(passos);
      else if (!r.convergiu) codigo = r.motivo;
      // BUG-32: o desfecho vira RAIZ_EM_ZERO_CRITERIO_RELATIVO (erro; raiz sugerida = último x).
      if (v.criterio === 'relativo' && /^(DERIVADA_ZERO|NAO_CONVERGIU|MAX_ITERACOES)$/.test(codigo || r.motivo) && raizEmZeroRelativo(passos)) codigo = 'RAIZ_EM_ZERO_CRITERIO_RELATIVO';
      // Salto grande: f'(x) pequena manda x para longe (|Δx| > 5·max(1, |x0|)). Avisa só o 1º.
      const escala = 5 * Math.max(1, Math.abs(v.x0));
      const salto = passos.find((s) => Math.abs(s.xNovo - s.x) > escala);
      if (salto) {
        const k = salto.k, F = Metodos.fmtBR;
        avisar(avisos, 'SALTO_GRANDE', `Salto grande na iteração ${k + 1}: f'(x${k}) = ${F(salto.dfx)} é pequena, e x foi de ${F(salto.x)} para x${k + 1} = ${F(salto.xNovo)}.`);
      }
      if (r.motivo === 'RAIZ_EXATA' && Math.abs(v.df(r.raiz)) < 1e-12) avisar(avisos, 'RAIZ_MULTIPLA', 'A derivada também é zero na raiz (raiz múltipla).');
      else if ((r.convergiu || codigo === 'RAIZ_EM_ZERO_CRITERIO_RELATIVO') && convergenciaLinear(passos)) avisar(avisos, 'CONVERGENCIA_LENTA', 'Convergência lenta (linear): provável raiz múltipla, onde f e f\' se anulam juntas.');
      avisarFallback(avisos, passos, v.tol, r.motivo);
      const resultado = {
        raiz: /^(DIVERGENCIA|FUNCAO_NAO_DEFINIDA|DERIVADA_NAO_DEFINIDA)$/.test(codigo) ? null : r.raiz,
        fRaiz: finito(r.raiz) ? v.f(r.raiz) : null, iteracoes: passos.length, convergiu: r.convergiu,
        criterio: v.criterio, tol: v.tol, motivo: codigo || r.motivo, derivadaNumerica: v.tipoDerivada === 'numerica', tipoDerivada: v.tipoDerivada, derivadaTexto: v.derivadaTexto,
      };
      return { passos, resultado, erro: codigo ? (erroDominio || MENSAGENS_NEWTON[codigo](r.raiz)) : null, codigoErro: codigo };
    });
  }

  // ------------------------------------------------------------------ Gauss
  // Pivoteamento: 'automatico' (padrão; alias 'auto'), 'sempre', 'nunca'.
  // Compatibilidade: true/'parcial' → 'sempre'; false/'nenhum' → 'nunca'.
  function modoDePivoteamento(v) {
    if (v == null || v === 'auto' || v === 'automatico') return 'automatico';
    if (v === true || v === 'sempre' || v === 'parcial') return 'sempre';
    if (v === false || v === 'nunca' || v === 'nenhum') return 'nunca';
    falhar('ENTRADA_INVALIDA', 'pivoteamento deve ser "automatico", "sempre" ou "nunca" (ou true/false).');
  }

  const norma = (v) => Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  // Resíduo relativo ||A·x − b|| / ||b|| (se b = 0, devolve ||A·x − b||).
  function residuoRelativo(A, b, x) {
    const r = A.map((l, i) => l.reduce((t, a, j) => t + a * x[j], 0) - b[i]);
    return norma(r) / (norma(b) || 1);
  }

  function validarGauss(p) {
    let A, b;
    if (Array.isArray(p.matriz)) { // formato do site: matriz aumentada n×(n+1)
      A = p.matriz.map((l) => (Array.isArray(l) ? l.slice(0, -1) : l));
      b = p.matriz.map((l) => (Array.isArray(l) ? l[l.length - 1] : NaN));
    } else { A = p.A; b = p.b; }
    if (!Array.isArray(A) || A.length < 1 || !A.every(Array.isArray)) falhar('ENTRADA_INVALIDA', 'Informe a matriz do sistema.');
    const n = A.length;
    if (n < 2 || n > 100) falhar('ENTRADA_INVALIDA', `O sistema deve ter entre 2 e 100 equações (recebi ${n}).`);
    if (A.some((l) => l.length !== n)) falhar('MATRIZ_NAO_QUADRADA', 'A matriz aumentada deve ser n×(n+1) (A quadrada).');
    if (!Array.isArray(b) || b.length !== n) falhar('DIMENSOES_INCOMPATIVEIS', `O vetor b deve ter ${n} elementos.`);
    const conv = (i) => (v, j) => numero(v, j < n ? `linha ${i + 1}, coluna ${j + 1} da matriz` : `linha ${i + 1}, coluna b`);
    const piv = modoDePivoteamento(p.pivoteamento);
    return { A: A.map((l, i) => l.map(conv(i))), b: b.map((v, i) => conv(i)(v, n)), pivoteamento: piv };
  }

  // Posto por escalonamento (para classificar sistemas singulares).
  function posto(M, tol) {
    const R = Metodos.copiarMatriz(M);
    let r = 0;
    for (let c = 0; c < R[0].length && r < R.length; c++) {
      let melhor = r;
      for (let i = r; i < R.length; i++) if (Math.abs(R[i][c]) > Math.abs(R[melhor][c])) melhor = i;
      if (Math.abs(R[melhor][c]) <= tol) continue;
      [R[r], R[melhor]] = [R[melhor], R[r]];
      for (let i = r + 1; i < R.length; i++) {
        const m = R[i][c] / R[r][c];
        for (let j = c; j < R[0].length; j++) R[i][j] -= m * R[r][j];
      }
      r++;
    }
    return r;
  }

  function executarGauss(p, bVetor, opcoes) {
    // Assinatura combinada com a interface: executar.gauss(A, b, { granularidade })
    // (também aceita o objeto { A, b } ou { matriz }, + pivoteamento/granularidade).
    if (Array.isArray(p)) p = Object.assign({ A: p, b: bVetor }, opcoes || {});
    p = p || {};
    return executarComSeguranca(function (avisos) {
      const v = validarGauss(p);
      const n0 = v.A.length;
      const gran = p.granularidade || (n0 > 10 ? 'coluna' : 'operacao');
      if (gran !== 'coluna' && gran !== 'operacao') falhar('ENTRADA_INVALIDA', 'granularidade deve ser "coluna" ou "operacao".');
      const r0 = executarGaussOperacao(v, gran, avisos);
      if (gran === 'coluna') avisar(avisos, 'MODO_COLUNA', 'Modo por coluna: um passo por coluna de pivô (matriz grande).');
      if (r0.resultado) r0.resultado.granularidade = gran;
      return r0;
    });
  }

  // Número de condição cond∞(A) = ‖A‖∞·‖A⁻¹‖∞, com A⁻¹ por Gauss-Jordan com pivoteamento
  // parcial (O(n³), ok até n = 100). Infinity se A for singular na precisão da máquina.
  // Limiar 1e8: o erro relativo esperado em x é ~cond·ε, então acima de 1e8 metade
  // (ou mais) dos ~16 algarismos de precisão pode estar perdida.
  const LIMIAR_COND = 1e8;
  function condicaoInf(A) {
    const n = A.length, normaInf = (X) => Math.max(...X.map((l) => l.reduce((s, v) => s + Math.abs(v), 0)));
    const M = A.map((l, i) => [...l, ...l.map((_, j) => (i === j ? 1 : 0))]);
    for (let k = 0; k < n; k++) {
      let p = k;
      for (let i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i;
      if (M[p][k] === 0) return Infinity;
      [M[k], M[p]] = [M[p], M[k]];
      const piv = M[k][k];
      for (let j = 0; j < 2 * n; j++) M[k][j] /= piv;
      for (let i = 0; i < n; i++) {
        if (i === k || M[i][k] === 0) continue;
        const f = M[i][k];
        for (let j = k; j < 2 * n; j++) M[i][j] -= f * M[k][j];
      }
    }
    const c = normaInf(A) * normaInf(M.map((l) => l.slice(n)));
    return Number.isFinite(c) ? c : Infinity;
  }
  function contarTrocas(passos) {
    const t = { total: 0, obrigatorias: 0, recomendadas: 0, classicas: 0 };
    const chave = { obrigatoria: 'obrigatorias', recomendada: 'recomendadas', classica: 'classicas' };
    for (const s of passos) {
      if ((s.tipo === 'pivo' || s.tipo === 'coluna') && s.pivo && s.pivo.troca) { t.total++; t[chave[s.pivo.troca.tipo]]++; }
    }
    return t;
  }
  function executarGaussOperacao(v, gran, avisos) {
      const n = v.A.length;
      const r = Metodos.gauss(v.A, v.b, v.pivoteamento, gran);
      if (r.motivo === 'PIVO_ZERO_SEM_TROCA') {
        const k = r.coluna + 1;
        return {
          passos: r.passos, resultado: { x: null, coluna: r.coluna, pivoteamento: 'nunca' }, codigoErro: 'PIVO_ZERO_SEM_TROCA',
          erro: `Pivô a${k}${k} = 0 e o modo “nunca” não permite trocar linhas: ative o pivoteamento (automático ou sempre).`,
        };
      }
      if (r.motivo === 'MATRIZ_SINGULAR') {
        const tol = Metodos.toleranciaPivo(v.A);
        const aumentada = v.A.map((l, i) => [...l, v.b[i]]);
        const pA = posto(v.A, tol), pAug = posto(aumentada, Math.max(tol, n * Number.EPSILON * Math.max(...v.b.map(Math.abs))));
        const classificacao = pA < pAug ? 'impossivel' : 'infinitas_solucoes';
        // Código próprio por classificação: o painel Avisos destaca só o item certo.
        if (classificacao === 'impossivel') avisar(avisos, 'SISTEMA_IMPOSSIVEL', 'posto(A) < posto([A | b]): as equações se contradizem.');
        else avisar(avisos, 'SISTEMA_INDETERMINADO', 'posto(A) = posto([A | b]) < n: há variáveis livres.');
        return {
          passos: r.passos, resultado: { x: null, classificacao, postoA: pA, postoAumentada: pAug },
          erro: `Sistema singular: não há pivô não nulo na coluna ${r.coluna + 1}. ` +
            (classificacao === 'impossivel' ? 'O sistema é impossível (não tem solução).' : 'O sistema tem infinitas soluções.'),
          codigoErro: 'MATRIZ_SINGULAR',
        };
      }
      const U = r.passos[r.passos.length - 1].matriz;
      const trocas = contarTrocas(r.passos);
      let determinante = trocas.total % 2 ? -1 : 1;
      for (let i = 0; i < n; i++) determinante *= U[i][i];
      const residuo = Math.sqrt(v.A.reduce((s, l, i) => {
        const ri = l.reduce((t, a, j) => t + a * r.x[j], 0) - v.b[i];
        return s + ri * ri;
      }, 0));
      const condicao = condicaoInf(v.A);
      const resultado = { x: r.x, determinante, residuo, trocas, classificacao: 'unica', pivoteamento: v.pivoteamento, condicao };
      if (!(condicao <= LIMIAR_COND)) {
        const F = Metodos.fmtBR, c = Number.isFinite(condicao) ? `≈ ${F(condicao)}` : '≥ 1,000e+16';
        const perda = Number.isFinite(condicao) ? F(Math.min(1, condicao * Number.EPSILON)) : '1';
        avisar(avisos, 'MAL_CONDICIONADA', `Matriz mal condicionada: cond∞(A) ${c} > 1,000e+8. O erro relativo em x pode chegar a cond·ε ≈ ${perda}, mesmo com resíduo pequeno.`);
      }
      if (v.pivoteamento === 'nunca') {
        // Compara com o pivoteamento clássico ('sempre'), usado como referência x_ref.
        const ref = Metodos.gauss(v.A, v.b, 'sempre', 'coluna');
        if (ref.x) {
          const dif = (x) => norma(x.map((xi, i) => xi - ref.x[i])) / (norma(ref.x) || 1);
          resultado.comparacao = {
            semPivo: { x: r.x, erro: dif(r.x), residuo: residuoRelativo(v.A, v.b, r.x) },
            comPivo: { x: ref.x, erro: 0, residuo: residuoRelativo(v.A, v.b, ref.x) },
          };
        }
        const pequeno = r.passos.find((s) => s.pivo && s.pivo.pequeno);
        if (pequeno) {
          const k = pequeno.pivo.coluna + 1;
          const erroTxt = resultado.comparacao ? `; erro relativo de x em relação ao pivoteamento parcial: ${fmt(resultado.comparacao.semPivo.erro)}` : '';
          avisar(avisos, 'PIVO_PEQUENO_SEM_TROCA', `Pivô pequeno sem troca (modo “nunca”): a${k}${k} = ${fmt(pequeno.pivo.valor)}, menor que 0,1·max|a_ik| da coluna${erroTxt}.`);
        }
      }
      return { passos: r.passos, resultado, erro: null, codigoErro: null };
  }

  /**
   * Lê uma matriz colada do Excel/Planilhas/CSV. Separadores aceitos: TAB, ';', espaços, '|'
   * e vírgula. Se houver TAB ou ';', a vírgula é decimal ("1,5"); senão, vírgula separa colunas (CSV).
   * Devolve { matriz, A, b, linhas, colunas, erro, codigoErro }. Com colunas = linhas + 1,
   * A e b vêm separados (matriz aumentada); com colunas = linhas, b = null.
   */
  // Interno (compartilhado): quebra o texto em linhas e células e converte em números.
  // virgulaDecimal: true ⇒ "1,5" vale 1.5 (texto com TAB ou ';'); false ⇒ a vírgula separa valores.
  // Separadores "fortes" (TAB e ';'; ou ',' quando não é decimal): cada ocorrência separa uma célula,
  // então dois seguidos = célula vazia; um único separador sobrando no fim da linha é ignorado.
  // Espaços (e '|') colapsam: vários seguidos = um separador.
  // Devolve { matriz } ou { invalido: { linha, coluna, celula, vazia } } (linha/coluna a partir de 1).
  function lerGradeTexto(texto, virgulaDecimal) {
    const linhasTxt = String(texto == null ? '' : texto).split(/\r?\n/)
      .map((l) => l.replace(/^[ \r]+|[ \r]+$/g, '')).filter((l) => l.trim() !== '');
    const forte = virgulaDecimal ? /[\t;]/ : /[\t;,]/;
    const matriz = [];
    for (let i = 0; i < linhasTxt.length; i++) {
      let pedacos = linhasTxt[i].split(forte).map((c) => c.trim());
      if (pedacos.length > 1 && pedacos[pedacos.length - 1] === '') pedacos.pop(); // separador final
      const celulas = [];
      for (const p of pedacos) {
        if (p === '' && pedacos.length > 1) return { invalido: { linha: i + 1, coluna: celulas.length + 1, celula: '', vazia: true } };
        celulas.push(...p.split(/[|\s]+/).filter((c) => c !== ''));
      }
      const linha = [];
      for (let j = 0; j < celulas.length; j++) {
        const t = virgulaDecimal ? celulas[j].replace(',', '.') : celulas[j];
        const v = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(t) ? Number(t) : NaN;
        if (!Number.isFinite(v)) return { invalido: { linha: i + 1, coluna: j + 1, celula: celulas[j], vazia: false } };
        linha.push(v);
      }
      matriz.push(linha);
    }
    return { matriz };
  }
  const textoVazio = (t) => String(t == null ? '' : t).trim() === '';
  const temTabOuPontoVirgula = (t) => /[\t;]/.test(String(t == null ? '' : t));

  Metodos.lerMatrizTexto = function (texto) {
    const falha = (m) => ({ matriz: null, A: null, b: null, linhas: 0, colunas: 0, erro: m, codigoErro: 'MATRIZ_TEXTO_INVALIDA' });
    if (textoVazio(texto)) return falha('Cole ao menos uma linha de números.');
    const g = lerGradeTexto(texto, temTabOuPontoVirgula(texto));
    if (g.invalido) {
      const e = g.invalido;
      if (e.vazia) return falha(`Linha ${e.linha}, coluna ${e.coluna} vazia.`);
      return falha(`Linha ${e.linha}, coluna ${e.coluna}: "${e.celula}" não é um número.`);
    }
    const matriz = g.matriz;
    const colunas = matriz[0].length, linhas = matriz.length;
    if (matriz.some((l) => l.length !== colunas)) return falha('Todas as linhas devem ter o mesmo número de colunas.');
    if (linhas < 2 || linhas > 100) return falha(`A matriz deve ter entre 2 e 100 linhas (recebi ${linhas}).`);
    if (colunas !== linhas && colunas !== linhas + 1) return falha(`Esperado n×n ou n×(n+1); recebi ${linhas}×${colunas}.`);
    const aumentada = colunas === linhas + 1;
    return {
      matriz, linhas, colunas, erro: null, codigoErro: null,
      A: matriz.map((l) => l.slice(0, linhas)), b: aumentada ? matriz.map((l) => l[linhas]) : null,
    };
  };

  /**
   * Lê A (n×n) e b (n valores) de dois textos separados.
   * A: mesmas regras do lerMatrizTexto. b: uma coluna (um valor por linha) ou uma linha só.
   * Retorno: { A, b, n, erro, codigoErro, campo: 'A'|'b'|null, linha, coluna }.
   */
  Metodos.lerSistemaTexto = function (textoA, textoB) {
    const falha = (campo, erro, linha = null, coluna = null, n = null) =>
      ({ A: null, b: null, n, erro, codigoErro: 'MATRIZ_TEXTO_INVALIDA', campo, linha, coluna });
    // ---- A
    if (textoVazio(textoA)) return falha('A', 'A está vazia: cole as n linhas da matriz dos coeficientes.');
    const gA = lerGradeTexto(textoA, temTabOuPontoVirgula(textoA));
    if (gA.invalido) {
      const e = gA.invalido;
      if (e.vazia) return falha('A', `Célula vazia em A, linha ${e.linha}, coluna ${e.coluna}`, e.linha, e.coluna);
      return falha('A', `Valor inválido em A, linha ${e.linha}, coluna ${e.coluna}: "${e.celula}"`, e.linha, e.coluna);
    }
    const A = gA.matriz, n = A.length;
    if (n < 2 || n > 100) return falha('A', `A precisa ter entre 2 e 100 linhas; encontrei ${n}.`);
    for (let i = 0; i < n; i++) {
      if (A[i].length !== n) {
        return falha('A', `A tem ${n} linhas, mas a linha ${i + 1} tem ${A[i].length} valores (A precisa ser quadrada)`, i + 1);
      }
    }
    // ---- b
    if (textoVazio(textoB)) return falha('b', 'b está vazio', null, null, n);
    const variasLinhas = String(textoB).split(/\r?\n/).filter((l) => l.trim() !== '').length > 1;
    const gB = lerGradeTexto(textoB, variasLinhas || temTabOuPontoVirgula(textoB));
    if (gB.invalido) {
      const e = gB.invalido;
      const pos = variasLinhas ? e.linha : e.coluna; // posição do valor dentro de b
      if (e.vazia) return falha('b', `Valor vazio em b, posição ${pos}`, e.linha, e.coluna, n);
      return falha('b', `Valor inválido em b, posição ${pos}: "${e.celula}"`, e.linha, e.coluna, n);
    }
    if (variasLinhas) {
      const k = gB.matriz.findIndex((l) => l.length !== 1);
      if (k >= 0) {
        return falha('b', `b deve ter um valor por linha (ou todos numa linha só); a linha ${k + 1} tem ${gB.matriz[k].length} valores.`, k + 1, null, n);
      }
    }
    const b = [].concat(...gB.matriz);
    if (b.length !== n) return falha('b', `A é ${n}×${n}, então b precisa ter ${n} valores; encontrei ${b.length}`, null, null, n);
    return { A, b, n, erro: null, codigoErro: null, campo: null, linha: null, coluna: null };
  };

  /**
   * Gera um sistema A·x = b de ordem n (2..100) com solução inteira conhecida.
   * x: inteiros em [−5, 5]; A: inteiros em [−3, 3] fora da diagonal e diagonal
   * estritamente dominante (bem condicionada); b = A·x (inteiro).
   * semente opcional ⇒ resultado reprodutível (PRNG mulberry32).
   */
  Metodos.gerarSistema = function (n, semente) {
    n = Math.floor(Number(n));
    if (!(n >= 2 && n <= 100)) throw new Error('n deve estar entre 2 e 100.');
    let estado = (semente == null ? Math.floor(Math.random() * 2 ** 32) : Number(semente)) >>> 0;
    const aleatorio = function () { // mulberry32: número em [0, 1)
      estado = (estado + 0x6D2B79F5) >>> 0;
      let t = estado;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const inteiro = (min, max) => min + Math.floor(aleatorio() * (max - min + 1));
    const x = Array.from({ length: n }, () => inteiro(-5, 5));
    const A = [];
    for (let i = 0; i < n; i++) {
      const linha = Array.from({ length: n }, () => inteiro(-3, 3));
      linha[i] = 0;
      const somaFora = linha.reduce((s, v) => s + Math.abs(v), 0);
      linha[i] = (somaFora + inteiro(1, 5)) * (aleatorio() < 0.5 ? -1 : 1);
      A.push(linha);
    }
    const b = A.map((linha) => linha.reduce((s, a, j) => s + a * x[j], 0));
    return { A, b, x };
  };

  Metodos.validacao = { bisseccao: validarBisseccao, newton: validarNewton, gauss: validarGauss };
  Metodos.executar = { bisseccao: executarBisseccao, newton: executarNewton, gauss: executarGauss };
  if (typeof module !== 'undefined' && module.exports) module.exports = Metodos;
})(typeof window !== 'undefined' ? window : globalThis);
