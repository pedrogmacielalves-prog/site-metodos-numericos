# Contrastes WCAG medidos (gerado por contraste.py)

AA: texto normal ≥ 4,5; gráficos/UI ≥ 3,0. Regra de uso: texto colorido (acento, método, sintaxe) só sobre os fundos #192338/#1E2E4F (escuro) ou qualquer fundo claro — todos ≥ 4,5. Sobre a superfície YInMn #31487A use apenas texto/texto_suave (≥ 5,0); cores com valor < 4,5 nessa coluna são permitidas ali só como elemento gráfico/UI (≥ 3,0, ex. bordas, marcadores). O painel de código e o canvas usam fundo #192338/#1E2E4F.

| Token | Escuro (padrão) | vs #192338 | vs #1E2E4F | vs #31487A | Claro | vs #D9E1F1 | vs #E8EDF7 | vs #FFFFFF |
|---|---|---|---|---|---|---|---|---|
| texto | #D9E1F1 | 11.94 | 10.26 | 6.84 | #192338 | 11.94 | 13.36 | 15.69 |
| texto_suave | #B4C3DE | 8.81 | 7.57 | 5.05 | #3A4A6B | 6.74 | 7.54 | 8.85 |
| primaria | #8FB3E2 | 7.26 | 6.23 | 4.15 | #31487A | 6.84 | 7.65 | 8.98 |
| bisseccao | #8FB3E2 | 7.26 | 6.23 | 4.15 | #31487A | 6.84 | 7.65 | 8.98 |
| newton | #C3B5F2 | 8.37 | 7.19 | 4.79 | #5B3FA8 | 5.88 | 6.57 | 7.72 |
| gauss | #86D3C8 | 9.09 | 7.80 | 5.20 | #1F6359 | 5.35 | 5.99 | 7.03 |
| funcao | #D9E1F1 | 11.94 | 10.26 | 6.84 | #192338 | 11.94 | 13.36 | 15.69 |
| eixo | #8FA3C7 | 6.15 | 5.28 | 3.52 | #4A5C80 | 5.10 | 5.71 | 6.70 |
| intervalo_borda | #8FB3E2 | 7.26 | 6.23 | 4.15 | #31487A | 6.84 | 7.65 | 8.98 |
| ponto_medio | #C3B5F2 | 8.37 | 7.19 | 4.79 | #5B3FA8 | 5.88 | 6.57 | 7.72 |
| tangente | #C3B5F2 | 8.37 | 7.19 | 4.79 | #5B3FA8 | 5.88 | 6.57 | 7.72 |
| raiz | #F2C27B | 9.54 | 8.20 | 5.46 | #8A4B00 | 5.18 | 5.79 | 6.80 |
| pivo | #F2C27B | 9.54 | 8.20 | 5.46 | #8A4B00 | 5.18 | 5.79 | 6.80 |
| linha_operada_borda | #8FB3E2 | 7.26 | 6.23 | 4.15 | #31487A | 6.84 | 7.65 | 8.98 |
| erro | #F4A6B4 | 8.19 | 7.03 | 4.69 | #A3263F | 5.50 | 6.15 | 7.23 |
| sucesso | #86D3C8 | 9.09 | 7.80 | 5.20 | #1F6359 | 5.35 | 5.99 | 7.03 |
| aviso | #F2C27B | 9.54 | 8.20 | 5.46 | #8A4B00 | 5.18 | 5.79 | 6.80 |
| tok_kw | #B79CF5 | 6.79 | 5.83 | 3.89 | #5B3FA8 | 5.88 | 6.57 | 7.72 |
| tok_str | #86D3C8 | 9.09 | 7.80 | 5.20 | #1F6359 | 5.35 | 5.99 | 7.03 |
| tok_num | #F2C27B | 9.54 | 8.20 | 5.46 | #8A4B00 | 5.18 | 5.79 | 6.80 |
| tok_com | #9AAACB | 6.71 | 5.76 | 3.84 | #4F5E7A | 4.97 | 5.56 | 6.53 |
| tok_fn | #7FB0F0 | 7.00 | 6.01 | 4.01 | #31487A | 6.84 | 7.65 | 8.98 |

| Par especial | Razão |
|---|---|
| texto botão primário escuro #192338 sobre #8FB3E2 | 7.26 |
| texto botão primário claro #FFFFFF sobre #31487A | 8.98 |
| borda de UI escura #5C74A8 vs #192338 | 3.38 |
| borda de UI clara #6B7DA3 vs #FFFFFF | 4.13 |
| texto sobre pivô escuro #D9E1F1 sobre #5A4526 | 6.91 |
| texto sobre pivô claro #192338 sobre #F6E2BE | 12.35 |
| texto sobre linha ativa escura #D9E1F1 sobre #2B4170 | 7.64 |

## Avisos (vantagens / problemas) — pares reais de uso

| Par | Escuro | Razão | Claro | Razão | Mínimo |
|---|---|---|---|---|---|
| --cor-apoio-vantagem sobre -fundo | #86D3C8 / #173A43 | 7.06 | #1F6359 / #E3F3F0 | 6.14 | 4.5 |
| texto sobre --cor-apoio-vantagem-fundo | #D9E1F1 / #173A43 | 9.28 | #192338 / #E3F3F0 | 13.70 | 4.5 |
| texto suave sobre --cor-apoio-vantagem-fundo | #B4C3DE / #173A43 | 6.85 | #3A4A6B / #E3F3F0 | 7.73 | 4.5 |
| --cor-apoio-vantagem-borda vs fundo-2 | #4E9A90 / #1E2E4F | 4.07 | #4E8F86 / #E8EDF7 | 3.20 | 3 |
| --cor-apoio-problema sobre -fundo | #F2C27B / #3A3122 | 7.78 | #8A4B00 / #FBEFD9 | 5.98 | 4.5 |
| texto sobre --cor-apoio-problema-fundo | #D9E1F1 / #3A3122 | 9.74 | #192338 / #FBEFD9 | 13.78 | 4.5 |
| texto suave sobre --cor-apoio-problema-fundo | #B4C3DE / #3A3122 | 7.19 | #3A4A6B / #FBEFD9 | 7.78 | 4.5 |
| --cor-apoio-problema-borda vs fundo-2 | #B08A4F / #1E2E4F | 4.23 | #B07A2E / #E8EDF7 | 3.16 | 3 |
| --cor-apoio-problema (barra is-ativo) vs fundo-2 | #F2C27B / #1E2E4F | 8.20 | #8A4B00 / #E8EDF7 | 5.79 | 3 |
| selo: --cor-sobre-selo sobre --cor-selo | #192338 / #F2C27B | 9.54 | #FFFFFF / #8A4B00 | 6.80 | 4.5 |
| selo vs superfície (card) | #F2C27B / #31487A | 5.46 | #8A4B00 / #FFFFFF | 6.80 | 3 |

## Vetor b do Gauss (27/10/2026)
| Par | Escuro | Razão | Claro | Razão | Mín. |
|---|---|---|---|---|---|
| --canvas-vetor-b sobre --canvas-vetor-b-fundo | #B5D67A / #2F3A1E | 7.37 | #4A6B12 / #EEF5DC | 5.50 | 4.5 |
| --canvas-vetor-b sobre --canvas-fundo | #B5D67A / #1E2E4F | 8.25 | #4A6B12 / #FFFFFF | 6.17 | 4.5 |
| --cor-texto sobre --canvas-vetor-b-fundo | #D9E1F1 / #2F3A1E | 9.16 | #192338 / #EEF5DC | 13.99 | 4.5 |
| --canvas-vetor-b-borda vs --canvas-fundo | #8AA65A / #1E2E4F | 4.93 | #6E8A34 / #FFFFFF | 3.93 | 3 |
| --canvas-vetor-b-borda vs --canvas-vetor-b-fundo | #8AA65A / #2F3A1E | 4.40 | #6E8A34 / #EEF5DC | 3.50 | 3 |

Matiz ~80° (lima): separa-se do verde-água do Gauss (~172°), do lilás da tangente, do âmbar do pivô e do azul da linha operada.

## Pivoteamento (27/10/2026)
| Par | Escuro | Razão | Claro | Razão | Mín. |
|---|---|---|---|---|---|
| selo obrigatoria: texto sobre fundo | #F2C27B / #3A3122 | 7.78 | #8A4B00 / #FBEFD9 | 5.98 | 4.5 |
| selo obrigatoria: borda vs card (superfície) | #F2C27B / #31487A | 5.46 | #B07A2E / #FFFFFF | 3.70 | 3 |
| selo obrigatoria: borda vs fundo-2 | #F2C27B / #1E2E4F | 8.20 | #B07A2E / #E8EDF7 | 3.16 | 3 |
| selo obrigatoria: glifo (fundo sobre cor) | #192338 / #F2C27B | 9.54 | #FFFFFF / #8A4B00 | 6.80 | 3 |
| selo recomendada: texto sobre fundo | #8FB3E2 / #22365C | 5.55 | #31487A / #E6EDF8 | 7.63 | 4.5 |
| selo recomendada: borda vs card (superfície) | #8FB3E2 / #31487A | 4.15 | #5A77AE / #FFFFFF | 4.48 | 3 |
| selo recomendada: borda vs fundo-2 | #8FB3E2 / #1E2E4F | 6.23 | #5A77AE / #E8EDF7 | 3.82 | 3 |
| selo recomendada: glifo (fundo sobre cor) | #192338 / #8FB3E2 | 7.26 | #FFFFFF / #31487A | 8.98 | 3 |
| selo classica: texto sobre fundo | #D9E1F1 / #1E2E4F | 10.26 | #192338 / #EEF2F9 | 13.97 | 4.5 |
| selo classica: borda vs card (superfície) | #8FA3C7 / #31487A | 3.52 | #6B7FA6 / #FFFFFF | 4.03 | 3 |
| selo classica: borda vs fundo-2 | #8FA3C7 / #1E2E4F | 5.28 | #6B7FA6 / #E8EDF7 | 3.43 | 3 |
| selo classica: glifo (fundo sobre cor) | #192338 / #D9E1F1 | 11.94 | #FFFFFF / #192338 | 15.69 | 3 |
| --cor-borda-comparacao vs card | #8FA3C7 / #31487A | 3.52 | #6B7FA6 / #FFFFFF | 4.03 | 3 |
| --cor-borda-comparacao vs fundo-2 | #8FA3C7 / #1E2E4F | 5.28 | #6B7FA6 / #E8EDF7 | 3.43 | 3 |
| --cor-borda-comparacao vs fundo da página | #8FA3C7 / #192338 | 6.15 | #6B7FA6 / #D9E1F1 | 3.07 | 3 |
| --cor-borda-comparacao vs --cor-fundo-comparacao | #8FA3C7 / #273A63 | 4.40 | #6B7FA6 / #F4F6FB | 3.73 | 3 |
| texto sobre --cor-fundo-comparacao | #D9E1F1 / #273A63 | 8.54 | #192338 / #F4F6FB | 14.51 | 4.5 |
| texto suave sobre --cor-fundo-comparacao | #B4C3DE / #273A63 | 6.31 | #3A4A6B / #F4F6FB | 8.19 | 4.5 |
