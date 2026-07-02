# language: pt
Funcionalidade: Pagamento com cartao de credito no gateway de pagamentos
  Como ecommerce Magazine Siará
  Quero aceitar pagamento com cartao de credito por um contrato observavel
  Para aumentar conversao sem acoplar o checkout diretamente ao provedor Asaas

  Contexto:
    Dado que o provedor "ASAAS" esta habilitado para o ecommerce Magazine Siará
    E o ecommerce envia uma chave de idempotencia em toda solicitacao de criacao
    E o webhook da Asaas foi configurado com token de autenticacao

  Cenário: Criar cobranca de cartao com entrada hospedada no Asaas
    Quando o ecommerce solicitar a criacao de uma invoice com "billingType" igual a "CREDIT_CARD"
    E nao enviar dados de cartao no payload do gateway
    Então o gateway deve chamar "POST /v3/payments"
    E deve retornar uma URL de pagamento hospedada pelo provedor
    E deve manter a invoice em estado "OPEN" ate receber confirmacao por webhook
    E nao deve trafegar dados sensiveis de cartao pela Payments API

  Cenário: Confirmar pagamento de cartao hospedado por webhook
    Dado que a invoice de cartao hospedado foi criada com status "OPEN"
    E o cliente concluiu o pagamento no ambiente hospedado da Asaas
    Quando a Asaas enviar "PAYMENT_CONFIRMED"
    Então o gateway deve atualizar a invoice para "CONFIRMED"
    E deve publicar o evento canonico "payment.confirmed" uma unica vez
    E deve manter a rastreabilidade por "orderId", "invoiceId", "providerPaymentId" e "correlationId"

  Cenário: Conciliar recebimento financeiro de cartao
    Dado que a invoice de cartao esta com status "CONFIRMED"
    Quando a Asaas enviar "PAYMENT_RECEIVED"
    Então o gateway deve atualizar a invoice para "RECEIVED"
    E deve registrar o recebimento para conciliacao financeira
    E nao deve publicar uma segunda liberacao de pedido

  Cenário: Criar cobranca de cartao tokenizado
    Dado que existe um token de cartao associado ao cliente Asaas correto
    Quando o ecommerce solicitar a criacao de uma invoice com "billingType" igual a "CREDIT_CARD"
    E enviar "creditCardToken" e "remoteIp"
    Então o gateway deve chamar "POST /v3/payments" com os campos de tokenizacao
    E deve classificar autorizacao, recusa ou analise de risco sem expor dados sensiveis
    E deve aplicar timeout explicito de pelo menos 60 segundos para a chamada ao provedor

  Cenário: Mapear pagamento autorizado aguardando captura
    Dado que a invoice de cartao esta associada ao provedor "ASAAS"
    Quando a Asaas enviar o evento "PAYMENT_AUTHORIZED"
    Então o gateway deve registrar a autorizacao
    E deve emitir evento observavel sem liberar pedido como pagamento confirmado

  Cenário: Mapear analise de risco aprovada
    Dado que a invoice de cartao esta em analise de risco
    Quando a Asaas enviar "PAYMENT_APPROVED_BY_RISK_ANALYSIS"
    Então o gateway deve registrar a aprovacao da analise de risco
    E deve aguardar o evento de confirmacao antes de liberar pedido

  Cenário: Mapear analise de risco reprovada
    Dado que a invoice de cartao esta em analise de risco
    Quando a Asaas enviar "PAYMENT_REPROVED_BY_RISK_ANALYSIS"
    Então o gateway deve registrar a reprovacao da analise de risco
    E deve emitir evento observavel de pagamento recusado
    E nao deve publicar "payment.confirmed"

  Cenário: Mapear analise de risco manual
    Dado que a invoice de cartao esta associada ao provedor "ASAAS"
    Quando a Asaas enviar "PAYMENT_AWAITING_RISK_ANALYSIS"
    Então o gateway deve registrar que o pagamento esta em analise
    E deve impedir timeout operacional silencioso da jornada do checkout

  Cenário: Mapear recusa de captura
    Dado que a invoice de cartao esta associada ao provedor "ASAAS"
    Quando a Asaas enviar "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED"
    Então o gateway deve marcar o pagamento como recusado ou falho de negocio
    E deve publicar motivo observavel para checkout, atendimento e operacao

  Cenário: Confirmar pagamento com cartao
    Dado que a invoice de cartao esta associada ao provedor "ASAAS"
    Quando a Asaas enviar "PAYMENT_CONFIRMED"
    Então o gateway deve atualizar a invoice para "CONFIRMED"
    E deve publicar o evento canonico "payment.confirmed" uma unica vez

  Cenário: Simular pagamento aprovado na sandbox Asaas
    Dado que o ambiente utilizado e a sandbox da Asaas
    E o experimento "002-sandbox-funding" esta sendo executado
    Quando o ecommerce validar um pagamento com cartao de teste aprovado
    Então o gateway deve tratar o resultado como evidencia funcional de sandbox
    E deve registrar quais estados foram reproduzidos pela sandbox
    E deve registrar quais estados foram apenas simulados no Validation Workbench

  Cenário: Simular pagamento recusado na sandbox ou no Validation Workbench
    Dado que o ambiente utilizado e a sandbox da Asaas ou o Validation Workbench
    Quando o provedor simular recusa, captura recusada ou reprovacao por risco
    Então o gateway deve manter a invoice fora de "CONFIRMED"
    E deve registrar motivo observavel para checkout, atendimento e operacao
    E deve preservar idempotencia para retentativa segura quando aplicavel

  Cenário: Tratar estorno como fluxo diferente de cancelamento
    Dado que a invoice de cartao esta com status "CONFIRMED"
    Quando o ecommerce solicitar cancelamento apos confirmacao
    Então o gateway deve rejeitar o cancelamento simples
    E deve orientar o fluxo de estorno ou reversao

  Cenário: Manter captura direta de cartao fora do primeiro slice
    Dado que o ecommerce deseja enviar dados sensiveis de cartao diretamente para Payments API
    Quando a capability ainda nao tiver decisao formal de seguranca, compliance e antifraude
    Então o gateway nao deve aceitar captura direta como escopo Downstream
    E deve manter essa alternativa como investigacao Upstream
