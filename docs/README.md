# Figentra Documentation

**Status:** CANONICAL INDEX

This directory contains canonical company, product and engineering-system documentation for Figentra.

## Company

- [`company.md`](./company.md) — company identity, mission, positioning, geographic strategy, portfolio, and corporate language.

## Brand

- [`figentra-brand-architecture.md`](./figentra-brand-architecture.md) — authoritative naming and hierarchy for Figentra, Figentra Agentic Development, Figentra OS, Academorix, Beautilon, and future products.

## Technology Products

- [`figentra-agentic-development.md`](./figentra-agentic-development.md) — canonical product definition for the AI-native software-development platform.
- [`figentra-os.md`](./figentra-os.md) — Enterprise Operating System product definition and platform capabilities.

## Engineering System

- [`engineering-system/README.md`](./engineering-system/README.md) — tool-neutral Agent Engineering System and SDLC source of truth.
- [`engineering-system/constitution.md`](./engineering-system/constitution.md) — engineering and agent constitution.
- [`engineering-system/sdlc.md`](./engineering-system/sdlc.md) — autonomous software-development lifecycle.
- [`engineering-system/agent-roster.md`](./engineering-system/agent-roster.md) — canonical logical agent roster.
- [`engineering-system/routing.md`](./engineering-system/routing.md) — deterministic task routing and handoffs.
- [`engineering-system/artifact-system.md`](./engineering-system/artifact-system.md) — canonical engineering artifacts and traceability.
- [`engineering-system/context-system.md`](./engineering-system/context-system.md) — durable context and progressive loading model.
- [`engineering-system/governance.md`](./engineering-system/governance.md) — authority, approvals and escalation.
- [`engineering-system/quality-gates.md`](./engineering-system/quality-gates.md) — production evidence gates.
- [`engineering-system/adapters/`](./engineering-system/adapters/) — Kiro, Cline and generic tool adapters.

## Application Products

- **Academorix** — application product; product-specific documentation belongs with its application scope.
- **Beautilon** — application product; formerly called `Beauty Loan`.

## Canonical hierarchy

```text
FIGENTRA
Company / Brand
│
├── Figentra Agentic Development
│   AI-native software development platform
│
├── Figentra OS
│   Enterprise Operating System product
│
└── Applications
    ├── Academorix
    ├── Beautilon
    └── Future products
```

## Geographic positioning

Canonical corporate framing:

> **Built from the Middle East and Africa. Built for the world.**

Canonical category framing:

> **Pioneering agentic software development from the Middle East and Africa for a global market.**

MENA may be used when a statement specifically refers to the Middle East and North Africa region, but the company's canonical geographic identity is **Middle East and Africa**, with **global** as the market ambition.

## Naming rules

- `Figentra` = company and brand.
- `Figentra Agentic Development` = AI-native software-development product.
- `Figentra OS` = Enterprise Operating System product.
- `Academorix` = application product.
- `Beautilon` = application product.
- `Beauty Loan` = legacy product name only; do not use it for current product references.
- `Figentra Agentic Development OS` = prohibited product name.

## Authority

Technical architecture is governed by `.kiro/specs/figentra-platform/ARCHITECTURE.md` and the applicable implementation contracts. Agent engineering governance is governed by [`engineering-system/`](./engineering-system/). Commercial/product naming is governed by [`figentra-brand-architecture.md`](./figentra-brand-architecture.md).
