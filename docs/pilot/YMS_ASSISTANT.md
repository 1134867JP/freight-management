# Gerente conversacional do YMS

## Objetivo do piloto

Permitir que administradores e funcionários autorizados consultem a operação pelo
WhatsApp sem abrir novas telas. O recurso é somente leitura e deve validar se a
empresa reduz tempo e tarefas manuais durante o piloto de uma empresa e um pátio.

## Fluxo

1. A Evolution API entrega a mensagem ao webhook autenticado.
2. O CargoHub identifica uma única instância, empresa, usuário e permissão.
3. Comandos de criação de cota continuam no parser atual e exigem `CONFIRMAR`.
4. Perguntas de consulta são enviadas primeiro à Groq, sem dados do banco.
5. Se a Groq falhar, o mesmo classificador tenta o Gemini automaticamente.
6. A IA devolve somente `intent`, `date` e `client_name` em JSON Schema estrito.
7. O Laravel valida os campos, aplica `company_id` e executa uma consulta permitida.
8. O Laravel monta a resposta e registra pergunta, intenção, fonte, latência, uso e
   resultado resumido em `whatsapp_commands`.

A IA não recebe SQL, credenciais, resultados de consultas ou acesso a modelos
Eloquent. Ela não pode criar, alterar, confirmar, cancelar ou excluir registros.

## Consultas liberadas

| Intenção               | Exemplo                                     | Fonte dos dados                         |
| ---------------------- | ------------------------------------------- | --------------------------------------- |
| `timeslot_capacity`    | Quantas cotas ainda temos hoje?             | cotas menos reservas não canceladas     |
| `yard_vehicles`        | Quantos veículos estão no pátio?            | fretes que ocupam o pátio agora         |
| `late_freights`        | Quais veículos estão atrasados?             | reservas cujo horário já passou         |
| `missing_arrivals`     | Quais agendamentos ainda não chegaram?      | reservas ainda no estado `reserved`     |
| `available_docks`      | Quais docas estão livres?                   | docas ativas com status `available`     |
| `client_operation`     | Como está a operação do Cliente X?          | agendamentos do cliente na data         |
| `average_service_time` | Qual foi o tempo médio de atendimento hoje? | início e conclusão da operação          |
| `operational_issues`   | Houve falha ou pendência hoje?              | atrasos, bot e permanência acima de 12h |
| `operation_summary`    | Faça um resumo da operação de hoje.         | indicadores operacionais essenciais     |

As listas são limitadas aos cinco primeiros registros na mensagem. A consulta de
data fica limitada a 31 dias antes ou depois da data atual durante o piloto.

## Provedores gratuitos

O driver principal é Groq com `openai/gpt-oss-20b` e o fallback é Gemini com
`gemini-2.5-flash`. As duas integrações usam saída estruturada por JSON Schema. Em
11/08/2026, o plano gratuito da Groq publicava 1.000 requisições e 200 mil tokens por
dia para esse modelo; o CargoHub limita o uso a 300 interpretações por dia, 25 por
minuto no total e 10 por usuário por minuto, com esforço de raciocínio baixo. Os
limites reais da organização devem ser verificados no console antes do piloto.

Configuração:

```dotenv
YMS_ASSISTANT_ENABLED=true
YMS_ASSISTANT_PROVIDER=groq
YMS_ASSISTANT_FALLBACK_PROVIDERS=gemini
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_API_KEY=
GROQ_MODEL=openai/gpt-oss-20b
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
YMS_ASSISTANT_TIMEOUT=5
YMS_ASSISTANT_MAX_COMPLETION_TOKENS=256
YMS_ASSISTANT_REASONING_EFFORT=low
YMS_ASSISTANT_PER_USER_PER_MINUTE=10
YMS_ASSISTANT_GLOBAL_PER_MINUTE=25
YMS_ASSISTANT_DAILY_LIMIT=300
```

Após alterar o ambiente:

```bash
php artisan optimize:clear
php artisan queue:restart
```

Ative Zero Data Retention em **Groq Console > Data Controls**. A aplicação nunca
registra a chave nem o corpo de uma resposta de erro do provedor.

## Contingência

Se a Groq estiver sem chave, responder com erro, exceder o timeout ou devolver uma
resposta inválida, o classificador tenta o Gemini. Se o Gemini também estiver
indisponível, o interpretador por regras reconhece as perguntas principais. Perguntas
não reconhecidas recebem exemplos válidos. A indisponibilidade das duas IAs não afeta
notificações nem a criação confirmada de cotas.

## Permissões e isolamento

- administradores da empresa possuem acesso automaticamente;
- funcionários precisam de `use_yms_assistant`;
- `use_yms_assistant` não concede `create_timeslots_via_whatsapp`;
- o telefone deve identificar exatamente um usuário na empresa da instância;
- todas as consultas usam `company_id` explícito, mesmo sem sessão web autenticada;
- reentregas do mesmo `external_message_id` não repetem consulta nem resposta.

## Validação do piloto

Medir no histórico do bot:

- quantidade de consultas e usuários ativos;
- intenções mais utilizadas;
- respostas por IA versus contingência (`interpreter.source`);
- latência (`interpreter.latency_ms`);
- tokens de entrada e saída;
- perguntas rejeitadas e falhas;
- tarefas manuais evitadas relatadas na planilha do piloto.

Critério inicial de continuidade: uso recorrente por operadores, redução percebida
de consultas manuais e baixa taxa de perguntas rejeitadas. Novas intenções só devem
entrar quando o histórico do piloto demonstrar demanda real.

## Referências oficiais

- [Groq — limites gratuitos](https://console.groq.com/docs/rate-limits)
- [Groq — Structured Outputs](https://console.groq.com/docs/structured-outputs)
- [Groq — tratamento de dados e ZDR](https://console.groq.com/docs/your-data)
- [Gemini — Structured Outputs](https://ai.google.dev/gemini-api/docs/structured-output)
- [Gemini — modelos disponíveis](https://ai.google.dev/gemini-api/docs/models)
- [OpenAI — Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
