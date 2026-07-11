# prodops-core

> **Status: extraction preview.** This package is the project-agnostic core of the
> ProdOps framework, extracted from the `payments-api` reference instance. It is
> designed to become a standalone repository. Interfaces may still change.

ProdOps is a method for **governed, evidence-based delivery in AI-agent-driven
teams**. It gets the direction of causality right — contract → test → code →
evidence — and makes it cheap to enforce mechanically: agents work through
self-sufficient phase skills, a single machine-readable manifest declares paths,
quality gates, and vocabulary, and every relevant change leaves a receipt in an
append-only release trail.

`prodops-core` contains only what is generic: the pipeline, the skills, the
manifest schema, the artifact templates, and the enforcement scripts. Everything
project-specific — actual gate commands, OBCs, BDD features, risks, trails —
lives in the adopting repository's own `prodops/` instance.

## Structure

| Path | What it is |
|---|---|
| `manifest.example.yaml` | Manifest template: pipeline, skills, paths, gates, vocabulary. The single machine-readable source of truth for an instance. |
| `AGENTS.template.md` | Minimal agent router to place at the adopting repo's root as `AGENTS.md`. |
| `skills/` | Self-sufficient SKILL.md for each of the 7 delivery phases: `bootstrap`, `hack`, `sync`, `finish` (CI Sync — local, synchronous) and `ship`, `validate`, `promote` (CI Async — platform). |
| `templates/` | Artifact templates: intent, OBC, BDD feature, context capsule, release trail entry, decision trail. |
| `scripts/` | `validate-manifest.sh` (manifest vs. repository consistency) and `doctor.sh` (manifest validation + broken-link check). |
| `hooks/` | `commit-msg` hook enforcing Conventional Commits from the manifest vocabulary. |

## How to adopt

1. Copy this package's contents into your repository (suggested layout:
   `prodops/exec/manifest.yaml`, `prodops/skills/`, `prodops/templates/`,
   `prodops/scripts/`, `prodops/hooks/`).
2. Fill `manifest.yaml` from `manifest.example.yaml`: replace every
   `<placeholder>` gate command with your stack's real commands; adjust paths if
   you relocate artifact directories.
3. Create the artifact directories the manifest declares (`obcs/`, `bdd/`,
   `trails/release-trail.md`, ...) — `validate-manifest.sh` will tell you what
   is missing.
4. Copy `AGENTS.template.md` to your repo root as `AGENTS.md` and fill the
   placeholders. Wire your agent runtime's slash commands (Claude Code, Copilot,
   Codex, ...) to the skills.
5. Install the hooks: `git config core.hooksPath prodops/hooks` (see
   `hooks/README.md`).
6. Run `./prodops/scripts/doctor.sh` — adopt at the level that pays for itself
   and grow from there.

## Splitting into a standalone repository

The package is laid out so its history can be extracted with git subtree:

```bash
git subtree split -P packages/prodops-core -b prodops-core-standalone
# then push that branch to a new repository:
# git push git@github.com:<org>/prodops-core.git prodops-core-standalone:main
```

## Relationship to payments-api

The `payments-api` repository is the **reference instance**: a real NestJS
payments gateway governed end-to-end by ProdOps, with committed OBCs, BDD
features, reliability plans, and a live release trail. This core is distilled
from it — the instance shows what the placeholders look like when filled in and
practiced. Normative core text is English; the reference instance keeps PT-BR
as its course language.
