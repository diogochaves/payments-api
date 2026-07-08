---
name: bootstrap
description: Prepare a governed ProdOps Delivery task before implementation. Use when starting Downstream work to verify context, branch, environment, and required artifacts before Hack.
---

# BOOTSTRAP

Use this skill to prepare a Delivery task before implementation starts.

Bootstrap is a first-class Delivery phase. The legacy `hack/bootstrap` step may
be used as a narrow branch-preparation shortcut, but Downstream work should use
this skill when the full ProdOps context must be verified.

## Inputs

- `AGENTS.md`
- `prodops/framework/canonical-paths.md`
- `prodops/artifacts/product/`
- Relevant BDD Feature in `prodops/artifacts/bdd/`
- Relevant OBC in `prodops/artifacts/obcs/`
- Relevant Iteration Plan entry in `prodops/artifacts/plans/iteration-plan.md`
- Relevant Reliability Plan sections in `prodops/journeys/assessment/reliability-plans/`
- Relevant risks in `prodops/journeys/assessment/risks.md`

## Flow

1. Confirm the work is Upstream or Downstream. If it is exploratory, use the
   Upstream skill instead.
2. Confirm Downstream prerequisites exist: OBC, BDD Feature, Iteration Plan
   entry with status `Entrou`, and documented risks.
3. Read only the product, reliability, architecture, and contract artifacts
   directly related to the requested capability.
4. Inspect the working tree with `git status`.
5. Identify the intended base branch.
6. Fetch remote updates with pruning.
7. Fast-forward the local base branch only.
8. Create or switch to the feature branch for this capability.
9. Confirm the starting point with `git log --oneline -5` and `git status`.
10. Record any missing prerequisite as a blocker instead of starting Hack.

## Guardrails

- Do not start implementation on `master`, `main`, or a shared base branch.
- Do not invent missing OBCs, BDD scenarios, risks, or acceptance criteria.
- Do not silently discard local work.
- Do not start Downstream if required artifacts are missing.
- Do not broaden scope during Bootstrap.
- If the feature branch already exists and has diverged, run Sync before Hack.

## Post-conditions

- Execution mode is confirmed.
- Required Downstream artifacts are present, or blockers are explicit.
- Working branch is correct.
- Base is up to date or the divergence is reported.
- Hack can start with clear behavioral and reliability context.
