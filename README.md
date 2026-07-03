# Payments API — ProdOps University Reference Project

Payments API é um projeto de referência da [ProdOps University](https://prodops.university/). Ele demonstra, em um único repositório, como código, contratos, especificações, observabilidade, confiabilidade, operação e artefatos de produto podem se conectar na evolução de um produto digital.

Este repositório não deve ser lido apenas como uma API de pagamentos. Ele é um laboratório educacional funcional: a aplicação pode ser executada localmente, possui backend, Validation Workbench, contratos, cenários BDD, infraestrutura local e artefatos ProdOps, mas seu objetivo principal é demonstrar a aplicação prática do Framework ProdOps ao longo da jornada de produto.

O projeto é conceitual e educacional. Ele não representa, por si só, uma solução pronta para produção; representa um ambiente de estudo para alunos entenderem como decisões de produto, confiabilidade, especificação e operação aparecem em um produto real.

## Sumário

- [Resumo Executivo](#resumo-executivo)
- [Propósito Educacional](#propósito-educacional)
- [Relação com o Framework ProdOps](#relação-com-o-framework-prodops)
- [Artefatos ProdOps no Projeto](#artefatos-prodops-no-projeto)
- [Mapa do Repositório](#mapa-do-repositório)
- [Como Executar Localmente](#como-executar-localmente)
- [Ambiente AWS Local](#ambiente-aws-local)
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
| BDD / cenários de comportamento | Features comprometidas estão em [prodops/current-state/features](prodops/current-state/features); features exploratórias estão em [prodops/upstream/features](prodops/upstream/features). |
| Observability Driven Design | Existe um artefato ODD para criação de invoice em [api/odd/create_invoice.yaml](api/odd/create_invoice.yaml), além de eventos observáveis no código. |
| Product Reliability Engineering / PRE | O repositório inclui premortem, riscos, oportunidades, tracking list e reliability plan em [prodops/assessment](prodops/assessment). |
| Reliability Plan | O plano de confiabilidade da release está em [prodops/assessment/reliability-plan/README.md](prodops/assessment/reliability-plan/README.md). |
| SLOs / OpenSLO | SLOs iniciais existem em formato documental no Product Deck e Service Deck. Não há arquivo OpenSLO dedicado. |
| Runbooks | Há seções de runbook nos decks e no premortem, mas ainda não há runbooks operacionais dedicados em arquivos separados. |
| Postmortem / Premortem | Existe um premortem em [prodops/assessment/premortem.md](prodops/assessment/premortem.md). Não há postmortems versionados no momento. |
| Decision Trail / Release Trail | O Release Trail está em [prodops/downstream/release-trail.md](prodops/downstream/release-trail.md). Não há Decision Trail separado. |
| GitOps / CI/CD / Delivery Flow | O workflow de release está em [.github/workflows/release.yml](.github/workflows/release.yml). Ele instala dependências, faz build, executa testes de aceitação e publica artefatos de release. |
| Validation Workbench | O sandbox local está documentado pelos scripts em [api/scripts](api/scripts), pela skill local em [skills/payments-api-local-testing](skills/payments-api-local-testing) e pelo [validation-workbench](validation-workbench), que pertence à via Upstream. Algumas referências locais ainda citam o endpoint legado `/payments`; o fluxo atual do código fonte está concentrado em invoices. |
| Testes automatizados | A suíte de aceitação principal está em [api/test/create-invoice.acceptance.e2e-spec.ts](api/test/create-invoice.acceptance.e2e-spec.ts). |
| Telemetria, logs, métricas e traces | O backend usa logs estruturados com `nestjs-pino`, instrumentação Datadog APM via `dd-trace` e métricas ProdOps/PRE emitidas a partir do event bus `payments.observability`. Ver [Instrumentação Datadog](#instrumentação-datadog). |

## Artefatos ProdOps no Projeto

| Artefato | Caminho | Papel no estudo |
| --- | --- | --- |
| Product Deck | [prodops/current-state/product-deck.md](prodops/current-state/product-deck.md) | Define visão, stakeholders, arquitetura do produto, eventos, OBCs e SLOs iniciais. |
| Service Deck Compra com Pix | [prodops/current-state/service-decks/compra-com-pix.md](prodops/current-state/service-decks/compra-com-pix.md) | Detalha a jornada Pix, blueprint, eventos, riscos, indicadores e runbooks esperados. |
| Tracking List atual | [prodops/current-state/tracking-list.md](prodops/current-state/tracking-list.md) | Lista demandas e próximas ações do produto. |
| Icebox Backlog | [prodops/current-state/icebox-backlog.md](prodops/current-state/icebox-backlog.md) | Guarda oportunidades e itens ainda fora do fluxo priorizado. |
| Features BDD (comprometidas) | [prodops/current-state/features](prodops/current-state/features) | Especifica comportamentos comprometidos para invoice, confirmação e cancelamento. |
| Features BDD (exploratórias) | [prodops/upstream/features](prodops/upstream/features) | Features para capabilities ainda em exploração, como pagamento com cartão de crédito. |
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
| [api/src/lambda.ts](api/src/lambda.ts) | Entrada AWS Lambda usada pelo template SAM. |
| [api/src/modules/invoices](api/src/modules/invoices) | Módulo principal de invoices: criação, cancelamento, confirmação por webhook, roteamento de provider e persistência. |
| [api/src/infra/asaas.service.ts](api/src/infra/asaas.service.ts) | Integração com Asaas e suporte a mock local via variáveis de ambiente. |
| [api/src/infra/dynamo.service.ts](api/src/infra/dynamo.service.ts) | Acesso DynamoDB e mock em memória para cenários locais. |
| [api/test](api/test) | Testes de aceitação com Jest e Supertest. |
| [api/scripts](api/scripts) | Scripts de build, deploy local, DynamoDB local, sandbox e simulação de webhook. |
| [api/infra](api/infra) | Templates AWS SAM para Lambda e DynamoDB. |
| [api/infra/iac](api/infra/iac) | Infraestrutura local com Docker Compose, Kong, Keycloak e Terraform. |
| [api/odd/create_invoice.yaml](api/odd/create_invoice.yaml) | Artefato de Observability Driven Design para criação de invoice. |
| [validation-workbench](validation-workbench) | Bancada funcional Upstream em Vite/React para montar carrinho, gerar payloads, criar/cancelar invoice, simular webhooks e validar fluxos antes de promoção para Downstream. |
| [docs](docs) | Documentação complementar, features e materiais ProdOps anteriores. |
| [prodops](prodops) | Camada principal de contexto ProdOps: estado atual, assessment, reliability plan e diligence. |
| [.github/workflows/release.yml](.github/workflows/release.yml) | Pipeline de release no GitHub Actions. |
| [.codex](.codex) | Instruções, skills e referências usadas para operar e evoluir este laboratório com agentes. |

## Como Executar Localmente

### Pré-requisitos

- Node.js compatível com o projeto. O CI usa Node.js 22.
- npm.
- Para o ambiente AWS local integrado: Docker ou runtime de containers, AWS CLI, AWS SAM CLI e Localstack.

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

### Validation Workbench

Em outro terminal:

```sh
cd validation-workbench
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
cd validation-workbench
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
skills/payments-api-local-testing/scripts/validate-local-payloads.sh
```

Para informar uma URL diferente:

```sh
API_URL=http://localhost:3011 skills/payments-api-local-testing/scripts/validate-local-payloads.sh
```

Observação: esse script existe no repositório e também cobre o endpoint legado `/payments`. Na versão atual do código fonte, os controllers ativos estão concentrados em `/invoices`, `/invoices/:invoiceId` e `/webhook/payments`; se a branch não expuser `/payments`, use o script como referência de payloads ou ajuste o smoke test antes de usá-lo como critério de aceite.

### Contratos HTTP principais

| Fluxo | Endpoint | Referência |
| --- | --- | --- |
| Criar invoice | `POST /invoices` | [api/src/modules/invoices/controllers/invoice.controller.ts](api/src/modules/invoices/controllers/invoice.controller.ts) |
| Cancelar invoice | `DELETE /invoices/:invoiceId` | [api/src/modules/invoices/controllers/invoice.controller.ts](api/src/modules/invoices/controllers/invoice.controller.ts) |
| Webhook Asaas | `POST /webhook/payments` | [api/src/modules/invoices/controllers/asaas-webhook.controller.ts](api/src/modules/invoices/controllers/asaas-webhook.controller.ts) |

O contrato local dos payloads de apoio está descrito em [skills/payments-api-local-testing/references/payment-contracts.md](skills/payments-api-local-testing/references/payment-contracts.md), incluindo referências históricas do sandbox.

## Ambiente AWS Local

Esta seção preserva o guia técnico para rodar recursos AWS com SAM, CloudFormation e Localstack. O repositório não depende do Serverless Framework nem de `serverless-offline`; para desenvolvimento HTTP local, use o sandbox NestJS em `./scripts/start-sandbox-api.sh`.

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

### Rodar API local usando DynamoDB no LocalStack

Use este modo quando quiser validar persistência e webhook sem cair no
repositório em memória, mas sem emular Lambda/SQS:

```sh
cd api
./scripts/start-localstack-api.sh
```

Esse script sobe o NestJS em `http://localhost:3011` com:

- `INVOICE_REPOSITORY=dynamo`
- `DYNAMO_MOCK=false`
- `AWS_DYNAMODB_ENDPOINT=http://localhost.localstack.cloud:4566`
- `ASAAS_MOCK=true`
- `ASAAS_WEBHOOK_TOKEN=local-webhook-token`
- `WEBHOOK_PROCESSING_MODE=sync`

Para validar a arquitetura serverless completa com fila, use o deploy SAM local
descrito abaixo.

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

### Validar ciclo Function URL, SQS, worker, DynamoDB e webhook Asaas

O fluxo serverless local provisiona a Lambda HTTP, a fila SQS de webhooks, a
DLQ, o worker Lambda e as tabelas DynamoDB no LocalStack. A simulacao abaixo
cria uma invoice real, envia `PAYMENT_CONFIRMED` para o receiver HTTP, espera o
worker consumir a SQS e verifica a invoice confirmada no DynamoDB.

```sh
cd api
chmod +x ./scripts/simulate-asaas-webhook.sh
./scripts/simulate-asaas-webhook.sh
```

Por padrao, o script tenta descobrir a Function URL do stack LocalStack
`payments-gateway`. Se a Lambda local nao estiver implantada, ele usa
`http://localhost:3011`, que e o endpoint do `start-localstack-api.sh`.

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
5. Rode o backend sandbox e o Validation Workbench.
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

## Instrumentação Datadog

A instrumentação segue as boas práticas do Product Reliability Engineering (PRE): cada métrica é ancorada a um OBC ou cenário de confiabilidade do Reliability Plan.

### Arquitetura da instrumentação

```
main.ts / lambda.ts
  └── import './observability/datadog.tracer'  ← primeiro import, antes do NestJS
        ↓ dd-trace.init()

AppModule
  └── ObservabilityModule
        ├── CorrelationMiddleware   → gera/propaga x-correlation-id em todas as requests
        ├── HealthController        → GET /health
        └── ObservabilityListener  → ouve payments.observability → emite métricas DD
```

Arquivos em [api/src/observability/](api/src/observability/):

| Arquivo | Responsabilidade |
| --- | --- |
| `datadog.tracer.ts` | Bootstrap do `dd-trace` — deve ser o primeiro import |
| `correlation.middleware.ts` | Gera/propaga `x-correlation-id` e associa ao span ativo |
| `metrics.ts` | API de métricas ProdOps/PRE: `PaymentMetrics`, `WebhookMetrics`, `CardMetrics` |
| `business-spans.ts` | `withBusinessSpan()` — wrapper para spans de negócio sem dados sensíveis |
| `observability.listener.ts` | Ponte `payments.observability` → Datadog metrics (sem alterar `InvoiceService`) |
| `observability.module.ts` | NestJS module que registra tudo acima |
| `health.controller.ts` | `GET /health` — status, versão, env, observabilidade |

### Configurar localmente

```sh
cp api/.env.example api/.env
# Edite api/.env — nunca commite este arquivo
```

Para rodar **sem Datadog** (padrão local):

```sh
# api/.env
DD_TRACE_ENABLED=false
```

Para rodar **com Datadog** (requer DD Agent local ou Datadog Extension):

```sh
# api/.env
DD_TRACE_ENABLED=true
DD_API_KEY=sua_chave_aqui   # nunca commite
DD_AGENT_HOST=localhost
DD_TRACE_AGENT_PORT=8126
```

```sh
cd api && npm run start           # NestJS local (porta 3011)
```

### Variáveis de ambiente Datadog

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `DD_TRACE_ENABLED` | `true` | `false` desativa tracing e métricas localmente |
| `DD_SERVICE` | `payments-api` | Service name no Datadog APM |
| `DD_ENV` | `local` | Ambiente (`local`, `dev`, `prod`) |
| `DD_VERSION` | `0.0.1` | Versão do serviço |
| `DD_AGENT_HOST` | `localhost` | Host do DD Agent |
| `DD_TRACE_AGENT_PORT` | `8126` | Porta do DD Agent |
| `DD_RUNTIME_METRICS_ENABLED` | `false` (local) | Métricas de runtime Node.js |
| `DD_LOGS_INJECTION` | `false` (local) | Injeta `dd.trace_id` nos logs pino |
| `DD_API_KEY` | — | Chave da API Datadog (nunca commitar) |

### Métricas ProdOps/PRE emitidas

Cada métrica carrega as tags `service:payments-api`, `env`, `capability:payments`, `method:prodops`.

| Métrica | Tags adicionais | Origem no domínio |
| --- | --- | --- |
| `payment.created` | `payment_provider`, `journey:delivery`, `obc` | Invoice salva localmente (step 1) |
| `payment.authorized` | `payment_provider`, `journey:operation`, `obc` | Webhook `PAYMENT_CONFIRMED` |
| `payment.failed` | `payment_provider`, `failure_type`, `obc` | Exceção no provider |
| `payment.rejected` | `payment_provider`, `failure_type`, `reliability_scenario` | Análise de risco reprovada / captura recusada |
| `payment.timeout` | `payment_provider`, `failure_type:timeout` | Timeout no provider |
| `card.tokenized` | `payment_provider`, `journey:delivery` | Tokenização concluída |
| `webhook.received` | `payment_provider`, `event_type`, `journey:operation` | Qualquer webhook recebido |
| `webhook.failed` | `payment_provider`, `failure_type:uncorrelated`, `reliability_scenario:webhook_sem_correlacao` | Webhook sem invoice correlacionada (P0 do Reliability Plan) |

### Spans de negócio disponíveis

`withBusinessSpan()` em [api/src/observability/business-spans.ts](api/src/observability/business-spans.ts) cria spans customizados para operações críticas. Tags: `payment.id`, `provider`, `operation`, `obc.name`, `reliability.scenario`. Nenhum dado sensível é incluído (sem card data, token, CVV, authorization header).

```typescript
import { withBusinessSpan } from '../observability/business-spans';

await withBusinessSpan('create_payment', {
  operation: 'create_payment',
  provider: 'ASAAS',
  obcName: 'intencao_de_pagamento_salva',
  reliabilityScenario: 'caminho-feliz',
}, async () => {
  // operação crítica
});
```

### Deploy AWS com SAM, Function URL e Datadog Lambda Extension

O arquivo [api/infra/lambda.yaml](api/infra/lambda.yaml) configura a Lambda via AWS SAM/CloudFormation e expõe HTTP por **Lambda Function URL**, evitando custo de API Gateway. A instrumentação Datadog em AWS usa variáveis `DD_*`, `dd-trace` no código e, quando habilitada, a Datadog Lambda Extension informada por parâmetro.

Para evitar cobrança de CloudWatch Logs, o template usa uma role Lambda sem permissões `logs:*`. Isso impede ingestão/armazenamento de logs da aplicação no CloudWatch. Métricas básicas gerenciadas pela AWS podem continuar visíveis, mas sem ingestão de logs.

```sh
# Build da aplicação antes do empacotamento SAM
cd api
npm run build
```

```sh
# Exemplo: deploy com Datadog habilitado e API key injetada por parâmetro NoEcho.
sam deploy \
  --template-file infra/lambda.yaml \
  --stack-name payments-api-dev \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    EnvironmentName=dev \
    DatadogEnabled=true \
    DatadogApiKey="$DD_API_KEY" \
    DatadogExtensionLayerArn=arn:aws:lambda:us-east-1:464622532012:layer:Datadog-Extension:VERSION_NUMERICA \
    DatadogVersion=0.0.1
```

Para ambientes sem Datadog, mantenha `DatadogEnabled=false` e omita `DatadogApiKey` e `DatadogExtensionLayerArn`. O template não usa Secrets Manager; a chave deve ser injetada pelo pipeline durante o deploy.

### Dashboards sugeridos

| Dashboard | Métricas principais |
| --- | --- |
| Payment Lifecycle | `payment.created`, `payment.authorized`, `payment.failed` — funil de conversão |
| Webhook Reliability | `webhook.received`, `webhook.failed{failure_type:uncorrelated}` — taxa de correlação |
| Provider Health | `payment.timeout`, `payment.failed{failure_type:provider_error}` — SLO do provider |
| PRE Scorecard | Todas as métricas agrupadas por `reliability_scenario` — visão do Reliability Plan |

### Conexão com Product Reliability Engineering

A instrumentação é projetada para ser rastreável ao Reliability Plan:

- Cada tag `obc` mapeia para um Observable Business Contract em [prodops/assessment/reliability-plan/obcs/](prodops/assessment/reliability-plan/obcs/)
- Cada tag `reliability_scenario` mapeia para um risco em [prodops/assessment/reliability-plan/risks.md](prodops/assessment/reliability-plan/risks.md)
- A métrica `webhook.failed{failure_type:uncorrelated}` é o sinal de alerta para o cenário P0 "webhook não correlacionado" do Reliability Plan
- Os logs com `dd.trace_id` injetado permitem navegar de uma métrica até o trace exato da transação que falhou

## Licença e Uso

Este projeto possui [LICENSE](LICENSE) com Apache License 2.0.

O uso principal deste repositório é educacional: ele é o projeto de referência da [ProdOps University](https://prodops.university/) para demonstrar a integração dos métodos do Framework ProdOps em um produto digital funcional, observável, especificável, confiável e operável.
