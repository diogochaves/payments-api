# Reliability Policy

Reliability is planned before implementation and validated before promotion.

## Reliability Plan

Every Downstream capability requires a Reliability Plan entry. The plan defines:
- Risks and mitigations
- OBCs (Outcome-Based Criteria) with measurable success thresholds
- SLO suggestions for critical-path events

Reliability Plan lives in: `prodops/assessment/reliability-plan/`

## OBCs

An OBC anchors implementation to a business outcome. It defines what "done" means in observable, measurable terms. OBCs must exist before code is written for a Downstream item.

OBC files: `prodops/assessment/reliability-plan/obcs/`

## Definition of Done

A capability is not complete until the [Definition of Done](definition-of-done.md) is satisfied, including reliability criteria.

## Failure modes

Known failure modes must be documented in the Reliability Plan (`risks.md`) before the capability ships. For each failure mode:
- Define the trigger condition.
- Define the expected system behavior (graceful degradation, error response, retry).
- Define the observable signal (log entry, metric, alert).

## Requisitos de confiabilidade por comportamento

Para cada comportamento implementado no Hack Flow, verificar os seguintes requisitos durante o Green Bar:

| Requisito | Descrição |
|---|---|
| **Timeout** | Chamadas ao provedor externo têm timeout configurado. Sem timeout indefinido. |
| **Retry** | Retentativas usam a mesma `Idempotency-Key`. Retry sem idempotência cria duplicatas. |
| **Idempotência** | A mesma operação executada duas vezes retorna o mesmo estado, sem efeitos colaterais adicionais. |
| **Tratamento de exceções** | Erros do provedor são capturados e transformados em resposta HTTP com `message` significativa. |
| **Mensagens consistentes** | Mensagens de erro são estáveis (não mudam por retry). Facilita diagnóstico em suporte. |
| **Códigos HTTP** | Status codes correspondem à semântica: 201 (criado), 400 (input inválido), 404 (não encontrado), 409 (conflito/estado inválido), 422 (regra de negócio). |
| **Degradação controlada** | Falha de dependência externa (provedor, SQS, DynamoDB) não derruba fluxos independentes. |

Esses requisitos são verificados no [Definition of Done](definition-of-done.md) — seção Reliability.

Para detalhes sobre como aplicar durante o TDD cycle: [ProdOps TDD — Confiabilidade no ciclo](../delivery/practices/tdd-prodops.md).

## Post-deploy validation

After deploy, validate the reliability criteria defined in the OBC. Record evidence in `prodops/downstream/release-trail.md` and `prodops/operation/operational-trail.md`.
