# Progressive Adoption Levels

> **Status: proposal.** This document describes the target ProdOps adoption model. Some
> referenced capabilities (manifest, capsules) are under construction in parallel branches
> and are part of the model.

## Why progressive adoption

The full framework has 7 phases and 8 artifact types. Requiring everything on day 1 is a
cliff: nobody jumps. Progressive adoption replaces the cliff with a staircase — each level
delivers its own value, costs little more than the previous one, and proves the framework
before asking for more commitment.

**Rule:** each level must pay for itself. If a level does not deliver visible value, it does
not deserve adoption — and the next level will not even be considered.

## Summary

| Level | Name | Adopts | Value | Cost |
|---|---|---|---|---|
| 0 | Receipts | `AGENTS.md` router + Release Trail + doctor | "Your agent leaves evidence" | ~30 min |
| 1 | Contracts | + OBC + BDD Feature + no-mocks gate | Contracts before code | hours |
| 2 | Governed delivery | + full CI Sync pipeline + hooks + quality gates | Governed local delivery | days |
| 3 | Full governance | + CI Async (ship/validate/promote) + SLOs + trail-coupled CI | Full governance | weeks |

---

## Level 0 — "Receipts"

Your AI agent starts leaving evidence of everything it does.

| What you adopt | Description |
|---|---|
| `AGENTS.md` router | Short file at the root that points the agent to the right context |
| Release Trail | `prodops/artifacts/trails/release-trail.md` — append-only log of every delivery |
| Doctor | `prodops/scripts/doctor.sh` — verifies the structure has not rotted |

**What you gain:** every agent-made change becomes a dated trail entry — what changed,
which tests ran, which files were touched. Auditing of AI work with no process beyond
"write the receipt".

**Done-criteria:**
- [ ] `AGENTS.md` exists at the root and the agent reads it at session start
- [ ] `prodops/scripts/doctor.sh` runs green
- [ ] At least 1 agent-executed task produced a Release Trail entry

**Ready for Level 1 when:** you look at the trail and think "the evidence exists, but
nothing guarantees the agent implemented the *right* thing".

---

## Level 1 — "Contracts"

Contracts before code: the agent only implements what is specified and observable.

| What you adopt | Description |
|---|---|
| OBC | Observable Business Contract in `prodops/artifacts/obcs/` — formal acceptance criterion |
| BDD Feature | Gherkin scenarios in `prodops/artifacts/bdd/` backing the acceptance tests |
| No-mocks gate | Grep that blocks `jest.fn()`, `spyOn(...).mock*` and `.overrideProvider()` in acceptance tests |

**What you gain:** the agent cannot "pass the tests" by mocking reality. Acceptance tests
exercise real services; the delivered behavior is the contracted behavior.

**Done-criteria:**
- [ ] At least 1 committed OBC with observable metrics
- [ ] BDD Feature covering the OBC scenarios, with green acceptance tests
- [ ] No-mocks gate running (locally or in CI) and blocking violations

**Ready for Level 2 when:** the contracts work, but each delivery follows a different
ad-hoc path — you want every delivery to go through the same funnel.

---

## Level 2 — "Governed delivery"

Every local delivery goes through the same synchronous pipeline, with gates that truly block.

| What you adopt | Description |
|---|---|
| Full CI Sync | Bootstrap → Hack → Sync → Finish (`prodops/journeys/delivery/phases/`) |
| Hooks | Agent automation: gates run without depending on human discipline |
| Quality gates | `prodops/journeys/delivery/phases/finish/quality-gates.md` — what blocks merge |
| Manifest | `manifest.yaml` describing the instance's stack, paths, and gates |

**What you gain:** predictable delivery. The agent starts with context (Bootstrap),
implements via no-mocks TDD (Hack), integrates (Sync), and only closes with trail + green
gates (Finish).

**Done-criteria:**
- [ ] The 4 CI Sync phases documented and used in every delivery
- [ ] Hooks installed: gates execute automatically
- [ ] Zero deliveries outside the pipeline in the last 2 weeks

**Ready for Level 3 when:** what leaves the machine is governed, but the path to production
(deploy, environment validation, promotion) is still manual or invisible.

---

## Level 3 — "Full governance"

Governance extends from the local machine all the way to production.

| What you adopt | Description |
|---|---|
| CI Async | Ship → Validate → Promote as platform pipelines |
| SLO validation | Promotion conditioned on SLOs measured in an environment, not on "looks ok" |
| Trail-coupled CI | Pipeline requires a Release Trail entry; a PR without evidence does not pass |
| Capsules | Versioned units of context/delivery that travel with the release |

**What you gain:** end-to-end traceability — from Intent to OBC to code to deploy to SLO in
production. Evidence-based rollback and promotion.

**Done-criteria:**
- [ ] Ship/Validate/Promote running as automated pipelines
- [ ] At least 1 promotion blocked or approved by SLO validation
- [ ] CI rejects PRs without Release Trail coupling

---

## How to start

Start at Level 0 following the [quickstart](quickstart.en.md) — 10 minutes, a new project,
and your agent already leaves receipts.
