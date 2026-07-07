# Sync + Finish Flow

Sync e Finish são os dois últimos estágios do **CI Sync**. Garantem que a implementação está consistente com os artefatos ProdOps, que todos os Quality Gates passam, e que o trabalho está pronto para o CI Async.

```
CI Sync: Bootstrap → Hack → Sync → Finish
                                        ↓
CI Async:                             Ship → Validate → Promote
```

Para mecânica de execução, veja [`skills/sync/`](../../../skills/sync/) e [`skills/finish/`](../../../skills/finish/).

---

## Sync

Objetivo: confirmar que todos os artefatos tocados pela implementação do Hack estão consistentes entre si.

Checklist:
- [ ] BDD Feature reflete o comportamento implementado.
- [ ] Critérios de aceite do OBC estão satisfeitos pelos testes.
- [ ] Diagrama de arquitetura atualizado se a mudança foi estrutural.
- [ ] Event Storming atualizado se eventos foram adicionados, removidos ou renomeados.
- [ ] Entrada no Release Trail redigida com evidências.

## Finish

Objetivo: confirmar que todos os Quality Gates passam antes de marcar o trabalho como pronto para ship.

Checklist:
- [ ] Lint passa (`npm run lint` exit 0).
- [ ] Todos os testes passam (unit + acceptance).
- [ ] Build passa.
- [ ] Nenhum TODO ou FIXME não resolvido introduzido nesta mudança.
- [ ] Definition of Done satisfeita. Ver [definition-of-done.md](../../engineering/definition-of-done.md).
- [ ] Evidência acrescentada ao Release Trail.

Uma implementação não sai do Finish até que todos os itens estejam marcados.

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

---

## Commit Workflow no Finish

O Finish é responsável por:

1. Validar histórico de commits (todos seguem Conventional Commits).
2. Executar formatter + lint (sem erros).
3. Executar build (sem erros TypeScript).
4. Executar testes unitários e de aceitação.
5. Validar contratos (BDD Features, OpenAPI, AsyncAPI).
6. Preencher o template de PR com evidências.
7. Publicar o Pull Request.
8. Marcar a Task como concluída com o template [task-closing.md](../../commit-workflow/templates/task-closing.md).

Checklist completo: [commit-workflow/docs/finish-checklist.md](../../commit-workflow/docs/finish-checklist.md)

Template de PR: [commit-workflow/templates/pull_request.md](../../commit-workflow/templates/pull_request.md)
