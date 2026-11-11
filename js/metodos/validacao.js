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
    if (typeof v === 'number') {
      if (!Number.isFinite(v)) falhar('ENTRADA_INVALIDA', `"${rotulo}" deve ser um número finito.`);
      return v;
    }
    const r = Metodos.analisarNumero(v);
    if (!r.ok) {
      const pos = r.posicao != null ? ` (posição ${r.posicao + 1})` : '';
      falhar('ENTRADA_INVALIDA', `"${rotulo}": ${r.erro}${pos}.`);
    }
    return r.valor;
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
    avisar(avisos, 'CRITERIO_RELATIVO_PERTO_DE_ZERO', (p.c != null ? `Erro relativo indefinido (c${p.k} ≈ 0); a parada usou |c${p.k} − c${p.k - 1}| = ${F(p.erroCriterio)} < ε = ${F(tol)}.` : `Erro relativo indefinido (x${p.k + 1} ≈ 0); a parada usou |x${p.k + 1} − x${p.k}| = ${F(p.erroCriterio)} < ε = ${F(tol)}.`));
  }
  const finito = Number.isFinite;

  /** Parada numérica e garantia matemática são campos diferentes. raizCertificada fica falso: precisão dupla não prova raiz. */
  function camposDeParada(motivo, base) {
    const zero = motivo === 'ZERO_PRECISAO_DUPLA';
    const intervalo = motivo === 'PARADA_INTERVALO';
    let parada = 'outra';
    if (zero) parada = 'zero_precisao_dupla';
    else if (intervalo) parada = 'intervalo';
    else if (motivo === 'NAO_CONVERGIU' || motivo === 'MAX_ITERACOES') parada = 'limite_iteracoes';
    else if (motivo === 'TOLERANCIA') parada = 'tolerancia_passo';
    else if (/^DERIVADA_/.test(motivo || '')) parada = 'derivada';
    else if (motivo === 'FUNCAO_NAO_DEFINIDA') parada = 'dominio_ou_faixa';
    else if (motivo === 'DIVERGENCIA') parada = 'divergencia';
    else if (motivo === 'OSCILACAO') parada = 'oscilacao';
    return Object.assign({}, base, {
      motivo, zeroObservado: zero, raizCertificada: false, garantiaMatematica: false,
      parada, hipotese: intervalo ? 'continuidade' : null,
    });
  }

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
    // Sem multiplicar: f = 1e−200 tem o mesmo sinal nos dois extremos, mas o produto vira 0.
    if (fa !== 0 && fb !== 0 && (fa < 0) === (fb < 0)) falhar('SEM_TROCA_DE_SINAL', `f(a) e f(b) têm o mesmo sinal: f(${fmt(a)}) = ${fmt(fa)} e f(${fmt(b)}) = ${fmt(fb)}. Escolha um intervalo onde f troque de sinal.`);
    return { f, a, b, fa, fb, tol, maxIter, criterio };
  }

  function executarBisseccao(p) {
    return executarComSeguranca(function (avisos) {
      const v = validarBisseccao(p, avisos);
      // BUG-29: log2((b−a)/tol) só vale para o critério absoluto; no relativo, null.
      const iteracoesEstimadas = v.criterio === 'relativo' ? null : Math.max(0, Math.ceil(Math.log2((v.b - v.a) / v.tol)));
      if (v.fa === 0 || v.fb === 0) {
        const raiz = v.fa === 0 ? v.a : v.b;
        avisar(avisos, 'ZERO_PRECISAO_DUPLA', `Zero observado em precisão dupla no extremo x = ${fmt(raiz)}: f vale 0 nessa aritmética. É a parada do método, não uma certificação matemática de raiz.`);
        return { passos: [], resultado: camposDeParada('ZERO_PRECISAO_DUPLA', { raiz, fRaiz: 0, iteracoes: 0, convergiu: true, iteracoesEstimadas: null, criterio: v.criterio, tol: v.tol }), erro: null, codigoErro: null };
      }
      const r = Metodos.bisseccao(v.f, v.a, v.b, v.tol, v.maxIter, v.criterio);
      avisarFallback(avisos, r.passos, v.tol, r.motivo);
      const ruim = r.passos.findIndex((s) => !finito(s.fc));
      if (ruim >= 0) {
        const passos = r.passos.slice(0, ruim);
        return { passos, resultado: null, erro: `f(c) não é finito em c = ${fmt(r.passos[ruim].c)} (função não definida ali).`, codigoErro: 'FUNCAO_NAO_DEFINIDA' };
      }
      const zeroObservado = r.motivo === 'ZERO_PRECISAO_DUPLA';
      const resultado = camposDeParada(r.motivo, {
        raiz: r.raiz, fRaiz: v.f(r.raiz), iteracoes: r.passos.length, convergiu: zeroObservado || r.motivo === 'TOLERANCIA',
        iteracoesEstimadas, criterio: v.criterio, tol: v.tol,
      });
      if (zeroObservado) {
        avisar(avisos, 'ZERO_PRECISAO_DUPLA', `Zero observado em precisão dupla em x = ${fmt(r.raiz)}: f vale 0 nessa aritmética. É a parada do método, não uma certificação matemática de raiz.`);
        return { passos: r.passos, resultado, erro: null, codigoErro: null };
      }
      if (r.motivo === 'TOLERANCIA' && pareceCrescimentoDeModulo(r.passos, v.fa, v.fb)) {
        const u = r.passos[r.passos.length - 1];
        avisar(avisos, 'MODULO_CRESCEU', `Possível descontinuidade (polo): |f(c)| não diminuiu enquanto o intervalo encolhia (f(c) = ${fmt(u.fc)} em c = ${String(+u.c.toPrecision(10)).replace('.', ',').replace('-', '−')}). Confira o gráfico: aí c pode não ser raiz.`);
      }
      if (!r.convergiu) {
        const msg = v.maxIter === 1
          ? 'Com apenas 1 iteração o intervalo só foi cortado uma vez e a tolerância não foi atingida. Aumente o máximo de iterações ou afrouxe a tolerância.'
          : 'Máximo de iterações atingido sem atingir a tolerância. Aumente o máximo de iterações ou afrouxe a tolerância.';
        return { passos: r.passos, resultado, erro: msg, codigoErro: 'NAO_CONVERGIU' };
      }
      return { passos: r.passos, resultado, erro: null, codigoErro: null };
    });
  }

  /**
   * Observação auxiliar, não um detector de descontinuidade. A parada por intervalo
   * já é condicional à continuidade mesmo quando isto não dispara.
   */
  function pareceCrescimentoDeModulo(passos, fa0, fb0) {
    // Função contínua: |f(c)| cai junto com o intervalo. Se, após ≥ 3 cortes, |f(c)| final
    // ainda é ≥ max(|f(a)|, |f(b)|) iniciais, |f| não encolheu: sinal de polo/salto.
    if (passos.length < 3) return false;
    return Math.abs(passos[passos.length - 1].fc) >= Math.max(Math.abs(fa0), Math.abs(fb0));
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
    if (!finito(f(x0)) || !finito(df(x0))) falhar('FUNCAO_NAO_DEFINIDA', mensagemForaDeX0(f, df, x0));
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

  const MENSAGENS_NEWTON = {
    DERIVADA_ZERO: (x) => `f′(x) = 0, ou f/f′ não é finito, em x = ${fmt(x)}: o passo de Newton não pode ser calculado. Tente outro x0.`,
    DIVERGENCIA: () => 'O método divergiu (|x| ou o erro cresceu demais). Tente um x0 mais perto da raiz.',
    OSCILACAO: () => 'Os valores de x entraram em ciclo (oscilação) e não convergem. Tente outro x0.',
    NAO_CONVERGIU: (x, maxIter) => (maxIter === 1
      ? 'Foi dado apenas 1 passo de Newton e a tolerância não foi atingida. '
      : 'Máximo de iterações atingido sem convergir. ') + 'Aumente o máximo de iterações ou escolha um x0 mais perto da raiz.',
    FUNCAO_NAO_DEFINIDA: (x) => `f ou f' não está definida em x = ${fmt(x)} (o passo saiu do domínio de f). Tente outro x0.`,
    DERIVADA_NAO_FINITA: (x) => `Em x = ${fmt(x)}, f está definida, mas f' não é finita: a derivada explode, não é uma tangente horizontal. Tente um x0 mais perto da raiz.`,
  };

  // Procura, na árvore de f, a operação que deixou f(x) indefinida e devolve a causa em palavras.
  function mensagemForaDeX0(f, df, x0) {
    const fx = f(x0), dfx = df(x0);
    if (!finito(fx)) {
      const causa = causaForaDoDominio(f.ast, x0);
      if (causa && /faixa|709/.test(causa)) {
        return `x0 = ${fmt(x0)}: exp(x) sai da faixa da precisão dupla (estoura perto de x = 709; o maior número finito é cerca de 1e308). Escolha um x0 menor.`;
      }
      if (causa && /negativ|zero|não definid/.test(causa)) {
        return `x0 = ${fmt(x0)} está fora do domínio de f (${causa}). Escolha um x0 dentro do domínio — logaritmo e raiz quadrada, por exemplo, pedem x > 0.`;
      }
      if (causa) return `x0 = ${fmt(x0)} está fora do domínio de f (${causa}). Escolha outro x0.`;
      return `f(x0) não é finita em x0 = ${fmt(x0)}: o valor saiu da faixa da precisão dupla (até cerca de 1e308; exp(x) estoura perto de x = 709). Escolha um x0 menor.`;
    }
    if (!finito(dfx)) {
      const formula = df.texto ? ` (f'(x) = ${df.texto})` : '';
      return `Em x0 = ${fmt(x0)}, f está definida, mas f' não é finita${formula}. O passo de Newton não pode ser calculado. Tente outro x0.`;
    }
    return `f ou f' não é finita em x0 = ${fmt(x0)}.`;
  }

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
      if (no.nome === 'exp') return 'exponencial fora da faixa (exp estoura perto de 709)';
      if (/^(asin|acos)$/.test(no.nome)) return `${no.nome} fora de [−1, 1]`;
      return `${no.nome} não definida nesse ponto`;
    }
    if (no.tipo === 'bin' && finito(val(no.esq)) && finito(val(no.dir)) && !finito(val(no))) {
      if (no.op === '/') return 'divisão por zero';
      if (no.op === '^') return 'potência não definida (base negativa com expoente não inteiro, ou 0 elevado a negativo)';
    }
    return null;
  }

  function mensagemLimiteNewton(v, passos) {
    const prefixo = v.maxIter === 1
      ? 'Foi dado apenas 1 passo de Newton e a tolerância não foi atingida. '
      : 'Máximo de iterações atingido sem convergir. ';
    const ult = passos[passos.length - 1];
    if (!ult || !Number.isFinite(ult.xNovo)) {
      return prefixo + 'Aumente o máximo de iterações ou escolha um x0 mais perto da raiz.';
    }
    const fv = Number.isFinite(ult.xNovo) ? v.f(ult.xNovo) : ult.fx;
    if (fv === 0) {
      return `${prefixo}Último x = ${fmt(ult.xNovo)}, f(x) = 0 em precisão dupla. Zero observado nessa aritmética, mas o critério de parada não foi atingido.`;
    }
    const dados = Number.isFinite(fv) ? `, f(x) = ${fmt(fv)}` : '';
    return `${prefixo}Último x = ${fmt(ult.xNovo)}${dados}${Number.isFinite(fv) ? ' ≠ 0' : ''} e o critério de parada não foi atingido. Aumente o máximo de iterações ou escolha outro x0.`;
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
          codigo = 'DERIVADA_NAO_FINITA';
        } else {
          const causa = causaForaDoDominio(v.f.ast, x) || 'f não está definida';
          erroDominio = `x${k} = ${F(x)} está fora do domínio de f (${causa}); tente um x0 mais perto da raiz.`;
          codigo = 'FUNCAO_NAO_DEFINIDA';
        }
        passos = passos.slice(0, ruim);
      }
      else if (r.motivo === 'MAX_ITERACOES') codigo = diagnosticarNewton(passos);
      else if (!r.convergiu) codigo = r.motivo;
      if (codigo === 'FUNCAO_NAO_DEFINIDA' && !erroDominio) {
        const x = r.raiz;
        const causa = causaForaDoDominio(v.f.ast, x);
        if (causa && /faixa|709/.test(causa)) erroDominio = `x = ${fmt(x)}: o passo saiu da faixa da precisão dupla (${causa}). Escolha um x0 menor ou mais perto da raiz.`;
        else erroDominio = `x = ${fmt(x)} está fora do domínio de f (${causa || 'f não está definida'}). Tente um x0 mais perto da raiz.`;
      }
      if (codigo === 'DERIVADA_NAO_FINITA' && !erroDominio) {
        const formula = v.tipoDerivada === 'numerica' ? '' : ` (f'(x) = ${v.derivadaTexto})`;
        erroDominio = `Em x = ${fmt(r.raiz)}, f está definida, mas f' não é finita${formula}; o passo de Newton não pode ser calculado. Tente um x0 mais perto da raiz.`;
      }
      // Salto grande: f'(x) pequena manda x para longe (|Δx| > 5·max(1, |x0|)). Avisa só o 1º.
      const escala = 5 * Math.max(1, Math.abs(v.x0));
      const salto = passos.find((s) => Math.abs(s.xNovo - s.x) > escala);
      if (salto) {
        const k = salto.k, F = Metodos.fmtBR;
        avisar(avisos, 'SALTO_GRANDE', `Salto grande na iteração ${k + 1}: |Δx| = ${F(Math.abs(salto.xNovo - salto.x))} (f/f′ = ${F(salto.fx / salto.dfx)}); x foi de ${F(salto.x)} para x${k + 1} = ${F(salto.xNovo)}.`);
      }
      if (r.motivo === 'ZERO_PRECISAO_DUPLA') {
        avisar(avisos, 'ZERO_PRECISAO_DUPLA', `Zero observado em precisão dupla em x = ${fmt(r.raiz)}: f vale 0 nessa aritmética. É a parada do método, não uma certificação matemática de raiz.`);
        if (v.df(r.raiz) === 0) {
          avisar(avisos, 'ZERO_E_DERIVADA', `f e f' também valem 0 em precisão dupla em x = ${fmt(r.raiz)}. Isso não prova multiplicidade matemática: pode ser arredondamento, underflow ou a derivada calculada.`);
        }
      }
      avisarFallback(avisos, passos, v.tol, r.motivo);
      const resultado = camposDeParada(codigo || r.motivo, {
        raiz: /^(DIVERGENCIA|FUNCAO_NAO_DEFINIDA|DERIVADA_NAO_FINITA)$/.test(codigo) ? null : r.raiz,
        fRaiz: finito(r.raiz) ? v.f(r.raiz) : null, iteracoes: passos.length, convergiu: r.convergiu && !codigo,
        criterio: v.criterio, tol: v.tol, derivadaNumerica: v.tipoDerivada === 'numerica', tipoDerivada: v.tipoDerivada, derivadaTexto: v.derivadaTexto,
      });
      let erro = codigo ? (erroDominio || MENSAGENS_NEWTON[codigo](r.raiz, v.maxIter)) : null;
      if (codigo === 'NAO_CONVERGIU') erro = mensagemLimiteNewton(v, passos);
      return { passos, resultado, erro, codigoErro: codigo };
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

  const norma = (v) => Metodos.norma2(v);
  // Resíduo relativo ||A·x − b|| / ||b|| (se b = 0, devolve ||A·x − b||).
  function residuoRelativo(A, b, x) {
    const abs = residuoAbsoluto(A, b, x);
    if (abs == null) return null;
    const nb = norma(b);
    return nb ? abs / nb : abs;
  }

  function validarGauss(p) {
    let A, b;
    if (Array.isArray(p.matriz)) { // formato do site: matriz aumentada n×(n+1)
      A = p.matriz.map((l) => (Array.isArray(l) ? l.slice(0, -1) : l));
      b = p.matriz.map((l) => (Array.isArray(l) ? l[l.length - 1] : NaN));
    } else { A = p.A; b = p.b; }
    if (!Array.isArray(A) || A.length < 1 || !A.every(Array.isArray)) falhar('ENTRADA_INVALIDA', 'Informe a matriz do sistema.');
    const n = A.length;
    if (n < Metodos.N_MIN || n > Metodos.N_MAX) falhar('ENTRADA_INVALIDA', Metodos.msgTamanhoN(n));
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

  // Estimativa de cond₁ (Hager/Higham sobre a LU). Limiar 1e8: acima disso,
  // cond·ε come metade ou mais dos ~16 algarismos. null = não deu para estimar.
  const LIMIAR_COND = 1e8;
  const MSG_COND_FALHOU = 'Não foi possível estimar a condição nesta escala numérica.';
  function contarTrocas(passos) {
    const t = { total: 0, obrigatorias: 0, recomendadas: 0, classicas: 0 };
    const chave = { obrigatoria: 'obrigatorias', recomendada: 'recomendadas', classica: 'classicas' };
    for (const s of passos) {
      if ((s.tipo === 'pivo' || s.tipo === 'coluna') && s.pivo && s.pivo.troca) { t.total++; t[chave[s.pivo.troca.tipo]]++; }
    }
    return t;
  }
  // Posto de A e de [A|b] num único escalonamento, com linhas equilibradas (max |a_ij| = 1).
  // Quase singular (pivô só "pequeno", não estruturalmente nulo) não vira "infinitas soluções".
  function classificarPosto(A, b) {
    const n = A.length;
    let estruturalInconsistente = false;
    const M = A.map((lin, i) => {
      let s = 0;
      for (let j = 0; j < n; j++) s = Math.max(s, Math.abs(lin[j]));
      if (!(s > 0)) {
        if (b[i] !== 0 && Number.isFinite(b[i])) estruturalInconsistente = true;
        return new Array(n + 1).fill(0);
      }
      const row = lin.map((v) => v / s);
      row.push(b[i] / s);
      return row;
    });
    const tol = n * Number.EPSILON * 8;
    let rank = 0, maiorDescartado = 0;
    for (let c = 0; c < n && rank < n; c++) {
      let p = rank, best = Math.abs(M[rank][c]);
      for (let i = rank + 1; i < n; i++) {
        const a = Math.abs(M[i][c]);
        if (a > best) { best = a; p = i; }
      }
      if (!(best > tol)) { if (best > maiorDescartado) maiorDescartado = best; continue; }
      if (p !== rank) { const tmp = M[rank]; M[rank] = M[p]; M[p] = tmp; }
      const piv = M[rank][c];
      for (let i = rank + 1; i < n; i++) {
        const f = M[i][c] / piv;
        if (!Number.isFinite(f)) { estruturalInconsistente = true; break; }
        for (let j = c; j <= n; j++) M[i][j] -= f * M[rank][j];
        M[i][c] = 0;
      }
      rank++;
    }
    let maiorB = 0;
    for (let i = rank; i < n; i++) maiorB = Math.max(maiorB, Math.abs(M[i][n] || 0));
    const inteira = A.every((lin) => lin.every((v) => Number.isInteger(v) && Math.abs(v) <= Number.MAX_SAFE_INTEGER))
      && b.every((v) => Number.isInteger(v) && Math.abs(v) <= Number.MAX_SAFE_INTEGER);
    // Dependência exata de entradas inteiras deixa só poeira de arredondamento.
    // 1+2e−16 não é inteiro: continua quase singular.
    if (inteira && maiorDescartado < 1e-8 && maiorB < 1e-8) maiorDescartado = 0;
    const postoA = rank;
    const bSignificativo = estruturalInconsistente || maiorB > tol;
    const postoAug = Math.min(n, bSignificativo ? postoA + 1 : postoA);
    let classificacao;
    if (postoA < postoAug) classificacao = 'impossivel';
    else if (maiorDescartado > 0) classificacao = 'quase_singular';
    else classificacao = 'infinitas_solucoes';
    return { postoA, postoAug, classificacao };
  }
  function residuoAbsoluto(A, b, x) {
    const r = [];
    for (let i = 0; i < A.length; i++) {
      let s = -b[i];
      if (!Number.isFinite(s)) return null;
      for (let j = 0; j < x.length; j++) {
        const p = A[i][j] * x[j];
        if (!Number.isFinite(p)) return null;
        s += p;
      }
      if (!Number.isFinite(s)) return null;
      r.push(s);
    }
    const nrm = Metodos.norma2(r);
    return Number.isFinite(nrm) ? nrm : null;
  }
  function aplicarCondicao(avisos, A, r) {
    const condicao = r && Object.prototype.hasOwnProperty.call(r, 'condicaoPronta')
      ? r.condicaoPronta
      : ((r.mult && r.U && r.ordem) ? Metodos.estimarCondicao1(A, r.U, r.mult, r.ordem) : null);
    if (condicao == null) avisar(avisos, 'CONDICAO_INDISPONIVEL', MSG_COND_FALHOU);
    else if (!(condicao <= LIMIAR_COND)) {
      const F = Metodos.fmtBR;
      const perda = F(Math.min(1, condicao * Number.EPSILON));
      avisar(avisos, 'MAL_CONDICIONADA', `Matriz mal condicionada: cond₁ estimada ≈ ${F(condicao)} > 1,000e+8. O erro relativo em x pode chegar a cond·ε ≈ ${perda}, mesmo com resíduo pequeno.`);
    }
    return condicao;
  }
  function executarGaussOperacao(v, gran, avisos, pronto) {
      const n = v.A.length;
      const r = pronto || Metodos.gauss(v.A, v.b, v.pivoteamento, gran);
      if (r.motivo === 'FORA_DA_FAIXA') {
        return {
          passos: r.passos, resultado: { x: null, classificacao: 'fora_da_faixa', pivoteamento: v.pivoteamento },
          codigoErro: 'FORA_DA_FAIXA',
          erro: 'Um valor intermediário saiu da faixa da precisão dupla; x não foi calculado. Reescale A e b para uma faixa mais moderada.',
        };
      }
      if (r.motivo === 'PIVO_ZERO_SEM_TROCA') {
        const k = r.coluna + 1;
        return {
          passos: r.passos, resultado: { x: null, coluna: r.coluna, pivoteamento: 'nunca' }, codigoErro: 'PIVO_ZERO_SEM_TROCA',
          erro: `Pivô a${k}${k} = 0 e o modo “nunca” não permite trocar linhas: ative o pivoteamento (automático ou sempre).`,
        };
      }
      if (r.motivo === 'MATRIZ_SINGULAR') {
        const cls = classificarPosto(v.A, v.b);
        if (cls.classificacao === 'impossivel') avisar(avisos, 'SISTEMA_IMPOSSIVEL', 'posto(A) < posto([A | b]): as equações se contradizem.');
        else if (cls.classificacao === 'infinitas_solucoes') avisar(avisos, 'SISTEMA_INDETERMINADO', 'posto(A) = posto([A | b]) < n: há variáveis livres.');
        const texto = cls.classificacao === 'impossivel'
          ? 'O sistema é impossível (não tem solução).'
          : cls.classificacao === 'quase_singular'
            ? 'A matriz é numericamente quase singular (pivô abaixo da tolerância relativa à escala da linha). Quase singularidade não prova que existam infinitas soluções.'
            : 'Compatível dentro da precisão numérica: infinitas soluções prováveis.';
        if (cls.classificacao === 'quase_singular') avisar(avisos, 'QUASE_SINGULAR', `Matriz numericamente quase singular: nenhum pivô acima da tolerância numérica na coluna ${r.coluna + 1}.`);
        return {
          passos: r.passos, resultado: { x: null, classificacao: cls.classificacao, postoA: cls.postoA, postoAumentada: cls.postoAug },
          erro: (cls.classificacao === 'quase_singular' ? `Nenhum pivô acima da tolerância numérica na coluna ${r.coluna + 1}. ` : `Sistema singular: não há pivô não nulo na coluna ${r.coluna + 1}. `) + texto,
          codigoErro: 'MATRIZ_SINGULAR',
        };
      }
      const diag = r.diag || (Metodos.matrizDoPasso(r.passos[r.passos.length - 1]) || []).map((l, i) => l[i]);
      const trocas = contarTrocas(r.passos);
      let determinante = trocas.total % 2 ? -1 : 1;
      for (let i = 0; i < n; i++) determinante *= diag[i];
      if (!Number.isFinite(determinante)) determinante = null;
      const residuo = residuoAbsoluto(v.A, v.b, r.x);
      if (residuo == null) avisar(avisos, 'RESIDUO_INDISPONIVEL', 'Não foi possível calcular o resíduo nesta escala numérica.');
      const condicao = aplicarCondicao(avisos, v.A, r);
      const resultado = { x: r.x, determinante, residuo, trocas, classificacao: 'unica', pivoteamento: v.pivoteamento, condicao, condicaoEstimada: condicao != null };
      if (v.pivoteamento === 'nunca') {
        // Referência sem histórico. Se o motor assíncrono já resolveu, não refaz na thread da página.
        const refX = r.refX || (Metodos.gauss(v.A, v.b, 'sempre', 'nenhum').x);
        const ref = { x: refX };
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
          const erroTxt = resultado.comparacao ? `; diferença relativa para a solução com pivoteamento parcial: ${fmt(resultado.comparacao.semPivo.erro)}` : '';
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
        const lido = Metodos.analisarNumero(celulas[j]);
        if (!lido.ok) return { invalido: { linha: i + 1, coluna: j + 1, celula: celulas[j], vazia: false, posicao: lido.posicao, erro: lido.erro } };
        linha.push(lido.valor);
      }
      matriz.push(linha);
    }
    return { matriz };
  }
  Metodos.lerBlocoTexto = function (texto) { return lerGradeTexto(texto, temTabOuPontoVirgula(texto)); };
  const textoVazio = (t) => String(t == null ? '' : t).trim() === '';
  const temTabOuPontoVirgula = (t) => /[\t;]/.test(String(t == null ? '' : t));

  Metodos.lerMatrizTexto = function (texto) {
    const falha = (m) => ({ matriz: null, A: null, b: null, linhas: 0, colunas: 0, erro: m, codigoErro: 'MATRIZ_TEXTO_INVALIDA' });
    if (textoVazio(texto)) return falha('Cole ao menos uma linha de números.');
    const g = lerGradeTexto(texto, temTabOuPontoVirgula(texto));
    if (g.invalido) {
      const e = g.invalido;
      if (e.vazia) return falha(`Linha ${e.linha}, coluna ${e.coluna} vazia.`);
      const pos = e.posicao != null ? ` (posição ${e.posicao + 1} na célula)` : '';
      return falha(`Linha ${e.linha}, coluna ${e.coluna}: "${e.celula}" ${e.erro || 'não é um número'}${pos}.`);
    }
    const matriz = g.matriz;
    const colunas = matriz[0].length, linhas = matriz.length;
    if (matriz.some((l) => l.length !== colunas)) return falha('Todas as linhas devem ter o mesmo número de colunas.');
    if (linhas < Metodos.N_MIN || linhas > Metodos.N_MAX) return falha(Metodos.msgTamanhoN(linhas));
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
      const posA = e.posicao != null ? ` (posição ${e.posicao + 1})` : '';
      return falha('A', `Valor inválido em A, linha ${e.linha}, coluna ${e.coluna}: "${e.celula}"${e.erro ? ' — ' + e.erro : ''}${posA}`, e.linha, e.coluna);
    }
    const A = gA.matriz, n = A.length;
    if (n < Metodos.N_MIN || n > Metodos.N_MAX) return falha('A', Metodos.msgTamanhoN(n));
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
    const bruto = Number(n);
    if (!Number.isInteger(bruto)) throw new Error('n deve ser um inteiro entre ' + Metodos.faixaN() + '.');
    n = bruto;
    if (!(n >= Metodos.N_MIN && n <= Metodos.N_MAX)) throw new Error('n deve ser um inteiro entre ' + Metodos.faixaN() + '.');
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

  Metodos.apresentarMotor = function (params, exp) {
    if (Array.isArray(params)) params = { A: params, b: exp && exp.b };
    params = params || {};
    return executarComSeguranca(function (avisos) {
      const v = validarGauss(params);
      const montado = Metodos.passosDeMotor(v.A, v.b, exp || {});
      const pronto = {
        passos: montado.passos, x: exp.x, motivo: exp.motivo, coluna: exp.coluna,
        diag: exp.diag, mult: exp.mult, ordem: exp.ordem, U: exp.U,
        condicaoPronta: exp.condicao, historico: montado.historico, refX: exp.refX,
      };
      const r0 = executarGaussOperacao(v, 'coluna', avisos, pronto);
      avisar(avisos, 'MODO_COLUNA', 'Modo por coluna: um passo por coluna de pivô (matriz grande).');
      if (r0.resultado) r0.resultado.granularidade = 'coluna';
      return r0;
    });
  };
  Metodos.validacao = { bisseccao: validarBisseccao, newton: validarNewton, gauss: validarGauss };
  Metodos.executar = { bisseccao: executarBisseccao, newton: executarNewton, gauss: executarGauss };
  if (typeof module !== 'undefined' && module.exports) module.exports = Metodos;
})(typeof window !== 'undefined' ? window : globalThis);
