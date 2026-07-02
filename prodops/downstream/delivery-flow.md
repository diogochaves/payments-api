# Delivery Flow

Downstream delivery follows the full governed flow:

```text
Hack -> Sync -> Finish -> Ship -> Validate -> Promote
```

## Flow Expectations

- Hack: implement with TDD from BDD Features.
- Sync: align code, docs, BDD, OBCs, and Reliability Plan references.
- Finish: execute quality gates and confirm done criteria.
- Ship: prepare deploy or PR readiness.
- Validate: prove behavior with evidence, metrics, logs, events, and SLOs when
  available.
- Promote: approve or close the release stage with explicit remaining risks.

Record meaningful delivery evidence in `prodops/downstream/release-trail.md`.
