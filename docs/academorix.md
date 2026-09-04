# Academorix

## Product Definition

**Status:** CANONICAL PRODUCT PROFILE
**Company:** Figentra
**Platform:** Figentra OS
**Category:** Sports-academy SaaS

## 1. What is Academorix?

**Academorix is a sports-academy SaaS application built by Figentra.**

It is designed to provide the operating foundation for sports academies and their day-to-day relationships between academies, branches, teams, coaches, athletes, and parents.

Academorix is an application product, not a Figentra OS service.

## 2. Product role

```text
Figentra Agentic Development
          ↓
     builds / evolves
          ↓
      Academorix
          ↓
    runs on / consumes
          ↓
     Figentra OS
```

Academorix owns its sports-academy business domain, workflows, business rules, and business data. Figentra OS provides reusable platform capabilities such as identity, tenancy, authorization, notifications, files, workflow, search, reporting, analytics, and other shared infrastructure.

## 3. V1 product foundation

The documented V1 launch scope establishes a focused sports-academy operating core.

A paying sports-academy tenant can:

1. Create its tenant.
2. Authenticate and obtain an application session.
3. Invite users.
4. Manage coaches, athletes, and parents as applicable to the academy workflow.
5. Create branches.
6. Create teams.
7. View and edit academy data with tenant scoping enforced.

The product should grow from this operational core rather than turning every possible academy feature into a launch dependency.

## 4. Product users

Primary product actors include:

- Academy operators
- Coaches
- Athletes
- Parents
- Administrative staff

Each actor interacts with the product according to the permissions and workflows appropriate to the academy context.

## 5. Product value

Academorix is intended to replace fragmented academy administration with one connected operating experience.

The product direction is to make it easier for an academy to:

- Organize its business structure.
- Manage branches and teams.
- Coordinate people and responsibilities.
- Operate consistently across locations.
- Maintain secure tenant-scoped data.
- Extend its operations as the academy grows.

## 6. Product architecture boundary

Academorix must not duplicate Figentra platform ownership.

```text
Academorix owns
  ├── sports-academy domain model
  ├── academy business rules
  ├── academy workflows
  ├── academy UX
  └── academy business data

Figentra OS owns
  ├── Identity
  ├── Tenant
  ├── IAM
  ├── Monetization
  ├── Usage
  ├── Workflow infrastructure
  ├── Notifications
  ├── Audit
  ├── Files
  ├── Integrations
  ├── Search
  ├── Reporting
  ├── Analytics
  └── Marketing
```

## 7. AI direction

Academorix can consume Figentra's AI capabilities where they create measurable product value.

Potential areas include:

- Academy operational assistance
- Search and knowledge retrieval
- Reporting and insights
- Workflow assistance
- Recommendations
- Communication assistance
- Administrative automation

AI features must remain product-relevant and governed by the same identity, authorization, privacy, and audit boundaries as the rest of the product.

## 8. Multi-tenant model

Academorix is tenant-aware.

An academy's data must be isolated from other academies, with authorization evaluated in the trusted tenant and application context.

Academorix may define its own sports hierarchy beneath the platform tenant context, for example:

```text
Tenant
  └── Academy
      ├── Branch
      │   ├── Team
      │   └── Team
      └── Branch
          └── Team
```

This is an Academorix domain hierarchy, not a universal Figentra hierarchy.

## 9. Positioning

### Category

**Sports Academy Management SaaS**

### Short description

> **The operating platform for modern sports academies.**

### Product statement

> **Academorix helps sports academies manage their people, branches, teams, and operations through a connected digital platform.**

## 10. Relationship to Figentra

Academorix is one of the products through which Figentra demonstrates its platform and agentic-development strategy.

It is not:

- A Figentra OS module
- A Figentra OS service
- A framework package
- A generic demo

It is a real product with its own market, users, business requirements, and product roadmap.

## 11. Future expansion

Potential expansion areas should be evaluated against customer demand and product strategy rather than assumed as architectural commitments.

The platform can support future academy capabilities such as richer scheduling, attendance, communications, payments, performance workflows, reporting, and other sports-operations features without changing the Figentra company/platform boundary.

## 12. Final definition

> **Academorix is Figentra's sports-academy SaaS product: a tenant-aware operating platform for academies, branches, teams, coaches, athletes, parents, and academy operations, built on Figentra OS and developed through Figentra's agentic development approach.**
