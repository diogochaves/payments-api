# Bootstrap

Bootstrap is the first phase of **CI Sync**. It prepares the development environment, creates the branch, and establishes the product context before starting implementation.

---

## Overview

**What it's for:** This is the preparation phase of CI Sync — it does not produce code, it produces **conditions**. It ensures that Hack starts with a clean branch, a ready environment, ProdOps artifacts read, and the contract verified.

**How it works:**

```
Verify ProdOps artifacts → Inspect worktree → Create branch
→ Read OBC + BDD Feature → Confirm contract → Hack can begin
```

**Main guardrails:**

- Do not invent missing OBCs, BDD, or acceptance criteria — explicit block, do not advance to Hack
- Do not start implementation on `main` or a shared branch
- Do not discard local work without confirmation
- Do not expand scope during Bootstrap

**Position in the flow:**

```
CI Sync  →  [Bootstrap] → Hack → Sync → Finish
```

---

## Objective

Deliver to Hack a clean branch, the environment ready, ProdOps artifacts read, and the contract verified.

Bootstrap does not produce code, does not write tests, does not read source code. It produces **context and conditions for Hack to start directly in TDD**.

---

## Pre-condition

**Downstream:**
- Item present in the Iteration Plan with status `Entrou` (`prodops/artifacts/plans/iteration-plan.md`)
- OBC created in `prodops/artifacts/obcs/`
- BDD Feature present in `prodops/artifacts/bdd/`
- Risks documented in `prodops/journeys/assessment/risks.md`
- Entry in the Reliability Plan (`prodops/journeys/assessment/reliability-plans/`)

**Upstream:**
- Experiment created in `prodops/journeys/discovery/experiments/`
- Hypothesis or objective defined

---

## Sequence

### 1. Prepare the environment

```bash
# If necessary (first run or infrastructure change):
./scripts/setup-dev.sh

# Check Git status before creating the branch
git status --short
git fetch origin
git log --oneline -3
```

### 2. Create the branch

```bash
git switch -c <type>/<short-slug>
# Types: feat, fix, chore, refactor, docs
```

Do not start working on `main`. All implementation occurs on a dedicated branch.

### 3. Read ProdOps artifacts

Before any test or code, read:

| Artifact | Location |
|---|---|
| OBC of the capability | `prodops/artifacts/obcs/<capability>.md` |
| BDD Feature | `prodops/artifacts/bdd/<capability>.feature` |
| Risks and mitigations | `prodops/journeys/assessment/risks.md` |
| Iteration Plan | `prodops/artifacts/plans/iteration-plan.md` |

For Upstream: read `prodops/journeys/discovery/experiments/<NNN-slug>/experiment.md`.

### 4. Check existing tests

```bash
ls api/test/
```

Identify whether tests already exist for the behavior being added. Existing tests are the starting point of Hack, not obstacles.

### 5. Confirm that the contract exists

Before going to Hack, the verifiable contract must exist: OBC, BDD Feature, OpenAPI spec, AsyncAPI spec, or schema.

If it does not exist → create the contract before proceeding to Hack.

---

## Bootstrap Checklist

- [ ] Dev environment ready (LocalStack running, `.env` configured).
- [ ] Branch created from updated `main`.
- [ ] OBC read — acceptance criteria understood.
- [ ] BDD Feature read — scenarios understood.
- [ ] Existing tests identified.
- [ ] Verifiable contract confirmed or created.

---

## What Bootstrap delivers to Hack

When Bootstrap is complete, Hack can start **without any additional preparation**:

| Deliverable | State |
|---|---|
| Branch | Created from updated `main` |
| Environment | LocalStack running, `.env` configured, hooks active |
| ProdOps artifacts | OBC, BDD Feature, risks — read and understood |
| Existing tests | Inventoried — Hack knows where it starts from |
| Verifiable contract | Confirmed or created — Hack starts with it in hand |

Hack does not re-read artifacts. Hack does not check the environment. Hack starts at the Red Bar.

## Next stage

→ [Hack Flow](../hack/README.md)
