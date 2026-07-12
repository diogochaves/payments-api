# Backlog Hierarchy

The ProdOps Framework organizes work in a hierarchy of five backlogs, each representing an increasing level of commitment.

```
Tracking List
      │  item investigated and recognized as an Intent
      ▼
Icebox Backlog          ← OBC is born here
      │  prioritized for strategic planning
      ▼
Roadmap Backlog         ← lives outside the repository
      │  committed to a Release
      ▼
Release Backlog
      │  organized operationally
      ▼
Iteration Backlog
      │  work ready to start
      ▼
Delivery
```

Work never skips levels without explicit justification recorded in the OBC.

---

## Tracking List

**Purpose:** Entry point of the Framework. Captures any signal that has not yet been understood enough to be treated as a commitment.

**Contains:**

- Questions, doubts, observed problems
- Opportunities and ideas
- Flagged risks
- Hypotheses to investigate
- Received feedback
- Incomplete requirements
- Confusing concepts
- Signals from incidents and postmortems
- Stakeholder demands without sufficient refinement

**Commitment:** None. No OBC exists. No Issue exists. The goal is to investigate whether the item represents a valid Intent.

**When to advance:** When the item has been understood enough to be recognized as an Intent and enter the Icebox.

**Canonical artifact:** `prodops/artifacts/product/tracking-list.md`

---

## Icebox Backlog

**Purpose:** First official product backlog. When an item enters the Icebox, it is treated as a recognized Intent.

**What happens upon entering the Icebox:**

- The item is recognized as a valid Framework Intent.
- Its OBC (Observable Business Contract) is born — initially as a draft.
- The OBC becomes the permanent identifier of that work.
- The OBC begins recording the evolution history: which backlogs it has passed through and when.

**Commitment:** The item is recognized as relevant, but still without a delivery commitment or date.

**When to advance:** When the item has sufficient evidence to enter strategic planning (Roadmap).

**Canonical artifact:** `prodops/artifacts/product/icebox-backlog.md`

---

## Roadmap Backlog

**Purpose:** Represents the strategic planning of the product. Groups Releases from one or multiple products and repositories within a planning horizon.

**Characteristics:**

- Does not belong to the repository — lives in external tools (GitHub Projects, Jira Roadmap, Azure DevOps Plans, strategic spreadsheet).
- Can group Release Backlogs from multiple products or repositories.
- Represents business commitments and strategic alignments.
- Is composed of one or more Release Backlogs.

**Commitment:** Strategic commitment — the product intends to deliver this within a defined horizon.

**When to advance:** When the item is committed to a specific Release.

**Canonical artifact:** External management tool (no canonical file in this repository). The OBC records when the item entered the Roadmap.

---

## Release Backlog

**Purpose:** Represents everything that is part of a Release. Every item in this backlog has a formal delivery commitment.

**Characteristics:**

- A Release can participate in a Roadmap or exist independently.
- Contains only items with a committed OBC and defined acceptance criteria.
- A Release can have one or more Iteration Backlogs.

**Commitment:** Delivery commitment — the team has assumed this item will be in the release.

**When to advance:** When the item is planned for a specific Iteration.

**Canonical artifact:** `prodops/artifacts/plans/iteration-plan.md` (section "Recommended Iteration Plan" with status `Entrou`).

---

## Iteration Backlog

**Purpose:** Represents the operational organization of work within a Release. It is the backlog immediately before Delivery.

**Can represent:**

- Sprint
- Kanban
- Week
- Operational cycle
- The Release itself, when there is no subdivision

**A Release can have one or several Iterations.**

**Commitment:** The team will start implementation in this Iteration. All Delivery prerequisites must be satisfied.

**Mandatory prerequisites to move from Iteration to Delivery:**
- OBC committed in `prodops/artifacts/obcs/`
- BDD Feature committed in `prodops/artifacts/bdd/`
- Entry in the Iteration Plan with status `Entrou`
- Risks documented in `prodops/journeys/assessment/risks.md`
- Entry in the Reliability Plan in `prodops/journeys/assessment/reliability-plans/`

**Canonical artifact:** `prodops/artifacts/plans/iteration-plan.md` (section "Identified Iteration Backlog").

---

## Observable Business Contract (OBC) as permanent identifier

The OBC is born when an Intent enters the Icebox. It accompanies the work throughout its entire life.

### OBC lifecycle

| Phase | OBC State | What happens |
|---|---|---|
| Tracking List | Does not exist | The item is not yet a recognized Intent |
| Icebox | Draft | OBC created as a draft; captures the Intent and initial hypotheses |
| Discovery / Exploration | Draft under refinement | OBC refined with experiment learnings; criteria emerge |
| Assessment Review | Committed candidate | OBC reviewed by PM + Tech Lead |
| Release / Iteration Backlog | Committed | OBC approved; measurable and verifiable criteria; Downstream can start |
| Delivery | Committed (in execution) | OBC guides implementation; BDD Feature operationalizes it |
| Operation | Committed (validated) | OBC validated in production; can be extended by new Intents |

### What the OBC records

The OBC is not just functional documentation. It is the **living history of the work**:

- Original Intent and Origin Stream
- Which backlogs it passed through and when
- Decisions made and discarded
- Acceptance criteria and how they evolved
- References to experiments, risks, and Reliability Plan
- Validation evidence in production

---

## GitHub Issue as operational representation

A GitHub Issue is not the origin of work in the ProdOps Framework.

It is an **operational representation** of a commitment already made.

**When an Issue is born:**

- Normally, when an OBC enters a **Release Backlog** or **Iteration Backlog**.
- The Issue represents work ready to be executed by Delivery.
- The Issue references the OBC — it does not replace it.

**The Framework is tool-independent.** GitHub Issues, Jira Cards, Azure DevOps Work Items are operational representations of the same OBC in different tools. The OBC is the source of truth; the Issue is the execution instance.

---

## Diligence as guardian of the hierarchy

Diligence is the journey responsible for keeping the backlog hierarchy synchronized.

> **Principle:** Diligence is the guardian of consistency of the ProdOps work system. It ensures that the state of each Observable Business Contract remains synchronized across all backlogs, tools, and management artifacts, without modifying product code.

**What Diligence keeps synchronized:**

- OBC state in each backlog (Icebox, Roadmap, Release, Iteration)
- Operational representations in tools (GitHub Issues, Jira, Azure DevOps)
- Traceability Intent → OBC → Issue → PR → Release → Operation
- Consistency between ProdOps artifacts and external tools

Diligence never implements software. It governs the work system that feeds Delivery.

→ [Diligence Journey](../journeys/diligence/README.md)

---

## References

- `prodops/artifacts/product/tracking-list.md` — Tracking List
- `prodops/artifacts/product/icebox-backlog.md` — Icebox Backlog
- `prodops/artifacts/obcs/` — Committed OBCs
- `prodops/artifacts/plans/iteration-plan.md` — Release and Iteration Backlog
- `prodops/framework/glossary.md` — canonical definitions
- `prodops/journeys/diligence/README.md` — Diligence Journey
