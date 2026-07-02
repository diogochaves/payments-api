# Registro de Riscos — Premortem Payments

> Baseado no documento de Premortem enviado pelo usuário.

## Resumo

O cenário descreve uma release crítica para habilitação de um novo gateway de pagamentos e estabilização do serviço de notificações. O principal risco de negócio é uma multa contratual de **R$ 500 milhões** caso a ativação não ocorra dentro do prazo.

---

# Doom 2 — Atraso na ativação do novo Gateway

## Descrição

A Feature Flag que habilita o novo Gateway permanece desativada devido a um bug conhecido. Caso a correção não seja concluída dentro da janela da release, existe risco de multa contratual e impacto significativo na margem do negócio.

## Impacto

- Financeiro extremamente alto
- Bloqueio da entrada em produção
- Comprometimento da margem
- Atraso na entrega da release

## Mitigações sugeridas

- Premortem específica para a Feature Flag
- Canary Release
- Plano de Rollback
- Observabilidade ponta a ponta
- Testes automatizados sobre a Feature Flag
- War Room durante a ativação

---

# Doom 3 — Complexidade da migração para microserviços

## Descrição

O desacoplamento do monólito aumenta significativamente a complexidade operacional e de integração entre serviços.

## Impacto

- Aumento de falhas distribuídas
- Maior dificuldade de diagnóstico
- Dependências entre serviços

## Mitigações sugeridas

- Distributed Tracing
- Service Map
- Health Checks
- Catálogo de dependências
- Testes de integração
- Chaos Engineering gradual

---

# Doom 4 — Falta de visibilidade operacional

## Descrição

Incidentes já ocorreram anteriormente e podem voltar a acontecer sem detecção rápida, prejudicando planejamento e operação.

## Impacto

- Aumento do MTTR
- Perda de confiança
- Incidentes recorrentes

## Mitigações sugeridas

- Instrumentação completa com OpenTelemetry
- Dashboards executivos
- Alertas baseados em SLO
- Integração com ITSM
- Runbooks
- RCAs obrigatórias

---

# Riscos estruturais identificados

- Dependência do novo Gateway para cumprimento contratual.
- Dependência do serviço de Notifier.
- Necessidade de instrumentação no DataDog.
- Integração ao processo corporativo de gestão de incidentes.
- Dependências entre Ecommerce, Payments, Marketing, Vendas, Infraestrutura e Arquitetura.

---

# Recomendações para o Reliability Plan

## Antes da release

- Premortem
- Event Storming
- Revisão dos OBCs
- Revisão dos cenários BDD
- Plano de Rollback
- Plano de Canary
- Testes de carga
- Testes de resiliência

## Durante a release

- Monitoramento em tempo real
- Feature Flag monitorada
- Dashboards executivos
- War Room
- Critérios claros de rollback

## Após a release

- Postmortem
- RCA
- Atualização da Tracking List
- Atualização dos OBCs
- Atualização do Product Deck e Service Deck
