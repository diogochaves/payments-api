# Payments API — Guia do Agente

Este arquivo é um roteador mínimo. O contexto de execução vive nos skills, no
manifest e nos artefatos do card — **não pré-leia a documentação do framework**.

## Como trabalhar

1. **Trabalho de Delivery:** invoque o skill da fase — `/bootstrap`, `/hack`,
   `/sync`, `/finish`, `/ship`, `/validate`, `/promote`. Cada skill é
   autossuficiente e diz o que ler.
2. **Exploração:** `/upstream`. **Implementação governada:** `/downstream`.
3. **Paths canônicos, quality gates e vocabulário:** `prodops/exec/manifest.yaml`
   — fonte única, legível por máquina. Consistência: `./prodops/scripts/validate-manifest.sh`.
4. **Contexto da tarefa:** o OBC e a BDD Feature do card (localizações no
   manifest). Leia-os antes de alterar código de produção — e somente eles.

## Regras invioláveis

- Nunca inventar OBCs, SLOs, riscos ou critérios de aceite ausentes. Contexto
  faltando → parar e reportar, não improvisar.
- Downstream exige: OBC committed + BDD Feature committed + entrada no
  Iteration Plan com status `Entrou` + riscos documentados.
- Conflito entre diretriz nova e regra existente: preservar a regra existente e
  registrar em Decision Trail (`prodops/templates/assessment/decision-trail.md`).
- Commits seguem Conventional Commits (tipos e limite de summary: no manifest).
- Toda entrega Downstream relevante gera append no release trail
  (`prodops/artifacts/trails/release-trail.md`).

## Doutrina do framework (humanos; agentes somente sob demanda explícita)

Princípios, glossário, fluxo oficial, Origin Streams e modelo operacional:
`prodops/README.md` → `prodops/framework/`.
