→ [Voltar para Delivery](../../README.md)

# Sync

---

## Visão Geral

**Para que serve:** Checkpoint de consistência entre o Hack e o Finish. Tem dois steps independentes: sincronizar a feature branch com a base (`rebase`) e alinhar os artefatos ProdOps com o que foi implementado (`align`).

**Como funciona:**

```
sync rebase: Fetch remoto → Atualiza base (fast-forward) → Integra na feature
             → Resolve conflitos → Preserva TDD → Valida → Branch limpa

sync align:  Identifica artefatos stale → Rastreia fonte de verdade em prodops/
             → Atualiza só o que mudou → Registra no Release Trail
```

Os dois steps são independentes — podem ser executados na ordem que fizer sentido ou individualmente conforme a necessidade.

**Guardrails principais:**

- Nunca descarta trabalho local nem reescreve histórico compartilhado
- Não enfraquece testes para fazer o sync passar
- Conflitos são inspecionados dos dois lados antes de qualquer edição
- Não reescreve decisões de produto durante trabalho de alinhamento de artefatos

**Posição no fluxo:**

```
CI Sync  →  Bootstrap → Hack → [Sync] → Finish
                                  ├── rebase  (branch)
                                  └── align   (artefatos)
```

---

## Steps

O Sync é composto por dois steps independentes, executados via `/sync <step>`:

| Step | Responsabilidade |
|---|---|
| [`rebase`](../../../../skills/sync/steps/rebase/SKILL.md) | Sincronizar a feature branch com a base: fetch, fast-forward, integrar, resolver conflitos, preservar TDD, validar |
| [`align`](../../../../skills/sync/steps/align/SKILL.md) | Alinhar artefatos ProdOps com a implementação: BDD Features, Event Storming, arquitetura, Release Trail |

Para mecânica de execução completa, veja [`prodops/skills/sync/`](../../../../skills/sync/).

---

## Checklist

### sync rebase

- [ ] Branch atualizada a partir da base mais recente.
- [ ] Conflitos resolvidos com ambos os lados inspecionados.
- [ ] Testes passam sobre o histórico integrado.
- [ ] Nenhum teste foi removido ou enfraquecido para completar o sync.

### sync align

- [ ] BDD Feature reflete o comportamento implementado.
- [ ] Critérios de aceite do OBC estão satisfeitos pelos testes.
- [ ] Diagrama de arquitetura atualizado se a mudança foi estrutural.
- [ ] Event Storming atualizado se eventos foram adicionados, removidos ou renomeados.
- [ ] Entrada no Release Trail redigida com evidências.
