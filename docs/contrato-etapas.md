# Contrato de dados — métodos numéricos

Arquivos (scripts comuns, sem `import`/`export`; ordem de carga no `index.html`):

```
js/expressao.js            → window.Expressao   (parser seguro, único)
js/metodos/comum.js        → Metodos.fmt, erroRelativo, copiarMatriz, linhaDoMaiorPivo, ...
js/metodos/bisseccao.js    → Metodos.bisseccao(f, a, b, tol, maxIter)
js/metodos/newton.js       → Metodos.newton(f, df, x0, tol, maxIter)
js/metodos/gauss.js        → Metodos.gauss(A, b, pivoteamento = true)
js/metodos/validacao.js    → Metodos.validacao.*  e  Metodos.executar.*
```

## 1. Duas camadas

**Funções principais** (as que o botão “Ver código” mostra via `toString()`): curtas, só a matemática.
Recebem funções JS e números já validados; **não validam** e não lançam erro de usuário.
Devolvem `{ passos, raiz, convergiu, motivo }` (Gauss: `{ passos, x, motivo, coluna? }`).

**`Metodos.executar.<metodo>(params)`** (em `validacao.js`): recebe os dados crus do formulário (strings ok),
valida, compila as expressões, chama a função principal, faz a pós-análise (oscilação, divergência, não finito,
classificação de sistema singular) e devolve o formato consumido pelo site:

```
{ passos: [...], resultado: {...} | null, erro: string | null, codigoErro: string | null, avisos: [string] }
```

Nunca lança exceção para erro do usuário. Em erro, `passos` traz o que foi calculado até o problema.
`Metodos.validacao.<metodo>(params)` está exposto separadamente (lança um objeto `{codigo, mensagem}`).

Obs.: hoje o `app.js` usa `Visual.chamar` (`js/visual/chamadas.js`), que faz validação própria e chama as
funções principais com assinatura posicional — funciona. Recomendado trocar o corpo de `Visual.chamar.*` por
`Metodos.executar.*` para ganhar os códigos/diagnósticos abaixo (oscilação, impossível × infinitas, avisos).

## 2. Parâmetros de `Metodos.executar`

| método | parâmetros |
|---|---|
| bisseccao | `{ f: 'x^2-2', a, b, tol, maxIter }` — a>b é trocado com aviso |
| newton | `{ f, df?: texto, x0, tol, maxIter, derivadaNumerica?: bool }` — `df` vazio ⇒ derivada **simbólica**; `derivadaNumerica:true` força diferença central |
| gauss | `{ matriz: n×(n+1) aumentada, pivoteamento: bool }` **ou** `{ A, b, pivoteamento: bool \| 'parcial' \| 'nenhum' }` |

Critério de parada (**padrão: relativo**, `|x_{k+1} − x_k|/|x_{k+1}| < tol`, ver §19; abaixo, o modo `'absoluto'`): Bissecção para quando `(b−a)/2 < tol` (meia-largura, intervalo antes do corte) ou `f(c)=0`;
Newton para quando `|x_{k+1} − x_k| < tol`. Ordem dos testes no Newton: `f(x)=0` → raiz exata; **divergência** (`|x| > 1e6·max(1,|x0|)` ou não finito) → `DIVERGENCIA`; só então `|f'(x)| < 1e-12` → `DERIVADA_ZERO`. Contagem: Bissecção começa em k=1; Newton em k=0 (passo k gera x_{k+1}).

## 3. Passos

### Bissecção
`{ k, a, b, c, fa, fb, fc, erro, erroRelativo, manter: 'esquerda'|'direita'|'raiz', descricao }`
- `erro = (b−a)/2`; `erroRelativo = erro/|c|` (ou `erro` se c≈0).
- `resultado: { raiz, fRaiz, iteracoes, convergiu, motivo, iteracoesEstimadas }` — `iteracoesEstimadas = ⌈log2((b−a)/tol)⌉` só no critério absoluto; no relativo é `null` (BUG-29, ver §20).

### Newton
`{ k, x, fx, dfx, xNovo, erro, erroRelativo, tangente: { inclinacao, intercepto }, descricao }`
- tangente: `y = inclinacao·x + intercepto`.
- `resultado: { raiz, fRaiz, iteracoes, convergiu, motivo, derivadaNumerica, tipoDerivada: 'simbolica'|'fornecida'|'numerica', derivadaTexto }`

### Gauss
Todo passo: `{ tipo, fase: 'eliminacao'|'substituicao', matriz (cópia da aumentada APÓS a operação), descricao }` mais:

| tipo | campos extras |
|---|---|
| `inicio` | — |
| `troca` | `linhas: [k, p]`, `pivo: {linha, coluna, valor}` |
| `pivo` | `pivo`, `linhaPivo` |
| `eliminacao` | `pivo`, `linhaAlvo`, `linhaPivo`, `fator` (multiplicador); `descricao` = `'L3 ← L3 − (0.5)·L1'` |
| `substituicao` | `indice`, `linhaAlvo`, `x` (vetor parcial, `null` nos ainda desconhecidos) |
| `fim` | `x` |

`resultado: { x, determinante, residuo (‖Ax−b‖₂), trocas, classificacao: 'unica' }`; se singular:
`resultado: { x: null, classificacao: 'impossivel'|'infinitas_solucoes', postoA, postoAumentada }`.
Pivô “zero” (singular): `max_{i≥k} |a_ik| ≤ n·ε·max|aᵢⱼ|` (tolerância relativa; ver seção 18).

## 4. Códigos de erro (`codigoErro`)

| código | quando |
|---|---|
| `ERRO_SINTAXE` | expressão inválida (mensagem com posição e seta) |
| `EXPRESSAO_LONGA_DEMAIS` / `EXPRESSAO_PROFUNDA_DEMAIS` | > 300 caracteres / > 60 níveis de aninhamento |
| `ENTRADA_INVALIDA` | número inválido, tol ≤ 0, maxIter fora de 1..10000, a = b, n fora de 2..100 |
| `FUNCAO_NAO_DEFINIDA` | f ou f' deu NaN/±∞ (passos truncados antes do ponto ruim) |
| `SEM_TROCA_DE_SINAL` | bissecção com f(a)·f(b) > 0 |
| `NAO_CONVERGIU` | maxIter atingido (resultado traz a melhor aproximação) |
| `DERIVADA_ZERO` | Newton: \|f'(x)\| < 1e-12 |
| `DIVERGENCIA` | Newton: \|x\| > 1e10 ou erro cresceu 4 vezes seguidas |
| `OSCILACAO` | Newton: x voltou a um valor já visitado (ciclo) |
| `MATRIZ_NAO_QUADRADA` / `DIMENSOES_INCOMPATIVEIS` | Gauss: formas inválidas |
| `MATRIZ_SINGULAR` | Gauss: sem pivô utilizável; ver `resultado.classificacao` |
| `ERRO_INTERNO` | bug (não deveria ocorrer) |

`motivo` (em `resultado`): `TOLERANCIA`, `RAIZ_EXATA`, `MAX_ITERACOES`, `SOLUCAO_UNICA`, ou o código de erro.

## 5. Parser (`window.Expressao`)

- `compilar(texto)` → **função** `f(x)` com `f.ast`, `f.texto`, `f.avaliar`. Lança `ErroNumerico {codigo, mensagem, detalhes:{posicao}}`.
- `derivar(texto | f)` → função `f'(x)` com `.texto`/`.ast` (derivada simbólica simplificada).
- `derivadaNumerica(f, x, h?)`, `astParaTexto`, `analisar`, `tokenizar`, `simplificar`.
- Aceita: números (`1e-3`; vírgula dá erro explicando para usar ponto), `x`, `pi`, `e`, `+ - * / ^` (`**` = `^`, `²`),
  `^` à direita, `-x^2 = -(x^2)`, multiplicação implícita (`2x`, `3(x+1)`, `2pi`, `(x+1)(x-1)`), funções
  `sin cos tan asin acos atan sinh cosh tanh exp ln log(=log10) log10 log2 sqrt cbrt abs`, aliases `sen`, `tg`.
- Sem `eval`/`new Function`/`with`; nomes resolvidos por `hasOwnProperty` em tabelas fixas (`constructor`, `__proto__` são rejeitados).

## 6. Exemplos reais (gerados executando o código)

Bissecção `x^2-2` em [1,2], tol 0.1 (2 primeiros passos):
```json
{
  "avisos": [],
  "passos": [
    {
      "k": 1,
      "a": 1,
      "b": 2,
      "c": 1.5,
      "fa": -1,
      "fb": 2,
      "fc": 0.25,
      "erro": 0.5,
      "erroRelativo": 0.3333333333333333,
      "manter": "esquerda",
      "descricao": "f(a)·f(c) < 0 → raiz em [a, c]; b ← c"
    },
    {
      "k": 2,
      "a": 1,
      "b": 1.5,
      "c": 1.25,
      "fa": -1,
      "fb": 0.25,
      "fc": -0.4375,
      "erro": 0.25,
      "erroRelativo": 0.2,
      "manter": "direita",
      "descricao": "f(a)·f(c) > 0 → raiz em [c, b]; a ← c"
    }
  ],
  "resultado": {
    "raiz": 1.4375,
    "fRaiz": 0.06640625,
    "iteracoes": 4,
    "convergiu": true,
    "motivo": "TOLERANCIA",
    "iteracoesEstimadas": 4
  },
  "erro": null,
  "codigoErro": null
}
```

Newton `x^2-2`, x0 = 1 (1º passo):
```json
{
  "avisos": [
    "Derivada calculada simbolicamente: f'(x) = 2 * x"
  ],
  "passos": [
    {
      "k": 0,
      "x": 1,
      "fx": -1,
      "dfx": 2,
      "xNovo": 1.5,
      "erro": 0.5,
      "erroRelativo": 0.3333333333333333,
      "tangente": {
        "inclinacao": 2,
        "intercepto": -3
      },
      "descricao": "x1 = x0 − f(x0)/f'(x0) = 1 − (−1)/(2) = 1,5"
    }
  ],
  "resultado": {
    "raiz": 1.4142135623746899,
    "fRaiz": 4.510614104447086e-12,
    "iteracoes": 4,
    "convergiu": true,
    "motivo": "TOLERANCIA",
    "derivadaNumerica": false,
    "tipoDerivada": "simbolica",
    "derivadaTexto": "2 * x"
  },
  "erro": null,
  "codigoErro": null
}
```

Gauss `[[0,1],[1,1]]·x = [1,2]`, pivoteamento parcial:
```json
{
 "avisos": [],
 "passos": [
  {
   "tipo": "inicio",
   "fase": "eliminacao",
   "descricao": "Matriz aumentada inicial [A | b].",
   "matriz": [
    [
     0,
     1,
     1
    ],
    [
     1,
     1,
     2
    ]
   ]
  },
  {
   "tipo": "troca",
   "fase": "eliminacao",
   "linhas": [
    0,
    1
   ],
   "pivo": {
    "linha": 0,
    "coluna": 0,
    "valor": 1
   },
   "descricao": "L1 ↔ L2 (pivoteamento parcial: maior |a| na coluna)",
   "matriz": [
    [
     1,
     1,
     2
    ],
    [
     0,
     1,
     1
    ]
   ]
  },
  {
   "tipo": "pivo",
   "fase": "eliminacao",
   "pivo": {
    "linha": 0,
    "coluna": 0,
    "valor": 1
   },
   "linhaPivo": 0,
   "descricao": "Pivô a11 = 1",
   "matriz": [
    [
     1,
     1,
     2
    ],
    [
     0,
     1,
     1
    ]
   ]
  },
  {
   "tipo": "eliminacao",
   "fase": "eliminacao",
   "pivo": {
    "linha": 0,
    "coluna": 0,
    "valor": 1
   },
   "linhaAlvo": 1,
   "linhaPivo": 0,
   "fator": 0,
   "descricao": "L2 ← L2 − (0)·L1",
   "matriz": [
    [
     1,
     1,
     2
    ],
    [
     0,
     1,
     1
    ]
   ]
  },
  {
   "tipo": "pivo",
   "fase": "eliminacao",
   "pivo": {
    "linha": 1,
    "coluna": 1,
    "valor": 1
   },
   "linhaPivo": 1,
   "descricao": "Pivô a22 = 1",
   "matriz": [
    [
     1,
     1,
     2
    ],
    [
     0,
     1,
     1
    ]
   ]
  },
  {
   "tipo": "substituicao",
   "fase": "substituicao",
   "indice": 1,
   "linhaAlvo": 1,
   "x": [
    null,
    1
   ],
   "descricao": "x2 = (1 − Σ a2j·xj) / 1 = 1",
   "matriz": [
    [
     1,
     1,
     2
    ],
    [
     0,
     1,
     1
    ]
   ]
  },
  {
   "tipo": "substituicao",
   "fase": "substituicao",
   "indice": 0,
   "linhaAlvo": 0,
   "x": [
    1,
    1
   ],
   "descricao": "x1 = (2 − Σ a1j·xj) / 1 = 1",
   "matriz": [
    [
     1,
     1,
     2
    ],
    [
     0,
     1,
     1
    ]
   ]
  },
  {
   "tipo": "fim",
   "fase": "substituicao",
   "x": [
    1,
    1
   ],
   "descricao": "Solução: x1 = 1; x2 = 1",
   "matriz": [
    [
     1,
     1,
     2
    ],
    [
     0,
     1,
     1
    ]
   ]
  }
 ],
 "resultado": {
  "x": [
   1,
   1
  ],
  "determinante": -1,
  "residuo": 0,
  "trocas": 1,
  "classificacao": "unica"
 },
 "erro": null,
 "codigoErro": null
}
```

Gauss singular (impossível):
```json
{
  "avisos": [],
  "passos": [
    {
      "tipo": "inicio",
      "fase": "eliminacao",
      "descricao": "Matriz aumentada inicial [A | b].",
      "matriz": [
        [
          1,
          1,
          1
        ],
        [
          2,
          2,
          3
        ]
      ]
    }
  ],
  "resultado": {
    "x": null,
    "classificacao": "impossivel",
    "postoA": 1,
    "postoAumentada": 2
  },
  "erro": "Sistema singular: não há pivô não nulo na coluna 2. O sistema é impossível (não tem solução).",
  "codigoErro": "MATRIZ_SINGULAR"
}
```

Newton com derivada zero (`x^3-1`, x0 = 0):
```json
{
  "avisos": [
    "Derivada calculada simbolicamente: f'(x) = 3 * x^2"
  ],
  "passos": [],
  "resultado": {
    "raiz": 0,
    "fRaiz": -1,
    "iteracoes": 0,
    "convergiu": false,
    "motivo": "DERIVADA_ZERO",
    "derivadaNumerica": false,
    "tipoDerivada": "simbolica",
    "derivadaTexto": "3 * x^2"
  },
  "erro": "Derivada ≈ 0 em x = 0: a tangente é horizontal e não cruza o eixo x. Tente outro x0.",
  "codigoErro": "DERIVADA_ZERO"
}
```

## 7. Diferenças em relação ao formato anterior do site

- Funções principais agora são **posicionais** (`Metodos.bisseccao(f, a, b, tol, maxIter)` etc.) e retornam
  `{passos, raiz|x, convergiu, motivo}`; o formato antigo `{passos, resultado, erro}` vem de `Metodos.executar.*`.
- Campos novos (aditivos): `erroRelativo` (Bissecção/Newton), `tangente` (Newton), `pivo.valor` e `linhaPivo` no passo `pivo` (Gauss),
  `codigoErro`, `avisos`, `resultado.motivo`, `iteracoesEstimadas`, `tipoDerivada`, `derivadaTexto`, `determinante`, `residuo`, `classificacao`.
- Newton com `df` vazio usa derivada **simbólica** (antes: numérica) ⇒ `resultado.derivadaNumerica` passa a ser `false` nesse caso.
- Gauss `substituicao.descricao` agora é `x2 = (b − Σ a2j·xj) / a22 = valor` (antes listava os termos).
- Bissecção com a > b: antes erro, agora troca com aviso.
- Parser: `log` = log10 (antes era ln); use `ln` para logaritmo natural. Novos: `log2`, `cbrt`, `sen`, `tg`.

## 8. "Ver código": marcadores de linha

As funções principais têm comentários `// @etapa:<nome>`, que `js/visual/codigo.js` encontra pelas heurísticas
dele, sem precisar de `passo.etapa` nem de `passo.linha`:
Bissecção `@etapa:pontoMedio`; Newton `@etapa:passoNewton`; Gauss `@etapa:<tipo>`
(`inicio`, `troca`, `pivo`, `eliminacao`, `substituicao`, `fim`). Nenhuma linha das funções passa de 70 caracteres
(há teste para isso). Os textos de `descricao` são montados em `Metodos.textos` (`js/metodos/comum.js`).

## 9. Pré-condições dentro das funções principais (QA v1, BUG-04)

- `Metodos.bisseccao` devolve `{passos: [], raiz: null, convergiu: false, motivo: 'SEM_TROCA_DE_SINAL'}` se `f(a)·f(b) > 0`.
- `Metodos.newton` testa divergência antes da derivada nula (BUG-01).
- `Metodos.gauss` devolve `motivo: 'MATRIZ_SINGULAR'` (+`coluna`) sem pivô utilizável.
- A validação de **entrada** (tipos, campos vazios, limites, extremo que já é raiz) continua só em `validacao.js`.

Outras mudanças (v1.1): o último passo da bissecção diz "critério atingido, raiz ≈ c"; aviso de convergência
linear (provável raiz múltipla) no Newton; campos numéricos aceitam vírgula decimal; raiz no extremo da
bissecção devolve `iteracoesEstimadas: null` + aviso; erros de célula do Gauss citam linha/coluna;
`FUNCAO_NAO_DEFINIDA` na bissecção diz "f não está definida em x = …" (sem "NaN").

## 10. Gauss: granularidade e matriz colada (combinado com o Dev Visualização)

**API:** `Metodos.executar.gauss(A, b, { granularidade: 'coluna' | 'operacao', pivoteamento })`.
Sem `granularidade`: automático, `'operacao'` se n ≤ 10 e `'coluna'` se n > 10. O formato antigo
`Metodos.executar.gauss({ A, b } | { matriz }, ...)` continua aceito. `resultado.granularidade` informa o modo usado.
Valor inválido → `ENTRADA_INVALIDA`. Limite de n: **2 ≤ n ≤ 100** (em `executar.gauss` e em `lerMatrizTexto`).

**`'operacao'`** (n ≤ 10): exatamente o formato granular da seção 3 (inicio, troca, pivo, eliminacao, substituicao × n, fim).

**`'coluna'`** (n > 10): `inicio` (matriz original) → **um** passo por coluna de pivô → **um** `substituicao` → `fim`.

```
{ tipo: 'coluna', etapa: 'eliminacao', fase: 'eliminacao',
  k,                                  // coluna do pivô (0-based)
  pivo: { linha, coluna, valor },     // pivô já depois da troca
  linhaPivo: k,
  troca: [p, k] | null,               // linha p (de onde veio o pivô) ↔ linha k; null se não houve troca
  fatores: [{ linha, fator }, ...],   // LISTA DE OBJETOS, uma entrada por linha i > k (fator pode ser 0)
  matriz,                             // snapshot só ao FIM da coluna
  descricao }                         // ex.: "Coluna 1: L1 ↔ L3; pivô 13; 10 linha(s) zerada(s) abaixo dele."
{ tipo: 'substituicao', fase: 'substituicao', indice: 0, linhaAlvo: 0,
  x: [ ...vetor completo... ], matriz, descricao }
{ tipo: 'fim', fase: 'substituicao', x, matriz, descricao }
```
Snapshots de matriz: 1 (inicio) + n (colunas) + 1 (substituicao) + 1 (fim) = n + 3, sendo os dois últimos iguais à última coluna.
Em sistema singular no modo coluna: passos até a última coluna completa e o erro `MATRIZ_SINGULAR` de sempre.

**Ver código:** cada passo `coluna` traz `etapa: 'eliminacao'`. O `linhaDoPasso` do `codigo.js` prioriza
`passo.etapa`, então a linha ativa é a do `// @etapa:eliminacao` (há teste para isso). O `substituicao` único
cai em `// @etapa:substituicao`.
**Pendência no código do Dev (não alterado):** `js/visual/adaptador.js` normaliza qualquer `tipo` desconhecido
para `'inicio'`, então `'coluna'` vira `'inicio'` e perde `k`, `troca` e `fatores`. É preciso reconhecer
`/coluna/ → 'coluna'` e repassar esses campos. O `etapa` já é repassado, então o destaque de linha funciona mesmo assim.

**`Metodos.lerMatrizTexto(texto)`** (matriz colada do Excel, Planilhas ou CSV):
- Separadores: TAB, `;`, `|`, espaços e vírgula. Se o texto tem TAB ou `;`, a vírgula é **decimal** (`1,5`);
  senão, a vírgula separa colunas (CSV). Linhas vazias são ignoradas.
- Retorno: `{ matriz, A, b, linhas, colunas, erro: null | string, codigoErro: null | 'MATRIZ_TEXTO_INVALIDA' }`.
  n×(n+1) → `A` e `b` separados (matriz aumentada); n×n → `b: null`.
- Erros: célula não numérica ("Linha 1, coluna 2: "x" não é um número."), linhas com tamanhos diferentes, forma diferente de n×n ou n×(n+1), texto vazio.


### `Metodos.lerSistemaTexto(textoA, textoB)` — A e b em caixas separadas

Retorno: `{ A, b, n, erro, codigoErro, campo, linha, coluna }`. Sucesso: `erro = codigoErro = campo = linha = coluna = null`.
Falha: `A = b = null`, `codigoErro = 'MATRIZ_TEXTO_INVALIDA'` (o mesmo do `lerMatrizTexto`); **`campo` ('A' ou 'b') diz qual caixa destacar**,
e `linha`/`coluna` (a partir de 1) apontam a célula quando fizer sentido.

- **A**: mesmo leitor interno do `lerMatrizTexto` (`lerGradeTexto`, sem duplicação): vírgula é decimal se houver TAB ou `;`. Quadrada, 2 ≤ n ≤ 100.
- **b**: um valor por linha (vírgula = decimal) **ou** uma linha só (vírgula decimal só se houver TAB/`;`; senão a vírgula separa). Exatamente n valores.

Mensagens (exemplos reais):
- `A está vazia: cole as n linhas da matriz dos coeficientes.`
- `A tem 3 linhas, mas a linha 2 tem 4 valores (A precisa ser quadrada)`
- `Valor inválido em A, linha 2, coluna 3: "abc"`
- `A precisa ter entre 2 e 100 linhas; encontrei 101.`
- `b está vazio`
- `Valor inválido em b, posição 2: "xyz"`
- `b deve ter um valor por linha (ou todos numa linha só); a linha 1 tem 2 valores.`
- `A é 3×3, então b precisa ter 3 valores; encontrei 2`

## 11. Gauss até 100×100: memória, gerador e medições

**Registro de passos.** `Metodos.gauss(A, b, pivoteamento, modo)` não monta mais os passos sozinha:
chama `Metodos.registrador(passos, M, modo)` (em `comum.js`), e `executar.gauss` escolhe o modo
pela granularidade.

- `'operacao'` (n ≤ 10 por padrão): um passo por operação, cada um com cópia da matriz (como antes).
- `'coluna'` (n > 10): durante a coluna guarda só pivô, troca e `{linha, fator}`; copia a matriz
  **uma vez, ao fim da coluna**. A substituição vira um único passo (x completo).
  Total: **n + 3 cópias** (início + n colunas + substituição + fim). O agrupamento posterior
  (`agruparPorColuna`) foi removido. Se a matriz for singular, só as colunas completas aparecem.
- `Metodos.copiasDeMatriz` conta as cópias (diagnóstico; os testes zeram e leem).

**Gerador.** `Metodos.gerarSistema(n, semente)` → `{A, b, x}` com 2 ≤ n ≤ 100:
x inteiro em −5..5, A inteira (−3..3 fora da diagonal), diagonal estritamente dominante e b = A·x inteiro.
Com `semente` o resultado é reprodutível (PRNG mulberry32); sem ela é aleatório.

**Medições (n = 100, `gerarSistema(100, 42)`, Node 20):**

| modo | cópias da matriz | passos | JSON dos passos | Δ heapUsed | tempo |
|---|---|---|---|---|---|
| coluna | 103 | 103 | 14,0 MB | ≈ 11 MB | ≈ 24 ms |
| operacao | 5152 | 5152 | 757 MB (`JSON.stringify(passos)` estoura o limite de string; medido passo a passo) | ≈ 448 MB | ≈ 200 ms |

Em ambos os modos: resíduo relativo ≈ 6e−16 e a solução arredondada é igual ao x inteiro.
Conclusão: com n = 100, o modo `operacao` é inviável no navegador; mantenha o padrão `coluna` para n > 10.

## 12. Botão "Avisos": `Metodos.textos.avisos` (js/metodos/avisos.js)

Script comum, carregado no `index.html` logo após `comum.js`. Dados puros (texto sem HTML), um objeto por método:

```js
Metodos.textos.avisos = {
  bisseccao | newton | gauss: {
    vantagens:    [3..5 strings],
    desvantagens: [3..5 strings],
    problemas: [3..6 × { id, titulo, quando, solucao, codigos: [...], mensagem? }],
    resumo: { convergencia, custo },
  },
};
```

- `id`: slug curto e estável (ex.: `sem-troca-sinal`).
- `codigos`: os mesmos `codigoErro` e códigos de aviso (`codigosAviso`) que `Metodos.executar.*` devolve; pode ser `[]`
  (ex.: mal condicionamento, que o site não detecta).
- `mensagem` (opcional): texto que o site mostra de fato, copiado de uma execução real (inclui os números do exemplo).
- Testes: limites de contagem, nenhum texto vazio, até 140 caracteres e uma linha em titulo, quando, solucao e resumo.
  Cada código citado tem um caso real que o produz, e cada `mensagem` aparece numa execução real.

## 13. Códigos de aviso (`codigosAviso`)

`avisos` continua sendo uma lista de **textos** (compatível). Na mesma ordem, `codigosAviso` traz o código estável
de cada aviso; ele aparece no topo do retorno e também em `resultado.codigosAviso` quando há `resultado`.

| código | método | quando |
|---|---|---|
| `EXTREMOS_TROCADOS` | bissecção | a > b (o site troca) |
| `RAIZ_NO_EXTREMO` | bissecção | f(a) = 0 ou f(b) = 0 |
| `DERIVADA_SIMBOLICA` / `DERIVADA_NUMERICA` | Newton | como f' foi obtida |
| `SALTO_GRANDE` | Newton | 1º passo com |Δx| > 5·max(1, |x0|) (f' pequena) |
| `CONVERGENCIA_LENTA` | Newton | convergiu, mas linearmente (provável raiz múltipla) |
| `RAIZ_MULTIPLA` | Newton | raiz exata com f'(raiz) ≈ 0 |
| `MODO_COLUNA` | Gauss | granularidade 'coluna' |

Novos `codigoErro`/diagnósticos:
- **`DESCONTINUIDADE`** (bissecção, QA L-01): |f(c)| final > 10·max(|f(a0)|, |f(b0)|), |f(c)| final > 10·|f(c1)|,
  e a média de |f(c)| nas 3 últimas iterações é maior que nas 3 primeiras (mínimo de 6 iterações).
  `resultado.convergiu = false`, `motivo = 'DESCONTINUIDADE'`; os passos são mantidos para a animação.
  Sem falso positivo em tan x em [3; 3,5], x^9 − 1 em [0, 2] e exp(10x) − 1 em [−1, 1] (testado).
- **Newton fora do domínio** (QA L-02): continua `FUNCAO_NAO_DEFINIDA`, agora com a mensagem
  `x1 = −0,721348 está fora do domínio de f (ln de número negativo); tente um x0 mais perto da raiz.`
  A causa vem da árvore de f: ln/log, sqrt, asin/acos, divisão por zero, potência; se nenhuma se aplicar, diz "f não está definida".
  Os números dessa mensagem e do `SALTO_GRANDE` usam `Metodos.fmtBR` (vírgula decimal, "−").
  As demais mensagens antigas continuam com `Metodos.fmt` (ponto).

## 14. BUG-13: sub-etapas da iteração (`etapa` e `etapas`)

Cada passo de bissecção e Newton traz:
- `etapa`: ação principal. É `pontoMedio` ou `passoNewton`, e vira `criterioParada` no passo em que a parada foi atingida.
- `etapas`: sub-etapas do passo, em ordem.

| método | passo normal | passo final |
|---|---|---|
| bissecção | `['pontoMedio','testeSinal','atualizaIntervalo']` | `['pontoMedio','testeSinal','criterioParada']` |
| Newton | `['avaliaDerivada','passoNewton']` | `['avaliaDerivada','passoNewton','criterioParada']` |

Linha destacada pelo `linhaDoPasso` do codigo.js (linha de `toString()`, 1ª linha de código após o marcador):

| método | nome | linha | código |
|---|---|---|---|
| bissecção | pontoMedio | 16 | `c = (a + b) / 2;` |
| bissecção | testeSinal | 24 | `let manter;` |
| bissecção | criterioParada | 29 | `const parou = fc === 0 \|\| erro < tol;` |
| bissecção | atualizaIntervalo | 40 | `if (manter === 'esquerda') {` |
| Newton | avaliaDerivada | 14 | `const dfx = df(x);` |
| Newton | passoNewton | 27 | `const xNovo = x - fx / dfx;` |
| Newton | criterioParada | 32 | `const parou = erro < tol;` |


## 15. Formato numérico dos textos (QA v2: BUG-16 e BUG-08)

- **Todo texto** gerado pelo núcleo usa `Metodos.fmtBR`: erros, avisos, `descricao` dos passos (`Metodos.textos.*`),
  operações do Gauss, substituição e as `mensagem` do avisos.js.
  - Vírgula decimal e sinal "−" (U+2212), inclusive no expoente: `−0,5`, `1,5e−7`.
  - Exemplos: `L2 ← L2 − (−1,5)·L1`, `x3 = (1 − Σ a3j·xj) / −1 = −1`, `Pivô a22 = 0,5`.
- **Listas de números em texto** são separadas por **"; "**: `Solução: x1 = 2; x2 = 3; x3 = −1`.
- **Exceções:**
  - Os **valores** nos passos e no resultado (x, fx, matriz, raiz…) continuam números JS.
  - O código mostrado em "Ver código" não muda; os literais continuam com ponto, porque é JS.
  - A **fórmula** de f′ no aviso `DERIVADA_SIMBOLICA` é texto do parser, que só aceita ponto decimal
    (ex.: `f'(x) = 2 * x - 0.5`), para o aluno poder copiá-la de volta num campo de função.
- `Metodos.fmt` (ponto) continua existindo para quem precisar, mas o núcleo não o usa em textos.
- Teste "BUG-16" varre erros, avisos e descrições de execuções reais dos 3 métodos e falha com número `\d.\d` ou "-" ASCII.


## 16. Pivoteamento padrão e células vazias (BUG-19)

- **Pivoteamento padrão:** substituído pela seção 17. O padrão agora é o modo `'automatico'`; `true` vira `'sempre'` e `false` vira `'nunca'`.
- **Separadores da colagem** (`lerMatrizTexto` e `lerSistemaTexto`, via `lerGradeTexto`):
  - TAB e `;` são **fortes**: cada ocorrência separa uma célula, e dois seguidos indicam célula vazia.
  - Sem TAB nem `;`, a vírgula separa valores e também é forte: `,,` = célula vazia.
  - Um único separador forte sobrando no fim da linha é ignorado (comum em exports). Espaços em volta são ignorados.
  - Espaços e `|` colapsam: vários seguidos contam como um separador.
- **Mensagens de célula vazia:**
  - Matriz aumentada: `Linha 1, coluna 2 vazia.`, no formato que o relatório QA v2 pede.
  - Em A: `Célula vazia em A, linha 2, coluna 3`, com `campo: 'A'`, `linha` e `coluna`.
  - Em b: `Valor vazio em b, posição 2`.
  - Todas com `codigoErro: 'MATRIZ_TEXTO_INVALIDA'`.

## 17. Modos de pivoteamento do Gauss

**API.** `executar.gauss({ A, b, pivoteamento })` e `Metodos.gauss(A, b, modoPivo = 'automatico', granularidade)`.

| valor de `pivoteamento` | modo |
|---|---|
| ausente, `null`, `'automatico'`, `'auto'` | `'automatico'` (padrão) |
| `'sempre'`, `true`, `'parcial'` | `'sempre'` (pivoteamento parcial clássico) |
| `'nunca'`, `false`, `'nenhum'` | `'nunca'` |
| outro valor | `ENTRADA_INVALIDA` |

**Decisão** (`Metodos.escolherPivo(M, k, modo)`, função curta exibida no "Ver código"). Sejam `m` a linha do maior |a_ik| (i ≥ k), `pivo = |a_kk|` e `maior = |a_mk|`.
- **zero numérico:** `pivo ≤ n·ε·maior`.
- **pequeno:** `pivo < 0,1·maior`. Justificativa: com o limiar 0,1, os fatores |l_ik| ficam ≤ 10, o que limita o crescimento dos elementos e o erro de arredondamento. É um meio-termo entre poucas trocas e estabilidade; o modo `'sempre'` garante |l_ik| ≤ 1.
- **`'sempre'`:** troca sempre que m ≠ k → `classica`, motivo `maior_modulo`.
- **`'automatico'`:**
  - zero numérico → `obrigatoria`, motivo `pivo_zero`;
  - pequeno → `recomendada`, motivo `pivo_pequeno`;
  - senão, sem troca.
- **`'nunca'`:** nunca troca.

Uma coluna toda abaixo de `tolPivo` gera `MATRIZ_SINGULAR` em qualquer modo, e esse erro tem precedência. `PIVO_ZERO_SEM_TROCA` só ocorre no `'nunca'`, quando a_kk é exatamente 0 (ou não finito) e outra linha da coluna não é nula.

**Campos dos passos.** Nos passos `pivo`/`troca`/`eliminacao` e no `coluna`, `pivo` passa a ter `{ linha, coluna, valor, troca, decisao, pequeno }`:
- `decisao`: `'troca' | 'sem_troca'`;
- `pequeno`: indica se o pivô original era pequeno, mesmo quando não houve troca;
- `troca`: `null` ou `{ tipo: 'obrigatoria'|'recomendada'|'classica', motivo: 'pivo_zero'|'pivo_pequeno'|'maior_modulo', descricao, de, para, valorOriginal, valorNovo }`. Os índices `de` e `para` começam em 0, e `descricao` é texto pt-BR.

**Resultado.**
- `resultado.pivoteamento`: o nome canônico do modo.
- `resultado.trocas`: `{ total, obrigatorias, recomendadas, classicas }`, com a mesma contagem nas duas granularidades. O sinal do determinante usa `total`.
- `resultado.comparacao` (só no `'nunca'`, sempre presente nele): `{ semPivo: { x, erro, residuo }, comPivo: { x, erro: 0, residuo } }`.
  - `erro = ‖x − x_ref‖/‖x_ref‖`, com `x_ref` calculado no modo `'sempre'`;
  - `residuo = ‖Ax − b‖/‖b‖`, ou seja, relativo.
  - O `resultado.residuo` antigo continua absoluto.

**Códigos.**
- **Erro `PIVO_ZERO_SEM_TROCA`:** `Pivô a11 = 0 e o modo “nunca” não permite trocar linhas: ative o pivoteamento (automático ou sempre).` Os passos até o ponto da parada são mantidos.
- **Aviso `PIVO_PEQUENO_SEM_TROCA`** (no `'nunca'`, quando algum pivô é pequeno): `Pivô pequeno sem troca (modo “nunca”): a11 = 1e−17, menor que 0,1·max|a_ik| da coluna; erro relativo de x em relação ao pivoteamento parcial: 0,707107.`

**Marcadores** (sintaxe `// @etapa:<nome> — comentário`):

| nome | função | linha de código destacada |
|---|---|---|
| `trocaClassica` | escolherPivo | `if (m !== k && modo === 'sempre') {` |
| `trocaObrigatoria` | escolherPivo | `if (auto && zero) {` |
| `trocaRecomendada` | escolherPivo | `if (auto && pequeno) {` |
| `pivoOk` | escolherPivo | `return { linha: k, tipo: null, ... }` |
| `trocaLinhas` | gauss | `[M[k], M[p]] = [M[p], M[k]];` (marcador no fim da própria linha) |

**`etapa`/`etapas`** (calculados por `Metodos.etapasGauss`), onde `D` é a decisão (`pivoOk` ou `troca*`):

| passo | `etapa` | `etapas` |
|---|---|---|
| troca | `trocaLinhas` | `[D, 'trocaLinhas']` |
| pivo | `pivo` | `[D, ('trocaLinhas'), 'pivo']` |
| coluna | `eliminacao` (ou `pivo` na última coluna) | `[D, ('trocaLinhas'), 'pivo', ('eliminacao')]` |

Os demais passos têm `etapa = tipo`. Como agora a etapa do passo de troca é `trocaLinhas`, o marcador antigo `@etapa:troca` deixou de existir.

## 18. QA v3: singularidade, condicionamento, f′ indefinida e textos

**Critério de singularidade (BUG-20).**
- `Metodos.toleranciaPivo(A)` agora vale **n·ε·max|a_ij|**, calculado sobre a matriz original. Antes era 1e−12·n·max|a|.
- `gauss` declara `MATRIZ_SINGULAR` quando o maior |a_ik| restante da coluna k (i ≥ k, depois da eliminação) é **≤** essa tolerância. Isso inclui o caso exatamente 0.
- **Justificativa:** n·ε·escala é o tamanho do arredondamento acumulado na eliminação, e é o mesmo critério do "zero numérico" de `escolherPivo`.
  - Com a tolerância antiga, Hilbert 10 (último pivô ≈ 1e−13) era rejeitada nos modos automático e sempre.
  - Mal condicionamento nunca bloqueia: só gera aviso.
- O posto da classificação usa a mesma tolerância. Para [A | b], usa o maior valor entre essa tolerância e n·ε·max|b_i|.

**Aviso `MAL_CONDICIONADA`.**
- `resultado.condicao` = cond∞(A) = ‖A‖∞·‖A⁻¹‖∞. A inversa vem de Gauss-Jordan com pivoteamento parcial, em O(n³). O valor é `Infinity` se A for singular na precisão da máquina.
- O aviso aparece quando cond∞ > **1e8**. O erro relativo esperado em x é ~cond·ε, então acima de 1e8 até metade dos ~16 algarismos pode estar perdida.
- Mensagem: `Matriz mal condicionada: cond∞(A) ≈ 3,38728e+10 > 1e+8. O erro relativo em x pode chegar a cond·ε ≈ …, mesmo com resíduo pequeno.`

**Classificação de sistema singular (BUG-23).** `codigoErro` continua `MATRIZ_SINGULAR`. Além dele, `codigosAviso` passa a ter **`SISTEMA_IMPOSSIVEL`** ou **`SISTEMA_INDETERMINADO`**, conforme `resultado.classificacao`. Os itens do painel Avisos usam esses códigos.

**Newton: f′ indefinida (BUG-22).**
- Quando f(x_k) é finita mas f′(x_k) não é, o código é **`DERIVADA_NAO_DEFINIDA`** (`resultado.motivo` igual). A mensagem é `Em x1 = 0, f(x1) = −1 está definida, mas f'(x1) não é finita (f'(x) = …); o passo de Newton não pode ser calculado. Tente um x0 mais perto da raiz.`
- Quando a própria f não é finita, continua `FUNCAO_NAO_DEFINIDA`.

**Avisos.**
- Newton ganhou o item `max-iteracoes` (`NAO_CONVERGIU`).
- O item `fora-do-dominio` cobre só `FUNCAO_NAO_DEFINIDA`. O item novo **`derivada-nao-definida`** ("Derivada não definida") cobre `DERIVADA_NAO_DEFINIDA`. O limite de problemas por método passou para 8.
- `mal-condicionamento` usa `MAL_CONDICIONADA`.

**Textos (BUG-26/27).**
- `fmt`/`fmtBR` usam o **mesmo formato da UI** (`Visual.extremo`/`Visual.fmtE`). Quando |v| ≥ 1e6 ou 0 < |v| < 1e−4, o número vai em notação científica com 4 algarismos significativos, vírgula decimal e "−" (U+2212) na mantissa e no expoente: `−1,000e+17`, `3,387e+10`, `1,000e−17`. Os outros valores usam 6 algarismos significativos (`0,0833333`, `123456`). Isso vale para todos os textos do núcleo: passos, erros, avisos e motivos de troca.
- `fmtPar` começa com 4 algarismos (extremos) ou 6 (demais) e aumenta até os dois números ficarem diferentes, por exemplo `1,000000e+17 > 1,000001e+17`.
- `Metodos.fmtPar(a, b)` aumenta os algarismos significativos (de 6 até 17) até os dois números comparados ficarem diferentes. É usado nos motivos `maior_modulo` e `pivo_pequeno`, por exemplo `(0,0833333333333334 > 0,0833333333333333)`.

## 19. Critério de parada selecionável (Bissecção e Newton)

**Fonte.** As listas (`docs/listas/lista1.txt` e `lista2.txt`) pedem "determine os erros absoluto e relativo (teste de parada)" e dão ε e N, mas **não escrevem a fórmula**. A convenção abaixo é a do gabarito do QA (`/workspace/qa-metodos-numericos/lista_ref.py`, `docs/relatorio-listas.md` item 7): |xₖ − xₖ₋₁| < ε (absoluto) e |xₖ − xₖ₋₁|/|xₖ| < ε (relativo), com desigualdade **estrita**. Na bissecção, xₖ é o ponto médio cₖ.

**API.**
- `Metodos.bisseccao(f, a, b, tol, maxIter, criterio = 'relativo')` e `Metodos.newton(f, df, x0, tol, maxIter, criterio = 'relativo')`. Chamadas sem o 6º argumento usam o critério relativo.
- `executar.bisseccao` e `executar.newton` aceitam `{ criterio }`:
  - **`'relativo'` (PADRÃO, decisão do usuário; alias `'rel'`; ε padrão 0,01 se `tol` não vier, ver §21)** ou `'absoluto'` (alias `'abs'`), que precisa ser pedido explicitamente;
  - outro valor → `ENTRADA_INVALIDA`.
- `resultado.criterio` traz o nome canônico.

**Critérios.**
- **`'absoluto'`** (era o padrão até 27/10/2026): bissecção para quando (b − a)/2 < tol; Newton para quando |Δx| < tol.
- **`'relativo'`**:
  - bissecção: erro = |cₖ − cₖ₋₁|/|cₖ|;
  - Newton: erro = |x_{k+1} − x_k|/|x_{k+1}|;
  - para quando erro < ε.
- Nos dois critérios, f(c) = 0 ou f(x) = 0 continua parando como raiz exata.

**1ª iteração da bissecção no relativo.** Não há ponto médio anterior, então `erroCriterio = null` (a UI mostra "—") e o método nunca para nessa iteração. A alternativa seria usar a ou b como "anterior". Nas 7 bissecções das listas ela daria as mesmas contagens, porque nenhuma pararia na 1ª iteração de qualquer forma. Escolhi a convenção do gabarito: ela não inventa um ponto que o método não calculou.

**Perto de zero.**
- Se |x_{k+1}| (ou |cₖ|) < `Metodos.LIMIAR_ZERO_RELATIVO` = 1e−12 (**fixo**; o critério não muda por causa do tamanho de x, ver §20/BUG-32), o núcleo não divide. Ele usa o erro absoluto |Δx| < ε e marca `criterioFallback = true`.
- O resultado ganha o aviso **`CRITERIO_RELATIVO_PERTO_DE_ZERO`**, por exemplo: `Critério relativo perto de zero: na iteração 5, |x| = 7,300e−20 < 1,000e−12, e dividir por ele não faz sentido; usei o erro absoluto |Δx| = 3,317e−7 comparado com ε = 1,000e−6.`
- O limiar é o mesmo de `Metodos.erroRelativo`, que já calcula o campo `erroRelativo`.

**Campos de cada passo** (além de `erro` e `erroRelativo`, que não mudaram):
- `criterio`: `'absoluto' | 'relativo'`;
- `erroCriterio`: o número comparado com tol/ε. É `null` na 1ª iteração da bissecção no modo relativo. No absoluto, `erroCriterio === erro`;
- `criterioFallback`: boolean.

**Textos.** No modo relativo, a descrição do passo cita o erro, por exemplo `erro relativo |Δc|/|c| = 0,000723066 < ε: critério relativo atingido, raiz ≈ c.`. No absoluto, os textos são os antigos.

**Função comum.** `Metodos.testeParada(criterio, novo, anterior, erroAbs, tol)` → `{ criterio, erro, parou, fallback }`.

**Marcadores.** `// @etapa:criterioParada` continua no mesmo lugar e agora aponta para a linha `const crit = Metodos.testeParada(criterio, …);`.

**Avisos.** O item `criterio-parada` ("Critério de parada: tol × ε", código `CRITERIO_RELATIVO_PERTO_DE_ZERO`) existe na bissecção e no Newton. O limite de problemas por método passou para 9.

## 20. QA v5 (BUG-29 a BUG-32)

- **BUG-29 (núcleo, `validacao.js`):** `resultado.iteracoesEstimadas` (⌈log2((b−a)/tol)⌉) só vale para o critério absoluto. No relativo agora é `null`, e a UI (`app.js`) já omite “(estimativa teórica: …)” quando o campo é falsy. O Dev não precisa mudar nada.
- **BUG-30:** `CRITERIO_RELATIVO_PERTO_DE_ZERO` só é emitido quando o fallback **decidiu** a parada, ou seja, quando o último passo tem `criterioFallback = true` e `resultado.motivo === 'TOLERANCIA'`. Parada por f = 0 (`RAIZ_EXATA`) ou passos intermediários com fallback não geram o aviso. A regra vale para os dois métodos. `criterioFallback` por passo continua igual.
- **BUG-31 → revisto no BUG-32.** O limiar max(ε, 1e−12) foi **revertido**: ele trocava o critério só pelo tamanho de x e parava cedo em raízes simples da ordem de ε (x − 5e−5 dava erro relativo real de 0,39). `Metodos.limiarZeroRelativo` foi removido.
- **BUG-32:**
  - **Fallback:** volta a ser |x_{k+1}| < 1e−12, fixo.
  - **Raiz em 0 no relativo (Newton):** quando o Newton termina por `DERIVADA_ZERO` ou por máximo de iterações (`NAO_CONVERGIU`) no critério relativo, `validacao.js` verifica os últimos 6 passos. Se |x_{k+1}| decresce monotonamente e o erro relativo final é ≥ 0,9× o de 5 passos antes, o desfecho vira o **erro** `RAIZ_EM_ZERO_CRITERIO_RELATIVO`:
    - `convergiu = false`, `resultado.raiz` = último x (sugestão);
    - mensagem: “Os iterados convergem para x = 0, uma raiz múltipla (último x = …); o erro relativo |Δx|/|x| não diminui quando a raiz é 0 (fica em ≈ 0,5). Use o critério absoluto.”
    - Escolhi erro e não resultado com aviso porque o critério pedido nunca foi satisfeito; o x mostrado é só uma sugestão.
  - O código consta em `codigos` do item Newton 'criterio-parada'. As funções exibidas não mudaram.
  - Na bissecção não foi preciso: o fallback de 1e−12 termina (x em [−1, 2] volta a 40 iterações).
  - **`CONVERGENCIA_LENTA` só na fase final:** além das 3 últimas razões entre 0,2 e 0,95, exige que não haja aceleração quadrática no fim (última razão ≥ 0,7× a primeira). Ela continua aparecendo em x³ (também junto com o erro novo) e em (x−1)².
  - **Casos:**
    - Bissecção x − 5e−5 em [−1, 2], ε = 1e−4: 30 iterações, erro relativo real 1,7e−6.
    - Newton x² − 2,5e−9, ε = 1e−4: x0 = 1 → 18 iterações (erro relativo real 8e−12); x0 = 10 → 21; x0 = 0,001 → 8. Nenhum aviso.
    - Newton x³, x0 = 1, ε = 1e−4: erro `RAIZ_EM_ZERO_CRITERIO_RELATIVO` em 36 iterações, último x = 4,578e−7.

## 21. ε padrão do critério relativo (decisão do usuário, 27/10/2026)

- `Metodos.TOL_PADRAO = { relativo: 0.01, absoluto: null }` (congelado). É a tabela da professora.
- No critério relativo, `tol` ausente, `null` ou `''` (inclusive só espaços) passa a ser ε = 0,01.
- No absoluto não há padrão, como antes: `tol` ausente dá `ENTRADA_INVALIDA` (“"tolerância" deve ser um número válido.”).
- `tol` ≤ 0 continua dando `ENTRADA_INVALIDA`.
- `resultado.tol` traz o valor efetivamente usado, nos dois métodos (inclusive na raiz no extremo).
- As funções exibidas (`Metodos.bisseccao/newton`) **não** têm padrão para `tol`, porque recebem o valor já validado; nada mudou nelas nem nos marcadores.
- Referências com ε = 0,01 no relativo:
  - Bissecção x³ − 9x + 3 em [0, 1]: 9 iterações, raiz 0,337890625.
  - Bissecção x³ − x − 2 em [1, 2] (valor inicial da UI): 7 iterações, raiz 1,5234375.
  - Newton x² − 2, x0 = 3: 4 iterações, raiz 1,41421378.
