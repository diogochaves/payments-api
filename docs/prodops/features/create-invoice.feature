# language: pt
@prodops @payments @sor @create-invoice
Funcionalidade: Criar Invoice observavel no Payments SOR
  Como produto Payments da Magazine Siara
  Quero criar uma invoice usando o Payments como System of Record
  Para emitir cobrancas em PSPs como Asaas sem perder rastreabilidade, idempotencia, estado canonico e observabilidade operacional

  Contexto:
    Dado que o Payments e o System of Record for Payments da Magazine Siara
    E que o Asaas e um PSP integrado ao Payments
    E que a funcionalidade segue a visao do produto em "docs/prodops/product-deck.md"
    E que a fronteira SOR/PSP esta definida em "docs/prodops/payments-sor-psp.md"
    E que a observabilidade requerida esta definida em "docs/prodops/event-storming/plan.json"
    E que o gateway possui os provedores "ITAU" e "ASAAS" cadastrados
    E que toda requisicao possui "correlationId", "tenantId", "orderId" e "Idempotency-Key"
    E que todo evento observavel deve conter "event_key", "env", "stage", "correlationId", "tenantId", "orderId", "provider" e "timestamp"

  Regra: Payments governa a verdade canonica da invoice
    O ecommerce solicita uma invoice ao Payments.
    Payments persiste a intencao, decide o provedor, chama o PSP, normaliza a resposta e registra o estado canonico.
    Asaas executa a cobranca como PSP, mas nao define a verdade operacional final da Magazine Siara.

  Regra: A invoice so e considerada entregue quando existir cobranca criada no Asaas
    Para o provedor ASAAS, sucesso funcional exige uma cobranca criada por "POST /v3/payments".
    A resposta deve conter um "providerPaymentId" do Asaas, uma URL de pagamento quando disponivel, "externalReference" igual ao pedido, valor, vencimento, meio de pagamento e status externo conciliavel.
    Payments deve traduzir o status externo do Asaas para um status canonico interno sem perder o payload necessario para auditoria e conciliacao.

  Cenário: Criar invoice no Asaas com cliente ja vinculado e observabilidade do caminho feliz
    Dado que existe um cliente Magazine Siara "customer-123" vinculado ao cliente Asaas "cus_asaas_123"
    E que o provedor "ASAAS" esta habilitado para o tenant "magazine-siara"
    Quando o ecommerce solicitar a criacao da invoice para o pedido "MS-100045" no valor de "159.90" BRL
    E informar o provedor "ASAAS"
    Então Payments deve registrar a invoice com status "CREATED"
    E deve chamar o PSP Asaas em "POST /v3/payments"
    E deve enviar "customer" com valor "cus_asaas_123"
    E deve enviar "customer", "billingType", "value", "dueDate", "description" e "externalReference"
    E o "externalReference" enviado ao Asaas deve ser igual a "MS-100045"
    E o "value" enviado ao Asaas deve ser igual a "159.90"
    E o "billingType" enviado ao Asaas deve refletir o meio de pagamento solicitado pelo ecommerce
    E deve atualizar a invoice para status canonico "OPEN"
    E deve retornar "invoiceId", "orderId", "provider", "providerPaymentId", "status", "amount", "currency", "paymentUrl" e "externalReference"
    E o "providerPaymentId" deve ser o identificador retornado pelo Asaas
    E o "paymentUrl" deve ser derivado de "invoiceUrl", "bankSlipUrl" ou "transactionReceiptUrl" retornado pelo Asaas
    E deve publicar evento observavel com "event_key" igual a "pagamento.cobranca.checkout.intencao.de.pagamento.salva"
    E deve publicar evento observavel com "event_key" igual a "pagamento.processamento.pagamentos.cliente.encontrado.view"
    E deve publicar evento observavel com "event_key" igual a "pagamento.processamento.pagamentos.pagamento.pendente"
    E deve publicar evento observavel com "event_key" igual a "pagamento.processamento.pagamentos.fatura.criada"
    E os eventos devem alimentar widgets "query_value" e "timeseries" do caminho feliz no plano de event storming

  Cenário: Criar cliente no Asaas antes da invoice e observar caminho alternativo
    Dado que nao existe vinculo entre o cliente Magazine Siara "customer-456" e um cliente Asaas
    E que o provedor "ASAAS" esta habilitado
    Quando o ecommerce solicitar a criacao da invoice para o pedido "MS-100046"
    Então Payments deve registrar a intencao de pagamento no SOR
    E deve publicar evento observavel com "event_key" igual a "pagamento.cobranca.checkout.intencao.de.pagamento.salva"
    E deve publicar evento observavel com "event_key" igual a "pagamento.cobranca.cadastrada.cliente.nao.encontrado.failure"
    E deve buscar se ja existe cliente Asaas reutilizavel por documento ou "externalReference"
    E deve criar ou vincular o cliente no PSP Asaas por "POST /v3/customers"
    E deve persistir o vinculo entre "customer-456" e o "providerCustomerId" retornado pelo Asaas
    E deve publicar evento observavel com "event_key" igual a "pagamento.cobranca.cadastrada.cliente.cadastrado"
    E deve criar a cobranca no Asaas por "POST /v3/payments"
    E deve publicar evento observavel com "event_key" igual a "pagamento.processamento.pagamentos.pagamento.pendente"
    E deve publicar evento observavel com "event_key" igual a "pagamento.processamento.pagamentos.fatura.criada"
    E os eventos devem alimentar widgets "query_value" e "timeseries" do caminho alternativo no plano de event storming

  Cenário: Evitar cobranca duplicada em retentativa idempotente
    Dado que uma invoice para o pedido "MS-100045" ja foi criada com a chave de idempotencia "MS-100045:create"
    Quando o ecommerce repetir a criacao com a mesma "Idempotency-Key"
    Então Payments deve retornar a mesma invoice ja registrada no SOR
    E nao deve chamar novamente "POST /v3/customers"
    E nao deve chamar novamente "POST /v3/payments"
    E deve retornar o mesmo "invoiceId", "providerPaymentId", "paymentUrl" e "externalReference" da primeira criacao
    E deve registrar observabilidade de retentativa idempotente com o mesmo "correlationId" ou com vinculo ao "originalCorrelationId"
    E nao deve incrementar eventos de sucesso de criacao como se fosse uma nova invoice

  Cenário: Rejeitar provedor nao habilitado sem chamar PSP
    Dado que o provedor "ASAAS" esta desabilitado para o tenant "magazine-siara"
    Quando o ecommerce solicitar criacao de invoice com provedor "ASAAS"
    Então Payments deve rejeitar a solicitacao com erro de negocio
    E nao deve chamar a API do Asaas
    E deve registrar auditoria da tentativa rejeitada
    E deve publicar evento observavel com "event_key" igual a "pagamento.cobranca.checkout.intencao.de.pagamento.salva_exception"
    E o evento deve conter "stage" igual a "pagamento_salva"
    E o evento deve conter "errorType" igual a "provider_not_enabled"
    E o evento deve alimentar widgets de excecao "query_value" e "timeseries" do plano de event storming

  Cenário: Falha ao encontrar cliente deve gerar sinal negativo observavel
    Dado que o cliente informado nao possui vinculo com o PSP
    E que a busca ou validacao do cliente falha por indisponibilidade interna
    Quando o ecommerce solicitar criacao de invoice
    Então Payments deve manter a invoice sem status "OPEN"
    E nao deve criar cobranca no PSP
    E deve publicar evento observavel com "event_key" igual a "pagamento.cobranca.cadastrada.cliente.nao.encontrado.failure_exception"
    E o evento deve conter "stage" igual a "cliente_nao_encontrado"
    E o evento deve conter "errorType", "errorCode" e "retryable"
    E o evento deve alimentar widgets de excecao do caminho alternativo no plano de event storming

  Cenário: Falha ao carregar cliente ja vinculado deve gerar sinal negativo observavel
    Dado que o cliente informado deveria possuir vinculo com o PSP
    E que a consulta do vinculo do cliente falha por erro tecnico
    Quando o ecommerce solicitar criacao de invoice
    Então Payments deve manter a invoice sem status "OPEN"
    E nao deve criar cobranca no PSP
    E deve publicar evento observavel com "event_key" igual a "pagamento.processamento.pagamentos.cliente.encontrado.view_exception"
    E o evento deve conter "stage" igual a "cliente_encontrado"
    E o evento deve conter "errorType", "errorCode" e "retryable"
    E o evento deve alimentar widgets de excecao do caminho feliz no plano de event storming

  Cenário: Falha ao cadastrar cliente no Asaas deve gerar sinal negativo observavel
    Dado que nao existe vinculo entre cliente Magazine Siara e Asaas
    E que o Asaas rejeita o cadastro do cliente
    Quando o ecommerce solicitar criacao de invoice
    Então Payments deve marcar a tentativa como "FAILED"
    E nao deve criar cobranca no Asaas
    E deve publicar evento observavel com "event_key" igual a "pagamento.cobranca.cadastrada.cliente.cadastrado_exception"
    E o evento deve conter "stage" igual a "cliente_cadastrado"
    E o evento deve conter a causa sanitizada do erro do PSP
    E o evento nao deve expor token, documento completo ou payload sensivel

  Cenário: Falha ao criar cobranca no Asaas deve preservar o SOR e gerar excecao operacional
    Dado que a invoice foi registrada no Payments com status "PROVIDER_PENDING"
    E que o cliente ja esta vinculado ao Asaas
    Quando o Asaas retornar timeout, erro 5xx ou erro de validacao ao criar a cobranca
    Então Payments deve marcar a invoice como "FAILED" ou como estado recuperavel definido pela politica de retry
    E deve permitir retry seguro com a mesma chave de idempotencia quando a falha for transiente
    E nao deve retornar status "OPEN" sem "providerPaymentId"
    E deve manter a resposta do provedor disponivel para auditoria interna quando existir payload de erro
    E deve publicar evento observavel com "event_key" igual a "pagamento.processamento.pagamentos.pagamento.pendente_exception"
    E deve publicar evento observavel com "event_key" igual a "pagamento.processamento.pagamentos.fatura.criada_exception" quando a falha impedir a fatura final
    E os eventos devem conter "stage" igual a "pagamento_pendente" ou "fatura_criada" conforme o ponto de falha
    E os eventos devem conter "provider", "providerOperation", "latencyMs", "errorType", "errorCode" e "retryable"

  Cenário: Validar a cobranca criada no Asaas como criterio fundamental de aceite
    Dado que Payments recebeu sucesso da chamada "POST /v3/payments"
    E que o Asaas retornou "id", "status", "invoiceUrl", "value", "dueDate", "billingType" e "externalReference"
    Quando Payments registrar a invoice como "OPEN"
    Então o "providerPaymentId" salvo no SOR deve ser igual ao "id" retornado pelo Asaas
    E o "externalReference" salvo no SOR deve ser igual ao "externalReference" retornado pelo Asaas
    E o "orderId" da invoice deve ser igual ao "externalReference" usado no Asaas
    E o "amount" salvo no SOR deve ser igual ao "value" retornado pelo Asaas
    E o "dueDate" auditavel no SOR deve ser igual ao "dueDate" retornado pelo Asaas
    E o "billingType" auditavel no SOR deve ser igual ao "billingType" retornado pelo Asaas
    E o status externo "PENDING" do Asaas deve ser traduzido para status canonico "OPEN" no Payments
    E a URL de pagamento retornada ao ecommerce deve ser a "invoiceUrl" retornada pelo Asaas quando disponivel
    E deve ser possivel consultar a cobranca no Asaas por "GET /v3/payments/{providerPaymentId}" para reconciliar os campos fundamentais
    E deve publicar evento observavel com "event_key" igual a "pagamento.processamento.pagamentos.fatura.criada"
    E o evento deve conter "providerPaymentId", "providerStatus", "paymentUrl", "amount", "dueDate" e "billingType"

  Cenário: Bloquear sucesso falso quando o Asaas nao retorna identificador ou URL conciliavel
    Dado que Payments chamou "POST /v3/payments"
    Quando o Asaas responder sem "id" da cobranca
    Então Payments nao deve marcar a invoice como "OPEN"
    E nao deve publicar evento positivo "pagamento.processamento.pagamentos.fatura.criada"
    E deve publicar evento observavel com "event_key" igual a "pagamento.processamento.pagamentos.fatura.criada_exception"
    E o evento deve conter "errorType" igual a "provider_contract_violation"
    E o evento deve conter "provider" igual a "ASAAS"
    E o evento deve alimentar widgets de excecao definidos no plano de event storming

  Cenário: Garantir contrato minimo de tags para dashboards de caminho feliz
    Quando uma invoice for criada com sucesso
    Então a observabilidade deve emitir eventos positivos com estes "event_key":
      | event_key |
      | pagamento.cobranca.checkout.intencao.de.pagamento.salva |
      | pagamento.processamento.pagamentos.cliente.encontrado.view |
      | pagamento.processamento.pagamentos.pagamento.pendente |
      | pagamento.processamento.pagamentos.fatura.criada |
    E cada evento deve conter tags pesquisaveis "event_key", "env", "stage", "flow", "step", "tenantId", "orderId", "invoiceId", "provider" e "correlationId"
    E cada evento deve ser consultavel pelas queries "tags:(event_key:<event_key> env:dev)" definidas no plano
    E cada evento deve estar disponivel para visualizacao como KPI e tendencia

  Cenário: Garantir contrato minimo de tags para dashboards de excecao
    Quando qualquer etapa de criacao de invoice falhar
    Então a observabilidade deve emitir um evento de excecao com sufixo "_exception" no "event_key"
    E o evento deve conter tags pesquisaveis "event_key", "env", "stage", "flow", "step", "tenantId", "orderId", "provider", "correlationId", "errorType", "errorCode" e "retryable"
    E o evento deve ser consultavel pelas queries "tags:(event_key:<event_key> env:dev)" definidas no plano
    E o evento deve estar disponivel para visualizacao como KPI e tendencia em palette "alert"
    E o evento nao deve conter segredo, token, documento completo, email completo ou telefone completo

  Cenário: Cumprir os Observable Business Contracts do Product Deck
    Quando uma invoice for criada no PSP e ficar "OPEN"
    Então Payments deve responder sucesso, recusa conhecida ou erro tratado
    E a tentativa deve contribuir para o SLO "99.5% das tentativas de pagamento respondem com sucesso, recusa conhecida ou erro tratado"
    E a latencia da etapa de criacao no provedor deve ser medida para suportar p95 abaixo de 3 segundos quando aplicavel
    E a falha deve gerar alerta acionavel em ate 2 minutos quando classificada como "PagamentoFalhou"
    E os sinais devem permitir diagnostico por "correlationId", "invoiceId", "orderId", "provider" e "stage"
