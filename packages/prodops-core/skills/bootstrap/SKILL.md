---
name: bootstrap
description: Prepare a governed delivery task before implementation. Use when starting committed work to verify context, branch, environment, and required artifacts before Hack.
---

# BOOTSTRAP

Prepare a delivery task before implementation starts. Bootstrap is a
first-class phase: it verifies the full ProdOps context so Hack can run on
focused reading only.

## Inputs

Resolve all locations through `manifest.yaml` (`paths:` section). Read only
the entries directly related to the requested capability:

- the OBC (`paths.obcs`)
- the BDD Feature (`paths.bdd`)
- the iteration plan entry (`paths.iteration_plan`)
- reliability plan sections (`paths.reliability_plans`)
- documented risks (`paths.risks`)

## Flow

1. Confirm the work is exploratory or committed. Exploratory work belongs in
   `paths.experiments` — stop and route it there instead.
2. Confirm committed-work prerequisites exist: OBC, BDD Feature, iteration
   plan entry with status `Committed` (see `vocabulary.iteration_status`),
   documented risks, and a reliability plan entry.
3. Read only the artifacts directly related to the requested capability.
4. Inspect the working tree with `git status`.
5. Identify the intended base branch. If not given, ask.
6. Fetch remote updates with pruning: `git fetch origin --prune`.
7. Fast-forward the local base branch only — never force-merge a diverged base.
8. Create or switch to the feature branch for this capability.
9. Run the `smoke` gate from `manifest.yaml` (its `when` is `bootstrap`) —
   implementation must not start on a broken local environment.
10. Write the card's context capsule (template: `templates/context-capsule.md`)
    into `paths.cards/<card-slug>/context.md` so later phases read the capsule
    plus their own skill only.
11. Confirm the starting point: `git log --oneline -5` and `git status`.
12. Record any missing prerequisite as a blocker instead of starting Hack.

## Guardrails

- Do not start implementation on `main`, `master`, or a shared base branch.
- Do not invent missing OBCs, BDD scenarios, risks, or acceptance criteria.
- Do not silently discard local work.
- Do not start governed implementation if required artifacts are missing.
- Do not broaden scope during Bootstrap.
- If the feature branch already exists and has diverged, run `/sync` first.

## Post-conditions

- Execution mode is confirmed.
- Required artifacts are present, or blockers are explicit.
- The `smoke` gate passed (or its absence is recorded as a blocker).
- Context capsule written; working branch correct; base up to date or the
  divergence reported.
- Hack can start with clear behavioral and reliability context.
