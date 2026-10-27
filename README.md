# Métodos Numéricos Interativos

Site estático (abre com **duplo clique em `index.html`**, via `file://`, sem build, sem servidor, sem CDN, sem ES modules).
Três abas: **Bissecção**, **Newton-Raphson** e **Eliminação de Gauss**, com animação passo a passo, player
(início, voltar, reproduzir/pausar, avançar, fim, velocidade, barra de progresso), tabela sincronizada
(clicar numa linha pula para o passo) e painel **Ver código**.

## Quem cuida de quê
| Área | Arquivos | Responsável |
|---|---|---|
| Lógica numérica, parser, validação | `js/expressao.js`, `js/metodos/*.js`, `docs/` | Matemático Numérico |
| Tokens e componentes visuais | `design/tokens.css`, `design/componentes.css` | Designer UI |
| Interface | `index.html`, `css/estilo.css` (só layout), `js/app.js`, `js/player.js`, `js/grafico.js`, `js/visual/*` | Front-end |

Ordem dos CSS (sem `@import`): `design/tokens.css` → `design/componentes.css` → `css/estilo.css` (só layout, conforme `design/INTEGRACAO.md`).
Tema escuro é o padrão; claro com `<html data-theme="light">` (botão no topo, salvo em `localStorage`, aplicado antes da pintura).
Nenhuma cor fixa no CSS de tela nem no JS. O canvas lê `--canvas-*` via `getComputedStyle` e redesenha ao trocar o tema
(MutationObserver em `data-theme`): `--canvas-funcao`, `-eixo`, `-grade`, `-rotulo`, `-intervalo-preenchimento`, `-intervalo-borda`,
`-ponto-medio`, `-tangente`, `-raiz`, `-erro`; o Gauss usa `--canvas-pivo`, `--canvas-pivo-fundo`, `--canvas-linha-operada(-borda)`.
Componentes usados: `.card`, `.btn`, `.input`, `.campo`, `.toast`, `.tabela-wrap/.tabela`, `.grafico__legenda`, `.gaveta-codigo`, `.codigo`.
Durações: `--duracao-animacao` (passo) e `--intervalo-passo` (reproduzir), de tokens.css.

## Fluxo
`formulário → js/visual/chamadas.js → Metodos.executar.<metodo>(params)` (validação, compilação, diagnóstico — tudo do Matemático, em
`js/metodos/validacao.js`) `→ js/visual/adaptador.js (normaliza passos) → js/visual/<metodo>.js (desenha) ← js/player.js (índice)`.
Erros (`erro`/`codigoErro`) e `avisos` (extremos invertidos, derivada simbólica calculada, oscilação, sistema impossível × infinitas
soluções...) aparecem como `.toast` numa região `role="status" aria-live="polite"` (erros com `role="alert"`).
Ordem dos scripts: `expressao.js → metodos/comum.js → bisseccao/newton/gauss.js → metodos/validacao.js → interface`.
O contrato oficial está em **`docs/contrato-etapas.md`**; o resumo abaixo é o que a interface consome.

## Contrato de dados das etapas
Retorno de cada método: `{ passos: [...], ...resultado, motivo? }` (ou `{ passos, resultado, erro }`).
`motivo` reconhecido: `TOLERANCIA`, `RAIZ_EXATA`, `SOLUCAO_UNICA` (sucesso), `MAX_ITERACOES`, `DERIVADA_ZERO`, `DIVERGENCIA`, `MATRIZ_SINGULAR` (+`coluna`).
Campos comuns opcionais em qualquer passo: `descricao` (texto exibido), `etapa` (tag p/ Ver código), `linha` (nº da linha na função).

**Bissecção** — um passo por iteração:
`{ k, a, b, c, fa, fb, fc, erro, manter: 'esquerda'|'direita'|'raiz', descricao }`
(apelidos aceitos: `iteracao`, `pontoMedio`/`m`, `fm`, `largura`...; `fa/fb/fc` ausentes são recalculados).

**Newton-Raphson** — um passo por iteração:
`{ k, x, fx, dfx, xNovo, erro, descricao }` (apelidos: `xk`, `fxk`, `derivada`, `xProx`/`xk1`...).

**Gauss** — um passo por operação, sempre com a matriz aumentada **após** a operação:
`{ tipo: 'inicio'|'troca'|'pivo'|'eliminacao'|'substituicao'|'fim', fase: 'eliminacao'|'substituicao', matriz: number[n][n+1],
   pivo?: {linha, coluna}, linhas?: [i, j] (troca), linhaAlvo?, linhaPivo?, fator?, indice? (x calculado), x?: (number|null)[], descricao }`.
Se `matriz` faltar num passo, reaproveita a do passo anterior.

## Painel “Ver código” e destaque da linha da etapa
Existe nas três abas; cada botão abre a gaveta com `Metodos.bisseccao` / `Metodos.newton` / `Metodos.gauss` `.toString()` (as funções curtas, não o `executar`; se um dia virar objeto, procura `executar`/`resolver`/... ),
com highlighter próprio (classes `.tok-kw`, `.tok-str`, `.tok-num`, `.tok-com`, `.tok-fn`), números de linha, foco preso, Esc fecha (foco volta ao botão), botão Copiar
(`navigator.clipboard`, fallback `execCommand('copy')`, status em `aria-live`) e a linha da etapa atual com `.linha-ativa`, atualizada a cada passo.
Prioridade para achar a linha:
1. `passo.linha` — número da linha (1 = primeira linha da função exibida);
2. `passo.etapa = 'nome'` + comentário-marcador **`// @etapa:nome`** dentro da função (recomendado ao Matemático);
3. heurística por método (ex.: `c = (a + b) / 2`, `xNovo =`, `fator =`, `x[i] =`, `tipo: 'pivo'`). Para Gauss, `tipo` vira a tag (`@etapa:troca`, `@etapa:eliminacao`...).

## Testes
- `npm test` — testes do Matemático (`tests/*.test.cjs`).
- `node tests/teste-metodos.cjs` — integração da interface: carrega via `vm` o núcleo + `validacao.js` + adaptador + chamadas e confere: bissecção x³−x−2 em [1,2] ≈ 1,52138; Newton x²−2 a partir de 1 ≈ 1,41421 (derivada
informada e simbólica), derivada nula, divergência, a>b com aviso, log=log10/ln=natural; Gauss 3×3 → (2, 3, −1) com/sem pivoteamento, sistema singular; parser e adaptador.

## Enquadramento do gráfico do Newton
- **Seguir passo** (padrão): a janela anima o zoom (em escala logarítmica) para cobrir x_k, x_{k+1} e a raiz (quando ela está perto), com 50% de margem e uma largura mínima (2% do 1º passo) para a curva continuar legível.
- **Ver tudo** (botão `#enquadrar-newton`, com aria-pressed): janela robusta com quartis ± 3·IQR sobre todos os iterados; os outliers ficam de fora.
- Divergência: se um passo for mais de 20× maior que a janela robusta, a vista é recortada nela. Os pontos fora da vista aparecem como seta na borda com o texto "xN fora da tela".
- Só x_k e x_{k+1} têm rótulo, colocados um acima e o outro abaixo do eixo (com deslocamento quando estão próximos). Os iterados antigos aparecem como pontos pequenos sem rótulo.

## Gauss de 2 a 100 (interface)
- **Ordem n** é sempre o primeiro controle do painel. Aceita os botões −/+ (desabilitados nos limites) ou digitação direta. Valores fora de 2..100 são limitados e geram um aviso.
- **Mudar n preserva os valores já digitados.** As células novas ficam vazias, e b continua na última coluna (`Visual.gaussEntrada.redimensionar`).
- **n ≤ 10:** a entrada é uma grade editável com rótulos x1..xn | b e L1..Ln. A animação mostra cada operação de linha.
- **n > 10 (modo compacto):**
  - Não há inputs por célula no DOM. A entrada é por Colar, Aleatório ou Exemplo.
  - A visualização é um mapa de cores em canvas (`js/visual/gauss-mapa.js`):
    - sinal ±: `--canvas-intervalo-borda` para positivos, `--canvas-erro` para negativos;
    - intensidade em escala log de |v|; zeros em `--canvas-grade`, bem apagados;
    - pivô e coluna atual em `--canvas-pivo`; a coluna b fica separada por um vão.
  - Interação: zoom pela roda ou pinça, arrastar para mover, e dica "Li, Cj = valor" ao passar o mouse ou tocar. No teclado, as setas percorrem as células (anunciadas em aria-live), +/− dão zoom e 0 restaura.
  - A solução aparece numa lista compacta rolável.
- **Contrato consumido** (docs/contrato-etapas.md):
  - Chamada: `Metodos.executar.gauss(A, b, {granularidade, pivoteamento})`. A interface pede `'coluna'` quando n > 10 e nunca força `'operacao'` com n grande.
  - Pivoteamento: seletor logo abaixo de n com 3 modos, `automatico` (padrão), `sempre` e `nunca`, cada um com uma frase de ajuda. O modo sempre é enviado explicitamente (contrato §17).
  - Na troca de linha, as linhas deslizam (sem animação com prefers-reduced-motion) e aparece um selo: âmbar "Troca obrigatória: pivô zero", "Troca recomendada: pivô pequeno (|a| ≪ |b|)" ou o neutro "Troca: maior |a| na coluna". No automático sem troca aparece "Pivô ok, sem troca". No modo compacto (n > 10) o selo também aparece sobre a coluna do pivô no mapa.
  - O resumo final usa `resultado.trocas`. No modo `nunca`, `resultado.comparacao` aparece lado a lado, com erro relativo à solução pivoteada e resíduo relativo.
  - Ver código do Gauss: `Metodos.gauss` e, abaixo de um divisor, `Metodos.escolherPivo`. A linha ativa percorre `passo.etapas` (decisão em escolherPivo, `trocaLinhas`, `pivo`...).
  - O adaptador reconhece `{tipo:'coluna', etapa, k, pivo, linhaPivo, troca:[p,k]|null, fatores:[{linha,fator}], matriz, descricao}`, seguido de um único `substituicao` (com x completo) e de `fim`.
- **A e b são separados na interface.** A entrada (n ≤ 10) tem duas grades lado a lado: "Matriz A (n×n)" e "Vetor b (n)", com um divisor entre elas. Mudar n preserva os valores das duas. Internamente o modelo continua aumentado, com b na última coluna.
- **Colar A e b** tem dois modos:
  - "A e b separados" usa duas caixas e `Metodos.lerSistemaTexto(textoA, textoB)`. b aceita um valor por linha ou todos numa linha. Em caso de erro, `campo` ('A'/'b') marca a caixa certa com aria-invalid e aria-describedby, e a mensagem mostra linha/coluna.
  - "Aumentada [A | b]" usa uma caixa com n linhas de n + 1 valores e `Metodos.lerMatrizTexto`; A e b são separados automaticamente.
  - Fallbacks de interface (só se o núcleo não oferecer as funções): `js/visual/gauss-provisorio.js` e `Visual.gaussEntrada.lerVetor`.
  - A colagem nunca muda n sozinha. Se A vier k×k com k ≠ n, a interface pergunta "A colada é k×k, mas n = …. Ajustar n para k?" e oferece "Ajustar n para k" / "Cancelar".
  - A precisa ser quadrada e b precisa ter n valores; cada caso tem uma mensagem própria.
- **Visualização:** o escalonamento mostra [A | b], com b destacado. Na grade, b fica numa coluna separada com borda em `--canvas-tangente`. No mapa, b fica após um vão, com borda, escala de intensidade própria e tons próprios (`--canvas-tangente` para valores ≥ 0 e `--canvas-ponto-medio` para < 0). Não há token específico para b no design; esses são tokens existentes.
- **Aleatório** usa `Metodos.gerarSistema(n)`, com solução inteira. `Visual.gaussEntrada.aleatorio` é só fallback.
- **Marcadores de código:** a bissecção usa `// @etapa:pontoMedio` e o Newton `// @etapa:passoNewton` (camelCase, não `ponto-medio`).

## Avisos (vantagens, desvantagens, possíveis problemas)
- Cada método tem, ao lado de "Ver código" (`.acoes-metodo`), o botão **Avisos** (ícone SVG `design/icones/avisos.svg`, inline). Ele abre a **mesma gaveta** do código (`#gaveta-codigo`, `aria-modal="true"`, foco preso em qualquer largura, Esc fecha e devolve o foco, `html.gaveta-aberta`; tela cheia abaixo de 1024px pelo CSS do Designer). No modo Avisos o corpo `#corpo-avisos` substitui o de código, e o botão Copiar e o rodapé ficam ocultos.
- Conteúdo: `Metodos.textos.avisos.{bisseccao,newton,gauss}` (`js/metodos/avisos.js`, do Matemático, carregado logo após `comum.js`). Formato: `{resumo:{convergencia,custo}, vantagens:[], desvantagens:[], problemas:[{id,titulo,quando,solucao|oQueFazer,codigos,mensagem?}]}`. Sem conteúdo, mostra "Conteúdo em preparação". Renderização em `js/visual/avisos.js`, com a marcação do design/INTEGRACAO.md §8.
- Selo: soma `codigoErro` e `codigosAviso` do resultado atual. O casamento é 1) por `problema.codigos`; 2) por `problema.mensagem` contra o texto do erro ou aviso; 3) só para problemas sem códigos (ex.: pivô nulo, mal-condicionamento), por um mapa local código → palavra-chave no título. Avisos informativos só contam se algum problema os listar. O botão recebe `.btn-selo` (aria-hidden) e `aria-label="Avisos (N problema(s) no cálculo atual)"`. Ao abrir, os itens detectados vêm com `.is-ativo` e `open`, e o foco vai ao `<summary>` do primeiro.

## Linha ativa no "Ver código" (BUG-13)
`passo.etapa` (ação principal) escolhe o marcador `// @etapa:<nome>`, e a linha marcada é a primeira linha de código depois dele (pula comentários e linhas em branco). Durante a reprodução, a linha percorre `passo.etapas` e termina em `passo.etapa`; não há animação com `prefers-reduced-motion`. Bissecção: pontoMedio, testeSinal, atualizaIntervalo, criterioParada. Newton: avaliaDerivada, passoNewton, criterioParada.

## Critério de parada (Bissecção e Newton, interface)

- Controle segmentado (`fieldset` + rádios, `.segmentado`) "Critério de parada": **Relativo (ε)** (padrão) ou **Absoluto (tol)**. O `criterio` é sempre passado explicitamente. O rótulo do campo vira "ε" ou "Tolerância (tol)", e uma única explicação do critério ativo fica embaixo do campo (`aria-describedby`). O pivoteamento do Gauss usa o mesmo controle (3 rádios; as setas trocam a opção).
- `Visual.chamar.bisseccao/newton` repassa `criterio: 'absoluto'|'relativo'` ao núcleo (contrato §19) e preserva `codigosAviso`. Mapeamento único em `js/visual/chamadas.js` (`Visual.criterio`).
- A tabela usa `passo.erroCriterio` no relativo (`—` quando é null na 1ª iteração da bissecção). O título da coluna é `(b−a)/2` ou `|Δx|` no absoluto e `|Δx|/|x|` no relativo. `criterioFallback` aparece como "⚠ |Δx|" na linha e no resumo.
- O resumo diz o motivo da parada com a fórmula. No "Ver código", o último passo destaca a linha de `Metodos.testeParada` (marcador `@etapa:criterioParada`), que é a mesma nos dois modos.
- Aviso `CRITERIO_RELATIVO_PERTO_DE_ZERO`: toast do núcleo, mais selo e o item `criterio-parada` no painel Avisos.

## Recalcular ao mudar entradas (BUG-28, interface)

- **Critério (Relativo/Absoluto) e pivoteamento do Gauss (Automático/Sempre/Nunca):** trocar a opção atualiza rótulo e ajuda e, se a aba já tem resultado, recalcula na hora (o mesmo `executar()` de Calcular: player volta ao passo inicial e toca, Avisos, selo e Ver código atualizados, sem listeners nem animações duplicados).
- **Campos de texto (f, a, b, x0, ε/tol, máx. iterações, f′, células de A e b, n):** não recalculam a cada tecla. Ao editar, aparece o aviso `#desat-<aba>` (`role="status"`, badge "Desatualizado") e a coluna de resultados fica esmaecida (`.resultado-desatualizado`) até o próximo Calcular/Enter. Mudar n ou Limpar no Gauss também marca o resultado como desatualizado. Os textos do painel "Colar" só contam ao carregar, e o diálogo "Ajustar n" não mudou.

## Células do Gauss: piso de 4 algarismos (interface)

- Nível único por grade (entrada e matriz da etapa, cada uma com o seu, em `data-nivel`): 0 = 4 algarismos, 1 = 4 algarismos em `--fs-xs` (`.grade--xs`). Notação científica só para magnitudes extremas (≥ 1e6 ou < 1e−4).
- Se nem 4 algarismos em xs cabem no layout fluido, a grade passa ao layout com larguras mínimas (`.grade--rola`) e rola por dentro; a página nunca rola na horizontal. 1024 fica igual a 390.
- Os níveis de 3 e 2 algarismos foram removidos: as duas grades estão sempre dentro de `.rolagem-x`, então não existe caso sem contêiner com rolagem.
- Na grade que rola: rótulos L1…Ln sticky à esquerda (revisão 3), bloco/coluna b sticky à direita, sombra na borda com conteúdo (`.tem-esq`/`.tem-dir`, atualizadas no scroll e no resize, sem transição com reduced-motion), contêiner com `tabindex="0"`, `role="region"` e `aria-label` ("Matriz A, role para ver mais colunas" / "Matriz da etapa, role para ver mais colunas"). Medição remeditada ao editar, no resize e no `document.fonts.ready`.

## Números
Toda saída (resultado, tabelas, tooltip, descrições, eixos, lista de x, mensagens do núcleo) usa vírgula decimal e o sinal "−" (`Visual.br`). A gaveta de código mantém o ponto, por ser JavaScript.

## Tabela de iterações no formato da professora

- **Bissecção:** k (a partir de 1) | a | b | xᵢ | f(a) | f(b) | f(xᵢ) | erro. Todos os valores vêm dos passos do núcleo (`a, b, c, fa, fb, fc`); a interface não calcula nada.
- **Newton:** k | xᵢ | f(xᵢ) | f′(xᵢ) | xᵢ₊₁ | erro. A lista 2 não fixa uma ordem de colunas, então esta é a ordem padrão. O k exibido é `passo.k + 1`, porque o núcleo conta a partir de 0.
- **Cabeçalho do erro** (`Visual.thErro`): no relativo, `|xᵢ₊₁ − xᵢ|/|xᵢ₊₁|`. No absoluto, `(b − a)/2` na bissecção e `|xᵢ₊₁ − xᵢ|` no Newton. A 1ª linha mostra “—” quando o núcleo não tem erro.
- **Números** (`Visual.sig6`): 6 algarismos significativos, sem zeros à direita, com vírgula e −. Abaixo de 10⁻⁴ usam notação e.
- **Linha final (a raiz):** fica em âmbar quando o método converge (`.linha-raiz`), com `--cor-troca-obrigatoria-fundo` no fundo e `--cor-troca-obrigatoria` no texto. Continua clicável e sincronizada com o player.
- **Telas estreitas (390):** a tabela rola na horizontal e o k fica fixo. Com a tabela rolada (`.tem-esq`), o k ganha a sombra `1px 0 0 var(--cor-borda-forte), 6px 0 6px -4px var(--cor-borda-forte)`. Os rótulos fixos das grades do Gauss usam a mesma sombra.
- **Conferência com a imagem** `docs/referencias/tabela-bisseccao-professora.jpg`: com f(x)=x³−9x+3 em [0, 1], critério relativo e ε = 0,01, o resultado são 9 iterações. Os valores coincidem, só o arredondamento muda: a imagem vem do Excel, que corta em 6 casas.

## ε padrão e valor por critério

- O campo ε/tol começa no relativo com `Metodos.TOL_PADRAO.relativo`, que hoje vale 0,01 (fallback 0,01). O absoluto começa em 0,0001, porque o core não tem padrão para ele (`TOL_PADRAO.absoluto = null`).
- Cada critério guarda o próprio valor. Quando o usuário troca de critério, a edição feita no critério anterior fica guardada e o campo mostra o valor do novo critério, sem nunca ficar vazio. O app sempre passa o `tol` explícito ao core.
- Com os exemplos iniciais e ε = 0,01: a bissecção de x³ − x − 2 em [1, 2] faz 7 iterações e chega a 1,5234375. O Newton de x² − 2 com x₀ = 3 faz 4 iterações e chega a 1,41421378. Já x³ − 9x + 3 em [0, 1] faz 9 iterações (é a tabela da professora).

## BUG-34 / BUG-35

- **BUG-34:** a forma curta (`num--cient`/`num__curto`, 2 algarismos em ≤640px) foi removida. Toda célula do Gauss segue a regra de 4 algarismos: piso de 4 em xs e, quando nem isso cabe, rolagem interna. Isso vale também para a notação científica (1,000e−5).
- **BUG-35:** `Visual.completo(v)` gera a representação mais curta que faz ida e volta, com vírgula e −. Ela é usada em title e aria-label das células do Gauss, do mapa, da solução, da comparação do modo Nunca e das tabelas de Bissecção e Newton.
