# Codex Instructions

Use `AGENTS.md` as the shared operating guide for this repository.

Codex-specific behavior:

- Prefer repository skills in `skills/` for execution workflow guidance.
- Use `.codex/skills/` only for Codex-specific adapters or local tooling.
- Keep Codex instructions short and tool-specific; product context belongs in
  `prodops/`.
- Use `skills/upstream/` for exploration and `skills/downstream/` for governed
  release delivery.
- Before implementation work, read `prodops/current-state/` and
  `prodops/assessment/reliability-plan/`.
- After meaningful work, append evidence to
  `prodops/downstream/release-trail.md`.
