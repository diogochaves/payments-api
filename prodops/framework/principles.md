# ProdOps Principles

## 1. Product context first
Nenhuma mudança de código começa sem um artefato de produto: OBC, BDD Feature ou entrada no Reliability Plan. Agentes não devem inventar contexto de negócio ausente.

## 2. Upstream before commitment
Hipóteses, experimentos e spikes pertencem ao Upstream. Código é descartável até ser promovido para Downstream. Ver [AGENTS.md Upstream Path](../../AGENTS.md).

## 3. Contracts before implementation
Identificar ou criar um contrato verificável (OpenAPI, AsyncAPI, BDD Feature, schema) antes de escrever código de produção. O contrato é a linguagem compartilhada entre teste e implementação.

## 4. Observability as a deliverable
Logs, erros, métricas e rastreabilidade fazem parte da implementação, não são complementos adicionados depois. Uma feature não está pronta se seu comportamento não puder ser observado em produção.

## 5. Evidence-based decisions
Toda decisão de entrega — promover, reverter, aceitar risco — deve ser respaldada por evidência registrada. Ver [release-trail](../downstream/release-trail.md) e [operation/](../operation/).

## 6. Reliability is a first-class concern
Objetivos de confiabilidade são definidos antes da implementação, acompanhados via OBCs e SLOs, e validados antes da promoção. Ver [reliability-plan](../assessment/reliability-plan/).

## 7. No shortcuts in production code
Código de produção não deve conter branches exclusivos de teste, hacks específicos de ambiente ou overrides ocultos que alteram o comportamento em teste. Exceção: `ASAAS_MOCK=true` é um modo de comportamento projetado, não um atalho de teste.
