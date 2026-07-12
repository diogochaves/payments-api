# Upstream Mode

Upstream is the exploratory execution mode of the ProdOps Framework.

## Purpose

Reduce uncertainty before a capability enters the standard delivery flow.

Unlike Downstream, Upstream is driven by learning, not delivery commitments.

## Mode characteristics

- Low formal commitment
- Freedom to select capabilities and practices as needed
- Code is disposable until promoted to Downstream
- Rapid artifact evolution
- Focus on learning, not delivery

An Upstream experiment can produce production-quality code, but that code is considered exploratory until the capability is promoted to Downstream.

## When to use Upstream mode

- Hypothesis to validate, high uncertainty
- Explore a new capability
- Prototype integration with a provider
- Validate a business flow before committing
- Explore a technical approach before deciding

## How to execute in Upstream mode

→ [Discovery Journey](../journeys/discovery/README.md)

The Discovery journey documents the complete exploration workflow, experiments, Decision Package review, and the promotion process to Downstream.

## Expected outcome

At the end of an Upstream cycle, the following should exist:

- Hypothesis answered with evidence
- Complete Decision Package
- Clear recommendation (promote, requires another experiment, wait, discard)
- Updated ProdOps artifacts

## Sandbox Deploy (Upstream)

An experiment can be deployed to real AWS without going through the rigor of Downstream.

Objective: validate behavior against a real provider (e.g.: Asaas sandbox) when the local environment is not sufficient.

**Characteristics:**

- Activated manually via `workflow_dispatch` — never on push
- Ephemeral stack: `payments-api-experiment` + `payments-api-dynamo-experiment`
- AWS resources prefixed `experiment-*` — isolated from staging and production
- Dedicated IAM role `payments-api-github-experiment` — scope restricted to `experiment-*`
- No approval gate, no Release Trail, no committed OBC
- **Required:** stack destroyed at the end of the experiment via `action=teardown`

→ [Step: deploy-to-sandbox](../skills/upstream/steps/deploy-to-sandbox/SKILL.md)
→ [Workflow: experiment-deploy.yml](../../.github/workflows/experiment-deploy.yml)
→ [IAM Role: iam-experiment-role.yaml](../../api/infra/iam-experiment-role.yaml)

## Promotion to Downstream

A capability promoted from Upstream to Downstream must have:

1. BDD Feature moved from `prodops/journeys/discovery/experiments/<NNN-slug>/features/` to `prodops/artifacts/bdd/`
2. OBC moved from `prodops/journeys/discovery/experiments/<NNN-slug>/obcs/` to `prodops/artifacts/obcs/`
3. Entry in the Iteration Plan in `prodops/artifacts/plans/iteration-plan.md`
4. Reliability Plan updated in `prodops/journeys/assessment/reliability-plans/`

→ [Full promotion process](../journeys/discovery/README.md#processo-de-promoção-para-downstream)
