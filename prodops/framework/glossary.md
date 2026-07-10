# ProdOps Glossary

Termos canônicos do Framework ProdOps. Um conceito = um nome. Um nome = um conceito.

Para o fluxo completo do Framework, ver [`flow.md`](flow.md).
Para os quatro Origin Streams, ver [`origin-streams.md`](origin-streams.md).

---

## Origin Stream

**Definição:** Classificação da origem de uma Intent. Identifica de onde a necessidade nasceu e quem a detém.

**Propósito:** Garantir que toda mudança tenha origem rastreável e que o contexto, a linguagem e os critérios de sucesso sejam apropriados para o tipo de necessidade.

**Quando usar:** Ao registrar qualquer Intent. Toda Intent tem exatamente um Origin Stream.

**Quando não usar:** Origin Stream não determina o modo de execução nem a jornada — isso é função do Execution Mode e do Continuous Assessment.

**Os quatro Origin Streams:** Business | Enterprise | Team | Technology

**Relação com outros conceitos:** Um Origin Stream gera uma Intent. A Intent entra em Exploration. Ver [`origin-streams.md`](origin-streams.md).

---

## Intent

**Definição:** Uma intenção de gerar valor ainda não comprometida com implementação. É o ponto de entrada único do Framework ProdOps para qualquer mudança.

**Propósito:** Registrar formalmente uma necessidade antes de qualquer decisão de execução. A Intent captura o "porquê" sem prescrever o "como".

**Quando usar:** Sempre que uma nova necessidade surgir — independente de origem, tamanho ou urgência. Toda mudança começa com uma Intent.

**Quando não usar:** Intent não é backlog técnico, tarefa de sprint ou ticket de bug isolado. Essas são instâncias de execução derivadas de uma Intent, não Intents em si.

**Relação com outros conceitos:** A Intent tem um Origin Stream (Business | Enterprise | Team | Technology). A Intent é transformada em OBC pela Exploration. Ver [`flow.md`](flow.md) e [`origin-streams.md`](origin-streams.md).

**Anteriormente chamado de:** Business Intent. O nome foi simplificado para Intent para eliminar a ambiguidade de que apenas necessidades de "Business" são capturáveis. O diretório `prodops/business-intents/` é preservado por retrocompatibilidade.

---

## Business (Origin Stream)

**Definição:** Origin Stream que representa necessidades geradas pelo mercado, pelo cliente ou pelas oportunidades de crescimento do produto.

**Propósito:** Capturar Intents orientadas a resultado de mercado — receita, conversão, adoção, retenção, novos canais, novos produtos.

**Quando usar:** A necessidade tem relação direta com valor percebido pelo cliente ou pelo mercado.

**Quando não usar:** Se o benefício é interno à organização (Enterprise), ao processo do time (Team) ou à plataforma técnica (Technology).

**Exemplos:** Split Payment (Pix + Cartão), novo canal Boleto, suporte a recorrência de assinaturas.

**Relação com outros conceitos:** Um dos quatro Origin Streams. Ver [`origin-streams.md`](origin-streams.md).

---

## Enterprise (Origin Stream)

**Definição:** Origin Stream que representa necessidades internas da organização — compliance, legislação, auditoria, parceiros, ERP, financeiro, backoffice, governança, riscos corporativos.

**Propósito:** Capturar Intents obrigatórias por razões externas ao produto — leis, regulações, contratos, políticas corporativas.

**Quando usar:** A necessidade é imposta por fora do produto ou resolve um problema de escala operacional interna.

**Quando não usar:** Se o benefício é para o cliente (Business), para o processo do time (Team) ou para a plataforma (Technology).

**Exemplos:** Adequação à regulação do Banco Central, integração com ERP financeiro, política de retenção de dados LGPD.

**Relação com outros conceitos:** Um dos quatro Origin Streams. Ver [`origin-streams.md`](origin-streams.md).

---

## Team (Origin Stream)

**Definição:** Origin Stream que representa necessidades geradas pelo próprio time de produto e engenharia para evoluir a forma de trabalhar, os processos, as ferramentas e a qualidade operacional.

**Propósito:** Capturar Intents de melhoria interna do modelo operacional — produtividade, onboarding, fluxo de trabalho, automações.

**Quando usar:** A necessidade é sobre como o time trabalha, não o que o time entrega ao mercado.

**Quando não usar:** Se o benefício é para o cliente (Business), para a organização (Enterprise) ou para a plataforma técnica (Technology).

**Exemplos:** Adoção de Conventional Commits, criação de skill de Bootstrap, documentação do Commit Workflow.

**Relação com outros conceitos:** Um dos quatro Origin Streams. Ver [`origin-streams.md`](origin-streams.md).

---

## Technology (Origin Stream)

**Definição:** Origin Stream que representa necessidades geradas pela evolução das capacidades técnicas da plataforma, da segurança, da infraestrutura e da confiabilidade do sistema.

**Propósito:** Capturar Intents de evolução técnica — arquitetura, segurança, infraestrutura, observabilidade, confiabilidade, cloud, banco de dados, Kubernetes, serverless, IAM, criptografia.

**Quando usar:** A necessidade é técnica e o benefício primário é para o sistema — não diretamente para o cliente ou para a organização.

**Quando não usar:** Se a melhoria técnica é consequência de um requisito de produto (Business), corporativo (Enterprise) ou de processo (Team).

**Exemplos:** Migração para DynamoDB, rotação automática de credenciais, adoção de OpenTelemetry, criptografia em repouso.

**Relação com outros conceitos:** Um dos quatro Origin Streams. Ver [`origin-streams.md`](origin-streams.md).

---

## OBC (Observable Business Contract)

**Definição:** Contrato observável que define o comportamento esperado de uma Product Capability de forma verificável. É a transformação de uma Intent suficientemente compreendida em critérios mensuráveis de sucesso. Fica em `prodops/artifacts/obcs/`. Ancora cenários TDD a resultados de negócio.

**Propósito:** Ser a linguagem compartilhada entre produto, engenharia e operação. O OBC é o critério de aceite formal que toda entrega Downstream deve satisfazer.

**Quando usar:** Após a Exploration ter reduzido a incerteza suficientemente. O OBC committed em `prodops/artifacts/obcs/` é pré-condição obrigatória para iniciar o Downstream.

**Quando não usar:** O OBC **não** é a entrada do Framework. Não criar OBC sem Intent e Exploration precedentes. Não criar OBC prematuramente quando a incerteza ainda é alta.

**Relação com outros conceitos:** O OBC é produzido pela Exploration a partir de uma Intent. Âncora a BDD Feature, o Iteration Plan, o Reliability Plan e toda a Delivery. Ver [`flow.md`](flow.md).

**Anteriormente definido incorretamente como:** "Outcome-Based Criterion". A definição canônica é **Observable Business Contract**.

---

## Exploration

**Definição:** Etapa do fluxo do Framework entre Intent e OBC. Reduz incerteza transformando hipóteses em conhecimento validado.

**Propósito:** Garantir que o OBC seja construído sobre entendimento real, não sobre suposições. Sem Exploration suficiente, o OBC é frágil.

**Quando usar:** Sempre que a Intent tiver hipóteses não validadas, decisões de domínio em aberto ou incerteza técnica que justifique exploração antes do compromisso.

**Quando não usar:** Quando a Intent é trivial, o comportamento já é bem compreendido e o OBC pode ser escrito diretamente. Neste caso, a Exploration é curta ou inexistente.

**Relação com outros conceitos:** Exploration é implementada pela Jornada Discovery executada no modo Upstream. Os três termos descrevem aspectos diferentes da mesma fase:

| Termo | Nível | Significado |
|---|---|---|
| **Exploration** | Etapa do fluxo | O que acontece: redução de incerteza entre Intent e OBC |
| **Discovery** | Jornada | O nome da jornada do Framework que implementa Exploration |
| **Upstream** | Execution Mode | O modo de execução (baixo compromisso) usado durante Discovery |

Ver [`flow.md`](flow.md), [`../journeys/discovery/README.md`](../journeys/discovery/README.md) e [`../execution-model/upstream.md`](../execution-model/upstream.md).

---

## Discovery

**Definição:** Jornada do Framework ProdOps que implementa a etapa de Exploration. Fluxo de engenharia exploratória orientado a aprendizado.

**Propósito:** Transformar hipóteses em conhecimento validado por meio de experimentos, spikes e protótipos. Produzir o Decision Package que fundamenta o OBC.

**Quando usar:** Ao executar trabalho exploratório (modo Upstream) sobre uma Intent.

**Quando não usar:** Discovery não é sinônimo de Upstream (Upstream é o modo, Discovery é a jornada). Discovery não produz software de produção — produz conhecimento.

**Relação com outros conceitos:** Discovery é a jornada que implementa Exploration. Usa o modo Upstream. Ver [`../journeys/discovery/README.md`](../journeys/discovery/README.md).

---

## Delivery Capability

**Definição:** Competência técnica reutilizável consumida pelas fases da jornada Delivery. Exemplos: Commit Workflow, Contract Management, Evidence Management, Observability, Reliability.

**Propósito:** Encapsular práticas técnicas transversais que podem ser invocadas por múltiplas fases sem duplicação.

**Quando usar:** Ao referenciar a infraestrutura técnica do processo de entrega.

**Quando não usar:** Não confundir com "Product Capability". Uma Delivery Capability é um mecanismo do Framework, não uma funcionalidade do produto.

**Relação com outros conceitos:** Usada pelas Phases da jornada Delivery. Ver [`../journeys/delivery/capabilities/`](../journeys/delivery/capabilities/).

---

## Product Capability

**Definição:** Uma funcionalidade, comportamento ou característica do produto que está sendo explorada ou entregue. Exemplos: split payment, suporte a Pix, webhook de confirmação.

**Propósito:** Denominar o escopo de trabalho de produto que uma Intent origina e que um OBC descreve.

**Quando usar:** Ao referenciar o que está sendo construído — a funcionalidade, o comportamento, o valor de produto.

**Quando não usar:** Não confundir com "Delivery Capability". Uma Product Capability é o objeto do trabalho; uma Delivery Capability é um mecanismo do processo.

**Nota:** Em contextos onde a ambiguidade for possível, preferir o termo completo "Product Capability" ou "Delivery Capability" em vez de apenas "capability".

---

## BDD Feature

**Definição:** Especificação Gherkin que descreve o comportamento esperado de uma Product Capability. Fica em `prodops/artifacts/bdd/` (comprometida) ou `prodops/journeys/discovery/experiments/<NNN-slug>/features/` (exploratória — dentro do diretório do experimento). Usada como insumo de TDD no Downstream.

---

## Reliability Plan

**Definição:** O contrato de execução de um item Downstream. Define riscos, OBCs, SLOs e ações de mitigação. Fica em `prodops/journeys/assessment/reliability-plans/`.

---

## CI Sync

**Definição:** O agrupamento síncrono do ProdOps Delivery. Representa o trabalho local, colaborativo e conduzido pelo engenheiro. Inclui Bootstrap, Hack, Sync e Finish. Produz: task fechada, PR com narrativa, evidências, commits organizados, validações locais executadas. Ver [`journeys/delivery/README.md`](../journeys/delivery/README.md).

---

## CI Async

**Definição:** O agrupamento assíncrono do ProdOps Delivery. Representa o trabalho conduzido pela plataforma, pipelines e ambientes. Inclui Ship, Validate e Promote. Produz: artefato publicado, deploy realizado, validação em runtime, promoção controlada. Ver [`journeys/delivery/README.md`](../journeys/delivery/README.md).

---

## Bootstrap

**Definição:** O primeiro estágio do CI Sync. Prepara o ambiente, cria a branch e estabelece o contexto de produto (OBC, BDD Feature, testes existentes) antes de iniciar a implementação. Não produz código — produz contexto. Ver [`journeys/delivery/phases/bootstrap/README.md`](../journeys/delivery/phases/bootstrap/README.md).

---

## Upstream

**Definição:** O modo de execução exploratório. Objetivo: transformar hipóteses em conhecimento validado. Código é descartável até ser promovido para Downstream. O Upstream seleciona etapas do fluxo conforme a necessidade — não há sequência obrigatória. Um ciclo Upstream típico usa Bootstrap + Hack + Sync; Ship, Validate e Promote são usados apenas quando o experimento precisa de validação em staging ou de uma decisão de promoção. Ver [`prodops/journeys/discovery/README.md`](../journeys/discovery/README.md).

---

## Downstream

**Definição:** O modo de entrega governado. Objetivo: entregar com confiança usando conhecimento validado. Todo item requer OBC + BDD Feature + entrada no Reliability Plan. O Downstream exige o fluxo completo: `Bootstrap → Hack → Sync → Finish → Ship → Validate → Promote`. Ver [`prodops/execution-model/downstream.md`](../execution-model/downstream.md).

---

## Hack Flow

**Definição:** A fase de codificação em Upstream e Downstream. Segundo estágio do CI Sync, sucede o Bootstrap. Definido em [`journeys/delivery/phases/hack/README.md`](../journeys/delivery/phases/hack/README.md). Mecânica de execução em [`skills/hack/`](../skills/hack/).

---

## Sync

**Definição:** O terceiro estágio do CI Sync. Tem dois steps independentes: `rebase` (sincroniza a feature branch com a base — fetch, integração, conflitos, validação) e `align` (alinha artefatos ProdOps com a implementação — BDD Features, Event Storming, arquitetura, Release Trail). Invocados via `/sync rebase` e `/sync align`. Ver [`journeys/delivery/phases/sync/README.md`](../journeys/delivery/phases/sync/README.md).

---

## Ship

**Definição:** O primeiro estágio do CI Async. Transforma a implementação finalizada em artefato executável e conduz o deploy. Organizado em duas famílias: Preparation (Build, Package, Version, Sign, SBOM, Publish Artifact) e Deployment (Deploy, Progressive Delivery, Feature Flags, Rollout, Rollback, Infrastructure Validation). Build, Package e Publish são capabilities internas do Ship — não são etapas independentes do fluxo principal. Ver fases: [Ship](../journeys/delivery/phases/ship/README.md), [Validate](../journeys/delivery/phases/validate/README.md), [Promote](../journeys/delivery/phases/promote/README.md).

---

## Validate

**Definição:** O segundo estágio do CI Async. Verifica a entrega em execução no ambiente alvo. Capabilities: Smoke Tests, Runtime Contract Validation, Synthetic Monitoring, Health Checks, Observability Validation, SLO Validation, Business Validation, Incident Signals. Ver fases: [Ship](../journeys/delivery/phases/ship/README.md), [Validate](../journeys/delivery/phases/validate/README.md), [Promote](../journeys/delivery/phases/promote/README.md).

---

## Promote

**Definição:** O terceiro estágio do CI Async. Oficializa a evolução da versão com aprovação formal e evidência registrada. Capabilities: Promotion Gates, Environment Promotion, Release Approval, Release Trail, Operational Evidence, Release Documentation, Rollback Readiness. Ver fases: [Ship](../journeys/delivery/phases/ship/README.md), [Validate](../journeys/delivery/phases/validate/README.md), [Promote](../journeys/delivery/phases/promote/README.md).

---

## ProdOps TDD

**Definição:** A prática utilizada dentro do Hack Flow para produzir código observável e confiável. Definida em [`journeys/delivery/practices/prodops-tdd.md`](../journeys/delivery/practices/prodops-tdd.md).

---

## Red Bar

**Definição:** Teste com falha que expressa corretamente o comportamento desejado. Confirma que o teste detecta a implementação ausente.

---

## Green Bar

**Definição:** Teste passando após a implementação mínima estar em vigor.

---

## Yellow Bar

**Definição:** Padrões usados para gerenciar cenários de teste difíceis: child tests, crash dummies, log strings. Não é uma licença para mockar lógica de negócio.

---

## Progressive Substitution

**Definição:** Estratégia de teste onde um Mock Server (baseado em contrato) é usado primeiro, depois substituído pela integração real sem reescrever os testes. Os testes verificam comportamento pela mesma superfície de contrato independentemente do que está por trás.

---

## Mock Server

**Definição:** Test double em nível de infraestrutura que simula uma dependência externa com base em um contrato (ex.: WireMock, Prism). Distinto do Mock Object, que substitui um serviço próprio.

---

## Mock Object

**Definição:** Test double para uma dependência técnica (logger, clock, gerador de UUID, adaptador de telemetria). Aceitável apenas quando não oculta comportamento de negócio.

---

## Decision Trail

**Definição:** Registro de uma decisão tomada sob incerteza, incluindo contexto, alternativas e impacto. Template: [`prodops/templates/assessment/decision-trail.md`](../templates/assessment/decision-trail.md).

---

## Release Trail

**Definição:** O log append-only de evidências do Downstream. Fica em [`artifacts/trails/release-trail.md`](../artifacts/trails/release-trail.md).
