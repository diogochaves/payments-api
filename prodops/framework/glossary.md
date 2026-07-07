# ProdOps Glossary

**OBC (Outcome-Based Criterion)** — Resultado mensurável que define o sucesso de uma capability. Fica em `prodops/artifacts/obcs/`. Ancora cenários TDD a resultados de negócio.

**BDD Feature** — Especificação Gherkin que descreve o comportamento esperado. Fica em `prodops/artifacts/bdd/` (comprometida) ou `prodops/journeys/discovery/features/` (exploratória). Usada como insumo de TDD no Downstream.

**Reliability Plan** — O contrato de execução de um item Downstream. Define riscos, OBCs, SLOs e ações de mitigação. Fica em `prodops/assessment/reliability-plan/`.

**CI Sync** — O agrupamento síncrono do ProdOps Delivery. Representa o trabalho local, colaborativo e conduzido pelo engenheiro. Inclui Bootstrap, Hack, Sync e Finish. Produz: task fechada, PR com narrativa, evidências, commits organizados, validações locais executadas. Ver [`delivery/README.md`](../delivery/README.md).

**CI Async** — O agrupamento assíncrono do ProdOps Delivery. Representa o trabalho conduzido pela plataforma, pipelines e ambientes. Inclui Ship, Validate e Promote. Produz: artefato publicado, deploy realizado, validação em runtime, promoção controlada. Ver [`delivery/README.md`](../delivery/README.md).

**Bootstrap** — O primeiro estágio do CI Sync. Prepara o ambiente, cria a branch e estabelece o contexto de produto (OBC, BDD Feature, testes existentes) antes de iniciar a implementação. Não produz código — produz contexto. Ver [`delivery/flows/bootstrap.md`](../delivery/flows/bootstrap.md).

**Upstream** — O caminho exploratório. Objetivo: transformar hipóteses em conhecimento validado. Código é descartável até ser promovido para Downstream. O Upstream seleciona etapas do fluxo conforme a necessidade — não há sequência obrigatória. Um ciclo Upstream típico usa Bootstrap + Hack + Sync; Ship, Validate e Promote são usados apenas quando o experimento precisa de validação em staging ou de uma decisão de promoção. Ver [`prodops/journeys/discovery/README.md`](../journeys/discovery/README.md).

**Downstream** — O caminho de entrega governado. Objetivo: entregar com confiança usando conhecimento validado. Todo item requer OBC + BDD Feature + entrada no Reliability Plan. O Downstream exige o fluxo completo: `Bootstrap → Hack → Sync → Finish → Ship → Validate → Promote`. Ver [`prodops/execution-model/downstream.md`](../execution-model/downstream.md).

**Hack Flow** — A fase de codificação em Upstream e Downstream. Segundo estágio do CI Sync, sucede o Bootstrap. Definido em [`journeys/delivery/phases/hack/README.md`](../journeys/delivery/phases/hack/README.md). Mecânica de execução em [`prodops/skills/hack/`](../../skills/hack/).

**Ship** — O primeiro estágio do CI Async. Transforma a implementação finalizada em artefato executável e conduz o deploy. Organizado em duas famílias: Preparation (Build, Package, Version, Sign, SBOM, Publish Artifact) e Deployment (Deploy, Progressive Delivery, Feature Flags, Rollout, Rollback, Infrastructure Validation). Build, Package e Publish são capabilities internas do Ship — não são etapas independentes do fluxo principal. Ver [`delivery/flows/ship-validate-promote.md`](../delivery/flows/ship-validate-promote.md).

**Validate** — O segundo estágio do CI Async. Verifica a entrega em execução no ambiente alvo. Capabilities: Smoke Tests, Runtime Contract Validation, Synthetic Monitoring, Health Checks, Observability Validation, SLO Validation, Business Validation, Incident Signals. Ver [`delivery/flows/ship-validate-promote.md`](../delivery/flows/ship-validate-promote.md).

**Promote** — O terceiro estágio do CI Async. Oficializa a evolução da versão com aprovação formal e evidência registrada. Capabilities: Promotion Gates, Environment Promotion, Release Approval, Release Trail, Operational Evidence, Release Documentation, Rollback Readiness. Ver [`delivery/flows/ship-validate-promote.md`](../delivery/flows/ship-validate-promote.md).

**ProdOps TDD** — A prática utilizada dentro do Hack Flow para produzir código observável e confiável. Definida em [`delivery/practices/prodops-tdd.md`](../delivery/practices/prodops-tdd.md).

**Red Bar** — Teste com falha que expressa corretamente o comportamento desejado. Confirma que o teste detecta a implementação ausente.

**Green Bar** — Teste passando após a implementação mínima estar em vigor.

**Yellow Bar** — Padrões usados para gerenciar cenários de teste difíceis: child tests, crash dummies, log strings. Não é uma licença para mockar lógica de negócio.

**Progressive Substitution** — Estratégia de teste onde um Mock Server (baseado em contrato) é usado primeiro, depois substituído pela integração real sem reescrever os testes. Os testes verificam comportamento pela mesma superfície de contrato independentemente do que está por trás.

**Mock Server** — Test double em nível de infraestrutura que simula uma dependência externa com base em um contrato (ex.: WireMock, Prism). Distinto do Mock Object, que substitui um serviço próprio.

**Mock Object** — Test double para uma dependência técnica (logger, clock, gerador de UUID, adaptador de telemetria). Aceitável apenas quando não oculta comportamento de negócio.

**Decision Trail** — Registro de uma decisão tomada sob incerteza, incluindo contexto, alternativas e impacto. Template: [`prodops/templates/assessment/decision-trail.md`](../templates/assessment/decision-trail.md).

**Release Trail** — O log append-only de evidências do Downstream. Fica em [`downstream/release-trail.md`](../downstream/release-trail.md).
