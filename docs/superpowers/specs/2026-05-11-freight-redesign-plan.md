# Freight Management - Redesign Plan
**Data**: 2026-05-11  
**Objetivo**: Melhorar clareza visual e fluxos (Admin + Client) em 1 mês  
**Timeline**: 4 semanas

---

## Contexto do Projeto

**Sistema**: SaaS B2B para cerealistas/transportadoras gerenciarem cotas de transporte  
**Stack**: Laravel 12 + PHP 8.2 | React 18 + Inertia.js + Tailwind CSS  
**Perfis**: 
- `platform_admin`: gerencia empresas e WhatsApp
- `admin`: gerencia timeslots, clientes, operações
- `client`: visualiza horários, faz reservas, gerencia caminhões

**Problema Atual**: Design confuso, visual poluído, falta clareza nos fluxos  
**Usuários Finais**: Despachantes, gerentes, operadores de pátio, cerealistas

---

## Objetivo do Redesign

✅ Tornar os fluxos **intuitivos** para ambos os perfis  
✅ **Eliminar confusão visual** (hierarquia clara, espaçamento, cores)  
✅ **Clarificar conceitos** (o que é timeslot? o que é reserva?)  
✅ **Melhorar navegação** (usuários sabem onde ir)  
✅ Manter funcionalidade existente (não remover features)  

---

## Estratégia em 3 Fases

### **FASE 1: Análise & Design System (Semana 1)**

**Objetivo**: Definir fundação visual e claridade conceitual

**Tarefas**:
1. **Auditoria Visual**
   - Listar problemas: páginas confusas, campos desnecessários, cores inconsistentes
   - Identificar padrões ruins: modais poluídos, listas com muitos dados, ações escondidas
   
2. **Claridade Conceitual**
   - Documentar termos confusos (timeslot, quota, reserva, operação)
   - Definir nomes claros + explicações curtas
   
3. **Design System**
   - Revisar/criar cores (paleta clara, contraste bom)
   - Definir tipografia (hierarquia)
   - Componentes React: Button, Card, Modal, Table, Badge (estado visual)
   
4. **Estrutura de Navegação**
   - Admin: dashboard → timeslots → clientes → fretes → relatórios
   - Client: dashboard → horários → reservas → caminhões

**Entregável**: 
- Documento de problemas + soluções
- Design tokens (cores, fontes, espaçamento)
- Guia de padrões UI

---

### **FASE 2: Admin Redesign (Semana 2-3)**

**Objetivo**: Redesenhar interface do admin com clareza máxima

**Telas prioritárias**:
1. **Dashboard/Agenda Operacional**
   - Mostrar timeslots do dia/semana
   - Status das operações (loading, unloading, completed, cancelled)
   - Ações rápidas (aprovação, rejeição, finalização)
   - Remover informações "nice-to-have"

2. **Gerenciamento de Timeslots**
   - Criar/editar simples e claro
   - Visualização em tabela/calendário
   - Status visual (público, restrito, cheio)

3. **Visualização de Fretes**
   - Listar por status
   - Ações principais visíveis (aprovar, rejeitar, adicionar anexo)
   - Detalhes em modal/card ao clicar

4. **Clientes**
   - CRUD simples
   - Visualizar reservas ativas por cliente

**Implementação**:
- Usar componentes do design system
- Aplicar cores/tipografia definidas
- Testar clareza: "Um usuário novo consegue fazer a tarefa?"

**Entregável**:
- Admin redesenhado e funcional
- Testes manuais de fluxos principais

---

### **FASE 3: Client Redesign (Semana 3-4)**

**Objetivo**: Redesenhar interface do client com foco em reservas

**Telas prioritárias**:
1. **Dashboard**
   - Resumo: próximas reservas, status, ações (cancelar, enviar nota fiscal)
   - KPIs simples (total reservado, utilização)

2. **Buscar & Fazer Reserva**
   - Filtros claros (data, horário, local)
   - Resultados com disponibilidade visual
   - Fluxo de reserva em etapas (clear, simple)

3. **Minhas Reservas**
   - Lista clara por status
   - Ações rápidas (adicionar nota fiscal, cancelar)

4. **Caminhões**
   - CRUD simples
   - Visualizar histórico de reservas

**Implementação**:
- Usar design system do admin
- Testar usabilidade: mobile e desktop
- Verificar clareza de status/ações

**Entregável**:
- Client redesenhado e funcional
- Testes manuais de fluxos críticos

---

## Prompt para Claude CLI

Após esta análise, será criado um **prompt estruturado** para usar com Claude CLI:

```
# Prompt: Redesign Freight Management

Contexto:
- Sistema B2B para cerealistas/transportadoras (SaaS)
- Stack: Laravel 12, React 18, Inertia.js, Tailwind CSS
- Problema: Design confuso, visual poluído, falta clareza

Objetivo:
Melhorar clareza visual e fluxos dos perfis Admin e Client em 1 mês.

Estratégia (3 fases):
1. Análise + Design System (Semana 1)
2. Admin Redesign (Semana 2-3)
3. Client Redesign (Semana 3-4)

Tarefas:
[Fase 1 detalhada]
[Fase 2 detalhada]
[Fase 3 detalhada]

Entregáveis esperados:
- Design tokens + guia
- Admin funcional
- Client funcional
- Documentação

Restrições:
- Manter todas as features existentes
- Não remover dados/funcionalidade
- Usar Tailwind + componentes React atuais
- Testar fluxos manuais

Como executar:
1. Comece pela Fase 1
2. Após cada fase, peça aprovação
3. Implemente iterativamente
4. Documente decisões
```

---

## Timeline

| Fase | Duração | Início | Fim |
|------|---------|--------|-----|
| 1: Analysis & Design | 1 sem | Seg 12/5 | Dom 18/5 |
| 2: Admin Redesign | 2 sem | Seg 19/5 | Dom 1/6 |
| 3: Client Redesign | 1 sem | Seg 2/6 | Dom 8/6 |

---

## Sucesso = ?

✅ Admin: fluxo claro, navegação intuitiva, status visual  
✅ Client: busca + reserva simples, dashboard útil  
✅ Design: hierarquia clara, cores consistentes, sem poluição  
✅ Código: padrões de componentes, reutilizável  

---

## Próximos Passos

1. Revisar e aprovar este plano
2. Gerar prompt detalhado para Claude CLI
3. Executar Fase 1 (análise + design system)
4. Iteração Fase 2 (admin)
5. Iteração Fase 3 (client)
