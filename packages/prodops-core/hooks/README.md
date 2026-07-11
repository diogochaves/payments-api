# ProdOps git hooks

Dependency-free bash hooks that enforce manifest vocabulary mechanically —
rules live as gates, not as prose an agent may skip.

## Hooks

| Hook | What it enforces |
|---|---|
| `commit-msg` | Conventional Commits: type from `vocabulary.commit_types`, first line at most `vocabulary.commit_summary_max` characters. Merge, revert, fixup, and squash commits pass through. |

The hook reads the manifest at `$PRODOPS_MANIFEST` (default:
`prodops/exec/manifest.yaml`, resolved from the repository root where git runs
hooks). If no manifest is readable it falls back to the 11 standard types
(`feat fix docs test refactor perf build ci style chore revert`) and 72
characters — so the hook is safe to install before the manifest exists.

## Wiring

Recommended: point git at the hooks directory of your ProdOps instance
(after copying this package in, e.g. to `prodops/hooks/`):

```bash
git config core.hooksPath prodops/hooks
```

Alternative: copy the individual hook into `.git/hooks/` (not versioned,
must be repeated per clone):

```bash
cp prodops/hooks/commit-msg .git/hooks/commit-msg
```

Either way the hook file must be executable:

```bash
chmod +x prodops/hooks/commit-msg
```

Note: `core.hooksPath` redirects **all** hooks. If your repository already
uses other hooks (e.g. a hook manager like husky), copy this file's logic into
that manager instead of switching `core.hooksPath`.

## Guardrail

Never bypass a failing hook with `--no-verify` — fix the root cause. If a
rule must be overridden, record the decision in a Decision Trail
(`templates/decision-trail.md`).
