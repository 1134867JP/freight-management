# CLAUDE.md

Guia para o agente de desenvolvimento que trabalha neste repositório.

## O produto

CargoHub digitaliza o ciclo **cotas → agendamento → documentos → operação de
pátio** que antes acontecia pelo WhatsApp. A **Cota** (`Quota`, `COT-0001`) é a
entidade central: a empresa publica, o CargoHub gera as janelas (`timeslots` com
`quota_id`) e cada agendamento (`Freight`, `AGD-00001`) consome uma unidade.
Regras de saldo ficam em `QuotaCapacityGuard` (sempre sob lock: cota → horário);
o ciclo exibido ao usuário vem de `BookingPresenter`/`QuotaPresenter`. Está em
**piloto controlado** (uma empresa, um pátio).

Preserve a identidade: ferramenta operacional útil para quem está no pátio.
Não transformar em SaaS genérico, ERP tradicional, dashboard cheio de cards,
"AI wrapper"/chatbot genérico ou sistema excessivamente complexo.

Priorize: simplicidade, velocidade, clareza, automação, redução de trabalho
operacional e informação acionável. Entenda o objetivo por trás de cada pedido;
se houver solução claramente melhor, proponha antes de implementar.

## Stack e checks

- Laravel 12 (PHP 8.2+) + Inertia.js 2 + React, Tailwind, Vite.
- SQLite em dev, PostgreSQL em produção.
- Backend: `composer test` (ou `php artisan test`). Testes em `tests/Feature` e `tests/Unit`.
- Frontend: `npm run lint`, `npm run format:check`, `npm run build`.
- Rode os checks relevantes antes de cada push.

## Forma de trabalhar: orquestração

O agente principal atua como **orquestrador**: entende o objetivo, classifica a
tarefa, decide se executa direto ou delega a subagentes, consolida e revisa.

- **Não delegue o que é simples.** Texto, cor, botão, ajuste pequeno → faça direto.
- **Divida e paralelize** quando houver ganho real (ex.: bug que cruza frontend +
  backend + banco; redesenho de uma tela com UX, componentes e responsividade).
- **Use o especialista certo** quando existir (UI/UX, frontend, backend, banco,
  QA, segurança, pesquisa, arquitetura) em vez de um genérico.
- **Revise tudo que voltar** de subagentes: consistência, padrões existentes,
  qualidade, segurança, performance, UX. Em conflito, o orquestrador decide.
- Entregue uma solução única e integrada; a orquestração fica nos bastidores.

### Model routing

Use o modelo mais barato e rápido que entregue qualidade suficiente:

| Nível         | Exemplos                                                                                                              |
| ------------- | --------------------------------------------------------------------------------------------------------------------- |
| Leve          | CSS, textos, renomear, componentes simples, formatação, docs, arquivos pequenos, repetitivo                           |
| Intermediário | implementar funcionalidade, refatorar módulo, investigar bug, integração, alterar fluxos                              |
| Avançado      | arquitetura, refatoração grande, debugging difícil, mudanças transversais, segurança/performance, requisitos ambíguos |

Nunca use um modelo avançado só porque está disponível.

### Princípio de custo (também vale para o produto)

Código determinístico > IA; modelo leve > intermediário > avançado. Se um
`if/else` resolve, não use IA. Exemplo no código: o classificador de intenções
do WhatsApp tem fallback baseado em regras (`RuleBasedYmsIntentClassifier`).

## Importante

Subagentes são **apenas** arquitetura de desenvolvimento. O CargoHub não possui
subagentes/agentes internos como funcionalidade, e o usuário final nunca deve
perceber essa arquitetura. Não transforme isso em feature sem pedido explícito.
