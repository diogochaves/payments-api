---
name: ship
description: Prepare deploy or pull request readiness. Use when packaging completed work for review, release, deployment, or handoff.
---

# SHIP

Use this skill to prepare completed work for delivery.

## Inputs

- `AGENTS.md`
- `prodops/assessment/reliability-plan/`
- `prodops/downstream/release-trail.md`
- `prodops/downstream/quality-gates.md`
- Current branch diff and validation evidence

## Flow

1. Confirm the change maps to the current Reliability Plan or documented
   follow-up.
2. Review tests, validation, and quality gate evidence.
3. Summarize changed behavior, impacted artifacts, and deployment risk.
4. Identify rollback, monitoring, and operational notes when applicable.
5. Prepare PR or deploy notes.
6. Append shipping evidence to the Release Trail.

## Guardrails

- Do not ship undocumented behavior changes.
- Do not present missing evidence as complete.
- Do not change business scope during ship preparation.
