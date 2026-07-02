# Codex Instructions

Use `AGENTS.md` as the shared operating guide for this repository.

Codex-specific behavior:

- Prefer repository skills in `skills/` for execution workflow guidance.
- Use `.codex/skills/` only for Codex-specific adapters or local tooling.
- Keep Codex instructions short and tool-specific; product context belongs in
  `prodops/`.
- Before implementation work, read `prodops/current-state/` and
  `prodops/assessment/reliability-plan/`.
- After meaningful work, append evidence to
  `prodops/diligence/release-trail.md`.
