# Beautilon

## Product Definition

**Status:** CANONICAL PRODUCT PROFILE / INITIAL
**Company:** Figentra
**Category:** Application product
**Canonical name:** Beautilon
**Legacy name:** Beauty Loan

## 1. Naming decision

**Beautilon is the current and canonical product name.**

`Beauty Loan` is a legacy name and must not be used as the current product name in new documentation, product interfaces, repositories, package names, marketing material, or architecture decisions.

## 2. Product role

Beautilon is an application product in the Figentra portfolio.

```text
Figentra
   ↓
Figentra Agentic Development
   ↓
Beautilon
   ↓
Figentra OS
```

The application owns its business domain, business rules, customer experience, and business data. Figentra OS provides shared enterprise capabilities.

## 3. Position in the portfolio

Beautilon is positioned alongside Academorix as a Figentra-built application, while Figentra Agentic Development and Figentra OS remain the company's technology products.

```text
Technology
├── Figentra Agentic Development
└── Figentra OS

Applications
├── Academorix
└── Beautilon
```

## 4. Current source-of-truth status

The available product architecture material establishes the canonical name and portfolio role, but does not yet provide enough authoritative business requirements to define Beautilon's domain model, ICP, pricing, feature catalogue, or detailed product promise without inventing information.

Those details should be added through a dedicated Beautilon product discovery/specification process.

## 5. Product-definition gate

Before detailed implementation or public positioning is finalized, define:

- Product problem
- Target market
- ICP
- Buyer and user personas
- Core jobs-to-be-done
- Value proposition
- Product scope
- Business model
- Pricing
- Regulatory requirements
- Domain model
- Core workflows
- Product metrics
- AI opportunities
- Integration requirements
- Launch criteria

## 6. Figentra relationship

Beautilon should use Figentra platform capabilities where appropriate rather than recreating shared infrastructure.

Application-owned concerns remain application-owned; platform-owned concerns remain in Figentra OS.

## 7. Final definition

> **Beautilon is a Figentra application product. Its canonical product name is Beautilon; Beauty Loan is a legacy name. Detailed product positioning and domain scope remain subject to dedicated product discovery rather than being inferred from the legacy name.**
