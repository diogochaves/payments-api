# ProdOps Glossary

**OBC (Outcome-Based Criterion)** — A measurable result that defines success for a capability. Lives in `prodops/assessment/reliability-plan/obcs/`. Anchors TDD scenarios to business outcomes.

**BDD Feature** — A Gherkin specification that describes expected behavior. Lives in `prodops/current-state/features/` (committed) or `prodops/upstream/features/` (exploratory). Used as TDD input in Downstream.

**Reliability Plan** — The execution contract for a Downstream item. Defines risks, OBCs, SLOs, and mitigation actions. Lives in `prodops/assessment/reliability-plan/`.

**Upstream** — The exploratory path. Goal: transform hypotheses into validated knowledge. Code is disposable until promoted to Downstream. Upstream selects flow steps as needed — there is no mandatory sequence. A typical Upstream cycle uses Hack + Sync; Ship, Validate, and Promote are used only when the experiment needs staging validation or a promotion decision. See [`prodops/upstream/README.md`](../upstream/README.md).

**Downstream** — The governed delivery path. Goal: ship with confidence using validated knowledge. Every item requires OBC + BDD Feature + Reliability Plan entry. Downstream requires the full flow: `Hack → Sync → Finish → Ship → Validate → Promote`. See [`prodops/downstream/README.md`](../downstream/README.md).

**Hack Flow** — The coding phase inside both Upstream and Downstream. Defined in [`delivery/hack-flow.md`](../delivery/hack-flow.md). Execution mechanics in [`skills/hack/`](../../skills/hack/).

**ProdOps TDD** — The practice used inside Hack Flow to produce observable, reliable code. Defined in [`delivery/practices/tdd-prodops.md`](../delivery/practices/tdd-prodops.md).

**Red Bar** — A failing test that correctly expresses desired behavior. Confirms the test detects the missing implementation.

**Green Bar** — A passing test after the minimum implementation is in place.

**Yellow Bar** — Patterns used to manage difficult test scenarios: child tests, crash dummies, log strings. Not a license to mock business logic.

**Progressive Substitution** — A testing strategy where a Mock Server (contract-based) is used first, then replaced by the real integration without rewriting tests. Tests verify behavior through the same contract surface regardless of what's behind it.

**Mock Server** — Infrastructure-level test double that simulates an external dependency based on a contract (e.g., WireMock, Prism). Distinct from a Mock Object, which substitutes an owned service.

**Mock Object** — A test double for a technical dependency (logger, clock, UUID generator, telemetry adapter). Acceptable only when it does not hide business behavior.

**Decision Trail** — A record of a decision made under uncertainty, including context, alternatives, and impact. Template: [`templates/decision-trail.md`](../templates/decision-trail.md).

**Release Trail** — The append-only log of Downstream evidence. Lives in [`downstream/release-trail.md`](../downstream/release-trail.md).
