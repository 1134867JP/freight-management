# Evolution API Local Pack

Pasta mínima para subir a Evolution API separadamente do Laravel.

## O que ficou

- `docker-compose.yml`: sobe `Evolution API + PostgreSQL + Redis`
- `.env.example`: variáveis mínimas do ambiente local

## Subir a stack

No PowerShell:

```powershell
Set-Location infra/evolution-api
Copy-Item .env.example .env
```

Edite `.env` e troque pelo menos:

- `AUTHENTICATION_API_KEY`
- `SERVER_URL`, se quiser usar outra porta/host para a API

Depois:

```powershell
docker compose up -d
docker compose ps
docker compose logs -f evolution-api
```

## Validar a API

```powershell
Invoke-WebRequest http://localhost:8088 -UseBasicParsing
```

Se houver resposta HTTP, a API está no ar.

## Criar a instância

```powershell
$headers = @{ apikey = "SUA_CHAVE" }
$body = @{
  instanceName = "freight-management"
  integration = "WHATSAPP-BAILEYS"
  qrcode = $true
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:8088/instance/create `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $body
```

## Conectar e checar estado

Pedir a conexão da instância:

```powershell
Invoke-RestMethod `
  -Method Get `
  -Uri http://localhost:8088/instance/connect/freight-management `
  -Headers @{ apikey = "SUA_CHAVE" }
```

Consultar o estado:

```powershell
Invoke-RestMethod `
  -Method Get `
  -Uri http://localhost:8088/instance/connectionState/freight-management `
  -Headers @{ apikey = "SUA_CHAVE" }
```

Quando o estado vier `open`, a instância está conectada ao WhatsApp.

## Testar envio direto

```powershell
$headers = @{ apikey = "SUA_CHAVE" }
$body = @{
  number = "5511999999999"
  text = "Teste Evolution"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:8088/message/sendText/freight-management `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $body
```

## Ligar no Laravel

No `.env` do projeto:

```env
EVOLUTION_ENABLED=true
EVOLUTION_BASE_URL=http://localhost:8088
EVOLUTION_API_KEY=SUA_CHAVE
EVOLUTION_INSTANCE=freight-management
EVOLUTION_TIMEOUT=10
```

Depois:

```powershell
php artisan config:clear
php artisan queue:restart
php artisan queue:work
```
