# ProdOps Principles

## 1. Product context first
No code change starts without a product artifact: OBC, BDD Feature, or Reliability Plan entry. Agents must not invent missing business context.

## 2. Upstream before commitment
Hypotheses, experiments, and spikes belong in Upstream. Code is disposable until promoted to Downstream. See [AGENTS.md Upstream Path](../../AGENTS.md).

## 3. Contracts before implementation
Identify or create a verifiable contract (OpenAPI, AsyncAPI, BDD Feature, schema) before writing production code. The contract is the shared language between test and implementation.

## 4. Observability as a deliverable
Logs, errors, metrics, and traceability are part of the implementation, not afterthoughts. A feature is not done if its behavior cannot be observed in production.

## 5. Evidence-based decisions
Every delivery decision — promote, revert, accept risk — must be backed by recorded evidence. See [release-trail](../downstream/release-trail.md) and [operation/](../operation/).

## 6. Reliability is a first-class concern
Reliability goals are defined before implementation, tracked via OBCs and SLOs, and validated before promotion. See [reliability-plan](../assessment/reliability-plan/).

## 7. No shortcuts in production code
Production code must not contain test-only branches, environment-specific hacks, or hidden overrides that change behavior under test. Exception: `ASAAS_MOCK=true` is a designed behavior mode, not a test shortcut.
