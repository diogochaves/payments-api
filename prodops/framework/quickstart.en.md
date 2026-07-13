# Quickstart — Level 0 in 10 minutes

> **Status: proposal.** Walkthrough of Level 0 ("Receipts") from the
> [adoption levels](adoption-levels.en.md) in a **new** project — not in this repository.

At the end: your AI agent executes a task and leaves a verifiable receipt. No process,
no ceremony — just evidence.

## Prerequisites

- A git repository (any stack)
- An AI agent that reads `AGENTS.md` (Claude Code, Copilot, Codex, Cursor)

## Step 1 — Copy the structure (~3 min)

Three files. That is all of Level 0.

```
your-project/
├── AGENTS.md                                  # router: points the agent to context
└── prodops/
    ├── artifacts/trails/release-trail.md      # append-only delivery log
    └── scripts/doctor.sh                      # verifies the structure exists
```

**`AGENTS.md`** (project root):

```markdown
# Operating Guide

After completing any task that changes code, record an entry in
`prodops/artifacts/trails/release-trail.md` with: date/time, summary, files
touched, and validations executed (test/build commands). Most recent entries
at the top. Never edit previous entries.
```

**`prodops/artifacts/trails/release-trail.md`**:

```markdown
# Release Trail

Append-only log. Every delivery produces an entry: `## YYYY-MM-DD HH:MM`,
Summary, Code (files), Tests (validations executed).
```

**`prodops/scripts/doctor.sh`**:

```bash
#!/usr/bin/env bash
set -euo pipefail
for path in AGENTS.md prodops/artifacts/trails/release-trail.md; do
  [[ -e "$path" ]] && echo "PASS: $path" || { echo "FAIL: missing $path"; exit 1; }
done
```

## Step 2 — Verify with the doctor (~1 min)

```bash
chmod +x prodops/scripts/doctor.sh && ./prodops/scripts/doctor.sh
```

Two `PASS` lines. Structure in place.

## Step 3 — Run a small task (~4 min)

Open your agent and ask for something real and small, for example:

> Add e-mail validation to the signup form and run the tests.

The agent reads `AGENTS.md`, makes the change — and before finishing, writes the receipt.

## Step 4 — Watch the evidence appear (~2 min)

```bash
head -20 prodops/artifacts/trails/release-trail.md
```

```markdown
## 2026-07-11 14:32

### Summary
Added e-mail validation to the signup form.

### Code
- `src/forms/signup.ts`

### Tests
- Validation executed: `npm test -- signup`
```

That is Level 0 working: **your agent leaves evidence**. Who changed what, when, and
what was validated — without you asking on every task.

## Teaser — when the gate catches the agent

The trail records *what* the agent did. The next level controls *how*. A sample: the
Level 1 no-mocks gate is a grep that forbids test doubles in acceptance tests:

```bash
grep -rn "jest\.fn()\|spyOn(.*)\.mock\|overrideProvider" test/ && exit 1 || echo "PASS"
```

Ask the agent for a feature with a test and run the gate. Sooner or later this moment arrives:

```
test/payment.e2e-spec.ts:12: const gateway = { charge: jest.fn().mockResolvedValue({ ok: true }) };
FAIL: acceptance test uses a test double
```

The agent "passed the tests" by mocking the gateway — and **got caught**. It goes back,
brings up a real dependency (e.g. LocalStack) and rewrites the test against the real
service. That is the difference between evidence and assurance.

## Next step — Level 1

Contracts before code: OBC + BDD Feature + permanent no-mocks gate. Readiness and
done-criteria in [adoption-levels.en.md](adoption-levels.en.md#level-1--contracts).
