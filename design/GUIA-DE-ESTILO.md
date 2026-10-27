# Guia de estilo — Métodos Numéricos Interativos

Arquivos: `tokens.css` (variáveis) → `componentes.css` (classes) → `demo.html` (vitrine). Integração com o app: ver `INTEGRACAO.md`. Contrastes medidos: `contrastes.md` (gerado por `contraste.py`).

## 1. Princípios
Didático primeiro: cada cor tem **um** significado e sempre vem acompanhada de forma, texto ou ícone. Escuro calmo (azuis da paleta oficial), um único acento quente para o que o aluno deve olhar (raiz, pivô, linha em execução).

## 2. Paleta oficial (`assets/paleta.jpg`)
| Nome | Hex | Uso no tema escuro (padrão) |
|---|---|---|
| Oxford Blue | `#192338` | `--cor-fundo`, fundo de código e inputs (`--cor-campo`) |
| Space cadet | `#1E2E4F` | `--cor-fundo-2`: cabeçalho, painel de gráfico/canvas, tabelas, toasts |
| YInMn Blue | `#31487A` | `--cor-superficie`: cards (por cima só `--cor-texto`/`--cor-texto-suave`) |
| Jordy Blue | `#8FB3E2` | `--cor-primaria`: destaque, botão primário, foco de seleção, Bissecção, intervalo |
| Lavender | `#D9E1F1` | `--cor-texto`, curva f(x), anel de foco |

Derivados: texto suave `#B4C3DE`, borda `#34497A`, borda forte `#5C74A8`, linha ativa `#2B4170`.

### Cores de apoio (derivadas, frias) + 1 acento quente
| Papel | Escuro | Claro | Token |
|---|---|---|---|
| Bissecção | `#8FB3E2` | `#31487A` | `--cor-bisseccao` |
| Newton-Raphson | `#C3B5F2` (lavanda-violeta) | `#5B3FA8` | `--cor-newton` |
| Gauss | `#86D3C8` (verde-água) | `#1F6359` | `--cor-gauss` |
| Intervalo [a,b] | `#8FB3E2` + preench. 16% | `#31487A` + 12% | `--cor-intervalo(-fundo)` |
| Tangente / ponto médio | `#C3B5F2` | `#5B3FA8` | `--cor-tangente` |
| **Raiz / pivô / aviso (acento quente único)** | `#F2C27B` | `#8A4B00` | `--cor-raiz`, `--cor-pivo`, `--cor-acento` |
| Linha eliminada | `#8FA3C7` | `#4A5C80` | `--cor-eliminada` |
| Sucesso / convergiu | `#86D3C8` | `#1F6359` | `--cor-sucesso` |
| Erro / divergiu | `#F4A6B4` (rosa frio, semântico) | `#A3263F` | `--cor-erro` |

Tema claro (opcional, `<html data-theme="light">`): fundo Lavender `#D9E1F1`, fundo-2 `#E8EDF7`, superfície `#FFFFFF`, texto Oxford `#192338`, primária YInMn `#31487A`.

### Contraste (WCAG 2.x, calculado em `contraste.py`)
Todo texto colorido ≥ 4,5:1 sobre `#192338`/`#1E2E4F` (escuro) e sobre `#D9E1F1`/`#E8EDF7`/`#FFFFFF` (claro). Ex.: texto 11,94 / 10,26; Jordy 7,26 / 6,23; acento 9,54; erro 8,19; claro: texto 11,94–15,69, primária 6,84–8,98, acento 5,18–6,80, comentário de código 4,97+. **Regra:** sobre YInMn `#31487A` use só texto (6,84) e texto suave (5,05); Jordy ali (4,15) só como elemento de UI/gráfico (≥ 3:1). Bordas de controle: 3,38 (escuro) e 4,13 (claro). Tabela completa em `contrastes.md`.

## 3. Tipografia
- Texto: `Inter` (Google Fonts opcional) → fallback `system-ui, Segoe UI, Roboto…` (`--fonte-texto`).
- Números/código: `JetBrains Mono` opcional → `ui-monospace, SF Mono, Cascadia Mono, Menlo, Consolas` (`--fonte-mono`), sempre com `font-variant-numeric: tabular-nums slashed-zero` (classe `.ds-num`/`.ds-mono`). Decimais com vírgula (pt-BR) e sinal de menos tipográfico `−`.
- Fórmulas: **KaTeX** recomendado (leve, renderização síncrona). Sem KaTeX, `.ds-formula` usa `--fonte-formula` (Latin Modern/Cambria Math/STIX) em itálico.
- Escala (razão ≈1,25): 12 · 14 · 16 (base) · 18 · 22 · 28 · 36 · 48 px (`--fs-xs`…`--fs-3xl`). Altura de linha 1,2 títulos / 1,5 texto / 1,7 leitura longa.

## 4. Espaçamento, raios, sombras
Base 4px: `--esp-1`=4 · 8 · 12 · 16 · 24 · 32 · 48 · 64. Raios 6/10/16/pílula. Sombras `--sombra-1..3` (mais densas no escuro).

## 5. Layout responsivo
Container máx. 1200px (`.ds-container`), gutter 24px, grid de 12 colunas (`.ds-grid`, `.ds-col-4/6/8/12`); utilitários `.ds-pilha`, `.ds-linha`, `.ds-secao`, `.ds-cabecalho`, `.ds-marca`. Breakpoints: **sm 640**, **md 768** (2 colunas), **lg 1024** (3 colunas; gaveta de código vira lateral), **xl 1280**. Telas de método: controles 1/3 + gráfico 2/3 no lg; empilhado abaixo de md.

## 6. Componentes (`componentes.css`)
- **Cards** `.card`, `.card--metodo` + `.metodo-bisseccao|newton|gauss` (borda superior na cor do método, ícone), `.card--interativo`, `.card--plano` (fundo-2).
- **Botões** `.btn--primario|secundario|fantasma|perigo|icone`; mín. 40px de altura; `:active` scale .97.
- **Inputs numéricos** `.campo`, `.input.input--num` (mono, alinhado à direita, `inputmode="decimal"`); erro = `aria-invalid="true"` + borda 2px + mensagem com ícone ⚠ (`.campo__erro`).
- **Slider** `.ds-slider` com `<output>` exibindo o valor.
- **Tabela de iterações** `.tabela-wrap > .tabela`: cabeçalho fixo, números tabulares; `tr.atual` (barra lateral + fundo), `tr.final` (negrito), `td.destaque-raiz`, `tr.entra` (animação).
- **Painel de gráfico** `.painel-grafico` (barra `.painel-grafico__barra`/`__titulo` com título + controles de passo, SVG/canvas, `figcaption.grafico__legenda`).
- **Matriz aumentada** `.matriz-aum` (`--colunas`), `.matriz__sep` (barra do lado b), `--pivo` (fundo âmbar + borda + negrito), `--zerada`, `--alterada` (sublinhado), `.op-linha` para a operação Lᵢ ← Lᵢ − m·Lⱼ.
- **Badges** `.badge--sucesso|erro|aviso|info|metodo`, sempre com ícone (✓ ✕ ! ℹ).
- **Toasts** `.toast--sucesso|erro|aviso` dentro de `.toasts` (canto inferior direito), `role="status"` ou `role="alert"`.
- **Alternância segmentada** `.segmentado` com `aria-pressed` (tema, método).
- **Ver código** `.gaveta-codigo` (ver §9).

## 7. Gráficos
Fundo `--canvas-fundo`; grade 1px `--canvas-grade`; eixos 1,5px `--canvas-eixo`; rótulos mono 12px `--canvas-rotulo`; f(x) 2,5px `--canvas-funcao`. Marcadores com **forma distinta** além da cor: a, b = círculo vazado; ponto médio/xₖ = círculo cheio; xₖ₊₁ = losango; raiz = círculo maior âmbar com contorno; tangente = tracejado 8-4; intervalo = faixa translúcida com bordas tracejadas 4-4. Rótulos de texto nos pontos (a = 1, x* ≈ 1,4142) evitando sobreposição. Legenda sempre visível.

## 8. Movimento
`--dur-rapida` 120ms (hover/press), `--dur-media` 200ms (tema, cores), `--dur-lenta` 320ms (toasts, linhas novas), `--dur-gaveta` 280ms, `--dur-passo` 600ms (transição entre iterações). Easing padrão `cubic-bezier(.2,0,0,1)`, entrada `(0,0,.2,1)`, saída `(.4,0,1,1)`. Com `prefers-reduced-motion: reduce` todas as durações viram 0 (inclusive `--duracao-animacao` lida pelo JS): passos mudam instantaneamente, autoplay não deve iniciar sozinho.

## 9. Painel "Ver código"
Botão `</> Ver código` (`aria-expanded`, `aria-controls`) em cada card/tela de método. ≥ 1024px: gaveta lateral direita (`role="dialog"`, `aria-modal="true"`), overlay, **foco preso**, foco inicial no botão fechar, **Esc fecha** e devolve foco ao botão. < 1024px: tela cheia (ver §12). Código em `pre.codigo > code`, uma `<span class="ln">` por linha (numeração via CSS counter, não copiada). Sintaxe: `.tok-kw` palavra-chave, `.tok-str` string, `.tok-num` número, `.tok-com` comentário (itálico), `.tok-fn` função; opcionais `.tok-op`, `.tok-var`; aliases `.hljs-*` para highlight.js. Linha em execução: `.ln.linha-ativa` + `aria-current="step"` → fundo, **barra lateral âmbar e marcador ▶** no lugar do número. Botão Copiar: muda para "✓ Copiado" e anuncia em região `aria-live="polite"`; falha → mensagem de instrução.

## 10. Acessibilidade
Foco visível 3px (`--cor-foco`) com offset 2px em tudo; link "Pular para o conteúdo"; ordem de tabulação = ordem visual; controles de passo com `aria-label`; gráficos SVG com `role="img"` + `<title>`/`<desc>` descrevendo o estado atual (canvas: `aria-label` atualizado + `.descricao-passo` em `aria-live="polite"`); tabelas com `<caption>` e `scope`; matriz com `aria-label` por célula especial (pivô, zero eliminado). **Nunca só cor**: ícones nos badges/toasts, formas nos marcadores, sublinhado/borda/negrito na matriz, barra lateral nas linhas ativas.

## 11. Anticolisão (v2 — 27/10/2026)
`componentes.css` convive com o CSS das telas sem brigar:
- **Elementos** (`*`, `body`, `h1–h4`, `p`, `a`, `:focus-visible`) só dentro de `:where()` → especificidade 0; qualquer regra do app vence.
- **Utilitários de layout** com prefixo `ds-`: `.ds-container .ds-grid .ds-col-* .ds-pilha .ds-linha .ds-cabecalho .ds-marca .ds-secao .ds-num .ds-mono .ds-formula .ds-slider`.
- **Blocos renomeados:** `.grafico` → `.painel-grafico` (`__barra`, `__titulo`); `.matriz` → `.matriz-aum` (filhos `.matriz__cel*`, `.matriz__sep` mantidos).
- **Escopados:** `.codigo` → `pre.codigo`; `.contador` → `.controles-passo .contador` / `.player .contador`.
- **API pública mantida** (pode usar livremente): `.card*`, `.btn*`, `.input*`, `.campo*`, `.tabela`, `.tabela-wrap`, `.toast*`, `.badge*`, `.segmentado`, `.grafico__legenda`, `.legenda__*`, `.op-linha`, `.gaveta-codigo*`, `.codigo-overlay`, `.tok-*`, `.metodo-*`, `.sr-only`, `.pular-link`, `.texto-suave`.
- Nomes livres para o app (não usados pelo design): `.linha`, `.grafico`, `.matriz`, `.mv-linha`, `.grafico-canvas`, `.container`, `.grid`, `.num`, etc.

## 12. Gaveta em tela cheia no mobile (< 1024px) — substitui o "expansível inline"
- `.gaveta-codigo` vira `position: fixed; inset: 0; height: 100dvh`, sem raio nem overlay visível (`.codigo-overlay` some), e entra de baixo para cima (`translateY(100%) → 0`, `--dur-gaveta`; com reduced-motion a duração é 0).
- `aria-modal="true"` e **foco preso em qualquer largura**; Esc fecha e devolve o foco ao botão que abriu.
- Cabeçalho `.gaveta-codigo__topo` sticky, com `padding-top: env(safe-area-inset-top)`; botões do topo com alvo de toque **≥ 44×44px**.
- Rolagem **só** em `.gaveta-codigo__corpo` (`overscroll-behavior: contain`); rodapé com `env(safe-area-inset-bottom)`.
- Enquanto a gaveta estiver aberta, coloque `.gaveta-aberta` no `<html>` (trava `html, body { overflow: hidden }`) e tire ao fechar.

## 13. Painel "Avisos"
Botão ao lado de "Ver código" em `.acoes-metodo`, abrindo **a mesma gaveta** em modo Avisos (esconda `#copiar`, o rodapé e o corpo de código; mostre o corpo de avisos).

**Tokens** (ver `contrastes.md`, seção Avisos):
| Token | Escuro | Claro |
|---|---|---|
| `--cor-apoio-vantagem` | `#86D3C8` (7,06 sobre o fundo) | `#1F6359` (6,14) |
| `--cor-apoio-vantagem-fundo` | `#173A43` (texto 9,28) | `#E3F3F0` (texto 13,70) |
| `--cor-apoio-vantagem-borda` | `#4E9A90` (4,07 vs fundo-2) | `#4E8F86` (3,20) |
| `--cor-apoio-problema` | `#F2C27B` (7,78) | `#8A4B00` (5,98) |
| `--cor-apoio-problema-fundo` | `#3A3122` (texto 9,74) | `#FBEFD9` (texto 13,78) |
| `--cor-apoio-problema-borda` | `#B08A4F` (4,23) | `#B07A2E` (3,16) |
| `--cor-selo` / `--cor-sobre-selo` | `#F2C27B` / `#192338` (9,54) | `#8A4B00` / `#FFFFFF` (6,80) |
| `--dur-pulso` | 1800ms (0 com reduced-motion) | — |

**Classes:** `.aviso-resumo` (+ `.aviso-metrica`, `__rotulo`, `__valor`), `.aviso-secao` + `--vantagens` (fundo verde-água discreto, marcador ✓), `--desvantagens` (neutra, marcador –), `--problemas` (borda e título âmbar, ícone ⚠), `.aviso-secao__titulo`, `.aviso-lista`, `.aviso-item` (no `<details>`; `<summary>` com marcador ▸ que gira, alvo ≥ 44px e foco de 3px), `.aviso-item__corpo`, `.aviso-item__quando`, `.aviso-item__fazer`, `.aviso-item__selo`. **`.aviso-item.is-ativo`**: fundo âmbar, **barra lateral de 6px**, rótulo "● No cálculo atual" visível e `open` (não depende só de cor).

**Selo `.btn-selo`** (dentro de `.btn.btn--com-selo`): pílula âmbar no canto com o **número** de problemas e anel na cor do fundo. É `aria-hidden`; o texto acessível fica no botão: `aria-label="Avisos (1 problema no cálculo atual)"` (sem problemas: remova o selo e use `aria-label="Avisos"`). Para anunciar mudanças, atualize uma região `aria-live="polite"` existente (ex.: `.descricao-passo`) com "Atenção: sem troca de sinal em [a, b]". O pulso (`selo-pulso`, anel que expande e some) roda **3 vezes** e para; com `prefers-reduced-motion` não anima.

**Ícones** (20×20, `stroke="currentColor"`, `aria-hidden="true"`): `icones/avisos.svg` (triângulo de alerta) e `icones/codigo.svg` (`</>`). Use inline com `class="icone"`.

## 14. Vetor b do Gauss
Verde-lima derivado da paleta (matiz ~80°), distinto de tangente/ponto médio (lilás), pivô (âmbar), cor do Gauss (verde-água) e linha operada (azul).
| Token | Escuro | Claro | AA |
|---|---|---|---|
| `--canvas-vetor-b` | `#B5D67A` | `#4A6B12` | sobre o fundo 7,37 / 5,50; sobre canvas 8,25 / 6,17 |
| `--canvas-vetor-b-fundo` | `#2F3A1E` | `#EEF5DC` | texto 9,16 / 13,99 |
| `--canvas-vetor-b-borda` | `#8AA65A` | `#6E8A34` | vs canvas 4,93 / 3,93; vs fundo 4,40 / 3,50 |

Usos: divisória da matriz aumentada, rótulo "b", coluna b na grade (`.matriz__cel--b`) e no mapa de cores. A coluna b nunca depende só da cor: há divisória, rótulo "b" e vão.

## 15. Pivoteamento (Gauss): selos de troca, comparação e deslize
**Selo `.selo-troca`**: glifo em círculo + texto + detalhe mono. Nunca depende só de cor, porque a forma da borda também muda: obrigatória = sólida de 2px, recomendada = sólida de 1,5px, clássica = tracejada.
| Variante | Glifo | Texto (escuro / claro) | Fundo | Borda | AA texto | Borda vs card |
|---|---|---|---|---|---|---|
| `--obrigatoria` (pivô zero) | `!` | `#F2C27B` / `#8A4B00` | `#3A3122` / `#FBEFD9` | `#F2C27B` / `#B07A2E` | 7,78 / 5,98 | 5,46 / 3,70 |
| `--recomendada` (pivô pequeno) | `i` | `#8FB3E2` / `#31487A` | `#22365C` / `#E6EDF8` | `#8FB3E2` / `#5A77AE` | 5,55 / 7,63 | 4,15 / 4,48 |
| `--classica` (parcial: maior \|a\|) | `⇅` | `#D9E1F1` / `#192338` | `#1E2E4F` / `#EEF2F9` | `#8FA3C7` / `#6B7FA6` | 10,26 / 13,97 | 3,52 / 4,03 |
Tokens: `--cor-troca-{obrigatoria|recomendada|classica}` + `-fundo` + `-borda`.

**Caixa de comparação (modo Nunca)**: `--cor-borda-comparacao` (`#8FA3C7` / `#6B7FA6`: 3,52 / 4,03 vs card; 5,28 / 3,43 vs fundo-2) e `--cor-fundo-comparacao` opcional (`#273A63` / `#F4F6FB`; texto 8,54 / 14,51). Classe `.caixa-comparacao` (`<section>` + `h3` + `dl`); `.caixa-comparacao--referencia` tem borda tracejada para "com pivoteamento". `dt` vai **acima** de `dd`, porque em 390 o rótulo longo não divide a linha com o valor.

**Deslize da troca**: `--dur-troca-linha: 400ms`, `--ease-troca: cubic-bezier(.2,.8,.2,1)`; ambos vão a `0ms` / `linear` com reduced-motion. Keyframe `troca-linha` em `.mv-linha.trocando` (o JS define `--desloc`). As células da linha **nunca** ficam invisíveis durante o deslize.

**Rede de segurança**: `:where([hidden]) { display: none !important; }` no componentes.css. Antes, `.grafico__legenda`, `.btn`, `.badge` etc. tinham `display` que vencia o `[hidden]` do navegador; essa foi a causa da pílula solta.
