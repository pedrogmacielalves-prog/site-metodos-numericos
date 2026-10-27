(function (g) {
  'use strict';
  // Erro com código estável, para a interface tratar cada caso.
  class ErroNumerico extends Error {
    constructor(codigo, mensagem, detalhes = {}) {
      super(mensagem);
      this.name = 'ErroNumerico';
      this.codigo = codigo;
      this.mensagem = mensagem;
      this.detalhes = detalhes;
    }
  }

// js/expressao.js — Parser SEGURO de expressões matemáticas (sem eval, new Function ou with).
// Tokenizador + parser descendente recursivo que gera uma AST.
//
// Gramática (do menor para o maior nível de precedência):
//   expressao := termo (('+' | '-') termo)*
//   termo     := unario (('*' | '/') unario | <implícita> potencia)*
//   unario    := ('-' | '+') unario | potencia
//   potencia  := primario ('^' unario)?        (associativa à direita)
//   primario  := numero | 'x' | constante | funcao '(' expressao ')' | '(' expressao ')'
//
// Assim, -x^2 = -(x^2) e 2^3^2 = 2^(3^2).
//
// Nós da AST:
//   {tipo:'num', valor} | {tipo:'var', nome:'x'} | {tipo:'const', nome:'pi'|'e'}
//   {tipo:'neg', arg} | {tipo:'bin', op:'+'|'-'|'*'|'/'|'^', esq, dir}
//   {tipo:'func', nome, arg}


const LIMITE_CARACTERES = 300;
const LIMITE_PROFUNDIDADE = 60;

const CONSTANTES = { pi: Math.PI, e: Math.E };

const FUNCOES = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan,
  asin: Math.asin, acos: Math.acos, atan: Math.atan,
  sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
  exp: Math.exp, ln: Math.log, log: Math.log10, log10: Math.log10, log2: Math.log2,
  sqrt: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs,
};
const ALIASES = { sen: 'sin', tg: 'tan' };

// Usa Object.hasOwn para que nomes como 'constructor' ou '__proto__' NUNCA sejam aceitos.
const tem = (obj, k) => Object.prototype.hasOwnProperty.call(obj, k);

function erroSintaxe(mensagem, posicao, expr) {
  const seta = expr != null ? `\n  ${expr}\n  ${' '.repeat(Math.max(0, posicao))}^` : '';
  return new ErroNumerico('ERRO_SINTAXE', `${mensagem} (posição ${posicao + 1})${seta}`, { posicao, mensagemCurta: mensagem });
}

// ---------------------------------------------------------------- Tokenizador
function tokenizar(expr) {
  const tokens = [];
  let i = 0;
  expr = expr.replace(/\*\*/g, "^").replace(/²/g, "^2");
  while (i < expr.length) {
    const c = expr[i];
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') { i++; continue; }
    if (c === ',') {
      throw erroSintaxe('Vírgula não é aceita: use ponto como separador decimal (ex.: 2.5 em vez de 2,5)', i, expr);
    }
    if ((c >= '0' && c <= '9') || c === '.') {
      const ini = i;
      while (i < expr.length && /[0-9]/.test(expr[i])) i++;
      if (expr[i] === '.') { i++; while (i < expr.length && /[0-9]/.test(expr[i])) i++; }
      const corpo = expr.slice(ini, i);
      if (corpo === '.' ) throw erroSintaxe('Ponto solto: esperava um número como 0.5', ini, expr);
      if (expr[i] === '.') throw erroSintaxe('Número com mais de um ponto decimal', i, expr);
      // notação científica: 1e-3, 2E5 (só se depois do 'e' vier dígito ou sinal+dígito)
      if ((expr[i] === 'e' || expr[i] === 'E') && /^[eE][+-]?[0-9]/.test(expr.slice(i, i + 3))) {
        i++;
        if (expr[i] === '+' || expr[i] === '-') i++;
        while (i < expr.length && /[0-9]/.test(expr[i])) i++;
      }
      const texto = expr.slice(ini, i);
      const valor = Number(texto);
      if (!Number.isFinite(valor)) throw erroSintaxe(`Número inválido ou grande demais: "${texto}"`, ini, expr);
      tokens.push({ tipo: 'num', valor, pos: ini, texto });
      continue;
    }
    if (/[a-zA-Z_]/.test(c)) {
      const ini = i;
      while (i < expr.length && /[a-zA-Z_0-9]/.test(expr[i])) i++;
      // permite "log2", mas separa "x2"? Mantemos o identificador inteiro e validamos depois.
      tokens.push({ tipo: 'id', valor: expr.slice(ini, i).toLowerCase(), pos: ini });
      continue;
    }
    if ('+-*/^()'.includes(c)) { tokens.push({ tipo: 'op', valor: c, pos: i }); i++; continue; }
    if (c === '×' || c === '·') { tokens.push({ tipo: 'op', valor: '*', pos: i }); i++; continue; }
    if (c === '−') { tokens.push({ tipo: 'op', valor: '-', pos: i }); i++; continue; }
    throw erroSintaxe(`Caractere não permitido: "${c}"`, i, expr);
  }
  tokens.push({ tipo: 'fim', pos: expr.length });
  return tokens;
}

// ---------------------------------------------------------------- Parser
class Parser {
  constructor(expr) {
    this.expr = expr;
    this.tokens = tokenizar(expr);
    this.i = 0;
    this.prof = 0;
  }
  atual() { return this.tokens[this.i]; }
  ehOp(v) { const t = this.atual(); return t.tipo === 'op' && t.valor === v; }
  entrar() {
    if (++this.prof > LIMITE_PROFUNDIDADE) {
      throw new ErroNumerico('EXPRESSAO_PROFUNDA_DEMAIS', `A expressão tem aninhamento demais (limite: ${LIMITE_PROFUNDIDADE} níveis).`, { limite: LIMITE_PROFUNDIDADE });
    }
  }
  sair() { this.prof--; }

  analisar() {
    if (this.atual().tipo === 'fim') throw erroSintaxe('A expressão está vazia', 0, this.expr);
    const ast = this.expressao();
    const t = this.atual();
    if (t.tipo !== 'fim') {
      if (t.tipo === 'op' && t.valor === ')') throw erroSintaxe('Parêntese ")" sem o "(" correspondente', t.pos, this.expr);
      throw erroSintaxe('Símbolo inesperado depois do fim da expressão', t.pos, this.expr);
    }
    return ast;
  }
  expressao() {
    this.entrar();
    let no = this.termo();
    while (this.ehOp('+') || this.ehOp('-')) {
      const op = this.atual().valor; this.i++;
      no = { tipo: 'bin', op, esq: no, dir: this.termo() };
    }
    this.sair();
    return no;
  }
  iniciaPrimario() {
    const t = this.atual();
    return t.tipo === 'num' || t.tipo === 'id' || (t.tipo === 'op' && t.valor === '(');
  }
  termo() {
    this.entrar();
    let no = this.unario();
    for (;;) {
      if (this.ehOp('*') || this.ehOp('/')) {
        const op = this.atual().valor; this.i++;
        no = { tipo: 'bin', op, esq: no, dir: this.unario() };
      } else if (this.iniciaPrimario()) {
        // multiplicação implícita: 2x, 3(x+1), 2pi, (x+1)(x-1)
        if (this.atual().tipo === 'num') {
          throw erroSintaxe('Número logo após outro termo: use "*" explicitamente', this.atual().pos, this.expr);
        }
        no = { tipo: 'bin', op: '*', esq: no, dir: this.potencia() };
      } else break;
    }
    this.sair();
    return no;
  }
  unario() {
    this.entrar();
    let no;
    if (this.ehOp('-')) { this.i++; no = { tipo: 'neg', arg: this.unario() }; }
    else if (this.ehOp('+')) { this.i++; no = this.unario(); }
    else no = this.potencia();
    this.sair();
    return no;
  }
  potencia() {
    this.entrar();
    let no = this.primario();
    if (this.ehOp('^')) { this.i++; no = { tipo: 'bin', op: '^', esq: no, dir: this.unario() }; }
    this.sair();
    return no;
  }
  primario() {
    const t = this.atual();
    if (t.tipo === 'num') { this.i++; return { tipo: 'num', valor: t.valor }; }
    if (t.tipo === 'op' && t.valor === '(') {
      this.i++;
      const no = this.expressao();
      if (!this.ehOp(')')) throw erroSintaxe('Faltou fechar o parêntese ")"', this.atual().pos, this.expr);
      this.i++;
      return no;
    }
    if (t.tipo === 'id') {
      this.i++;
      const nome = tem(ALIASES, t.valor) ? ALIASES[t.valor] : t.valor;
      if (nome === 'x') return { tipo: 'var', nome: 'x' };
      if (tem(CONSTANTES, nome)) return { tipo: 'const', nome };
      if (tem(FUNCOES, nome)) {
        if (!this.ehOp('(')) throw erroSintaxe(`A função "${t.valor}" precisa de parênteses, ex.: ${t.valor}(x)`, this.atual().pos, this.expr);
        this.i++;
        const arg = this.expressao();
        if (!this.ehOp(')')) throw erroSintaxe(`Faltou fechar o parêntese da função "${t.valor}"`, this.atual().pos, this.expr);
        this.i++;
        return { tipo: 'func', nome, arg };
      }
      throw erroSintaxe(`Nome desconhecido: "${t.valor}". Use x, pi, e ou funções como sin, cos, exp, ln, sqrt`, t.pos, this.expr);
    }
    if (t.tipo === 'fim') throw erroSintaxe('A expressão terminou cedo: falta um número, x ou "("', t.pos, this.expr);
    if (t.tipo === 'op' && t.valor === ')') throw erroSintaxe('Parêntese ")" inesperado: falta algo antes dele', t.pos, this.expr);
    throw erroSintaxe(`Operador "${t.valor}" fora de lugar: falta um valor antes dele`, t.pos, this.expr);
  }
}

function analisar(expr) {
  if (typeof expr !== 'string') throw new ErroNumerico('ENTRADA_INVALIDA', 'A expressão deve ser um texto.', {});
  if (expr.length > LIMITE_CARACTERES) {
    throw new ErroNumerico('EXPRESSAO_LONGA_DEMAIS', `A expressão tem ${expr.length} caracteres; o limite é ${LIMITE_CARACTERES}.`, { limite: LIMITE_CARACTERES });
  }
  return new Parser(expr).analisar();
}

// ---------------------------------------------------------------- Avaliação
function avaliarAst(no, x) {
  switch (no.tipo) {
    case 'num': return no.valor;
    case 'var': return x;
    case 'const': return CONSTANTES[no.nome];
    case 'neg': return -avaliarAst(no.arg, x);
    case 'func': return FUNCOES[no.nome](avaliarAst(no.arg, x));
    case 'bin': {
      const a = avaliarAst(no.esq, x), b = avaliarAst(no.dir, x);
      switch (no.op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/': return a / b;
        case '^': return Math.pow(a, b);
      }
    }
  }
  throw new ErroNumerico('ERRO_INTERNO', 'Nó de AST desconhecido.', { no });
}

/**
 * Compila uma expressão e devolve uma FUNÇÃO f(x) (compatível com o site),
 * com propriedades extras: f.ast, f.texto e f.avaliar.
 */
function compilar(expr) {
  const ast = analisar(expr);
  const f = (x) => avaliarAst(ast, x);
  f.ast = ast;
  f.texto = astParaTexto(ast);
  f.avaliar = f;
  return f;
}

/** Deriva uma expressão em texto: devolve a função f'(x) compilada (com .texto e .ast). */
function derivar(exprOuF) {
  const ast = typeof exprOuF === 'string' ? analisar(exprOuF) : exprOuF.ast;
  const astD = derivarSimbolicamente(ast);
  const df = (x) => avaliarAst(astD, x);
  df.ast = astD;
  df.texto = astParaTexto(astD);
  return df;
}

// ---------------------------------------------------------------- Texto
const PREC = { '+': 1, '-': 1, '*': 2, '/': 2, neg: 3, '^': 4 };

function precedencia(no) {
  if (no.tipo === 'bin') return PREC[no.op];
  if (no.tipo === 'neg') return PREC.neg;
  if (no.tipo === 'num' && no.valor < 0) return PREC.neg;
  return 5;
}

function textoNumero(v) {
  if (Number.isInteger(v) || Math.abs(v) >= 1e-4) return String(Number(v.toPrecision(15)));
  return String(v);
}

/** Converte AST em texto legível, com o mínimo de parênteses necessários. */
function astParaTexto(no) {
  switch (no.tipo) {
    case 'num': return textoNumero(no.valor);
    case 'var': return 'x';
    case 'const': return no.nome;
    case 'func': return `${no.nome}(${astParaTexto(no.arg)})`;
    case 'neg': {
      const s = astParaTexto(no.arg);
      return '-' + (precedencia(no.arg) < PREC['^'] ? `(${s})` : s);
    }
    case 'bin': {
      const p = PREC[no.op];
      let e = astParaTexto(no.esq), d = astParaTexto(no.dir);
      const pe = precedencia(no.esq), pd = precedencia(no.dir);
      if (no.op === '^') {
        if (pe <= p) e = `(${e})`;          // base: (a+b)^2, (-x)^2, (a^b)^c
        if (pd < p) d = `(${d})`;           // expoente: x^(n-1); x^y^z fica sem parênteses
      } else {
        if (pe < p) e = `(${e})`;
        if (pd < p || (pd === p && (no.op === '-' || no.op === '/'))) d = `(${d})`;
        if (no.dir.tipo === 'neg' || (no.dir.tipo === 'num' && no.dir.valor < 0)) d = `(${d})`;
      }
      const sep = no.op === '^' ? '^' : ` ${no.op} `;
      return e + sep + d;
    }
  }
  return '?';
}

// ---------------------------------------------------------------- Derivação simbólica
const num = (v) => ({ tipo: 'num', valor: v });
const ehNum = (n, v) => n.tipo === 'num' && (v === undefined || n.valor === v);
const fn = (nome, arg) => ({ tipo: 'func', nome, arg });

function iguais(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

function contemX(no) {
  switch (no.tipo) {
    case 'var': return true;
    case 'num': case 'const': return false;
    case 'neg': case 'func': return contemX(no.arg);
    case 'bin': return contemX(no.esq) || contemX(no.dir);
  }
  return false;
}

// Construtores com simplificação básica.
function neg(a) {
  if (ehNum(a)) return num(-a.valor);
  if (a.tipo === 'neg') return a.arg;
  return { tipo: 'neg', arg: a };
}
function soma(a, b) {
  if (ehNum(a, 0)) return b;
  if (ehNum(b, 0)) return a;
  if (ehNum(a) && ehNum(b)) return num(a.valor + b.valor);
  if (b.tipo === 'neg') return sub(a, b.arg);
  if (ehNum(b) && b.valor < 0) return sub(a, num(-b.valor));
  return { tipo: 'bin', op: '+', esq: a, dir: b };
}
function sub(a, b) {
  if (ehNum(b, 0)) return a;
  if (ehNum(a, 0)) return neg(b);
  if (ehNum(a) && ehNum(b)) return num(a.valor - b.valor);
  if (iguais(a, b)) return num(0);
  if (b.tipo === 'neg') return soma(a, b.arg);
  return { tipo: 'bin', op: '-', esq: a, dir: b };
}
function mul(a, b) {
  if (ehNum(a, 0) || ehNum(b, 0)) return num(0);
  if (ehNum(a, 1)) return b;
  if (ehNum(b, 1)) return a;
  if (ehNum(a, -1)) return neg(b);
  if (ehNum(b, -1)) return neg(a);
  if (ehNum(a) && ehNum(b)) return num(a.valor * b.valor);
  if (a.tipo === 'neg') return neg(mul(a.arg, b));
  if (b.tipo === 'neg') return neg(mul(a, b.arg));
  if (ehNum(b) && !ehNum(a)) return mul(b, a); // constante à esquerda: 2*x
  if (ehNum(a) && b.tipo === 'bin' && b.op === '*' && ehNum(b.esq)) return mul(num(a.valor * b.esq.valor), b.dir);
  if (iguais(a, b)) return pot(a, num(2));
  return { tipo: 'bin', op: '*', esq: a, dir: b };
}
function div(a, b) {
  if (ehNum(a, 0)) return num(0);
  if (ehNum(b, 1)) return a;
  if (ehNum(a) && ehNum(b) && b.valor !== 0 && Number.isInteger(a.valor / b.valor)) return num(a.valor / b.valor);
  if (iguais(a, b)) return num(1);
  if (a.tipo === 'neg') return neg(div(a.arg, b));
  return { tipo: 'bin', op: '/', esq: a, dir: b };
}
function pot(a, b) {
  if (ehNum(b, 0)) return num(1);
  if (ehNum(b, 1)) return a;
  if (ehNum(a) && ehNum(b)) { const v = Math.pow(a.valor, b.valor); if (Number.isInteger(v)) return num(v); }
  return { tipo: 'bin', op: '^', esq: a, dir: b };
}

/** Simplificação básica de uma AST qualquer (reconstrói com os construtores acima). */
function simplificar(no) {
  switch (no.tipo) {
    case 'neg': return neg(simplificar(no.arg));
    case 'func': return fn(no.nome, simplificar(no.arg));
    case 'bin': {
      const a = simplificar(no.esq), b = simplificar(no.dir);
      return { '+': soma, '-': sub, '*': mul, '/': div, '^': pot }[no.op](a, b);
    }
    default: return no;
  }
}

/** Devolve a AST da derivada d/dx (já simplificada). */
function derivarSimbolicamente(ast) {
  return simplificar(derivarNo(ast));
}

function derivarNo(no) {
  switch (no.tipo) {
    case 'num': case 'const': return num(0);
    case 'var': return num(1);
    case 'neg': return neg(derivarNo(no.arg));
    case 'bin': {
      const u = no.esq, v = no.dir, du = derivarNo(u), dv = derivarNo(v);
      switch (no.op) {
        case '+': return soma(du, dv);
        case '-': return sub(du, dv);
        case '*': return soma(mul(du, v), mul(u, dv));
        case '/': return div(sub(mul(du, v), mul(u, dv)), pot(v, num(2)));
        case '^':
          if (!contemX(v)) return mul(mul(v, pot(u, sub(v, num(1)))), du);       // n·u^(n−1)·u'
          if (!contemX(u)) return mul(mul(no, fn('ln', u)), dv);                 // a^v·ln(a)·v'
          return mul(no, soma(mul(dv, fn('ln', u)), div(mul(v, du), u)));        // caso geral
      }
      break;
    }
    case 'func': {
      const u = no.arg, du = derivarNo(u);
      let d;
      switch (no.nome) {
        case 'sin': d = fn('cos', u); break;
        case 'cos': d = neg(fn('sin', u)); break;
        case 'tan': d = div(num(1), pot(fn('cos', u), num(2))); break;
        case 'asin': d = div(num(1), fn('sqrt', sub(num(1), pot(u, num(2))))); break;
        case 'acos': d = neg(div(num(1), fn('sqrt', sub(num(1), pot(u, num(2)))))); break;
        case 'atan': d = div(num(1), soma(num(1), pot(u, num(2)))); break;
        case 'sinh': d = fn('cosh', u); break;
        case 'cosh': d = fn('sinh', u); break;
        case 'tanh': d = div(num(1), pot(fn('cosh', u), num(2))); break;
        case 'exp': d = fn('exp', u); break;
        case 'ln': return div(du, u);
        case 'log': case 'log10': return div(du, mul(u, fn('ln', num(10))));
        case 'log2': return div(du, mul(u, fn('ln', num(2))));
        case 'sqrt': return div(du, mul(num(2), fn('sqrt', u)));
        case 'cbrt': return div(du, mul(num(3), pot(fn('cbrt', u), num(2))));
        case 'abs': return div(mul(du, u), fn('abs', u));
      }
      return mul(d, du);
    }
  }
  throw new ErroNumerico('ERRO_INTERNO', 'Não sei derivar este nó.', { no });
}

/** Derivada numérica por diferença central: (f(x+h) − f(x−h)) / 2h. */
function derivadaNumerica(f, x, h) {
  const passo = h ?? Math.cbrt(Number.EPSILON) * Math.max(1, Math.abs(x));
  return (f(x + passo) - f(x - passo)) / (2 * passo);
}

  g.Expressao = { compilar, derivar, analisar, tokenizar, avaliarAst, astParaTexto, derivarSimbolicamente, simplificar, derivadaNumerica, ErroNumerico, LIMITE_CARACTERES, LIMITE_PROFUNDIDADE };
  if (typeof module !== 'undefined' && module.exports) module.exports = g.Expressao;
})(typeof window !== 'undefined' ? window : globalThis);
