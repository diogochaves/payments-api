# Ship → Validate → Promote Flow

As fases Ship, Validate e Promote encerram o ciclo de entrega Downstream. Elas transformam uma implementação concluída em uma release promovida com evidência registrada.

Para mecânica de execução — comandos, PR, deploy, Quality Gates — veja os skills correspondentes:
- [`skills/ship/`](../../skills/ship/)
- [`skills/validate/`](../../skills/validate/)
- [`skills/promote/`](../../skills/promote/)

---

## Ship

**Objetivo:** empacotar o trabalho concluído para revisão e deploy.

### Pré-condição

A fase Finish foi concluída: lint, build, testes e Definition of Done estão satisfeitos.
Ver [sync-finish-flow.md](sync-finish-flow.md).

### O que acontece no Ship

1. Confirmar que a mudança está mapeada ao Reliability Plan ou a um follow-up documentado.
2. Revisar o diff final como se fosse um code review externo.
3. Verificar evidência TDD: toda mudança de comportamento precisa de Red Bar confirmado ou justificativa de por que TDD não se aplicou.
4. Executar security checks: sem secrets, tokens reais, credenciais pessoais ou paths locais.
5. Preencher o template de PR com evidências. Ver [`commit-workflow/templates/pull_request.md`](../commit-workflow/templates/pull_request.md).
6. Publicar o Pull Request.
7. Registrar evidência de ship no Release Trail.

### Checklist Ship

- [ ] Diff revisado — nenhuma mudança não intencional incluída.
- [ ] Evidência TDD presente ou ausência justificada.
- [ ] Sem secrets, credenciais ou paths locais no diff.
- [ ] PR preenchido com: comportamento, validação, risco e rollback.
- [ ] Release Trail atualizado com entrada de ship.

---

## Validate

**Objetivo:** provar que o comportamento entregue satisfaz o OBC, o BDD Feature e o Reliability Plan.

### Pré-condição

O PR foi aprovado e o deploy para staging foi realizado.

### O que acontece no Validate

1. Identificar a capability, OBC ou risco sendo validado.
2. Selecionar evidências executáveis: testes, logs, métricas, eventos ou SLO signals.
3. Executar os comandos de validação e registrar os resultados exatos.
4. Confirmar que os cenários do BDD Feature passam no ambiente de staging.
5. Verificar observabilidade: logs esperados emitidos, correlationId propagado, nenhum secret em log.
6. Avaliar riscos remanescentes e decidir se são aceitáveis para promoção.
7. Registrar evidência no Release Trail.

### Checklist Validate

- [ ] Cenários BDD passam no ambiente alvo.
- [ ] OBC satisfeito com evidência mensurável.
- [ ] Logs e rastreabilidade verificados no ambiente alvo.
- [ ] Riscos remanescentes avaliados e documentados.
- [ ] Release Trail atualizado com evidência de validação.

### Se a validação falhar

Não promover. Abrir um novo ciclo Hack com o comportamento observado como Red Bar.
Registrar o gap no Release Trail como "Validação com falha — retornou para Hack".

---

## Promote

**Objetivo:** fechar a release stage com aprovação formal e evidência registrada.

### Pré-condição

Validação concluída, riscos avaliados, prontidão operacional confirmada.

### O que acontece no Promote

1. Confirmar que todos os Quality Gates estão satisfeitos. Ver [`prodops/downstream/quality-gates.md`](../downstream/quality-gates.md).
2. Confirmar que os Done Criteria foram atendidos. Ver [`prodops/downstream/done-criteria.md`](../downstream/done-criteria.md).
3. Verificar prontidão operacional: runbooks existem para os novos failure modes, on-call informado.
4. Aceitar formalmente os riscos remanescentes ou movê-los para follow-up documentado.
5. Fechar a Task com o template. Ver [`commit-workflow/templates/task-closing.md`](../commit-workflow/templates/task-closing.md).
6. Registrar a promoção no Release Trail com: o que foi promovido, evidências, riscos aceitos e próximos passos.

### Checklist Promote

- [ ] Quality Gates satisfeitos.
- [ ] Done Criteria satisfeitos.
- [ ] Runbooks atualizados para novos failure modes (se aplicável).
- [ ] Riscos remanescentes aceitos formalmente ou movidos para follow-up.
- [ ] Task fechada com evidência.
- [ ] Release Trail atualizado com entrada de promoção.

---

## Fluxo completo

```
Hack → Sync → Finish → Ship → Validate → Promote
                          ↑         ↑          ↑
                      PR + deploy  staging   closure
```

Se Validate falhar → retorna para Hack com o comportamento observado como Red Bar.
Se Promote identificar risco inaceitável → retorna para Validate ou Hack conforme a natureza do risco.
