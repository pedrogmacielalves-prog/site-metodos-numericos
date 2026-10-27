# Relatório de QA — v4 (reteste)

Data: 27/10/2026. Execução das 17:34 às 17:50 (BRT, UTC−3). Ambiente: Chromium headless (Playwright), Node v20, numpy, scipy, mpmath.
Nenhum código do site foi alterado. Evidências ficam em `/workspace/qa-metodos-numericos/` (scripts `qa_v4_*.py`, `v4_nucleo.py`, JSONs `qa_v4_*.json`) e as capturas em `screens-v4/` (69 arquivos).

**Mtimes.** O snapshot inicial foi tirado às 17:34:37 (`mtimes-v4-inicio.txt`). Durante o teste o Dev alterou `js/app.js` (17:37:56), `css/estilo.css` (17:39:24), `js/visual/comum.js` (17:39:32) e `js/visual/gauss.js` (17:39:51). Por isso **todas** as baterias de UI e de núcleo foram executadas de novo, das 17:43 às 17:46, depois da última mudança. O snapshot final (`mtimes-v4-fim.txt`, 17:46) não mostra nenhuma alteração posterior a 17:39:51. Os resultados abaixo valem para esse estado do código.

**Testes automatizados.** `node --test tests/` deu **91/91 pass, 0 fail** (expressao 7, interface-formato 3, interface-gauss 6, lista-exercicios 21, metodos 54). `node tests/teste-metodos.cjs` deu **13/13**. As duas alegações foram confirmadas de forma independente, e de novo depois das últimas mudanças.

**Console.** Nenhum `pageerror` nem erro de console em nenhuma das rodadas (bateria, UI, pivoteamento, extra, grade; 2 viewports × 2 temas).

## Resumo por severidade (bugs novos)

| Severidade | Qtde | Bugs |
|---|---|---|
| Crítica | 0 | — |
| Alta | 0 | — |
| Média | 0 | — |
| Baixa | 0 | — |

Não encontrei nenhum bug novo que justificasse um número a partir de BUG-28. As pendências que sobraram são ressalvas de bugs já existentes (BUG-22 e BUG-26 parciais) e observações, listadas no fim.

## Status dos bugs retestados

| Bug | Status v4 | Evidência |
|---|---|---|
| BUG-20 (Hilbert n ≥ 10 dado como singular) | **Resolvido** | **Hilbert 10** (b = soma das linhas), via colagem na UI: “Solução única (det A = 2,164e−53)” nos 3 modos. Erro máximo em relação a x = 1: Automático 5,8e−4, Sempre 7,2e−4, Nunca 5,8e−4. O numpy dá 5,8e−4. Aviso “Matriz mal condicionada: cond∞(A) ≈ 3,53536e+13”, com o item **Mal condicionamento destacado** (selo 1; no Nunca o selo é 2, com +Pivô pequeno). **Hilbert 12**: resolve nos 3 modos (det 2,84e−78), cond∞ ≈ 3,89e+16, “Mal condicionamento” e “Sistema grande” destacados. Erro máximo em relação a 1: Auto 0,087, Sempre 0,006, Nunca 0,087; o numpy dá 0,648. **Os singulares continuam detectados.** O 3×3 impossível dá “Sistema impossível”. O 3×3 de infinitas soluções dá “Sistema indeterminado”. Também foram detectados a coluna dependente 4×4 e o posto 1 5×5 (MATRIZ_SINGULAR nos 3 modos). No Nunca, os casos com pivô zero param em PIVO_ZERO_SEM_TROCA, o que é coerente. Capturas: `b20-H10-*.png`, `b20-H12-*.png`. |
| BUG-21 (selo em extremos trocados) | **Resolvido** | Com a = 2 e b = 1, o selo Avisos mostra **1** e o item ativo é “Extremos invertidos”. O caso normal [1, 2] fica sem selo. |
| BUG-22 (sqrt(x)−1, x0 = 4) | **Parcial** | A mensagem agora está correta: “Em x1 = 0, f(x1) = −1 está definida, mas f'(x1) não é finita (f'(x) = 1 / (2 * sqrt(x)))…”, com código DERIVADA_NAO_DEFINIDA. Mas o item destacado no painel Avisos ainda é **“Iterado fora do domínio”**, o que contradiz a mensagem, porque o problema está na derivada. |
| BUG-13 (linha ativa do Ver código) | **Resolvido** (com ressalva) | Com animação, a linha ativa percorre as etapas. Bissecção: `c = (a + b) / 2;` → `let manter;` → `if (manter === 'esquerda')`, e na última iteração `const parou = …`. Newton: `const dfx = df(x);` → `const xNovo = …`, e no fim `const parou = erro < tol;`. Gauss: `registrar('inicio')`, `[M[k], M[p]] = …` / `if (auto && zero)`, `const fator = …`, `return {… pivô ok}`, `x[i] = soma / M[i][i]`. Com `prefers-reduced-motion: reduce`, cada passo mostra só a linha da etapa final do passo (Bissecção: `if (manter === 'esquerda')`; Newton: `xNovo`); a linha muda entre os passos (`parou` no último) e no Gauss muda por etapa. Isso é coerente com a ausência de animação. |
| BUG-09 (alvos ≥ 44 px em 390) | **Resolvido** | Varredura em 390×844, nas 3 abas, de todos os `button`, `select`, `input`, `a[href]`, `summary`, `[role=tab]` e das células da grade e do player: **0 elementos com largura ou altura < 44 px**. Capturas: `b09-*-390.png`. |
| BUG-23 (impossível + indeterminado juntos) | **Resolvido** | Impossível destaca só “Sistema impossível”; infinitas destaca só “Sistema indeterminado”. |
| BUG-24 (destaque de mal-condicionamento) | **Resolvido** | Item destacado no Hilbert 8, 10 e 12 e no caso 2×2 de cond 1,6e+8. |
| BUG-25 (Newton, máximo de iterações) | **Resolvido** | Com x²−2, x0 = 1 e maxIter = 2: selo 1, item “Máximo de iterações atingido”. |
| BUG-26 (notação de valores enormes) | **Parcial** | Já não aparece o número por extenso. As descrições usam “L2 ← L2 − (1e+17)·L1” e “Pivô a22 = −1e+17”, mas as células da matriz mostram “−1,000e+17”. A notação continua inconsistente entre descrição e matriz. |
| BUG-27 (motivo da troca parece igual) | **Resolvido** | Hilbert 8/10, Sempre: “L3 tem o maior \|a\| da coluna (0,08333333333333334 > 0,08333333333333331)”, com dígitos suficientes. Quando a diferença é grande, mantém a forma curta (“0,00648148 > 0,00555556”). |

## Grade de entrada (item novo, 4 algarismos e notação e)

| Item | Resultado | Evidência |
|---|---|---|
| (a) Valores exibidos no Hilbert 10 | **OK, com observação** | Os valores exibidos são arredondamentos corretos do valor completo. Por exemplo, 1/3 aparece como “0,333”, 1/7 como “0,143”, 1/19 como “0,0526”, e b1 como “2,929”. Em 1280 px com n = 10, as células de A aparecem com **3** algarismos (“0,333”, não “0,3333”), porque o site reduz os dígitos quando não cabem; a coluna b mostra 4 (“0,7188”). Com n = 2, 1/3 aparece “0,3333”. `title` e `data-valor` têm o valor completo nas 110 células (“0.3333333333333333”). Ao focar, a célula mostra “0.3333333333333333”; ao sair, volta para “0,333”. Nenhuma célula cortada (`scrollWidth` ≤ `clientWidth`). det A = **2,164e−53**: o mpmath exato dá 2,16418e−53, o mpmath com as entradas em double dá 2,16437e−53 e o numpy dá 2,16437e−53 ✔. A solução é idêntica à do teste BUG-20. |
| (b) Sem rolagem horizontal em 1280 | **OK** | n = 10, 8 e 3, antes e depois de calcular: página 1280 = 1280; o contêiner da grade `.rolagem-x` tem `scrollWidth` 778 = `clientWidth` 778. Capturas: `grade-n{10,8,3}-1280.png`. |
| (c) Rótulos sticky em 390 | **OK** | Hilbert 10: a grade rola (1056 > 316). Depois de rolar até o fim, as células se deslocaram 740 px e os rótulos de linha `.rotulo-lin` (`position: sticky`) ficaram em x = 37. A página não rola (390 = 390). Captura: `grade-390-rolada.png`. |
| (d) Cálculo com o valor completo | **OK** | A = [[1, 0,3333333333333333], [3, 1,0000001]], b = [1,23456789; 2]. As células mostram “0,3333”, “1”, “1,235”. Site: det A = 1,000e−7, x = [5,679e+6; −1,704e+7]. Núcleo com os valores completos: x = [5679013,4646; −17037036,690]; numpy: [5679013,4614; −17037036,681]. Diferença relativa: 5,6e−10. Resíduo relativo: site 7,9e−10, numpy 4,0e−10. Com os valores arredondados (0,3333; 1; 1,235), x seria [5684; −17050], com resíduo 0,24 e erro de 99,9 %. Portanto o site **não** usa o valor arredondado. |
| (e) Foco e blur não trocam o valor | **OK** | Fiz foco e blur sem editar em todas as células do caso (d) e recalculei: `data-valor` intacto e mesma solução. No Hilbert 10 (110 células), clique + Tab em todas: valores completos preservados e solução idêntica. Também editei uma célula com “1,23456789” e saí dela: ela exibe “1,235”, o title e o `data-valor` ficam “1,23456789”, e o foco devolve “1,23456789”. |

## Bateria geral de UI

- **Avisos (3 métodos)**: sem falsos positivos. Bissecção normal, Newton normal (só a informação “derivada simbólica”) e Gauss 3×3 normal ficam sem selo. Os positivos aparecem com selo e item correto: descontinuidade, sem troca de sinal, extremos invertidos, derivada nula, fora do domínio, máximo de iterações, impossível, indeterminado, mal condicionamento, pivô pequeno e sistema grande.
- **Colagem A/b separada**: os formatos tab, CSV, “;” e decimal com vírgula foram aceitos, e o caso de n diferente oferece “Ajustar n para X”. Erros com mensagem específica: A não quadrada; b curto ou longo (“A é 2×2, então b precisa ter 2 valores; encontrei 1/3”); [A|b] colado em A; texto (“Valor inválido em A, linha 1, coluna 2: "x"”); TAB duplo (“Célula vazia…”); b vazio. Modo aumentada OK.
- **Layout**: 1280×800 e 390×844, claro e escuro, sem rolagem horizontal da página nas 3 abas. Em 390, `aba-bisseccao` começa em x = −10 dentro da faixa de abas, que rola (igual à v3).
- **Bateria de `casos-de-teste.md`**: as raízes da Bissecção e do Newton nas tolerâncias 1e−3, 1e−6 e 1e−10, os limites/erros de entrada e os sistemas de Gauss (clássicos, pivô zero, sem solução, infinitas, Hilbert 4, vírgula, texto, vazio) estão corretos. Nenhum NaN.
- **Player**: início, voltar, avançar e fim OK. Antes do fim da animação, a solução mostra “x = ?”, que é o comportamento progressivo.
- **Separador decimal e sinal de menos**: nenhum ponto decimal nem hífen-menos no texto visível.

## Pivoteamento (regressão rápida)

| Verificação | Resultado |
|---|---|
| 3 modos e ajuda | O texto de ajuda dos 3 modos está correto. |
| [[1e−17, 1], [1, 1]], b = [1, 2] | Automático: x = [1; 1], 1 troca obrigatória. Sempre: [1; 1], 1 clássica. Nunca: [0; 1], com aviso de pivô pequeno; a comparação dá erro 0,707107 e resíduo 0,447214, e com pivô [1; 1]. Células: “1,000e−17” e “−1,000e+17” (o 1e−17 não aparece como 0). |
| Sempre vs `scipy.linalg.lu_factor` | A sequência de trocas é idêntica em: clássico, 1e−17, aleatório n = 5, 20, 60 e 100, Hilbert 8 e 10. Erro em relação ao numpy nos aleatórios ≤ 3,6e−13. |
| Células na troca forçada | Nenhuma célula some: 12 células visíveis em todas as amostras durante e depois da animação. Valores finais corretos. |
| Linha ativa `escolherPivo` | Presente no código. Troca obrigatória: `if (auto && zero)`; com pivô ok: `return { linha: k, tipo: null, … }`; com reduced motion: `[M[k], M[p]] = …` e `const pivo = …`. |
| n = 40 | Automático: 6 trocas (1 obrigatória, 5 recomendadas). Sempre: 36 clássicas. Nunca: para em pivô zero a11 (correto para essa matriz). |

## Observações (sem bug novo)

1. BUG-22 parcial: o item destacado em Avisos é “Iterado fora do domínio” quando o erro é a derivada não finita.
2. BUG-26 parcial: as descrições usam “1e+17” e a matriz usa “1,000e+17”.
3. Grade com n = 10 em 1280: as células de A mostram 3 algarismos (“0,333”), não 4. Está dentro da regra “reduz dígitos quando não cabe”, mas difere do exemplo “0,3333”.

## Não refeito / limitações

- O script `qa_v4_ui2.py` (numpy n = 2, 3, 10, 40, 100 pela UI) rodou sem erro, mas a extração da lista alternada de x falhou (`nsol` = 0). A comparação com numpy/scipy para n até 100 foi feita pelo núcleo carregado na página (`v4_nucleo.py`), não pela leitura da lista na UI.
- Os itens não reportados por instrução são BUG-04 (por design) e a rolagem horizontal da célula b “−1,000e+17” em 390 no modo Nunca.

## Reteste dos parciais (17:50–17:51 BRT)

Snapshot de mtime: inicial às 17:50 (`mtimes-v4r-inicio.txt`), final em `mtimes-v4r-fim.txt`, sem diferença entre os dois. Entre os snapshots v4-fim e v4r-inicio, o Dev alterou `js/metodos/comum.js`, `validacao.js`, `avisos.js`, `tests/metodos.test.cjs` e `docs/contrato-etapas.md` (17:48–17:49).

| Bug | Status | Evidência |
|---|---|---|
| BUG-22 | **Resolvido** | sqrt(x)−1 com x0 = 4. Mensagem: “Em x1 = 0, f(x1) = −1 está definida, mas f'(x1) não é finita…”. Selo **1**, e o único item destacado é **“Derivada não definida”**. “Iterado fora do domínio” deixou de ser destacado. Selo, item e mensagem estão coerentes. |
| BUG-26 | **Resolvido** | No modo Nunca com [[1e−17, 1], [1, 1]] e b = [1, 2], as descrições ficaram: “Pivô a11 = 1,000e−17”, “L2 ← L2 − (1,000e+17)·L1”, “Pivô a22 = −1,000e+17”, “x2 = (−1,000e+17 − Σ…) / −1,000e+17 = 1”, “x1 = (1 − Σ…) / 1,000e−17 = 0”. As células mostram “1,000e−17” e “−1,000e+17”, o mesmo formato. Procurei notação inconsistente (ponto decimal, ou `e` sem mantissa “d,ddd”) em todas as descrições de passo dos casos 1e−17, Hilbert 10 e [[1e20, 2], [3, 4e−9]], nos 3 modos: **0 ocorrências**. Captura: `screens-v4/r-b26-nunca.png`. |
| Testes | OK | `node --test tests/` deu 91/91 pass, 0 fail. `node tests/teste-metodos.cjs` deu 13/13. |
