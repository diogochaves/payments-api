# ProdOps Glossary

**OBC (Outcome-Based Criterion)** — A measurable result that defines success for a capability. Lives in `prodops/assessment/obcs/`. Anchors TDD scenarios to business outcomes.

**BDD Feature** — A Gherkin specification that describes expected behavior. Lives in `prodops/product/features/` (committed) or `prodops/upstream/features/` (exploratory). Used as TDD input in Downstream.

**Reliability Plan** — The execution contract for a Downstream item. Defines risks, OBCs, SLOs, and mitigation actions. Lives in `prodops/assessment/reliability-plan/`.

**CI Sync** — O agrupamento síncrono do ProdOps Delivery. Representa o trabalho local, colaborativo e conduzido pelo engenheiro. Inclui Bootstrap, Hack, Sync e Finish. Produz: task fechada, PR com narrativa, evidências, commits organizados, validações locais executadas. Ver [`delivery/README.md`](../delivery/README.md).

**CI Async** — O agrupamento assíncrono do ProdOps Delivery. Representa o trabalho conduzido pela plataforma, pipelines e ambientes. Inclui Ship, Validate e Promote. Produz: artefato publicado, deploy realizado, validação em runtime, promoção controlada. Ver [`delivery/README.md`](../delivery/README.md).

**Bootstrap** — O primeiro estágio do CI Sync. Prepara o ambiente, cria a branch e estabelece o contexto de produto (OBC, BDD Feature, testes existentes) antes de iniciar a implementação. Não produz código — produz contexto. Ver [`delivery/flows/bootstrap.md`](../delivery/flows/bootstrap.md).

**Upstream** — The exploratory path. Goal: transform hypotheses into validated knowledge. Code is disposable until promoted to Downstream. Upstream selects flow steps as needed — there is no mandatory sequence. A typical Upstream cycle uses Bootstrap + Hack + Sync; Ship, Validate, and Promote are used only when the experiment needs staging validation or a promotion decision. See [`prodops/upstream/README.md`](../upstream/README.md).

**Downstream** — The governed delivery path. Goal: ship with confidence using validated knowledge. Every item requires OBC + BDD Feature + Reliability Plan entry. Downstream requires the full flow: `Bootstrap → Hack → Sync → Finish → Ship → Validate → Promote`. See [`prodops/downstream/README.md`](../downstream/README.md).

**Hack Flow** — The coding phase inside both Upstream and Downstream. Second stage of CI Sync, follows Bootstrap. Defined in [`delivery/flows/hack.md`](../delivery/flows/hack.md). Execution mechanics in [`skills/hack/`](../../skills/hack/).

**Ship** — O primeiro estágio do CI Async. Transforma a implementação finalizada em artefato executável e conduz o deploy. Organizado em duas famílias: Preparation (Build, Package, Version, Sign, SBOM, Publish Artifact) e Deployment (Deploy, Progressive Delivery, Feature Flags, Rollout, Rollback, Infrastructure Validation). Build, Package e Publish são capabilities internas do Ship — não são etapas independentes do fluxo principal. Ver [`delivery/flows/ship-validate-promote.md`](../delivery/flows/ship-validate-promote.md).

**Validate** — O segundo estágio do CI Async. Verifica a entrega em execução no ambiente alvo. Capabilities: Smoke Tests, Runtime Contract Validation, Synthetic Monitoring, Health Checks, Observability Validation, SLO Validation, Business Validation, Incident Signals. Ver [`delivery/flows/ship-validate-promote.md`](../delivery/flows/ship-validate-promote.md).

**Promote** — O terceiro estágio do CI Async. Oficializa a evolução da versão com aprovação formal e evidência registrada. Capabilities: Promotion Gates, Environment Promotion, Release Approval, Release Trail, Operational Evidence, Release Documentation, Rollback Readiness. Ver [`delivery/flows/ship-validate-promote.md`](../delivery/flows/ship-validate-promote.md).

**ProdOps TDD** — The practice used inside Hack Flow to produce observable, reliable code. Defined in [`delivery/practices/prodops-tdd.md`](../delivery/practices/prodops-tdd.md).

**Red Bar** — A failing test that correctly expresses desired behavior. Confirms the test detects the missing implementation.

**Green Bar** — A passing test after the minimum implementation is in place.

**Yellow Bar** — Patterns used to manage difficult test scenarios: child tests, crash dummies, log strings. Not a license to mock business logic.

**Progressive Substitution** — A testing strategy where a Mock Server (contract-based) is used first, then replaced by the real integration without rewriting tests. Tests verify behavior through the same contract surface regardless of what's behind it.

**Mock Server** — Infrastructure-level test double that simulates an external dependency based on a contract (e.g., WireMock, Prism). Distinct from a Mock Object, which substitutes an owned service.

**Mock Object** — A test double for a technical dependency (logger, clock, UUID generator, telemetry adapter). Acceptable only when it does not hide business behavior.

**Decision Trail** — A record of a decision made under uncertainty, including context, alternatives, and impact. Template: [`templates/decision-trail.md`](../templates/decision-trail.md).

**Release Trail** — The append-only log of Downstream evidence. Lives in [`downstream/release-trail.md`](../downstream/release-trail.md).
