# Claude Code Instructions

Use `AGENTS.md` as the shared operating guide for this repository.

Claude-specific behavior:

- Treat `AGENTS.md` as project memory and follow its ProdOps-first workflow.
- Keep Claude memory focused on stable repository conventions, not release
  decisions that belong in `prodops/`.
- When a task affects product behavior, read the relevant ProdOps artifacts
  before editing code.
- Do not store duplicated business context in Claude-only files. Add or update
  the appropriate file under `prodops/` instead.
- Use `skills/` for execution mode guidance and `prodops/` for product context.
