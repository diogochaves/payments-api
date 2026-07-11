# Quickstart — Nível 0 em 10 minutos

> **Status: proposta.** Walkthrough do Nível 0 ("Receipts") dos
> [níveis de adoção](adoption-levels.md) em um projeto **novo** — não neste repositório.

Ao final: seu agente de IA executa uma tarefa e deixa um recibo verificável. Nenhum processo,
nenhuma cerimônia — só evidência.

## Pré-requisitos

- Um repositório git (qualquer stack)
- Um agente de IA que leia `AGENTS.md` (Claude Code, Copilot, Codex, Cursor)

## Passo 1 — Copie a estrutura (~3 min)

Três arquivos. É todo o Nível 0.

```
seu-projeto/
├── AGENTS.md                                  # router: aponta o agente para o contexto
└── prodops/
    ├── artifacts/trails/release-trail.md      # registro append-only de entregas
    └── scripts/doctor.sh                      # verifica que a estrutura existe
```

**`AGENTS.md`** (raiz do projeto):

```markdown
# Operating Guide

Após completar qualquer tarefa que mude código, registre uma entrada em
`prodops/artifacts/trails/release-trail.md` com: data/hora, resumo, arquivos
tocados e validações executadas (comandos de teste/build). Entradas mais
recentes no topo. Nunca edite entradas anteriores.
```

**`prodops/artifacts/trails/release-trail.md`**:

```markdown
# Release Trail

Registro append-only. Toda entrega gera uma entrada: `## AAAA-MM-DD HH:MM`,
Summary, Code (arquivos), Tests (validações executadas).
```

**`prodops/scripts/doctor.sh`**:

```bash
#!/usr/bin/env bash
set -euo pipefail
for path in AGENTS.md prodops/artifacts/trails/release-trail.md; do
  [[ -e "$path" ]] && echo "PASS: $path" || { echo "FAIL: missing $path"; exit 1; }
done
```

## Passo 2 — Verifique com o doctor (~1 min)

```bash
chmod +x prodops/scripts/doctor.sh && ./prodops/scripts/doctor.sh
```

Duas linhas `PASS`. Estrutura no lugar.

## Passo 3 — Rode uma tarefa pequena (~4 min)

Abra seu agente e peça algo real e pequeno, por exemplo:

> Adicione validação de e-mail no formulário de cadastro e rode os testes.

O agente lê o `AGENTS.md`, faz a mudança — e antes de encerrar, escreve o recibo.

## Passo 4 — Veja a evidência aparecer (~2 min)

```bash
head -20 prodops/artifacts/trails/release-trail.md
```

```markdown
## 2026-07-11 14:32

### Summary
Adicionada validação de e-mail no formulário de cadastro.

### Code
- `src/forms/signup.ts`

### Tests
- Validação executada: `npm test -- signup`
```

Esse é o Nível 0 funcionando: **seu agente deixa evidências**. Quem mudou o quê, quando, e
o que foi validado — sem você pedir a cada tarefa.

## Teaser — quando o gate pega o agente

O trail registra *o que* o agente fez. O próximo nível controla *como*. Uma amostra: o gate
no-mocks do Nível 1 é um grep que proíbe test doubles em testes de aceitação:

```bash
grep -rn "jest\.fn()\|spyOn(.*)\.mock\|overrideProvider" test/ && exit 1 || echo "PASS"
```

Peça ao agente uma feature com teste e rode o gate. Cedo ou tarde chega este momento:

```
test/payment.e2e-spec.ts:12: const gateway = { charge: jest.fn().mockResolvedValue({ ok: true }) };
FAIL: acceptance test uses a test double
```

O agente "passou nos testes" mockando o gateway — e **foi pego**. Ele volta, sobe uma
dependência real (ex.: LocalStack) e reescreve o teste contra o serviço de verdade. Essa é a
diferença entre evidência e garantia.

## Próximo passo — Nível 1

Contratos antes de código: OBC + BDD Feature + gate no-mocks permanente. Critérios de
prontidão e done-criteria em [adoption-levels.md](adoption-levels.md#nível-1--contracts).
