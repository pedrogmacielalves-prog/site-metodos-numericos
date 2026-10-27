# Relatório de QA — v2 (reteste)

Data: 27/10/2026, 16:30–16:45 (BRT, UTC−3). Chromium headless (Playwright), viewports 1280×800 e 390×844, temas escuro e claro.
Scripts e dados: `/workspace/qa-metodos-numericos/` (`qa_v2_bateria.py`, `qa_v2_gauss.py`, `qa_v2_ui.py`, `dbg*.py`; resultados em `qa_v2_res.json`, `qa_v2_gauss.json`, `qa_v2_ui.json`, `qa_v2_ui2.json`). Capturas de tela: `screens-v2/`.
Nenhum código do site foi alterado.

> **Atenção: o site mudou durante o teste.** `js/app.js` foi modificado às 16:34:57, 16:35:42, 16:38:10 e 16:43:22; `validacao.js`, `gauss-entrada.js`, `gauss-mapa.js` e `gauss.js` às 16:42. Por isso a bateria Gauss/precisão foi refeita às 16:43:31, com os arquivos já nessa versão; os números da tabela de desempenho vêm dessa última execução. Os testes de colagem, código e layout rodaram entre 16:38 e 16:42.
>
> **Observação transitória (não contada como bug):** entre 16:34 e 16:38, todo cálculo de Gauss com n ≤ 10 lançava `TypeError: Cannot read properties of null (reading 'value') at abas.gauss (app.js:58)`, ao abrir a aba, em Exemplo e em Calcular. A causa era `form.querySelector` não encontrar os inputs, que ficam fora do `<form>`. A partir da versão das 16:38:10 isso não acontece mais (Exemplo 3×3 → x = (2, 3, −1)).

## Resumo por severidade (bugs novos)

| Severidade | Qtde | Bugs |
|---|---|---|
| Crítica | 0 | — |
| Alta | 1 | BUG-13 |
| Média | 1 | BUG-14 |
| Baixa | 5 | BUG-15 a BUG-19 |

## Status dos bugs da v1

| Bug | Status | Evidência v2 |
|---|---|---|
| BUG-01 (atan, x0=1,5 → "Derivada ≈ 0 em x = 3894980") | **Resolvido** | Agora mostra "O método divergiu…", com 6 linhas na tabela. |
| BUG-02 (pageerror `reading 'fx'` com f'(x0)=0) | **Não resolvido** | f = x^2−2, x0 = 0: a mensagem está correta ("Derivada ≈ 0 em x = 0…"), mas ainda dispara o pageerror `Cannot read properties of undefined (reading 'fx')` (16:43). |
| BUG-03 (critério de parada não declarado) | **Resolvido** | Bissecção: "Parou porque (b − a)/2 < tol." Newton também declara o critério. |
| BUG-04 ("Ver código" esconde dependências) | **Parcialmente** | Agora indica a origem ("Fonte real em execução: window.Metodos.bisseccao.toString()"). Continuam ocultas as funções auxiliares chamadas pelo código: `Metodos.erroRelativo` e `Metodos.textos.*` em bisseccao.js e newton.js; `Metodos.toleranciaPivo`, `linhaDoMaiorPivo` e `linhaDoPrimeiroPivoNaoNulo` em gauss.js. As validações de `validacao.js` também não aparecem. |
| BUG-05 (gaveta mobile estática, 1519 px, selo cortado) | **Resolvido** | A 390×844 a gaveta tem 390×844, fixa em (0,0) e com corpo rolável. |
| BUG-06 (sem aviso de raiz múltipla) | **Resolvido** | Mostra aviso de convergência linear / raiz múltipla. |
| BUG-07 ("NaN" na mensagem) | **Resolvido** | "f não está definida em x = -1 (extremo a)". |
| BUG-08 (vírgula decimal inconsistente) | **Resolvido** nas entradas | Bissecção aceita a = "1,5" (19 iterações, raiz 1.521380424). A colagem com `;`/TAB e "0,5" funciona. A saída ainda mistura separadores (ver BUG-16). |
| BUG-09 (alvos de toque de 40 px) | **Parcialmente** | A 390 px os botões têm ≥ 44 px. Ficam abaixo: o checkbox "Pivoteamento parcial", com 13×13 px, e as células da grade n = 10, com 58×40 px. A 1280 os botões continuam com 40 px (aceitável em desktop). |
| BUG-10 ("0 iterações (estimativa teórica: 20)") | **Resolvido** | Mostra a mensagem de raiz exata e um aviso. |
| BUG-11 (erro de célula Gauss não diz qual) | **Resolvido** | "Linha 1, coluna 2: "abc" não é um número." |
| BUG-12 (último passo da bissecção descreve "b ← c") | **Resolvido** | k = 14: "(b − a)/2 < tolerância: critério atingido, raiz ≈ c." |

## Bateria de casos (reexecução completa)

- **Bissecção:** todas as contagens batem com o gabarito (10/20/34; 11/21/35; 10/20/34; 10/20/34 para tol 1e-3, 1e-6 e 1e-10).
- **Newton:** todas as contagens batem com o gabarito. cos(x)−x com tol 1e-10 dá 4 iterações porque f(x4) = 0,0 exatamente; isso já foi observado na v1 e não é bug.
- **Gauss** (versão das 16:38 em diante):
  - os três clássicos, o pivô zero, Hilbert 4 e os dois singulares batem com o gabarito;
  - o singular sem solução é classificado como "impossível" e o com b = (6,12,3) como "infinitas soluções".

## Desempenho e precisão de Gauss

Sistemas aleatórios gerados com `numpy.random.default_rng(20261027)`: A normal padrão, x inteiro em [−5, 5], b = A·x. Comparação com `numpy.linalg.solve`. O "núcleo" é `Metodos.executar.gauss` chamado direto na página.

Na interface, a matriz foi colada com TAB pelo painel Colar:

- "handler" é o tempo síncrono do clique em Carregar;
- "render" vai do fim do clique até 2 rAF;
- a responsividade foi medida durante 3 s de animação, com o maior intervalo entre rAF e o maior atraso de `setTimeout(20)`;
- tarefas longas foram observadas com PerformanceObserver.

Medição às 16:43 BRT, 1280×800.

| Caso | n | cond₂(A) | erro máx. vs numpy | ‖Ax−b‖∞ | núcleo (ms) | handler + render (ms) | maior intervalo rAF (ms) | atraso timer (ms) | long tasks |
|---|---|---|---|---|---|---|---|---|---|
| aleatório | 2 | 1,48 | 0 | 0 | 0,1 | 1,3 + 23,6 | 17,6 | 0,5 | 0 |
| aleatório | 3 | 2,67 | 8,9e−16 | 1,8e−15 | 0,2 | 0,9 + 31,0 | 17,5 | 0,4 | 0 |
| aleatório | 10 | 29,6 | 3,1e−15 | 7,1e−15 | 0,3 | 0,6 + 17,2 | 23,9 | 0,5 | 0 |
| aleatório | 40 | 52,9 | 3,2e−14 | 2,8e−14 | 3,8 | 0,9 + 12,5 | 17,9 | 0,5 | 0 |
| aleatório | 100 | 200,7 | 5,5e−14 | 2,0e−13 | 10,4 | 1,0 + 25,9 | 17,2 | 0,3 | 0 |
| Hilbert | 4 | 15514 | 9,8e−14 | 0 | 0,1 | 0,9 + 31,5 | 17,2 | 0,4 | 0 |
| diagonal toda zero (exige pivoteamento) | 40 | 134,4 | 1,2e−14 | 1,4e−14 | 1,0 | 0,7 + 18,4 | 19,4 | 0,5 | 0 |
| a₁₁ = 0 | 100 | 341,2 | 6,5e−14 | 4,4e−14 | 12,0 | 1,1 + 19,2 | 17,1 | 0,3 | 0 |
| singular (L40 = L1+L2), infinitas soluções | 40 | 1,1e17 | — | — | 2,5 | 0,7 + 12,0 | 20,0 | 0,6 | 0 |
| singular, sem solução | 40 | 1,1e17 | — | — | 2,4 | 0,9 + 10,0 | 26,9 | 0,3 | 0 |

- **Comparação com a execução das 16:38–16:42 (versão anterior):** no caso aleatório n = 40, o handler síncrono levava 52 ms, com uma long task de 52 ms. Na versão atual isso sumiu: 0,9 ms e nenhuma long task.
- **Interface responsiva:** a página não trava em nenhum n. O maior intervalo entre rAF ficou ≤ 27 ms e o atraso dos timers ≤ 0,6 ms.
- **Singulares:** são detectados em n = 40 ("Sistema singular: não há pivô não nulo na coluna 40…") e classificados corretamente.
- **Pivoteamento com n grande:** correto. Por exemplo, na diagonal zero com n = 40, o passo 1 é "L1 ↔ L3; pivô -2.49978".
- **Modo compacto (n = 40 e 100):**
  - **Ordem dos passos:** um passo por coluna, na ordem certa. Ficam 43 passos para n = 40 ("Matriz aumentada inicial", depois "Coluna 1…" até "Coluna 40…", e a solução) e 103 para n = 100.
  - **Tooltip:** mostra o valor certo quando a célula está visível. Para n = 40 a 390 px, por exemplo: L1,C1 = 0,345584; L40,C40 = −1,655426; L40,b = −0,449985, todos iguais à matriz colada.
  - **Zoom:** a roda do mouse amplia (o tooltip no centro passa a apontar outra célula).
  - **Player:** funciona (início/avançar/fim).

## Bugs novos

### BUG-13 — Alta — Linha ativa do "Ver código" não acompanha o player em Bissecção e Newton
Passos:
1. Abra Bissecção com os valores padrão (x³−x−2, [1,2]).
2. Clique em "Ver código".
3. Avance o player de 1/14 até 5/14.

Esperado: a linha destacada muda conforme o passo (este era um requisito explícito da v2).
Obtido: o destaque fica sempre no índice 14, "// @etapa:pontoMedio — divide o intervalo…", em todos os passos, e também em "Fim".

No Newton (x²−2), de 1/5 a 5/5, o destaque fica sempre na linha 24, "// @etapa:passoNewton…". Isso acontece a 1280 e a 390. Em Gauss o destaque se move (12 → 24 → 29 → 35 → 35 → 54).

O destaque também cai numa linha de comentário marcador, e não numa instrução.

### BUG-14 — Média — Mapa compacto não mostra a matriz inteira no zoom inicial (desktop)
Passos: 1280×800; n = 40, Colar (ou Aleatório) → mapa.
Esperado: no estado inicial (zoom = reset) todas as linhas e a coluna b ficam visíveis.
Obtido:
- o canvas `#mapa-gauss` tem 778×640 px, mas as células seguem a largura, com cel ≈ (778−30)/41,6 ≈ 18 px;
- com isso, as linhas abaixo de ~L34 ficam fora da área desenhada;
- passar o mouse na posição de L40 não mostra tooltip;
- para n = 100 no tema claro, a última linha visível é L82 (`screens-v2/layout-claro-1280-gauss100.png`, `gauss-n40-mapa-1280.png`).

A 390 px não ocorre (canvas 316×305, todas as 40 linhas visíveis).

### BUG-15 — Baixa — Código não cabe na largura da gaveta (precisa de rolagem horizontal)
"Ver código" usa `white-space: pre`, então nenhuma linha quebra nem é cortada. Mas o corpo rola na horizontal:

| Método | 1280 (scrollWidth / largura do corpo) | 390 (scrollWidth / largura do corpo) |
|---|---|---|
| Bissecção | não rola | 637 / 390 |
| Newton | 645 / 638 | 645 / 390 |
| Gauss | 653 / 638 | 653 / 390 |

Esperado: a 1280 cabe sem rolagem. A 390 a rolagem é aceitável se houver indicação.

### BUG-16 — Baixa — Separador decimal misturado na saída
- O resultado usa ponto: "Raiz ≈ 1.52142334…".
- As descrições de passo usam ponto: "c = (a + b)/2 = 1.5 · f(c) = -0.125"; "pivô -2.49978".
- A tabela, o tooltip do mapa e o det usam vírgula: "det A = −0,5"; "L1, C1 = 0,345584".
- Os sinais de menos também se misturam: "-0.125" vs "−0,524736", e "e-10" vs "e−6" na tabela.

### BUG-17 — Baixa — Aba "Eliminação de Gauss" cortada a 390 px sem indicação
A 390×844 a barra de abas tem scrollWidth 486 para clientWidth 342 (overflow-x: auto). A terceira aba aparece como "Elim…" cortada e não há seta nem sombra indicando rolagem (`screens-v2/abas-390.png`).

### BUG-18 — Baixa — Aviso de colagem antigo continua visível após Aleatório/Exemplo/Limpar
Passos:
1. Cole 101 linhas e clique em Carregar ("A matriz deve ter entre 2 e 100 linhas (recebi 101).").
2. Clique em Aleatório, depois Exemplo, depois Limpar (com n = 3 e com n = 40).

Esperado: o aviso some, porque a matriz foi substituída.
Obtido: o aviso continua visível ao lado do novo resultado.

### BUG-19 — Baixa — Célula vazia na colagem gera mensagem genérica
Colar `2⇥⇥-1⇥8` (célula vazia com TAB) + 2 linhas válidas com n = 3.
Esperado: "Linha 1, coluna 2 vazia".
Obtido: "Todas as linhas devem ter o mesmo número de colunas…". O TAB duplo é tratado como um único separador, e a linha passa a ter 3 colunas.

## Colagem (Teste 3): resultados

Todos com n = 3 e o sistema clássico (solução 2, 3, −1), salvo indicação:

| Entrada | Resultado |
|---|---|
| TAB (Excel) | OK |
| CSV com vírgula | OK |
| `;` + vírgula decimal ("0,5") | OK (det −0,5) |
| TAB + vírgula decimal | OK |
| espaços múltiplos | OK |
| linhas em branco e espaços extras | OK |
| notação científica (2e0, -1.1e1, 8.0e+00) e negativos | OK |
| só A (3×3) | erro claro: "…3×3 (só A, sem a coluna b); o formato esperado é n×(n+1)…" |
| texto em célula | "Linha 1, coluna 2: "abc" não é um número." |
| célula vazia | mensagem genérica (BUG-19) |
| linhas irregulares | "Todas as linhas devem ter o mesmo número de colunas…" |
| 4×5 com n = 3 | "Ajustar n para 4?"; n continua 3 até clicar; após Ajustar: n = 4, x = (1,1,1,1) |
| 2×3 com n = 3 | "Ajustar n para 2?"; após Ajustar: n = 2, x = (0,8; 1,4) |
| 101 linhas | "A matriz deve ter entre 2 e 100 linhas (recebi 101)." |
| Aleatório (n = 3 e 40) | gera um sistema novo a cada clique, com solução inteira |
| Exemplo (n = 3 e 40) | n = 3 gera o clássico (2, 3, −1) |
| Limpar (n = 3 e 40) | limpa a grade e o resultado; para n = 40, "Matriz 40×41 vazia" |

## "Ver código" (Teste 4)

- **Função certa em cada aba:**
  - Bissecção mostra `function bisseccao(f, a, b, tol, maxIter)`, 48 linhas, `js/metodos/bisseccao.js`;
  - Newton mostra `function newton(f, df, x0, tol, maxIter)`, 42 linhas;
  - Gauss mostra `function gauss(A, b, pivoteamento = true, …)`, 57 linhas.
- **Copiar:** "Copiado para a área de transferência."
- **Esc:** fecha a gaveta e devolve o foco ao botão. Isso vale nas 3 abas e nos 2 viewports.
- **Problemas:** linha ativa (BUG-13), largura (BUG-15), dependências (BUG-04).

## Layout (Teste 5)

1280×800 e 390×844, temas escuro e claro: Bissecção, Newton, Gauss n = 10/40/100 e gaveta de código. As capturas estão em `screens-v2/layout-{tema}-{largura}-{aba}.png` e `codigo-{método}-{largura}.png`.

- Não há rolagem horizontal da página (scrollWidth = viewport em todas as combinações).
- Só aparecem os problemas já listados: BUG-14, BUG-17 e o resíduo de BUG-09.
