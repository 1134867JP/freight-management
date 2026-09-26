# Design Tokens — linguagem "pátio / sinalização"

O CargoHub usa a linguagem visual de um pátio logístico: concreto, preto e amarelo
de segurança, tipografia condensada de placa, cantos retos e números grandes que
podem ser lidos de longe. A fonte da verdade é `tailwind.config.js` e
`resources/css/app.css`; este documento explica como usar os tokens.

## Cores

| Token                       | Uso                                                               |
| --------------------------- | ----------------------------------------------------------------- |
| `ink` (`#141413`)           | Texto principal, botão primário, menu lateral, cabeçalhos escuros |
| `signal-400` (`#F5C400`)    | Amarelo de segurança: item ativo, foco, destaques, ação de pátio  |
| `signal-50…300`             | Tintas claras do amarelo (hover de linha, fundo de aviso leve)    |
| `concrete-50…950`           | Neutros quentes: fundos, bordas, texto secundário                 |
| `emerald` / `amber` / `rose`| Status: livre-concluído / espera-alerta / erro-atraso             |
| `sky` / `violet`            | Tipo de operação: carga / descarga                                |

Compatibilidade com o código existente:

- `slate` e `gray` apontam para `concrete`, então todas as telas antigas herdam o neutro quente.
- `brand` e `blue` usam `signal` em 50–500 e 900–950, e `ink` em 600–800. Assim
  `bg-brand-700 text-white` continua sendo um botão escuro legível, e `bg-brand-50`
  vira uma tinta amarela.
- Em código novo, prefira os nomes explícitos `ink`, `signal` e `concrete`.

Página: `concrete-100` no claro e `concrete-950` no escuro. Superfícies: `white` e
`concrete-900`.

## Tipografia

Fontes empacotadas via `@fontsource` (não dependem de CDN, funcionam em rede instável):

| Família                          | Classe         | Uso                                               |
| -------------------------------- | -------------- | ------------------------------------------------- |
| Barlow                           | `font-sans`    | Texto corrido, formulários, tabelas               |
| Barlow Condensed                 | `font-display` | Títulos, rótulos, botões, números de indicador    |
| IBM Plex Mono                    | `font-mono`    | Placas, horários, tokens de QR                    |

- `h1` e `h2` usam `font-display` automaticamente; `h1` é sempre caixa alta.
- `.stencil` = condensada + caixa alta + espaçamento largo. Use em rótulos, cabeçalhos
  de coluna, abas e links de ação.
- Indicadores: `font-display text-5xl font-bold leading-none tabular-nums`.

## Forma

- Raios quase nulos: `rounded-sm` 1px, `rounded-lg` 3px, `rounded-xl` 4px. Mantenha
  `rounded-full` só para pontos e avatares circulares.
- Bordas fazem o trabalho das sombras: `border` em concreto para cartões, `border-2 border-ink`
  para ações e destaques.
- Sombras: praticamente planas. `shadow-plate` (deslocamento sólido de 4px) é reservada
  para o cartão de login e elementos "placa".

## Utilitários

| Classe    | O que faz                                                             |
| --------- | --------------------------------------------------------------------- |
| `.hazard` | Faixa zebrada amarelo/preto. Marca atenção: atraso, fila, seção.      |
| `.plate`  | Placa de veículo no padrão Mercosul (faixa azul no topo, borda preta). |
| `.stencil`| Rótulo de sinalização.                                                |

## Componentes

- `Button`: `primary` (preto; amarelo no escuro), `signal` (amarelo, ação principal de
  pátio como check-in), `secondary` (contorno preto), `soft`, `ghost`, `danger`.
- `Card`, `TableShell`: borda de concreto, sem sombra; cabeçalho de tabela com filete preto.
- `MetricCard`: faixa lateral colorida pelo tom + número grande condensado.
- `PageHeader`: título em caixa alta com marcador zebrado e filete inferior preto.
- `StatusBadge`: retângulo, caixa alta condensada, ponto quadrado.
- `ModalShell`: cabeçalho amarelo com borda preta.

## Regras rápidas

1. Amarelo é sinal, não decoração: use para o que está ativo, selecionado ou pede ação.
2. Placas sempre com `.plate`.
3. Tempo e contagem em `font-display` grande; nunca em texto miúdo.
4. Evite gradientes, sombras suaves, cantos arredondados e ícones dentro de caixinhas coloridas.
