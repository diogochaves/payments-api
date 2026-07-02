# Tracking List

| Item | Origem | Dimensao | Dono | Status | Proxima acao |
| --- | --- | --- | --- | --- | --- |
| Coletar evidencia de readiness da Feature Flag do novo gateway no Checkout. | EXP-004 Checkout Gateway Feature Flag Readiness | Release/Confiabilidade/Checkout | Tech Lead Checkout + Payments | P0 Aberto | Obter bug, owner, fix status, rollout targeting, auditoria, rollback e telemetria por pedido. |
| Definir politica para pedidos em andamento apos rollback da Feature Flag. | EXP-004 Checkout Gateway Feature Flag Readiness | Operacao/Fluxo/Dados | Checkout + Payments + Operacao | P0 Aberto | Decidir se pedidos iniciados no Payments continuam reconciliando no Payments apos desligar novos trafegos. |
| Promover pagamento com cartao hospedado Asaas para Downstream. | Upstream hosted vs tokenized credit card experiment | Cliente/Empresa/Tecnologia | PM Payments + Tech Lead Payments | Candidato | Revisar OBC e BDD, aceitar escopo hospedado, adicionar ao Iteration Backlog. |
| Decidir politica para cartao tokenizado. | Upstream hosted vs tokenized credit card experiment | Seguranca/Tecnologia/UX | PM Payments + Seguranca + Antifraude | Aberto | Confirmar token ownership, `remoteIp`, timeout, risco, recusa e limites de armazenamento antes de Downstream. |
| Manter captura direta de cartao fora do primeiro slice. | Upstream hosted vs tokenized credit card experiment | Seguranca/Compliance | PM Payments + Seguranca | Bloqueado por decisao | Retomar apenas se houver aceite formal de PCI/security e antifraude. |
