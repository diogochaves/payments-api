---
name: bootstrap
description: Prepare a governed ProdOps Delivery task before implementation. Use when starting Downstream work to verify context, branch, environment, and required artifacts before Hack.
---

# BOOTSTRAP

Use this skill to prepare a Delivery task before implementation starts.

Bootstrap is a first-class Delivery phase that verifies the full ProdOps context
before implementation. For branch preparation within a Hack session, use
`/hack start` — it handles working tree cleanup, base sync, and branch creation.

## Inputs

- `AGENTS.md`
- `prodops/framework/canonical-paths.md`
- `prodops/artifacts/product/`
- Relevant BDD Feature in `prodops/artifacts/bdd/`
- Relevant OBC in `prodops/artifacts/obcs/`
- Relevant Iteration Plan entry in `prodops/artifacts/plans/iteration-plan.md`
- Relevant Reliability Plan sections in `prodops/journeys/assessment/reliability-plans/`
- Relevant risks in `prodops/journeys/assessment/risks.md`
- Capsule template in `prodops/templates/delivery/context-capsule.md`

## Flow

1. Confirm the work is Upstream or Downstream. If it is exploratory, use the
   Upstream skill instead.
2. Confirm Downstream prerequisites exist: OBC, BDD Feature, Iteration Plan
   entry with status `Entrou`, documented risks, and a Reliability Plan entry.
3. Read only the product, reliability, architecture, and contract artifacts
   directly related to the requested capability.
4. Inspect the working tree with `git status`.
5. Identify the intended base branch.
6. Fetch remote updates with pruning.
7. Fast-forward the local base branch only.
8. Create or switch to the feature branch for this capability.
9. Confirm the starting point with `git log --oneline -5` and `git status`.
10. Record any missing prerequisite as a blocker instead of starting Hack.
11. Generate the context capsule: distill the OBC, BDD Feature, risks, and
    reliability artifacts read in step 3 into
    `prodops/exec/cards/<card-slug>/context.md`, following
    `prodops/templates/delivery/context-capsule.md`. The capsule is what
    downstream phases (Hack, Sync, Finish) read instead of the artifact tree.
    Record anything still pending under Open questions — do not resolve open
    questions silently.
12. Run the smoke gate (`gates.smoke` in `prodops/exec/manifest.yaml`) to
    confirm a working local sandbox.

## Guardrails

- Do not start implementation on `master`, `main`, or a shared base branch.
- Do not invent missing OBCs, BDD scenarios, risks, or acceptance criteria.
- Do not silently discard local work.
- Do not start Downstream if required artifacts are missing.
- Do not broaden scope during Bootstrap.
- If the feature branch already exists and has diverged, run Sync before Hack.
- Do not edit a context capsule by hand; regenerate it through this skill.

## Post-conditions

- Execution mode is confirmed.
- Required Downstream artifacts are present, or blockers are explicit.
- Working branch is correct.
- Base is up to date or the divergence is reported.
- The context capsule exists at `prodops/exec/cards/<card-slug>/context.md`.
- The smoke gate passes (`gates.smoke` in `prodops/exec/manifest.yaml`).
- Bootstrap is not complete until both the capsule exists and the smoke gate
  passes.
- Hack can start from the capsule alone, with clear behavioral and reliability
  context.
