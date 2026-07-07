# Business Intent — [Título]

Localização canônica: `prodops/business-intents/<slug>.md`

> Um Business Intent registra uma intenção de gerar valor, sem compromisso de implementação. É o ponto de entrada do Framework antes de decidir se o trabalho segue por Upstream (exploração) ou Downstream (entrega governada).

---

## Identificação

| Campo | Conteúdo |
|---|---|
| Título | |
| Data de registro | YYYY-MM-DD |
| Solicitante | |
| Dono de produto | |

---

## Intenção

Descreva em uma ou duas frases o valor que se pretende gerar.

> "Queremos que [ator] consiga [ação] para [resultado de negócio]."

---

## Contexto

Por que esta intenção surgiu agora? Qual pressão, oportunidade ou problema a motivou?

---

## Hipóteses de Negócio

Liste as hipóteses que motivam esta intenção e que deverão ser confirmadas, refinadas ou descartadas durante a exploração.

Uma hipótese deve representar uma crença sobre o negócio, o usuário ou o produto, e não uma decisão de implementação.

Exemplos:

- [ ] A limitação atual reduz a conversão.
- [ ] Resolver este problema aumentará a satisfação do cliente.
- [ ] Existe demanda suficiente para justificar o investimento.

---

## Perguntas em aberto

O que precisa ser respondido antes de comprometer implementação?

- [ ]
- [ ]

---

## Modo de execução sugerido

- [ ] **Upstream** — há incerteza suficiente para explorar antes de comprometer
- [ ] **Downstream** — há clareza suficiente; OBC e BDD podem ser escritos agora

Justificativa:

---

## Próximo passo

- Se Upstream: criar experimento em `prodops/journeys/discovery/experiments/`
- Se Downstream: criar OBC em `prodops/artifacts/obcs/` e BDD Feature em `prodops/artifacts/bdd/`

---

## Artefatos gerados

| Artefato | Localização |
|---|---|
| | |
