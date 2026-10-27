# Relatório — exercícios das listas 4 (bisseção) e 5 (Newton) no site

Data: 27/10/2026, por volta das 16:50 (BRT, UTC−3). O código do site não foi alterado.

**Artefatos**
- **Gabarito:** `/workspace/qa-metodos-numericos/lista_ref.py`, com saída em `lista_ref.json`. A raiz vem de `mpmath.findroot` com 50 dígitos; as iterações são calculadas em float64 por três critérios.
- **Saída do núcleo do site:** `lista_site.json`.
- **Teste automatizado:** `tests/lista-exercicios.test.js`. Usa `tests/carregar.cjs`, que já existia no projeto e carrega os scripts num `vm` com `window` falso.
- **Interface:** `qa_listas_ui.py`, com capturas de tela em `/workspace/qa-metodos-numericos/screens-listas/`.

**Resultado do `node --test tests/lista-exercicios.test.js`: FALHOU, com 19 testes aprovados e 2 reprovados.** As duas falhas são legítimas e correspondem aos bugs L-01 e L-02 abaixo. Os 15 exercícios em si estão todos OK.

## Conferência dos enunciados contra os PNGs

Os enunciados passados na tarefa conferem com `l1-1.png`, `l2-1.png` e `l2-2.png`. A página `l1-2.png` está em branco. Divergências e lacunas encontradas:

1. **L4-3:** o PNG traz "x log x − 1" sem indicar a base. Usei a base 10, como pedido; no site, `log` = log10.
2. **L5-3:** o PNG não define ε nem N, só "x0 = 1,9". Usei ε = 1e-4 e N = 10, os mesmos valores do L5-2.
3. **L5-4:** o PNG não dá x0 (ver a escolha abaixo).
4. **L5-5:** o PNG não dá N; usei N = 20 na (b) e N = 10 na (c). A (a) é só "mostre que existe raiz em (1,2)": f(1) = 0,841 > 0 e f(2) = −0,091 < 0.
5. **L5-9:** não tem N; usei 10.
6. **Erros de digitação na própria lista** (fora do escopo, só registro):
   - L5-7 diz "Refaça os exercícios 7 e 8", ou seja, refere a si mesmo;
   - L5-10 diz "x0 = 1 e x0 = 2", quando deveria ser x0 e x1.
7. **Critério de parada:** as listas pedem "erros absoluto e relativo (teste de parada)" e não definem a fórmula. Usei |xₖ − xₖ₋₁| < ε (absoluto) e |xₖ − xₖ₋₁|/|xₖ| < ε (relativo). Na bisseção, xₖ é o ponto médio cₖ.

## Escolhas documentadas

- **L4-2(a)/L5-2(a), x/2 − tg x:**
  - x = 0 é raiz, mas não é positiva.
  - Em (0, π/2), tg x > x/2, então não há raiz ali. Por exemplo, f(1) = −1,06 e f(1,5) = −13,4.
  - Em (π/2, 3π/2) a tangente vai de −∞ a +∞. A primeira raiz positiva está nesse ramo: f(4) = +0,842 e f(4,5) = −2,387.
  - Escolhi **[4; 4,5]**, que não contém as assíntotas π/2 ≈ 1,571 nem 3π/2 ≈ 4,712.
  - Para Newton, usei **x0 = 4,5**. Com x0 = 1 o site converge para 0, que não é positiva.
  - O intervalo (0, x) não serve, porque o site devolve "raiz exata x = 0" (ver o teste correspondente).
- **L4-2(b)/L5-2(b), 2cos x = eˣ/2:** f(0) = 1,5 e f(1) = −0,279; intervalo [0, 1] e x0 = 1.
- **L4-2(c)/L5-2(c), x⁵ − 6:** f(1) < 0 e f(2) > 0; intervalo [1, 2] e x0 = 1,5.
- **L5-4, x − x ln x:**
  - As raízes candidatas são x = e e x = 0. Em x = 0, ln não está definido.
  - f'(x) = −ln x se anula em x = 1, então x0 = 1 é proibido (o site avisa "Derivada ≈ 0").
  - Com x0 < 1, como 0,5, o primeiro passo cai em x < 0.
  - Escolhi **x0 = 2**.
- **L5-5(c) e L5-9:** x0 = 2 (extremo do intervalo de (a)) e x0 = 1 (dado no enunciado).
- **L5-1:** e^x − 3x tem duas raízes, 0,6191 e 1,5121. Com x0 = 2, como manda o enunciado, Newton vai para 1,5121, a mesma do L4-1.
- **L4-2(b) e L5-9:** é a mesma equação multiplicada por 2 (4cos x − eˣ = 0), então a raiz 0,904788 coincide.

## Tabela de resultados

Iterações do "site" seguem o critério do site: (b − a)/2 < ε na bisseção e |Δx| < ε no Newton. "Abs" e "rel" são os critérios da lista, calculados no gabarito.

| Exercício | Entrada usada | Raiz do site | Raiz de referência | It. site | It. ref. (site / abs / rel) | Situação |
|---|---|---|---|---|---|---|
| L4-1 | eˣ−3x, [1,2], ε=1e-5, N=20 | 1,5121383667 | 1,51213455165784 | 17 | 17 / 17 / 17 | ok |
| L4-2(a) | x/2−tg x, [4;4,5], ε=1e-4, N=20 | 4,2748413086 | 4,27478227145813 | 13 | 13 / 13 / 11 | ok |
| L4-2(b) | 2cos x−eˣ/2, [0,1], ε=1e-4, N=20 | 0,9048461914 | 0,904788217873019 | 14 | 14 / 14 / 14 | ok |
| L4-2(c) | x⁵−6, [1,2], ε=1e-4, N=20 | 1,4309692383 | 1,43096908110526 | 14 | 14 / 14 / 13 | ok |
| L4-3 | x·log10 x−1, [2,3], ε=5e-4, N=15 | 2,5063476563 | 2,50618414558877 | 11 | 11 / 11 / 10 | ok |
| L4-4 | x³−9x+3, [0,1], ε=1e-3, N=15 | 0,3369140625 | 0,337608955965838 | 10 | 10 / 10 / 12 | ok |
| L5-5(b) | 1+sen x−x, [1,2], ε=0,01 | 1,9296875 | 1,93456321075202 | 7 (estimativa do site: 7) | 7 / 7 / 6 | ok |
| L5-1 | eˣ−3x, x0=2, ε=1e-7, N=10 | 1,5121345517 | 1,51213455165784 | 6 | 6 / 6 / 6 | ok |
| L5-2(a) | x/2−tg x, x0=4,5, ε=1e-4, N=10 | 4,2747822718 | 4,27478227145813 | 5 | 5 / 5 / 5 | ok |
| L5-2(b) | 2cos x−eˣ/2, x0=1, ε=1e-4, N=10 | 0,9047882179 | 0,904788217873019 | 3 | 3 / 3 / 3 | ok |
| L5-2(c) | x⁵−6, x0=1,5, ε=1e-4, N=10 | 1,4309690847 | 1,43096908110526 | 3 | 3 / 3 / 3 | ok |
| L5-3 | x³−2x²−3x+10, x0=1,9, ε=1e-4, N=10 | −2,0000000000 | −2 (exata) | 10 | 10 / 10 / 10 | ok |
| L5-4 | x−x ln x, x0=2, ε=1e-5, N=10 | 2,7182818285 | 2,71828182845905 (e) | 4 | 4 / 4 / 4 | ok |
| L5-5(c) | 1+sen x−x, x0=2, ε=0,01, N=10 | 1,9345638738 | 1,93456321075202 | 2 | 2 / 2 / 2 | ok |
| L5-9 | 4cos x−eˣ, x0=1, ε=1e-2, N=10 | 0,9047940617 | 0,904788217873019 | 2 | 2 / 2 / 2 | ok |

- **15 de 15 exercícios OK:** em todos, |raiz do site − referência| ≤ ε, e as iterações batem com o gabarito pelo critério do site.
- **Interface:** conferida com Playwright em L4-1, L5-3, L5-5(b) e nos dois casos de bug (capturas em `screens-listas/`). Os valores na tela são iguais aos do núcleo, e não houve pageerror.

**L5-5(b), estimativa de iterações.**
- O site mostra "estimativa teórica: 7".
- ⌈log₂((b−a)/ε)⌉ = ⌈log₂(100)⌉ = ⌈6,64⌉ = 7.
- A fórmula usual da lista, k > (log(b−a) − log ε)/log 2 = 6,64, também dá 7. Ela não aparece no PNG; é a fórmula padrão do curso.
- A bisseção do site parou de fato em 7.

## Newton 3 (x³ − 2x² − 3x + 10, x0 = 1,9): o que o site fez

- **Trajetória.** Em x0 = 1,9, f'(1,9) = 0,23 é pequeno, então o primeiro passo salta para x1 = −15,226. Depois a sequência desce até a raiz: −9,999, −6,557, −4,335, −2,977, −2,268, −2,028, −2,0004, −2,0000001, −2.
- **Por que converge.** O polinômio é (x+2)(x² − 4x + 5) e tem **uma única raiz real, −2**. Por isso Newton, a partir de 1,9, **não oscila nem dá raiz errada**: converge para −2 após o salto.
- **Resultado do site.** Com ε = 1e-4 e N = 10, o site mostra "Raiz ≈ -2 após 10 iterações… Parou porque |xₖ₊₁ − xₖ| < tol". Está correto, e a tabela mostra o salto para −15,2.
- **Com N = 9** (ε = 1e-4 ainda não atingido, |Δx| = 2,8e-4), o site diz "Máximo de iterações atingido sem convergir". Também está correto.
- **Conclusão.** A premissa "Newton falha ou oscila" não se confirma com estes dados. O site não devolve raiz errada. Ele também não dá nenhum aviso sobre o salto grande; isso é só uma observação.

## Bugs

### L-01 — Alta — Bisseção aceita uma assíntota como "raiz" (falha não detectada)

**Passos:** Bissecção com f = x/2 − tg(x), a = 1, b = 2, ε = 1e-4, N = 20. Esta é uma tentativa natural para a "menor raiz positiva" do L4-2(a).

**Esperado:** detectar que f(c) explode e que não há raiz (a troca de sinal vem da descontinuidade em π/2), com erro ou aviso.

**Obtido:**
- ✓ "Raiz ≈ 1.570739746 após 14 iterações (estimativa teórica: 14). Parou porque (b − a)/2 < tol."
- No último passo, f(c) = −17673,085379.
- Não aparece nenhum aviso.
- Captura: `screens-listas/L4-2a-assintota.png`.
- Teste: "L4-2(a) armadilha…" falha.

### L-02 — Média — Mensagem com "NaN" ao sair do domínio no Newton

**Passos:** Newton com f = x − x·ln(x), x0 = 0,5, ε = 1e-5, N = 10.

**Esperado:** uma mensagem dizendo que x1 = −0,721348 está fora do domínio de ln.

**Obtido:**
- "f ou f' não é finita perto de x = NaN."
- A descrição do passo mostra x1 = −0,721348 corretamente.
- Captura: `screens-listas/L5-4-x0_0.5.png`.
- Teste: "L5-4 com x0 = 0,5…" falha.
- É o mesmo padrão do BUG-07 da v1, num caminho diferente.

## Observações (não são bugs)

- **Iterações por critério.** As diferenças entre os critérios do site e da lista são esperadas:
  - relativo: L4-2(a) 11 vs 13, L4-2(c) 13 vs 14, L4-3 10 vs 11, L4-4 12 vs 10, L5-5(b) 6 vs 7;
  - absoluto: no Newton coincide sempre com o site.
- **Derivada simbólica não simplificada.** O site mostra:
  - "f'(x) = 2 / 4 - 1 / cos(x)^2";
  - "f'(x) = 1 - (ln(x) + x * 1 / x)", que equivale a −ln x;
  - "f'(x) = -(2 * sin(x)) - 2 * exp(x) / 4".
  - Os valores estão corretos, mas a leitura é ruim para o aluno.
- **Separadores e precisão misturados.** O resultado usa ponto e 9 casas ("1.512138367"), e a tabela usa vírgula. No L5-3 o resultado mostra só "-2", com hífen, enquanto a tabela usa "−". Isso já foi registrado como BUG-16 da v2.
- **Aliases e funções aceitos:** `tg`, `sen`, `ln` e `log` (= log10) funcionam, e x0 = "1,9" com vírgula é aceito.
- **Domínio do L5-4.** Com x0 = 1, o site responde "Derivada ≈ 0 em x = 1…", o que está correto. Com x0 < 1, cai no L-02.

## Fora do escopo

- **L4-5:** falsa posição.
- **L5-6:** "faça um programa" (Newton).
- **L5-7:** secante, com f'(x) aproximada por diferenças, x0 = 2, x1 = 3, ε = 1e-5, N = 10.
- **L5-8:** "faça um programa" (secante).
- **L5-10:** secante para √x − 5e^(−x) = 0.
