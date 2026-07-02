# Implement OBC

Use the repository `AGENTS.md` flow.

1. Locate the related OBC under `prodops/`.
2. Read the matching BDD Feature in `prodops/current-state/features/`.
3. Read the Reliability Plan section that defines the release contract.
4. If the OBC is not ready for delivery, use `skills/upstream/` to refine it.
5. If the OBC is approved for delivery, use `skills/downstream/` and implement
   with TDD using `skills/hack/`.
6. Validate behavior with the smallest meaningful test first.
7. Update only impacted ProdOps artifacts.
8. Append Downstream results and evidence to
   `prodops/downstream/release-trail.md`.
