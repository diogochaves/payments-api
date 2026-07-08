# Canonical Paths

Use these paths as the operational source of truth for ProdOps artifacts.

| Concern | Canonical path |
|---|---|
| Product context | `prodops/artifacts/product/` |
| Committed BDD Features | `prodops/artifacts/bdd/` |
| Committed OBCs | `prodops/artifacts/obcs/` |
| Iteration plans | `prodops/artifacts/plans/` |
| Release Trail | `prodops/artifacts/trails/release-trail.md` |
| Discovery experiments | `prodops/journeys/discovery/experiments/` |
| Experiment trail | `prodops/journeys/discovery/experiments/<NNN-slug>/upstream-trail.md` |
| Discovery global trail | `prodops/journeys/discovery/upstream-trail.md` |
| Reliability Plans | `prodops/journeys/assessment/reliability-plans/` |
| Risks | `prodops/journeys/assessment/risks.md` |
| Opportunities | `prodops/journeys/assessment/opportunities.md` |
| Event Storming | `prodops/journeys/assessment/event-storming/` |
| Architecture assessment | `prodops/journeys/assessment/architecture/` |
| Operation | `prodops/journeys/operation/` |
| Framework templates | `prodops/templates/` |
| Executable skills | `prodops/skills/` |

## Legacy Paths

These paths may appear in migrated historical entries only. Do not use them for
new operational instructions or new artifacts.

| Legacy path | Replacement |
|---|---|
| `prodops/upstream/` | `prodops/journeys/discovery/` |
| `prodops/product/` | `prodops/artifacts/product/` |
| `prodops/assessment/` | `prodops/journeys/assessment/` or `prodops/artifacts/plans/` depending on artifact type |
| `prodops/assessment/reliability-plan/` | `prodops/journeys/assessment/reliability-plans/` |
| `prodops/assessment/reliability-plans/` | `prodops/journeys/assessment/reliability-plans/` |
| `prodops/downstream/release-trail.md` | `prodops/artifacts/trails/release-trail.md` |
| root `templates/upstream-*.md` | `prodops/templates/discovery/` |
