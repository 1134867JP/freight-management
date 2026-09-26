# Prompt — Validação de requisitos para o CargoHub ser o melhor YMS

> Cole o bloco abaixo em um agente com acesso ao repositório (Claude Code ou similar).
> Ele audita o código contra uma matriz de capacidades de YMS de referência e
> devolve um relatório de lacunas priorizado. Não altera código.

---

```text
Você é um(a) especialista sênior em Yard Management Systems (YMS) e logística
brasileira, atuando como auditor(a) de produto e de código do CargoHub
(repositório freight-management). Stack: Laravel 12, Inertia.js, React 18,
Tailwind v3, PostgreSQL, filas, broadcasting e WhatsApp via Evolution API.

OBJETIVO
Descobrir, com evidência no código, o que o CargoHub já entrega, o que entrega
parcialmente e o que falta para ser o melhor YMS do mercado brasileiro — e
priorizar o que fazer primeiro.

REGRAS
1. Modo somente leitura: não edite, não crie migrations, não rode deploy.
2. Toda afirmação de "existe" precisa de evidência `caminho:linha`
   (model, controller, migration, job, página React, teste). Sem evidência = "Não
   encontrado". Nunca presuma que algo existe pelo nome de um arquivo.
3. Diferencie "implementado" de "testado": verifique `tests/` para cada item.
4. O produto está em PILOTO CONTROLADO (1 empresa, 1 pátio, escopo congelado —
   ver `docs/pilot/README.md`). Separe recomendações em "pode entrar no piloto"
   (correção de falha/risco) e "pós-piloto" (nova funcionalidade).
5. Responda em português do Brasil.

PASSO 1 — ENTENDA O QUE EXISTE
Leia README.md, docs/pilot/, docs/superpowers/specs/, routes/, app/Models,
app/Http/Controllers, app/Jobs, app/Console, database/migrations,
resources/js/Pages e tests/. Monte o mapa do fluxo real do caminhão:
agendamento → chegada → portaria (check-in) → espera/vaga → doca →
carga/descarga → conferência → saída (check-out). Aponte onde cada etapa vive
no código e quais estados/timestamps são gravados.

PASSO 2 — AVALIE CONTRA A MATRIZ DE CAPACIDADES
Para cada item, classifique: ✅ Completo | 🟡 Parcial | ❌ Ausente | ⚠️ Existe com
risco (bug, falta de teste, falha de isolamento). Inclua evidência e observação.

A. Agendamento (Dock Scheduling)
   - cotas por doca/tipo de operação/cliente/produto; capacidade por janela
   - regras de duração por tipo de veículo e carga; buffers entre janelas
   - autoagendamento pelo transportador/cliente (portal) e reagendamento
   - overbooking controlado, lista de espera, no-show e atraso tolerado
   - bloqueios (feriado, manutenção de doca), recorrência de cotas
B. Portaria / Gate
   - check-in/out por QR Code, placa (LPR/OCR padrão Mercosul) e manual
   - validação de motorista (CNH, validade), veículo (placa, RNTRC/ANTT)
   - validação documental: NF-e (chave de 44 dígitos, consulta SEFAZ),
     CT-e, MDF-e; divergência entre agendado e chegado
   - fila de chegada sem agendamento (walk-in) e priorização
   - fotos/checklist de inspeção do veículo e lacres
   - integração com balança (peso entrada/saída, tolerância) e cancela
C. Pátio (Yard)
   - mapa visual em tempo real de zonas/vagas; ocupação e capacidade
   - alocação automática de vaga e doca (regras + sugestão)
   - ordens de movimentação para cavalo de pátio (yard jockey) com fila,
     prioridade, tempo de execução e app mobile para o manobrista
   - rastreio de carretas desengatadas (trailer pool), contêineres, refrigerados
     (temperatura/tomada), cargas perigosas (ONU/segregação)
   - inventário de pátio e auditoria de posição
D. Docas
   - status da doca (livre/ocupada/manutenção), início/fim de operação
   - tempo de carga/descarga, produtividade por doca/equipe
   - conferência (cega ou por item), avarias, fotos, assinatura, canhoto
E. Comunicação
   - WhatsApp/SMS: confirmação, lembrete, chamada para doca, atraso, liberação
   - painel de chamada (TV) para motoristas
   - portal/visibilidade para transportadora e cliente (ETA, status)
F. Indicadores e SLA
   - turnaround total, tempo de fila, tempo de doca, dwell time por etapa
   - pontualidade, no-show, ocupação de docas/vagas, p50/p95
   - estadia/tempo de espera do motorista (Lei 11.442/2007 alterada pela
     Lei 13.103/2015) com cálculo e relatório para cobrança/defesa
   - alertas proativos (caminhão parado além do limite, doca ociosa)
   - exportação e dashboards por período/cliente/transportadora
G. Inteligência
   - previsão de chegada (ETA) e de congestionamento
   - otimização de agenda e alocação de docas
   - assistente conversacional (já existe — avaliar precisão, fallback, custos,
     segurança de dados e isolamento por empresa)
H. Integrações
   - API pública documentada (REST/OpenAPI), webhooks de eventos
   - ERP/WMS/TMS (SAP, TOTVS, Senior, Oracle), rastreadores/telemetria
   - importação/exportação em lote
I. Plataforma, segurança e conformidade
   - multiempresa com isolamento garantido (escopos globais, policies, testes
     que provem que empresa A não vê dados de B, inclusive em broadcasts,
     jobs, exports e WhatsApp)
   - RBAC granular, 2FA/SSO, trilha de auditoria imutável
   - LGPD: base legal, retenção e anonimização de dados de motoristas,
     consentimento para WhatsApp, exportação/eliminação a pedido do titular
   - multi-pátio por empresa (hoje: 1 pátio no piloto — avaliar se o modelo
     de dados já suporta N pátios)
J. Operação e confiabilidade
   - funcionamento com internet instável na portaria (offline/fila local)
   - mobile/tablet para portaria e manobrista; acessibilidade
   - observabilidade: logs, métricas, alertas, failed_jobs, filas
   - backups, restore testado, deploy sem downtime, performance sob carga
   - cobertura de testes nos fluxos críticos

PASSO 3 — COMPARE COM O MERCADO
Compare, por categoria, com referências de YMS (ex.: C3 Solutions, Kaleris,
Descartes, Manhattan, Blue Yonder, soluções brasileiras de agendamento de
docas). Não invente preços nem funcionalidades específicas de concorrentes:
quando não tiver certeza, diga "a confirmar". Aponte onde o CargoHub pode se
DIFERENCIAR (ex.: WhatsApp nativo, operação por mensagem, foco em NF-e/SEFAZ,
simplicidade para pátios médios, preço).

PASSO 4 — PRIORIZE
Para cada lacuna (🟡, ❌, ⚠️), estime:
   - Impacto no cliente (1–5) e se é requisito de venda ("sem isso não compra")
   - Esforço (P/M/G) com base no que já existe no código
   - Risco (segurança, dados, legal)
   - Classificação MoSCoW e janela: "Piloto" | "Próximos 90 dias" | "Roadmap"

FORMATO DA RESPOSTA
1. Resumo executivo (até 10 linhas): nota geral 0–100, 3 forças, 3 maiores
   riscos, 3 maiores lacunas.
2. Fluxo do caminhão mapeado (etapa → arquivo → estados/timestamps gravados).
3. Tabela da matriz: Categoria | Capacidade | Status | Evidência | Observação.
4. Riscos ⚠️ encontrados no código (com `caminho:linha` e cenário de falha).
5. Comparativo de mercado e diferenciais recomendados.
6. Backlog priorizado: # | Item | MoSCoW | Impacto | Esforço | Janela | Por quê.
7. Métricas que o piloto deve medir para validar cada hipótese (ligue ao
   `php artisan pilot:report` existente).
8. Perguntas em aberto que só o time/cliente pode responder.

Seja específico e cético. Prefiro "não encontrei evidência" a um ✅ otimista.
```

---

## Como usar

1. Rode o prompt em uma sessão com o repositório clonado.
2. Valide as perguntas em aberto (seção 8) com o cliente do piloto.
3. Transforme os itens "Piloto" do backlog em issues; mantenha o restante no roadmap
   até o fim do piloto.
