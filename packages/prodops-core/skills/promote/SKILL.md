---
name: promote
description: Approve and close a release stage. Use when moving a release forward after validation, quality gates, and operational readiness are complete.
---

# PROMOTE

Move a release to the next stage or close it. Promote is a decision phase:
its output is a recorded decision backed by the evidence Validate produced.

## Inputs

- Release trail (`paths.release_trail`) — the validation evidence.
- Reliability plans (`paths.reliability_plans`) and risks (`paths.risks`).
- Operational artifacts of the adopting repo (runbooks, incidents,
  postmortems) where they exist.
- `vocabulary.promotion_decision` from `manifest.yaml`.

## Flow

1. Confirm required validation and quality gates are complete — the release
   trail must show the evidence, not a summary of intentions.
2. Confirm unresolved risks are accepted, mitigated, or moved to an explicit
   follow-up with an owner.
3. Check operational readiness: open incidents, runbook coverage for the new
   behavior, pending postmortem actions.
4. Record the decision using exactly one value from
   `vocabulary.promotion_decision` in `manifest.yaml`
   (e.g. `Promote`, `Promote with constraints`, `Do not promote`, `Discard`)
   — free-text variants break downstream automation.
5. Record approval, the evidence relied upon, and remaining next steps.
6. Append the promotion or closure entry to the release trail.

## Guardrails

- Do not promote when required evidence is missing — "Do not promote" is a
  valid, recordable outcome.
- Do not silently accept unresolved high-risk items.
- Do not replace release trail history; append a new entry.
- `Promote with constraints` requires the constraints to be written down with
  owners — otherwise it is just `Promote`.

## Post-conditions

- A decision from the canonical enum is recorded with its evidence.
- Risks are accepted, mitigated, or tracked — none silently dropped.
- The release trail carries the closure entry; the next stage (or the
  archive) is unambiguous.
