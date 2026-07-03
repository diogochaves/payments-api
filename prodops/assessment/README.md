# Assessment

Este diretório contém os artefatos de planejamento comprometidos da release atual.

## Papel no Framework ProdOps

```
Upstream
    ↓  (exploração, experimentos, hipóteses)
upstream/
    ↓  (decisão: promover para Downstream)
assessment/                ← planejamento comprometido (este diretório)
    ↓  (entrada para execução)
Downstream → Operation
```

`prodops/assessment/` guarda os artefatos que representam **decisões tomadas**: o recorte funcional aprovado, o contrato de execução da release, o premortem e o event storming. Esses artefatos saem da jornada Upstream como outputs de comprometimento, não como rascunhos exploratórios.

## Conteúdo

| Artefato | Caminho | Papel |
|---|---|---|
| Iteration Plan | [`iteration-plan.md`](iteration-plan.md) | Define o recorte funcional da iteração: o que "Entrou", "Saiu" ou foi "Adiado". |
| Reliability Plan | [`reliability-plan/README.md`](reliability-plan/README.md) | Contrato de execução da release: riscos, OBCs, backlog de confiabilidade e objetivos. |
| Premortem | [`premortem.md`](premortem.md) | Antecipação de falhas prováveis entre Checkout, Payments e Notification. |
| Event Storming | [`event-storming/plan.json`](event-storming/plan.json) | Estrutura de eventos, fluxos e sugestões de confiabilidade. |

## Distinção: Assessment vs Upstream

- **`prodops/upstream/`**: trabalho exploratório sem comprometimento — experimentos, hipóteses, OBC drafts, features de capabilities ainda não decididas.
- **`prodops/assessment/`**: artefatos comprometidos — decisions tomadas, contrato de execução da release, planejamento aprovado.

A origem não determina a localização. Um artefato produzido durante a jornada Upstream que representa uma decisão aprovada vive em `assessment/`, não em `upstream/`.

## Referências

- Exploração ativa: [`prodops/upstream/`](../upstream/)
- Histórico de decisões upstream: [`prodops/upstream/upstream-trail.md`](../upstream/upstream-trail.md)
- Execução da release: [`prodops/downstream/`](../downstream/)
- Fluxo completo: [`AGENTS.md`](../../AGENTS.md)
