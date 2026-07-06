# ProdOps Delivery

ProdOps Delivery organizes implementation work into two paths:

| Path | Purpose | Starting point |
|---|---|---|
| **Upstream** | Explore, experiment, validate | `prodops/upstream/` |
| **Downstream** | Govern, deliver, ship | `prodops/downstream/` |

Both paths share the same set of flow steps — `Hack → Sync → Finish → Ship → Validate → Promote` — but apply them differently:

- **Downstream** requires the full sequence for every item.
- **Upstream** selects steps as needed. A typical Upstream cycle uses Hack + Sync; Ship, Validate, and Promote are added only when the experiment requires staging validation or a promotion decision.

## Coding practice

All implementation work in both paths follows **Hack Flow**, which uses **ProdOps TDD** as its mandatory coding practice.

- [Hack Flow](hack-flow.md) — coding sequence with ProdOps TDD integrated
- [Sync + Finish Flow](sync-finish-flow.md) — review, consistency, and quality gate closure
- [Ship → Validate → Promote Flow](ship-validate-promote-flow.md) — deploy, staging validation, and release closure
- [ProdOps TDD](practices/tdd-prodops.md) — TDD practice adapted for observable, reliable products

## Execution skills

For execution mechanics (branching, commands, lint, tests, commit), see:
- [`skills/hack/`](../../skills/hack/) — implementation execution
- [`skills/sync/`](../../skills/sync/) — review and artifact sync
- [`skills/finish/`](../../skills/finish/) — quality gate closure
- [`skills/ship/`](../../skills/ship/) — deploy preparation
- [`skills/validate/`](../../skills/validate/) — post-deploy validation
