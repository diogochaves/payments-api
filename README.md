# Payments API — ProdOps University Reference Project

Payments API é um projeto de referência da [ProdOps University](https://prodops.university/). Ele demonstra, em um único repositório, como código, contratos, especificações, observabilidade, confiabilidade, operação e artefatos de produto podem se conectar na evolução de um produto digital.

Este repositório não deve ser lido apenas como uma API de pagamentos. Ele é um laboratório educacional funcional: a aplicação pode ser executada localmente, possui backend, frontend de teste, contratos, cenários BDD, infraestrutura local e artefatos ProdOps, mas seu objetivo principal é demonstrar a aplicação prática do Framework ProdOps ao longo da jornada de produto.

O projeto é conceitual e educacional. Ele não representa, por si só, uma solução pronta para produção; representa um ambiente de estudo para alunos entenderem como decisões de produto, confiabilidade, especificação e operação aparecem em um produto real.

## Sumário

- [Resumo Executivo](#resumo-executivo)
- [Propósito Educacional](#propósito-educacional)
- [Relação com o Framework ProdOps](#relação-com-o-framework-prodops)
- [Artefatos ProdOps no Projeto](#artefatos-prodops-no-projeto)
- [Mapa do Repositório](#mapa-do-repositório)
- [Como Executar Localmente](#como-executar-localmente)
- [Ambiente Serverless Local](#ambiente-serverless-local)
- [Como Estudar Este Projeto](#como-estudar-este-projeto)
- [Status do Projeto](#status-do-projeto)
- [Próximos Artefatos Sugeridos](#próximos-artefatos-sugeridos)
- [Licença e Uso](#licença-e-uso)

## Resumo Executivo

Payments API simula o domínio de pagamentos de um ecommerce, no contexto da Magazine Siara usado nos artefatos ProdOps do repositório. O backend em NestJS expõe fluxos como criação de invoice, cancelamento de invoice, webhook de confirmação de pagamento e integração com provedor Asaas em modo real ou mockado.

O repositório também inclui um frontend Vite para testar a jornada localmente, scripts de sandbox, testes automatizados, infraestrutura AWS/SAM/Localstack, CI de release e documentos que conectam o comportamento técnico aos métodos de produto e confiabilidade do Framework ProdOps.

Como projeto de formação, o foco não é apenas mostrar como implementar endpoints. O foco é demonstrar como um produto digital pode ser especificado, observado, operado, testado, avaliado por risco e evoluído com base em contratos e artefatos claros.

## Propósito Educacional

O objetivo deste projeto é apoiar a formação da [ProdOps University](https://prodops.university/) mostrando como os métodos ProdOps aparecem em um repositório real:

- Transformar contexto de produto em artefatos navegáveis.
- Conectar Product Deck, Service Deck, BDD, ODD, Reliability Plan e Release Trail.
- Demonstrar como requisitos de negócio viram contratos, testes e eventos observáveis.
- Explorar confiabilidade como parte da jornada de produto, não como atividade separada.
- Permitir que alunos rodem a aplicação, observem comportamento, leiam os riscos e proponham evoluções.

Por isso, o payments-api é funcional e executável localmente, mas continua sendo uma referência educacional e conceitual.

## Relação com o Framework ProdOps

O repositório materializa vários elementos do Framework ProdOps:

| Método ou artefato | Como aparece neste projeto |
| --- | --- |
| Product Deck | O contexto do produto Payments está documentado em [prodops/current-state/product-deck.md](prodops/current-state/product-deck.md). |
| Service Deck | A jornada Compra com Pix está descrita em [prodops/current-state/service-decks/compra-com-pix.md](prodops/current-state/service-decks/compra-com-pix.md). |
| Observable Business Contract / OBC | OBCs aparecem como seções do Product Deck e Service Deck, conectando eventos, SLIs, SLOs iniciais, impacto, resposta e dono. |
| OpenAPI | Não há um arquivo OpenAPI completo no estado atual. Existe um ODD/contrato operacional em [api/odd/create_invoice.yaml](api/odd/create_invoice.yaml). |
| BDD / cenários de comportamento | Os cenários estão em [prodops/current-state/features](prodops/current-state/features) e também em [docs/features](docs/features). |
| Observability Driven Design | Existe um artefato ODD para criação de invoice em [api/odd/create_invoice.yaml](api/odd/create_invoice.yaml), além de eventos observáveis no código. |
| Product Reliability Engineering / PRE | O repositório inclui premortem, riscos, oportunidades, tracking list e reliability plan em [prodops/assessment](prodops/assessment). |
| Reliability Plan | O plano de confiabilidade da release está em [prodops/assessment/reliability-plan/README.md](prodops/assessment/reliability-plan/README.md). |
| SLOs / OpenSLO | SLOs iniciais existem em formato documental no Product Deck e Service Deck. Não há arquivo OpenSLO dedicado. |
| Runbooks | Há seções de runbook nos decks e no premortem, mas ainda não há runbooks operacionais dedicados em arquivos separados. |
| Postmortem / Premortem | Existe um premortem em [prodops/assessment/premortem.md](prodops/assessment/premortem.md). Não há postmortems versionados no momento. |
| Decision Trail / Release Trail | O Release Trail está em [prodops/downstream/release-trail.md](prodops/downstream/release-trail.md). Não há Decision Trail separado. |
| GitOps / CI/CD / Delivery Flow | O workflow de release está em [.github/workflows/release.yml](.github/workflows/release.yml). Ele instala dependências, faz build, executa testes de aceitação e publica artefatos de release. |
| Local testing | O sandbox local está documentado pelos scripts em [api/scripts](api/scripts), pela skill local em [.codex/skills/payments-api-local-testing](.codex/skills/payments-api-local-testing) e pelo frontend em [test](test). Algumas referências locais ainda citam o endpoint legado `/payments`; o fluxo atual do código fonte está concentrado em invoices. |
| Testes automatizados | A suíte de aceitação principal está em [api/test/create-invoice.acceptance.e2e-spec.ts](api/test/create-invoice.acceptance.e2e-spec.ts). |
| Telemetria, logs, métricas e traces | O backend usa logs estruturados com `nestjs-pino` e eventos observáveis via `payments.observability`. Métricas, traces e dashboards completos são parte do roadmap educacional. |

## Artefatos ProdOps no Projeto

| Artefato | Caminho | Papel no estudo |
| --- | --- | --- |
| Product Deck | [prodops/current-state/product-deck.md](prodops/current-state/product-deck.md) | Define visão, stakeholders, arquitetura do produto, eventos, OBCs e SLOs iniciais. |
| Service Deck Compra com Pix | [prodops/current-state/service-decks/compra-com-pix.md](prodops/current-state/service-decks/compra-com-pix.md) | Detalha a jornada Pix, blueprint, eventos, riscos, indicadores e runbooks esperados. |
| Tracking List atual | [prodops/current-state/tracking-list.md](prodops/current-state/tracking-list.md) | Lista demandas e próximas ações do produto. |
| Icebox Backlog | [prodops/current-state/icebox-backlog.md](prodops/current-state/icebox-backlog.md) | Guarda oportunidades e itens ainda fora do fluxo priorizado. |
| Features BDD | [prodops/current-state/features](prodops/current-state/features) | Especifica comportamentos esperados para invoice, confirmação e cancelamento. |
| Event Storming | [prodops/assessment/event-storming/plan.json](prodops/assessment/event-storming/plan.json) | Estrutura eventos, fluxos e sugestões de confiabilidade para análise. |
| Premortem | [prodops/assessment/premortem.md](prodops/assessment/premortem.md) | Antecipação de falhas prováveis na release entre Checkout, Payments e Notification. |
| Reliability Plan | [prodops/assessment/reliability-plan/README.md](prodops/assessment/reliability-plan/README.md) | Priorização de riscos e iniciativas de confiabilidade para a release. |
| Iteration Plan | [prodops/assessment/iteration-plan.md](prodops/assessment/iteration-plan.md) | Define o recorte funcional recomendado para a iteração. |
| Riscos do Premortem | [prodops/assessment/reliability-plan/risks.md](prodops/assessment/reliability-plan/risks.md) | Consolida riscos identificados no premortem. |
| Oportunidades do Premortem | [prodops/assessment/reliability-plan/opportunities.md](prodops/assessment/reliability-plan/opportunities.md) | Consolida oportunidades de melhoria e evolução. |
| Tracking List da release | [prodops/assessment/reliability-plan/iteration-backlog.md](prodops/assessment/reliability-plan/iteration-backlog.md) | Registra demandas associadas a observabilidade, negócio, operação e confiabilidade. |
| Release Trail | [prodops/downstream/release-trail.md](prodops/downstream/release-trail.md) | Registra entregas e evidências de execução. |

## Mapa do Repositório

| Caminho | Descrição |
| --- | --- |
| [api](api) | Backend NestJS da Payments API. Inclui controllers, services, DTOs, integração Asaas, repositório em memória/Dynamo, testes e scripts. |
| [api/src/main.ts](api/src/main.ts) | Entrada HTTP local do backend. |
| [api/src/lambda.ts](api/src/lambda.ts) | Entrada Lambda/serverless. |
| [api/src/modules/invoices](api/src/modules/invoices) | Módulo principal de invoices: criação, cancelamento, confirmação por webhook, roteamento de provider e persistência. |
| [api/src/infra/asaas.service.ts](api/src/infra/asaas.service.ts) | Integração com Asaas e suporte a mock local via variáveis de ambiente. |
| [api/src/infra/dynamo.service.ts](api/src/infra/dynamo.service.ts) | Acesso DynamoDB e mock em memória para cenários locais. |
| [api/test](api/test) | Testes de aceitação com Jest e Supertest. |
| [api/scripts](api/scripts) | Scripts de build, deploy local, DynamoDB local, sandbox e simulação de webhook. |
| [api/infra](api/infra) | Templates AWS SAM para Lambda e DynamoDB. |
| [api/infra/iac](api/infra/iac) | Infraestrutura local com Docker Compose, Kong, Keycloak e Terraform. |
| [api/odd/create_invoice.yaml](api/odd/create_invoice.yaml) | Artefato de Observability Driven Design para criação de invoice. |
| [test](test) | Frontend Vite/React para montar carrinho, gerar payloads, criar/cancelar invoice e simular webhooks. |
| [docs](docs) | Documentação complementar, features e materiais ProdOps anteriores. |
| [prodops](prodops) | Camada principal de contexto ProdOps: estado atual, assessment, reliability plan e diligence. |
| [.github/workflows/release.yml](.github/workflows/release.yml) | Pipeline de release no GitHub Actions. |
| [.codex](.codex) | Instruções, skills e referências usadas para operar e evoluir este laboratório com agentes. |

## Como Executar Localmente

### Pré-requisitos

- Node.js compatível com o projeto. O CI usa Node.js 22.
- npm.
- Para o ambiente serverless local: Docker ou runtime de containers, AWS CLI, AWS SAM CLI e Localstack.

### Backend em modo sandbox

O modo mais simples para estudo local usa armazenamento em memória, mock do Asaas e porta `3011`.

```sh
cd api
npm ci
./scripts/start-sandbox-api.sh
```

Padrões do sandbox:

- Backend: `http://localhost:3011`
- `INVOICE_REPOSITORY=memory`
- `DYNAMO_MOCK=true`
- `ASAAS_MOCK=true`
- `ENABLED_PAYMENT_PROVIDERS=ASAAS`
- `DEFAULT_PAYMENT_PROVIDER=ASAAS`

### Frontend de teste

Em outro terminal:

```sh
cd test
npm ci
npm run dev
```

O frontend fica em `http://localhost:5173/` e envia requisições para o backend local em `http://localhost:3011`.

### Builds

```sh
cd api
npm run build
```

```sh
cd test
npm run build
```

### Testes automatizados

```sh
cd api
npm run test
```

```sh
cd api
npm run test:acceptance
```

### Validação local de payloads

Com o backend sandbox em execução:

```sh
.codex/skills/payments-api-local-testing/scripts/validate-local-payloads.sh
```

Para informar uma URL diferente:

```sh
API_URL=http://localhost:3011 .codex/skills/payments-api-local-testing/scripts/validate-local-payloads.sh
```

Observação: esse script existe no repositório e também cobre o endpoint legado `/payments`. Na versão atual do código fonte, os controllers ativos estão concentrados em `/invoices`, `/invoices/:invoiceId` e `/webhook/payments`; se a branch não expuser `/payments`, use o script como referência de payloads ou ajuste o smoke test antes de usá-lo como critério de aceite.

### Contratos HTTP principais

| Fluxo | Endpoint | Referência |
| --- | --- | --- |
| Criar invoice | `POST /invoices` | [api/src/modules/invoices/controllers/invoice.controller.ts](api/src/modules/invoices/controllers/invoice.controller.ts) |
| Cancelar invoice | `DELETE /invoices/:invoiceId` | [api/src/modules/invoices/controllers/invoice.controller.ts](api/src/modules/invoices/controllers/invoice.controller.ts) |
| Webhook Asaas | `POST /webhook/payments` | [api/src/modules/invoices/controllers/asaas-webhook.controller.ts](api/src/modules/invoices/controllers/asaas-webhook.controller.ts) |

O contrato local dos payloads de apoio está descrito em [.codex/skills/payments-api-local-testing/references/payment-contracts.md](.codex/skills/payments-api-local-testing/references/payment-contracts.md), incluindo referências históricas do sandbox.

## Ambiente Serverless Local

Esta seção preserva o guia técnico original do repositório para rodar a stack serverless com Localstack. O material foi testado em macOS; adapte comandos conforme seu sistema operacional.

### Ferramentas esperadas

```sh
sam --version
aws --version
docker ps | grep localstack
```

Exemplo de configuração local da AWS CLI:

```sh
aws configure
# AWS Access Key ID: test
# AWS Secret Access Key: test
# Default region name: us-east-1
# Default output format: json
```

### Subir Localstack

```sh
docker run -d \
  --name localstack \
  --rm -it \
  -p 127.0.0.1:4566:4566 \
  -p 127.0.0.1:4510-4559:4510-4559 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  localstack/localstack
```

### Criar bucket local para deploy

```sh
aws s3 mb s3://payments-gateway-prod --endpoint-url=http://localhost.localstack.cloud:4566
```

Listar o bucket:

```sh
aws s3 ls --endpoint-url=http://localhost.localstack.cloud:4566
```

### Criar DynamoDB local

```sh
cd api
chmod +x ./scripts/deploy-dynamodb-local.sh
./scripts/deploy-dynamodb-local.sh
```

### Build e deploy local da Lambda

```sh
cd api
chmod +x ./scripts/build.sh
./scripts/build.sh
```

```sh
cd api
chmod +x ./scripts/deploy.sh
./scripts/deploy.sh
```

Como o Localstack pode exigir licença para API Gateway v2, o guia usa Function URL para expor a Lambda localmente:

```sh
aws --endpoint-url=http://localhost.localstack.cloud:4566 \
  lambda list-functions
```

```sh
aws --endpoint-url=http://localhost.localstack.cloud:4566 \
  lambda create-function-url-config \
  --function-name payments-api \
  --auth-type NONE
```

Para recuperar a URL novamente:

```sh
aws --endpoint-url=http://localhost.localstack.cloud:4566 \
  lambda get-function-url-config \
  --function-name payments-api
```

### Validar ciclo SQS, DynamoDB e Lambda

```sh
cd api
chmod +x ./scripts/simulate-asaas-webhook.sh
./scripts/simulate-asaas-webhook.sh
```

### Apagar a stack local

Listar stacks:

```sh
aws --endpoint-url=http://localhost.localstack.cloud:4566 cloudformation list-stacks
```

Apagar stack:

```sh
aws --endpoint-url=http://localhost.localstack.cloud:4566 \
  cloudformation delete-stack \
  --stack-name payments-gateway
```

Apagar log group:

```sh
aws logs delete-log-group \
  --log-group-name /aws/lambda/payments-api \
  --endpoint-url http://localhost.localstack.cloud:4566
```

## Como Estudar Este Projeto

Uma trilha recomendada para alunos:

1. Entenda o contexto do produto em [prodops/current-state/product-deck.md](prodops/current-state/product-deck.md).
2. Leia a jornada Compra com Pix em [prodops/current-state/service-decks/compra-com-pix.md](prodops/current-state/service-decks/compra-com-pix.md).
3. Explore os cenários BDD em [prodops/current-state/features](prodops/current-state/features).
4. Compare os cenários com o código em [api/src/modules/invoices](api/src/modules/invoices).
5. Rode o backend sandbox e o frontend de teste.
6. Execute `npm run test:acceptance` em [api](api) para observar a cobertura comportamental.
7. Leia o ODD em [api/odd/create_invoice.yaml](api/odd/create_invoice.yaml) e procure os eventos observáveis no código.
8. Avalie riscos e confiabilidade no [premortem](prodops/assessment/premortem.md) e no [Reliability Plan](prodops/assessment/reliability-plan/README.md).
9. Consulte o [Release Trail](prodops/downstream/release-trail.md) para entender como mudanças ficam registradas.
10. Proponha evoluções usando os métodos ProdOps: novo OBC, OpenAPI, OpenSLO, runbook, dashboard, teste de contrato ou melhoria de confiabilidade.

## Status do Projeto

Este repositório é funcional, mas conceitual.

Ele serve como material de estudo e referência para a formação da [ProdOps University](https://prodops.university/). Pode ser executado localmente, testado e usado para explorar fluxos reais de produto, mas ainda possui lacunas esperadas para um laboratório educacional, como dashboards produtivos, runbooks dedicados, OpenAPI completo, OpenSLO versionado e instrumentação completa de métricas/traces.

O projeto pode evoluir conforme novos cursos, métodos e artefatos forem adicionados à [ProdOps University](https://prodops.university/).

## Próximos Artefatos Sugeridos

Artefatos úteis para evoluir o laboratório:

- OpenAPI completo para os endpoints atuais.
- Arquivos OpenSLO para os SLOs definidos nos decks.
- Runbooks dedicados para falhas de invoice, webhook não correlacionado, Pix pago sem confirmação e rollback da Feature Flag.
- Decision Trail separado do Release Trail.
- Postmortems de incidentes simulados.
- Dashboards ou queries de referência para os eventos `payments.observability`.
- Contratos de eventos para `payment.confirmed` e demais eventos de domínio.
- Guia de Feature Flag e rollback para a integração Checkout -> Payments.

## Licença e Uso

Este projeto possui [LICENSE](LICENSE) com Apache License 2.0.

O uso principal deste repositório é educacional: ele é o projeto de referência da [ProdOps University](https://prodops.university/) para demonstrar a integração dos métodos do Framework ProdOps em um produto digital funcional, observável, especificável, confiável e operável.
