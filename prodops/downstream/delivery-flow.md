# Delivery Flow

A entrega Downstream segue o fluxo completo e governado:

```text
Hack -> Sync -> Finish -> Ship -> Validate -> Promote
```

## Expectativas por estágio

- Hack: implementar com TDD a partir das BDD Features.
- Sync: alinhar código, documentação, BDD, OBCs e referências do Reliability Plan.
- Finish: executar Quality Gates e confirmar os Done Criteria.
- Ship: preparar o deploy ou a prontidão do PR.
- Validate: comprovar comportamento com evidências, métricas, logs, eventos e SLOs quando disponíveis.
- Promote: aprovar ou fechar o estágio de release com os riscos remanescentes explícitos.

Registrar evidências significativas de entrega em `prodops/downstream/release-trail.md`.
