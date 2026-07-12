# Hack Flow

Hack Flow is the second phase of **CI Sync**, succeeds [Bootstrap](../bootstrap/README.md), and precedes Sync. It is used in Upstream and Downstream and produces implementation with tests, contracts, observability, and recorded evidence.

Hack receives from Bootstrap a clean branch, the environment ready, ProdOps artifacts read, and the contract verified. **Hack starts directly in TDD — there is no reading or preparation before the first test.**

---

## Overview

**What it's for:** It is the implementation phase of CI Sync. It transforms OBC acceptance criteria and BDD scenarios into code verifiable by tests, following the Red→Green→Refactor cycle.

**How it works:**

```
Red Bar (test fails for the right reason) → Green Bar (minimum that passes)
→ Refactor → Commit Workflow → Validation → Evidence in Release Trail
```

**Main guardrails:**

- Do not skip the Red Bar — a test that was never red may not actually verify the behavior
- Do not use mocks for own services or business rules
- Do not add features beyond what the current test requires
- If a contract or acceptance criterion is missing, stop and return to Bootstrap

**Position in the flow:**

```
CI Sync  →  Bootstrap → [Hack] → Sync → Finish
```

---

## Hack Flow Capabilities

Hack Flow consumes two mandatory capabilities:

```
Hack Flow
├── ProdOps TDD       → defines how to implement
└── Commit Workflow   → defines how to validate, version, and publish
```

Hack is responsible for implementation. It is not replaced by any of the capabilities — it consumes them.

- **ProdOps TDD:** guides the coding cycle (Contract First, Integration First, Observability First). See [practices/prodops-tdd.md](../../practices/prodops-tdd.md).
- **Commit Workflow:** executes after each Red→Green→Refactor cycle. See [capabilities/commit-workflow/README.md](../../capabilities/commit-workflow/README.md).

For execution mechanics — branching, commands, lint, tests, commit format — see [`prodops/skills/hack/`](../../../../skills/hack/).

---

## Sequence

```
Test → Implementation → Observability → Refactor → Commit → Validation → Evidence
```

### Step 1 — Write the integration test first (Red Bar)

**Pre-condition:** Bootstrap delivered a clean branch, read artifacts, and a verified contract. If this did not happen, return to Bootstrap before continuing.

- Write a test that expresses the desired behavior at the HTTP or event boundary.
- Prioritize integration and acceptance tests over unit tests.
- Run the test and confirm that it fails for the expected behavioral reason.
- Do not advance to implementation until the Red Bar is confirmed.

### Step 2 — Implement the minimum (Green Bar)

- Write the smallest production change that makes the failing test pass.
- Do not add logic not required by the test.
- Do not modify production code to make the test pass artificially.
- Check the reliability requirements that apply to the implemented behavior: timeout, retry with idempotency, exception handling, error messages, HTTP status, controlled degradation. See [reliability-policy.md](../../capabilities/reliability-policy.md#requisitos-de-confiabilidade-por-comportamento).

### Step 3 — Refactor

- Improve the structure while keeping tests green.
- Apply Clean Code rules: explicit names, small functions, clear control flow.
- Run the tests again after refactoring.

### Step 4 — Commit (Commit Workflow)

After each Red→Green→Refactor cycle, execute the Commit Workflow:

```bash
# If hooks are configured, they run automatically on commit:
#   formatter → lint → unit tests → commit-msg validation
git commit -m "<type>(<scope>): <summary>"
```

If hooks are not configured:
```bash
cd api && npm run lint   # formatter + lint with --fix
cd api && npm run test   # unit tests
```

Commit Workflow is not the responsibility of ProdOps TDD — it is a separate capability that Hack consumes. See [capabilities/commit-workflow/README.md](../../capabilities/commit-workflow/README.md).

### Step 5 — Validate observability

After the Green Bar:
- Verify that relevant logs are emitted with the expected structure.
- Verify that error responses have meaningful messages.
- Verify that correlation IDs and tenant context are correctly propagated.
- Confirm that no secrets or PII appear in the logs.

### Step 6 — Run quality checks

```sh
# Inside api/
npm run lint        # ESLint + Prettier with --fix; must exit with code 0
npm run test        # unit tests
./scripts/test-acceptance.sh   # full acceptance suite — when payment behavior or contracts have changed
```

See [prodops/skills/hack/SKILL.md](../../../../skills/hack/SKILL.md) for the complete validation list.

### Step 7 — Record evidence

Before advancing to Sync or Finish:
- Add evidence to `prodops/artifacts/trails/release-trail.md` (Downstream) or to the experiment's `upstream-trail.md` (Upstream).
- Evidence must include: test output, lint output, and a summary of what changed.

---

## Guardrails

- If the contract or acceptance criterion is missing, stop: Bootstrap was not completed. Return to Bootstrap before writing any test.
- Do not skip the Red Bar — a test that was never red may not actually verify the behavior.
- Do not use mocks for own services or business rules. See [practices/prodops-tdd.md](../../practices/prodops-tdd.md) and [testing policy](../../practices/testing-policy.md).
- Do not modify production code solely to make a test pass.
- Do not add features beyond what the current test requires.
- Preserve the existing architecture and module boundaries.

---

## Commit Workflow

During Hack, each commit must follow the Commit Workflow.

**Small commits:** prefer commits that represent a single intent. One commit per confirmed Red Bar is a good size.

**Automatic validation:** if Git hooks are configured (`git config core.hooksPath prodops/journeys/delivery/capabilities/commit-workflow/hooks`), validations run on commit. To configure:

```bash
git config core.hooksPath prodops/journeys/delivery/capabilities/commit-workflow/hooks
```

**Conventional Commit required:**

```
<type>(<scope>): <summary>
```

Valid types: `feat fix docs test refactor perf build ci style chore revert`

See: [capabilities/commit-workflow/README.md — Conventional Commits](../../capabilities/commit-workflow/README.md#conventional-commits)
