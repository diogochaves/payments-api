# Hack Flow

Hack Flow is the coding phase of ProdOps Delivery. It is used in both Upstream and Downstream and produces implementation with tests, contracts, observability, and recorded evidence.

## Capabilities do Hack Flow

O Hack Flow consome duas capabilities obrigatórias:

```
Hack Flow
├── ProdOps TDD       → define como implementar
└── Commit Workflow   → define como validar, versionar e publicar
```

O Hack continua sendo responsável pela implementação. Ele não é substituído por nenhuma das capabilities — ele as consume.

- **ProdOps TDD:** orienta o ciclo de codificação (Contract First, Integration First, Observability First). Ver [practices/tdd-prodops.md](practices/tdd-prodops.md).
- **Commit Workflow:** executa após cada ciclo Red→Green→Refactor (formatter, lint, testes rápidos, Conventional Commit). Ver [../commit-workflow/README.md](../commit-workflow/README.md).

For execution mechanics — branching, commands, lint, tests, commit format — see [`skills/hack/`](../../skills/hack/).

---

## Sequence

```
Contrato → Teste → Implementação → Observabilidade → Refactor → Commit → Validação → Evidência
```

### Step 1 — Understand the expected behavior
Read the relevant ProdOps artifacts before touching code:
- OBC in `prodops/assessment/reliability-plan/obcs/`
- BDD Feature in `prodops/current-state/features/` or `prodops/upstream/features/`
- Reliability Plan risks and mitigation actions

Do not invent missing acceptance criteria. If a gap exists, record it and ask for clarification.

### Step 2 — Identify or create a verifiable contract
Before writing a test or implementation:
- Check for an existing OpenAPI spec, AsyncAPI contract, BDD Feature, or schema.
- If none exists, create or update it first.
- The contract is the reference for both the test and the implementation.

### Step 3 — Write the integration test first (Red Bar)
- Write a test that expresses the desired behavior at the HTTP or event boundary.
- Prioritize integration and acceptance tests over unit tests.
- Run the test and confirm it fails for the expected behavioral reason.
- Do not proceed to implementation until the red bar is confirmed.

### Step 4 — Implement the minimum (Green Bar)
- Write the smallest production change that makes the failing test pass.
- Do not add logic not demanded by the test.
- Do not modify production code to make the test pass artificially.

### Step 5 — Refactor
- Improve structure while keeping tests green.
- Apply Clean Code rules: explicit names, small functions, clear control flow.
- Run tests again after refactoring.

### Step 5a — Commit (Commit Workflow)
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

### Step 6 — Validate observability
After green bar:
- Verify that relevant logs are emitted with the expected structure.
- Verify error responses carry meaningful messages.
- Verify that correlation IDs and tenant context propagate correctly.
- Confirm that no secret or PII appears in logs.

### Step 7 — Run quality checks
```sh
# Inside api/
npm run lint        # ESLint + Prettier with --fix; must exit 0
npm run test        # unit tests
./scripts/test-acceptance.sh   # full acceptance suite (requires LocalStack)
```

Run lint after green phase, after refactor, and before commit. See [skills/hack/SKILL.md](../../skills/hack/SKILL.md) for the full validation list.

### Step 8 — Record evidence
Before moving to Sync or Finish:
- Append evidence to `prodops/downstream/release-trail.md` (Downstream) or the experiment's `upstream-trail.md` (Upstream).
- Evidence must include: test output, lint output, and a summary of what changed.

---

## Guardrails

- Do not start coding without a contract or acceptance criterion.
- Do not skip the red bar — a test that was never red may not actually verify behavior.
- Do not use mocks for owned services or business rules. See [practices/tdd-prodops.md](practices/tdd-prodops.md) and [testing policy](../engineering/testing-policy.md).
- Do not modify production code solely to make a test pass.
- Do not add features beyond what the current test demands.
- Preserve existing architecture and module boundaries.

## Commit Workflow

Durante o Hack, cada commit deve seguir o Commit Workflow.

### Commits pequenos

Prefira commits que representam uma única intenção. Um commit por Red Bar confirmado é um bom tamanho. Commits grandes dificultam revisão e revert.

### Validação antes do commit

Se os Git hooks estiverem configurados (`git config core.hooksPath prodops/commit-workflow/hooks`), as validações rodam automaticamente:

1. Formatter (lint com `--fix`)
2. Lint
3. Unit tests

Para configurar os hooks:

```bash
git config core.hooksPath prodops/commit-workflow/hooks
```

Para rodar manualmente sem hooks:

```bash
cd api && npm run lint
cd api && npm run test
```

### Conventional Commit obrigatório

Toda mensagem de commit deve seguir o formato:

```
<type>(<scope>): <summary>
```

Tipos válidos: `feat fix docs test refactor perf build ci style chore revert`

Ver: [commit-workflow/docs/conventional-commits.md](../commit-workflow/docs/conventional-commits.md)

### Referência

Documentação completa: [prodops/commit-workflow/README.md](../commit-workflow/README.md)
