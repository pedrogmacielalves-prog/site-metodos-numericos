# Relatório de QA — v1 (27/10/2026, horário de Brasília)

Ambiente: Chromium headless (Playwright 1.x, Python), `file:///workspace/site-metodos-numericos/index.html`, viewports 1280×800 e 390×844 (mobile, touch), temas escuro e claro. Gabarito: `docs/casos-de-teste.md` / `/workspace/qa-metodos-numericos/casos.json`. Scripts de teste: `/workspace/qa-metodos-numericos/qa_v1*.py`. Screenshots: `/workspace/qa-metodos-numericos/screens-v1/`.
Obs.: `js/metodos/{bisseccao,newton,gauss,comum}.js` foram alterados às 16:15–16:16 durante a sessão; a bateria numérica foi repetida às 16:19 com resultados idênticos.

## Resumo

| Gravidade | Qtde |
|---|---|
| Crítica | 0 |
| Alta | 1 |
| Média | 4 |
| Baixa | 7 |

Fora do escopo (pendências conhecidas, não reportadas): zoom do Newton nos últimos passos e na divergência; linha ativa do código fixa na bissecção e no Newton.

---

## Bugs

### BUG-01 — Alta — Newton: divergência diagnosticada como "derivada nula"
- **Passos:** aba Newton-Raphson; f(x) = `atan(x)`, f' vazio, x₀ = 1.5, tol = 1e-6, máx. 100; Calcular.
- **Esperado:** mensagem de divergência (gabarito: x = 1.5 → −1.694 → 2.321 → −5.114 → 32.30 → −1575.3 → …, |x| crescendo).
- **Obtido:** erro "Derivada ≈ 0 em x = 3894980: a tangente é horizontal e não cruza o eixo x. Tente outro x0." Tabela com 6 linhas; última: x = −1575.31695082, f = −1.570162, f' = 4.030e−7, xₖ₊₁ = 3.895e+6. Causa provável: o teste `Math.abs(dfx) < 1e-12` (f'(3.9e6) ≈ 6.6e−14) dispara antes do teste de divergência `|x| > 1e10`. Diagnóstico errado num site didático. Screenshot: `newton-atan-mensagem.png`.

### BUG-02 — Média — Newton: exceção JS quando a derivada é nula já em x₀
- **Passos:** Newton; f = `x^2-2`, x₀ = 0; Calcular.
- **Esperado:** mensagem de erro, sem exceção.
- **Obtido:** mensagem correta na tela ("Derivada ≈ 0 em x = 0…", player 0/0, tabela vazia), mas `pageerror`: `Cannot read properties of undefined (reading 'fx')` (provável acesso a passo inexistente no visual do Newton com 0 passos). Reproduzido em 3 execuções. Screenshot: `newton-derivada-nula.png`.

### BUG-03 — Média — Critério de parada não declarado na interface
- **Passos:** abrir Bissecção e Newton; procurar critério de parada na página.
- **Esperado (doc §2):** o site declara o critério e a convenção de contagem.
- **Obtido:** nenhum texto na interface (busca por "critério"/"parada" em index.html e js/app.js/js/visual sem resultados). O critério só é visível no "Ver código": Bissecção `(b − a)/2 < tol`, Newton `|xNovo − x| < tol`. Contagens batem com o gabarito (ver "O que passou").

### BUG-04 — Média — "Ver código" esconde dependências e o tratamento dos casos-limite
- **Passos:** em cada aba, clicar "Ver código".
- **Esperado (doc §7):** sem dependências escondidas; tratamento dos casos-limite visível.
- **Obtido:** a gaveta mostra só `Metodos.<metodo>.toString()` (44/38/59 linhas). O código chama funções não exibidas: `Metodos.textos.*`, `Metodos.erroRelativo` (todos), `Metodos.toleranciaPivo`, `Metodos.linhaDoMaiorPivo`/`linhaDoPrimeiroPivoNaoNulo` (Gauss). As validações (sem troca de sinal, a>b com troca automática, a=b, tol ≤ 0, máx. iterações, NaN/Infinity) e a classificação impossível × infinitas soluções do Gauss ficam em `validacao.js` e não aparecem. Rodando só o código exibido, `x^2+1` em [−1,1] não gera erro (f(a)·f(b) > 0 não é testado).

### BUG-05 — Média — Mobile: gaveta "Ver código" não é sobreposição; fica no fim da página
- **Passos:** viewport 390×844; qualquer aba; "Ver código".
- **Esperado:** painel modal utilizável dentro da tela.
- **Obtido:** abaixo do breakpoint a gaveta tem `position: static`, é renderizada após o conteúdo e cresce com o código: altura 1190 px (Bissecção), 1034 px (Newton), 1519 px (Gauss) em tela de 844 px; o corpo não rola internamente (scrollHeight = clientHeight = 1387 px no Gauss) e rola junto com a página (após rolar, topo da gaveta em −675 px, botões Copiar/✕ fora da tela). O selo "Eliminação de Gauss" quebra em duas linhas e fica cortado na borda esquerda. Funcionam: rolagem horizontal do código (scrollWidth 653 > 388), fonte monoespaçada 14 px, Esc fecha. Screenshots: `dark-390-codigo-gauss.png`, `mobile-codigo-gauss-apos-rolar.png`.

### BUG-06 — Baixa — Newton: raiz múltipla sem aviso
- **Passos:** f = `(x-1)^2`, x₀ = 2, tol 1e-3 / 1e-6 / 1e-10.
- **Esperado:** convergência linear com aviso de raiz múltipla (doc §6).
- **Obtido:** valores corretos (10/20/34 iterações; raiz 1.0009765625 / 1.00000095367 / 1.00000000006 — idênticos ao gabarito), sem aviso. O aviso de raiz múltipla só existe para o caso `RAIZ_EXATA`.

### BUG-07 — Baixa — "NaN" exibido na mensagem
- **Passos:** Bissecção; f = `sqrt(x)-1`, [−1, 4].
- **Obtido:** "f(a) ou f(b) não é um número finito (f(-1) = NaN, f(4) = 1)." Mensagem clara, mas mostra "NaN" (critério do doc: sem NaN na tela). Sugestão: "f não está definida em x = −1".

### BUG-08 — Baixa — Vírgula decimal tratada de forma inconsistente
- **Obtido:** Gauss aceita "1,5" (sistema [[2, 1,5 | 5],[1, −3 | −1]] → x1 = 1.8, x2 = 0.93333333); Bissecção rejeita a = "1,5" com '"a" deve ser um número válido.' (a ajuda da Bissecção diz "Use ponto decimal"; Newton idem, sem aviso no Gauss).

### BUG-09 — Baixa — Alvos de toque menores que 44 px
- **Obtido (390×844):** botões do player 40×40 px; Calcular 90×40; Ver código 135×40; Exemplo 92×40; Ver tudo 92×40; seletor de velocidade 81×40; abas 42 px de altura.

### BUG-10 — Baixa — Raiz no extremo: "0 iterações (estimativa teórica: 20)"
- **Passos:** Bissecção `x^2-4` em [2,3] (ou `x-1` em [0,1]), tol 1e-6.
- **Obtido:** "Raiz ≈ 2 após 0 iterações (estimativa teórica: 20)." Resultado correto, mas a estimativa é irrelevante/confusa nesse caso (idem `x-1` em [0,2]: "após 1 iterações (estimativa teórica: 21)"; também "1 iterações" no singular).

### BUG-11 — Baixa — Gauss: erro de célula não indica qual célula
- **Passos:** célula vazia ou "abc" na matriz.
- **Obtido:** '"elemento da matriz" deve ser um número válido.' sem linha/coluna nem destaque do campo.

### BUG-12 — Baixa — Bissecção: descrição do último passo anuncia atualização que não ocorre
- **Passos:** `x^3-x-2` [1,2], tol 1e-6; ir ao fim (20/20).
- **Obtido:** "k = 20: … f(a)·f(c) < 0 → raiz em [a, c]; b ← c", mas o método parou nesse passo (erro 9.537e−7 < tol). Esperado: indicar "critério atingido, raiz ≈ c".

---

## O que passou

- **Bissecção (4 funções × 3 tolerâncias):** raiz e nº de iterações idênticos ao gabarito com critério `meia_largura` — x³−x−2: 10/20/34 (raiz 1.521379707 com 1e−10); x²−2: 11/21/35; cos(x)−x: 10/20/34; eˣ−3x: 10/20/34. Estimativa teórica exibida = ⌈log₂((b−a)/tol)⌉. Primeiras linhas da tabela (c = 1.5, 1.75, 1.625, 1.5625) conferem.
- **Newton (3 funções × 3 tolerâncias):** iterações = gabarito com critério `passo`: √2: 4/5/5; x³−x−2: 2/3/4; cos(x)−x: 3/4/4 (gabarito 3/4/5). **Observação (±1, não bug):** em cos(x)−x com tol 1e−10 o site para com 4 iterações porque f(x₄) é exatamente 0 em float64 (`RAIZ_EXATA`, sem registrar o passo 5); o gabarito conta o 5º passo (|Δx| = 0). Raiz igual. Raízes: 1.41421356237, 1.5213797068, 0.739085133215. Derivada simbólica exibida corretamente; f' informada (`2*x`) dá o mesmo resultado. Tabela começa em k = 0 (linha k produz x_{k+1}); o total de linhas = nº de iterações do gabarito.
- **Casos-limite Bissecção:** sem troca de sinal (x²+1 e x²−1), a = b, tol = 0 e < 0, máx. iterações 0 e 100000, a vazio/texto/NaN/Infinity, f vazia, sintaxe inválida, 1/x em [−1,1] — mensagens claras, sem travar, sem exceção. a > b: troca automática com aviso, resultado 1.521380424 em 20 iterações (= gabarito).
- **Casos-limite Newton:** ciclo x³−2x+2 (x₀=0) → "entraram em ciclo (oscilação)" após 100 iterações; x₀ NaN/Infinity/vazio/texto, tol 0, máx. 0, sqrt(x)−1 com x₀=−1 → mensagens claras. Máx. 10000 no ciclo: calcula em ~0,9 s sem travar.
- **Gauss:** clássicos (2,3,−1), (5,3,−2), (3,1,2); pivô zero → L1 ↔ L2 e (−4,−5,2), com e sem pivoteamento; sem solução → "impossível"; infinitas → "infinitas soluções"; Hilbert 4×4 → (1,1,1,1). Etapas na ordem: inicial → troca → pivô → eliminações → substituição regressiva x3, x2, x1 → solução.
- **Player:** autoplay ao calcular; avançar/voltar/início/fim; play no fim reinicia do 1; tabela destaca a linha do passo atual; clique na linha vai ao passo; trocar de aba pausa a animação (Newton ficou em 2/5, "Reproduzir").
- **Ver código:** existe e abre nas três abas, cada uma com a própria função (bisseccao/newton/gauss, origem `window.Metodos.<m>.toString()`, ou seja, o código que roda); Copiar copia exatamente o texto (verificado via clipboard: 1244/1289/2406 caracteres) e mantém o foco no botão; Esc fecha e devolve o foco ao botão "Ver código"; desktop: gaveta lateral fixa 640 px, fonte monoespaçada, comentários curtos e critério de parada explícito.
- **Temas e layout:** escuro e claro legíveis (gráfico, tabela e código visíveis nos dois); sem rolagem horizontal da página em 1280 e 390 (scrollWidth = clientWidth); tabela com rolagem própria no mobile; gráfico 314×378 px no mobile.
- **Console:** nenhum erro de console além do BUG-02.
