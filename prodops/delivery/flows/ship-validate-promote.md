# Ship → Validate → Promote Flow

Ship, Validate e Promote compõem o **CI Async** — o trabalho assíncrono executado pela plataforma, pipelines e ambientes.

```
CI Sync:  Bootstrap → Hack → Sync → Finish
                                         ↓
CI Async:                              Ship → Validate → Promote
```

Para mecânica de execução — comandos, PR, deploy, Quality Gates — veja os skills correspondentes:
- [`skills/ship/`](../../../skills/ship/)
- [`skills/validate/`](../../../skills/validate/)
- [`skills/promote/`](../../../skills/promote/)

---

## Ship

**Objetivo:** transformar a implementação finalizada em um artefato executável, publicável e implantável, conduzindo sua entrega até o ambiente alvo.

O Ship é organizado em duas famílias de capabilities:

### Preparation

Capabilities responsáveis por produzir o artefato:

| Capability | Descrição |
|---|---|
| **Build** | Compilar, transpilar e empacotar o código |
| **Package** | Criar o artefato distribuível (container, ZIP, layer) |
| **Version** | Aplicar versionamento semântico ao artefato |
| **Sign** | Assinar o artefato para garantir integridade e proveniência |
| **Generate SBOM** | Produzir o Software Bill of Materials |
| **Publish Artifact** | Publicar o artefato no registry (ECR, S3, npm) |

Build, Package e Publish são capabilities internas do Ship. Não são etapas independentes do fluxo principal.

### Deployment

Capabilities responsáveis por conduzir o artefato até o ambiente:

| Capability | Descrição |
|---|---|
| **Deploy** | Executar o deploy do artefato no ambiente alvo |
| **Progressive Delivery** | Estratégias de entrega gradual (canary, blue-green) |
| **Feature Flags** | Controle de ativação de features em runtime |
| **Rollout** | Expansão progressiva do tráfego para a nova versão |
| **Rollback** | Reverter para a versão anterior em caso de falha |
| **Infrastructure Validation** | Verificar que a infraestrutura está correta após deploy |

### Pré-condição

A fase Finish foi concluída: lint, build, testes e Definition of Done satisfeitos. Ver [sync-finish.md](sync-finish.md).

### Sequência no Ship

1. Confirmar que a mudança está mapeada ao Reliability Plan ou a um follow-up documentado.
2. Revisar o diff final como se fosse um code review externo.
3. Verificar evidência TDD: toda mudança de comportamento precisa de Red Bar confirmado ou justificativa documentada.
4. Executar security checks: sem secrets, tokens reais, credenciais pessoais ou paths locais.
5. Preencher o template de PR com evidências. Ver [`commit-workflow/templates/pull_request.md`](../../commit-workflow/templates/pull_request.md).
6. Publicar o Pull Request.
7. Executar Preparation (Build → Package → Version → Publish Artifact).
8. Executar Deployment (Deploy → Progressive Delivery conforme estratégia).
9. Registrar evidência de ship no Release Trail.

### Checklist Ship

- [ ] Diff revisado — nenhuma mudança não intencional incluída.
- [ ] Evidência TDD presente ou ausência justificada.
- [ ] Sem secrets, credenciais ou paths locais no diff.
- [ ] PR preenchido com: comportamento, validação, risco e rollback.
- [ ] Artefato produzido e publicado.
- [ ] Deploy realizado no ambiente alvo.
- [ ] Release Trail atualizado com entrada de ship.

---

## Validate

**Objetivo:** verificar a entrega em execução no ambiente alvo.

### Capabilities do Validate

| Capability | Descrição |
|---|---|
| **Smoke Tests** | Verificações rápidas de sanidade pós-deploy |
| **Runtime Contract Validation** | Confirmar que a API responde conforme o contrato OpenAPI/AsyncAPI |
| **Synthetic Monitoring** | Execução contínua de cenários reais contra o ambiente |
| **Health Checks** | Verificar disponibilidade dos componentes no ambiente alvo |
| **Observability Validation** | Confirmar logs, métricas e correlationId no ambiente real |
| **SLO Validation** | Verificar que os SLOs definidos no OBC estão sendo atendidos |
| **Business Validation** | Confirmar que o comportamento de negócio está correto em runtime |
| **Incident Signals** | Monitorar sinais de alerta e anomalias após o deploy |

### Pré-condição

O PR foi aprovado e o deploy para staging foi realizado.

### Sequência no Validate

1. Identificar a capability, OBC ou risco sendo validado.
2. Selecionar evidências executáveis: testes, logs, métricas, eventos ou SLO signals.
3. Executar os comandos de validação e registrar os resultados exatos.
4. Confirmar que os cenários do BDD Feature passam no ambiente de staging.
5. Verificar observabilidade: logs esperados emitidos, correlationId propagado, nenhum secret em log.
6. Avaliar riscos remanescentes e decidir se são aceitáveis para promoção.
7. Registrar evidência no Release Trail.

### Checklist Validate

- [ ] Smoke Tests passam no ambiente alvo.
- [ ] Cenários BDD passam no ambiente alvo.
- [ ] OBC satisfeito com evidência mensurável.
- [ ] Logs e rastreabilidade verificados no ambiente alvo (correlationId, tenantId).
- [ ] SLOs verificados — nenhuma degradação introduzida.
- [ ] Riscos remanescentes avaliados e documentados.
- [ ] Release Trail atualizado com evidência de validação.

### Se a validação falhar

Não promover. Abrir um novo ciclo Hack com o comportamento observado como Red Bar. Registrar o gap no Release Trail como "Validação com falha — retornou para Hack".

---

## Promote

**Objetivo:** oficializar a evolução da versão com aprovação formal e evidência registrada.

### Capabilities do Promote

| Capability | Descrição |
|---|---|
| **Promotion Gates** | Verificação de todos os critérios antes da promoção |
| **Environment Promotion** | Mover o artefato para o próximo ambiente (staging → prod) |
| **Release Approval** | Aprovação formal por PM e Tech Lead |
| **Release Trail** | Registro definitivo da promoção com evidências |
| **Operational Evidence** | Evidências de operação saudável pós-promoção |
| **Release Documentation** | Notas de release, changelog, comunicado |
| **Rollback Readiness** | Confirmar que o plano de rollback está documentado e testado |

### Pré-condição

Validação concluída, riscos avaliados, prontidão operacional confirmada.

### Sequência no Promote

1. Confirmar que todos os Quality Gates estão satisfeitos. Ver [`prodops/downstream/quality-gates.md`](../../downstream/quality-gates.md).
2. Verificar prontidão operacional: runbooks existem para os novos failure modes, on-call informado.
3. Executar Release Approval com PM e Tech Lead.
4. Aceitar formalmente os riscos remanescentes ou movê-los para follow-up documentado.
5. Executar Environment Promotion (staging → prod).
6. Fechar a Task com o template. Ver [`commit-workflow/templates/task-closing.md`](../../commit-workflow/templates/task-closing.md).
7. Registrar a promoção no Release Trail: o que foi promovido, evidências, riscos aceitos e próximos passos.

### Checklist Promote

- [ ] Promotion Gates satisfeitos (Quality Gates + Done Criteria).
- [ ] Release Approval obtida (PM + Tech Lead).
- [ ] Runbooks atualizados para novos failure modes (se aplicável).
- [ ] Rollback Readiness confirmado — plano documentado.
- [ ] Environment Promotion executada.
- [ ] Task fechada com evidência.
- [ ] Release Trail atualizado com entrada de promoção.
- [ ] Operational Evidence registrada.

---

## Fluxo completo do CI Async

```
Ship (Preparation → Deployment)
  ↓
Validate (Runtime → Observability → SLO → Business)
  ↓
Promote (Gates → Approval → Promotion → Trail)
```

Se Validate falhar → retorna para Hack com o comportamento observado como Red Bar.
Se Promote identificar risco inaceitável → retorna para Validate ou Hack conforme a natureza do risco.
