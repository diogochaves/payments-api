→ [Voltar para Delivery](../../README.md)

# Sync

Objetivo: confirmar que todos os artefatos tocados pela implementação do Hack estão consistentes entre si.

Checklist:
- [ ] BDD Feature reflete o comportamento implementado.
- [ ] Critérios de aceite do OBC estão satisfeitos pelos testes.
- [ ] Diagrama de arquitetura atualizado se a mudança foi estrutural.
- [ ] Event Storming atualizado se eventos foram adicionados, removidos ou renomeados.
- [ ] Entrada no Release Trail redigida com evidências.

---

## Commit Workflow no Sync

Após Hack, antes de abrir PR:

### Atualização de branch

```bash
git fetch origin
git rebase origin/main   # ou merge, conforme política do projeto
```

Se houver conflitos: resolva, rode lint + testes, continue o rebase.

### Reexecução das validações após rebase

```bash
cd api && npm run lint
cd api && npm run test
./scripts/test-acceptance.sh
```

As validações devem passar sobre o histórico rebaseado antes de prosseguir.

### Reorganização de commits (opcional)

Se o histórico ficou fragmentado durante o Hack:

```bash
git rebase -i origin/main
```

Consolide commits `fixup`/`squash` de forma que o histórico final seja coerente. Cada commit resultante deve passar `commit-msg` validation (Conventional Commits).

Para mecânica de execução, veja [`prodops/skills/sync/`](../../../../skills/sync/) e [`prodops/skills/finish/`](../../../../skills/finish/).
