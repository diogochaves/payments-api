# Hack Flow

Hack Flow é o segundo estágio do **CI Sync**, sucede o [Bootstrap](bootstrap-flow.md) e precede o Sync. É usado em Upstream e Downstream e produz implementação com testes, contratos, observabilidade e evidência registrada.

O Hack recebe do Bootstrap uma branch limpa, o ambiente pronto, os artefatos ProdOps lidos e o contrato verificado. **O Hack começa diretamente no TDD — não há leitura ou preparação antes do primeiro teste.**

## Capabilities do Hack Flow

O Hack Flow consome duas capabilities obrigatórias:

```
Hack Flow
├── ProdOps TDD       → define como implementar
└── Commit Workflow   → define como validar, versionar e publicar
```

O Hack é responsável pela implementação. Ele não é substituído por nenhuma das capabilities — ele as consume.

- **ProdOps TDD:** orienta o ciclo de codificação (Contract First, Integration First, Observability First). Ver [practices/tdd-prodops.md](practices/tdd-prodops.md).
- **Commit Workflow:** executa após cada ciclo Red→Green→Refactor. Ver [../commit-workflow/README.md](../commit-workflow/README.md).

For execution mechanics — branching, commands, lint, tests, commit format — see [`skills/hack/`](../../skills/hack/).

---

## Sequence

```
Teste → Implementação → Observabilidade → Refactor → Commit → Validação → Evidência
```

### Step 1 — Write the integration test first (Red Bar)

**Pré-condição:** Bootstrap entregou branch limpa, artefatos lidos e contrato verificado. Se isso não ocorreu, volte ao Bootstrap antes de continuar.

- Write a test that expresses the desired behavior at the HTTP or event boundary.
- Prioritize integration and acceptance tests over unit tests.
- Run the test and confirm it fails for the expected behavioral reason.
- Do not proceed to implementation until the red bar is confirmed.

### Step 2 — Implement the minimum (Green Bar)

- Write the smallest production change that makes the failing test pass.
- Do not add logic not demanded by the test.
- Do not modify production code to make the test pass artificially.

### Step 3 — Refactor

- Improve structure while keeping tests green.
- Apply Clean Code rules: explicit names, small functions, clear control flow.
- Run tests again after refactoring.

### Step 4 — Commit (Commit Workflow)

Após cada ciclo Red→Green→Refactor, executar o Commit Workflow:

```bash
# Se os hooks estiverem configurados, rodam automaticamente no commit:
#   formatter → lint → unit tests → commit-msg validation
git commit -m "<type>(<scope>): <summary>"
```

Se os hooks não estiverem configurados:
```bash
cd api && npm run lint   # formatter + lint com --fix
cd api && npm run test   # unit tests
```

O Commit Workflow não é responsabilidade do ProdOps TDD — é uma capability separada que o Hack consome. Ver [../commit-workflow/README.md](../commit-workflow/README.md).

### Step 5 — Validate observability

After green bar:
- Verify that relevant logs are emitted with the expected structure.
- Verify error responses carry meaningful messages.
- Verify that correlation IDs and tenant context propagate correctly.
- Confirm that no secret or PII appears in logs.

### Step 6 — Run quality checks

```sh
# Inside api/
npm run lint        # ESLint + Prettier with --fix; must exit 0
npm run test        # unit tests
./scripts/test-acceptance.sh   # full acceptance suite — when payment behavior or contracts changed
```

See [skills/hack/SKILL.md](../../skills/hack/SKILL.md) for the full validation list.

### Step 7 — Record evidence

Before moving to Sync or Finish:
- Append evidence to `prodops/downstream/release-trail.md` (Downstream) or the experiment's `upstream-trail.md` (Upstream).
- Evidence must include: test output, lint output, and a summary of what changed.

---

## Guardrails

- If the contract or acceptance criterion is missing, stop: Bootstrap was not completed. Return to Bootstrap before writing any test.
- Do not skip the red bar — a test that was never red may not actually verify behavior.
- Do not use mocks for owned services or business rules. See [practices/tdd-prodops.md](practices/tdd-prodops.md) and [testing policy](../engineering/testing-policy.md).
- Do not modify production code solely to make a test pass.
- Do not add features beyond what the current test demands.
- Preserve existing architecture and module boundaries.

---

## Commit Workflow

Durante o Hack, cada commit deve seguir o Commit Workflow.

**Commits pequenos:** prefira commits que representam uma única intenção. Um commit por Red Bar confirmado é um bom tamanho.

**Validação automática:** se os Git hooks estiverem configurados (`git config core.hooksPath prodops/commit-workflow/hooks`), as validações rodam no commit. Para configurar:

```bash
git config core.hooksPath prodops/commit-workflow/hooks
```

**Conventional Commit obrigatório:**

```
<type>(<scope>): <summary>
```

Tipos válidos: `feat fix docs test refactor perf build ci style chore revert`

Ver: [commit-workflow/docs/conventional-commits.md](../commit-workflow/docs/conventional-commits.md)
