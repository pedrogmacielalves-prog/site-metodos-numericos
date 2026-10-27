# Relatório de QA (v5): critério relativo (ε)

Data: 27/10/2026, BRT (UTC−3). O snapshot inicial foi tirado às 18:01:01 (`mtimes-v5-inicio.txt`). Ambiente: Chromium headless (Playwright), Node v20, numpy, scipy e mpmath. Não alterei nenhum código do site, com exceção do meu teste, `tests/lista-exercicios.test.js` (detalhes abaixo). As evidências estão em `/workspace/qa-metodos-numericos/` (`v5_*.py/json`, `qa_v5_*.py/json`) e as capturas em `screens-v5/`.

## Versão testada (mtime)

Durante o teste, o código mudou várias vezes, das 18:01:07 às 18:10:10. As mudanças incluíram comum.js, validacao.js, avisos.js, chamadas.js, app.js, newton.js, estilo.css, index.html, grafico.js, visual/*.js, README e contrato. Por isso, todas as partes deste relatório foram **executadas de novo entre 18:12:45 e 18:16:16**, sobre a versão cuja **última modificação é das 18:10:10** (`js/grafico.js`, `js/visual/comum.js`). O código estava parado havia mais de 2 minutos quando comecei a rodada final. O snapshot final, `mtimes-v5-fim.txt`, não mostra nenhuma mudança depois das 18:10:10.

| Parte | Script | Horário (versão 18:10:10) |
|---|---|---|
| 15 exercícios, relativo e absoluto | v5_rel.py | 18:13:05 |
| Padrão, coluna de erro, código, fallback, troca, layout | v5_ui.py | 18:13:49 |
| Revisão do Designer | v5_design.py | 18:14:05 |
| Regressão absoluta (bateria de casos-de-teste.md) | qa_v5_bateria.py | 18:14:42 |
| Pivoteamento pelo novo controle | qa_v5_pivo_ui.py / qa_v5_extra.py | 18:15:08 / 18:15:51 |
| Grade e Hilbert 10 | qa_v5_grade.py | 18:16:16 |
| node --test / teste-metodos.cjs | — | 18:15:54 |

## Resumo por severidade (bugs novos)

| Severidade | Qtde | Bugs |
|---|---|---|
| Crítica | 0 | — |
| Alta | 0 | — |
| Média | 1 | BUG-28 |
| Baixa | 3 | BUG-29, BUG-30, BUG-31 |

- **BUG-28 (média): trocar o critério não recalcula.** O rótulo (ε ↔ tol), a ajuda e o cabeçalho da coluna (|Δx|/|x| ↔ (b−a)/2) mudam, e o valor de tol é preservado (0,0001). Porém a mensagem e a tabela continuam mostrando o resultado anterior. Por exemplo, com Absoluto selecionado, ainda aparece “Parou porque |cₖ − cₖ₋₁|/|cₖ| < ε”, 11 iterações, e a coluna, agora com o título “(b−a)/2”, mostra valores relativos (5,711e−5). Ou seja, os dados ficam com o rótulo errado. O recálculo só acontece com Enter ou Calcular.
- **BUG-29 (baixa):** no modo relativo, a bissecção mostra “(estimativa teórica: 13)”, que é a estimativa do critério absoluto (log2((b−a)/tol)). Nos casos com fallback, a diferença é grande: 40 iterações reais contra a estimativa de 22.
- **BUG-30 (baixa):** no Newton com f = x e x0 = 0,5, o método para por “f(x) = 0” em 1 iteração, mas o aviso CRITERIO_RELATIVO_PERTO_DE_ZERO também dispara (“usei o erro absoluto |Δx| = 0,5…”), embora esse teste não tenha decidido a parada. O aviso é enganoso.
- **BUG-31 (baixa):** no Newton com x^3 e x0 = 0,5 em modo relativo, a raiz é tripla, então o erro relativo fica em ≈ 1/3. O método termina com “Derivada ≈ 0 em x = 5,151e−7” (34 iterações) antes de chegar a |x| < 1e−12, e por isso o fallback nunca é acionado. No modo absoluto, converge. Isso é coerente com o contrato, mas a mensagem não explica a causa real.

## 1. Os 15 exercícios no modo relativo: 15/15 batem

Comparei a referência §19 em Python (desigualdade estrita, os mesmos x_k, fallback e f = 0), o gabarito `lista_ref` (chave rel), o núcleo (`Metodos.executar` com `criterio` explícito) e a UI. Os quatro coincidem em iterações e raiz nos 15 exercícios. O gabarito usa a mesma convenção do contrato.

| Ex. | Rel (Abs) | Raiz (rel) |
|---|---|---|
| L4-1 | 17 (17) | 1,5121383666992188 |
| L4-2a | 11 (13) | 4,274658203125 |
| L4-2b | 14 (14) | 0,90484619140625 |
| L4-2c | 13 (14) | 1,4310302734375 |
| L4-3 | 10 (11) | 2,5068359375 |
| L4-4 | 12 (10) | 0,337646484375 |
| L5-5b | 6 (7) | 1,921875 |
| L5-1 | 6 (6) | 1,512134551657842 |
| L5-2a | 5 (5) | 4,274782271846084 |
| L5-2b | 3 (3) | 0,9047882178880454 |
| L5-2c | 3 (3) | 1,4309690847443628 |
| L5-3 | 10 (10) | −2,0000000000000018 |
| L5-4 | 4 (4) | 2,718281828461957 |
| L5-5c | 2 (2) | 1,9345638738197013 |
| L5-9 | 2 (2) | 0,9047940616723674 |

Os números conferem com os do Matemático (L4-2a 11/13, L4-2c 13/14, L4-3 10/11, L4-4 12/10, L5-5b 6/7).

## 2. Coluna de erro: OK
- Na bissecção L4-2a, a 1ª linha mostra “—” e a 2ª mostra 0,028571, que é |4,375 − 4,25|/4,375. A última mostra 5,711e−5, igual à referência.
- No Newton L5-1, a 1ª linha mostra 0,187988, igual ao `erroCriterio` do núcleo.
- Observação cosmética: na bissecção, o cabeçalho é “|Δx|/|x|”, enquanto o contrato usa c.

## 3. Motivo da parada e Ver código: OK
- Bissecção: “Parou porque |cₖ − cₖ₋₁|/|cₖ| < ε”.
- Newton: “Parou porque |xₖ₊₁ − xₖ|/|xₖ₊₁| < ε”.
- No Ver código, a linha ativa do último passo do Newton é `const crit = Metodos.testeParada(...)`.

## 4. Fallback (|x| < 1e−12)
- Testei a bissecção com x, x^3 e sin(x) em [−1, 2]: 40 iterações, raiz −9,09e−13. Na última iteração, o critério usado é o absoluto, |Δx| = 2,728e−12 < ε. Aparecem o toast de aviso, o selo 1 e o item ativo “Critério de parada: tol × ε”. A célula mostra “⚠ |Δx|”.
- Também testei x^3 em [−1; 1,5] (39 iterações) e o Newton com sin, x0 = 0,5 (aviso na iteração 3).
- **Falso positivo:** com x − 1e−10, a bissecção levou 55 iterações e o Newton 2, sem fallback e sem selo. Não há falso positivo.
- Ver os bugs BUG-30 e BUG-31 acima.

## 5. Troca tol/ε, layout e console
- A troca de critério preserva o valor, mas **não recalcula** (BUG-28).
- Em 1280 e 390, nos dois temas, não há rolagem horizontal e não há nenhum alvo menor que 44 px.
- Console sem erros.

## Padrão relativo (steering 18:01): OK
- Relativo vem marcado nos dois métodos, inclusive depois de reload com Absoluto selecionado e com o localStorage {tema} salvo. O localStorage só guarda “tema”.
- Rótulo “ε”. Valores padrão: 0,0001 na bissecção e 0,000001 no Newton.
- Cálculo inicial: bissecção com 13 iterações (estimativa 14, ver BUG-29); Newton com 5.

## Revisão do Designer (steering 18:06): OK
- **Segmentados (critério e pivoteamento).** São radios nativos dentro de um role=radiogroup, então o `checked` nativo faz o papel de aria-checked. As setas trocam a seleção, o Tab sai do grupo, o Espaço seleciona e o Enter envia o formulário. O foco tem outline sólido de 3 px. O estado selecionado se distingue nos dois temas (fundo preenchido e peso 600). A altura é de 44 px em 390.
- **Pivoteamento pelo novo controle.**
  - Com 1e−17: Automático dá [1; 1] (1 troca obrigatória), Sempre dá [1; 1] (troca clássica), Nunca dá [0; 1] com aviso de pivô pequeno, comparação e erro relativo 0,707107.
  - Pivô zero no modo Nunca dá erro correto.
  - O n = 40 está na bateria e roda sem erros.
- **Ajuda.** Só aparece a ajuda do critério ativo, e ela muda junto com o critério.
- **Caixa.** Os cabeçalhos h2 e th estão com text-transform none.
- **Botões do gráfico em 390.** Cabem em uma linha (2 na bissecção, 3 no Newton), sem corte e com 44 px.
- **⚠.** Tem aria-hidden, texto sr-only “aviso: x perto de zero, usou erro absoluto” e title.

## Regressão
- **Bateria absoluta** (com Absoluto forçado): é idêntica à v4 em todos os casos, menos `default_bis`. Essa diferença é esperada, porque o padrão agora é o relativo (13 iterações contra 14).
- **Gauss:** Hilbert 10 dá “det A = 2,164e−53”, que confere com o numpy (2,1644e−53). Os casos com 1e−17 estão descritos acima.
- **Testes:** `node --test tests/` deu **113/113 pass**. `node tests/teste-metodos.cjs` deu **13/13**. Confirmei os dois resultados de forma independente às 18:15:54.

## Alteração no meu teste (`tests/lista-exercicios.test.js`)
- Cada exercício agora tem dois testes, um com `criterio: 'absoluto'` e outro com `criterio: 'relativo'`, passados de forma explícita.
- As expectativas vêm de `lista_ref.json` (abs = chave site; rel = chave rel), conferidas de forma independente pela referência §19.
- Incluí o teste “executar sem criterio usa o relativo (novo padrão)”. Os demais testes foram mantidos.
- O backup da versão anterior está em `lista-exercicios.test.js.v4bak` (pasta de QA).

## O que não foi refeito
- A varredura exaustiva de animação e reduced-motion do BUG-13 e as capturas por tema de todos os casos da bateria não foram refeitas na v5. Rodei os scripts, mas não revisei as capturas uma a uma.
- A exibição de 4 algarismos na grade (`a_disp_4sig_ok` = False, células como “0,333”) não foi reanalisada em relação ao critério da v4.

---

## Reteste final (18:20–18:30 BRT)

**Versão testada.** A última mudança no site foi às 18:20:17 (`README.md`); antes dela, `tests/metodos.test.cjs` mudou às 18:19:34. A única mudança posterior é o meu teste, às 18:20:35. A rodada final rodou das 18:23:49 às 18:28:44, depois de mais de 3 minutos sem mudança. `vf_ui.py` falhou nessa rodada por um erro do meu script e rodei de novo às ~18:29, na mesma versão. Snapshot final: `mtimes-v5-final.txt`. Evidências: `vf_ui.json`, `pre-v6.json` e os mesmos `v5_*`/`qa_v5_*` da rodada anterior.

**Testes.** `node --test tests/` deu **117/117**. São 117 e não os 116 esperados, porque o L5-5(b) virou dois testes. `node tests/teste-metodos.cjs` deu **13/13**.

**Meu teste.** O L5-5(b) agora passa `criterio:'absoluto'` e espera 7. Incluí o teste novo “L5-5(b) [relativo]: iteracoesEstimadas é null”.

### Status
| Bug | Status | Evidência |
|---|---|---|
| BUG-28 | **Resolvido** (gráfico inconclusivo) | Trocar o critério recalcula na hora a mensagem, a tabela, o player e a descrição. Na bissecção de x³−x−1, o relativo dá 13 iterações e o absoluto dá 14, com “Parou porque (b − a)/2 < tol”. No Ver código, o último passo mostra `const crit = …`. Trocar o pivoteamento também recalcula: 1e−17 dá [1;1] no auto e no sempre e [0;1] no nunca, com 8/8/7 passos. Ao editar um campo aparece “Desatualizado” e o resultado fica com opacidade. A marca continua depois de desfazer a edição (digitando ou com Ctrl+Z) e depois de trocar de aba (o valor é preservado). Ela some depois de Calcular. O PNG do canvas do gráfico no último passo é idêntico entre os dois critérios, então não consigo afirmar que o gráfico foi redesenhado: as raízes diferem em 6e−5. |
| BUG-29 | **Resolvido** | L5-5(b) no relativo dá 6 iterações, sem “estimativa teórica”. No absoluto dá 7, com “(estimativa teórica: 7)”. O núcleo retorna `iteracoesEstimadas` null. |
| BUG-30 | **Resolvido** | Newton f=x, x0=0,5 dá RAIZ_EXATA, sem o aviso CRITERIO_RELATIVO_PERTO_DE_ZERO e sem selo. Pelo núcleo, o aviso só aparece quando o último passo tem fallback e o motivo é TOLERANCIA. |
| BUG-31 | **Resolvido** | `limiarZeroRelativo(ε)` = max(ε, 1e−12) (1e−4→1e−4; 1e−15→1e−12). Newton x³ com x0=1 e ε=1e−4: **23 iterações**, raiz 8,910e−5, com os avisos CONVERGENCIA_LENTA e CRITERIO_RELATIVO_PERTO_DE_ZERO e selo 2. Newton x³ com x0=0,5 e ε=1e−6: 33 iterações no núcleo; na UI, com N=30 padrão, termina em “Máximo de iterações”, o que é coerente. Bissecção de x, x³ e sin x em [−1,2] com ε=1e−4: **15 iterações** (antes 40). Todos esses números conferem com o meu recálculo em Python pelo §19–§20. No x³ a raiz difere só no último ulp, por x**3 contra x·x·x. |

### Bugs novos
| Severidade | Qtde | Bugs |
|---|---|---|
| Crítica | 0 | — |
| Alta | 0 | — |
| Média | 1 | BUG-32 |
| Baixa | 1 | BUG-33 |

- **BUG-32 (média): o limiar max(ε, 1e−12) faz raízes reais com |x| ~ ε pararem com erro relativo grande, e a mensagem diz que a raiz é ≈ 0.**
  - Bissecção de x−5e−5 em [−1,2] com ε=1e−4: para em 15 iterações com raiz 3,052e−5. O erro relativo é **0,39**. Os avisos dizem “(raiz ≈ 0)”, mas a raiz real é 5e−5.
  - Newton x²−2,5e−9, x0=1: raiz 7,411e−5 contra a real 5e−5. O erro relativo é **0,48**. Além disso, aparece “Convergência lenta: provável raiz múltipla”, mas a raiz é simples.
  - Newton x−5e−5: erro 0, porque converge em 2 passos.
  - Controle sem fallback: x−2e−4 dá erro relativo 1,7e−6.
  - Por que importa: o critério relativo promete precisão relativa ε, e quando |x| < ε ele entrega só precisão absoluta ε, que não é nenhuma precisão relativa.
- **BUG-33 (baixa): a grade mostra 3 algarismos quando 4 cabem.** Na Hilbert 10 (1280), 66 de 110 células mostram “0,333”, “0,167”, “0,143”. A largura útil é de 47 px e “0,3333” mede 30,6 px, então o corte não é por falta de espaço. O critério da v4 não é cumprido. O title e o foco guardam o valor completo (0,3333333333333333). Na grade 3×3, as células mostram 4 algarismos (“0,3333”, “0,1235”).

### BUG-13 (varredura de animação e reduced-motion, 3 métodos)
- **Sem reduce.**
  - Bissecção: `let manter;` → `if (manter === 'esquerda')`.
  - Newton: `const xNovo = …` → `const crit = Metodos.testeParada(…)` no último passo.
  - Gauss: `registrar('inicio')` → `const pivo` → `const fator` → … → `x[i] = soma / M[i][i]`.
- **Com reduce.** Mostra direto a linha final de cada passo (bissecção `if (manter…)`), e as sequências do Newton e do Gauss ficam iguais. É coerente.
- **Player.** Com e sem reduce, o Reproduzir avança de 2/11 até 11/11 em ~11 s e para no fim, sem travar.

### Regressão rápida
- **15 exercícios:** **15/15 nos dois critérios** (núcleo, UI, gabarito e referência §19). O núcleo também bate 15/15 depois do §20.
- **Bateria absoluta:** idêntica à v4, exceto `default_bis`, que é esperado.
- **Gauss:** os 3 modos com 1e−17 dão [1;1]/[1;1]/[0;1]. Hilbert 10 dá det 2,164e−53.
- **Layout:** em 390 e 1280, nos dois temas, sem rolagem horizontal e sem alvo < 44 px em 390.
- **Console:** limpo em todas as rodadas.

### Sem refazer
- O gráfico depois da troca de critério ficou inconclusivo (canvas idêntico no último passo; não comparei passo a passo).
- Não revisei as capturas uma a uma.
- A grade só foi medida em 1280, não em 390.

## Reteste BUG-32, BUG-33 e redesenho do gráfico (atualizado com a regra nova do BUG-33)

Versão testada: último arquivo alterado às **18:35:27 BRT** (BUG-32, x³, raízes simples). BUG-33 com a regra nova e o gráfico foram refeitos na versão de **18:49:57 BRT** (README.md), estável por 2 min; resultados do node idênticos aos de 18:35 (css/estilo.css), com 2 min sem mudanças antes da rodada. Referência independente: `qa-metodos-numericos/b32_ref.py`, que implementa o §19/§20 com `<` estrito, k=1 como 1º ponto calculado e fallback |x|<1e−12. Comparação feita com `Metodos.executar` via node (`b32_res.json`) e na UI via Playwright, a 1280 e 390 (`b32_ui*.json`, prints em `qa-metodos-numericos/screens-v5-bug32/`). Console sem erros.

### Valores anunciados × medidos (ε=1e−4, relativo, maxIter=200)
| Caso | Anunciado | Ref. Python | Site (node/UI) |
|---|---|---|---|
| bis x−5e−5 [−1,2] | 4,99999e−5, 30 it, sem avisos | 4,999992e−5, 30 it, erro real 1,7e−6 | igual, sem avisos ✔ |
| new x²−2,5e−9, x0=1/10/0,001 | 5e−5; 18/21/8 it | 18/21/8 it, erro real ≤ 1,6e−9 | igual, sem aviso de raiz múltipla ✔ |
| new x³, x0=1, relativo | RAIZ_EM_ZERO após 36 it, raiz 4,578e−7, aviso de lentidão | f'≈0 na it 36, x=4,578e−7 | igual ✔ (com maxIter=200) |
| new x³, absoluto | converge | 22 it, 1,337e−4 | igual + aviso de lentidão ✔ |
| new f=x, x0=0,5 | 1 it, sem aviso | 2 it (minha ref. não testa f(x₁)=0) | 1 it, RAIZ_EXATA ✔ (±1 explicado pela parada em f(xₖ)=0) |
| new sin x, x0=0,5 | **4 it**, fallback + aviso | **3 it**, fallback | **3 it**, aviso "na iteração 3" ✔ (o número anunciado está errado; o site está certo) |
| bis x [−1,2] | 40 it | 40 it, fallback | 40 it + aviso perto de zero ✔ |

Casos extras, todos iguais à referência:
- Bissecção x−r: r=1e−6, 1e−8 e 1e−11 levam 35, 42 e 52 it, com erro real de 8,0e−5, 3,3e−5 e 2,2e−5, todos < ε e sem aviso.
- Newton x²−r²: 24, 30 e 40 it, erro real ≤ 1e−9.
- Raiz exatamente 0: bis x em [−1,1] para em 1 it e em [−1,3] em 2 it (RAIZ_EXATA), sem aviso.
- O aviso CRITERIO_RELATIVO_PERTO_DE_ZERO só apareceu quando |x|<1e−12 (sin, bis x).
- Raiz múltipla: x³ e (x−1)², nos dois critérios, mostram mensagem clara + "Convergência lenta… provável raiz múltipla". (x−1)² converge (14 it, 1,000061) com o aviso.
- Raízes simples (x²−2, cos x−x, x−5e−5) não disparam o aviso de raiz múltipla ✔.

Observação (não é bug): na UI o padrão é maxIter=30, então o x³ relativo dá RAIZ_EM_ZERO após 30 it com último x = 5,215e−6. Os 36 it / 4,578e−7 só aparecem com maxIter ≥ 36.

**BUG-32: RESOLVIDO.**

### UI
- A mensagem RAIZ_EM_ZERO do x³ é legível a 1280 e a 390: nada cortado, nada sobreposto, sem rolagem horizontal, fonte mínima de 14px (`new-x3-rel-{1280,390}.png`).
- Bissecção x−5e−5 e Newton x²−2,5e−9: raiz, iterações e avisos da UI batem com o node nas duas larguras.

### BUG-33, regra nova do Designer (versão 18:49:57 BRT)
Regra: as grades nunca mostram menos de 4 algarismos significativos, e a fonte não diminui para caber; se não couber, a grade rola por dentro.
Teste: Hilbert 10 e um 3x3 (1/3, −123456,789, 1e−5, e, π…), nos 3 modos de pivô, a 1280, 1024 e 390. Script `qa-metodos-numericos/b33_ui.py`; prints `screens-v5-bug32/b33-*.png`, incluindo `*-rolado.png` depois de rolar.

- **Página sem rolagem horizontal:** documentElement.scrollWidth ≤ innerWidth nas 3 larguras e em todos os casos ✔.
- **4 algarismos:** 4 algarismos nas grades de entrada e da matriz (0,3333, 0,05357, 0,005556, −123500…), sem reticências e sem texto maior que a célula ✔. A fonte é fixa: 14px na entrada (12px no Hilbert 10 a 1280, onde não rola) e 12px na matriz final, sem variar com a largura.
- **Rolagem:** o Hilbert 10 rola a 1024 e a 390; a 1280 só a matriz rola. O 3x3 rola a 390.
- **Rótulos L/x fixos (sticky):** ✔ em todos os casos.
- **Bloco b fixo:** ✔ na entrada. Na matriz o b se desloca ~3,5px no fim da rolagem (1191→1187,6px a 1280; 353→350,1px a 390). Não chega a ser bug (observação O-1).
- **Sombra:** `tem-dir` no início, as duas sombras no meio, só `tem-esq` no fim. A sombra do b chega a `none` no fim e a dos rótulos aparece só depois de rolar ✔.
- **Teclado:** o contêiner tem tabindex=0 e role=region; com foco via Tab, :focus-visible aparece com contorno sólido de 3px; ←/→ rola (scrollLeft 0→120→fim) ✔.

**BUG-34 (média): a 390 a matriz da etapa mostra "1,0e−5", 2 algarismos.**
1. Abra a 390px e vá para a aba Gauss.
2. Cole A = [[0,3333333333333333, −123456,789, 1e−5], [2,718281828, 1, 3,14159265], [5, 6, 7]] e b = [1, 2, 3], em qualquer modo de pivô.
3. Calcule e vá para o passo 1 da matriz (no Nunca, a célula também aparece no passo final).

Esperado: "1,000e−5", com a grade rolando por dentro.
Obtido: a célula usa `.num__curto` = "1,0e−5". A 1024 e 1280 aparece o `.num__longo` "1,000e−5".
Causa provável: `js/visual/gauss.js` ainda troca para a forma curta (`cient-curto`/`cel--xs`) quando o texto não cabe, em vez de rolar.
Print: `screens-v5-bug32/b33-chk-1e-5-390.png`. Não é o item aceito do −1,000e+17 no Nunca: é outra célula e acontece nos 3 modos.

**BUG-35 (baixa): o title (tooltip) das células da matriz tem menos de 4 algarismos.**
O title usa 4 casas decimais fixas: a célula mostra "0,005556" e o title "0,0056"; a célula "0,05357" tem o title "0,0536". Em valores pequenos o tooltip fica menos preciso que a própria célula.
Reproduzir: Hilbert 10, qualquer modo, passo final, passe o mouse sobre a célula (8,9) ou qualquer outra < 0,01.

### Redesenho do gráfico ao trocar o critério: CONFIRMADO
Hash do canvas no último passo:
- Bissecção x³−x−1 (rel 13 → abs 14 passos): o hash muda e volta ao original ao retornar para o relativo.
- Newton x²−2,5e−9 (rel 18 → abs 14 passos): o hash muda.
- Com x²−2 (tol 1e−6) os dois critérios têm os mesmos 5 passos, então o canvas igual é o esperado.
- Os prints do Dev (`screenshots/bug28-grafico-antes/depois-1280.png`) existem, mas não usei como prova.

### Testes
- `node --test`: **118/118**, incluindo o meu `lista-exercicios.test.js` (38/38).
- `tests/teste-metodos.cjs`: **13/13**.

- Listas 15/15 nos dois critérios: `lista-exercicios.test.js` passa 38/38.
- Os números acima foram repetidos na versão de 18:49:57: 118/118 e 13/13.
- Gráfico revalidado em 18:49:57: os hashes mudam na bissecção e no Newton.

**Bugs novos: BUG-34 (média) e BUG-35 (baixa).**
