# Templates

Reusable templates for ProdOps artifacts, prompts, and execution records can be stored here.

Do not place release-specific product context in templates.

## Upstream

Use these templates together for new Upstream experiments:

- `templates/upstream-experiment.md` -> `prodops/upstream/experiments/NNN-short-slug/experiment.md`
- `templates/upstream-trail.md` -> `prodops/upstream/experiments/NNN-short-slug/upstream-trail.md`

Create an `evidence/` directory beside them when the experiment needs command
outputs, screenshots, payload examples or provider responses.
