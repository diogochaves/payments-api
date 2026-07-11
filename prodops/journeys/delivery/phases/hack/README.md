# Hack Flow

Hack Flow é a segunda fase do **CI Sync**, sucede o [Bootstrap](../bootstrap/README.md) e precede o Sync. É usado em Upstream e Downstream e produz implementação com testes, contratos, observabilidade e evidência registrada.

O Hack recebe do Bootstrap uma branch limpa, o ambiente pronto, os artefatos ProdOps lidos e o contrato verificado. **O Hack começa diretamente no TDD — não há leitura ou preparação antes do primeiro teste.**

---

## Visão Geral

**Para que serve:** É a fase de implementação do CI Sync. Transforma critérios de aceite do OBC e cenários BDD em código verificável por testes, seguindo o ciclo Red→Green→Refactor.

**Como funciona:**

```
Red Bar (teste falha pela razão certa) → Green Bar (mínimo que passa)
→ Refactor → Commit Workflow → Validação → Evidência no Release Trail
```

**Guardrails principais:**

- Não pular o Red Bar — um teste que nunca foi vermelho pode não verificar o comportamento de fato
- Não usar mocks para serviços próprios ou regras de negócio
- Não adicionar features além do que o teste atual exige
- Se contrato ou critério de aceite estiver ausente, parar e voltar ao Bootstrap

**Posição no fluxo:**

```
CI Sync  →  Bootstrap → [Hack] → Sync → Finish
```

---

## Capabilities do Hack Flow

O Hack Flow consome duas capabilities obrigatórias:

```
Hack Flow
├── ProdOps TDD       → define como implementar
└── Commit Workflow   → define como validar, versionar e publicar
```

O Hack é responsável pela implementação. Ele não é substituído por nenhuma das capabilities — ele as consume.

- **ProdOps TDD:** orienta o ciclo de codificação (Contract First, Integration First, Observability First). Ver [practices/prodops-tdd.md](../../practices/prodops-tdd.md).
- **Commit Workflow:** executa após cada ciclo Red→Green→Refactor. Ver [capabilities/commit-workflow/README.md](../../capabilities/commit-workflow/README.md).

Para mecânica de execução — branching, comandos, lint, testes, formato de commit — ver [`prodops/skills/hack/`](../../../../skills/hack/).

---

## Sequência

```
Teste → Implementação → Observabilidade → Refactor → Commit → Validação → Evidência
```

### Passo 1 — Escrever o teste de integração primeiro (Red Bar)

**Pré-condição:** Bootstrap entregou branch limpa, artefatos lidos e contrato verificado. Se isso não ocorreu, volte ao Bootstrap antes de continuar.

- Escrever um teste que expresse o comportamento desejado na fronteira HTTP ou de evento.
- Priorizar testes de integração e aceitação sobre unit tests.
- Executar o teste e confirmar que ele falha pela razão comportamental esperada.
- Não avançar para a implementação até que o Red Bar esteja confirmado.

### Passo 2 — Implementar o mínimo (Green Bar)

- Escrever a menor mudança de produção que faz o teste falho passar.
- Não adicionar lógica não exigida pelo teste.
- Não modificar código de produção para fazer o teste passar artificialmente.
- Verificar os requisitos de confiabilidade que se aplicam ao comportamento implementado: timeout, retry com idempotência, tratamento de exceções, mensagens de erro, status HTTP, degradação controlada. Ver [reliability-policy.md](../../capabilities/reliability-policy.md#requisitos-de-confiabilidade-por-comportamento).

### Passo 3 — Refatorar

- Melhorar a estrutura mantendo os testes verdes.
- Aplicar regras de Clean Code: nomes explícitos, funções pequenas, fluxo de controle claro.
- Executar os testes novamente após a refatoração.

### Passo 4 — Commit (Commit Workflow)

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

O Commit Workflow não é responsabilidade do ProdOps TDD — é uma capability separada que o Hack consome. Ver [capabilities/commit-workflow/README.md](../../capabilities/commit-workflow/README.md).

### Passo 5 — Validar observabilidade

Após o Green Bar:
- Verificar que os logs relevantes são emitidos com a estrutura esperada.
- Verificar que respostas de erro têm mensagens significativas.
- Verificar que correlation IDs e contexto de tenant são propagados corretamente.
- Confirmar que nenhum secret ou PII aparece nos logs.

### Passo 6 — Executar verificações de qualidade

```sh
# Dentro de api/
npm run lint        # ESLint + Prettier com --fix; deve sair com código 0
npm run test        # unit tests
./scripts/test-acceptance.sh   # suite completa de aceitação — quando comportamento de pagamento ou contratos mudaram
```

Ver [prodops/skills/hack/SKILL.md](../../../../skills/hack/SKILL.md) para a lista completa de validações.

### Passo 7 — Registrar evidência

Antes de avançar para Sync ou Finish:
- Acrescentar evidência em `prodops/artifacts/trails/release-trail.md` (Downstream) ou no `upstream-trail.md` do experimento (Upstream).
- Evidência deve incluir: saída dos testes, saída do lint e resumo do que mudou.

---

## Guardrails

- Se o contrato ou critério de aceite estiver ausente, parar: o Bootstrap não foi concluído. Retornar ao Bootstrap antes de escrever qualquer teste.
- Não pular o Red Bar — um teste que nunca foi vermelho pode não verificar o comportamento de fato.
- Não usar mocks para serviços próprios ou regras de negócio. Ver [practices/prodops-tdd.md](../../practices/prodops-tdd.md) e [testing policy](../../practices/testing-policy.md).
- Não modificar código de produção apenas para fazer um teste passar.
- Não adicionar features além do que o teste atual exige.
- Preservar a arquitetura e os limites de módulos existentes.

---

## Commit Workflow

Durante o Hack, cada commit deve seguir o Commit Workflow.

**Commits pequenos:** prefira commits que representam uma única intenção. Um commit por Red Bar confirmado é um bom tamanho.

**Validação automática:** se os Git hooks estiverem configurados (`git config core.hooksPath prodops/journeys/delivery/capabilities/commit-workflow/hooks`), as validações rodam no commit. Para configurar:

```bash
git config core.hooksPath prodops/journeys/delivery/capabilities/commit-workflow/hooks
```

**Conventional Commit obrigatório:**

```
<type>(<scope>): <summary>
```

Tipos válidos: `feat fix docs test refactor perf build ci style chore revert`

Ver: [capabilities/commit-workflow/README.md — Conventional Commits](../../capabilities/commit-workflow/README.md#conventional-commits)
