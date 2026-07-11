# Payments API / ProdOps Framework — Full Project Review

> Recap of a deep-dive analysis session (2026-07-10/11). Covers: what this repo is, how the
> ProdOps framework works, how to use it, who it's for, an evidence-based audit of whether it
> does what it claims, a prioritized action plan, a **ready-to-implement token-economy
> redesign spec (§7)**, and a **future-direction roadmap for adoption/contributions (§8)** —
> to execute either, start a session and say: "implement §7 (or §8.<item>) of PROJECT-REVIEW.md".
>
> Method: three parallel audit agents (skills/prompts quality; artifacts vs. reality;
> documentation architecture) + direct reading of the framework core, git history, CI, and hooks.

---

## 1. What is this repo?

A **teaching/reference project from ProdOps University** with two intertwined halves:

| Half | What it is |
|---|---|
| `api/` | A real, working **NestJS payments gateway** (invoices, cancel, payment confirmation, webhooks, API-token auth). Multi-tenant, idempotent, DynamoDB + SQS via LocalStack, deployable as server (port 3011) or AWS Lambda (SAM). Provider routing: Asaas implemented, Itaú stubbed. Datadog observability, PII redaction in logs. |
| `prodops/` | The **ProdOps Framework** — a product-operations methodology (164 markdown files, ~92k words) governing every change from idea to production, plus agent-executable skills. |

**The payments code is the *subject*; ProdOps is the *product*.** Git activity confirms it: in the
last 3 months, 53 commits touched `prodops/` vs 18 touching `api/src` (~3:1). Explicitly
educational, not production-ready. Apache-2.0.

Other pieces: `validation-workbench/` (Vite/React bench for Upstream exploration, port 5173),
`scripts/` (setup/deploy/test), `.claude/commands/` + `.github/prompts/` + `.codex/` (agent
entry points), `docs/` (a **stale legacy doc tree** — see findings).

---

## 2. How the framework works

### The canonical flow (`prodops/framework/flow.md`)

```
Origin Stream → Intent → Exploration → OBC → Iteration Plan → Reliability Plan → Delivery → Operation
```

Each arrow is a gate; you don't advance without the previous stage's artifact:

1. **Origin Stream** — classify where the need came from: Business | Enterprise | Team | Technology.
2. **Intent** — formalize the "why" without a solution (`prodops/business-intents/`).
3. **Exploration** — reduce uncertainty via experiments/spikes/Event Storming
   (`prodops/journeys/discovery/experiments/`). Code here is disposable; learning is the output.
4. **OBC (Observable Business Contract)** — measurable success criteria (`prodops/artifacts/obcs/`)
   + BDD Feature (`prodops/artifacts/bdd/`). **No OBC → no Downstream.**
5. **Iteration Plan** — formal commitment, status `Entrou` (`prodops/artifacts/plans/iteration-plan.md`).
6. **Reliability Plan** — SLOs, mitigations, rollback criteria (`prodops/journeys/assessment/reliability-plans/`).
7. **Delivery** — the 7-phase pipeline (below), with evidence appended to
   `prodops/artifacts/trails/release-trail.md`.
8. **Operation** — runbooks, SLO monitoring, incidents → feeds new Intents.

### Cross-cutting structure

- **Execution modes:** *Upstream* (explore, low commitment, throwaway code) vs *Downstream*
  (governed implementation of approved items).
- **5 Journeys:** Discovery, Delivery, Operation, Assessment, Diligence.
- **Delivery pipeline**, split local vs platform:

```
CI Sync  (local):    Bootstrap → Hack → Sync → Finish
CI Async (platform): Ship → Validate → Promote
```

- **Bootstrap** — branch + read artifacts + verify contract (being expanded to "local sandbox runs", issue #8)
- **Hack** — ProdOps TDD: Red Bar (integration test from contract) → Green → Yellow (refactor + observability/reliability checks)
- **Sync** — `rebase` (git integrity) + `align` (make ProdOps artifacts match what was built)
- **Finish** — quality gates, push, PR
- **Ship / Validate / Promote** — build/deploy, validate the OBC at runtime, controlled promotion

### Seven principles (`prodops/framework/principles.md`)

Product context first · Upstream before commitment · Contracts before implementation ·
Observability as a deliverable · Evidence-based decisions · Reliability first-class ·
No test-only shortcuts in production code.

### The execution engine

The framework "runs" as **prompts for AI agents**: each phase is a skill
(`prodops/skills/*/SKILL.md`) invoked via `/bootstrap`, `/hack`, `/sync`, `/finish`, `/ship`,
`/validate`, `/promote` (Claude Code), mirrored for Copilot (`.github/prompts/`) and Codex
(`.codex/`). `AGENTS.md` / `CLAUDE.md` are the agent operating guides. Plus native git hooks
(`prodops/journeys/delivery/capabilities/commit-workflow/`) and `prodops/scripts/doctor.sh`.

---

## 3. How to use it / who it's for / dependencies

### What ProdOps is NOT (operationally)

- **Not software.** No binary, no CLI, no docker image, no service. It is markdown conventions +
  agent prompts + context files + a bit of bash. The runtime is *you + an AI coding agent + git*.
- **Not an installable package.** There is no clean separation between framework core (generic)
  and instance (payments-specific). Skills hardcode `cd api && npm run lint`,
  `./scripts/test-acceptance.sh`, event-storming JSON keys, payments smoke checks.

### Dependency chain

| Layer | Actually needs |
|---|---|
| ProdOps framework | git, bash, markdown, an AI agent (an existing Claude/Copilot subscription — zero API calls of its own, no provider tokens) |
| Payments demo app | Node 22, Docker/LocalStack, AWS SAM, Asaas sandbox, jq; optionally real AWS + Datadog |

Docker/AWS/Asaas/Datadog are dependencies of the **demo app**, not the framework. The framework
concept could govern a Python monolith on a bare VPS.

### Using it in a new project (today)

There is no `npx create-prodops`. The realistic path: copy the `prodops/` directory structure +
skills + `AGENTS.md`/`CLAUDE.md` + hooks, then **rewrite every project-specific command and
delete all payments artifacts** (~70% of content is instance-specific). It is a
*reference to imitate*, not a *dependency to install*. A `prodops-core` template repo is the
project's most obvious missing piece.

### Who gets value

- **Tech leads designing their own AI-agent workflow** — steal the patterns: skills-as-phases,
  thin command wrappers, contract-first TDD, evidence trails, hard guardrails.
- **Students of the ProdOps University course** — it's the course material.

### Who doesn't (yet)

- Anyone wanting a turnkey tool.
- Small teams shipping fast — 164 md files and a 7-phase pipeline is heavy ceremony; the
  cost/benefit fits teaching scale or serious-governance scale (fintech, compliance).

**Blunt summary:** today its value is as a *worked example* of making AI agents produce governed,
traceable software — not as a tool.

---

## 4. Audit findings

### 4.1 Is it practiced or theater? → Genuinely practiced (post-adoption)

- **Release Trail is real**: touched by **14 commits over time** (2026-06-30 → 07-08), dated,
  detailed entries (Summary / OBC / BDD / Code / Tests / Decision Trail). Append-only in fact,
  not just in name.
- **Post-framework commits couple code + artifacts + trail** (e.g. boleto: 4 src files + trail;
  another: 17 src + 32 prodops files).
- **BDD ↔ tests verified**: `create-invoice-boleto.feature` 8 scenarios = 8 `it()` in
  `api/test/criar-invoice-boleto.e2e-spec.ts`. api-token and create-invoice features map closely too.
- **OBCs are measurable**: numeric SLI targets (99.9%, 100%), required log dimensions per event,
  concrete JSON response contracts.
- **No-mocks policy 100% upheld**: `grep jest.fn|overrideProvider|jest.mock` across `api/test`
  and `api/src` → **zero hits**. All 5 e2e suites run a real app fixture against LocalStack.
- **Intellectual honesty**: code/OBC divergence (`externalReference` = invoiceId vs order id)
  recorded as a Decision Trail entry instead of silently editing the doc. Operation stubs honestly
  say "no incidents yet". Real 240-line runbooks exist (RB-001).
- **Assessment is real**: risks.md 232 lines (premortem-derived, incl. a R$500M feature-flag
  risk), event-storming plan.json 1529 lines, architecture overview largely matches `api/src`.

**Caveats:**
- **Retrofit seam**: pre-framework era of commits like *"Vibecoding do Joe"* (10–37 src files,
  zero artifacts). The framework was wrapped around an existing codebase. Only 1 Intent and 7
  experiments demonstrate the full loop end-to-end.
- **The loop is skippable**: commit `cc603c5` (`GET /invoices/:id`, a real contract change) landed
  post-framework with **no trail entry, no architecture update**. Enforcement is discipline, not tooling.
- **Evidence dirs are hollow**: 6 of 7 experiment `evidence/` dirs contain only `.gitkeep` —
  "Evidence-based decisions" with empty evidence folders.

### 4.2 The central irony: the framework has the disease it treats

Its thesis is "artifacts must stay consistent with reality; drift must be caught." Judged by its
own principle:

- **`.codex/instructions.md` is 100% dead** — all 5 referenced paths don't exist. A Codex agent
  obeying it fails on step one.
- Trail + iteration plan cite `api/test/create-invoice.acceptance.e2e-spec.ts` — **file doesn't
  exist** (renamed to `criar-invoice.e2e-spec.ts`).
- `architecture/overview.md` misses `AdminTokenController` and `GET /invoices/:id` — despite its
  own change-table naming "new route" as requiring an update.
- `documentation-review.md` claims the operating model has "7 camadas" (it has 11; its own diagram
  shows 9) and still uses the retired term "Business Intent".
- EXP-001's trail cites `journeys/discovery/features/*.feature` paths that no longer exist.
- **`doctor.sh` — the safety net — doesn't scan `.codex/`, `.claude/`, `.github/`, or `docs/`** —
  exactly where the rot is.

### 4.3 Taxonomy: over-engineered; its own docs disagree

- The layer hierarchy is drawn **four different ways** (9 / 11 / 8 / "7" layers) in
  `prodops/README.md`, `operating-model.md`, `flow.md`, `documentation-review.md`.
- **"Capability" is overloaded** despite the glossary's own "one concept = one name" rule:
  5 governed *Delivery Capabilities* vs ~20 phase sub-steps (Build, Sign, Rollback, Smoke Tests…)
  also called "capabilities" in Ship/Validate/Promote docs.
- Three names for one phase (Exploration / Discovery / Upstream) required a disambiguation table —
  a symptom of too many terms.
- Practice count drift: `practices/README.md` lists 1 practice; `canonical-paths.md` lists 3;
  the directory holds 3.
- `literature-review-report.md` shows a whole review cycle spent on renames (Business Intent →
  Intent; Outcome-Based Criterion → Observable Business Contract). Careful work, but taxonomy
  maintenance accrues faster than it's paid down.

### 4.4 Skills/prompts: best and worst of the repo

**Excellent (A-grade agent prompts):** `hack/steps/start`, `hack/steps/tdd`, `hack/steps/commit`,
`sync/steps/rebase` — exact commands, decision branches, stop conditions ("if fast-forward fails,
surface the conflict — do not force-merge"). Safety posture is best-in-class: no `--no-verify`,
no `git add -A`, no force-push, no `reset --hard`, PR only when asked, **no auto-merge anywhere**.
The thin-wrapper pattern (`.claude/commands/*` and `.github/prompts/*` all point to one SKILL.md)
is exactly right — zero drift in that layer.

**Problems:**
1. **Verifiability collapses in CI Async**: Hack gates are exit-code checkable; Finish/Validate/
   Promote degenerate into "run broader validation *when risk warrants it*" and gates that are
   unverifiable by construction ("the ProdOps context *was read*").
2. **False-blocker vocabulary bug**: `upstream/steps/move-to-downstream/SKILL.md` gates on
   recommendation `Promover`, but real experiments say `"Aprovar Downstream"` (007) and
   `"Move downstream"` (005); the template is free text. A literal agent would refuse to promote.
   **Prompts are code; this is a failing test.**
3. **Token economy is inverted**: the mandatory `AGENTS.md` reading chain is ~9,600 words
   (~13k tokens) *before* the skill, the OBC, or any code — the glossary alone (2,113 words) is
   bigger than any skill — and `hack/SKILL.md` ("read only focused context") directly contradicts
   it. Whole `prodops/` ≈ 120k tokens.
4. **Duplication tax**: pipeline string in ~15 files; Finish checklist in triplicate; Origin
   Streams fully defined twice; **allowed conventional-commit types differ** between
   `hack/steps/commit` (6 types) and `phases/hack/README.md` (11 types); Bootstrap branch
   creation differs between skill (`git checkout -b --track`) and phase README (`git switch -c`).
   One phase rename = ~15-file edit. `canonical-paths.md` exists to be the single source of truth
   and isn't honored.

### 4.5 Docs vs. running code mismatches

- Commit-msg hook allows **100-char** summaries; README mandates **72**.
- `pre-push.sh` advertises "Contracts → Quality gates" steps that always print "skipping"
  (require a Makefile that doesn't exist).
- "Zero dependency / Git First" hooks secretly require **python3** (`has_script()` parses package.json).
- Team-stream OBC says "hook runs in <2s" while `pre-commit` runs the full jest suite — slow hooks
  breed `--no-verify` culture.
- Hooks are **not active by default** (`core.hooksPath` unset) yet Bootstrap's README assumes they are.
- README claims Formatter = `npm run lint`; the hook actually runs `npm run format` then lint.
- `api` `test:acceptance` runs only 4 hard-coded spec files with `--forceExit`; docs call it the
  "full acceptance suite".
- **`docs/` at repo root is a stale parallel universe**: its own product deck, BDD features, event
  storming; documents endpoints that contradict the code (the reliability plan itself admits it).
  Ungoverned by `canonical-paths.md`, unflagged by `doctor.sh`. Also orthographic chaos:
  "Siara" ×27 vs "Siará" ×12.
- Phase READMEs are structurally uneven: Bootstrap/Hack rich; **Sync/Finish thin**; two competing
  README templates (only 5 of 7 phases have the "Voltar para Delivery" nav header).
- Orphaned templates never wired into any phase: `test-plan.md`, `reliability-checklist.md`,
  `release-entry.md`, `pull-request-checklist.md`. Two `iteration-backlog` files coexist.
- Language mix: skills in English, phase docs in PT-BR, two index READMEs in English among PT-BR
  siblings — same rules restated in two languages already drifted (commit-type lists).

### 4.6 Risk notes (all documented/deliberate, worth awareness)

- `deploy-to-sandbox` intentionally bypasses approval gates to **real AWS** (experiment
  environment: no reviewers, lint+build only), guarded only by IAM prefix scope (`experiment-*`).
- CI has deploy/release workflows but **no PR quality-gate workflow** (confirms issue #5's premise).

### 4.7 Scorecard

| Dimension | Grade | One-liner |
|---|---|---|
| Practiced or theater? | **A−** | Real loop, real trail, real tests; one skipped commit, hollow evidence dirs |
| Core ideas (OBC, trails, no-mocks, Up/Downstream) | **A** | Genuinely good engineering doctrine |
| Step-level agent prompts | **A** | Concrete, safe, executable |
| Phase-level / CI-Async prompts | **C** | Aspirational, unverifiable gates |
| Taxonomy / conceptual economy | **C−** | 4 disagreeing hierarchies, overloaded "capability" |
| Self-consistency / drift control | **D+** | The framework's own disease; doctor.sh doesn't look where it rots |
| Token/context economy for agents | **C** | 13–18k tokens of preamble before work |
| Safety guardrails | **A** | Best-in-class git discipline |
| Portability / adoptability | **D** | No core/instance split, no installer |

---

## 5. Where the project is heading (open issues)

The 6 open issues converge on turning *documented process* into *mechanically enforced process*:

- **#8 refine(bootstrap)** — local sandbox (stack, seeds, tokens, smoke check `POST /invoices → 201`)
  becomes a Bootstrap completion criterion.
- **#9 refine(hack)** — decompose into `start → tdd → commit` with per-cycle quality gates
  (security/quality/docs) as exit criteria.
- **#10 refine(sync)** — rebase = repo integrity vs align = artifact integrity, with a canonical
  change→artifact table and explicit non-responsibilities.
- **#11 refine(finish)** — pipeline-grade local validation before push; PR from canonical
  template; auto-merge on green CI.
- **#5** — layered GitHub Actions PR review (lint/type/test/build → security/CodeQL →
  contract/regression → coverage) + branch protection.
- **#7** — a Diligence-journey trigger firing a parallel agent to audit Discovery→Delivery and
  Delivery→Operation handoffs for inconsistency. (This matches the audit's #1 recommendation.)

---

## 6. What we must do — prioritized action plan

1. **Weaponize `doctor.sh` (highest leverage — this is issue #7).** Repo-wide link/path checking
   including `.codex/`, `.claude/`, `.github/`, `docs/`; run in CI on every PR. Catches ~half of
   all findings above (dead `.codex`, stale trail refs, dead experiment feature paths).
2. **Progressive disclosure for agents.** Invert the reading model: the skill is the entry point
   and pulls in only what its phase needs. Cut the mandatory preamble from ~13k to <2k tokens.
   Resolve the AGENTS.md ↔ hack/SKILL.md contradiction. **→ Full implementation spec in §7.**
3. **One taxonomy source.** A single (machine-readable) model of layers/phases/capabilities that
   all docs reference instead of restate; delete the other three hierarchy diagrams; resolve the
   Delivery-Capability vs phase-sub-step naming; fix `documentation-review.md`.
4. **Enum the gates.** Promotion decision values (`Promover` | `Promover com restrição` |
   `Descartar`…) as an enum in the experiment template; one canonical commit-type list; reconcile
   72 vs 100 chars in the hook; fix pre-push's phantom steps; declare or remove the python3 dependency.
5. **Delete or quarantine `docs/`.** A stale twin that contradicts the code is worse than no twin.
   At minimum add it to canonical-paths' legacy table and doctor.sh's guard.
6. **Couple code to trail mechanically.** CI check: a PR touching `api/src` must touch
   `release-trail.md` or carry an explicit `no-trail-needed` marker. Turns the core promise from
   etiquette into a gate (would have caught `cc603c5`).
7. **Fix immediate breakages:** rewrite `.codex/instructions.md`; update `architecture/overview.md`
   (AdminTokenController, `GET /invoices/:id`); fix stale test filename in trail + iteration plan;
   backfill or drop empty `evidence/` dirs.
8. **Land the four refine issues (#8–#11)** — they correctly target the verifiability gap in
   Bootstrap/Hack/Sync/Finish. Add #5's PR workflow as the backbone for #11's auto-merge.
9. **(Strategic) Extract `prodops-core`.** Split framework (generic structure, skills, templates)
   from instance (payments artifacts, hardcoded commands). This is the difference between a worked
   example and an adoptable product — and the answer to "how do I use this in another project".
10. **Speed up the hooks.** Scope pre-commit to staged files / changed packages so the "<2s" OBC
    is realistic; activate hooks in Bootstrap (part of #8).

---

## 7. Token-economy redesign — implementation spec

> Self-contained spec. A new session can implement this from here without re-deriving the
> analysis. Goal: cut per-task agent pre-work from ~13–18k tokens to ~2.5–3k with zero loss of
> execution quality, while also killing the duplication that causes drift (§4.2–§4.4).

### 7.1 The design error being fixed

Humans pay onboarding cost once and amortize it; **agents pay it per session**. The framework is
written as a curriculum (AGENTS.md's 11-step mandatory reading order: principles → glossary →
canonical-paths → flow → origin-streams → operating-model → execution-model → journey → phase →
skill ≈ 9,600 words ≈ 13k tokens) but an agent executing a task needs only: *what to do, which
commands to run, which gates must pass, where the contract lives* (~1–2k tokens).
`hack/SKILL.md` ("read only focused context") already contradicts AGENTS.md — resolve in favor
of the skill.

**Where tokens go today, and the verdict per bucket:**

| Spend | ~Size | Verdict |
|---|---|---|
| Doctrine (glossary 2.1k words, origin-streams 1.2k, operating-model, flow) | ~8k tokens | Waste *for execution* — it's courseware. Keep for humans, remove from agent path. |
| Duplication (pipeline ×15 files, Finish checklist ×3, origin streams ×2, PT/EN restatement) | ~15–20% of corpus | Pure waste + the drift vector. Derive from one source. |
| Rules-as-prose (no-mocks ×3 places, commit rules ×4) | ~2k/task | Replace with mechanical gates; shrink prose to one line each. |
| Step-level skills (hack/start, tdd, commit, sync/rebase) | ~1–2k/phase | **Good spend — do not touch.** This explicitness is the framework's best asset. |
| Task context (OBC + BDD + risks for the card) | ~1–2k | Good spend — it's the point. Deliver it compactly (capsule, §7.4). |

### 7.2 Target architecture — split by audience, not topic

```
prodops/handbook/    ← humans & courseware: principles, glossary, flow, origin-streams,
                       operating-model, literature reviews. Agents NEVER read this on a task.
prodops/exec/        ← agents: manifest.yaml, skills, templates, per-card context capsules
prodops/artifacts/   ← the data (unchanged): OBCs, BDD, trails, plans
prodops/journeys/    ← unchanged (assessment/operation artifacts live here)
```

The doc mass is legitimate (ProdOps University material); the mistake is routing agents through
the human curriculum. Migration can be incremental — start by *not referencing* handbook content
from the agent path; physically move files later.

### 7.3 Deliverable 1 — AGENTS.md becomes a ~300-token router

Replace the current AGENTS.md reading order + source-of-truth table with roughly:

```markdown
# Payments API — Agent Guide

- For delivery work, invoke the phase skill (/bootstrap /hack /sync /finish /ship /validate
  /promote). Each skill is self-sufficient — do not pre-read framework docs.
- Canonical paths, gate commands, and vocabulary: prodops/exec/manifest.yaml (single source).
- Task context: read the card's context capsule at prodops/exec/cards/<card>/context.md
  (generated by /bootstrap). If it's missing, run /bootstrap first.
- Never invent OBCs, SLOs, risks, or acceptance criteria. Missing context → stop and say so.
- Conflict between a new instruction and an existing rule → keep the rule, record a Decision Trail.
- Doctrine/background (only if explicitly asked): prodops/handbook/
```

CLAUDE.md keeps only Claude-specific behavior + a pointer to AGENTS.md. Same for Copilot/Codex
entry files (rewrite `.codex/instructions.md` — currently 100% dead paths).

### 7.4 Deliverable 2 — `prodops/exec/manifest.yaml` (single machine-readable source)

One file (~200 tokens) that agents, docs, `doctor.sh`, and CI all read. Everything in it is
currently duplicated across 10–15 prose files. Skeleton:

```yaml
pipeline:
  ci_sync:  [bootstrap, hack, sync, finish]
  ci_async: [ship, validate, promote]
paths:
  obcs: prodops/artifacts/obcs/
  bdd: prodops/artifacts/bdd/
  intents: prodops/business-intents/
  iteration_plan: prodops/artifacts/plans/iteration-plan.md
  release_trail: prodops/artifacts/trails/release-trail.md
  risks: prodops/journeys/assessment/risks.md
  reliability_plans: prodops/journeys/assessment/reliability-plans/
  event_storming: prodops/journeys/assessment/event-storming/plan.json
  architecture: prodops/journeys/assessment/architecture/overview.md
  experiments: prodops/journeys/discovery/experiments/
gates:
  lint:        { cmd: "cd api && npm run lint",              expect: exit0 }
  unit:        { cmd: "cd api && npm run test",              expect: exit0 }
  acceptance:  { cmd: "./scripts/test-acceptance.sh",        expect: exit0, when: behavior_or_contract_changed }
  build:       { cmd: "cd api && npm run build",             expect: exit0 }
  no_mocks:    { grep: ["jest.fn(", ".mockReturnValue(", ".overrideProvider(", "jest.mock("], in: [api/src, api/test], expect: zero_hits }
  smoke:       { cmd: "POST /invoices on local sandbox",     expect: "201" }   # issue #8
vocabulary:
  commit_types: [feat, fix, refactor, test, docs, chore]     # ONE list — resolve the 6-vs-11 drift
  commit_summary_max: 72                                     # then fix the hook regex (currently 100)
  promotion_decision: [Promover, Promover com restrição, Não promover, Descartar]  # enum — fixes the false-blocker bug (§4.4.2)
  iteration_status: [Entrou, Adiada, Saiu]
```

Rules: (a) prose documents may *reference* manifest values, never restate them; (b) `doctor.sh`
validates every `paths:` entry exists and greps the repo (including `.claude/`, `.codex/`,
`.github/`, `docs/`) for stale restatements of pipeline/vocabulary; (c) experiment template's
"Decisão Recomendada" becomes a field constrained to `promotion_decision`.

### 7.5 Deliverable 3 — context capsules (pay the reading tax once, in Bootstrap)

Bootstrap is where broad reading legitimately happens. Its output becomes a **generated,
compressed artifact** the rest of the pipeline links against:

`prodops/exec/cards/<card-slug>/context.md` (~1k tokens), template:

```markdown
# Card: <slug>            (generated by /bootstrap — do not edit by hand)
OBC: <path> — success criteria: <the 3–6 measurable lines, verbatim>
BDD: <path> — scenarios: <numbered one-line list>
Risks: <only the entries relevant to this card, one line each + ID>
Reliability: <SLOs/timeouts/idempotency requirements for this card>
Contract: <endpoint(s), request/response essentials>
Commands: lint | unit | acceptance | smoke   (from manifest gates)
Branch: <type>/<slug>   Base: <base>
Open questions: <anything marked pending — agent must not resolve these silently>
```

Hack/Sync/Finish then read **capsule + their own skill only**. Bootstrap's completion criterion
(aligning with issue #8): capsule written + smoke gate passes.

### 7.6 Deliverable 4 — convert skills to self-sufficient entry points

Pattern (apply to `/hack` first as the pilot, then the rest):

1. Delete any "first read AGENTS.md / framework docs" preamble.
2. Inline the happy path completely (the step skills hack/start, tdd, commit already do this well
   — they are the model, not the problem).
3. Front-matter: `requires: capsule` + the manifest gates the phase must pass.
4. Edge cases move to `references/` loaded only on demand (pattern already exists — keep it).
5. Phase READMEs under `journeys/delivery/phases/` become thin human-facing overviews that link
   to the skill — never a second copy of the procedure (fixes the bootstrap `checkout -b --track`
   vs `switch -c` drift and the 6-vs-11 commit-type drift, §4.4.4).

### 7.7 Deliverable 5 — move rules from prose to gates, then delete the prose

Persuasion tokens are only justified where enforcement is impossible. Migrations:

| Rule (today: prose, restated 3–4×) | Becomes | Prose left |
|---|---|---|
| No-mocks policy | pre-commit/CI grep (patterns already enumerated in `hack/references/workflow.md`) | 1 line + gate name |
| Conventional commits, 72-char summary | commit-msg hook (exists — fix regex 100→72) | 1 line |
| Trail coupling ("update release trail") | CI: PR touching `api/src` must touch `release_trail` or carry `no-trail-needed` label | 1 line |
| Artifact/link integrity | `doctor.sh` repo-wide (incl. `.codex/`, `.claude/`, `.github/`, `docs/`) in CI | — |
| "Read the ProdOps context first" (unverifiable) | capsule existence check (`requires: capsule`) | — |

### 7.8 Deliverable 6 — style & language consolidation

- **One language for normative text** (pick PT-BR or EN; today skills=EN, phase docs=PT-BR and
  the two restatements already contradict each other). The other audience gets a pointer, not a
  translation.
- Glossary: collapse the 5-section template (Definição/Propósito/Quando usar/Quando não usar/
  Relação ≈ 80 words each ×30 entries) into a table; move to `handbook/`.
- Collapse the 4 disagreeing layer diagrams (§4.3) into one, derived from the manifest.

### 7.9 Expected numbers

| | Today | After |
|---|---|---|
| Router (AGENTS.md) | 534 words + mandatory 9.6k-word chain | ~300 tokens |
| Phase entry | skill + phase README + references (overlapping) | self-sufficient skill ~1k |
| Task context | scattered across the artifacts tree | capsule ~1k |
| Paths/gates/vocabulary | canonical-paths + glossary + ~15 restatements | manifest ~200 |
| **Per-task pre-work** | **~13–18k tokens** | **~2.5–3k tokens (~80% cut)** |

Quality is expected to *improve*: 13k tokens of taxonomy between the agent and the contract is
attention-diluting noise, and the manifest+gates eliminate the drift class of §4.2.

### 7.10 Implementation order (each step independently shippable)

1. **`manifest.yaml`** + extend `doctor.sh` to validate it repo-wide (also closes issue #7's intent).
2. **Rewrite AGENTS.md as the router**; slim CLAUDE.md; rewrite dead `.codex/instructions.md`.
3. **Convert `/hack`** to self-sufficient (pilot); measure real token usage before/after on one card.
4. **Capsule template + generation step in `/bootstrap`** (merges naturally with issue #8's sandbox work).
5. Convert remaining skills; thin out the phase READMEs.
6. Rules→gates migrations (§7.7) incl. hook regex fix and trail-coupling CI check.
7. Move doctrine to `handbook/`; collapse glossary + layer diagrams; single-language pass.

Acceptance criteria: an agent given only "implement card X" completes Bootstrap→Finish reading
< 4k tokens of process material; `doctor.sh` exits 0; no prose file restates a manifest value.

**Do-not-do list:** don't make step-level skills vaguer to save tokens (their explicitness is the
asset); don't delete the doctrine (relocate it); don't hand-write capsules (generated or nothing —
a stale capsule is worse than none).

---

## 8. Future direction — adoption, contributions, positioning

> Strategic roadmap for making ProdOps usable by other people and attractive to contributors.
> To execute: start a session and say "implement <item> of §8 of PROJECT-REVIEW.md".

### 8.1 Positioning: pick the wedge

The product should lead as **"governed delivery for AI coding agents"** — guardrails, contracts,
and evidence trails for teams whose code is increasingly agent-written. Rationale: the generic
process-framework space is crowded/cold; the agent-governance space is hot/thin; ProdOps has
verified receipts (BDD↔test parity, zero mock violations, real evidence trail) and covers the
*whole* loop (reliability, observability, operation) where spec-driven competitors stop at
spec→code. Courseware/taxonomy stays as the "why", not the entry point.

### 8.2 The four adoption blockers, in order

1. **Token economy** — implement §7 first. Nobody adopts a 13k-token preamble; landing it is also
   proof the maintainers practice what they preach.
2. **Core/instance split** — extract `prodops-core` (structure, generic skills, manifest schema,
   templates, hooks, doctor) from the payments instance. Today "adoption" means deleting 70% of
   someone else's project. Biggest single blocker.
3. **English as canonical language** for normative framework text; PT-BR becomes the translated
   layer (and stays the course language). PT-BR-only caps the addressable audience.
4. **Packaging & distribution** — (a) GitHub **template repo**; (b) `prodops init` CLI: scaffold
   structure, ask stack questions, generate `manifest.yaml`, install hooks, adapt skills;
   (c) publish the skills/commands layer as a **Claude Code plugin**; (d) publish CI gates as a
   reusable **GitHub Action** (`prodops/gates-action`). Meet users where their agents already are.

### 8.3 Progressive adoption levels (kill the all-or-nothing cliff)

| Level | Adopts | Value | Cost |
|---|---|---|---|
| 0 | Router AGENTS.md + release trail + doctor | "Your agent leaves receipts" | ~30 min |
| 1 | + OBC + BDD + no-mocks gate | Contracts before code | hours |
| 2 | + full CI Sync pipeline + hooks + quality gates | Governed local delivery | days |
| 3 | + CI Async (ship/validate/promote, SLO validation, trail-coupled CI) | Full governance | weeks |

Level 0 is the wedge; each level must pay for itself. Successful frameworks are partially adoptable.

### 8.4 Sell with evidence, not doctrine

- **10-minute quickstart** ending in the visceral moment: agent runs `/hack`, gets *blocked* by a
  gate, fixes it, trail entry appears. "The agent got caught" is the demo.
- **ProdOps badge/score** (coverage-badge style): % PRs with trail coupling, gates green, doctor
  freshness. Social proof + gamified compliance.
- **Before/after case study from this repo**: the "Vibecoding do Joe" era vs. the governed era,
  with real numbers (see §4.1).

### 8.5 Community mechanics

- Public roadmap = the issues (already strong — #8–#11 are exemplary); add `good-first-issue`
  labels (doctor checks, manifest validations, skill conversions are ideal first PRs).
- **CONTRIBUTING.md that uses the framework on itself** — framework contributions are Team-stream
  Intents. Dogfooding is the story; fix §4.2 drift first (a consistency framework with
  inconsistent docs gets roasted in the first public comment).
- **Second example stack** (thin: Python/FastAPI or Go) — nothing validates the core/instance
  split like a second instance. payments-api stays the deep example.
- **Compatibility matrix** as a visible feature: Claude Code / Copilot / Codex / Cursor (the
  thin-wrapper layer already supports it; doctor keeps `.codex/` from rotting again).

### 8.6 What NOT to do

- No SaaS/platform first — the moat is method + tooling; monetization lives in the University
  (framework free, education/certification paid).
- Don't grow the taxonomy — every new concept is future drift; freeze and simplify before extending.
- No enterprise features (RBAC, dashboards) before ten strangers run Level 0.

### 8.7 Honest risks

- **Crowded adjacency** (spec-driven kits, "AI SDLC" methods): ProdOps' lane is being visibly
  more *operational* — reliability/observability/operation/evidence; packaging speed decides who
  claims it.
- **Ceremony perception** ("SAFe for agents") — the Level 0 wedge is the antidote.
- **Bus factor** — reads as a small-team project; community mechanics are the survival plan, not
  a nice-to-have.

### 8.8 Sequence

Foundation (this quarter): §7 token fix → `prodops-core` extraction + EN.
Distribution (next): template repo + CLI + plugin + Action → Level 0 quickstart + demo.
Community (after): badges + second example + CONTRIBUTING + good-first-issues.

---

## 9. One-paragraph verdict

ProdOps gets the *direction of causality* right — contract → test → code → evidence, with
observability and reliability as deliverables — and proves it on a real codebase with verified
BDD↔test parity, a genuinely append-only evidence trail, and a fully-upheld no-mocks policy.
Where it's strong (step-level skills, git guardrails) it is very strong. Its weakness is assuming
discipline scales with document count: 164 files whose most authoritative meta-docs disagree with
each other, drift its own doctor doesn't detect, and a 13k-token preamble that contradicts its
own skills. A framework about consistency must make consistency cheap to enforce mechanically.
The open issues show the team converging on exactly that — the ideas deserve better enforcement
than the markdown currently gives them.
