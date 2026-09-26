# Design Tokens — identidade "Pinho & Ocre"

O CargoHub é usado por porteiros, operadores de pátio, gestores e clientes. O critério
principal da identidade é **ser fácil de usar**. Em seguida vêm transmitir confiança,
parecer próximo e ter personalidade própria, sem a estética de produtos de IA, fintechs
ou dashboards SaaS genéricos.

A fonte da verdade é `tailwind.config.js` e `resources/css/app.css`.

## Por que esta paleta

Quatro direções foram testadas na mesma tela de portaria
([`direcoes-de-paleta.png`](./direcoes-de-paleta.png)):

| Direção           | Resultado  | Motivo                                                                      |
| ----------------- | ---------- | --------------------------------------------------------------------------- |
| **Pinho & Ocre**  | Escolhida  | Verde passa "pode seguir" sem conflitar com atraso. Ocre marca atenção com contraste 7:1. Não remete a IA nem a fintech. |
| Cabine (vermelho) | Descartada | Em um YMS, vermelho é atraso e erro. Botão principal vermelho gera alarme falso. |
| Porto (marinho)   | Descartada | Marinho + laranja é a combinação mais comum de sistemas corporativos; azul frio volta à cara de SaaS. |
| Argila (terracota)| Descartada | Terracota + creme virou a identidade de assistentes de IA e se confunde com "atraso". |

## Cores

Cada família tem **um único papel**. Nunca use uma cor fora do seu papel.

| Família  | Papel                                              | Tons mais usados                                   |
| -------- | -------------------------------------------------- | -------------------------------------------------- |
| `areia`  | Neutros quentes: fundo, texto, bordas              | 100 página · 200 borda · 600 texto secundário · 900 texto |
| `pinho`  | Marca, ação principal, "livre / concluído"         | 700 botão · 100/800 selo de sucesso                |
| `ocre`   | Atenção, espera ("no pátio", "lotado")             | 400 marca/destaque · 100/800 selo                  |
| `tijolo` | Atraso, erro, ação destrutiva                      | 600 botão de confirmação · 100/800 selo            |
| `aco`    | Em operação, informação                            | 500 gráfico · 100/800 selo                         |
| `couro`  | Categoria secundária (substitui roxos antigos)     | 100/800 selo                                       |

As paletas padrão do Tailwind usadas no código antigo são redirecionadas: `slate`/`gray`
→ `areia`, `emerald`/`green`/`teal` → `pinho`, `amber`/`yellow`/`orange` → `ocre`,
`red`/`rose` → `tijolo`, `blue`/`sky`/`indigo` → `aco`, `violet`/`purple` → `couro`.
Em código novo, use os nomes próprios.

Contraste (WCAG) verificado: texto principal 13,9:1, texto secundário (`areia-600`)
7,3:1, botão principal 9,9:1, todos os selos acima de 7:1. `areia-400` é o tom mais
claro permitido para texto (≈4:1); abaixo disso, só para bordas e fundos.

Fundo da página: `areia-100` (#F5F1E8). Cartões: branco. Menu lateral: areia escura
(#EDE7DB). Modo escuro: grafite quente (#1D1F1C), nunca preto puro.

### Estados de um frete

Progressão fixa, igual em todas as telas:

| Estado             | Tom       |
| ------------------ | --------- |
| Reservado          | `neutral` |
| No pátio           | `warning` (ocre) |
| Carregando / Descarregando | `info` (aço) |
| Finalizado         | `success` (pinho) |
| Cancelado          | `danger` (tijolo) |

Tempo de espera: até 30 min neutro, até 60 min ocre, acima de 60 min tijolo.
O tipo de operação (carga/descarga) é mostrado com seta e texto em cinza, sem cor, porque
a cor é reservada para o estado.

## Tipografia

Fontes empacotadas via `@fontsource`, sem depender de CDN:

| Família         | Classe         | Uso                                                       |
| --------------- | -------------- | --------------------------------------------------------- |
| Source Sans 3   | `font-sans`    | Texto e interface. Humanista, muito legível em tamanho pequeno. |
| Libre Franklin  | `font-display` | Títulos (`h1`–`h3` automaticamente) e números grandes.    |
| IBM Plex Mono   | `font-mono`    | Placas e códigos.                                         |

- Base de 16px. Texto de apoio em 15px; nada abaixo de 13px.
- Caixa normal (sentence case) em tudo: títulos, rótulos, menu, botões, selos e
  cabeçalhos de tabela. Rótulos minúsculos em caixa alta e com espaçamento largo são
  proibidos: são difíceis de ler e são a marca registrada do visual SaaS genérico.
- Títulos de página: `text-[28px] font-bold`.

## Forma, bordas e sombras

- Raios: controles 8px (`rounded-lg`), cartões 10–12px (`rounded-xl`/`2xl`),
  selos 6px. Nada de "pílulas" enormes nem cantos retos.
- Cartões: borda `areia-200` + `shadow-sm`. As sombras usam tom quente, nunca azul, e
  não há glow, gradiente ou desfoque.
- Espaçamento: cartões com `p-5`/`p-6`, seções com `space-y-8`.

## Facilidade de uso — regras

1. **Uma ação principal por tela ou cartão**, em pinho, com verbo: "Fazer check-in",
   "Registrar saída", "Nova janela".
2. **Alvos de toque**: botões de 44px (`md`), 52px (`lg`) na portaria; itens de menu de 44px.
3. **Ações destrutivas em listas** usam `danger-subtle` (contorno). O vermelho sólido
   fica para o botão de confirmação do diálogo.
4. **Estado sempre com texto**, nunca só com cor (`StatusBadge` tem ponto + rótulo).
5. **Foco visível** em ocre em todo o app.
6. **Erros não somem sozinhos**; mensagens de sucesso somem após 6s.
7. **Explique a tela**: colunas e seções operacionais têm uma linha dizendo o que fazer
   ("Faça o check-in quando o caminhão chegar").
8. Placas sempre com `.plate` (padrão Mercosul).

## Componentes

- `Button`: `primary`, `secondary`, `soft`, `ghost`, `danger`, `danger-subtle`.
- `StatusBadge`: tons `neutral`, `info`, `success`, `warning`, `danger`, `violet`, `brand`.
- `MetricCard`: ponto de cor + rótulo, número grande em Libre Franklin, detalhe.
- `PageHeader`, `Card`, `TableShell`, `ModalShell`, `EmptyState`, `FormField`: seguem
  as regras acima.
