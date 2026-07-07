# CI Async

CI Async é o agrupamento assíncrono do ProdOps Delivery. Representa o trabalho **conduzido pela plataforma, pipelines e ambientes**.

```
CI Async: Ship → Validate → Promote
```

## Propósito

CI Async produz:
- Artefato produzido e publicado
- Deploy realizado no ambiente alvo
- Validação em runtime executada
- Promoção controlada com evidência registrada

## Estágios

### Ship

Transforma a implementação em artefato executável e conduz o deploy.

Duas famílias:
- **Preparation:** Build, Package, Version, Sign, SBOM, Publish Artifact
- **Deployment:** Deploy, Progressive Delivery, Feature Flags, Rollout, Rollback, Infrastructure Validation

Build, Package e Publish são capabilities internas do Ship — não são estágios independentes.

→ [flows/ship-validate-promote.md](flows/ship-validate-promote.md#ship)

### Validate

Verifica a entrega em execução no ambiente alvo.

Capabilities: Smoke Tests, Runtime Contract Validation, Synthetic Monitoring, Health Checks, Observability Validation, SLO Validation, Business Validation, Incident Signals.

→ [flows/ship-validate-promote.md](flows/ship-validate-promote.md#validate)

### Promote

Oficializa a evolução da versão com aprovação formal e evidência registrada.

Capabilities: Promotion Gates, Environment Promotion, Release Approval, Release Trail, Operational Evidence, Release Documentation, Rollback Readiness.

→ [flows/ship-validate-promote.md](flows/ship-validate-promote.md#promote)

## Capabilities utilizadas

| Capability | Estágio |
|---|---|
| [Evidence Management](capabilities/evidence-management.md) | Validate, Promote |
| [Observability](capabilities/observability.md) | Validate |
| [Reliability](capabilities/reliability.md) | Promote |
| [Contract Management](capabilities/contract-management.md) | Validate |
