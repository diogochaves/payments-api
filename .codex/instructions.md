# Codex Instructions

Use `AGENTS.md` as the shared operating guide for this repository.

Codex-specific behavior:

- Use repository skills in `skills/` as the canonical execution workflow guidance.
- Treat `.codex/skills/` only as a compatibility pointer to `skills/`; do not duplicate skill content there.
- Keep Codex instructions short and tool-specific; product context belongs in `prodops/`.
- Use `skills/upstream/` for exploration and `skills/downstream/` for governed release delivery.
- Before implementation work, read `prodops/current-state/` and `prodops/assessment/reliability-plan/`.
- After meaningful work, append evidence to `prodops/downstream/release-trail.md`.
