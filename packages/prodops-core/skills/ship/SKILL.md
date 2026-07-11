---
name: ship
description: Prepare deploy, pull request, or release readiness. Use when packaging completed work for review, release, deployment, or handoff with final quality gates.
---

# SHIP

Prepare completed work for delivery. Ship is the first CI Async phase: it
turns a finished branch into a reviewable, deployable, evidenced package.
Ship owns two internal capability groups: **preparation** (build, package,
version, sign, SBOM, publish) and **deployment** (deploy, progressive
delivery, rollout, rollback) — wire them to your platform's pipeline.

## Inputs

- The current branch diff against the intended base.
- Release trail (`paths.release_trail`) and reliability plans
  (`paths.reliability_plans`).
- The `gates:` section of `manifest.yaml`.

## Flow

1. Confirm the change maps to a reliability plan entry or a documented
   follow-up — undocumented behavior does not ship.
2. Confirm the branch and diff against the intended base: only this task's
   commits, no unrelated changes.
3. Verify TDD evidence for behavior changes in the release trail (red output,
   green output). Behavior without evidence is a blocker.
4. Run the final gates from `manifest.yaml`: `lint`, `build`, `unit`, and
   `acceptance` when behavior or contracts changed. Each must meet its
   `expect` contract.
5. Run security checks: secrets, tokens, unsafe configuration, dependency
   changes, accidental environment leakage in the diff.
6. Review the diff as if doing code review — naming, boundaries, dead code.
7. Summarize: changed behavior, impacted artifacts, deployment risk.
8. Identify rollback strategy, monitoring signals, and operational notes.
9. Prepare the PR or deploy notes: behavior, validation performed, risk.
10. Append shipping evidence to the release trail.

## Guardrails

- Do not ship undocumented behavior changes.
- Do not present missing evidence as complete.
- Do not change business scope during ship preparation.
- Do not include unrelated changes in the PR or deployment package.
- Do not commit secrets, real tokens, personal credentials, or local paths.
- Tests must cover changed behavior, or the residual gap must be explicit.
- Never force-push a shared branch to "clean up" before review.

## Post-conditions

- All final gates green with recorded output.
- PR or deploy notes explain behavior, validation, and risk.
- Rollback and monitoring notes exist where applicable.
- Release trail carries the shipping evidence.
