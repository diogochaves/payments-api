# Upstream

Upstream is the ProdOps path for exploratory engineering before delivery
commitment.

Use it to explore, experiment, implement quickly, validate hypotheses, produce
executable code, create endpoints, test integrations, build prototypes, update
contracts, prepare BDDs, evolve OBCs, enrich the Reliability Plan, update Event
Storming, and generate evidence for promotion decisions.

Upstream output should be reversible and should either:

- produce a learning;
- close an uncertainty;
- produce executable evidence;
- create or refine a Downstream candidate;
- update a relevant ProdOps artifact when evidence supports it.

## Validation Workbench

The `validation-workbench/` directory belongs to Upstream. It is a local
functional validation interface, not the backend technical test suite.

Use it to validate:

- functional flows;
- OBC behavior;
- integrations;
- BDD scenarios;
- UX;
- contracts before Downstream promotion.

## Disposable Until Promoted

Code produced in Upstream is disposable until promoted to Downstream. If an
experiment succeeds, the code can be reused, refactored, or promoted during the
Downstream flow.

Record activity in `upstream-trail.md`.
