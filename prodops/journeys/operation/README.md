# Operation

## Propósito

A jornada de Operation cobre o ciclo de vida do sistema em produção: incidentes, runbooks, postmortems e a trilha operacional contínua.

## Arquivos

| Arquivo | Propósito |
|---|---|
| [incidents.md](incidents.md) | Registro e resposta a incidentes |
| [postmortems.md](postmortems.md) | Postmortems e análise de causa raiz |
| [runbooks.md](runbooks.md) | Runbooks operacionais |
| [operational-trail.md](operational-trail.md) | Trilha append-only de eventos operacionais |

## Relação com outras jornadas

- **Delivery** alimenta a Operation com releases e evidências de deploy.
- **Assessment** recebe sinais de operation para atualizar riscos e Reliability Plan.
- **Diligence** observa a operação e dispara verificações quando anomalias são detectadas.
