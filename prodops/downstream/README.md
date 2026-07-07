# Downstream

Downstream é o caminho de entrega governado do ProdOps.

Use para itens aprovados no Iteration Backlog, execução do Reliability Plan,
TDD guiado por BDD, atualizações de OBC, Quality Gates, evidências no Release
Trail, validação de observabilidade e preparação de entrega.

O fluxo padrão é:

```text
Hack -> Sync -> Finish -> Ship -> Validate -> Promote
```

O Downstream deve preservar rastreabilidade desde o estado atual e o assessment
até a implementação, validação e promoção.
