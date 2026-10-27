# Casos de teste — Métodos Numéricos

## 1. Origem dos valores

- Gerados por `/workspace/qa-metodos-numericos/referencia.py` (Python 3), saída em `/workspace/qa-metodos-numericos/casos.json`. Este documento é gerado a partir do JSON por `gerar_doc.py` na mesma pasta.
- Bissecção e Newton: aritmética float64 (IEEE 754); raiz de referência calculada com mpmath (40 dígitos).
- Gauss: eliminação com pivoteamento parcial em frações exatas (`fractions.Fraction`) + versão float64 e numpy para comparação.
- Regenerar: `cd /workspace/qa-metodos-numericos && python3 referencia.py && python3 gerar_doc.py` (requer numpy e mpmath).

## 2. Convenções

- **Contagem:** k=1 é o primeiro ponto calculado (Bissecção: c₁=(a+b)/2; Newton: x₁ a partir de x₀). Máximo padrão: 100 iterações.
- **Critérios de parada (testados logo após calcular o ponto):**
  - `meia_largura`: (b−a)/2 < tol, com [a,b] o intervalo antes do corte (Burden & Faires).
  - `residuo`: |f(x)| < tol.
  - `passo`: |x_k − x_{k−1}| < tol (na Bissecção só a partir de k=2).
  - Bissecção também para se f(c)=0 exatamente.
- **Tolerância de ±1 iteração** é aceitável se o site contar a partir de 0, testar o critério depois de atualizar o intervalo ou usar ≤ em vez de <. Diferença maior = defeito.
- **O site deve declarar na interface qual critério de parada e qual contagem usa.** Sem isso, a contagem não é verificável.

## 3. Bissecção

| f(x) | [a,b] | raiz esperada | tol | meia_largura | residuo | passo | ⌈log₂((b−a)/tol)⌉ |
|---|---|---|---|---|---|---|---|
| x^3-x-2 | [1,2] | 1.5213797068 | 0.001 | 10 | 9 | 10 | 10 |
| x^3-x-2 | [1,2] | 1.5213797068 | 1e-06 | 20 | 22 | 20 | 20 |
| x^3-x-2 | [1,2] | 1.5213797068 | 1e-10 | 34 | 33 | 34 | 34 |
| x^2-2 | [0,2] | 1.4142135624 | 0.001 | 11 | 8 | 11 | 11 |
| x^2-2 | [0,2] | 1.4142135624 | 1e-06 | 21 | 22 | 21 | 21 |
| x^2-2 | [0,2] | 1.4142135624 | 1e-10 | 35 | 30 | 35 | 35 |
| cos(x)-x | [0,1] | 0.7390851332 | 0.001 | 10 | 10 | 10 | 10 |
| cos(x)-x | [0,1] | 0.7390851332 | 1e-06 | 20 | 20 | 20 | 20 |
| cos(x)-x | [0,1] | 0.7390851332 | 1e-10 | 34 | 30 | 34 | 34 |
| e^x-3x | [0,1] | 0.6190612867 | 0.001 | 10 | 9 | 10 | 10 |
| e^x-3x | [0,1] | 0.6190612867 | 1e-06 | 20 | 18 | 20 | 20 |
| e^x-3x | [0,1] | 0.6190612867 | 1e-10 | 34 | 32 | 34 | 34 |

### Primeiras linhas da tabela de iterações

**x^3-x-2 em [1,2]**

| k | a | b | c | f(c) | (b−a)/2 |
|---|---|---|---|---|---|
| 1 | 1 | 2 | 1.5 | -0.125 | 0.5 |
| 2 | 1.5 | 2 | 1.75 | 1.609375 | 0.25 |
| 3 | 1.5 | 1.75 | 1.625 | 0.666015625 | 0.125 |
| 4 | 1.5 | 1.625 | 1.5625 | 0.2521972656 | 0.0625 |
| 5 | 1.5 | 1.5625 | 1.53125 | 0.05911254883 | 0.03125 |
| 6 | 1.5 | 1.53125 | 1.515625 | -0.03405380249 | 0.015625 |

**x^2-2 em [0,2]**

| k | a | b | c | f(c) | (b−a)/2 |
|---|---|---|---|---|---|
| 1 | 0 | 2 | 1 | -1 | 1 |
| 2 | 1 | 2 | 1.5 | 0.25 | 0.5 |
| 3 | 1 | 1.5 | 1.25 | -0.4375 | 0.25 |
| 4 | 1.25 | 1.5 | 1.375 | -0.109375 | 0.125 |
| 5 | 1.375 | 1.5 | 1.4375 | 0.06640625 | 0.0625 |
| 6 | 1.375 | 1.4375 | 1.40625 | -0.0224609375 | 0.03125 |

**cos(x)-x em [0,1]**

| k | a | b | c | f(c) | (b−a)/2 |
|---|---|---|---|---|---|
| 1 | 0 | 1 | 0.5 | 0.3775825619 | 0.5 |
| 2 | 0.5 | 1 | 0.75 | -0.01831113113 | 0.25 |
| 3 | 0.5 | 0.75 | 0.625 | 0.1859631195 | 0.125 |
| 4 | 0.625 | 0.75 | 0.6875 | 0.08533494615 | 0.0625 |
| 5 | 0.6875 | 0.75 | 0.71875 | 0.03387937242 | 0.03125 |
| 6 | 0.71875 | 0.75 | 0.734375 | 0.007874725459 | 0.015625 |

**e^x-3x em [0,1]**

| k | a | b | c | f(c) | (b−a)/2 |
|---|---|---|---|---|---|
| 1 | 0 | 1 | 0.5 | 0.1487212707 | 0.5 |
| 2 | 0.5 | 1 | 0.75 | -0.1329999834 | 0.25 |
| 3 | 0.5 | 0.75 | 0.625 | -0.006754042568 | 0.125 |
| 4 | 0.5 | 0.625 | 0.5625 | 0.06755465696 | 0.0625 |
| 5 | 0.5625 | 0.625 | 0.59375 | 0.02951607212 | 0.03125 |
| 6 | 0.59375 | 0.625 | 0.609375 | 0.01115648854 | 0.015625 |

## 4. Newton-Raphson

| f(x) | x₀ | raiz esperada | tol | passo | residuo |
|---|---|---|---|---|---|
| x^2-2 | 1.0 | 1.4142135624 | 0.001 | 4 | 3 |
| x^2-2 | 1.0 | 1.4142135624 | 1e-06 | 5 | 4 |
| x^2-2 | 1.0 | 1.4142135624 | 1e-10 | 5 | 4 |
| x^3-x-2 | 1.5 | 1.5213797068 | 0.001 | 2 | 2 |
| x^3-x-2 | 1.5 | 1.5213797068 | 1e-06 | 3 | 2 |
| x^3-x-2 | 1.5 | 1.5213797068 | 1e-10 | 4 | 3 |
| cos(x)-x | 0.5 | 0.7390851332 | 0.001 | 3 | 2 |
| cos(x)-x | 0.5 | 0.7390851332 | 1e-06 | 4 | 3 |
| cos(x)-x | 0.5 | 0.7390851332 | 1e-10 | 5 | 4 |

### Primeiras linhas da tabela de iterações

**x^2-2, x₀=1.0**

| k | x_(k−1) | f | f' | x_k | \|Δx\| |
|---|---|---|---|---|---|
| 1 | 1 | -1 | 2 | 1.5 | 0.5 |
| 2 | 1.5 | 0.25 | 3 | 1.416666667 | 0.08333333333 |
| 3 | 1.416666667 | 0.006944444444 | 2.833333333 | 1.414215686 | 0.002450980392 |
| 4 | 1.414215686 | 6.007304883e-06 | 2.828431373 | 1.414213562 | 2.12389982e-06 |
| 5 | 1.414213562 | 4.510614104e-12 | 2.828427125 | 1.414213562 | 1.594724353e-12 |

**x^3-x-2, x₀=1.5**

| k | x_(k−1) | f | f' | x_k | \|Δx\| |
|---|---|---|---|---|---|
| 1 | 1.5 | -0.125 | 5.75 | 1.52173913 | 0.02173913043 |
| 2 | 1.52173913 | 0.002136927755 | 5.947069943 | 1.521379806 | 0.00035932447 |
| 3 | 1.521379806 | 5.89387426e-07 | 5.943789542 | 1.521379707 | 9.916021115e-08 |
| 4 | 1.521379707 | 4.52970994e-14 | 5.943788637 | 1.521379707 | 7.549516567e-15 |

**cos(x)-x, x₀=0.5**

| k | x_(k−1) | f | f' | x_k | \|Δx\| |
|---|---|---|---|---|---|
| 1 | 0.5 | 0.3775825619 | -1.479425539 | 0.7552224171 | 0.2552224171 |
| 2 | 0.7552224171 | -0.02710331186 | -1.685450632 | 0.7391416661 | 0.01608075096 |
| 3 | 0.7391416661 | -9.461538062e-05 | -1.673653811 | 0.7390851339 | 5.653222907e-05 |
| 4 | 0.7390851339 | -1.180977871e-09 | -1.67361203 | 0.7390851332 | 7.056460971e-10 |
| 5 | 0.7390851332 | 0 | -1.673612029 | 0.7390851332 | 0 |

## 5. Eliminação de Gauss

| Caso | A | b | Resultado esperado | Trocas de linha (pivoteamento parcial) |
|---|---|---|---|---|
| classico 3x3 | `[[2, 1, -1], [-3, -1, 2], [-2, 1, 2]]` | `[8, -11, -3]` | x = (2, 3, -1) | L1↔L2, L2↔L3 |
| classico 3x3 (2) | `[[1, 1, 1], [0, 2, 5], [2, 5, -1]]` | `[6, -4, 27]` | x = (5, 3, -2) | L1↔L3 |
| classico 3x3 (3) | `[[3, 2, -4], [2, 3, 3], [5, -3, 1]]` | `[3, 15, 14]` | x = (3, 1, 2) | L1↔L3 |
| pivo zero na 1a posicao | `[[0, 2, 1], [1, -2, -3], [-1, 1, 2]]` | `[-8, 0, 3]` | x = (-4, -5, 2) | L1↔L2 (sem pivoteamento: falha (divisao por zero)) |
| singular sem solucao | `[[1, 2, 3], [2, 4, 6], [1, 1, 1]]` | `[6, 13, 3]` | sem solução (impossível) | L1↔L2, L2↔L3 |
| singular infinitas solucoes | `[[1, 2, 3], [2, 4, 6], [1, 1, 1]]` | `[6, 12, 3]` | infinitas soluções | L1↔L2, L2↔L3 |
| 1x1 | `[[4]]` | `[8]` | x = (2) | — |
| 1x1 singular 0x=5 | `[[0]]` | `[5]` | sem solução (impossível) | — |
| 1x1 singular 0x=0 | `[[0]]` | `[0]` | infinitas soluções | — |

**Hilbert 4×4**, b = H·[1,1,1,1] = (25/12, 77/60, 19/20, 319/420). Solução exata: (1, 1, 1, 1). Em float64 com pivoteamento parcial: 0.9999999999999927, 1.0000000000000693, 0.9999999999998548, 1.000000000000085 (erro máx. 1.45e-13). cond₂(H) ≈ 15513.7. O site deve aceitar erro dessa ordem e, idealmente, avisar sobre mau condicionamento.

As trocas registradas seguem pivoteamento parcial (maior |pivô| da coluna). Se o site só troca quando o pivô é zero, as trocas podem diferir, mas a solução deve ser a mesma.

## 6. Casos-limite e entradas inválidas

| Método | Caso | Status (gabarito) | Detalhes | Mensagem / comportamento esperado |
|---|---|---|---|---|
| Bissecção | sem troca de sinal: x^2+1 em [-1,1] | `erro_sem_troca_de_sinal` |  | Erro: f(a) e f(b) têm o mesmo sinal |
| Bissecção | sem troca de sinal (2 raizes): x^2-1 em [-2,2] | `erro_sem_troca_de_sinal` |  | Erro: f(a) e f(b) têm o mesmo sinal |
| Bissecção | raiz no extremo: x^2-4 em [2,3] | `raiz_no_extremo_a` | k=0, x=2 | Raiz é o extremo a (0 iterações) |
| Bissecção | raiz no extremo b: x-1 em [0,1] | `raiz_no_extremo_b` | k=0, x=1 | Raiz é o extremo b (0 iterações) |
| Bissecção | a>b: x^3-x-2 em [2,1] | `erro_a_maior_que_b` |  | Erro: a deve ser menor que b (ou troca automática informada) |
| Bissecção | intervalo degenerado [1,1] | `erro_intervalo_degenerado` |  | Erro: intervalo degenerado (a=b) |
| Bissecção | tol=0 | `erro_tolerancia_invalida` |  | Erro: tolerância deve ser positiva |
| Bissecção | tol<0 | `erro_tolerancia_invalida` |  | Erro: tolerância deve ser positiva |
| Bissecção | max iteracoes 0 | `erro_max_iteracoes_invalido` |  | Erro: máximo de iterações deve ser ≥ 1 |
| Bissecção | raiz exata no ponto medio: x-1 em [0,2] | `convergiu` | k=1, x=1 | Converge |
| Bissecção | x^2-1 em [0,3] (meio=1.5; raiz 1) | `convergiu` | k=22, x=0.9999997616 | Converge |
| Bissecção | a>b com troca automatica (se o site ordenar) | `convergiu` | k=20, x=1.521380424 | Converge |
| Newton | ciclo: x^3-2x+2, x0=0 | `max_iteracoes_atingido` | k=100; sequência: 0, 1, 0, 1, 0, 1 | Não convergiu no máximo de iterações (idealmente detectar ciclo) |
| Newton | derivada nula: x^2-2, x0=0 | `erro_derivada_nula` | k=0; sequência: 0 | Erro: derivada nula; escolha outro x₀ |
| Newton | divergencia: atan(x), x0=1.5 | `divergiu` | k=10; sequência: 1.5, -1.694079601, 2.321126961, -5.114087837, 32.29568391, -1575.316951 | Divergiu / não convergiu, sem travar |
| Newton | convergencia com atan(x), x0=1.0 (controle) | `convergiu` | k=6; x=0 | Converge |
| Newton | raiz multipla (x-1)^2, x0=2, tol=0.001, crit=passo | `convergiu` | k=10; x=1.000976562 | Converge linearmente (erro cai ~1/2 por passo); idealmente aviso de raiz múltipla |
| Newton | raiz multipla (x-1)^2, x0=2, tol=0.001, crit=residuo | `convergiu` | k=5; x=1.03125 | Converge linearmente (erro cai ~1/2 por passo); idealmente aviso de raiz múltipla |
| Newton | raiz multipla (x-1)^2, x0=2, tol=1e-06, crit=passo | `convergiu` | k=20; x=1.000000954 | Converge linearmente (erro cai ~1/2 por passo); idealmente aviso de raiz múltipla |
| Newton | raiz multipla (x-1)^2, x0=2, tol=1e-06, crit=residuo | `convergiu` | k=10; x=1.000976562 | Converge linearmente (erro cai ~1/2 por passo); idealmente aviso de raiz múltipla |
| Newton | raiz multipla (x-1)^2, x0=2, tol=1e-10, crit=passo | `convergiu` | k=34; x=1 | Converge linearmente (erro cai ~1/2 por passo); idealmente aviso de raiz múltipla |
| Newton | raiz multipla (x-1)^2, x0=2, tol=1e-10, crit=residuo | `convergiu` | k=17; x=1.000007629 | Converge linearmente (erro cai ~1/2 por passo); idealmente aviso de raiz múltipla |
| Newton | raiz multipla tabela (razao de erro 1/2 = linear) | `convergiu` | k=34; x=1 | Converge linearmente (erro cai ~1/2 por passo); idealmente aviso de raiz múltipla |
| Newton | x0=NaN | `erro_x0_nao_finito` |  | Erro de validação: x₀ deve ser um número finito |
| Newton | x0=Infinity | `erro_x0_nao_finito` |  | Erro de validação: x₀ deve ser um número finito |
| Newton | f produz NaN: sqrt(x)-1 com x0=-1 (dominio) | `erro_nao_finito` | k=1 | Erro: f(x) não definida / resultado não finito |
| Gauss | vazio | `erro_matriz_vazia` | | Erro: matriz vazia |
| Gauss | texto | `erro_entrada_nao_numerica` | | Erro: entrada não numérica |
| Gauss | dimensoes incompativeis A 2x3 | `erro_dimensoes_incompativeis` | | Erro: dimensões incompatíveis |
| Gauss | dimensoes incompativeis b | `erro_dimensoes_incompativeis` | | Erro: dimensões incompatíveis |
| Todos | Campo vazio, texto, NaN, Infinity em qualquer campo numérico | — | | Erro de validação no campo; nada é calculado; a página não trava |

## 7. Botão "Ver código"

Critérios que o QA vai validar em **cada um dos três métodos**:

- [ ] O botão "Ver código" existe **e funciona** nas três abas (Bissecção, Newton-Raphson, Gauss).
- [ ] Cada aba mostra a **própria** função (Bissecção mostra a bissecção, Newton mostra Newton, Gauss mostra Gauss) — nunca o código de outro método.
- [ ] O código mostrado é o que de fato roda: executado com os casos das seções 3–6, produz os mesmos resultados e contagens que o site exibe.
- [ ] Curto e legível: nomes claros em português ou na notação do livro (a, b, c, x0, tol, maxIter), sem minificação, sem dependências escondidas.
- [ ] Comentários curtos nos passos principais.
- [ ] Critério de parada explícito no código (igual ao declarado na interface).
- [ ] Tratamento dos casos-limite visível (sem troca de sinal, derivada nula, pivô zero/singular, entradas inválidas).
- [ ] Abre e fecha sem travar, inclusive repetidamente e durante animação.
- [ ] Legível no celular: fonte monoespaçada, rolagem horizontal ou quebra de linha, sem cortar texto.

### Pseudocódigo de referência (nível de simplicidade esperado)

**Bissecção**
```
bissecao(f, a, b, tol, maxIter):
  se tol <= 0 ou maxIter < 1 ou a >= b: erro "entrada inválida"
  se f(a) == 0: retorna a;  se f(b) == 0: retorna b
  se f(a)*f(b) > 0: erro "f(a) e f(b) têm o mesmo sinal"
  para k = 1..maxIter:
    c = (a + b) / 2                    # ponto médio
    se f(c) == 0 ou (b - a)/2 < tol: retorna c, k   # critério de parada
    se f(a)*f(c) < 0: b = c  senão: a = c          # mantém a troca de sinal
  erro "não convergiu em maxIter iterações"
```

**Newton-Raphson**
```
newton(f, df, x0, tol, maxIter):
  x = x0
  para k = 1..maxIter:
    se df(x) == 0: erro "derivada nula em x"
    xNovo = x - f(x)/df(x)             # passo de Newton
    se xNovo não é finito: erro "divergiu"
    se |xNovo - x| < tol: retorna xNovo, k          # critério de parada
    x = xNovo
  erro "não convergiu em maxIter iterações"
```

**Eliminação de Gauss (pivoteamento parcial)**
```
gauss(A, b):                           # A n×n, b tamanho n
  valida dimensões e números
  para j = 1..n:
    p = linha com maior |A[i][j]|, i >= j            # escolhe pivô
    se A[p][j] == 0: erro "sistema singular"
    troca linhas j e p (em A e b)
    para i = j+1..n:                                 # zera abaixo do pivô
      m = A[i][j] / A[j][j]
      linha i = linha i - m * linha j
  para i = n..1:                                     # retrosubstituição
    x[i] = (b[i] - soma(A[i][k]*x[k], k>i)) / A[i][i]
  retorna x
```
(Para distinguir "sem solução" de "infinitas soluções", verificar a matriz aumentada escalonada: linha 0 = c≠0 → impossível; posto < n → infinitas.)
