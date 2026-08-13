# CargoHub

Yard Management System (YMS) para organizar agendamentos, entrada de veículos e
operações de carga e descarga no pátio.

O CargoHub centraliza cotas de atendimento, reservas, portaria, docas, vagas,
movimentações internas, documentos, indicadores e comunicação por WhatsApp. O
produto está em fase de piloto controlado com uma empresa e um pátio; o escopo do
piloto deve permanecer congelado enquanto volume, tempos, falhas e tarefas manuais
são medidos.

## Funcionalidades

### Plataforma e acessos

- cadastro e arquivamento de empresas, preservando o histórico operacional;
- isolamento dos dados por empresa;
- gestão de administradores, funcionários e clientes;
- permissões específicas para funcionários;
- senha temporária definida pelo administrador e troca obrigatória no primeiro acesso;
- identidade visual por empresa e preferência de tema por usuário;
- logs de auditoria para usuários autorizados.

### Agendamento e operação

- criação de cotas (`timeslots`) públicas ou restritas a clientes;
- agenda operacional e controle de capacidade;
- reservas de carga e descarga;
- cadastro de caminhões e motoristas pelo cliente;
- nota fiscal obrigatória para reservas de descarga;
- cancelamento/rejeição, reabertura, acompanhamento e finalização das reservas;
- anexos operacionais e exportações;
- fechamento automático de horários expirados.

### Pátio

- check-in e check-out pela portaria, inclusive por consulta de QR Code;
- painel operacional com atualização periódica e suporte a tempo real;
- mapa do pátio, zonas e vagas;
- gestão e ocupação de docas;
- cavalos mecânicos de pátio;
- ordens de movimentação interna;
- KPIs e relatórios de horários e fretes.

### WhatsApp

- notificações operacionais assíncronas pela Evolution API;
- uma instância de WhatsApp por empresa;
- criação de cotas por mensagem para administradores e funcionários autorizados;
- confirmação antes da gravação, expiração, idempotência e protocolo de auditoria.
- gerente conversacional de leitura para consultar cotas, pátio, atrasos, docas e
  indicadores, com IA gratuita e fallback local.

## Perfis de acesso

| Perfil                      | Identificador      | Responsabilidade                                                               |
| --------------------------- | ------------------ | ------------------------------------------------------------------------------ |
| Administrador da plataforma | `platform_admin`   | Gerencia empresas, administradores principais e instâncias de WhatsApp.        |
| Administrador da empresa    | `company_admin`    | Possui acesso administrativo e operacional completo dentro da própria empresa. |
| Funcionário                 | `company_employee` | Opera o YMS e recebe somente as permissões administrativas delegadas.          |
| Cliente                     | `client`           | Mantém motoristas e caminhões, reserva horários e acompanha suas operações.    |

As permissões delegáveis a funcionários são: visualizar auditoria, gerenciar
administradores, gerenciar funcionários, gerenciar WhatsApp, criar cotas pelo
WhatsApp e consultar o gerente YMS. Um funcionário não pode elevar as próprias
permissões nem delegar uma permissão que não possua.

## Fluxo operacional

1. O administrador cria uma cota, pela interface ou pelo WhatsApp.
2. O cliente escolhe um horário e cria a reserva com caminhão, motorista e operação.
3. Em uma descarga, a nota fiscal é enviada junto com a reserva.
4. A portaria faz o check-in e o veículo entra no pátio.
5. O operador atribui vaga ou doca e, quando necessário, cria uma ordem de movimentação.
6. A carga ou descarga é iniciada e finalizada.
7. A portaria registra o check-out e libera os recursos associados.

O fluxo principal de status é:

```text
reserved -> arrived -> loading|unloading -> completed
```

Uma reserva ainda ativa pode ser alterada para `cancelled`. No modo piloto, ou
quando a empresa não utiliza fila, a operação pode avançar de `reserved` para
`loading` ou `unloading` sem uma etapa manual de check-in.

## Stack

- PHP 8.2+ e Laravel 12;
- Inertia.js, React 18, Tailwind CSS e Vite;
- PostgreSQL 16 em testes, CI e produção;
- SQLite como opção leve para desenvolvimento local;
- filas e scheduler do Laravel;
- Laravel Echo/Reverb, com polling de segurança no painel do pátio;
- Evolution API para WhatsApp;
- armazenamento local ou compatível com S3.

## Pré-requisitos

- PHP 8.2 ou superior, com as extensões exigidas pelo Laravel;
- Composer 2;
- Node.js 20+ e npm;
- SQLite para o uso local básico;
- PostgreSQL 16 para executar a suíte PHP;
- Docker e Docker Compose somente para os ambientes conteinerizados.

## Instalação local

### Linux, macOS ou WSL

```bash
composer install
cp .env.example .env
touch database/database.sqlite
php artisan key:generate
```

Para usar armazenamento local durante o desenvolvimento, altere no `.env`:

```dotenv
APP_URL=http://localhost:8000
DB_CONNECTION=sqlite
FILESYSTEM_DISK=public
BROADCAST_CONNECTION=log
```

Finalize a instalação:

```bash
php artisan migrate --seed
php artisan storage:link
npm ci
npm run build
composer run dev
```

### Windows PowerShell

```powershell
composer install
Copy-Item .env.example .env
New-Item database/database.sqlite -ItemType File -Force
php artisan key:generate
```

Edite o `.env` com os mesmos valores do setup acima e execute:

```powershell
php artisan migrate --seed
php artisan storage:link
npm ci
npm run build
composer run dev
```

O comando `composer run dev` mantém em paralelo o servidor Laravel, o worker da
fila e o Vite. Para incluir o Laravel Pail, use `composer run dev:with-logs`; o Pail
pode não funcionar no Windows sem a extensão `pcntl`.

### Acessos criados pelo seeder

| Perfil     | E-mail                 | Senha      |
| ---------- | ---------------------- | ---------- |
| Plataforma | `platform@example.com` | `password` |
| Empresa    | `admin@example.com`    | `password` |
| Cliente 1  | `cliente1@example.com` | `password` |
| Cliente 2  | `cliente2@example.com` | `password` |
| Cliente 3  | `cliente3@example.com` | `password` |

Essas credenciais são exclusivas para desenvolvimento. O cadastro público em
`/register` está desativado. Contas criadas pelas telas administrativas recebem
senha temporária e precisam cadastrar uma nova senha antes de acessar o sistema.

## Processos locais opcionais

O scheduler é necessário para fechar cotas expiradas e expirar confirmações
pendentes do bot:

```bash
php artisan schedule:work
```

O painel já funciona por polling. Para habilitar atualizações por WebSocket,
publique a configuração na primeira instalação, caso `config/broadcasting.php`
ainda não exista:

```bash
php artisan reverb:install
```

Depois, configure `BROADCAST_CONNECTION=reverb`, preencha as variáveis `REVERB_*`
e inicie o servidor:

```bash
php artisan reverb:start
```

Sem Reverb, o painel do pátio continua atualizando por polling.

## Evolution API e bot do WhatsApp

O pacote local da Evolution API está em [`infra/evolution-api`](infra/evolution-api/README.md).
Com a instância criada e conectada, configure:

```dotenv
EVOLUTION_ENABLED=true
EVOLUTION_BASE_URL=http://localhost:8088
EVOLUTION_API_KEY=sua-chave
EVOLUTION_INSTANCE=nome-da-instancia
EVOLUTION_TIMEOUT=10

EVOLUTION_BOT_ENABLED=true
EVOLUTION_WEBHOOK_URL=https://seu-dominio.com/api/webhooks/evolution
EVOLUTION_WEBHOOK_SECRET=gere-um-segredo-longo-e-aleatorio
EVOLUTION_BOT_CONFIRMATION_TTL=10
EVOLUTION_BOT_TIMESLOT_DURATION=60
EVOLUTION_BOT_MAX_CAPACITY=500

YMS_ASSISTANT_ENABLED=true
YMS_ASSISTANT_PROVIDER=groq
YMS_ASSISTANT_FALLBACK_PROVIDERS=gemini
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_API_KEY=sua-chave-gratuita
GROQ_MODEL=openai/gpt-oss-20b
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
GEMINI_API_KEY=sua-chave-gratuita-do-google-ai-studio
GEMINI_MODEL=gemini-2.5-flash
YMS_ASSISTANT_TIMEOUT=5
YMS_ASSISTANT_MAX_COMPLETION_TOKENS=256
YMS_ASSISTANT_REASONING_EFFORT=low
YMS_ASSISTANT_PER_USER_PER_MINUTE=10
YMS_ASSISTANT_GLOBAL_PER_MINUTE=25
YMS_ASSISTANT_DAILY_LIMIT=300
```

O classificador tenta a Groq primeiro. Se a chamada falhar, exceder o tempo ou
retornar uma resposta inválida, tenta o Gemini; se ambos falharem, usa as regras
locais já existentes para as perguntas conhecidas.

Depois de alterar a configuração:

```bash
php artisan optimize:clear
php artisan queue:restart
```

Na aplicação, acesse **Admin > WhatsApp** e atualize o estado da instância para
registrar o webhook autenticado. O telefone do usuário deve conter DDI e somente
números, por exemplo `5511999999999`.

Formato recomendado para criar uma cota:

```text
10 cotas | Cliente X | amanhã | 10:00
```

Também é aceita linguagem natural, por exemplo:

```text
Criar 10 cotas às 10h no cliente X amanhã
```

Regras do bot:

- administradores da empresa são autorizados automaticamente;
- funcionários precisam da permissão `create_timeslots_via_whatsapp`;
- funcionários precisam da permissão independente `use_yms_assistant` para fazer
  consultas operacionais;
- o telefone deve identificar um único usuário autorizado dentro da empresa;
- grupos, mensagens enviadas pelo próprio número e remetentes sem permissão são ignorados;
- `CONFIRMAR` grava a cota e `CANCELAR` descarta a solicitação;
- comandos pendentes expiram e reentregas do mesmo webhook são idempotentes;
- cada solicitação recebe um protocolo `#WA-XXXXXX` e fica disponível na auditoria.

O gerente conversacional aceita, no piloto, perguntas como:

```text
Quantas cotas ainda temos hoje?
Quantos veículos estão no pátio?
Quais veículos estão atrasados?
Quais agendamentos ainda não chegaram?
Quais docas estão livres?
Como está a operação do Cliente X?
Qual foi o tempo médio de atendimento hoje?
Houve alguma falha ou pendência hoje?
Faça um resumo da operação de hoje.
```

A Groq interpreta somente intenção, data e nome de cliente informado na própria
pergunta. O Laravel consulta e formata os dados reais; resultados operacionais não
são reenviados à IA. Se a API estiver indisponível ou atingir o limite, perguntas
conhecidas usam o interpretador local. O limite interno de 300 chamadas por dia e
o raciocínio em nível `low` deixam margem para os limites gratuitos de requisições
e tokens do modelo. Ative **Zero Data Retention** nas configurações da organização
Groq antes do piloto.

Detalhes de arquitetura, segurança, consultas e critérios de validação estão em
[`docs/pilot/YMS_ASSISTANT.md`](docs/pilot/YMS_ASSISTANT.md).

As chaves das instâncias são cifradas no banco. Para proteger credenciais antigas
depois de uma migração, execute:

```bash
php artisan evolution:secure-keys
```

## Testes e qualidade

A suíte PHP usa PostgreSQL, inclusive para validar locks, concorrência e transações.
Os valores padrão esperados por `phpunit.xml` são:

```dotenv
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=freight_test
DB_USERNAME=freight_user
DB_PASSWORD=secret
```

Uma instância descartável pode ser iniciada com Docker:

```bash
docker run --name cargohub-test-postgres \
  -e POSTGRES_DB=freight_test \
  -e POSTGRES_USER=freight_user \
  -e POSTGRES_PASSWORD=secret \
  -p 5432:5432 -d postgres:16
```

Execute as verificações antes de enviar alterações:

```bash
php artisan test
./vendor/bin/pint --test
npm run lint
npm run format:check
npm run build
```

## Piloto controlado

O comando abaixo consolida volume, tempos médio/p50/p95, falhas e minutos de
trabalho manual de uma empresa:

```bash
php artisan pilot:report empresa-piloto \
  --from=2026-08-12T00:00:00-03:00 \
  --to=2026-08-12T23:59:59-03:00
```

O guia de operação e o modelo de observações ficam em
[`docs/pilot`](docs/pilot/README.md). Registre somente intervenções reais no arquivo
`storage/app/pilot/manual-observations.csv`.

## Produção e deploy

O push para `main` dispara o workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml):

1. cria um PostgreSQL 16 temporário;
2. instala as dependências PHP;
3. executa migrations e toda a suíte de testes;
4. prepara dependências e assets em um novo diretório de release na VPS;
5. executa migrations e caches antes da troca do link ativo;
6. recria `app`, `queue` e `scheduler`;
7. valida o endpoint `/up` e restaura o release anterior se o health check falhar.

O [`docker-compose.yml`](docker-compose.yml) da raiz é específico da VPS atual e
depende de imagem, redes, volume, `.env` e storage compartilhado já provisionados.
As migrations de produção devem continuar retrocompatíveis: o rollback automático
restaura código e containers, não desfaz alterações no banco.

## Estrutura principal

```text
app/Actions                 regras transacionais de negócio
app/Enums                   estados e tipos do domínio
app/Http/Controllers        entrada HTTP e páginas Inertia
app/Models                  entidades e relacionamentos
app/Services/WhatsApp       integração e bot da Evolution API
app/Services/Pilot          consolidação das métricas do piloto
database/migrations         evolução do schema
database/seeders            dados locais de demonstração
resources/js/Pages          telas React por perfil
routes                      rotas web, API, canais e scheduler
tests/Feature               cenários funcionais e de integração
tests/Unit                  testes unitários
```

## Comandos úteis

```bash
# limpar caches
php artisan optimize:clear

# reiniciar workers após mudanças em produção
php artisan queue:restart

# listar rotas
php artisan route:list

# verificar jobs que falharam
php artisan queue:failed
```

## Solução de problemas

### Uploads não abrem localmente

Confirme `FILESYSTEM_DISK=public`, execute `php artisan storage:link` e valide se
`APP_URL` corresponde ao endereço usado no navegador.

### Mensagens do WhatsApp não são enviadas

Confirme se a Evolution API está acessível, a instância está conectada, o telefone
possui DDI e o worker de fila está em execução. Depois, rode `php artisan
optimize:clear` e `php artisan queue:restart`.

### A agenda não fecha horários expirados

Mantenha `php artisan schedule:work` ativo no desenvolvimento. Em produção, o
serviço `scheduler` do Compose executa esse processo.

### Testes falham antes de iniciar

A suíte rejeita bancos diferentes de PostgreSQL. Confirme a instância de teste,
as credenciais de `phpunit.xml` e se a porta `5432` está disponível.

## Convenções de contribuição

- não inclua `.env`, chaves, tokens ou credenciais no repositório;
- mantenha toda consulta operacional isolada por `company_id`;
- preserve transações e locks nos fluxos de reserva, portaria, doca, vaga e movimentação;
- adicione testes de regressão para alterações de regra de negócio;
- não amplie o escopo funcional durante o piloto sem uma decisão explícita;
- execute a suíte PHP, o lint e o build antes do push para `main`.
