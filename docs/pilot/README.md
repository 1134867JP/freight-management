# Piloto controlado — uma empresa e um pátio

Durante o piloto, mantenha o escopo funcional congelado. Registre em `storage/app/pilot/manual-observations.csv` apenas intervenções que ocorreram de verdade. O deploy inicializa esse arquivo a partir do modelo versionado quando necessário.

- `manual_task`: retrabalho, ligação, conferência fora do sistema ou correção manual;
- `failure`: erro técnico, integração indisponível ou fluxo interrompido.

Exemplo de registro:

```csv
2026-08-12T09:15:00-03:00,empresa-piloto,manual_task,conferencia_documental,8,123,Operador 1,Conferência realizada fora do sistema
```

Gere o consolidado diário com:

```bash
php artisan pilot:report empresa-piloto --from=2026-08-12T00:00:00-03:00 --to=2026-08-12T23:59:59-03:00
```

O relatório combina os eventos do PostgreSQL com o CSV e apresenta volume, médias, p50, p95, falhas e minutos de trabalho manual. `failed_jobs_global` só deve ser usado enquanto o ambiente estiver limitado à única empresa do piloto.
