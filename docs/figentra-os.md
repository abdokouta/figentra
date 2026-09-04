# Figentra OS

## Company, Product, Platform & Positioning

**Status:** Canonical product overview / Draft for public positioning  
**Product:** **Figentra OS**  
**Company / Brand:** **Figentra**  
**Purpose:** Define what Figentra is, what Figentra OS is, what it provides, who it serves, and how the product should be positioned.

---

## 1. Executive Definition

**Figentra is the company and technology brand. Figentra OS is its flagship enterprise operating platform.**

> **Figentra OS is the operating foundation for modern enterprise software and digital businesses.**

Figentra OS provides the shared technology foundation organizations need to build, operate, integrate, and scale complex digital products without repeatedly rebuilding the same enterprise infrastructure.

It combines platform services, developer foundations, application infrastructure, security, integration, data, workflow, communication, and experience capabilities into one coherent operating platform.

The product is not positioned as a collection of microservices. Microservices are an implementation choice. **Figentra OS is the product: an enterprise operating platform.**

---

## 2. Brand Architecture

The canonical naming model is:

```text
FIGENTRA
│
└── FIGENTRA OS
    │
    ├── Enterprise Platform
    ├── Developer Platform
    ├── Application Platform
    ├── Enterprise Services
    ├── Experience Infrastructure
    └── Ecosystem
```

### Figentra

**Figentra** is the company, technology brand, and ecosystem.

It represents the organization, engineering philosophy, products, technology, and partner ecosystem behind the platform.

### Figentra OS

**Figentra OS** is the primary product.

It is the enterprise operating platform that provides the common foundation on which organizations and applications can build and operate digital businesses.

### Figentra Applications

Applications are specialized products and business solutions built on top of Figentra OS.

They own their business logic and business data while consuming the platform's shared capabilities.

---

## 3. What Problem Does Figentra OS Solve?

Modern enterprise applications repeatedly require the same foundational capabilities:

- Identity and authentication
- Organizations and tenancy
- Authorization
- Commercial access
- Usage metering
- Workflow execution
- Notifications
- Files and media
- Integrations
- Search
- Reporting
- Analytics
- Marketing
- Auditing
- APIs and contracts
- Events and messaging
- Caching and storage
- Security
- Observability
- Web and mobile foundations

Organizations normally assemble these capabilities from many independent products and custom implementations.

That approach creates duplicated engineering, inconsistent security models, fragmented operational behavior, and expensive long-term maintenance.

**Figentra OS provides a common enterprise foundation instead.**

The goal is simple:

> **Build your business, not your infrastructure.**

---

## 4. The Figentra OS Vision

Figentra OS aims to become the common operating layer for organizations building and operating digital businesses.

The long-term vision is that an organization can build multiple applications, products, portals, internal systems, and customer experiences on top of the same trusted foundation.

```text
                         ORGANIZATION
                              │
              ┌───────────────┼───────────────┐
              │               │               │
          Product A        Product B       Product C
              │               │               │
              └───────────────┼───────────────┘
                              │
                         FIGENTRA OS
                              │
       ┌──────────────────────┼──────────────────────┐
       │                      │                      │
    Identity                IAM                  Workflow
       │                      │                      │
     Tenant              Monetization          Notifications
       │                      │                      │
     Search                 Files              Integrations
       │                      │                      │
   Reporting             Analytics                Audit
       │                      │                      │
     Usage                  Security            Observability
```

Applications remain specialized. Figentra OS provides the common operating foundation.

---

## 5. What Does Figentra OS Offer?

Figentra OS is organized into several layers.

### 5.1 Enterprise Platform

Core services that provide durable business and platform capabilities.

### 5.2 Developer Platform

Reusable SDKs, runtime foundations, contracts, tooling, and infrastructure abstractions.

### 5.3 Application Platform

Capabilities that help applications discover, compose, render, publish, and operate experiences.

### 5.4 Experience Infrastructure

Shared UI, web, mobile, dashboard, page composition, schema-driven UI, navigation, state, query, and synchronization foundations.

### 5.5 Ecosystem

Integrations, providers, partner applications, extensions, and customer-built applications.

---

# 6. Enterprise Services

Figentra OS has fourteen canonical enterprise services.

## 6.1 Identity

Identity answers:

> **Who are you?**

Identity owns authentication and identity orchestration, including:

- Principals
- Authentication
- Sessions
- Credentials and credential references
- Identity providers
- Identity links
- Service identities
- Token verification
- Actor/request context
- Tenant identity context
- Impersonation
- Delegation

Identity does **not** own authorization or tenant lifecycle.

---

## 6.2 Tenant

Tenant answers:

> **Which organizations and tenants exist, and what is their lifecycle?**

It owns:

- Tenants
- Organizations
- Memberships
- Domains
- Provisioning
- Tenant settings
- Tenant lifecycle
- Organizational metadata

Figentra OS deliberately avoids imposing one universal business hierarchy on every application.

---

## 6.3 IAM

IAM answers:

> **May this principal perform this action in this context?**

It provides:

- Roles
- Permissions
- Assignments
- Authorization policies
- Resource access evaluation
- Administrative access control
- Service-to-service authorization

Identity authenticates. IAM authorizes.

---

## 6.4 Monetization

Monetization answers:

> **What commercial capabilities does this customer have?**

It provides:

- Plans
- Pricing
- Subscriptions
- Billing
- Invoices
- Payments
- Credits
- Commercial entitlements
- Commercial limits

Entitlements are part of Monetization, not a standalone service.

---

## 6.5 Usage

Usage answers:

> **How much of the platform or product has been consumed?**

It supports:

- Meters
- Usage facts
- Aggregation
- Usage periods
- Quotas
- Billable consumption
- Resource consumption

Usage can feed Monetization, Analytics, Reporting, and operational controls.

---

## 6.6 Workflow

Workflow provides durable business-process execution.

It supports:

- Workflow definitions
- Executions
- Steps
- Timers
- Retries
- Compensation
- Signals
- Human tasks
- Approvals
- Escalations
- Long-running processes

Workflow provides execution infrastructure. It does not own the business data of other services.

---

## 6.7 Notifications

Notifications answers:

> **How should an organization communicate something to a recipient?**

Supported delivery channels can include:

- Email
- SMS
- Push notifications
- In-app notifications
- Slack
- Webhooks
- Additional providers through adapters

Business services request notifications through contracts rather than importing provider SDKs directly.

---

## 6.8 Audit

Audit provides durable accountability records.

It captures information such as:

- Who performed an action
- What happened
- Which resource was affected
- When it happened
- Under which tenant
- Under which authorization context
- Relevant request/correlation identifiers

Audit is intentionally different from logs, traces, analytics, tracking, and usage metering.

---

## 6.9 Files

Files provides a unified file and media foundation.

It supports:

- File metadata
- Upload sessions
- Object references
- Versions
- MIME validation
- Checksums
- Security scanning
- Signed URLs
- Lifecycle management
- Retention
- Quotas
- Media processing orchestration

---

## 6.10 Integrations

Integrations provides a controlled boundary between Figentra OS and external systems.

It supports:

- External connections
- OAuth state
- Credential references
- Webhooks
- Mappings
- Imports
- Exports
- Reconciliation
- Provider adapters
- Partner integrations

External provider SDKs remain behind explicit adapters.

---

## 6.11 Search

Search provides enterprise search infrastructure.

It supports:

- Full-text search
- Filtering
- Facets
- Suggestions
- Indexing
- Bulk indexing
- Re-indexing
- Versioned indexes
- Tenant-aware search
- Permission-aware search

Search documents are projections, not business truth.

Search providers such as Meilisearch, Elasticsearch, and Algolia are implementation adapters rather than architectural boundaries.

---

## 6.12 Reporting

Reporting provides structured operational and custom reporting.

It supports:

- Registered datasets
- Fields
- Dimensions
- Metrics
- Filters
- Grouping
- Aggregations
- Allow-listed calculated fields
- Sorting
- Report definitions
- Report revisions
- Exports
- Scheduled reports
- Dashboard integration

Custom reporting uses typed definitions and controlled query capabilities. Arbitrary SQL is not exposed to clients.

---

## 6.13 Analytics

Analytics transforms operational facts and behavioral signals into analytical information.

It supports:

- Facts
- Dimensions
- Metrics
- Aggregation
- Attribution
- Analytical queries
- Business intelligence
- Historical analysis

Analytics interprets information; it does not replace operational services.

---

## 6.14 Marketing

Marketing provides customer engagement and activation capabilities.

It supports:

- Audiences
- Segments
- Campaigns
- Journeys
- Eligibility
- Suppression
- Activation
- Conversion measurement

Marketing decides **who to engage, why, and when**. Notifications handles **delivery**.

---

# 7. Developer Platform

Figentra OS is also a developer platform.

It provides reusable foundations for building consistent applications across runtimes.

Examples include:

- HTTP clients and transport
- OpenAPI contracts
- Cross-service contracts
- Events
- Errors
- Configuration
- Logging
- Observability
- Storage
- Cache
- Database and ORM foundations
- Queues
- NATS messaging
- Realtime communication
- Synchronization
- Query management
- State management
- Pagination
- Media
- Security
- Testing
- Routing
- Navigation
- Internationalization
- Theming
- UI foundations

The developer platform exists to make the way applications are built as consistent as the services they consume.

---

# 8. Runtime Platform

Figentra OS supports multiple execution environments.

## Server

NestJS is the canonical Node.js framework for substantial enterprise services.

A service can expose multiple execution roles from the same source tree:

```text
src/main.ts       API
src/consumer.ts   durable event consumer
src/worker.ts     durable job worker
src/scheduler.ts  scheduled execution
```

This prevents business logic from being duplicated across separate service and worker implementations.

## Edge

Specialized Cloudflare Workers are used where an independent edge/serverless boundary is justified.

Examples include:

- API Gateway
- Application Registry
- Infrastructure Orchestrator

These are intentionally independent workloads and are not treated as copies of NestJS services.

## Client

Figentra OS supports:

- Web
- React
- React Native
- Desktop
- Browser capabilities
- Mobile/offline capabilities

---

# 9. Application Platform

Figentra OS provides infrastructure for applications to discover and compose capabilities.

## Application Registry

The Application Registry maintains application metadata and discoverability, including:

- Applications
- Application versions
- Environments
- Deployments
- Capabilities
- Routes
- Resources
- Events
- Permissions
- Branding metadata
- Manifest projections

The Registry is an independent Cloudflare Worker workload.

Applications remain authoritative for their own business logic and manifests. The Registry stores and indexes controlled metadata projections.

The Registry does not own application business data.

---

# 10. Experience Platform

Figentra OS provides shared infrastructure for building digital experiences.

This includes:

- UI foundations
- Navigation
- Query and state management
- Responsive layouts
- Dashboards
- Page composition
- Schema-driven UI
- Page Builder
- React
- React Native
- Mobile synchronization

## Schema-Driven UI

Figentra OS supports controlled schema-driven UI where appropriate.

The backend can describe approved UI structures using versioned schemas containing known components, properties, layouts, actions, data bindings, permissions, and capabilities.

The client renders the schema using approved Figentra components.

The system does not transport or execute arbitrary JavaScript, SQL, component code, or unrestricted executable payloads.

## Page Builder

Page Builder builds on the schema-driven UI foundation.

It can support:

- Dashboards
- Portals
- Landing pages
- Operational screens
- Customer experiences
- Internal applications

The Page Builder owns the editing/document model. The owning application or service owns persistence, authorization, business context, revisions, and publication.

---

# 11. Dashboard

Dashboard is a reusable capability rather than a standalone enterprise service.

It can combine:

- Metrics
- Charts
- Tables
- Reports
- Search results
- Analytics
- Operational data
- Widgets
- Filters
- Actions

A dashboard is a business information surface, not merely a charting library.

---

# 12. AI Platform

AI is a first-class capability of the Figentra ecosystem.

AI can be applied to:

- Search
- Analytics
- Reporting
- Workflow automation
- Classification
- Extraction
- Recommendations
- Content generation
- Enterprise knowledge
- Intelligent assistants
- Customer engagement

The strategy is to make AI composable across the platform rather than limiting it to one isolated assistant product.

---

# 13. Security

Security is foundational to Figentra OS.

The platform is designed around:

- Strong identity
- Explicit authorization
- Tenant isolation
- Encryption
- Secure secret handling
- Signed references
- Input validation
- Rate limiting
- Least privilege
- Service-to-service authentication
- Security-aware observability
- Durable auditing

The platform separates:

```text
Identity      → authentication
Tenant        → organizational context
Scope         → selected client/resource context
IAM           → authorization
Monetization  → commercial availability
Security      → technical security primitives
```

---

# 14. Observability

Figentra OS deliberately separates different types of operational and business signals.

```text
Logger         → logs
Observability  → traces, metrics, propagation
Health         → application dependency health/readiness
Tracking       → behavioral collection
Analytics      → analytical interpretation
Audit          → durable accountability
Usage          → metering
Events         → business facts
```

This separation prevents a generic tracking system from becoming an overloaded source of unrelated data.

---

# 15. Communication Architecture

Figentra OS uses the right communication mechanism for the job.

## Synchronous

HTTPS + OpenAPI is the default synchronous contract.

Used for:

- Queries
- Immediate commands
- Administrative APIs
- External integrations

## Asynchronous

NATS + JetStream is the canonical durable asynchronous transport.

Used for:

- Business events
- Durable background processing
- Cross-service communication
- Workflow signals
- Asynchronous side effects

## Transactional Outbox

Business events are persisted transactionally with business state before publication.

```text
Business transaction
       ↓
Transactional outbox
       ↓
NATS JetStream
       ↓
Idempotent consumer
       ↓
Side effect
       ↓
Result / event
```

Consumers must be idempotent and define explicit retry, timeout, dead-letter, and reconciliation behavior.

---

# 16. Storage & Data Philosophy

Figentra OS separates storage concerns clearly.

### Database

Owns:

- Connections
- Transactions
- Migrations
- Health
- Database routing

### ORM

Owns:

- Metadata
- Repositories
- Unit of work
- Identity map
- Locking
- Persistence mapping
- Tenant filters where applicable

### Cache

Provides disposable acceleration and coordination.

Cache is never treated as authoritative persistence.

### Storage

Provides abstractions for:

- Key-value storage
- Secure storage
- File systems
- Object storage

---

# 17. Multi-Tenancy

Figentra OS is designed for enterprise multi-tenancy without forcing every application into one universal hierarchy.

Valid application structures may include:

```text
Tenant → Organization → Team → Resource

Tenant → Organization → Branch → Warehouse → Channel

Tenant → Region → Venue → Building → Floor → Zone

Tenant → Project → Site → Asset
```

Figentra provides trusted context primitives while applications retain ownership of their domain-specific resource hierarchy.

Tenant context is not authorization. IAM evaluates access within the trusted context.

---

# 18. Integration Philosophy

Figentra OS is designed to coexist with existing enterprise systems rather than requiring organizations to replace everything.

It can integrate with:

- Identity providers
- Payment systems
- ERP systems
- CRM systems
- Communication providers
- Search engines
- Cloud platforms
- Government platforms
- Partner APIs
- Customer-owned systems

Provider-specific technology is isolated behind adapters.

This allows Figentra OS to maintain stable contracts while infrastructure providers evolve.

---

# 19. Deployment Models

Figentra OS is designed to support multiple operating models.

## SaaS

Figentra operates the platform for customers.

## Private Cloud

Customers operate Figentra OS inside their controlled cloud environment.

## On-Premises

Organizations deploy Figentra OS within their own infrastructure where required.

## Hybrid

Selected capabilities can operate in customer-controlled infrastructure while other capabilities operate in the cloud.

The architecture avoids unnecessary coupling to a single deployment model.

---

# 20. Who Is Figentra OS For?

## Enterprises

Organizations that need:

- Enterprise security
- Multi-tenancy
- Complex workflows
- Integration
- Governance
- Reporting
- Analytics
- Operational scale

## SaaS Companies

Companies that want to build differentiated products without implementing the entire enterprise foundation themselves.

## Digital Product Teams

Teams building:

- B2B platforms
- B2C products
- Marketplaces
- Portals
- Enterprise applications
- Operational systems
- Digital experiences

## Developers

Engineering teams that want reusable, standardized infrastructure and consistent development patterns.

## Technology Partners

Organizations that need a structured platform through which their systems, products, and integrations can participate in a larger enterprise ecosystem.

---

# 21. What Makes Figentra OS Different?

Figentra OS is positioned between raw infrastructure and specialized business applications.

```text
Cloud / Infrastructure
        ↓
   FIGENTRA OS
        ↓
Business Applications
        ↓
Customer / Employee Experiences
```

Infrastructure providers solve compute, networking, storage, and basic managed services.

Business applications solve specific domain problems.

**Figentra OS connects these layers by providing the enterprise operating capabilities required between them.**

The differentiator is not simply the number of services. It is the consistency of the platform:

- One identity model
- One authorization model
- One tenant/context model
- Shared contracts
- Shared observability standards
- Shared event model
- Shared security principles
- Shared developer tooling
- Shared experience foundations
- Consistent deployment and operational patterns

---

# 22. What Figentra OS Is Not

Figentra OS is not intended to become:

- A generic ERP
- A generic CRM
- A payment processor
- A replacement for a cloud provider
- A database replacement
- A standalone authentication-only product
- A generic analytics product
- A generic CMS
- A generic workflow SaaS product
- An arbitrary code execution platform
- A collection of unrelated microservices

Figentra OS provides the operating foundation from which specialized applications and products can be built.

---

# 23. Figentra OS Product Model

The product model is:

```text
FIGENTRA
│
├── Figentra OS
│   │
│   ├── Enterprise Platform
│   ├── Developer Platform
│   ├── Application Platform
│   └── Experience Platform
│
├── Figentra Applications
│   ├── Industry Applications
│   ├── Enterprise Applications
│   └── Specialized Business Products
│
└── Figentra Ecosystem
    ├── Integrations
    ├── Providers
    ├── Extensions
    ├── Partners
    └── Customer Applications
```

This distinction is important:

**Figentra OS is the platform product.**

**Figentra Applications are products built on the platform.**

**Figentra is the company and ecosystem behind both.**

---

# 24. The Figentra OS Flywheel

The platform is designed to create a compounding ecosystem effect.

```text
              Figentra OS
                   ↓
             Applications
                   ↓
              Customers
                   ↓
                 Usage
                   ↓
             Integrations
                   ↓
               Ecosystem
                   ↓
            More Applications
                   ↓
            More Platform Value
                   └──────────────→
```

As more applications use the same foundation, the platform becomes more valuable through shared capabilities, integrations, operational knowledge, and developer ecosystem effects.

---

# 25. The Figentra OS Promise

Figentra OS exists to make enterprise software development fundamentally simpler.

Instead of every organization building:

```text
Authentication
Authorization
Tenancy
Billing
Usage
Workflow
Notifications
Files
Search
Reporting
Analytics
Audit
Integrations
Observability
```

from scratch, they can consume these capabilities from a common enterprise operating platform.

The result should be:

- Faster product development
- More consistent security
- Lower infrastructure duplication
- Better operational visibility
- Easier integration
- More reusable engineering
- More predictable application architecture
- Faster time from idea to production

---

# 26. Canonical Messaging

These statements are approved positioning candidates for Figentra OS.

## Primary

> **Figentra OS is the operating foundation for modern enterprise software and digital businesses.**

## Business

> **Figentra OS helps organizations build and operate complex digital businesses without rebuilding their technology foundation from scratch.**

## Developer

> **Build your business, not your infrastructure.**

## Enterprise

> **A unified enterprise operating platform for identity, organizations, authorization, workflows, integrations, data, communication, analytics, and digital experiences.**

## Short

> **Figentra OS — The Enterprise Operating System.**

---

# 27. One-Sentence Company Description

> **Figentra is a technology company building Figentra OS, an enterprise operating platform that provides the shared infrastructure and capabilities organizations need to build, operate, and scale modern digital businesses.**

---

# 28. One-Sentence Product Description

> **Figentra OS is an enterprise operating platform that provides identity, tenancy, authorization, monetization, usage, workflow, notifications, files, integrations, search, reporting, analytics, marketing, audit, and developer foundations through one coherent platform.**

---

# 29. Technical Product Definition

For technical audiences:

> **Figentra OS is a modular enterprise platform composed of canonical domain services, reusable cross-runtime packages, shared contracts, application infrastructure, edge workloads, and developer foundations, designed to provide a consistent operating layer for independently owned business applications.**

The implementation architecture is governed by the repository's final architecture standard.

```text
Service     = business/domain ownership + durable business state
Package     = reusable technical/cross-runtime capability
Application = product composition and experience
Worker role = execution role of the owning service
Edge Worker = independent Cloudflare workload
Contracts   = cross-service protocol boundary
```

---

# 30. Product Principles

Figentra OS follows these principles.

### Enterprise by default

Security, tenancy, authorization, auditing, reliability, and observability are foundational.

### API-first

Capabilities are accessible through explicit, versioned contracts.

### Modular

Capabilities have clear ownership and can evolve independently without creating unnecessary microservice boundaries.

### Application-owned business logic

Figentra OS provides the foundation. Applications own their specialized business rules and business data.

### Cloud and deployment flexibility

The platform is designed for SaaS, private cloud, on-premises, and hybrid operation.

### Provider independence

External technology providers are adapters behind stable Figentra contracts.

### Secure by design

Authentication, authorization, tenancy, secrets, encryption, validation, and auditing are architectural concerns.

### Observable by default

Production behavior must be traceable through logs, metrics, traces, health signals, and durable audit records where applicable.

### AI-ready

AI capabilities can be composed across the platform instead of being isolated from the rest of the system.

### Developer-first

Developers should compose enterprise capabilities rather than repeatedly recreate them.

---

# 31. Relationship to the Architecture

This document defines **product and market positioning**.

It does not replace the implementation architecture.

The architecture source of truth remains:

- `/.kiro/FINAL-ARCHITECTURE-STANDARD.md`
- `/.kiro/specs/figentra-platform/ARCHITECTURE.md`
- Canonical package plans under `/.kiro/plans/packages/`
- Canonical service plans under `/.kiro/plans/services/`

Product language must not be interpreted as permission to create additional services, packages, Workers, or ownership boundaries.

---

# 32. Final Definition

**Figentra** is the company, brand, technology, and ecosystem.

**Figentra OS** is the flagship product: an enterprise operating platform.

**Figentra Applications** are specialized products and business applications built on Figentra OS.

The central idea is:

```text
                    FIGENTRA
                       │
                    FIGENTRA OS
                       │
        ┌──────────────┼──────────────┐
        │              │              │
    Platform       Developer      Experience
   Capabilities     Platform       Platform
        │              │              │
        └──────────────┼──────────────┘
                       │
              Business Applications
                       │
                  Digital Business
```

> **Figentra OS is the operating system for the digital enterprise.**

Its purpose is not to replace every business application.

Its purpose is to provide the **trusted operating foundation on which those applications can be built, connected, operated, and scaled.**
