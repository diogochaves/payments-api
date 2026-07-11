# Intent — <title>

Canonical location: `paths.intents` from `manifest.yaml` → `<slug>.md`

> An Intent records an intention to generate value, with no implementation
> commitment yet — the framework's entry point, before deciding between
> exploration and governed delivery.

## Identification

| Field | Content |
|---|---|
| Title | |
| Origin Stream | Business / Enterprise / Team / Technology |
| Date | YYYY-MM-DD |
| Requester | |
| Product owner | |

> **Origin Stream** — pick exactly one:
> **Business** (market, customer, revenue) · **Enterprise** (compliance,
> audit, governance) · **Team** (process, productivity, workflow) ·
> **Technology** (platform, security, reliability, observability).

## Intent statement

One or two sentences describing the value to be generated.

> "We want <actor> to be able to <action> so that <business outcome or
> operational improvement>."

## Context

Why now? Which pressure, opportunity, or problem motivated this intent?

## Hypotheses

Beliefs about the business, user, process, or system — not implementation
decisions — to be confirmed, refined, or discarded during exploration.

- [ ]
- [ ]

## Open questions

What must be answered before committing to implementation?

- [ ]

## Suggested execution mode

- [ ] **Exploration** — enough uncertainty to explore before committing
- [ ] **Governed delivery** — enough clarity; OBC and BDD can be written now

Rationale:

## Next step

- Exploration: create an experiment under `paths.experiments`.
- Governed delivery: create the OBC under `paths.obcs` and the BDD Feature
  under `paths.bdd`.
