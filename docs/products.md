# Figentra Product Portfolio

**Status:** CANONICAL / APPROVED
**Date:** 2026-09-04

This document is the canonical product portfolio for Figentra.

## 1. Portfolio model

Figentra separates the company from its technology products and applications.

```text
FIGENTRA
Company / Brand
│
├── Technology Products
│   ├── Figentra Agentic Development
│   └── Figentra OS
│
└── Application Products
    ├── Academorix
    ├── Beautilon
    └── Future Products
```

## 2. Figentra Agentic Development

**Category:** Agentic Software Development

**Position:** Flagship AI-native development product.

**Purpose:** Build production software through coordinated AI agents, human oversight, project context, specifications, tools, quality gates, and controlled deployment.

**Core message:**

> **AI agents building production software.**

**Lifecycle:**

```text
Idea → Product → Architecture → Plan → Build → Test → Review → Deploy → Operate
```

## 3. Figentra OS

**Category:** Enterprise Operating System

**Position:** Flagship enterprise platform product.

**Purpose:** Provide the reusable enterprise foundation on which digital businesses and applications are built and operated.

**Core message:**

> **The Enterprise Operating System for modern digital businesses.**

Core areas include Identity, Tenant, IAM, Monetization, Usage, Workflow, Notifications, Audit, Files, Integrations, Search, Reporting, Analytics, Marketing, developer foundations, runtimes, and experience infrastructure.

## 4. Academorix

**Category:** Application Product

**Position:** A Figentra-built application.

Academorix owns its product experience, domain model, business logic, and business data. It can consume Figentra OS services and platform capabilities.

## 5. Beautilon

**Category:** Application Product

**Position:** A Figentra-built application.

**Canonical name:** Beautilon

**Legacy name:** Beauty Loan

All new product, technical, commercial, and architectural documentation must use **Beautilon**. The legacy name may only appear when explaining historical naming or migration context.

## 6. Future applications

Figentra may create additional vertical applications without changing the company or platform architecture.

Each application should:

- Have a distinct product identity and value proposition.
- Own its domain/business logic.
- Own its business data.
- Consume Figentra OS capabilities through stable contracts.
- Avoid duplicating platform services.
- Remain independently deployable where appropriate.

## 7. Platform versus application

The distinction is mandatory:

| Layer | Example | Owns |
|---|---|---|
| Company | Figentra | Brand, company, ecosystem |
| AI development product | Figentra Agentic Development | Agentic software-development lifecycle |
| Platform product | Figentra OS | Enterprise platform capabilities |
| Application | Academorix | Application-specific business domain |
| Application | Beautilon | Application-specific business domain |

## 8. Product relationship

```text
                         FIGENTRA
                            │
             ┌──────────────┴──────────────┐
             │                             │
   FIGENTRA AGENTIC DEVELOPMENT       FIGENTRA OS
             │                             │
       Builds software              Runs / enables software
             │                             │
             └──────────────┬──────────────┘
                            │
                      Applications
                            │
               ┌────────────┼────────────┐
               │            │            │
           Academorix    Beautilon    Future
```

## 9. Product principles

### Shared foundation, independent products

Applications use common platform capabilities without becoming platform modules.

### Agentic by construction

Figentra's own software development process is designed around coordinated AI agents and human governance.

### Enterprise by default

Security, identity, tenancy, authorization, observability, auditability, reliability, and operational controls are foundational.

### Global by ambition

Figentra is rooted in the Middle East and Africa while building for global markets.

## 10. Geographic positioning

### Company origin

> **Built from the Middle East and Africa.**

### Regional category

> **Pioneering agentic software development in the Middle East and Africa.**

### Global category

> **Building the next generation of software through agentic development.**

The company should not be positioned as MENA-only.

## 11. Portfolio language

Use:

> **Figentra is an agentic development company building AI-native technology platforms and applications from the Middle East and Africa for a global market.**

Avoid:

> "Figentra is an AI coding tool."

> "Figentra OS is the company."

> "Figentra Agentic Development is our company."

> "Academorix is a Figentra OS module."

> "Beauty Loan" as the current product name.

## 12. Product expansion

New products should normally fit one of these categories:

```text
Company capability
        ↓
Technology product
        ↓
Platform capability
        ↓
Application product
```

A new standalone platform should only be introduced when it has a genuinely independent product boundary. A new application should not become a platform service simply because multiple applications may eventually share a technical capability.

## 13. Final portfolio statement

> **Figentra is the company. Figentra Agentic Development is the AI-native software development product. Figentra OS is the Enterprise Operating System. Academorix, Beautilon, and future products are applications built through the Figentra ecosystem.**
