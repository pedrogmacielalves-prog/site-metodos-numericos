# Integração do design com o app (`index.html` + `css/estilo.css`)

Fonte única: **`design/tokens.css`** (todas as variáveis) e **`design/componentes.css`** (componentes). `css/estilo.css` fica **só com layout das telas**. Sem `@import` (o site roda em `file://`).

## 1. Ordem dos `<link>` no `<head>` do index.html
```html
<!-- opcional, antes de tudo: fontes -->
<!-- <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap"> -->
<link rel="stylesheet" href="design/tokens.css">
<link rel="stylesheet" href="design/componentes.css">
<link rel="stylesheet" href="css/estilo.css">
```
Tema: escuro é o padrão. Para claro: `document.documentElement.dataset.theme = 'light'` (remover o atributo volta ao escuro). Para evitar flash, aplique o tema salvo num `<script>` inline no `<head>` (ver `demo.html`).

## 2. O que REMOVER de `css/estilo.css`
1. **Todo o bloco `:root { … }`** (tokens provisórios): `--cor-fundo, --cor-superficie, --cor-borda, --cor-texto, --cor-texto-suave, --cor-primaria, --cor-primaria-suave, --cor-destaque, --cor-sucesso, --cor-erro, --cor-positivo, --cor-negativo, --cor-intervalo, --cor-tangente, --cor-funcao, --cor-eixo, --cor-grade, --cor-pivo, --cor-linha-alvo, --cor-linha-pivo, --fonte-base, --fonte-mono, --tam-fonte, --raio, --raio-pequeno, --esp-1..5, --sombra, --duracao-animacao, --intervalo-passo`. (`--duracao-animacao` e `--intervalo-passo` já existem em tokens.css com os mesmos valores — o JS continua funcionando.)
2. `* { box-sizing }` e a regra `body { … }` (já em componentes.css). `h2 {…}` também.
3. Cores fixas: `#fff` em `.aba[aria-selected]`, `.botao`, `.player button.tocar` → `var(--cor-sobre-primaria)`; os `#fff5f5/#ffc9c9/#ebfbee/#b2f2bb/#fff9db/#8a6d00/#ffec99` de `.mensagem.*` → remover e usar as classes `.toast toast--erro|sucesso|aviso` (ou mapear: fundo `var(--cor-erro-fundo)`, cor `var(--cor-erro)` etc.).

## 3. Mapa de renomeação (tokens provisórios → oficiais)
| estilo.css / JS atual | Usar |
|---|---|
| `--cor-primaria-suave` | `--cor-primaria-fundo` |
| `--cor-destaque` | `--cor-acento` (canvas: `--canvas-ponto-medio` ou `--canvas-raiz`) |
| `--cor-funcao` | `--canvas-funcao` |
| `--cor-eixo` | `--canvas-eixo` |
| `--cor-grade` | `--canvas-grade` |
| `--cor-intervalo` (preenchimento rgba) | `--canvas-intervalo-preenchimento` (borda: `--canvas-intervalo-borda`) |
| `--cor-tangente` | `--canvas-tangente` |
| `--cor-pivo` | `--canvas-pivo-fundo` (fundo) / `--canvas-pivo` (borda) |
| `--cor-linha-alvo` | `--canvas-linha-operada` (+ borda `--canvas-linha-operada-borda`) |
| `--cor-linha-pivo` | `--cor-pivo-fundo` |
| `--cor-positivo` / `--cor-negativo` | `--cor-sucesso` / `--cor-erro` (sempre com sinal (+)/(−) no texto, já existe) |
| `--fonte-base`, `--tam-fonte` | `--fonte-texto`, `--fs-base` |
| `--raio`, `--raio-pequeno`, `--sombra` | `--raio-md`, `--raio-sm`, `--sombra-1` |
| `--esp-5` (24px) | `--esp-5` (24px — igual) |

JS a ajustar (só nomes de variáveis): `js/grafico.js` (`--cor-grade`, `--cor-eixo`, `--cor-funcao`, `--cor-texto-suave`→`--canvas-rotulo`), `js/visual/bisseccao.js`, `js/visual/newton.js`, legendas inline do `index.html`.

## 4. Classes: substituir por componentes (e apagar do estilo.css)
| estilo.css | componentes.css |
|---|---|
| `.cartao` | `.card` (`.card--metodo .metodo-*`) |
| `.botao`, `.botao.secundario` | `.btn.btn--primario`, `.btn.btn--secundario` |
| `form input[...]`, `select` | `.input` / `.input.input--num`, rótulos `.campo__rotulo` |
| `.mensagem.erro|ok|aviso` | `.toast.toast--erro|sucesso|aviso` |
| `table.iteracoes`, `tr.atual` | `.tabela-wrap > table.tabela`, `tr.atual`, `tr.final` |
| `.legenda`, `.legenda i` | `.grafico__legenda`, `.legenda__item`, `.legenda__amostra` (bloco do painel SVG agora é `.painel-grafico`) |
| `.matriz-vis .cel.pivo / .zerado` | `.matriz__cel--pivo / --zerada / --alterada` (ou manter estrutura e trocar só cores pelos tokens) |
| `.aba[aria-selected]` | pode manter em estilo.css como layout, mas com cores dos tokens |
| `.player button` | `.btn.btn--secundario.btn--icone`; play = `.btn--primario` |
| `.player .contador` | `.contador` |

**Fica em estilo.css (layout):** `header` padding, `.abas` (flex), `main` largura, `.painel[hidden]`, `.layout` (grid 300px 1fr + @media 900px), `.coluna`, `.linha-campos`, `.acoes`, `.player` (flex), `canvas.grafico` (altura 380px; fundo `var(--canvas-fundo)`), `.tabela-rolagem` (max-height), `.entrada-matriz` (grid), `.matriz-vis` layout, `@keyframes pulsar` (usar `var(--canvas-pivo-fundo)`), `.solucao` layout.

## 5. Tokens de canvas (estáveis, hex/rgba simples, nos dois temas)
| Token | Escuro | Claro |
|---|---|---|
| `--canvas-fundo` | `#1E2E4F` | `#FFFFFF` |
| `--canvas-funcao` | `#D9E1F1` | `#192338` |
| `--canvas-eixo` | `#8FA3C7` | `#4A5C80` |
| `--canvas-grade` | `#2A3B5E` | `#D3DBEA` |
| `--canvas-rotulo` | `#B4C3DE` | `#3A4A6B` |
| `--canvas-intervalo-preenchimento` | `rgba(143, 179, 226, 0.16)` | `rgba(49, 72, 122, 0.12)` |
| `--canvas-intervalo-borda` | `#8FB3E2` | `#31487A` |
| `--canvas-ponto-medio` | `#C3B5F2` | `#5B3FA8` |
| `--canvas-tangente` | `#C3B5F2` | `#5B3FA8` |
| `--canvas-raiz` | `#F2C27B` | `#8A4B00` |
| `--canvas-pivo` / `--canvas-pivo-fundo` | `#F2C27B` / `#5A4526` | `#8A4B00` / `#F6E2BE` |
| `--canvas-linha-operada` / `-borda` | `rgba(143, 179, 226, 0.22)` / `#8FB3E2` | `rgba(49, 72, 122, 0.12)` / `#31487A` |
| `--canvas-erro` | `#F4A6B4` | `#A3263F` |
| `--canvas-vetor-b` / `-fundo` / `-borda` | `#B5D67A` / `#2F3A1E` / `#8AA65A` | `#4A6B12` / `#EEF5DC` / `#6E8A34` |

Leitura em JS (redesenhar ao trocar tema):
```js
function lerCoresCanvas() {
  const s = getComputedStyle(document.documentElement);
  const v = (n) => s.getPropertyValue(n).trim();
  return {
    fundo: v('--canvas-fundo'), funcao: v('--canvas-funcao'), eixo: v('--canvas-eixo'),
    grade: v('--canvas-grade'), rotulo: v('--canvas-rotulo'),
    intervaloFundo: v('--canvas-intervalo-preenchimento'), intervaloBorda: v('--canvas-intervalo-borda'),
    pontoMedio: v('--canvas-ponto-medio'), tangente: v('--canvas-tangente'), raiz: v('--canvas-raiz'),
    pivo: v('--canvas-pivo'), pivoFundo: v('--canvas-pivo-fundo'),
    linhaOperada: v('--canvas-linha-operada'), linhaOperadaBorda: v('--canvas-linha-operada-borda'),
    erro: v('--canvas-erro'),
  };
}
let cores = lerCoresCanvas();
new MutationObserver(() => { cores = lerCoresCanvas(); redesenhar(); })
  .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
// Movimento: const dur = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dur-passo')) || 0;
```

## 6. Painel "Ver código"
Copie a marcação de `<aside id="gaveta-codigo">`, o overlay e o script do final de `demo.html` (foco preso, Esc, Copiar com `aria-live`). Classes de sintaxe: `.tok-kw .tok-str .tok-num .tok-com .tok-fn` (+ opcionais `.tok-op .tok-var`; aliases `.hljs-*`). Linha em execução: `span.ln.linha-ativa` + `aria-current="step"` — mova a classe a cada passo do player.

## 7. Anticolisão (v2 — 27/10/2026)
O design foi ajustado para não colidir com os nomes do app; **nada precisa mudar no index.html/JS** — `.mv-linha`, `.grafico-canvas`, `.matriz-vis`, `.player .contador` continuam funcionando. Detalhes em GUIA-DE-ESTILO.md §11.
| Antes (design) | Agora |
|---|---|
| `body`, `h1–h4`, `p`, `a`, `*`, `:focus-visible` | mesmas regras dentro de `:where()` (especificidade 0) |
| `.container .grid .col-N .pilha .linha .cabecalho .marca .secao .num .mono .formula .slider` | `.ds-…` (prefixo) |
| `.grafico`, `.grafico__barra`, `.grafico__titulo` | `.painel-grafico`, `.painel-grafico__barra`, `.painel-grafico__titulo` (`.grafico__legenda` mantida) |
| `.matriz` | `.matriz-aum` (`.matriz__cel*` mantidos) |
| `.codigo …` | `pre.codigo …` |
| `.contador` | `.controles-passo .contador`, `.player .contador` |
Agora `.linha` e `.grafico` estão livres de novo no app, se ele quiser voltar a usá-los.

## 8. Gaveta em tela cheia no mobile + painel Avisos (27/10/2026)
**Substitui o item 6 da revisão** (não mova mais a gaveta para dentro do card). Em `js/visual/codigo.js`:
- `abrir()`: mantenha o `<aside>` como filho do `<body>`, `aria-modal="true"` sempre, prenda o foco em qualquer largura e faça `document.documentElement.classList.add('gaveta-aberta')`.
- `fechar()`: `classList.remove('gaveta-aberta')` e devolva o foco. O CSS (componentes.css) cuida de tela cheia, `100dvh`, topo sticky, alvo de 44px, safe-area, overscroll e animação.
- O foco preso deve considerar `button, summary, [tabindex="0"]` visíveis.

Marcação esperada (repita para `newton` e `gauss`):
```html
<div class="acoes-metodo">
  <button type="button" class="btn btn--secundario" id="codigo-bisseccao" data-modo="codigo"
          aria-haspopup="dialog" aria-controls="gaveta-codigo" aria-expanded="false">
    <svg class="icone" …conteúdo de design/icones/codigo.svg…></svg> Ver código
  </button>
  <button type="button" class="btn btn--secundario btn--com-selo" id="avisos-bisseccao" data-modo="avisos"
          aria-haspopup="dialog" aria-controls="gaveta-codigo" aria-expanded="false"
          aria-label="Avisos (1 problema no cálculo atual)">
    <svg class="icone" …conteúdo de design/icones/avisos.svg…></svg> Avisos
    <span class="btn-selo" aria-hidden="true">1</span>   <!-- só quando houver problema -->
  </button>
</div>
```
Corpo de avisos (segundo `.gaveta-codigo__corpo`, alternado com o de código via `hidden`; no modo avisos esconda também `#copiar-codigo` e o rodapé):
```html
<div class="gaveta-codigo__corpo" id="corpo-avisos" hidden>
  <div class="avisos">
    <div class="aviso-resumo" role="group" aria-label="Resumo do método">
      <span class="aviso-metrica"><span class="aviso-metrica__rotulo">Convergência</span><span class="aviso-metrica__valor">Linear · erro ÷ 2 por passo</span></span>
      <span class="aviso-metrica"><span class="aviso-metrica__rotulo">Custo por iteração</span><span class="aviso-metrica__valor">1 avaliação de f</span></span>
    </div>
    <section class="aviso-secao aviso-secao--vantagens" aria-labelledby="av-v-bis">
      <h3 class="aviso-secao__titulo" id="av-v-bis"><span aria-hidden="true">✓</span> Vantagens</h3>
      <ul><li>…</li></ul>
    </section>
    <section class="aviso-secao aviso-secao--desvantagens" aria-labelledby="av-d-bis">
      <h3 class="aviso-secao__titulo" id="av-d-bis"><span aria-hidden="true">–</span> Desvantagens</h3>
      <ul><li>…</li></ul>
    </section>
    <section class="aviso-secao aviso-secao--problemas" aria-labelledby="av-p-bis">
      <h3 class="aviso-secao__titulo" id="av-p-bis"><span aria-hidden="true">⚠</span> Possíveis problemas</h3>
      <div class="aviso-lista">
        <details class="aviso-item is-ativo" open data-problema="sem-troca-de-sinal">
          <summary><span class="aviso-item__selo"><span aria-hidden="true">●</span> No cálculo atual</span>Sem troca de sinal em [a, b]</summary>
          <div class="aviso-item__corpo">
            <p class="aviso-item__quando"><strong>Quando acontece</strong>…</p>
            <p class="aviso-item__fazer"><strong>O que fazer</strong>…</p>
          </div>
        </details>
      </div>
    </section>
  </div>
</div>
```
Lógica: ao calcular, marque com `is-ativo` + `open` o(s) `details[data-problema]` detectado(s). Atualize o número do `.btn-selo` e o `aria-label` do botão (ou remova o selo e volte para `aria-label="Avisos"` quando não houver problema). Ao abrir em modo avisos, role até o primeiro `.is-ativo` e dê foco no `summary` dele. Veja a implementação de referência no script final do `design/demo.html` (`?gaveta=avisos`).

## 9. Vetor b do Gauss
Use `--canvas-vetor-b*` em: divisória da matriz aumentada (`-borda`), rótulo "b" (`--canvas-vetor-b`), coluna b na grade (`.cel.b` → fundo `-fundo`, texto `--canvas-vetor-b`) e no mapa de cores (em `gauss-mapa.js`, troque `cBpos = --canvas-tangente` / `cBneg = --canvas-ponto-medio` por `--canvas-vetor-b` com intensidade, e o sinal pela forma/rótulo; a divisória em `--canvas-vetor-b-borda` em vez de `--canvas-eixo`). Em HTML: `.matriz__cel--b`, `.matriz__rotulo--b`.

## 10. Pivoteamento, [hidden] e rótulos sticky (revisão 3 — 27/10/2026)
**[hidden]**: o componentes.css agora tem `:where([hidden]){display:none!important}`. As regras `…[hidden]{display:none}` do estilo.css podem ser apagadas (não é obrigatório).

**Selo de troca** (substitui `.selo-troca` e `.selo-troca--obrigatoria` do estilo.css l.157–158, que podem ser apagados):
```html
<span class="selo-troca selo-troca--obrigatoria" role="status">
  <span class="selo-troca__glifo" aria-hidden="true"><span>!</span></span>
  <span class="selo-troca__texto">Troca obrigatória: pivô zero <span class="selo-troca__detalhe">L1 ↔ L2</span></span>
</span>
<!-- recomendada: glifo "i", texto "Troca recomendada: pivô pequeno", detalhe "|0,0001| ≪ |3|" -->
<!-- classica:    glifo "⇅", texto "Pivoteamento parcial: maior |a| da coluna", detalhe "L3 ↔ L1" -->
```
Use `role="status"` só no contêiner que é trocado a cada passo, para não haver anúncio duplicado com `.descricao-passo`.

**Comparação do modo Nunca** (troque `.comparacao__col` por `.caixa-comparacao`; mantenha `.comparacao__grade` para o layout):
```html
<div class="comparacao__grade">
  <section class="caixa-comparacao" aria-labelledby="cmp-sem"><h3 id="cmp-sem">Sem pivoteamento (este cálculo)</h3>
    <dl><dt>Erro relativo à solução pivoteada</dt><dd>0,707107</dd><dt>Resíduo relativo ‖Ax − b‖ / ‖b‖</dt><dd>0,447214</dd><dt>x</dt><dd>x₁ = 0; x₂ = 1</dd></dl></section>
  <section class="caixa-comparacao caixa-comparacao--referencia" aria-labelledby="cmp-com">…</section>
</div>
```
Apague `.comparacao__col dl { grid-template-columns: 1fr auto }`: com `dt` acima de `dd` não sobra quebra feia em 390.

**Deslize**: `.matriz-vis .mv-linha.trocando { animation: troca-linha var(--dur-troca-linha) var(--ease-troca); }` já está no componentes.css. Apague `pulsar` e `.mv-linha.trocando` do estilo.css (l.63–64 e l.69).

**Rótulos sticky L1…Ln** (substitui a regra da l.173 do estilo.css; prova em `design/prova-sticky.html`):
```css
.matriz-vis .mv-linha > .rotulo:first-child,
.matriz-vis .mv-cabeca > span:first-child {
  position: sticky; left: 0; z-index: 2; align-self: stretch;
  display: flex; align-items: center; justify-content: center;
  margin: -3px 0 -3px -3px; padding-left: 3px;          /* cobre padding 2px + borda 1px da linha */
  background: var(--cor-superficie);
  box-shadow: 0 -4px 0 var(--cor-superficie), 0 4px 0 var(--cor-superficie), /* cobre o gap de 4px entre linhas */
              1px 0 0 var(--cor-borda-forte);                                 /* fio que separa rótulo e células */
}
.matriz-vis .mv-linha.alvo > .rotulo:first-child {
  background: linear-gradient(var(--canvas-linha-operada), var(--canvas-linha-operada)), var(--cor-superficie);
}
```
