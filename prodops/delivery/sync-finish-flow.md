# Sync + Finish Flow

Sync e Finish são os dois últimos estágios do **CI Sync**. Garantem que a implementação está consistente com os artefatos ProdOps, que todos os Quality Gates passam, e que o trabalho está pronto para o CI Async.

```
CI Sync: Bootstrap → Hack → Sync → Finish
                                        ↓
CI Async:                             Ship → Validate → Promote
```

Para mecânica de execução, veja [`skills/sync/`](../../skills/sync/) e [`skills/finish/`](../../skills/finish/).

---

## Sync

Goal: confirm that all artifacts touched by the Hack implementation are consistent with each other.

Checklist:
- [ ] BDD Feature reflects implemented behavior.
- [ ] OBC acceptance criteria are met by the tests.
- [ ] Architecture diagram updated if the change was structural.
- [ ] Event Storming plan updated if events were added, removed, or renamed.
- [ ] Release Trail entry drafted with evidence.

## Finish

Goal: confirm all quality gates pass before marking the work ready to ship.

Checklist:
- [ ] Lint passes (`npm run lint` exits 0).
- [ ] All tests pass (unit + acceptance).
- [ ] Build passes.
- [ ] No unresolved TODOs or FIXMEs introduced in this change.
- [ ] Definition of Done satisfied. See [definition-of-done.md](../engineering/definition-of-done.md).
- [ ] Evidence appended to release trail.

An implementation does not leave Finish until all boxes are checked.

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
8. Marcar a Task como concluída com o template [task-closing.md](../commit-workflow/templates/task-closing.md).

Checklist completo: [commit-workflow/docs/finish-checklist.md](../commit-workflow/docs/finish-checklist.md)

Template de PR: [commit-workflow/templates/pull_request.md](../commit-workflow/templates/pull_request.md)
