# Iteration Backlog — Operational Demands

> **Purpose:** Operational and stakeholder demands still under evaluation (Analytics, DataDog, ITSM). Derived from the Payments release Premortem. Items here need refinement before entering an OBC or Iteration Plan.
>
> → [Backlog hierarchy](../../framework/backlogs.md)
> → [Approved delivery scope](iteration-plan.md) — to see what's in/out/deferred

## Objective

Record known demands that still need refinement, evaluation or planning before being incorporated into the Iteration Plan or a specific OBC.

| ID | Area | Request | Type | Priority | Status | Next Step |
|----|------|---------|------|----------|--------|-----------|
| TL-001 | Marketing | Add Analytics to track the payment journey and results. | Business Observability | High | Open | Refine required KPIs, events and dashboards. |
| TL-002 | Sales | Track payment and cancellation indicators. | Business KPI | High | Open | Define metrics, data sources and executive reports. |
| TL-003 | Architecture | Deploy DataDog (MS-0172), instrument the Notifier, and ensure Payments is fully instrumented. | Technical Observability | High | Open | Draft instrumentation plan and update the Reliability Plan. |
| TL-004 | Infrastructure | Integrate the Payments team into Magazine Siará's corporate Incident Management model. | Operation / Reliability | Medium | Open | Define process, runbooks, on-call, and ITSM integrations. |

---

# Criteria to exit the Tracking List

An item leaves the Tracking List when:

- It has been refined sufficiently to compose an OBC.
- It has been discarded by business decision.
- It has been consolidated into an epic or Iteration Plan.
- It has been implemented and closed.

---

# Relationship with ProdOps artifacts

Each item may originate or update:

- Product Deck
- Service Deck
- Observable Business Contract (OBC)
- Reliability Plan
- Iteration Plan
- Iteration Backlog

The Tracking List represents demands still under evaluation and serves as the main input source for Continuous Assessment.
