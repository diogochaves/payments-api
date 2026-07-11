---
name: finish
description: Close technical work with quality gates. Use before considering a task complete, especially after implementation or artifact updates.
---

# FINISH

Close a task with explicit quality evidence. Finish is the last CI Sync phase:
after it, the work is ready for Ship.

## Inputs

- The current diff and test output.
- The `gates:` section of `manifest.yaml`.
- The card's context capsule or OBC/BDD (locations in `manifest.yaml`).

## Flow

1. Review the changed files and confirm the scope matches the task — nothing
   unrelated, nothing missing.
2. Run the quality gates from `manifest.yaml` relevant to the change:
   - `lint` — always, for the affected package.
   - `unit` — always.
   - `build` — when compiled output or configuration changed.
   - `acceptance` — when its `when` condition applies
     (`behavior_or_contract_changed`).
   - `no_mocks` — must report `zero_hits`.
   Each gate must meet its `expect` contract; record the actual output.
3. Confirm ProdOps artifacts were updated only where impacted (BDD,
   architecture, reliability plans — paths in the manifest).
4. Confirm the release trail (`paths.release_trail`) has the evidence entry
   for this task; append what is missing.
5. Leave explicit next steps for any incomplete item — a gap surfaced is
   acceptable; a gap hidden is not.

## Guardrails

- Do not mark work complete without evidence.
- Do not hide skipped tests or gates; record why they were skipped.
- Do not expand scope during finish work.
- Do not weaken a gate to make it pass — fix the cause or record the blocker.

## Post-conditions

- All applicable gates met their `expect` contract, or the failures are
  explicit blockers.
- Release trail evidence exists for the task.
- Open items are listed with owners or follow-ups — nothing implicit.
