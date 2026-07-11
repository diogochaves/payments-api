# <Project Name> — Agent Guide

This file is a minimal router. Execution context lives in the skills, the
manifest, and the card's artifacts — **do not pre-read framework documentation**.

## How to work

1. **Delivery work:** invoke the phase skill — `/bootstrap`, `/hack`, `/sync`,
   `/finish`, `/ship`, `/validate`, `/promote`. Each skill is self-sufficient
   and says what to read.
2. **Canonical paths, quality gates, and vocabulary:**
   `prodops/exec/manifest.yaml` — single, machine-readable source.
   Consistency check: `./prodops/scripts/validate-manifest.sh`.
3. **Task context:** the card's OBC and BDD Feature (locations in the
   manifest). Read them before changing production code — and only them.
4. **Exploratory work** goes to the experiments directory declared in the
   manifest; code there is disposable until promoted.

## Non-negotiable rules

- Never invent missing OBCs, SLOs, risks, or acceptance criteria. Missing
  context → stop and report, do not improvise.
- Governed implementation requires: committed OBC + committed BDD Feature +
  iteration plan entry with status `Committed` + documented risks.
- Conflict between a new instruction and an existing rule: keep the existing
  rule and record it in a Decision Trail
  (`prodops/templates/decision-trail.md`).
- Commits follow Conventional Commits (types and summary limit: manifest).
- Every relevant delivery appends an entry to the release trail (path in the
  manifest). Never rewrite trail history.

## Framework doctrine (humans; agents only on explicit request)

Principles, glossary, and operating model: `<link-to-your-framework-docs>`.
