# Tracking List

> **Escopo:** itens de produto e engenharia derivados de experimentos Upstream e do Reliability Plan — decisões técnicas e de produto que precisam de refinamento antes de entrar em um OBC ou Iteration Plan.
>
> Existe uma segunda Tracking List de demandas operacionais e de stakeholders (Analytics, DataDog, ITSM) em:
> [`prodops/assessment/reliability-plan/iteration-backlog.md`](../assessment/reliability-plan/iteration-backlog.md)

| Item | Origem | Dimensao | Dono | Status | Proxima acao |
| --- | --- | --- | --- | --- | --- |
| Coletar evidencia de readiness da Feature Flag do novo gateway no Checkout. | EXP-004 Checkout Gateway Feature Flag Readiness | Release/Confiabilidade/Checkout | Tech Lead Checkout + Payments | P0 Aberto | Obter bug, owner, fix status, rollout targeting, auditoria, rollback e telemetria por pedido. |
| Definir politica para pedidos em andamento apos rollback da Feature Flag. | EXP-004 Checkout Gateway Feature Flag Readiness | Operacao/Fluxo/Dados | Checkout + Payments + Operacao | P0 Aberto | Decidir se pedidos iniciados no Payments continuam reconciliando no Payments apos desligar novos trafegos. |
| Promover pagamento com cartao hospedado Asaas para Downstream. | Upstream hosted vs tokenized credit card experiment | Cliente/Empresa/Tecnologia | PM Payments + Tech Lead Payments | Candidato | Revisar OBC e BDD, aceitar escopo hospedado, adicionar ao Iteration Backlog. |
| Decidir politica para cartao tokenizado. | Upstream hosted vs tokenized credit card experiment | Seguranca/Tecnologia/UX | PM Payments + Seguranca + Antifraude | Aberto | Confirmar token ownership, `remoteIp`, timeout, risco, recusa e limites de armazenamento antes de Downstream. |
| Manter captura direta de cartao fora do primeiro slice. | Upstream hosted vs tokenized credit card experiment | Seguranca/Compliance | PM Payments + Seguranca | Bloqueado por decisao | Retomar apenas se houver aceite formal de PCI/security e antifraude. |
| Definir contrato Cart/Checkout -> Payments para cartoes salvos. | EXP-001 Credit Card Lifecycle | Produto/API/Checkout | PM Payments + Tech Lead Checkout + Tech Lead Payments | Aberto | Validar `GET /users/{userId}/payment-methods/credit-cards`, `POST /users/{userId}/payment-methods/credit-cards` e `POST /invoices/{invoiceId}/pay-with-credit-card`. |
| Definir armazenamento seguro de token de cartao. | EXP-001 Credit Card Lifecycle | Seguranca/Dados/Arquitetura | Seguranca + Arquitetura + Payments | P0 Aberto | Decidir cofre/criptografia, mascaramento, retencao, revogacao e resposta a comprometimento de token. |
| Definir fronteira de refund para cartao confirmado. | EXP-001 Credit Card Lifecycle | Financeiro/Operacao/API | Financeiro + Operacao + Payments | Aberto | Confirmar contrato `POST /invoices/{invoiceId}/refund`, idempotencia, conciliacao e evidencia do provedor. |
