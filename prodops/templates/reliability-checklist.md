# Reliability Checklist

Use before promoting a capability from Upstream to Downstream, or before shipping a Downstream item.

## Behavior coverage

- [ ] OBC defined and measurable.
- [ ] All acceptance criteria covered by tests.
- [ ] Failure modes documented in `prodops/assessment/reliability-plan/risks.md`.

## Observability

- [ ] Critical path operations emit structured logs.
- [ ] Error responses carry correlation IDs.
- [ ] No secrets or PII in logs.
- [ ] SLO signal identified (metric or log-based).

## Operational readiness

- [ ] Runbook exists or updated in `prodops/operation/runbooks.md`.
- [ ] On-call team notified of new failure mode.
- [ ] Rollback plan defined.

## Evidence

- [ ] Pre-deploy test run recorded.
- [ ] Post-deploy validation completed.
- [ ] Entry added to `prodops/downstream/release-trail.md`.
