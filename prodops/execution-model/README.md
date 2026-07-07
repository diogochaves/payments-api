# Execution Model

Upstream e Downstream são **modos de execução** do Framework ProdOps — não são jornadas.

Cada modo utiliza as mesmas jornadas (Discovery, Delivery, Operation, Assessment, Diligence). A diferença está no nível de compromisso e nos critérios de qualidade aplicados.

## Upstream

Modo de exploração e aprendizado.

**Características:**
- Baixo compromisso
- Liberdade para selecionar capabilities e práticas conforme necessidade
- Código é descartável até ser promovido para Downstream
- Evolução rápida de artefatos
- Foco em aprendizado, não em entrega

Upstream transforma hipóteses em conhecimento validado.

→ [Detalhes do modo Upstream](upstream.md)

## Downstream

Modo de entrega governada.

**Características:**
- Compromisso formal com critérios de aceite (OBC + BDD Feature)
- Governança e rastreabilidade completas
- Artefatos obrigatórios antes do início
- Evidências registradas em cada etapa
- Sequência completa obrigatória

Downstream entrega software com o conhecimento validado pelo Upstream.

→ [Detalhes do modo Downstream](downstream.md)

## Como escolher o modo

| Situação | Modo |
|---|---|
| Hipótese a validar, incerteza alta | Upstream |
| Item aprovado no Iteration Plan | Downstream |
| Explorar uma capability nova | Upstream |
| Implementar OBC + BDD Feature existente | Downstream |
| Prototipar integração com provedor | Upstream |
| Entregar feature com compromisso | Downstream |
