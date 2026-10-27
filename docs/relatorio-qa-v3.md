# Relatório de QA — v3 (reteste)

Data: 27/10/2026, 16:57–17:23 (BRT, UTC−3). Ambiente: Chromium headless (Playwright), viewports 1280×800 e 390×844, temas claro e escuro; Node v20; numpy e scipy (`scipy.linalg.lu_factor`) como referência.
Nenhum arquivo do site foi alterado pelo QA. Os scripts e os dados brutos estão em `/workspace/qa-metodos-numericos/`, e as capturas de tela em `screens-v3/`.

**Arquivos mudando durante o teste.** Snapshots de mtime: `mtimes-v3-inicio.txt` (16:57), `mtimes-v3-rodada.txt` (17:09) e `mtimes-v3-fim.txt` (~17:23). O Dev editou `app.js`, `estilo.css`, `js/visual/gauss*.js`, `js/visual/comum.js` e `avisos.js` até as 17:21. Depois da última edição (17:21:01) refiz o seguinte:
- a UI do pivoteamento (`qa_v3_pivo_ui.py`, 17:21:19); só mudou o timing da amostragem;
- a comparação Node+numpy/scipy (`v3_pivo.py`);
- o `node --test`.

A bateria de UI geral (`qa_v3_bateria.py`, `qa_v3_ui.py`, `qa_v3_ui2.py`) rodou entre 17:17 e 17:19, antes das edições de 17:20–17:21 em `js/visual/gauss.js`, `comum.js` e `estilo.css`. Ela não foi refeita depois.

## Resumo por severidade (bugs novos)

| Severidade | Qtde | Bugs |
|---|---|---|
| Crítica | 0 | — |
| Alta | 1 | BUG-20 |
| Média | 2 | BUG-21, BUG-22 |
| Baixa | 5 | BUG-23 a BUG-27 |

`node --test tests/lista-exercicios.test.js`: **21 pass / 0 fail** (rodado às 17:09 e de novo às 17:21).

## Status dos bugs anteriores

| Bug | Status v3 | Evidência |
|---|---|---|
| BUG-02 (pageerror `fx`) | **Resolvido** | Nenhum `pageerror` nem erro de console em todas as rodadas: bateria completa, UI, pivoteamento, 2 viewports × 2 temas. |
| BUG-04 | Fechado **por design** | Não reaberto. |
| BUG-09 (alvos pequenos) | **Parcialmente resolvido** | O checkbox de 13×13 foi substituído pelo `<select>` de pivoteamento. A célula da grade (n=3) agora mede 200×40 px; antes eram 58×40. |
| BUG-13 (linha ativa no Ver código) | **Parcialmente resolvido** | Gauss: a linha acompanha cada etapa (`if (auto && zero)`, `fator = …`, `return {… pivoOk}`, `x[i] = …`, `registrar('fim')`). Newton: muda de linha só na última etapa (`xNovo = …` → `parou = erro < tol`). Bissecção: fica em `c = (a + b) / 2;` nos 5 passos amostrados (`screens-v3/codigo-bisseccao.png`). |
| BUG-14 (mapa compacto cortado em 1280) | **Resolvido** | Em n=100 aparecem as linhas L1…L97+ e a coluna b inteiras dentro do mapa (`mapa-n100-1280.png`). Medidas do `#mapa-gauss`: altura 640 px, `scrollHeight` = `clientHeight` = 640. |
| BUG-15 (scroll horizontal do código) | **Resolvido** | `pre`: `scrollWidth` 906 = `clientWidth` 906. |
| BUG-16 (separador decimal e sinal de menos) | **Resolvido** | Nenhum `\d+\.\d+` nem hífen-menos no texto visível (Bissecção, Newton, Gauss). Resultados, tabelas, motivos de troca e comparação usam vírgula e “−”. Veja a ressalva em BUG-26. |
| BUG-17 (aba Gauss cortada em 390) | **Resolvido** | `aba-gauss` em x = 283–366 dentro dos 390 px. Observação: `aba-bisseccao` começa em x = −10, mas a faixa de abas rola. |
| BUG-18 (aviso de colagem velho) | **Resolvido** | Depois de Aleatório, Exemplo e Limpar, o `#aviso-colar` fica vazio ou oculto. |
| BUG-19 (TAB duplo / célula vazia) | Só registro (está com o Matemático) | A mensagem agora é específica: “Célula vazia em A, linha 1, coluna 2.” |
| L-01 (bissecção aceitava π/2) | **Resolvido** | Erro DESCONTINUIDADE: “Provável descontinuidade, não raiz: … perto de x = 1,57074, mas \|f(c)\| cresceu (f(c) = −17673,1)”. Selo 1 e item “Descontinuidade (polo)” em destaque. |
| L-02 (Newton “x = NaN”) | **Resolvido** | “x1 = −0,721348 está fora do domínio de f (ln de número negativo)…”. Selo 1 e item “Iterado fora do domínio”. |
| L5-3 (aviso de salto grande) | **Implementado e correto** | “Salto grande na iteração 1: f'(x0) = 0,23 é pequena, e x foi de 1,9 para x1 = −15,2261.” Selo 1 na UI. Converge para −2, a única raiz real. |

Mudança nas minhas asserções: nenhuma foi necessária. O teste L-01 aceita erro, e o L-02 só exige ausência de NaN; os dois passam com o novo comportamento.

## Bugs novos

### BUG-20 — Alta — Hilbert n ≥ 10 classificado como “singular, infinitas soluções” nos modos Automático e Sempre
Passos:
1. Gauss, n=10.
2. A = Hilbert 10×10, b = soma das linhas (solução exata x = 1).
3. Pivoteamento Automático ou Sempre. Calcular.

- **Esperado:** solução única. A matriz é inversível: numpy dá cond ≈ 1,6e13, det ≈ 2,16e−53 e solução com erro ≈ 4,5e−4. O próprio painel Avisos (item mal-condicionamento) usa “Hilbert 10×10: resíduo ≈ 3e−16, mas erro em x ≈ 4e−4” como exemplo.
- **Obtido:** “Sistema singular: não há pivô não nulo na coluna 10. O sistema tem infinitas soluções.” Os itens sistema-impossivel e sistema-indeterminado ficam os dois em destaque.
- **Inconsistência:** no modo **Nunca** a mesma matriz é resolvida, com resíduo 6,6e−16 e diferença máxima para o numpy de 6,8e−5.
- **Causa provável:** o teste de pré-condição em `Metodos.gauss` usa a tolerância absoluta `toleranciaPivo = 1e−12·n·max|a|`, e o pivô final de Hilbert 10 com troca fica abaixo desse valor. Hilbert de 4 a 9 resolvem.

### BUG-21 — Média — Selo de Avisos não aparece em “extremos trocados”
Passos: Bissecção, f = x^3−x−2, a = 2, b = 1. Calcular.

- **Esperado:** selo 1 e item “Extremos trocados” em destaque. `Visual.avisos.detectar('bisseccao', Metodos.executar.bisseccao(...))` devolve `[5]`, e `contar` devolve 1.
- **Obtido:** o resultado mostra “Os extremos estavam invertidos; usei a = 1 e b = 2.”, mas o botão Avisos fica sem selo e sem item ativo (`avisos-bis-trocados.png`).
- **Causa:** `Visual.chamar.bisseccao` devolve só `{passos, resultado, erro, codigoErro, avisos}` e descarta `codigosAviso`. A detecção cai no casamento por texto, que falha para esta mensagem. Raiz no extremo e salto grande funcionam porque o texto casa.

### BUG-22 — Média — Mensagem enganosa: “f não está definida” em ponto onde f está definida
Passos: Newton, f = sqrt(x)−1, x0 = 4.

- **Obtido:** “x1 = 0 está fora do domínio de f (f não está definida); tente um x0 mais perto da raiz.”
- **Esperado:** f(0) = −1 está definida. Quem não é finita em 0 é f'(x) = 1/(2·sqrt(x)). A mensagem deveria citar a derivada.

### BUG-23 — Baixa — Sistema singular destaca “impossível” e “indeterminado” ao mesmo tempo
Os dois casos usam o mesmo código `MATRIZ_SINGULAR`, então os dois itens acendem. Isso vale tanto para [[1,1,1],[1,1,1],…] impossível quanto para o sistema de infinitas soluções, mesmo com a mensagem do resultado distinguindo os dois. Esperado: só o item da `classificacao` correspondente.

### BUG-24 — Baixa — Item “mal-condicionamento” nunca é destacado
Não há código nem aviso de condicionamento: `codigos: []` e sem `mensagem`. Nem Hilbert 8 (erro em x de 3e−7 com resíduo 2e−16) acende o item.

### BUG-25 — Baixa — Newton: “Máximo de iterações” não aparece no painel Avisos
Passos: x^2−2, x0 = 1, máx. iterações = 2. O resultado mostra “Máximo de iterações atingido sem convergir”, mas não há selo: a lista do Newton não tem item de máximo de iterações. A Bissecção tem.

### BUG-26 — Baixa — Descrição do passo usa número por extenso para valores enormes
Passos: Gauss Nunca, [[1e−17,1],[1,1]], b = [1,2]. As descrições mostram “L2 ← L2 − (100000000000000000)·L1” e “Pivô a22 = −100000000000000000”. A matriz e o restante da UI usam “−1,000e+17”.

### BUG-27 — Baixa — Motivo da troca com valores que parecem iguais
Passos: Gauss Sempre, Hilbert 8. O motivo diz “pivoteamento parcial: L3 tem o maior |a| da coluna (0,0833333 > 0,0833333)”. Com 6 algarismos os dois valores ficam idênticos. Sugestão: mais casas ou notação científica quando a diferença for pequena.

## Pivoteamento (seção própria)

Refeito integralmente sobre a versão corrigida (após 17:17, e de novo às 17:21).

**Células na troca obrigatória (correção do Dev).** Teste: Automático, A = [[0,2,1],[1,−2,−3],[−1,1,2]], b = [−8,0,3].
- **Durante a animação** (80 amostras a cada 50 ms em reprodução automática) e **depois dela**: 12 de 12 `.cel` sempre presentes, sem texto vazio, visibility hidden, opacity < 0,2 ou largura < 2 px.
- **Passo a passo:** 0 células vazias em todos os passos.
- **Matriz final:** 1, −2, −3, 0 / 0, 2, 1, −8 / 0, −1, −1, 3 … (`pivo-obrigatoria-durante.png`, `pivo-obrigatoria-depois.png`).
- **Resultado:** **corrigido**.

**Seletor e ajuda.** Automático (padrão), Sempre e Nunca, cada um com texto de ajuda próprio.

**[[1e−17,1],[1,1]], b = [1,2].**

| Modo | x | Trocas / selo no passo | Observação |
|---|---|---|---|
| Automático | [1; 1] ✔ | 1 obrigatória: “! Troca obrigatória: pivô zero L1 ↔ L2”, motivo “pivô a11 = 1e−17 é zero numérico” | Correto: 1e−17 ≤ 2ε·1 |
| Sempre | [1; 1] ✔ | 1 clássica: “⇅ Pivoteamento parcial: maior \|a\| da coluna L1 ↔ L2 (1 > 1e−17)” | Igual ao `scipy` |
| Nunca | **[0; 1]** ✔ | Sem troca. Aviso: “Pivô pequeno sem troca (modo “nunca”): a11 = 1e−17 … erro relativo … 0,707107.” Selo Avisos 1 | Comparação: sem pivô erro 0,707107, resíduo 0,447214; com pivô x = [1; 1], erro 0, resíduo 0 ✔ (0,7071 = ‖[−1,0]‖/‖[1,1]‖, 0,4472 = 1/√5) |

**Item (b), pivô 1e−17 na matriz final do Nunca:** **já foi corrigido**. A célula mostra **“1,000e−17”** (células finais: 1,000e−17 | 1 | 1 / 0 | −1,000e+17 | −1,000e+17). O item (a), a célula b em 390 px, não foi avaliado como bug, conforme pedido.

**Pivô zero no Nunca.**
- A = [[0,2,1],…], n=3: “Pivô a11 = 0 e o modo “nunca” não permite trocar linhas: ative o pivoteamento (automático ou sempre).” Selo Avisos 1 (item pivo-nulo).
- n=40 com diagonal nula: mesma mensagem.
- Resultado: ✔.

**Limiares do Automático.** A = [[p,1],[1,1]], max|a_i1| = 1, n = 2 ⇒ zero se |p| ≤ 2ε = 4,44089e−16; recomendada se |p| < 0,1.

| p | Esperado | Obtido |
|---|---|---|
| 0 | obrigatória | obrigatória ✔ |
| 2ε (= limite) | obrigatória | obrigatória ✔ |
| 2ε·1,01 | recomendada | recomendada ✔ |
| 1e−10 | recomendada | recomendada ✔ |
| 0,0999999 | recomendada | recomendada ✔ |
| −0,05 | recomendada | recomendada ✔ (motivo mostra \|pivô\| = 0,05) |
| 0,1 (= limite) | sem troca | sem troca ✔ (“Pivô ok, sem troca”) |
| 0,1000001 | sem troca | sem troca ✔ |
| 0,5 | sem troca | sem troca ✔ |
| Escala 1e6: p = 2ε·1e6 | obrigatória | obrigatória ✔ (“4,44089e−10 é zero numérico … \|a\| = 1000000”) |
| Escala 1e6: p = 99999 | recomendada | recomendada ✔ |

**Comparação com numpy e scipy** (`v3_pivo.py` / `v3_pivo.json`). 25 sistemas × 3 modos: os casos acima, aleatórios com n = 2, 3, 10, 40 e 100 (2 sementes cada), Hilbert 8 e 10, diagonal nula com n=40, a11 = 1e−14 com n=100 e diagonal dominante com n=30.
- **Sempre:** sequência de trocas **idêntica** ao `scipy.linalg.lu_factor` (piv) em **todos** os casos solucionáveis, incluindo n=100 (91 e 95 trocas). Erro máximo vs `numpy.linalg.solve` ≤ 7e−14. Resíduo ∞ ≤ 1,6e−13.
- **Automático:** erro máximo vs numpy ≤ 5,6e−13 (n=100), com 18 trocas recomendadas em n=100. Diagonal nula: 1 obrigatória e 11 recomendadas. a11 = 1e−14 em n=100: obrigatória, pois 1e−14 ≤ 100·ε·max. Diagonal dominante: 0 trocas ✔.
- **Nunca:**
  - aleatórios: erro ≤ 4,6e−12;
  - a11 = 1e−14, n=100: erro 0,27 vs numpy, aviso “pivô pequeno” e comparação (erro relativo 0,11; resíduo relativo 1,0e−2 vs pivoteado);
  - 2ε·1,01: x1 = 0,990099 (erro 1e−2), também mostrado na comparação ✔.
- **Contagem `resultado.trocas`:** bate com os passos (obrigatórias, recomendadas e clássicas).

**Resumo de trocas.**
- Exemplos: “1 troca: ! 1 obrigatória.”, “1 troca: i 1 recomendada.”, “2 trocas: ⇅ 2 clássicas.”, “6 trocas: ! 1 obrigatória, i 5 recomendadas.” (n=40), “Nenhuma troca de linha.” ✔.
- Selo do motivo nos passos:
  - obrigatória: “! Troca obrigatória: pivô zero”;
  - recomendada: “i Troca recomendada: pivô pequeno |0,05| ≪ |1|”;
  - clássica: “⇅ Pivoteamento parcial: maior |a| da coluna”;
  - Automático sem troca: “Pivô ok, sem troca” ✔.

**Modo compacto (n=40, diagonal nula).**
- Automático: “Coluna 1: L1 ↔ L38; pivô −2,48584; 39 linha(s) zerada(s)…” com selo “! Troca obrigatória: pivô zero L1 ↔ L38”; colunas seguintes com “Pivô ok, sem troca”.
- Sempre: “⇅ … L2 ↔ L31” e assim por diante.
- Nunca: erro de pivô zero.
- Resultado: ✔ (`pivo-n40-*.png`).

**`escolherPivo` em Ver código.**
- A função aparece no código.
- Linha ativa por passo:
  - troca obrigatória → `if (auto && zero) {`;
  - recomendada → `if (auto && pequeno) {`;
  - pivô ok → `return { linha: k, tipo: null, motivo: null, pequeno };`;
  - eliminação → `const fator = M[i][k] / M[k][k];`;
  - substituição → `x[i] = soma / M[i][i];`;
  - fim → `registrar('fim', …)` ✔.
- Observação, não registrada como bug: no passo “troca” a linha fica no `if` da decisão, não em `[M[k], M[p]] = …` (`@etapa:trocaLinhas`).

**Observação de modelagem, não registrada como bug.** No Nunca, o passo de pivô pequeno não mostra selo na animação; o alerta vem só no aviso do resultado.

**Layout do pivoteamento.** Comparação do Nunca em 1280 (claro) e 390 (escuro) sem overflow da página: `scrollWidth` = viewport.

## Painel Avisos (3 métodos)
- **Verificados no Node** (`v3_avisos.cjs`, 27 casos): 25/27 iguais ao esperado.
- **Sem falso positivo nos casos normais:** x³−x−2, eˣ−3x, cos x − x, tan em [4; 4,5], Newton x²−2 (x0 = 1 e 100), entre outros.
- **Na UI**, selo e item “No cálculo atual” em destaque nos casos:
  - descontinuidade (L-01);
  - sem troca de sinal;
  - derivada nula;
  - fora do domínio (L-02);
  - salto grande (L5-3);
  - pivô nulo e pivô pequeno no Gauss Nunca.
- **Normais sem selo** ✔.
- **Conteúdo numérico conferido:**
  - salto L5-3: f'(1,9) = 0,23 e x1 = −15,2261 ✔;
  - Hilbert 10 no texto: numpy dá resíduo 2,2e−16 e erro 4,5e−4, compatível com “≈ 3e−16 / ≈ 4e−4”, mas veja BUG-20.
- **Ressalva:** atan com x0 = 1,5 acende divergência e salto grande, e o salto é real; aceitável.
- **Falhas:** BUG-21 a BUG-25.

## Gauss: A n×n e b separados
Colagem no modo separado:

| Entrada | Mensagem | Resultado |
|---|---|---|
| A 2×2 com TAB e b em coluna | “A colada é 2×2, mas n = 3. Ajustar n para 2?” | Ajustar funciona ✔ |
| `;` como separador | Aceito | ✔ |
| Vírgula decimal com TAB | Aceita | ✔ |
| CSV | Aceito | ✔ |
| A não quadrada | “A tem 2 linhas, mas a linha 1 tem 3 valores (A precisa ser quadrada).” | ✔ |
| b curto / longo | “A é 2×2, então b precisa ter 2 valores; encontrei 1 / 3.” | ✔ |
| [A\|b] inteiro no campo A | Mensagem de A não quadrada | Clara o bastante ✔ |
| b colado no campo A | “… a linha 1 tem 1 valores …” | ✔ (concordância “1 valores”, trivial) |
| Texto inválido | “Valor inválido em A, linha 1, coluna 2: "x".” | ✔ |
| b vazio | “b está vazio.” | ✔ |
| Modo aumentada | Também pede para ajustar n | ✔ |

- Grade n ≤ 10 na área principal: n = 10 tem 110 campos (A + b) ✔.
- Aleatório e Exemplo preenchem tudo; Limpar esvazia os 12 campos ✔.
- **numpy** (colagem separada com Ajustar n, modo Sempre):

| n | Resultado |
|---|---|
| 2 | Erro máximo 0 |
| 3 | Erro máximo 0 |
| 10 | Erro máximo 0 |
| 40 | Lista de x idêntica à solução inteira gerada (14 primeiras conferidas) |
| 100 | Idem |

## Regressão geral
- **Bateria do `casos-de-teste.md`** (`qa_v3_bateria.py`, 17:17): todos os casos de Bissecção, Newton e Gauss batem com o gabarito.
  - Iterações = estimativa teórica (10/20/34 etc.).
  - Validações de entrada com mensagens claras.
  - Gauss: clássicos, pivô zero, impossível, infinitas, Hilbert 4, vírgula decimal.
  - Console sem erros.
- **Layout:** 1280×800 e 390×844, claro e escuro, nas 3 abas, sem scroll horizontal da página (`layout-*.png`).
- **Player:** início, avançar e fim funcionam; reprodução automática OK.

## O que passou
- L-01, L-02 e o aviso de salto grande (L5-3); `node --test` 21/21.
- BUG-02, 14, 15, 16, 17 e 18 resolvidos; BUG-09 e BUG-13 parciais.
- Pivoteamento:
  - três modos corretos;
  - limiares exatos nas duas fronteiras;
  - sequência de trocas igual à do `scipy` até n=100;
  - comparação do Nunca correta;
  - erro de pivô zero correto;
  - selos e motivos corretos;
  - resumo de trocas e modo compacto corretos;
  - linha ativa do `escolherPivo` correta;
  - células não somem mais na troca obrigatória;
  - 1e−17 exibido corretamente.
- Entrada A/b separada com validações claras; numpy confere para n = 2, 3, 10, 40 e 100.
- Vírgula decimal e “−” uniformes. Exceção: o formato por extenso em BUG-26.
