# OBC — <capability>

Canonical location: `paths.obcs` from `manifest.yaml` → `<capability>.md`

> An Observable Business Contract states the measurable success criteria of a
> capability before implementation. No committed OBC → no governed delivery.

## Status

Draft / Committed — plus a link to the iteration plan entry
(`paths.iteration_plan`) and its `iteration_status` value.

## Business Outcome

One paragraph: who gains what, and how we will know. Written in business
language, no implementation detail.

## Observable Events

Every behavior this capability promises must be observable in production.

| Event | Meaning | Required dimensions |
|---|---|---|
| `<domain>.<entity>.<action>` | | `correlationId`, ... |
| `<domain>.<entity>.<action>_failed` | | `correlationId`, `reason`, ... |

## Initial SLIs

Measurable targets Validate will check. If a target cannot be set yet, record
the gap explicitly — do not omit the row.

| SLI | Initial target |
|---|---|
| <e.g. requests handled within <N> ms> | 99.9% |
| <e.g. failures rejected with observable reason> | 100% |
| <e.g. sensitive values never appear in logs or responses> | 100% |

## Reliability Rules

Non-negotiable operational constraints: idempotency, timeouts, retry policy,
data handling, what must never be logged.

-
-

## Related Artifacts

- BDD Feature: `paths.bdd` → `<capability>.feature`
- Iteration plan entry: `paths.iteration_plan`
- Reliability plan: `paths.reliability_plans`
