# Níveis de Adoção Progressiva

> **Status: proposta.** Este documento descreve o modelo-alvo de adoção do ProdOps. Algumas
> capabilities referenciadas (manifest, capsules) estão em construção em branches paralelas e
> fazem parte do modelo.

## Por que adoção progressiva

O framework completo tem 7 fases e 8 tipos de artefato. Exigir tudo no dia 1 é um penhasco:
ninguém pula. Adoção progressiva substitui o penhasco por uma escada — cada nível entrega valor
próprio, custa pouco mais que o anterior e prova o framework antes de pedir mais compromisso.

**Regra:** cada nível precisa se pagar sozinho. Se um nível não entrega valor visível, ele não
merece ser adotado — e o próximo nível nem será considerado.

## Resumo

| Nível | Nome | Adota | Valor | Custo |
|---|---|---|---|---|
| 0 | Receipts | Router `AGENTS.md` + Release Trail + doctor | "Seu agente deixa evidências" | ~30 min |
| 1 | Contracts | + OBC + BDD Feature + gate no-mocks | Contratos antes de código | horas |
| 2 | Governed delivery | + pipeline CI Sync completo + hooks + quality gates | Entrega local governada | dias |
| 3 | Full governance | + CI Async (ship/validate/promote) + SLOs + CI acoplado ao trail | Governança completa | semanas |

---

## Nível 0 — "Receipts"

Seu agente de IA passa a deixar evidências de tudo que faz.

| O que adota | Descrição |
|---|---|
| Router `AGENTS.md` | Arquivo curto na raiz que aponta o agente para o contexto certo |
| Release Trail | `prodops/artifacts/trails/release-trail.md` — registro append-only de cada entrega |
| Doctor | `prodops/scripts/doctor.sh` — verifica que a estrutura não apodreceu |

**O que você ganha:** toda mudança feita por agente vira uma entrada datada no trail — o que
mudou, quais testes rodaram, quais arquivos foram tocados. Auditoria de trabalho de IA sem
processo nenhum além de "escreva o recibo".

**Done-criteria:**
- [ ] `AGENTS.md` existe na raiz e o agente o lê no início da sessão
- [ ] `prodops/scripts/doctor.sh` roda verde
- [ ] Pelo menos 1 tarefa executada por agente gerou entrada no Release Trail

**Pronto para o Nível 1 quando:** você olha o trail e pensa "as evidências existem, mas nada
garante que o agente implementou a coisa *certa*".

---

## Nível 1 — "Contracts"

Contratos antes de código: o agente só implementa o que está especificado e observável.

| O que adota | Descrição |
|---|---|
| OBC | Observable Business Contract em `prodops/artifacts/obcs/` — critério de aceite formal |
| BDD Feature | Cenários Gherkin em `prodops/artifacts/bdd/` que respaldam os testes de aceitação |
| Gate no-mocks | Grep que bloqueia `jest.fn()`, `spyOn(...).mock*` e `.overrideProvider()` em testes de aceitação |

**O que você ganha:** o agente não pode "passar nos testes" mockando a realidade. Testes de
aceitação exercitam serviços reais; o comportamento entregue é o comportamento contratado.

**Done-criteria:**
- [ ] Pelo menos 1 OBC committed com métricas observáveis
- [ ] BDD Feature cobrindo os cenários do OBC, com testes de aceitação verdes
- [ ] Gate no-mocks rodando (local ou CI) e bloqueando violações

**Pronto para o Nível 2 quando:** os contratos funcionam, mas cada entrega segue um caminho
ad-hoc diferente — você quer que toda entrega passe pelo mesmo funil.

---

## Nível 2 — "Governed delivery"

Toda entrega local passa pelo mesmo pipeline síncrono, com gates que bloqueiam de verdade.

| O que adota | Descrição |
|---|---|
| CI Sync completo | Bootstrap → Hack → Sync → Finish (`prodops/journeys/delivery/phases/`) |
| Hooks | Automação no agente: gates rodam sem depender de disciplina humana |
| Quality gates | `prodops/journeys/delivery/phases/finish/quality-gates.md` — o que bloqueia merge |
| Manifest | `manifest.yaml` descrevendo stack, caminhos e gates da instância |

**O que você ganha:** entrega previsível. O agente inicia com contexto (Bootstrap), implementa
via TDD sem mocks (Hack), integra (Sync) e só fecha com trail + gates verdes (Finish).

**Done-criteria:**
- [ ] As 4 fases do CI Sync documentadas e usadas em toda entrega
- [ ] Hooks instalados: gates executam automaticamente
- [ ] Zero entregas fora do pipeline nas últimas 2 semanas

**Pronto para o Nível 3 quando:** o que sai da máquina é governado, mas o caminho até produção
(deploy, validação em ambiente, promoção) ainda é manual ou invisível.

---

## Nível 3 — "Full governance"

A governança se estende da máquina local até a produção.

| O que adota | Descrição |
|---|---|
| CI Async | Ship → Validate → Promote em pipelines de plataforma |
| Validação de SLO | Promoção condicionada a SLOs medidos em ambiente, não a "parece ok" |
| CI acoplado ao trail | Pipeline exige entrada no Release Trail; PR sem evidência não passa |
| Capsules | Unidades versionadas de contexto/entrega que viajam com o release |

**O que você ganha:** rastreabilidade de ponta a ponta — de Intent a OBC a código a deploy a
SLO em produção. Rollback e promoção baseados em evidência.

**Done-criteria:**
- [ ] Ship/Validate/Promote rodando como pipelines automatizados
- [ ] Pelo menos 1 promoção bloqueada ou aprovada por validação de SLO
- [ ] CI rejeita PRs sem acoplamento ao Release Trail

---

## Como começar

Comece pelo Nível 0 seguindo o [quickstart](quickstart.md) — 10 minutos, um projeto novo, e
seu agente já deixa recibos.
