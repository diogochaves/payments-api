---
name: validate
description: Validate release behavior with evidence, metrics, SLOs, and operational signals. Use when proving that an OBC, BDD scenario, or reliability plan item is satisfied.
---

# VALIDATE

Prove release readiness with evidence. Validate answers one question: does
the running system satisfy the contract the work was committed against?

## Inputs

- The relevant OBC (`paths.obcs`) — its Observable Events and SLI targets are
  the validation checklist.
- The relevant BDD Feature (`paths.bdd`).
- Reliability plans (`paths.reliability_plans`).
- The `gates:` section of `manifest.yaml`.

## Flow

1. Identify the capability, OBC, or risk being validated.
2. Select the evidence that proves it: gate runs (`acceptance`, `smoke`),
   metrics, logs, emitted events, or SLO measurements. Prefer the OBC's own
   Observable Events table as the checklist — each event with its required
   dimensions.
3. Run the validation commands or inspect the existing evidence. For gates,
   the `expect` contract from `manifest.yaml` defines pass/fail.
4. Record exact commands, observed results, and remaining risk — verbatim
   output, not paraphrase.
5. Update only impacted validation or reliability artifacts.
6. Append the evidence to the release trail (`paths.release_trail`).

## Guardrails

- Do not invent metrics or SLOs. If an SLI target is absent from the OBC,
  record the gap in the appropriate artifact — do not fill it in ad hoc.
- Prefer executable evidence over narrative claims.
- A scenario that cannot be validated is a finding, not a footnote — surface
  it as a blocker for Promote.
- Do not weaken an SLI target to make validation pass.

## Post-conditions

- Every claimed behavior maps to recorded evidence (command + output, or
  metric + value).
- Gaps and residual risks are explicit.
- Release trail carries the validation entry Promote will rely on.
