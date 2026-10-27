# Relatório QA v6: teste final

Versão testada: último arquivo de código alterado às **19:00:32 BRT** (README.md; js/app.js e index.html às 19:00:16; js/visual/gauss.js às 18:56:50). Estável por 2 min antes da rodada final, sem mudanças durante ela. Às ~19:08 BRT apareceram `.git/`, `.gitignore` e `.nojekyll` (commit e push para origin/main), sem alteração de código.
Ferramentas: referências Python (`qa-metodos-numericos/v6_prof.py`, `b32_ref.py`, numpy/scipy), core via node (`v6_core.cjs`) e Playwright/Chromium em file:// (`v6_ui.py`, `v6_reg.py`). Prints em `qa-metodos-numericos/screens-v6/`. Console: **0 erros e 0 warnings** em todas as rodadas.

## 1) Tabela no formato da professora: OK
- **Bissecção:** colunas `k | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | |xᵢ₊₁ − xᵢ|/|xᵢ₊₁|`, k começa em 1. A 1ª linha tem erro "—" no relativo e a última linha fica destacada em âmbar.
- **Newton:** colunas `k | xᵢ | f(xᵢ) | f′(xᵢ) | xᵢ₊₁ | erro`, última linha em âmbar.
- **x³−9x+3 em [0,1]:** a imagem é reproduzida com **relativo, ε = 0,01**, o padrão novo. Dá 9 iterações, raiz 0,337891 e erro final 0,00578035. Na iteração 8 o erro é 0,011494, ainda ≥ ε. Com absoluto 0,01 dariam 7 iterações; com relativo 1e−3, 12.
- **Linha a linha (UI e minha referência Python × imagem):** todos os 72 valores batem. As únicas diferenças vêm do arredondamento da imagem: f(b) nas linhas 8 e 9 e f(xᵢ) na linha 9 aparecem como −0,01934 e −0,00244, enquanto o site mostra −0,0193439 e −0,00243863. Os valores verdadeiros são −0,019344 e −0,0024386. Os 6 algarismos do site estão de acordo com a decisão de formatação; isso não é bug.
- **390px:** a tabela rola por dentro (798px de conteúdo em 364px; tabindex=0). A coluna k é sticky e não se move ao rolar (x = 13px antes e depois). Página sem estouro (390/390). Prints: `prof-bis-1280.png`, `prof-bis-390.png`, `prof-bis-390-rolado.png`, `newton-tab-*.png`.

## 2) Padrões de ε: OK
- O relativo abre com ε = 0,01 e o absoluto com 0,0001, nas duas abas.
- Cada critério guarda o seu valor, e a edição se mantém nos dois sentidos: no absoluto editei para 1e−6, fui ao relativo (0,01), voltei ao absoluto (1e−6); editei o relativo para 0,05, fui ao absoluto (1e−6), voltei ao relativo (0,05). Depois de recarregar a página, volta a 0,01.
- `node --test`: **119/119**. `tests/teste-metodos.cjs`: **13/13**.
- `lista-exercicios.test.js` (meu teste, listas 15/15 nos dois critérios): 38/38. Não precisei ajustar, porque o teste já passa o critério e o ε explicitamente.

## 3) BUG-34 e BUG-35: RESOLVIDOS
- **BUG-34:** a 390, a célula 1e−5 do 3x3 mostra "1,000e−5" em todos os passos nos 3 modos (no Nunca, 1,007e+6 também aparece com 4 algarismos). A grade rola por dentro e a página fica em 390/390. Print `b34-390.png`.
- **BUG-35:** o title e o aria-label das células trazem o valor completo, por exemplo "0,3333333333333333", "−123456,789", "1e−5", "2,2675736961463855e−5" e "4,291989418618708e−12". Conferi todas as 110 células da matriz do Hilbert 10 e as 12 do 3x3: nenhuma tem title menos preciso que o texto exibido.
- **Leitor de tela:** o aria-label tem a forma "L3, C3 = 1e−5", sem ruído, e as células de entrada têm "A linha 1, coluna 1" mais o valor. Ressalva (BUG-36): esse aria-label está num `<span>` sem role, e o snapshot de acessibilidade do Chromium lê só o texto visível arredondado.

**BUG-36 (baixa, acessibilidade): o aria-label das células da matriz da etapa não é lido.**
1. Gauss, 3x3 padrão: Calcular e ir ao passo 1.
2. Inspecione a árvore de acessibilidade de `#rolagem-matriz`.

Esperado: o leitor anuncia "L1, C1 = …" com o valor completo.
Obtido: a árvore mostra só `text: x1 x2 x3 b L1 5 6 7 3 …`. Pelo ARIA 1.2, aria-label em elemento genérico (span/div sem role) é ignorado, e o valor completo só fica no tooltip.
Sugestão: role="cell"/grid na matriz, ou texto sr-only. Não bloqueia a publicação.

## 4) Regressão geral
| Área | Resultado |
|---|---|
| Bissecção / Newton, casos clássicos | x³−x−1, cos x−x, x²−2 e eˣ−2 batem com scipy/math dentro da tolerância. Os casos do BUG-32 seguem iguais à referência. ✔ |
| Casos-limite | SEM_TROCA_DE_SINAL, DERIVADA_ZERO (x²−1, x0=0), DIVERGENCIA (atan, x0=2), FUNCAO_NAO_DEFINIDA (x^(1/3)), ERRO_SINTAXE (x^^2, mostra a posição), tolerância ≤0 e "a" inválido: todos com mensagem clara ✔ |
| Gauss nos 3 modos | 3x3 = (2, 3, −1) ✔. Singular → MATRIZ_SINGULAR ✔. [[1e−17,1],[1,1]]: Automático/Sempre (1, 1), Nunca (0, 1), como esperado ✔. Hilbert 10: erro máximo 4,4e−4 / 3,2e−4 / 4,4e−4, coerente com cond ≈ 1,6e13 ✔ |
| Animação / reduced-motion | Autoplay depois de Calcular vai até 11/11 e o botão volta a "Reproduzir". Com reduce não há autoplay e o Tocar manual funciona ✔ |
| Ver código | Bissecção 55 linhas, Newton 53, Gauss 93, todas com ≤70 colunas, comentadas e com a linha ativa marcada ✔. Observação: o `passos.push({...})` com campos de visualização (etapas, descricao, criterioFallback) é o trecho menos didático, mas está aceitável. |
| Redesenho do gráfico | O hash do canvas muda ao trocar o critério (bissecção e Newton) ✔ |
| Layout a 1280, 1024 e 390, temas escuro e claro | scrollWidth = innerWidth nas 3 abas, nas 3 larguras e nos 2 temas. O tema alterna corretamente ✔ |
| Console | 0 erros ✔ |

Itens aceitos não reabertos: BUG-04, a célula −1,000e+17 no Nunca a 390 e as pendências do zoom do Newton, que não pioraram.
Os prints do Dev (`screenshots/bug34-*`, `bug35-*`, `padrao-relativo-*`, `tabela-professora-*`) existem e batem com o que medi; usei só para comparação.

## Bugs novos
- **BUG-36 (baixa):** aria-label das células da matriz ignorado pelo leitor de tela.

## VEREDITO: **PUBLICAR COM RESSALVAS**
Nenhum bloqueador: cálculos, tabela da professora, padrões, BUG-34/35, layout e console estão OK. Ressalvas:
1. BUG-36 (baixa, acessibilidade): o valor completo das células da matriz não chega ao leitor de tela.
2. Itens aceitos que continuam: BUG-04, o −1,000e+17 no Nunca a 390 (rolagem) e as pendências do zoom do Newton.
3. Hilbert 10 (cond ≈ 1e13) tem erro de ~4e−4 em x: limitação numérica esperada, já sinalizada pelo aviso de mal condicionamento.
