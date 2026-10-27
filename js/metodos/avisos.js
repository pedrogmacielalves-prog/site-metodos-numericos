/* Conteúdo do botão "Avisos" de cada método (dados puros, sem HTML).
   Formato documentado em docs/contrato-etapas.md, seção 12.
   'codigos' usa os mesmos códigos de executar.*: codigoErro e codigosAviso.
   'mensagem' (opcional) é o texto que o site mostra de fato, copiado de uma execução real. */
(function (g) {
  'use strict';
  const Metodos = g.Metodos = g.Metodos || {};
  Metodos.textos = Metodos.textos || {};

  Metodos.textos.avisos = {
    bisseccao: {
      vantagens: [
        'Convergência garantida se f é contínua em [a, b] e f(a)·f(b) < 0.',
        'Usa só valores de f: não precisa da derivada.',
        'Número de iterações previsível: cerca de log2((b − a)/tol).',
        'O erro tem cota conhecida a cada passo: (b − a)/2^k.',
      ],
      desvantagens: [
        'Convergência lenta e linear: o erro só cai pela metade a cada iteração (razão 1/2).',
        'Exige um intervalo inicial com troca de sinal.',
        'Não encontra raízes de multiplicidade par, como (x − 1)^2, pois f não troca de sinal.',
        'Encontra só uma raiz por intervalo, mesmo que existam várias.',
      ],
      problemas: [
        {
          id: 'sem-troca-sinal',
          titulo: 'Sem troca de sinal',
          quando: 'f(a) e f(b) têm o mesmo sinal, por exemplo (x − 1)^2 em [0, 3].',
          solucao: 'Esboce o gráfico e escolha [a, b] em que f(a) e f(b) tenham sinais opostos.',
          codigos: ['SEM_TROCA_DE_SINAL'],
          mensagem: 'f(a)·f(b) > 0: f(0) = 1 e f(3) = 4 têm o mesmo sinal. Escolha um intervalo onde f troque de sinal.',
        },
        {
          id: 'descontinuidade',
          titulo: 'Descontinuidade (polo) no intervalo',
          quando: 'f troca de sinal num polo sem ter raiz, como x/2 − tan(x) em [1, 2], que contém π/2.',
          solucao: 'Escolha um intervalo em que f seja contínua; o site recusa o resultado se |f(c)| crescer.',
          codigos: ['DESCONTINUIDADE'],
          mensagem: 'Provável descontinuidade, não raiz: o intervalo encolheu perto de x = 1,57068, mas |f(c)| cresceu (f(c) = −8501,47). f deve ter um polo ali (troca de sinal sem raiz). Escolha um intervalo onde f seja contínua.',
        },
        {
          id: 'funcao-nao-definida',
          titulo: 'f não definida no ponto médio',
          quando: 'O ponto médio cai fora do domínio de f, como 1/x em [−1, 1], com c = 0.',
          solucao: 'Mude o intervalo para que o ponto médio não caia onde f não existe.',
          codigos: ['FUNCAO_NAO_DEFINIDA'],
          mensagem: 'f(c) não é finito em c = 0 (função não definida ali).',
        },
        {
          id: 'criterio-parada',
          titulo: 'Critério de parada: tol × ε',
          quando: 'Absoluto (tol, unidade de x) falha com x grande; relativo (ε = |Δc|/|c|, adimensional) falha se a raiz é 0 (|Δc|/|c| não cai; x³: 0,5).',
          solucao: 'Padrão: relativo. Se |c| < 1,000e−12, o site usa |Δc| < ε e avisa. Raiz em 0: prefira o absoluto.',
          codigos: ['CRITERIO_RELATIVO_PERTO_DE_ZERO'],
        },
        {
          id: 'max-iteracoes',
          titulo: 'Máximo de iterações atingido',
          quando: 'A tolerância exige mais iterações que o limite, cerca de log2((b − a)/tol).',
          solucao: 'Aumente o número máximo de iterações ou afrouxe a tolerância.',
          codigos: ['NAO_CONVERGIU'],
          mensagem: 'Máximo de iterações atingido sem atingir a tolerância.',
        },
        {
          id: 'raiz-no-extremo',
          titulo: 'Raiz exatamente num extremo',
          quando: 'f(a) = 0 ou f(b) = 0: o extremo já é a raiz e não há iterações.',
          solucao: 'Nada a corrigir; para ver a animação, amplie um pouco o intervalo.',
          codigos: ['RAIZ_NO_EXTREMO'],
          mensagem: 'O extremo x = 2 já é uma raiz exata; nenhuma iteração foi necessária.',
        },
        {
          id: 'extremos-trocados',
          titulo: 'Extremos invertidos',
          quando: 'Foi digitado a > b.',
          solucao: 'O site troca a e b automaticamente e avisa.',
          codigos: ['EXTREMOS_TROCADOS'],
          mensagem: 'Os extremos estavam invertidos; usei a = 0 e b = 3.',
        },
      ],
      resumo: {
        convergencia: 'Linear com razão 1/2: o erro cai pela metade a cada iteração.',
        custo: 'Uma avaliação de f por iteração; cerca de log2((b − a)/tol) iterações.',
      },
    },

    newton: {
      vantagens: [
        'Convergência quadrática perto de uma raiz simples: os dígitos corretos dobram a cada passo.',
        'Precisa só de um chute inicial x0, sem intervalo.',
        'O site calcula f\'(x) simbolicamente, sem trabalho extra.',
        'Também funciona para raízes que não trocam de sinal, como (x − 1)^2, embora mais devagar.',
      ],
      desvantagens: [
        'Precisa de f\'(x) e de duas avaliações por iteração: f e f\'.',
        'Muito sensível a x0: pode divergir, oscilar ou ir para outra raiz.',
        'Falha quando f\'(x) ≈ 0, pois a tangente fica horizontal.',
        'Em raiz de multiplicidade m vira linear, com razão (m − 1)/m.',
      ],
      problemas: [
        {
          id: 'derivada-zero',
          titulo: 'Derivada nula',
          quando: 'f\'(xk) ≈ 0: a tangente não cruza o eixo x, como x^3 − 1 com x0 = 0.',
          solucao: 'Escolha outro x0, longe dos pontos de máximo ou mínimo de f.',
          codigos: ['DERIVADA_ZERO'],
          mensagem: 'Derivada ≈ 0 em x = 0: a tangente é horizontal e não cruza o eixo x. Tente outro x0.',
        },
        {
          id: 'salto-grande',
          titulo: 'Salto por derivada pequena',
          quando: 'x^3 − 2x^2 − 3x + 10 com x0 = 1,9: f\'(1,9) = 0,23 leva x1 a −15,2; depois converge para −2.',
          solucao: 'Funciona, mas é instável: prefira x0 mais perto da raiz ou faça antes algumas iterações de bissecção.',
          codigos: ['SALTO_GRANDE'],
          mensagem: 'Salto grande na iteração 1: f\'(x0) = 0,23 é pequena, e x foi de 1,9 para x1 = −15,2261.',
        },
        {
          id: 'oscilacao',
          titulo: 'Oscilação (ciclo)',
          quando: 'Os iterados se repetem sem convergir, como x^3 − 2x + 2 com x0 = 0, que cicla entre 0 e 1.',
          solucao: 'Mude x0; um esboço do gráfico ajuda a escolher.',
          codigos: ['OSCILACAO'],
          mensagem: 'Os valores de x entraram em ciclo (oscilação) e não convergem. Tente outro x0.',
        },
        {
          id: 'divergencia',
          titulo: 'Divergência',
          quando: '|xk| cresce sem parar, como atan(x) com x0 = 1,5 (cada tangente joga x mais longe).',
          solucao: 'Use x0 mais perto da raiz (em atan, |x0| < 1,39).',
          codigos: ['DIVERGENCIA'],
          mensagem: 'O método divergiu (|x| ou o erro cresceu demais). Tente um x0 mais perto da raiz.',
        },
        {
          id: 'fora-do-dominio',
          titulo: 'Iterado fora do domínio',
          quando: 'Um passo sai do domínio de f, como x − x·ln(x) com x0 = 0,5, que dá x1 = −0,72.',
          solucao: 'Use x0 mais perto da raiz; aqui, x0 = 2 converge para e.',
          codigos: ['FUNCAO_NAO_DEFINIDA'],
          mensagem: 'x1 = −0,721348 está fora do domínio de f (ln de número negativo); tente um x0 mais perto da raiz.',
        },
        {
          id: 'derivada-nao-definida',
          titulo: 'Derivada não definida',
          quando: 'f existe no iterado, mas f\' não é finita: sqrt(x) − 1 com x0 = 4 dá x1 = 0, f(0) = −1 e f\'(x) = 1/(2·sqrt(x)).',
          solucao: 'Use x0 mais perto da raiz (aqui, x0 = 2 converge para 1) ou evite pontos onde f\' explode.',
          codigos: ['DERIVADA_NAO_DEFINIDA'],
          mensagem: "Em x1 = 0, f(x1) = −1 está definida, mas f'(x1) não é finita (f'(x) = 1 / (2 * sqrt(x))); o passo de Newton não pode ser calculado. Tente um x0 mais perto da raiz.",
        },
        {
          id: 'criterio-parada',
          titulo: 'Critério de parada: tol × ε',
          quando: 'Absoluto (tol, unidade de x) falha com x grande; relativo (ε = |Δx|/|x|, adimensional) falha se a raiz é 0 (|Δx|/|x| não cai; x³: 0,5).',
          solucao: 'Se |x| < 1,000e−12, usa |Δx| < ε e avisa. Se x → 0 sem o erro cair, para com RAIZ_EM_ZERO: use absoluto.',
          codigos: ['CRITERIO_RELATIVO_PERTO_DE_ZERO', 'RAIZ_EM_ZERO_CRITERIO_RELATIVO'],
        },
        {
          id: 'max-iteracoes',
          titulo: 'Máximo de iterações atingido',
          quando: 'O limite acabou antes de |Δx| < tol, como x^2 − 2 com x0 = 1 e no máximo 2 iterações.',
          solucao: 'Aumente o máximo de iterações, afrouxe a tolerância ou use x0 mais perto da raiz.',
          codigos: ['NAO_CONVERGIU'],
          mensagem: 'Máximo de iterações atingido sem convergir.',
        },
        {
          id: 'raiz-multipla',
          titulo: 'Raiz múltipla (convergência lenta)',
          quando: 'f e f\' se anulam juntas, como (x − 1)^2: a convergência vira linear com razão (m − 1)/m.',
          solucao: 'Aceite mais iterações ou use Newton modificado: x − m·f/f\'.',
          codigos: ['CONVERGENCIA_LENTA', 'RAIZ_MULTIPLA'],
          mensagem: 'Convergência lenta (linear): provável raiz múltipla, onde f e f\' se anulam juntas.',
        },
      ],
      resumo: {
        convergencia: 'Quadrática perto de raiz simples; linear com razão (m − 1)/m em raiz de multiplicidade m.',
        custo: 'Uma avaliação de f e uma de f\' por iteração; em geral poucas iterações.',
      },
    },

    gauss: {
      vantagens: [
        'Método direto: resultado exato a menos de arredondamento, em número fixo de operações.',
        'Não precisa de chute inicial nem de critério de parada.',
        'Com pivoteamento parcial, é estável para a grande maioria dos sistemas.',
        'Pivô: “automático” (padrão) troca se o pivô é zero ou pequeno; “sempre” usa o maior |a_ik|; “nunca” não troca.',
        'Detecta sistemas singulares e os classifica como impossíveis ou indeterminados.',
      ],
      desvantagens: [
        'Custo O(n³): cerca de 2n³/3 flops na eliminação e O(n²) na substituição.',
        'Precisa guardar a matriz inteira, n² valores.',
        'Erros de arredondamento acumulam em sistemas mal condicionados.',
        'Ao trocar b, a eliminação é refeita; a fatoração LU evita isso.',
      ],
      problemas: [
        {
          id: 'pivo-nulo',
          titulo: 'Pivô nulo sem troca',
          quando: 'Modo “nunca” e a_kk = 0, mas outra linha da coluna não é nula. Coluna toda nula é sistema singular.',
          solucao: 'Use o modo “automático” (troca obrigatória quando o pivô é zero) ou “sempre”.',
          codigos: ['PIVO_ZERO_SEM_TROCA'],
          mensagem: 'Pivô a11 = 0 e o modo “nunca” não permite trocar linhas: ative o pivoteamento (automático ou sempre).',
        },
        {
          id: 'pivo-pequeno',
          titulo: 'Pivô pequeno sem troca',
          quando: 'Modo “nunca” e |a_kk| < 0,1·max|a_ik|: fatores > 10 amplificam o arredondamento (com 1e−17, x sai errado).',
          solucao: 'Use “automático” ou “sempre”; veja resultado.comparacao.',
          codigos: ['PIVO_PEQUENO_SEM_TROCA'],
          mensagem: 'Pivô pequeno sem troca (modo “nunca”): a11 = 0,0001, menor que 0,1·max|a_ik| da coluna; erro relativo de x em relação ao pivoteamento parcial: 1,988e−13.',
        },
        {
          id: 'sistema-impossivel',
          titulo: 'Sistema impossível',
          quando: 'Não há pivô não nulo e posto(A) < posto([A | b]): as equações se contradizem.',
          solucao: 'Revise os coeficientes; o sistema não tem solução.',
          codigos: ['SISTEMA_IMPOSSIVEL'],
          mensagem: 'Sistema singular: não há pivô não nulo na coluna 2. O sistema é impossível (não tem solução).',
        },
        {
          id: 'sistema-indeterminado',
          titulo: 'Sistema indeterminado',
          quando: 'Não há pivô não nulo e posto(A) = posto([A | b]) < n: há equações redundantes.',
          solucao: 'Há infinitas soluções; acrescente equações independentes para obter uma única.',
          codigos: ['SISTEMA_INDETERMINADO'],
          mensagem: 'Sistema singular: não há pivô não nulo na coluna 2. O sistema tem infinitas soluções.',
        },
        {
          id: 'mal-condicionamento',
          titulo: 'Mal condicionamento',
          quando: 'Hilbert 10×10: resíduo ≈ 3,000e−16, mas erro em x ≈ 4,000e−4. Resíduo pequeno não garante erro pequeno.',
          solucao: 'Aviso quando cond∞(A) > 1,000e+8; espere erro relativo até cond·ε. Reescale ou use maior precisão.',
          codigos: ['MAL_CONDICIONADA'],
          mensagem: 'Matriz mal condicionada: cond∞(A) ≈ 3,387e+10 > 1,000e+8. O erro relativo em x pode chegar a cond·ε ≈ 7,521e−6, mesmo com resíduo pequeno.',
        },
        {
          id: 'n-grande',
          titulo: 'Sistema grande',
          quando: 'Com n > 10 há muitas operações para animar uma a uma (até 100×100 no site).',
          solucao: 'O site anima uma coluna de pivô por passo e guarda só uma cópia da matriz por coluna.',
          codigos: ['MODO_COLUNA'],
          mensagem: 'Modo por coluna: um passo por coluna de pivô (matriz grande).',
        },
      ],
      resumo: {
        convergencia: 'Direto: termina em número finito de passos; exato a menos de arredondamento.',
        custo: 'Cerca de 2n³/3 flops na eliminação mais n² na substituição: O(n³).',
      },
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
