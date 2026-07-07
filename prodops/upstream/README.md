# Upstream

## Purpose

Upstream is the exploratory engineering workflow of ProdOps.

Its purpose is to reduce uncertainty before a capability enters the standard delivery flow.

Unlike Downstream, Upstream is driven by learning rather than delivery commitments.

An Upstream experiment may produce production-quality code, but that code is considered exploratory until the capability is promoted to Downstream.

---

# Objectives

Upstream exists to:

- understand business problems;
- validate technical approaches;
- explore provider capabilities;
- prototype integrations;
- validate business flows;
- reduce implementation risk;
- evolve Product knowledge.

---

# Repository Scope Gate

Before creating an experiment, BDD Feature, OBC, prototype, Validation Workbench
change, or any execution artifact, confirm that the capability can be developed
or validated inside this repository.

Create execution artifacts only when this repository owns or can directly
exercise at least one of:

- API behavior;
- domain logic;
- provider integration;
- webhook handling;
- persistence;
- contracts owned by Payments API;
- Validation Workbench flow;
- tests or executable evidence.

If the request depends on implementation owned by another repository or system,
do not create a Feature, experiment, prototype, or execution artifact here.
Instead, record it only as one of:

- external dependency;
- release risk;
- Tracking List item;
- Reliability Plan note;
- evidence required from the owning system.

Examples of out-of-repository work:

- Checkout Feature Flag implementation;
- Checkout rollout targeting;
- Notification Service delivery behavior;
- Order Management fulfillment behavior;
- corporate ITSM integration outside Payments API.

Upstream may document the dependency, but it must not make it look executable in
this repository.

---

# Typical Outputs

An Upstream activity may produce:

- executable code;
- Validation Workbench improvements;
- prototypes;
- BDD scenarios;
- OBC drafts;
- OpenAPI updates;
- AsyncAPI updates;
- Event Storming updates;
- Reliability Plan updates;
- Tracking List updates;
- architecture decisions.

---

# Workflow

A typical Upstream flow is:

Business Question

↓

Hypothesis

↓

Experiment

↓

Implementation

↓

Functional Validation

↓

Learning

↓

Decision

↓

Assessment

↓

Downstream (if approved)

---

# Experiments

Experiments are stored in:

```
prodops/upstream/experiments/
```

Each experiment should answer a specific question.

Examples:

- Is the provider API sufficient?
- Which architecture should be adopted?
- Can this business flow be validated?
- What are the operational risks?

Experiments should be small and focused.

## Experiment File Layout

New experiments must use one directory per experiment:

```text
prodops/upstream/experiments/NNN-short-slug/
  experiment.md
  upstream-trail.md
  evidence/
```

Use `experiment.md` for the stable hypothesis, scope, findings, recommendation
and Decision Package.

Use the experiment-local `upstream-trail.md` for chronological execution notes,
validation evidence, artifact changes and decisions that happened during the
experiment.

Use `evidence/` only for supporting material that is too detailed for the
experiment document, such as command outputs, screenshots, payload examples or
provider responses.

Flat experiment files under `prodops/upstream/experiments/*.md` are legacy
artifacts. Do not create new flat experiment files. If a flat experiment file is
restored from history or another branch, migrate it to the directory pattern
before making further changes.

The global `prodops/upstream/upstream-trail.md` is no longer the primary place
for experiment execution history. Keep it as a high-level chronological index
for cross-experiment milestones, migrations, promotions and repository-wide
Upstream process changes.

---

# Validation Workbench

The Validation Workbench is the preferred environment for functional validation.

It is used to:

- validate business flows;
- validate integrations;
- validate BDD scenarios;
- simulate provider behavior;
- validate UX;
- reduce implementation uncertainty.

The Validation Workbench is part of Upstream.

---

# Relationship with Assessment

Every completed experiment should produce a Decision Package.

The Decision Package feeds Continuous Assessment.

Assessment decides whether a capability should:

- move to Downstream;
- require another experiment;
- wait for business decisions;
- be discarded.

## Revisão do Decision Package

O Decision Package não é revisado automaticamente — ele precisa de uma decisão explícita de quem tem autoridade sobre o produto e a arquitetura.

### Quando revisar

Após o experimento atingir seus Exit Criteria (hipótese respondida, recomendação produzida, artefatos atualizados). Não revisar experimentos incompletos.

### Quem participa

| Papel | Responsabilidade na revisão |
|---|---|
| Product Manager | Valida o valor de negócio e decide se a capability entra no Iteration Plan |
| Tech Lead | Valida viabilidade técnica, riscos arquiteturais e OBC |
| Autor do experimento | Apresenta as descobertas e defende a recomendação |

### O que é revisado

O Decision Package completo (seções do `experiment.md`):
- **Executive Summary** — entendimento compartilhado do que foi descoberto
- **Recommended Decision** — a recomendação do autor (ver opções abaixo)
- **Updated Risks** — novos riscos ou riscos mitigados
- **Updated Opportunities** — oportunidades identificadas
- **Updated Tracking Items** — itens que precisam entrar nas Tracking Lists
- **Updated OBCs** — critérios de sucesso propostos
- **Recommended Downstream Scope** — o que entra na próxima iteração, se aprovado

### Possíveis saídas da revisão

| Recomendação | O que acontece |
|---|---|
| **Promover** | Iniciar processo de promoção (ver seção "Processo de promoção para Downstream"). BDD Feature + OBC movidos. Capability entra no Iteration Plan. |
| **Promover com restrição** | Subconjunto da capability é promovido. Partes restritas permanecem em Upstream para outro experimento. |
| **Requer outro experimento** | Criar novo experimento com hipótese mais específica. Registrar a decisão no `upstream-trail.md` do experimento atual. |
| **Aguardar decisão de negócio** | Bloquear o experimento na Tracking List com o decisor e a data esperada. Não abrir novo experimento até a decisão chegar. |
| **Aguardar dependência externa** | Registrar a dependência no Reliability Plan e na Tracking List. Monitorar no Continuous Assessment. |
| **Descartar** | Registrar o aprendizado em `prodops/upstream/learnings.md`. Fechar o experimento com justificativa no `upstream-trail.md`. |

### Registro da decisão

Independente da saída, registrar no `upstream-trail.md` do experimento:
- Data da revisão
- Participantes
- Decisão tomada
- Próximos passos

Se a saída gerar mudança no Reliability Plan, atualizar `prodops/assessment/risks.md` ou `opportunities.md` antes de fechar o ciclo.

---

# Relationship with Downstream

Upstream prepares knowledge.

Downstream delivers software.

A capability should only move to Downstream when:

- the business behavior is understood;
- the architecture is stable;
- the Reliability Plan has been updated;
- the OBC is sufficiently defined;
- the remaining uncertainty is acceptable.

## Processo de promoção para Downstream

A promoção é uma decisão explícita, não uma consequência automática de um experimento concluído.

### Quem decide

A decisão de promover é do Product Manager + Tech Lead responsáveis pela capability, com base no Decision Package produzido pelo experimento.

### Critérios de promoção

Antes de promover, confirmar que:

1. O Decision Package do experimento tem recomendação clara (`Promover` ou `Promover com restrição`).
2. O comportamento esperado está descrito em um BDD Feature em `prodops/upstream/features/` pronto para ser movido para `prodops/product/features/`.
3. O OBC draft em `prodops/upstream/obcs/` tem critérios mensuráveis e pode ser movido para `prodops/assessment/obcs/`.
4. O Reliability Plan foi atualizado com os riscos e mitigation actions identificados no experimento.
5. A incerteza remanescente é aceitável para entrar em Downstream com compromisso de entrega.

### Passos da promoção

```
1. Mover BDD Feature:
   prodops/upstream/features/<slug>.feature
   → prodops/product/features/<slug>.feature

2. Mover OBC:
   prodops/upstream/obcs/<slug>.md
   → prodops/assessment/obcs/<slug>.md
   (remover marcação "Upstream draft only")

3. Criar ou atualizar entrada no Iteration Plan:
   prodops/assessment/iteration-plans/iteration-plan.md
   (adicionar à tabela "Iteration Backlog identificado")

4. Atualizar Tracking List se o item estava lá:
   prodops/product/tracking-list.md
   (mudar status para "Promovido para Downstream")

5. Registrar a promoção no upstream-trail do experimento:
   prodops/upstream/experiments/<NNN-slug>/upstream-trail.md

6. Registrar no global upstream trail:
   prodops/upstream/upstream-trail.md
   (entrada de alto nível: o quê foi promovido e quando)
```

### O que NÃO é promoção

- Mover código para produção sem mover os artefatos ProdOps.
- Criar um OBC committed sem BDD Feature correspondente.
- Iniciar implementação Downstream antes de o OBC estar em `assessment/obcs/`.
- Promover com recomendação `Não promover` ou `Requer outro experimento` no Decision Package.

---

# Golden Rules

- Keep experiments focused.
- Answer one question at a time.
- Produce executable evidence whenever possible.
- Stop when the hypothesis has been answered.
- Update affected ProdOps artifacts.
- Document learnings.
- Produce a clear recommendation.
- Avoid implementing unrelated capabilities.

Learning is the primary outcome.

Implementation is a means to achieve learning.
