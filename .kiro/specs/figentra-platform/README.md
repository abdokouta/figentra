# Figentra Platform — Complete Architecture & Engineering Contract

> **Status:** Normative repository-level architecture baseline
>
> **Audience:** Engineers, architects, platform operators, security engineers, QA, DevOps, and AI coding agents
>
> **Purpose:** One document describing what Figentra is, what every major component owns, how data and identity move through the platform, how services communicate, what each service must contain, and which boundaries must never be crossed.
>
> **Current authentication decision:** **Supabase Auth is the day-one authentication provider.** Older architecture material that names Clerk is historical/reference material and is superseded by this decision.
>
> **Environment names:** `development`, `staging`, `production`.

---

## 1. What Figentra Is

Figentra is a **multi-tenant, multi-application enterprise SaaS platform and control plane**.

It provides a common platform for identity, tenancy, authorization, application discovery, monetization, entitlements, integrations, audit, notifications, files, reporting, search, workflows, observability, and infrastructure orchestration while allowing independent product applications to own their business domains and databases.

The central architectural questions are:

1. **Who is authenticated?** → Identity / Supabase Auth.
2. **Which platform principal is acting?** → Principal model in Identity.
3. **Which tenant/business context is active?** → Tenant + Scope.
4. **Can the principal perform this action?** → IAM + Policy + Scope.
5. **Does the tenant have the commercial capability?** → Monetization / Entitlements.
6. **Is the application/release enabled?** → Application Registry + Feature Flags.
7. **What does the business operation mean?** → Owning application/service.
8. **What happened and who caused it?** → Events + Audit.
9. **How does work survive process/network failure?** → Outbox + durable async transport + workflows.

Figentra is therefore **not** a monolithic backend and is **not** a collection of unrelated microservices. It is a bounded-context platform with explicit ownership and protocol boundaries.

---

## 2. Core Architecture

```text
                                      FIGENTRA
                                          │
                 ┌────────────────────────┼────────────────────────┐
                 │                        │                        │
             IDENTITY               CONTROL PLANE              EDGE
                 │                        │                        │
          Supabase Auth          ┌────────┼─────────┐       Cloudflare
                 │               │        │         │       DNS/WAF/SSL
                 ▼               ▼        ▼         ▼            │
             Identity         Tenant    IAM   Monetization       │
                 │               │        │         │             │
                 ▼               └────────┼─────────┘             │
             Principal                    │                       │
                 │                 Entitlements                  │
                 │                        │                       │
                 └───────────────┬────────┘                       │
                                 ▼                                ▼
                         Application Registry                API Gateway
                                 │                          Hono Worker
                  ┌──────────────┼──────────────┐               │
                  ▼              ▼              ▼               │
              Manifest        Runtime       Capabilities         │
                  │                                             │
                  └─────────────────────────────────────────────┤
                                                                │
                                      ┌─────────────────────────┼──────────────┐
                                      ▼                         ▼              ▼
                                   Product                  Platform       Integrations
                                 Applications               Services
                                      │                         │
                              ┌───────┼───────┐          ┌──────┼──────┐
                              ▼       ▼       ▼          ▼      ▼      ▼
                            CRM   Commerce   POS       Audit  Files  Notifications
                              │       │       │
                              └───────┼───────┘
                                      ▼
                              Application DBs
                                      │
                              PostgreSQL / Supabase
                                      │
                         ┌────────────┼────────────┐
                         ▼            ▼            ▼
                      Search      Reporting      Usage
                         │            │            │
                         └────────────┼────────────┘
                                      ▼
                               Async Transport
                                      │
                         ┌────────────┴────────────┐
                         ▼                         ▼
                  Cloudflare Queues         Kafka when justified
```

---

# 3. Architecture Principles

## 3.1 One authoritative owner per domain

Every important business concept has one authoritative owner.

A service may **consume** another service's data, but it does not become the owner merely because it caches or projects it.

## 3.2 Authentication is not authorization

Supabase answers authentication.

Figentra Identity normalizes the authenticated identity.

IAM answers authorization.

Applications enforce domain-specific business rules.

## 3.3 Principal is the authorization subject

Figentra does not create a chain such as:

```text
Person → User → Actor → Principal
```

The canonical authorization subject is:

```text
Identity → Principal
```

Principal types may include:

```text
human
service
integration
system
agent
```

These are principal classifications, not automatically separate services.

## 3.4 Tenant and Scope are context, not permission

Tenant establishes the business boundary.

Scope establishes location/context within that boundary.

IAM establishes authority.

```text
Principal
   + Tenant
   + Scope
   + Action
   + Resource
   + Context
        ↓
       IAM
```

## 3.5 Permission and entitlement are different

```text
Permission   = may this principal perform the operation?
Entitlement  = does this tenant have the capability commercially?
Feature flag = is this release/feature operationally enabled?
```

All applicable conditions must pass.

## 3.6 Services own their data

No service directly writes another service's database.

Cross-service information is obtained through:

- authenticated HTTP APIs
- typed SDKs
- events
- read models
- projections
- explicit replication contracts

## 3.7 Events are business facts

Do not publish an event for every HTTP request or database operation.

Publish durable events for meaningful state transitions and facts that other bounded contexts need.

## 3.8 Outbox is the reliability boundary

When a database transaction changes durable state and an event must be emitted, the state change and outbox record are committed atomically.

```text
DB transaction
 ├── domain state
 └── outbox event
          ↓
       relay
          ↓
       transport
          ↓
       consumers
```

## 3.9 HTTP is the default synchronous contract

Synchronous service calls use:

```text
HTTPS + OpenAPI + typed SDK
```

Do not make NestJS RPC the universal communication protocol.

## 3.10 Workers are edge/control-plane workloads

Cloudflare Workers + Hono are appropriate for:

- API Gateway
- Application Registry
- lightweight edge APIs
- webhooks where the workload fits
- orchestration control endpoints

Heavy stateful workloads belong in NestJS containers or another justified runtime.

---

# 4. Repository Structure

The repository is organized into explicit deployment and library boundaries:

```text
figentra/
├── apps/
│   ├── portal/
│   ├── landing-page/
│   └── family/
│
├── workers/
│   ├── gateway/
│   ├── registry/
│   └── infrastructure-orchestrator/
│
├── services/
│   ├── identity/
│   ├── iam/
│   ├── tenant/
│   ├── scope/
│   ├── policy/
│   ├── approval/
│   ├── monetization/
│   ├── entitlements/
│   ├── usage/
│   ├── notifications/
│   ├── audit/
│   ├── integrations/
│   ├── files/
│   ├── reporting/
│   ├── search/
│   └── workflow/
│
├── packages/
│   ├── contracts/
│   ├── events/
│   ├── identity/
│   ├── iam/
│   ├── messaging/
│   ├── observability/
│   ├── outbox/
│   ├── registry/
│   ├── sdk/
│   ├── security/
│   ├── tsup-config/
│   ├── typescript-config/
│   ├── prettier-config/
│   └── oxlint-config/
│
├── infrastructure/
│   ├── terraform/
│   ├── docker/
│   ├── scripts/
│   └── tests/
│
├── docs/
│   ├── architecture/
│   ├── adr/
│   ├── contracts/
│   ├── events/
│   ├── standards/
│   ├── security/
│   ├── rules/
│   └── runbooks/
│
├── scripts/
├── tests/
└── .kiro/
```

`README.md` in this directory is the repository-level consolidated contract. More detailed documents may specialize individual sections, but an exception must not silently contradict this file; architectural conflicts require an ADR.

---

# 5. Deployment Planes

## 5.1 Edge plane

```text
Cloudflare DNS
Cloudflare WAF
Cloudflare SSL for SaaS
Cloudflare Workers
Hono
Service Bindings
Rate limiting
```

## 5.2 Control plane

```text
Identity
IAM
Tenant
Scope
Policy
Approval
Monetization
Entitlements
Registry
Workflow
```

## 5.3 Platform capability plane

```text
Audit
Notifications
Files
Integrations
Reporting
Search
Usage
Observability
```

## 5.4 Application plane

```text
CRM
Commerce
POS
Analytics
future applications
```

Applications own their business domains.

---

# 6. Identity

## 6.1 Purpose

Identity is the authentication contract and canonical identity normalization boundary.

It answers:

> Which authenticated identity has been established?

## 6.2 Authentication provider

**Supabase Auth is the day-one provider.**

Figentra does not reinvent:

- password authentication
- password hashing
- MFA cryptography
- passkeys
- OIDC protocol implementation
- SAML protocol implementation
- session cryptography
- password recovery

Supabase-specific behavior is isolated behind an Identity Provider Adapter.

```text
Supabase Auth
     ↓
Identity Provider Adapter
     ↓
Figentra Identity
     ↓
Principal
```

## 6.3 Identity owns

Conceptual entities:

```text
Identity
IdentityIdentifier
IdentityProfile
IdentityProviderLink
IdentitySecurity
IdentityLifecycle
```

Provider mappings include:

```text
provider
provider_subject
provider_metadata
linked_at
unlinked_at
```

The Supabase Auth user UUID is **not** the public Figentra identity contract.

## 6.4 Identity must not own

- tenant business configuration
- application business data
- billing
- subscriptions
- entitlements
- IAM policy graph
- application permissions

## 6.5 Account linking

Multiple provider subjects may map to one canonical identity.

Never merge accounts solely because email addresses match.

Account linking requires authenticated proof and explicit linking semantics.

## 6.6 SSO / SCIM

Supabase is the protocol/provider boundary where its capabilities are used.

Figentra consumes normalized lifecycle events.

SCIM changes identity/principal lifecycle but does not bypass IAM.

## 6.7 Identity lifecycle

```text
created
active
restricted
disabled
deleted/anonymized
```

Identity lifecycle is independent from:

- principal lifecycle
- tenant membership
- scope membership
- entitlement state
- application access

## 6.8 Identity events

Examples:

```text
identity.created.v1
identity.updated.v1
identity.disabled.v1
identity.deleted.v1
identity.provider.linked.v1
identity.provider.unlinked.v1
```

---

# 7. Principal and Credentials

## 7.1 Principal

Principal is the single authorization subject.

```text
Principal
├── id
├── type
├── status
├── identity_id (human principals where applicable)
├── display_name
├── metadata
└── lifecycle timestamps
```

## 7.2 Principal types

```text
human
service
integration
system
agent
```

## 7.3 Service accounts

A service principal can:

- authenticate
- own credentials
- receive IAM assignments
- be scoped
- expire
- be disabled
- be audited

## 7.4 Integration principals

External systems need attributable identities.

Example:

```text
Tenant
 └── Shopify Integration
      └── Integration Principal
           ├── OAuth connection
           ├── scopes
           └── credentials
```

Audit should be able to say:

```text
Order updated by Shopify integration
```

rather than merely:

```text
Order updated by system
```

## 7.5 Agent principals

AI agents use normal principals and IAM controls.

Agents receive no implicit authority.

## 7.6 Credential entities

```text
Credential
OAuthClient
ApiKey
Certificate
PrivateKeyReference
WorkloadIdentity
```

Credentials are authentication material, not authorization records.

## 7.7 Credential lifecycle

```text
issued
  ↓
active
  ↓
rotated / expired / revoked
```

Requirements:

- plaintext secrets never stored in ordinary rows
- secrets displayed once where appropriate
- hashes stored for hashable secrets
- private keys stored encrypted/in secret management
- expiration
- revocation
- rotation
- last-used metadata
- audit trail

---

# 8. Service-to-Service Authentication

Every service-to-service request is authenticated.

Never use one universal static secret.

Preferred model:

```text
Service Identity
      +
Short-lived Credential
      +
Audience
      +
Scopes
      +
IAM authorization
```

## 8.1 M2M OAuth

Use OAuth 2.0 Client Credentials where the environment/provider supports it.

```text
Service A
   ↓ client credentials
Identity/Security
   ↓
short-lived token
   ↓
Service B
   ↓
JWT verification
   ↓
IAM
```

## 8.2 JWT claims

Minimum useful claims:

```text
iss
sub
aud
iat
exp
jti
azp
scope
```

Do not put the complete permission graph in JWTs.

## 8.3 Token exchange

Use token exchange when a caller needs:

- audience-specific tokens
- service chains
- delegated operations
- on-behalf-of semantics
- agent execution

## 8.4 Delegation

Delegation transfers bounded authority.

Constraints may include:

```text
actions
resources
scope
time
conditions
approval
```

Delegation cannot silently expand privileges.

## 8.5 Impersonation

Privileged impersonation preserves:

```text
actual_principal
effective_principal
```

It must be explicit, time-bounded where possible, authorized and fully audited.

---

# 9. Tenant Service

Tenant is the customer/business isolation boundary.

## 9.1 Tenant owns

```text
Tenant
TenantConfiguration
TenantRegion
TenantResidency
TenantDomain
DomainVerification
TenantApplicationBinding
TenantLifecycle
TenantProvisioning
```

## 9.2 Tenant lifecycle

```text
provisioning
active
suspended
disabled
deleted
```

## 9.3 Tenant configuration

Potential fields:

```text
name
status
region
data_residency
timezone
currency
locale
metadata
retention_policy
configuration
```

## 9.4 Tenant-domain relation

Initially Tenant owns domains.

```text
Tenant
 └── Domain
      ├── hostname
      ├── type
      ├── verification_status
      ├── certificate_status
      ├── routing_status
      ├── application_id
      └── environment
```

Domain lifecycle:

```text
pending
verification_required
verified
certificate_pending
active
degraded
suspended
disabled
deleted
```

## 9.5 Host resolution

```text
hostname
 ↓
domain
 ↓
tenant
 ↓
application
 ↓
environment
 ↓
origin
```

Cloudflare SSL for SaaS / custom-hostname capabilities are used rather than implementing a certificate authority.

## 9.6 Tenant provisioning

Provisioning is a durable workflow, not one giant cross-service transaction.

```text
Create Tenant
 ├── Tenant record
 ├── Identity mapping
 ├── Default IAM roles
 ├── Default configuration
 ├── Billing account
 ├── Default entitlements
 ├── Application access
 └── Welcome notification
```

---

# 10. Scope Service

Scope answers:

> In which business/resource context is this principal operating?

Scope is deliberately dynamic.

## 10.1 Scope entities

```text
ScopeType
ScopeNode
ScopeRelation
ScopeMembership
ScopeContext
```

## 10.2 Supported shapes

Examples:

```text
Tenant
 └── Organization
      └── Team
```

```text
Tenant
 └── Organization
      └── Branch
           └── Warehouse
```

```text
Tenant
 └── Region
      └── Venue
           └── Building
                └── Floor
                     └── Zone
```

## 10.3 Scope capabilities

- dynamic types
- dynamic relations
- parent/child relationships
- graph relationships where required
- membership
- inheritance
- traversal
- authorization context
- resource association
- lifecycle
- caching
- versioning

## 10.4 Critical rule

Scope describes **where/context**.

IAM describes **authority**.

Scope cannot grant permission by itself.

---

# 11. IAM Service

IAM is the authoritative authorization engine.

```text
authorize(
  principal,
  action,
  resource,
  tenant,
  scope,
  context
)
```

## 11.1 IAM entities

```text
Permission
Role
RolePermission
PrincipalRoleAssignment
Grant
PolicyBinding
Delegation
AuthorizationDecision
```

## 11.2 Permission

Examples:

```text
commerce.products.read
commerce.products.create
commerce.products.update
commerce.products.delete
commerce.orders.refund
iam.roles.assign
```

Do not encode scope IDs in permission names.

## 11.3 Role

A role is a permission bundle.

```text
Role
 └── RolePermission[]
```

Roles are not identities.

## 11.4 Assignment

```text
Principal
   ↓
RoleAssignment
   ↓
Tenant / Scope / Application context
```

## 11.5 Direct grants

Direct grants are supported only where justified and must remain controlled to prevent permission sprawl.

## 11.6 Authorization decision

Possible decisions:

```text
allow
deny
require_approval
```

A decision may include obligations and explainability for trusted administrative tooling.

## 11.7 Resource authorization

Prefer:

```text
authorize(
  principal,
  "commerce.orders.refund",
  order_123,
  context
)
```

over a global permission-only check.

## 11.8 Batch authorization

Required for high-volume UI and API use cases:

```text
batchAuthorize([...])
```

This avoids N+1 authorization calls.

## 11.9 Explainability

Trusted administrative interfaces may receive:

```text
decision
matched role
grant
policy
scope
obligations
```

Do not expose sensitive policy internals to untrusted clients.

---

# 12. Policy Service

Policy evaluates contextual conditions beyond static role/permission assignment.

Inputs can include:

```text
principal
principal attributes
action
resource
resource attributes
tenant
scope
time
risk
amount
ownership
environment
```

## 12.1 Requirements

- versioning
- deterministic evaluation
- tests
- explainability
- simulation
- safe deployment
- rollback
- caching compatibility
- least privilege

## 12.2 Policy engine

Candidate technologies may include:

```text
Cedar
OPA/Rego
CEL
Zanzibar-style relationship authorization
```

The selected engine must be justified by dynamic scope, conditions, lifecycle, performance and explainability.

Policy must not become application business logic.

---

# 13. Approval Service

Approval is distinct from permission.

```text
Permission
 ↓
Policy
 ↓
Approval required
 ↓
Approval
 ↓
Execution
```

## 13.1 Entities

```text
ApprovalRequest
ApprovalStep
Approver
ApprovalDecision
ApprovalQuorum
ApprovalDelegation
ApprovalEscalation
ApprovalComment
```

## 13.2 Requirements

- durable state
- idempotency
- expiry
- rejection
- quorum
- escalation
- delegation
- reason/comments
- audit integration

---

# 14. Monetization Service

Monetization owns commercial state.

## 14.1 Entities

```text
BillingAccount
Customer
Product
Plan
Price
Subscription
SubscriptionItem
Invoice
Payment
Credit
Tax
Entitlement
UsageRecord
Meter
Quota
```

## 14.2 Relationship

```text
Product
  ↓
Plan
  ↓
Price
  ↓
Subscription
  ↓
Entitlement
  ↓
Usage / Quota
  ↓
Billing / Invoice / Payment
```

## 14.3 Provider adapters

Initial provider boundary:

```text
Monetization
 ├── StripeProvider
 └── PaddleProvider
```

Provider objects never become the canonical Figentra domain model.

## 14.4 Webhooks

Provider webhooks must be:

- signature verified
- idempotent
- persisted appropriately before processing
- retryable
- audited where appropriate

Use:

```text
idempotency_key
provider_event_id
event_id
```

---

# 15. Entitlements

Entitlements answer:

> Does this tenant's commercial relationship include this capability?

Examples:

```text
crm.ai = true
crm.max_users = 500
commerce.max_products = 100000
pos.terminals = 50
analytics.advanced = true
api.requests_per_minute = 10000
```

Supported value semantics may include:

```text
boolean
integer
decimal
string
quota
limit
trial
override
temporary entitlement
credit
```

Applications must not hard-code plan names.

Use capability checks.

---

# 16. Effective Feature Access

A feature is usable only when all applicable checks pass:

```text
Application enabled
    AND
Entitlement allowed
    AND
Feature flag enabled
    AND
IAM permission allowed
    AND
Application business rules
```

Database/RLS remains a defense-in-depth layer.

---

# 17. Usage / Metering

Usage starts as a platform capability and may be extracted as volume requires.

```text
Application
   ↓
Usage Event
   ↓
Async Transport
   ↓
Usage Processor
   ↓
PostgreSQL
```

Potential metrics:

```text
api_requests
ai_requests
storage_bytes
documents_processed
orders
active_users
tokens
messages
```

Usage and billing are separate concepts.

```text
Raw usage
   ↓
Metering
   ├── operational usage
   ├── entitlement limits
   └── billable aggregation
```

Do not send raw telemetry directly to Stripe/Paddle.

---

# 18. Notifications Service

Notification Service owns delivery.

Channels:

```text
Email
SMS
Push
In-app
Webhooks
```

Entities:

```text
Notification
NotificationTemplate
NotificationPreference
Recipient
Delivery
DeliveryAttempt
ProviderConfiguration
```

Responsibilities:

- template rendering
- provider adapters
- delivery
- retries
- preferences
- recipient records
- delivery status
- notification audit metadata

Applications must not embed provider-specific notification code.

Security-critical notifications must not be disabled by ordinary marketing preferences.

Email templates use React Email through the shared email package where applicable.

---

# 19. Audit Service

Audit is a platform/security capability and is append-oriented.

It records security and administrative facts such as:

```text
principal
effective_principal
tenant
scope
action
resource
decision
before
after
reason
approval
request_id
correlation_id
trace_id
timestamp
producer
```

## 19.1 Audit write path

Normal services do not directly write Audit tables.

```text
Service
  ↓
Domain operation
  ↓
Transactional outbox
  ↓
Audit event
  ↓
Audit consumer
  ↓
Audit PostgreSQL
```

## 19.2 Audit immutability

Normal services must not modify historical audit records.

Production controls include:

- restricted PostgreSQL role
- UPDATE/DELETE denial
- retention policy
- legal holds where required
- WORM/object archival where required
- hash-chain verification
- authorized export
- backup/PITR

## 19.3 Audit is not activity UI

Audit is the security/compliance record.

Product activity feeds are application-owned projections and may use audit/event data without becoming the authoritative audit store.

---

# 20. Files Service

Files owns platform-managed file metadata and storage lifecycle.

Conceptual entities:

```text
File
FileVersion
FileObject
FileUpload
FileReference
FileAccessGrant
FileRetentionPolicy
```

Object bytes are stored in an object store such as Cloudflare R2 or AWS S3 according to deployment policy.

Rules:

- metadata is authoritative in the owning service
- object keys are opaque and non-guessable
- access requires authorization
- signed URLs are time limited
- tenant isolation is mandatory
- retention/deletion is explicit
- secrets are never embedded in public object metadata

---

# 21. Integrations Service

Integrations represents external-system connections and their lifecycle.

Entities:

```text
Integration
IntegrationInstallation
Connection
CredentialReference
IntegrationConfiguration
WebhookEndpoint
WebhookSubscription
Capability
IntegrationVersion
```

Lifecycle:

```text
discover
 ↓
install
 ↓
authorize
 ↓
configure
 ↓
active
 ↓
disabled/revoked/uninstalled
```

Installation is a tenant decision.

Permission, entitlement and feature flag remain separate concepts.

External integrations use integration principals when attribution is required.

---

# 22. Application Registry

The Registry is the platform metadata/control-plane registry.

Runtime:

```text
Cloudflare Worker + Hono
D1 authoritative metadata store
KV/cache where justified
```

## 22.1 Registry owns

```text
Application
ApplicationVersion
Environment
DeploymentMetadata
ApplicationCapabilities
ManifestProjection
RouteMetadata
ResourceMetadata
EventMetadata
PermissionMetadata
BrandingMetadata
```

It may expose:

```http
GET /applications
GET /applications/:application
GET /applications/:application/manifest
GET /applications/:application/capabilities
GET /applications/:application/version
```

## 22.2 Registry does not own

- application business logic
- application databases
- application customers/orders/etc.
- identity authority
- global billing implementation
- React components
- JSX
- SQL
- secrets

The Registry describes **what exists**.

Deployment infrastructure decides **where it runs**.

## 22.3 Manifest

Applications are authoritative for their manifests.

```text
Application source
 ↓
Decorators / metadata
 ↓
Manifest compiler
 ↓
Validation
 ↓
application.manifest.json
 ↓
Registry projection
```

Manifest may contain:

```text
application
version
modules
resources
entities
actions
permissions
routes
navigation
dashboards
widgets
capabilities
features
facts
reports
search definitions
API contracts
event contracts
configuration schema
compatibility
branding/theme tokens
```

Never put:

```text
secrets
SQL
arbitrary JavaScript
arbitrary CSS
business logic
component implementations
```

in the manifest.

---

# 23. API Gateway

The Gateway is the public edge boundary.

Runtime:

```text
Cloudflare Worker + Hono
```

## 23.1 Gateway owns

- edge routing
- API version routing
- authentication/token verification
- request normalization
- request IDs
- correlation IDs
- trace propagation
- CORS
- security headers
- rate-limit boundary
- basic edge policy
- service discovery/routing
- response/error normalization
- observability

## 23.2 Gateway must not own

- business logic
- billing calculations
- tenant persistence
- application databases
- complex workflows
- application domain rules

## 23.3 Request pipeline

```text
HTTP request
 ↓
Cloudflare/WAF
 ↓
Gateway
 ↓
request ID
 ↓
correlation/trace context
 ↓
CORS/security policy
 ↓
authentication
 ↓
tenant/domain resolution
 ↓
IAM authorization
 ↓
entitlement where applicable
 ↓
rate limit
 ↓
route resolution
 ↓
typed SDK client
 ↓
owning service
 ↓
normalized response
```

## 23.4 Service clients

Reusable clients belong in:

```text
packages/sdk/src/
```

not duplicated inside Gateway.

Current client families:

```text
identity
 iam
tenant
scope
policy
approval
entitlements
monetization
usage
notifications
audit
registry
```

Gateway composes these clients but does not redefine their transport implementation.

## 23.5 Client responsibilities

SDK clients provide:

- typed operations
- OpenAPI types/contracts
- authenticated transport
- request context
- timeouts
- bounded retries where safe
- idempotency helpers
- tracing propagation
- normalized transport errors

SDKs are **not** the event bus.

---

# 24. Gateway Security

Every protected route must have a defined authentication and authorization policy.

## 24.1 Authentication

Validate:

```text
signature
issuer
audience
expiry
not-before where applicable
key validity
jti/replay requirements where applicable
```

Never trust:

```text
x-user-id
x-tenant-id
x-role
x-permission
```

from an untrusted external caller.

## 24.2 Tenant resolution

Tenant is derived from trusted context:

```text
validated identity
+ active membership/context
+ hostname/domain
+ application context
```

Client-provided tenant IDs are hints at most and require server validation.

## 24.3 Authorization

Gateway authorization is an edge boundary, not the only enforcement layer.

The downstream service must revalidate authorization for sensitive operations.

## 24.4 Rate limiting

Rate limiting is layered:

```text
Cloudflare edge
 ↓
Gateway
 ↓
service-specific protection
```

Rate-limit keys may use combinations of:

```text
IP
principal
service
route
tenant
application
credential
```

Sensitive endpoints require stricter policies.

## 24.5 CORS

CORS must use explicit allowed origins by environment/application.

Do not use wildcard origins for credentialed production APIs.

## 24.6 Security headers

Baseline headers include appropriate:

```text
X-Content-Type-Options
X-Frame-Options
Referrer-Policy
Permissions-Policy
Content-Security-Policy where applicable
Strict-Transport-Security at HTTPS edge
```

---

# 25. Webhook Gateway

Webhook ingestion is a separate edge concern from ordinary API routing.

Webhook processing must support:

```text
signature verification
provider-specific verification
idempotency
replay protection
timestamp tolerance
payload limits
rate limiting
fast acknowledgement
async processing
retry
DLQ
observability
```

Webhook endpoints must not perform long business workflows synchronously when a durable queue is appropriate.

---

# 26. Infrastructure Orchestrator

Terraform is infrastructure source of truth.

The Infrastructure Orchestrator is a **control-plane API/worker**, not a replacement for Terraform.

It may expose authenticated operations such as:

```http
POST /plans
POST /plans/:id/approve
POST /applies
POST /rollbacks
GET  /operations/:id
```

Execution flow:

```text
Caller
 ↓
Orchestrator
 ↓
authentication
 ↓
IAM authorization
 ↓
change policy
 ↓
approval where required
 ↓
Terraform plan
 ↓
plan artifact
 ↓
approval
 ↓
Terraform apply
 ↓
operation result
 ↓
audit/event
```

A Cloudflare Worker must not be treated as a general-purpose arbitrary Terraform execution environment. The worker is the secure control boundary; execution occurs in an appropriate runner/container/workflow environment.

---

# 27. Product Applications

Applications are business-domain owners.

Examples:

```text
CRM
Commerce
POS
Analytics
```

Each application owns:

```text
business logic
application API
application database
domain model
workflows
application UI
application-specific permissions
application-specific events
search projections
reporting definitions
```

Applications consume platform capabilities.

They do not implement their own identity authority, global tenant authority or global billing authority.

---

# 28. Application Resource Model

The platform distinguishes:

```text
Entity
Resource
Module
Action
Permission
Route
```

An entity is a domain object.

A resource is an API/UI management boundary around an entity.

A module is a business capability grouping resources.

Example:

```text
Commerce
 └── Catalog
      └── Product entity
           ├── products resource
           ├── product-imports resource
           ├── product-pricing resource
           └── product-approvals resource
```

Modules are not database tables.

---

# 29. Product Application Entity Pattern

Every application should document entities using:

```text
Entity
 ├── identity
 ├── lifecycle
 ├── ownership
 ├── tenant relation
 ├── scope relation
 ├── parent/child relations
 ├── fields
 ├── invariants
 ├── indexes
 ├── unique constraints
 ├── permissions
 ├── actions
 ├── events
 ├── API resources
 ├── search projection
 ├── reporting facts
 └── retention policy
```

The application is authoritative for these business entities.

---

# 30. Example Commerce Domain

A Commerce application may contain:

```text
Catalog
 ├── Category
 ├── Product
 ├── ProductVariant
 ├── ProductOption
 ├── Price
 └── ProductMedia

Commerce
 ├── Customer
 ├── Cart
 ├── Order
 ├── OrderItem
 ├── Payment
 ├── Refund
 └── Return

Inventory
 ├── Warehouse
 ├── StockItem
 ├── StockLevel
 ├── StockMovement
 └── Transfer
```

Typical relations:

```text
Product
 └── ProductVariant
      └── StockItem
           └── StockLevel

Customer
 └── Order
      └── OrderItem
           └── ProductVariant
```

Exact application entities belong to the application domain and must not be invented in platform services.

---

# 31. Database Ownership

Each service/application owns its persistence boundary.

```text
Identity DB boundary
IAM DB boundary
Tenant DB boundary
Scope DB boundary
Policy DB boundary
Approval DB boundary
Monetization DB boundary
Entitlements DB boundary
Usage DB boundary
Notifications DB boundary
Audit DB boundary
Files DB boundary
Integrations DB boundary
Reporting DB boundary
Search DB boundary
Workflow DB boundary
Application DB boundaries
```

Physical deployments may share a PostgreSQL cluster for operational efficiency, but logical ownership remains separate.

No cross-service repository/entity imports.

---

# 32. PostgreSQL / Supabase

Supabase PostgreSQL is the default relational persistence platform where applicable.

PostgreSQL is transactional source of truth.

## 32.1 RLS

Use Row Level Security as defense in depth for tenant-aware application data.

```text
validated identity
 + validated tenant context
 + IAM authorization
 + application rules
 + PostgreSQL RLS
```

RLS is not a substitute for IAM.

## 32.2 Service roles

Use least-privilege database roles.

Administrative roles must be separated from runtime application roles.

Audit has stronger restrictions than ordinary transactional services.

---

# 33. Database Migrations

Migrations are source-controlled and deterministic.

Preferred service structure:

```text
services/<service>/src/database/
├── migrations/
│   ├── 001_<purpose>.ts
│   ├── 002_<purpose>.ts
│   └── ...
└── seeds/
    ├── 001_<purpose>.ts
    └── ...
```

Where the migration framework uses SQL files instead, the equivalent is:

```text
migrations/
├── 001_<purpose>.up.sql
└── 001_<purpose>.down.sql
```

Each migration must own one coherent schema change.

A migration must define, as appropriate:

- table creation/change
- columns
- primary keys
- foreign keys
- unique constraints
- check constraints
- indexes
- partial indexes
- triggers
- RLS policies
- grants/revokes
- rollback behavior

Do not hide unrelated schema changes in a single migration merely for convenience.

---

# 34. ORM Policy

NestJS relational services use MikroORM where the service needs a rich domain ORM and Unit-of-Work semantics.

The repository/entity boundary is local to the owning service.

Dependency injection follows the service's chosen ORM integration convention; repository injection is preferred where a repository abstraction is required, while `EntityManager` is appropriate for transaction/unit-of-work orchestration.

Do not expose ORM entities through public SDKs.

Public contracts use DTO/schema types.

---

# 35. Seeding

Seeds are deterministic and environment-aware.

Seed categories:

```text
reference data
system permissions
system roles
policy templates
application metadata
local development fixtures
```

Never seed:

- production user passwords
- real credentials
- API secrets
- production payment credentials
- arbitrary sensitive customer data

Production bootstrap data must be explicit, reviewed and idempotent.

---

# 36. HTTP API Standards

Every service exposes a versioned API where it is externally consumed.

Example:

```text
/api/v1/...
```

HTTP contracts must define:

```text
method
path
request schema
response schema
error schema
authentication
authorization
idempotency
pagination
filtering
sorting
rate-limit behavior
```

## 36.1 Standard headers

Where applicable:

```text
Authorization
X-Request-ID
X-Correlation-ID
traceparent
Idempotency-Key
```

## 36.2 Errors

Use stable machine-readable codes.

Example:

```json
{
  "error": {
    "code": "iam.authorization_denied",
    "message": "The operation is not permitted.",
    "requestId": "..."
  }
}
```

Do not leak stack traces, provider secrets or internal topology.

---

# 37. Service SDK Architecture

Reusable clients belong in `packages/sdk`.

```text
packages/sdk/src/
├── identity/
├── iam/
├── tenant/
├── scope/
├── policy/
├── approval/
├── entitlements/
├── monetization/
├── usage/
├── notifications/
├── audit/
├── registry/
└── transport/
```

Contracts may be shared from:

```text
packages/contracts
packages/events
```

The SDK may depend on contracts, but it must not import another service's database entity/repository.

---

# 38. Synchronous Communication Matrix

| Caller | Target | Mechanism |
|---|---|---|
| Browser | Gateway | HTTPS |
| Gateway | Identity | authenticated HTTPS + SDK |
| Gateway | IAM | authenticated HTTPS + SDK |
| Gateway | Tenant | authenticated HTTPS + SDK |
| Gateway | Scope | authenticated HTTPS + SDK |
| Gateway | Policy | authenticated HTTPS + SDK |
| Gateway | Approval | authenticated HTTPS + SDK |
| Gateway | Entitlements | authenticated HTTPS + SDK |
| Gateway | Monetization | authenticated HTTPS + SDK |
| Gateway | Usage | authenticated HTTPS + SDK when synchronous read is required |
| Gateway | Notifications | authenticated HTTPS + SDK where externally exposed |
| Gateway | Audit | authenticated HTTPS + SDK for reads |
| Gateway | Registry | Service Binding where Worker-to-Worker |
| Application | IAM | authenticated HTTPS + SDK |
| Application | Tenant | authenticated HTTPS + SDK |
| Application | Monetization | authenticated HTTPS + SDK |
| Application | Registry | authenticated HTTPS/Service Binding as appropriate |

---

# 39. Asynchronous Communication

Use durable asynchronous transport for:

```text
audit
usage
notifications
tenant lifecycle
subscription lifecycle
application activation
domain verification
provisioning
integration synchronization
long-running jobs
```

Cloudflare-native Worker async workloads use Cloudflare Queues where appropriate.

Node services use the repository's durable event/messaging abstraction and the selected production transport.

Kafka is introduced only when measured requirements justify high-volume durable streaming, CDC, analytics ingestion or multiple independent high-volume consumers.

Redis is for:

```text
cache
rate limiting
locks/coordination
transient state
optional ephemeral pub/sub
```

Redis Pub/Sub is not the durable event backbone.

---

# 40. NATS / JetStream Boundary

Where the Node service messaging deployment uses NATS/JetStream, it is a transport implementation behind the shared messaging contracts.

Use:

```text
Core NATS
 → request/reply where appropriate

JetStream
 → durable event delivery
```

Requirements:

- TLS
- authenticated credentials
- least-privilege subjects
- durable consumers
- explicit acknowledgements
- redelivery
- retry policy
- DLQ
- idempotency
- observability
- connection lifecycle management

Do not couple public API contracts directly to NATS subjects.

---

# 41. Event Model

Event categories:

```text
Domain Event
Platform Event
Integration Event
Audit Event
```

## 41.1 Event envelope

Canonical fields:

```text
event_id
event_type
event_version
occurred_at
producer
tenant_id
principal/actor context
correlation_id
causation_id
payload
```

## 41.2 Event naming

Use namespaced versioned subjects/types:

```text
identity.created.v1
identity.provider.linked.v1

tenant.created.v1
tenant.suspended.v1

application.enabled.v1
application.disabled.v1

domain.verified.v1

iam.role.assigned.v1
iam.permission.changed.v1

subscription.created.v1
subscription.cancelled.v1
entitlement.changed.v1

usage.recorded.v1
notification.requested.v1

integration.connected.v1
integration.disconnected.v1
```

## 41.3 Event rules

Events are:

- immutable
- versioned
- schema validated
- idempotently consumed
- retryable
- DLQ-capable
- replayable where safe

Events must not contain secrets.

---

# 42. Command vs Event vs Audit

These are different.

### Command

```text
PublishProduct
```

Means:

> Please perform this operation.

### Domain event

```text
ProductPublished
```

Means:

> This business fact occurred.

### Audit event

```text
actor = principal_123
action = commerce.products.publish
resource = product_123
```

Means:

> This principal performed this sensitive operation.

Never collapse these concepts into one generic message type.

---

# 43. Transactional Outbox

Every service that emits durable events from transactional state changes uses an outbox boundary.

```text
Application transaction
 ├── business write
 └── outbox write
        ↓ commit
     relay
        ↓
     durable transport
```

The relay must support:

```text
claiming
locking
batching
retry
backoff
failure classification
DLQ
idempotent publication
metrics
tracing
graceful shutdown
```

Consumers must be idempotent because the target delivery guarantee is at-least-once.

---

# 44. Retry / DLQ / Idempotency

No infinite retries.

Use bounded exponential backoff with jitter where appropriate.

Classify failures:

```text
transient
permanent
poison message
configuration
security
validation
```

Permanent/poison failures move to DLQ.

DLQ records retain enough metadata for diagnosis and controlled replay.

Every consumer defines its idempotency key.

Possible sources:

```text
event_id
provider_event_id
idempotency_key
business_operation_id
```

---

# 45. Observability

All services/workers/apps have an explicit observability boundary.

Backend:

```text
structured logs
metrics
traces
health
readiness
```

Frontend:

```text
request IDs where possible
error telemetry
performance telemetry where justified
```

Use the shared `@figentra/observability` package where appropriate.

## 45.1 Logging

Use Pino-based structured logging for NestJS services.

Workers use the Hono-compatible logger integration or direct structured logging through the platform abstraction.

Never log:

```text
passwords
tokens
API secrets
private keys
raw session cookies
payment credentials
unnecessary PII
```

## 45.2 Context

Propagate:

```text
X-Request-ID
X-Correlation-ID
traceparent
principal context where trusted
```

Context is validated at each trust boundary.

---

# 46. NestJS Standard

NestJS is the default backend runtime for substantial stateful Node services.

Use:

```text
Node.js
TypeScript strict
NestJS
Fastify adapter
Pino / nestjs-pino
MikroORM where relational persistence requires it
Vitest
Oxlint
Prettier
```

NestJS microservices are **not** the universal S2S protocol.

`@nestjs/microservices` is used selectively for message consumers/producers where the selected transport belongs naturally inside the Nest service.

The standard HTTP boundary remains:

```text
HTTP/OpenAPI + SDK
```

---

# 47. NestJS Source Organization

A production service should follow a bounded structure such as:

```text
src/
├── app.module.ts
├── main.ts
├── <domain>/
│   ├── application/
│   ├── domain/
│   ├── infrastructure/
│   └── presentation/
├── database/
│   ├── migrations/
│   └── seeds/
├── infrastructure/
│   ├── health.controller.ts
│   └── observability.ts
└── i18n/
    ├── en/
    └── ar/
```

Do not keep unused `AppController`/`AppService` scaffolding.

`main.ts` is the canonical HTTP bootstrap unless the service has a real, separately justified worker/consumer process.

If separate process entrypoints are required, they must have explicit ownership and deployment contracts rather than arbitrary `main.cli.ts`/`main.worker.ts` files added by convention.

---

# 48. Internationalization

NestJS services that expose localized errors/messages use `nestjs-i18n`.

Canonical source location:

```text
src/i18n/
├── en/
└── ar/
```

Translation files contain messages, not business logic.

Locale selection must be explicit and bounded.

---

# 49. Worker Standard

Workers use the official Cloudflare/Hono scaffold and Wrangler.

Standard characteristics:

```text
Hono
Wrangler
TypeScript
cf-typegen
Vitest
Cloudflare bindings
structured logging
request context
security middleware
```

Workers use explicit routes:

```text
routes/*.route.ts
```

and explicit route registration.

Worker code must not contain empty placeholder folders or unused `.gitkeep` files.

---

# 50. Worker Communication

For Worker-to-Worker communication:

```text
Cloudflare Service Bindings
```

are preferred when available.

For Worker-to-container communication:

```text
authenticated HTTPS
```

Do not expose internal services publicly just to make service-to-service calls convenient.

---

# 51. Vite Frontend Standard

Frontend applications use:

```text
React
TypeScript
Vite
React Router v7
HeroUI / HeroUI Pro
Tailwind-compatible styling
@stackra/query
@stackra/ui
@stackra/dashboard where needed
@figentra/runtime
@figentra/sdk
```

Do not introduce Refine as a platform dependency.

Do not implement SDUI.

The backend supplies:

```text
metadata
permissions
capabilities
routes metadata
navigation metadata
theme tokens
branding
feature flags
```

The frontend owns:

```text
React components
pages
forms
tables
layouts
interaction logic
loading/error/empty states
```

---

# 52. Portal

`apps/portal` is the central Vite application shell.

It owns:

```text
central workspace
organization/tenant context UI
application launcher
tenant administration
members/access UI
billing UI
domain UI
platform settings
runtime bootstrap
```

It is not a security authority.

All authorization is server-side.

---

# 53. Landing Page

`apps/landing-page` is the public marketing/site application.

It must not contain privileged platform authorization or business administration logic.

It uses the same frontend standards but remains a public-facing application.

---

# 54. Family Application

`apps/family` is an application-level product surface and follows the same platform boundaries:

```text
Supabase authentication
 ↓
Gateway
 ↓
Tenant/context
 ↓
IAM
 ↓
Family application APIs
```

Its business data remains application-owned.

---

# 55. Runtime Bootstrap

The portal/runtime layer can call:

```http
GET /runtime
```

The response can include:

```text
tenant
application
branding
theme
features
capabilities
manifest version/hash
```

Runtime metadata is **not authorization**.

---

# 56. Frontend Theming

Tenant/application branding is validated configuration.

```text
Tenant branding
 ↓
Runtime
 ↓
@figentra/theme where applicable
 ↓
HeroUI / Stackra UI
```

Never allow tenant configuration to inject:

```text
<script>
arbitrary JavaScript
arbitrary CSS
style tags
CSS expressions
```

---

# 57. Feature Flags

Feature flags are operational release controls.

They are not entitlements.

They are not IAM permissions.

A provider may be Cloudflare Flagship behind an abstraction where appropriate.

Core authorization must not fail open because a feature flag provider is unavailable.

---

# 58. Reporting

Reporting is separated from transactional business logic.

```text
Application DB / Events
        ↓
Canonical Facts
        ↓
Read Models / Analytics Store
        ↓
Reports
        ↓
Dashboard / Export / Schedule
```

Facts Registry defines canonical measures.

Reports Registry defines reusable reports.

Heavy reporting must move away from transactional workloads as volume requires.

---

# 59. Search

PostgreSQL remains source of truth.

Search is a projection.

Initial UX search:

```text
PostgreSQL
 ↓
projection
 ↓
Meilisearch
```

OpenSearch is introduced only when requirements justify:

- operational search
- large-scale search
- complex aggregations
- log search
- analytics/search combinations

Applications use a vendor-neutral search abstraction where appropriate.

---

# 60. Workflows

Workflows are durable orchestration, not authorization.

Use for:

```text
tenant provisioning
subscription lifecycle
approval execution
notification pipelines
imports
integration synchronization
infrastructure changes
```

Workflow requirements:

- durable state
- retries
- idempotency
- compensation
- timeouts
- scheduled steps
- human waits
- failure recovery

Technology selection depends on runtime:

```text
Cloudflare Workflows
AWS Step Functions
Temporal
other justified durable orchestrator
```

Do not create a generic Jobs Service merely because multiple applications have background work.

Jobs belong to their owning service until independent lifecycle/scale/ownership justifies extraction.

---

# 61. Registry Metadata Graph

The application metadata graph is:

```text
Application
├── Manifest
├── Modules
│   └── Resources
│       ├── Entities
│       ├── Routes
│       ├── Actions
│       └── Permissions
├── Navigation
├── Dashboards
│   └── Widgets
├── Facts
├── Reports
├── Search Definitions
├── Features
├── Configuration
├── API Contracts
└── Event Contracts
```

This does not require separate microservices for every metadata type.

---

# 62. Package Responsibilities

## `@figentra/contracts`

Framework-neutral HTTP/domain contract types and schemas.

Must not contain database entities.

## `@figentra/events`

Canonical event envelopes, event schemas, event names and event contract tooling.

## `@figentra/messaging`

Transport-neutral messaging interfaces plus concrete transport adapters.

## `@figentra/outbox`

Outbox contracts, persistence abstractions, relay primitives and testing helpers.

## `@figentra/identity`

Identity/provider abstractions and identity context primitives.

## `@figentra/iam`

IAM client/contracts and authorization primitives that are intentionally reusable.

## `@figentra/registry`

Registry contracts and manifest/control-plane primitives.

## `@figentra/security`

Shared security primitives such as token verification contracts, request context and security helpers.

## `@figentra/observability`

Cross-runtime logging/metrics/tracing contracts and integrations.

## `@figentra/sdk`

Typed service clients and transport abstractions.

## `@figentra/tsup-config`

Shared library bundling configuration.

## `@figentra/typescript-config`

Shared strict TypeScript configuration.

## `@figentra/prettier-config`

Shared formatting configuration.

## `@figentra/oxlint-config`

Shared lint rules.

---

# 63. Package Rules

Every reusable package should have:

```text
package.json
README/documentation where meaningful
src/
__tests__/
tsconfig.json or shared extension
build configuration
Vitest configuration where needed
explicit exports
```

Public exports must be deliberate.

Use subpath exports for substantial bounded capabilities, for example:

```text
@figentra/observability/core
@figentra/observability/contracts
@figentra/observability/testing
```

Do not expose internal implementation files.

---

# 64. Testing Architecture

All test files belong under explicit `__tests__` locations for packages, services, workers and applications.

```text
__tests__/
├── unit/
├── integration/
├── contract/
├── e2e/
└── security/
```

## 64.1 Unit

Pure domain/application behavior.

## 64.2 Integration

Real persistence/transport boundaries using controlled infrastructure.

## 64.3 Contract

OpenAPI/event/schema compatibility.

## 64.4 E2E

Authenticated user/application flows through real boundaries.

## 64.5 Security

Test:

```text
invalid issuer
invalid audience
expired token
invalid signature
scope escalation
tenant escape
privilege escalation
unauthorized service
webhook signature bypass
replay
credential rotation
revocation
impersonation
invalid delegation
```

---

# 65. Gateway Test Requirements

Gateway must have tests for:

```text
health
readiness
routing
unknown routes
request ID
correlation ID
trace propagation
CORS
security headers
JWT validation
JWKS rotation
issuer/audience validation
expired tokens
missing credentials
IAM deny
IAM allow
entitlement deny
rate limits
service timeout
safe retry
upstream 4xx
upstream 5xx
error normalization
service client invocation
Registry routing
Worker Service Binding behavior
```

---

# 66. Service Test Requirements

Every service must cover:

```text
use cases
validation
authorization
tenant isolation
persistence
transactions
outbox
consumer idempotency
event schema
retry/DLQ
observability
failure behavior
```

---

# 67. Architecture Tests

CI should detect:

```text
direct cross-service DB imports
direct Supabase Auth use outside Identity boundary
application bypass of IAM
hard-coded tenant trust
secrets in source
secret-bearing manifests
unversioned public events
unversioned APIs
circular package dependencies
Node-only dependencies in Workers
```

---

# 68. Infrastructure

Terraform is infrastructure source of truth.

Every Terraform module uses the standard structure:

```text
main.tf
variables.tf
versions.tf
outputs.tf where needed
```

Modules should describe infrastructure capabilities rather than embed business domain logic.

Environment names are:

```text
development
staging
production
```

Not abbreviations such as `dev`, `stg`, `prd` in canonical public configuration.

---

# 69. Cloud Manifest

`cloud.yaml` is the deployable service/application/worker contract.

It describes:

```text
identity
runtime
source
environment
capabilities
bindings
routing
observability
non-secret environment configuration
tags
```

Secrets do not belong in `cloud.yaml`.

Terraform and deployment tooling consume the manifest.

Generated catalogs are derived artifacts, not a second manually maintained service inventory.

---

# 70. Docker

`infrastructure/docker` contains local/container orchestration artifacts.

Docker Compose may be generated from the canonical deployment manifests and infrastructure metadata.

Generated output belongs under:

```text
infrastructure/docker/docker-compose.generated.yml
```

rather than duplicating service definitions manually in unrelated Terraform directories.

Docker generation must be deterministic.

---

# 71. Infrastructure Scripts

Deployment/infrastructure scripts are centralized under:

```text
infrastructure/scripts
```

Terraform-specific scripts may live under:

```text
infrastructure/terraform/scripts
```

Docker-specific scripts may live under:

```text
infrastructure/docker/scripts
```

A script should have one owner and one responsibility.

---

# 72. Environments

Canonical environments:

```text
development
staging
production
```

Each environment has explicit configuration, secrets, infrastructure state and deployment policy.

Production requires:

- reviewed Terraform plans
- approval gates
- protected secrets
- least-privilege credentials
- rollback plan
- observability
- backup/PITR
- DR procedure

---

# 73. Secret Management

Secrets belong in the configured secret-management system.

Never store production secrets in:

```text
Git
cloud.yaml
application manifests
Registry
frontend bundles
Dockerfiles
container images
ordinary logs
```

Secret values must be injected at runtime.

---

# 74. Security Layers

The complete security stack is:

```text
Cloudflare WAF / edge
        ↓
Gateway authentication
        ↓
Identity normalization
        ↓
Tenant/context resolution
        ↓
IAM authorization
        ↓
Policy evaluation
        ↓
Entitlement evaluation
        ↓
Application authorization/business rules
        ↓
Database RLS / least-privilege DB role
```

Not every operation requires every layer, but no applicable layer may be skipped.

---

# 75. Data Privacy

Do not expose unnecessary sensitive data.

Identity and audit data require explicit retention policies.

Deletion may require:

```text
session revocation
credential revocation
provider unlinking
principal deactivation
PII anonymization
retained audit references
object deletion
search projection cleanup
```

Legal retention can override ordinary deletion only under explicit policy/legal-hold controls.

---

# 76. API Gateway and Service Trust

The Gateway is trusted only for edge concerns.

A downstream service must not assume:

```text
Gateway said it is authorized
```

means the operation is automatically safe.

Sensitive services perform their own authorization checks using trusted service identity and delegated/user context.

The Gateway therefore provides **defense in depth**, not centralized business authorization ownership.

---

# 77. Token Forwarding

Do not blindly forward an end-user token to every internal service.

Choose explicitly between:

```text
user-delegated token
service token
exchanged audience-specific token
delegated token
```

The receiving service validates:

```text
issuer
audience
signature
expiry
scope
principal/delegation context
```

---

# 78. Request Context

Canonical propagation:

```text
X-Request-ID
X-Correlation-ID
traceparent
```

Potential security context:

```text
principal_id
identity_id
tenant_id
application
scope
```

These values are derived from trusted context and validated at each trust boundary.

---

# 79. Caching

Cache only data that is safe to cache.

Authorization cache keys must include every context component that can change the decision.

Example:

```text
authz:{tenant}:{principal}:{application}:{scope}:{permission}:{policyVersion}
```

Invalidate on relevant changes such as:

```text
role.changed
permission.changed
application-access.changed
policy.changed
tenant.suspended
subscription.changed
entitlement.changed
```

Sensitive decisions use short TTLs.

Emergency revocation must bypass or invalidate stale authorization state.

---

# 80. Latency Targets

Engineering targets for IAM:

```text
cached decision: sub-ms to low-ms
remote decision: low tens of ms or better
batch decision: optimized to avoid N+1
```

Gateway upstream calls require explicit timeouts.

Retries are allowed only for safe/idempotent operations or operations with an explicit idempotency key.

---

# 81. Failure Handling

Every distributed boundary assumes failure.

Use:

```text
timeouts
bounded retries
exponential backoff
circuit breakers where justified
safe fallbacks
idempotency
DLQ
replay tooling
health/readiness
```

Do not use infinite retries.

Do not silently swallow failures.

---

# 82. Health and Readiness

Liveness answers:

> Is the process/runtime alive?

Readiness answers:

> Can this workload safely receive traffic?

A dependency outage must not automatically make every service permanently unhealthy.

Dependency-specific readiness rules must be explicit.

Registry availability must never prevent an application from starting.

---

# 83. Application Startup

Applications must be able to start from local source/configuration without requiring the Application Registry to be online.

Manifest publication is:

```text
build/CI primary
boot reconciliation optional
```

Boot-time registry publication must be asynchronous and retryable.

---

# 84. Versioning

Version these artifacts:

```text
REST APIs
SDKs
events
webhooks
application manifests
integration contracts
```

Public breaking changes require a new version.

Events are explicitly versioned.

Deprecation records must include:

```text
owner
current version
supported versions
deprecation date
migration guidance
sunset policy
```

---

# 85. Event Compatibility

Consumers must tolerate compatible additive changes where the contract permits.

Breaking event changes require a new event version.

Never silently change the meaning of an existing event version.

---

# 86. API Compatibility

SDK clients must not silently accept incompatible server behavior.

Use contract tests to protect:

```text
request schema
response schema
error schema
authentication
idempotency
pagination
```

---

# 87. Audit Event Catalog

Important platform/security events include:

```text
identity.created.v1
identity.updated.v1
identity.disabled.v1
identity.deleted.v1
identity.provider.linked.v1
identity.provider.unlinked.v1

principal.created.v1
principal.disabled.v1
credential.issued.v1
credential.rotated.v1
credential.revoked.v1

role.created.v1
role.updated.v1
role.assigned.v1
role.revoked.v1
permission.created.v1
permission.updated.v1
policy.changed.v1

tenant.created.v1
tenant.updated.v1
tenant.suspended.v1
tenant.deleted.v1

domain.created.v1
domain.verified.v1
domain.activated.v1
domain.suspended.v1

application.enabled.v1
application.disabled.v1
application.deployed.v1
application.manifest.published.v1

subscription.created.v1
subscription.updated.v1
subscription.cancelled.v1
entitlement.changed.v1
usage.recorded.v1

integration.connected.v1
integration.disconnected.v1
integration.credential.rotated.v1

notification.requested.v1
notification.delivered.v1
notification.failed.v1

approval.requested.v1
approval.approved.v1
approval.rejected.v1
approval.expired.v1

file.created.v1
file.deleted.v1

provisioning.started.v1
provisioning.completed.v1
provisioning.failed.v1

infrastructure.plan.created.v1
infrastructure.approved.v1
infrastructure.applied.v1
infrastructure.rollback.completed.v1
```

This is a canonical starting catalog; application-specific business events remain application-owned.

---

# 88. HTTP API Surface — Platform

Representative platform APIs:

## Identity

```http
GET  /api/v1/identity/me
GET  /api/v1/identity/:id
POST /api/v1/identity/providers/link
POST /api/v1/identity/providers/unlink
POST /api/v1/identity/deactivate
```

## IAM

```http
GET  /api/v1/iam/me/access
GET  /api/v1/iam/me/applications
POST /api/v1/iam/authorization/check
POST /api/v1/iam/authorization/batch
POST /api/v1/iam/roles
POST /api/v1/iam/permissions
POST /api/v1/iam/assignments
DELETE /api/v1/iam/assignments/:id
```

## Tenant

```http
GET  /api/v1/tenants
GET  /api/v1/tenants/:id
POST /api/v1/tenants
PATCH /api/v1/tenants/:id
POST /api/v1/tenants/:id/suspend
POST /api/v1/tenants/:id/domains
POST /api/v1/tenants/:id/domains/:domain/verify
```

## Scope

```http
GET  /api/v1/scopes
GET  /api/v1/scopes/:id
POST /api/v1/scopes
PATCH /api/v1/scopes/:id
POST /api/v1/scopes/:id/members
```

## Policy

```http
GET  /api/v1/policies
POST /api/v1/policies
POST /api/v1/policies/:id/simulate
POST /api/v1/policies/:id/publish
```

## Approval

```http
GET  /api/v1/approvals
GET  /api/v1/approvals/:id
POST /api/v1/approvals
POST /api/v1/approvals/:id/approve
POST /api/v1/approvals/:id/reject
```

## Monetization

```http
GET  /api/v1/billing/account
GET  /api/v1/subscriptions
GET  /api/v1/entitlements
GET  /api/v1/usage
```

## Audit

```http
GET /api/v1/audit
GET /api/v1/audit/:id
```

Audit write operations are event-driven, not an ordinary public CRUD endpoint.

---

# 89. Service Boundary Matrix

| Component | Owns | Must not own |
|---|---|---|
| Supabase Auth | authentication protocol/provider state | Figentra authorization/business state |
| Identity | canonical identity + provider mapping | billing, application data |
| Principal model | authorization subjects | authentication protocol |
| IAM | roles, permissions, access, authorization | passwords, billing, application data |
| Tenant | tenant lifecycle/config/domains | authentication, application data |
| Scope | contextual hierarchy/membership | authority/permissions |
| Policy | contextual authorization rules | application business semantics |
| Approval | human approval workflow | base authentication/permission model |
| Monetization | billing/subscription/commercial state | identity, application data |
| Entitlements | commercial capability state | user authentication |
| Usage | metering/usage state | payment-provider canonical state |
| Notifications | delivery | authorization decisions |
| Audit | immutable security/admin record | mutable business state |
| Files | file metadata/storage lifecycle | application business entities |
| Integrations | external connections | core application business state |
| Registry | application metadata/control plane | application business data |
| Gateway | edge concerns | business logic |
| Orchestrator | infrastructure change control | arbitrary business workflows |
| Applications | domain business logic/data | global identity/tenant/billing authority |

---

# 90. Application Registry vs Service Registry

The Application Registry is not a generic runtime service-discovery mechanism for every network endpoint.

It stores application/control-plane metadata.

Infrastructure/service discovery may be provided by:

```text
Cloudflare Service Bindings
Terraform outputs
platform runtime configuration
service-specific environment bindings
```

Do not turn Application Registry into an accidental distributed service mesh.

---

# 91. What Must Never Be Shared

Never share across services:

```text
database entities
ORM repositories
DB credentials
private keys
provider secrets
internal sessions
raw password hashes
internal policy implementation
```

Share:

```text
public contracts
schemas
SDKs
event contracts
request context contracts
security primitives
observability primitives
```

---

# 92. What Must Be Generated

Generated artifacts include, where applicable:

```text
application.manifest.json
registry catalog
OpenAPI client types
SDK types
Wrangler configuration derived from infrastructure
Docker Compose generated configuration
Terraform-derived deployment metadata
```

Generated artifacts must have a clear source of truth.

Never manually maintain two competing representations of the same deployment/service inventory.

---

# 93. What Must Be Hand-Written

Business/domain code remains source code:

```text
application services
use cases
domain rules
controllers/routes
entities
migrations
policies
workflows
provider adapters
security decisions
```

Generators must not hide business logic.

---

# 94. Documentation and Code Comments

Production code must explain non-obvious architectural intent.

Public classes, methods, interfaces, exported constants and exported types should have TSDoc/docblocks where the repository standards require them.

Configuration files must contain comments explaining:

- ownership
- source of truth
- security assumptions
- generated/manual status
- environment semantics

Comments must explain **why**, not merely restate syntax.

Do not add meaningless comments to every line.

---

# 95. TypeScript Standards

Use strict TypeScript.

Prefer:

```text
explicit exports
explicit interfaces/types
readonly where appropriate
unknown over any
schema validation at trust boundaries
narrow unions for lifecycle/status
branded IDs where justified
```

Do not use `any` to silence architectural/type problems.

---

# 96. Linting and Formatting

The repository standard is:

```text
Oxlint
Prettier
TypeScript compiler
```

Oxlint is the canonical linter.

ESLint is not required merely because NestJS historically generated it.

Legacy ESLint configuration should not be retained without a concrete reason.

---

# 97. Build Standard

Packages use the shared TSUP configuration where appropriate.

Services use Nest CLI with the selected production compiler/build pipeline.

Workers use Wrangler.

Vite applications use Vite.

Do not force one bundler across all runtime classes.

---

# 98. Runtime Selection

Use **Hono + Cloudflare Workers** for:

- Gateway
- Registry
- lightweight edge APIs
- suitable webhook endpoints

Use **NestJS + Fastify + Cloudflare Containers** for:

- Identity
- IAM
- Tenant
- Scope
- Policy
- Approval
- Monetization
- Entitlements
- Usage where stateful Node execution is appropriate
- Notifications
- Audit
- Files
- Integrations
- Reporting
- Search
- Workflow

Use another runtime only when measurable requirements justify it.

---

# 99. Mobile / Other Clients

Any future mobile client follows the same platform contracts:

```text
Supabase authentication
 ↓
Gateway
 ↓
IAM/Tenant/Entitlement
 ↓
application API
```

Mobile applications do not receive direct authority over platform security decisions.

---

# 100. Enterprise Production Gate

A component is not production-ready merely because its TypeScript compiles.

The complete gate is:

```text
architecture
 ↓
contracts
 ↓
implementation
 ↓
typecheck
 ↓
lint
 ↓
format
 ↓
unit tests
 ↓
integration tests
 ↓
contract tests
 ↓
security tests
 ↓
E2E
 ↓
load/reliability
 ↓
infrastructure plan
 ↓
staging deployment
 ↓
staging verification
 ↓
rollback rehearsal
 ↓
production approval
 ↓
production deployment
 ↓
production smoke tests
 ↓
DR/PITR verification
```

---

# 101. Disaster Recovery

Production services require:

```text
backup policy
PITR
restore procedure
RPO
RTO
credential recovery
NATS/queue recovery
DLQ recovery
Terraform state recovery
object-storage recovery
DNS recovery
```

A backup is not considered operationally valid until restoration has been tested.

---

# 102. Reliability Drills

Required drills include:

```text
NATS/queue unavailable
PostgreSQL unavailable
service unavailable
relay crash
consumer crash
duplicate delivery
poison message
DLQ saturation
credential rotation
JWKS rotation
upstream timeout
Gateway overload
Registry unavailable
Terraform runner failure
rollback
PITR restore
```

---

# 103. Security Verification

Production security testing must include:

```text
authentication bypass
JWT/JWKS attacks
audience/issuer confusion
token replay
credential theft scenarios
service impersonation
privilege escalation
cross-tenant access
cross-scope access
policy bypass
approval bypass
webhook forgery
webhook replay
SSRF
rate-limit bypass
secret leakage
IDOR
mass assignment
injection
```

---

# 104. AI Coding Agent Rules

Before modifying Figentra, an AI coding agent must:

1. Read this document.
2. Identify the bounded context.
3. Identify the data owner.
4. Identify the API/event contract.
5. Identify authorization requirements.
6. Check existing SDK/contracts/events.
7. Check database ownership.
8. Check relevant ADRs.
9. Avoid creating duplicate abstractions.
10. Add tests.
11. Add documentation/comments for architectural intent.

Agents must never:

```text
duplicate Supabase authentication
trust client tenant IDs
access another service's database
put secrets in manifests
put business logic in Gateway
put business logic in Registry
put full authorization graphs in JWTs
use plan names as permissions
use Redis Pub/Sub as durable event storage
introduce a microservice for every table
introduce Refine as a mandatory platform layer
introduce SDUI
add Kubernetes without an explicit requirement
```

---

# 105. Non-Goals

Figentra does not attempt to become:

```text
a generic service mesh
a generic workflow engine for every use case
a generic UI renderer
a universal event-sourcing framework
a replacement for PostgreSQL
a replacement for Supabase Auth
a replacement for Stripe/Paddle
an infrastructure provider
a database-sharing architecture
```

The platform integrates proven providers while retaining authoritative Figentra domain boundaries.

---

# 106. Source of Truth Hierarchy

When two artifacts describe the same concept, use this hierarchy:

```text
1. Current approved ADR
2. This repository-level platform contract
3. Service-specific approved architecture document
4. API/event contract
5. Implementation
6. Generated artifact
7. Historical/reference material
```

A generated artifact never outranks its source.

Historical `.ref` documents are references and must not silently override current approved decisions.

---

# 107. Current Authentication Decision — Explicit Override

Some historical architecture documents describe Clerk.

The current Figentra decision is:

```text
Supabase Auth = day-one authentication provider
```

Therefore:

```text
Supabase Auth
      ↓
Identity Adapter
      ↓
Figentra Identity
      ↓
Principal
      ↓
IAM
```

No Clerk dependency is required for the day-one architecture.

The provider abstraction exists so a future provider migration does not require redesigning the Identity, Principal or IAM contracts.

---

# 108. Final End-to-End Request

For a human request:

```text
Browser
 ↓
Cloudflare
 ↓
Gateway
 ↓
Supabase JWT verification
 ↓
Identity normalization
 ↓
Tenant resolution
 ↓
Scope resolution
 ↓
IAM authorization
 ↓
Policy evaluation where required
 ↓
Entitlement check where required
 ↓
Application API
 ↓
Application transaction
 ├── business state
 └── outbox
       ↓
     async transport
       ├── Audit
       ├── Usage
       ├── Notifications
       ├── Search projection
       ├── Reporting projection
       └── Integrations
```

For service-to-service:

```text
Service A
 ↓
service identity
 ↓
short-lived audience-bound credential
 ↓
SDK
 ↓
authenticated HTTPS / internal binding
 ↓
Service B
 ↓
credential validation
 ↓
IAM authorization
 ↓
operation
```

For asynchronous business state:

```text
Service
 ↓
transaction
 ├── state
 └── outbox
 ↓
relay
 ↓
durable transport
 ↓
idempotent consumer
 ↓
projection/side effect
```

---

# 109. Final Platform Identity Model

```text
                     SUPABASE AUTH
                           │
                           │ authentication
                           ▼
                       IDENTITY
                           │
                           │ subject normalization
                           ▼
                       PRINCIPAL
                 ┌─────────┼─────────┐
                 │         │         │
               human    service  integration
                 │         │         │
                 └─────────┼─────────┘
                           │
                           ▼
                     IAM AUTHORITY
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
            Tenant        Scope       Resource
              │            │            │
              └────────────┼────────────┘
                           ▼
                        Policy
                           │
                           ▼
                     Authorization
```

---

# 110. Final Enterprise Boundary

The complete Figentra platform can be summarized as:

```text
AUTHENTICATION
    Supabase Auth

IDENTITY
    Identity + Principal

BUSINESS CONTEXT
    Tenant + Scope

AUTHORIZATION
    IAM + Policy + Approval

COMMERCIAL ACCESS
    Monetization + Entitlements

EDGE
    Cloudflare + WAF + Gateway + Hono

CONTROL PLANE
    Registry + Manifest + Orchestrator

APPLICATIONS
    CRM + Commerce + POS + Analytics + future products

PLATFORM CAPABILITIES
    Audit + Notifications + Files + Integrations
    Usage + Reporting + Search + Workflow

COMMUNICATION
    HTTPS/OpenAPI + SDK
    Service Bindings
    Durable async transport
    Kafka only when justified

DATA
    PostgreSQL/Supabase
    RLS
    R2/S3
    Search projections
    Reporting read models

RELIABILITY
    Outbox
    Idempotency
    Retry
    DLQ
    Replay
    Workflows

OBSERVABILITY
    Logs
    Metrics
    Traces
    Health
    Readiness

INFRASTRUCTURE
    Terraform
    Docker
    Cloudflare
    Supabase
    Secret management

QUALITY
    TypeScript
    Oxlint
    Prettier
    Vitest
    Playwright
    Contract tests
    Security tests
    Load tests
    DR tests
```

This is the intended Figentra architecture: **one authentication authority, one authorization model, explicit tenant/context boundaries, independent service ownership, typed synchronous contracts, durable asynchronous processing, application-owned business domains, and infrastructure treated as code.**

---

# 111. Architectural Change Rule

Any change that affects one of these boundaries requires an ADR before implementation:

```text
identity provider
principal model
tenant ownership
scope semantics
IAM authorization model
policy engine
approval semantics
entitlement ownership
service ownership
communication protocol
event envelope
outbox guarantees
Gateway trust model
Registry authority
application database ownership
runtime selection
infrastructure ownership
security model
```

Small implementation details do not require an ADR.

Architectural exceptions do.

---

# 112. Closing Definition

**Figentra is an enterprise platform that turns authenticated identities into securely authorized, tenant-scoped business capabilities and exposes those capabilities to independently owned applications through a controlled edge, typed APIs, durable events, and explicit service boundaries.**

Its most important invariant is:

```text
WHO
  → Identity / Principal

WHERE
  → Tenant / Scope

CAN DO WHAT
  → IAM / Policy / Approval

WHAT IS PURCHASED
  → Monetization / Entitlements

WHAT IS ENABLED
  → Registry / Feature Flags

WHAT THE BUSINESS OPERATION MEANS
  → Owning Application/Service

WHAT HAPPENED
  → Events / Audit

HOW IT SURVIVES FAILURE
  → Transactions / Outbox / Durable Transport / Workflows
```

Any new component must fit this model rather than creating a parallel version of one of these authorities.

---

# 113. Service-by-Service Domain Catalog

> The following is the **platform target model**. Where the repository has not yet implemented a physical table/entity, the entry is a required domain specification rather than a claim that the table already exists. Physical schemas must be finalized by service-specific ADR/migration work.

## 113.1 Identity Service

**Purpose:** canonical identity normalization and authentication-provider integration.

### Entities

```text
Identity
├── IdentityIdentifier
├── IdentityProfile
├── IdentityProviderLink
├── IdentitySecurity
└── IdentityLifecycle
```

### Relationships

```text
Identity
 ├── 1..N IdentityIdentifier
 ├── 1..1 IdentityProfile
 ├── 1..N IdentityProviderLink
 └── 1..1 IdentitySecurity
```

### Responsibilities

- consume validated Supabase authentication state
- map provider subject → canonical identity
- maintain profile/identifier metadata
- provider linking/unlinking
- lifecycle/deactivation
- normalized identity events
- provider webhook verification/idempotency
- SSO/SCIM provider integration boundary

### Persistence

```text
identities
identity_identifiers
identity_profiles
identity_provider_links
identity_security
```

Provider-specific session/password storage remains owned by Supabase Auth.

### Seeds

Only safe system/reference configuration. Never seed real credentials or passwords.

### Events

```text
identity.created.v1
identity.updated.v1
identity.disabled.v1
identity.deleted.v1
identity.provider.linked.v1
identity.provider.unlinked.v1
```

---

## 113.2 IAM Service

**Purpose:** authoritative authorization.

### Entities

```text
Permission
Role
RolePermission
PrincipalRoleAssignment
Grant
PolicyBinding
Delegation
AuthorizationDecision
```

### Relationships

```text
Role
 └── N:M Permission

Principal
 └── N:M Role
       through RoleAssignment

Policy
 └── PolicyBinding
      └── resource/scope/context

Delegation
 ├── delegator principal
 ├── delegate principal
 ├── actions
 ├── resources
 ├── scope
 └── validity
```

### APIs

```text
GET  /v1/me/access
GET  /v1/me/applications
POST /v1/authorization/check
POST /v1/authorization/batch
POST /v1/roles
POST /v1/permissions
POST /v1/role-assignments
DELETE /v1/role-assignments/:id
POST /v1/delegations
POST /v1/delegations/:id/revoke
```

### Events

```text
iam.role.created.v1
iam.role.updated.v1
iam.role.assigned.v1
iam.role.revoked.v1
iam.permission.created.v1
iam.permission.updated.v1
iam.policy.binding.changed.v1
iam.delegation.created.v1
iam.delegation.revoked.v1
```

### Migration groups

```text
permissions
roles
role_permissions
principal_role_assignments
grants
policy_bindings
delegations
authorization indexes
```

---

## 113.3 Tenant Service

**Purpose:** authoritative customer/business boundary and domain routing context.

### Entities

```text
Tenant
TenantConfiguration
TenantRegion
TenantResidency
TenantDomain
DomainVerification
TenantApplicationBinding
TenantLifecycle
```

### Relationships

```text
Tenant
 ├── 1..N Domains
 ├── 1..N ApplicationBindings
 ├── 1..1 Configuration
 ├── 1..1 Region/Residency
 └── 1 lifecycle state
```

### Domain mapping

```text
Supabase identity context
       ↓
Tenant mapping
       ↓
Tenant
```

### APIs

```text
GET  /v1/tenants
GET  /v1/tenants/:id
POST /v1/tenants
PATCH /v1/tenants/:id
POST /v1/tenants/:id/suspend
POST /v1/tenants/:id/domains
POST /v1/tenants/:id/domains/:id/verify
```

### Events

```text
tenant.created.v1
tenant.updated.v1
tenant.suspended.v1
tenant.disabled.v1
tenant.deleted.v1
domain.created.v1
domain.verified.v1
domain.activated.v1
domain.suspended.v1
application.enabled.v1
application.disabled.v1
```

### Migration groups

```text
tenants
tenant_configurations
tenant_domains
domain_verifications
tenant_application_bindings
```

---

## 113.4 Scope Service

**Purpose:** dynamic resource context and contextual membership.

### Entities

```text
ScopeType
ScopeNode
ScopeRelation
ScopeMembership
ScopeContext
```

### Relationships

```text
ScopeType
 └── N ScopeNode

ScopeNode
 ├── N:N ScopeNode via ScopeRelation
 └── N:N Principal via ScopeMembership
```

### Examples

```text
Tenant → Organization → Branch → Warehouse
Tenant → Region → Venue → Building → Floor → Zone
```

### APIs

```text
GET  /v1/scope/types
POST /v1/scope/types
GET  /v1/scopes
POST /v1/scopes
GET  /v1/scopes/:id
PATCH /v1/scopes/:id
POST /v1/scopes/:id/members
DELETE /v1/scopes/:id/members/:principalId
```

### Events

```text
scope.type.created.v1
scope.created.v1
scope.updated.v1
scope.deleted.v1
scope.membership.added.v1
scope.membership.removed.v1
scope.relation.created.v1
scope.relation.deleted.v1
```

---

## 113.5 Policy Service

**Purpose:** contextual authorization rules.

### Entities

```text
Policy
PolicyVersion
PolicyBinding
PolicyTestCase
PolicySimulation
PolicyPublication
```

### Lifecycle

```text
draft
 ↓
tested
 ↓
published
 ↓
superseded / rolled_back
```

### APIs

```text
GET  /v1/policies
POST /v1/policies
GET  /v1/policies/:id
POST /v1/policies/:id/test
POST /v1/policies/:id/simulate
POST /v1/policies/:id/publish
POST /v1/policies/:id/rollback
```

### Events

```text
policy.created.v1
policy.updated.v1
policy.published.v1
policy.rolled_back.v1
```

---

## 113.6 Approval Service

**Purpose:** durable human/business approval workflows.

### Entities

```text
ApprovalRequest
ApprovalStep
ApprovalApprover
ApprovalDecision
ApprovalQuorum
ApprovalDelegation
ApprovalEscalation
ApprovalComment
```

### Relationships

```text
ApprovalRequest
 └── 1..N ApprovalStep
      ├── 1..N Approver
      ├── 1..N Decision
      └── optional Quorum
```

### Events

```text
approval.requested.v1
approval.approved.v1
approval.rejected.v1
approval.expired.v1
approval.escalated.v1
approval.cancelled.v1
```

---

## 113.7 Monetization Service

**Purpose:** canonical commercial state.

### Entities

```text
BillingAccount
BillingCustomer
Product
Plan
Price
Subscription
SubscriptionItem
Invoice
Payment
Credit
Tax
Meter
UsageRecord
Entitlement
```

### Relationships

```text
Product
 └── Plan
      └── Price
           └── Subscription
                └── SubscriptionItem

BillingAccount
 └── Customer
      └── Subscription
           └── Invoice
                └── Payment

Subscription
 └── Entitlement
```

### Providers

```text
StripeProvider
PaddleProvider
```

### Events

```text
billing.account.created.v1
subscription.created.v1
subscription.updated.v1
subscription.cancelled.v1
invoice.created.v1
invoice.paid.v1
invoice.failed.v1
payment.succeeded.v1
payment.failed.v1
entitlement.changed.v1
usage.recorded.v1
```

### Webhook rules

Provider event ID + idempotency key + internal event ID must be persisted/checked to prevent duplicate processing.

---

## 113.8 Entitlements Service

**Purpose:** authoritative commercial capability projection/decision boundary where separated from Monetization.

### Entities

```text
EntitlementDefinition
TenantEntitlement
EntitlementOverride
EntitlementGrant
Quota
EntitlementUsage
```

### Relationship

```text
Product/Plan
    ↓
EntitlementDefinition
    ↓
TenantEntitlement
    ├── override
    ├── quota
    └── expiration
```

### APIs

```text
GET /v1/entitlements
GET /v1/entitlements/:key
POST /v1/entitlements/check
POST /v1/entitlements/batch-check
```

### Events

```text
entitlement.granted.v1
entitlement.changed.v1
entitlement.revoked.v1
entitlement.expired.v1
```

---

## 113.9 Usage Service

**Purpose:** durable metering and usage aggregation.

### Entities

```text
UsageEvent
UsageMeter
UsageAggregate
Quota
UsageSnapshot
```

### Flow

```text
Application
 ↓
Usage Event
 ↓
Queue/Event transport
 ↓
Usage processor
 ↓
UsageEvent persistence
 ↓
Aggregation
 ↓
Quota / billing consumption
```

### Events

```text
usage.recorded.v1
usage.aggregated.v1
quota.exceeded.v1
quota.reset.v1
```

---

## 113.10 Notifications Service

**Purpose:** reliable multi-channel delivery.

### Entities

```text
Notification
NotificationTemplate
NotificationPreference
Recipient
Delivery
DeliveryAttempt
ProviderConfiguration
WebhookDelivery
```

### Channels

```text
Email
SMS
Push
In-app
Webhook
```

### Events

```text
notification.requested.v1
notification.sent.v1
notification.delivered.v1
notification.failed.v1
notification.retry.scheduled.v1
```

---

## 113.11 Audit Service

**Purpose:** immutable security/administrative audit ledger.

### Entities

```text
AuditEntry
AuditEventProjection
AuditHashChainState
AuditExport
AuditRetentionPolicy
AuditLegalHold
```

### Relationships

```text
AuditEntry
 ├── principal
 ├── effective principal
 ├── tenant
 ├── scope
 ├── resource
 ├── action
 ├── decision
 ├── request/correlation/trace
 └── previous_hash → current_hash
```

### Persistence

Audit records are append-oriented.

### Events consumed

```text
identity.*
iam.*
tenant.*
application.*
subscription.*
entitlement.*
approval.*
integration.*
infrastructure.*
security.*
```

The exact subscription filter is explicit per deployment rather than subscribing to every event blindly.

---

## 113.12 Files Service

**Purpose:** file metadata and controlled object storage lifecycle.

### Entities

```text
File
FileVersion
FileObject
Upload
FileReference
FileAccessGrant
FileRetentionPolicy
```

### Storage

```text
PostgreSQL metadata
      +
R2/S3 object storage
```

### Events

```text
file.created.v1
file.version.created.v1
file.deleted.v1
file.retention.changed.v1
```

---

## 113.13 Integrations Service

**Purpose:** external system installations and connections.

### Entities

```text
Integration
IntegrationVersion
IntegrationInstallation
Connection
CredentialReference
IntegrationConfiguration
WebhookEndpoint
WebhookSubscription
IntegrationCapability
```

### Lifecycle

```text
discovered
installed
authorizing
configured
active
disabled
revoked
uninstalled
```

### Events

```text
integration.installed.v1
integration.connected.v1
integration.disconnected.v1
integration.credential.rotated.v1
integration.uninstalled.v1
```

---

## 113.14 Reporting Service

**Purpose:** execute reports over canonical facts/read models.

### Entities/metadata

```text
FactDefinition
ReportDefinition
ReportExecution
ReportSchedule
ReportExport
ReportReadModel
```

### Flow

```text
Application events/data
 ↓
Facts
 ↓
Read models
 ↓
Reports
 ↓
Export / dashboard / schedule
```

Reporting never becomes the transactional source of truth.

---

## 113.15 Search Service

**Purpose:** search projection and query boundary where centralized search is justified.

### Logical entities

```text
SearchDefinition
SearchIndexDefinition
SearchDocumentProjection
SearchQuery
SearchSynonym
```

### Providers

```text
Meilisearch initially
OpenSearch when justified
```

PostgreSQL remains the source of truth.

---

## 113.16 Workflow Service / Capability

**Purpose:** durable orchestration where workflows cross multiple steps or require compensation/human waits.

### Logical entities

```text
WorkflowDefinition
WorkflowExecution
WorkflowStep
WorkflowAttempt
WorkflowSignal
WorkflowCompensation
WorkflowTimer
```

The implementation may live in the owning service or a dedicated runtime depending on operational complexity.

Do not create a generic Workflow Service merely to rename ordinary background jobs.

---

# 114. Cross-Service Relationship Model

The most important cross-service relationships are:

```text
Supabase Auth
   │
   ▼
Identity
   │
   ▼
Principal
   │
   ├──────────────► IAM
   │                  │
   │                  ├── Role
   │                  ├── Permission
   │                  ├── Policy
   │                  └── Delegation
   │
   ▼
Tenant
   │
   ├── Domain
   ├── Application Access
   └── Scope
          │
          └── Scope Membership

Tenant
   │
   ▼
Monetization
   │
   ├── Subscription
   ├── Billing Account
   └── Entitlements

Application
   │
   ├── Business Entities
   ├── API
   ├── Events
   ├── Usage
   ├── Search projections
   └── Reporting facts

All security/admin state transitions
   ↓
Audit
```

---

# 115. Event-to-Service Responsibility Matrix

| Event family | Producer | Typical consumers |
|---|---|---|
| `identity.*` | Identity | IAM, Tenant, Audit, Notifications |
| `principal.*` | Identity | IAM, Audit |
| `credential.*` | Identity/Security | Audit, IAM |
| `tenant.*` | Tenant | IAM, Monetization, Notifications, Audit, Registry |
| `domain.*` | Tenant | Gateway, Registry, Notifications, Audit |
| `scope.*` | Scope | IAM, applications, Audit |
| `iam.*` | IAM | Audit, Gateway cache, applications |
| `policy.*` | Policy | IAM, Audit |
| `approval.*` | Approval | owning application, Audit, Notifications |
| `subscription.*` | Monetization | Entitlements, Usage, Notifications, Audit |
| `entitlement.*` | Monetization/Entitlements | IAM, applications, Gateway, Audit |
| `usage.*` | Usage | Monetization, Reporting, Audit where required |
| `notification.*` | Notifications | Audit, reporting where required |
| `integration.*` | Integrations | Applications, Audit, Notifications |
| `file.*` | Files | Applications, Search, Audit where required |
| `application.*` | Registry/application | Gateway, Portal, Audit |
| `provisioning.*` | Workflow/Tenant/Orchestrator | Tenant, IAM, Monetization, Registry, Notifications, Audit |
| `infrastructure.*` | Orchestrator | Audit, Registry, operations |

---

# 116. End-to-End Tenant Provisioning

The canonical provisioning workflow is:

```text
Create tenant request
        ↓
Gateway authentication
        ↓
IAM authorization
        ↓
Tenant Service
        ↓
Tenant transaction
        ├── tenant record
        └── outbox: tenant.created.v1
        ↓
Durable transport
        ↓
Provisioning workflow
        ├── Identity mapping
        ├── default IAM roles
        ├── default Scope
        ├── Billing Account
        ├── default Entitlements
        ├── application access
        └── welcome notification
        ↓
provisioning.completed.v1
```

Each step is idempotent and independently retryable.

---

# 117. End-to-End Authenticated Request

```text
Browser / API Client
        ↓
Cloudflare Edge
        ↓
WAF / rate limit
        ↓
Gateway
        ↓
Supabase JWT validation
        ↓
Identity normalization
        ↓
Tenant resolution
        ↓
Scope resolution
        ↓
IAM authorization
        ↓
Policy evaluation
        ↓
Entitlement check
        ↓
Application API
        ↓
Application authorization/business rules
        ↓
Database/RLS
        ↓
response
```

For a mutation that creates a durable business fact:

```text
Application transaction
 ├── state change
 └── outbox event
       ↓ commit
      relay
       ↓
      transport
       ├── Audit
       ├── Usage
       ├── Notifications
       ├── Search
       ├── Reporting
       └── Integrations
```

---

# 118. End-to-End Service Request

```text
Service A
  ↓
SDK
  ↓
service identity credential
  ↓
audience-restricted JWT
  ↓
HTTPS / Service Binding
  ↓
Service B
  ↓
JWT validation
  ↓
principal/service identity
  ↓
IAM authorization
  ↓
operation
```

A service credential proves **who the caller is**.

IAM determines **what that service may do**.

---

# 119. End-to-End Event Request

```text
Command / domain operation
       ↓
service transaction
       ├── state
       └── outbox
              ↓ commit
           relay
              ↓
      durable transport
              ↓
       consumer receives
              ↓
      validate envelope
              ↓
      validate schema
              ↓
      idempotency check
              ↓
       process effect
              ↓
          ACK
```

Failure:

```text
consumer failure
 ↓
retry
 ↓
backoff
 ↓
retry limit
 ↓
DLQ
 ↓
operator diagnosis
 ↓
controlled replay
```

---

# 120. Database Migration and Seeding Contract

Every stateful service must define:

```text
migration ownership
migration execution command
migration ordering
rollback strategy
seed strategy
production safety policy
```

A migration must be deterministic and reviewable.

A seed must be idempotent where repeated execution is supported.

Production seeds are limited to safe platform/reference data.

Application customer data is never manufactured by a generic platform seed.

---

# 121. Service-Level Production Checklist

Every stateful service is production-ready only when it has:

```text
[ ] bounded context documented
[ ] owner documented
[ ] data ownership documented
[ ] entities documented
[ ] relations documented
[ ] migrations
[ ] indexes
[ ] constraints
[ ] seeds where required
[ ] HTTP contract
[ ] SDK client
[ ] authentication
[ ] authorization
[ ] tenant isolation
[ ] events
[ ] outbox
[ ] idempotency
[ ] retries
[ ] DLQ where async
[ ] logging
[ ] metrics
[ ] traces
[ ] health
[ ] readiness
[ ] unit tests
[ ] integration tests
[ ] contract tests
[ ] security tests
[ ] E2E where applicable
[ ] Docker/container contract where applicable
[ ] cloud.yaml
[ ] infrastructure module
[ ] runbook
[ ] rollback procedure
```

---

# 122. Gateway Production Checklist

```text
[ ] official Hono/Wrangler runtime
[ ] typed environment bindings
[ ] request ID
[ ] correlation ID
[ ] traceparent
[ ] CORS
[ ] security headers
[ ] authentication
[ ] JWKS validation
[ ] issuer validation
[ ] audience validation
[ ] expiry validation
[ ] tenant resolution
[ ] IAM authorization
[ ] entitlement integration
[ ] rate limiting
[ ] route registry
[ ] service discovery
[ ] typed SDK clients
[ ] upstream timeout
[ ] bounded safe retries
[ ] idempotency propagation
[ ] upstream error normalization
[ ] circuit breaking where justified
[ ] health
[ ] readiness
[ ] observability
[ ] Worker tests
[ ] integration tests
[ ] contract tests
[ ] E2E tests
[ ] security tests
[ ] Wrangler environment configuration
[ ] Terraform resources
[ ] WAF configuration
[ ] production rate-limit policy
[ ] secret bindings
```

---

# 123. Registry Production Checklist

```text
[ ] D1 schema
[ ] migrations
[ ] seeds/reference data
[ ] application registration
[ ] application versions
[ ] environments
[ ] deployment metadata
[ ] capabilities
[ ] manifests
[ ] modules
[ ] resources
[ ] routes
[ ] permissions
[ ] events
[ ] branding metadata
[ ] manifest hash
[ ] registration authentication
[ ] CI/service-principal policy
[ ] idempotent registration
[ ] version compatibility
[ ] D1 indexes
[ ] KV caching where justified
[ ] cache invalidation
[ ] Worker tests
[ ] integration tests
[ ] contract tests
[ ] security tests
```

---

# 124. Orchestrator Production Checklist

```text
[ ] authenticated API
[ ] service identity
[ ] IAM authorization
[ ] approval gate
[ ] Terraform plan
[ ] plan artifact
[ ] state locking
[ ] apply protection
[ ] environment protection
[ ] runner isolation
[ ] runner secrets
[ ] operation lifecycle
[ ] cancellation
[ ] timeout
[ ] retry
[ ] rollback
[ ] audit event
[ ] observability
[ ] integration tests
[ ] security tests
[ ] staging rehearsal
[ ] production approval
```

---

# 125. Final Ownership Rules

If a new feature asks:

### Who is the user?

Identity.

### What authentication provider is used?

Supabase Auth.

### What is the authorization subject?

Principal.

### Which customer/business?

Tenant.

### Which organizational/resource context?

Scope.

### Can the subject perform the action?

IAM.

### Are contextual conditions required?

Policy.

### Does a human approval need to happen?

Approval.

### Does the tenant own the commercial capability?

Monetization / Entitlements.

### Is the release operationally enabled?

Feature Flags.

### Which application owns the business operation?

The application/domain service.

### Where is the application metadata?

Application Registry projection.

### Who delivers notifications?

Notifications Service.

### Where are security/admin facts recorded?

Audit.

### Where are durable business events produced?

Owning service transaction + Outbox.

### How do services synchronously communicate?

Authenticated HTTPS/OpenAPI + typed SDK.

### How do Workers communicate internally?

Cloudflare Service Bindings where applicable.

### How does durable async work?

The selected durable queue/event transport; NATS/JetStream where that is the deployed Node transport, Cloudflare Queues for Cloudflare-native async workloads, and Kafka only for justified high-volume streaming.

### Where is infrastructure defined?

Terraform.

### Where are deployment capabilities declared?

`cloud.yaml` and generated infrastructure metadata.

---

# 126. Final Invariants

The following are non-negotiable platform invariants:

1. **Supabase Auth is the day-one authentication provider.**
2. **Identity is the authentication normalization boundary.**
3. **Principal is the canonical authorization subject.**
4. **There is no universal Person/User/Actor hierarchy.**
5. **Tenant is the customer/business isolation boundary.**
6. **Scope is contextual and cannot grant authority by itself.**
7. **IAM owns authorization.**
8. **Policy owns contextual authorization rules.**
9. **Approval is distinct from permission.**
10. **Monetization owns commercial state.**
11. **Entitlement is distinct from permission.**
12. **Applications own business data and business rules.**
13. **Every service owns its persistence boundary.**
14. **No direct cross-service database writes.**
15. **PostgreSQL is transactional source of truth.**
16. **RLS is defense in depth.**
17. **The Gateway is an edge boundary, not a business backend.**
18. **The Registry is metadata/control plane, not a business database.**
19. **SDKs own reusable service clients.**
20. **Contracts remain framework-neutral.**
21. **HTTP/OpenAPI is the default synchronous service contract.**
22. **Every service-to-service request is authenticated.**
23. **Service credentials are scoped and audience-restricted.**
24. **User tokens are not blindly forwarded.**
25. **Events represent durable business facts, not every HTTP request.**
26. **State-changing events use transactional outbox.**
27. **Consumers are idempotent.**
28. **Retries are bounded.**
29. **Poison messages reach a DLQ.**
30. **Secrets never enter source, manifests, Registry, images or logs.**
31. **Webhook processing is signed/verified and idempotent.**
32. **Audit records are append-oriented and protected from normal mutation.**
33. **Registry outage must not prevent application startup.**
34. **Generated artifacts have a clear source of truth.**
35. **Development, staging and production are the canonical environment names.**
36. **Terraform is the infrastructure source of truth.**
37. **Oxlint is the canonical linter.**
38. **Prettier is the canonical formatter.**
39. **TypeScript strictness is mandatory.**
40. **All public contracts are versioned.**
41. **All durable events are versioned.**
42. **All protected operations are server-side authorized.**
43. **UI visibility is never a security boundary.**
44. **AI agents must obey these ownership and security boundaries.**
45. **Architectural exceptions require ADRs.**

---

# 127. Architecture Completion Definition

Figentra is architecturally complete when every implemented component can answer all of the following without ambiguity:

```text
Who owns this data?
Who authenticates this request?
Who is the principal?
Which tenant is active?
Which scope is active?
Which permission is required?
Which policy applies?
Is approval required?
Which entitlement applies?
Which application owns the business rule?
Which API contract is used?
Which event is emitted?
Which outbox transaction guarantees it?
Which consumer owns the side effect?
How is duplicate delivery handled?
How is failure retried?
Where does the message go after failure?
How is the operation audited?
How is it observed?
How is it migrated?
How is it seeded?
How is it tested?
How is it deployed?
How is it rolled back?
How is it recovered after disaster?
```

If any of these questions has no explicit owner or contract, the component is not considered enterprise-complete.

---

# 128. Canonical Mental Model

```text
                         SUPABASE AUTH
                              │
                              ▼
                           IDENTITY
                              │
                              ▼
                           PRINCIPAL
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
                  TENANT              SERVICE
                    │                IDENTITY
                    ▼                   │
                  SCOPE                ▼
                    │                  IAM
                    └────────┬─────────┘
                             ▼
                          POLICY
                             │
                             ▼
                         APPROVAL
                             │
                             ▼
                    ENTITLEMENT CHECK
                             │
                             ▼
                         APPLICATION
                             │
                ┌────────────┼────────────┐
                ▼            ▼            ▼
            PostgreSQL     Outbox       Files
                │            │
                │            ▼
                │        Event Transport
                │            │
                │     ┌──────┼─────────────┐
                │     ▼      ▼      ▼      ▼
                │   Audit  Usage  Notify Search
                │                    │
                └────────────────────┘

                    EDGE / CONTROL PLANE

       Cloudflare WAF → Gateway → SDK → Services
                              │
                              ├── Registry
                              └── Orchestrator

                    INFRASTRUCTURE

          Terraform → Cloudflare / Supabase / Docker
```

**This document is the single consolidated explanation of what Figentra is intended to be, how its components fit together, where each boundary lives, and what production-grade implementation must preserve.**


---

# 82. Kiro Component Specification Set

This directory is the implementation-ready decomposition of this platform contract.
The root `README.md` is the architectural source of truth; the numbered component files
are execution specifications for one deployable, service, package, worker, application,
or external Stackra dependency. A component specification MUST cover the complete
lifecycle: scaffold → dependencies → configuration → source layout → domain model →
API/events/commands → persistence/migrations/seeds → security → caching →
observability → testing → deployment → operations → documentation → acceptance criteria.

## Component index

### Services

| # | Component | Package | Primary responsibility |
|---|---|---|---|
| 01 | Identity | `@figentra/identity` | Platform principal and identity normalization over Supabase Auth |
| 02 | Tenant | `@figentra/tenant` | Tenant lifecycle, organization mapping, domains and tenant configuration |
| 03 | Scope | `@figentra/scope` | Hierarchical scope/context resolution and assignments |
| 04 | IAM | `@figentra/iam` | Roles, permissions, grants and authorization decisions |
| 05 | Policy | `@figentra/policy` | Contextual policies and policy evaluation |
| 06 | Approval | `@figentra/approval` | Approval definitions, requests, decisions and escalation |
| 07 | Monetization | `@figentra/monetization` | Catalog, plans, subscriptions, billing and commercial hierarchy |
| 08 | Entitlements | `@figentra/entitlements` | Effective capabilities, quotas and overrides |
| 09 | Usage | `@figentra/usage` | Raw usage, metering and aggregation |
| 10 | Notifications | `@figentra/notifications` | Email/SMS/push/in-app/webhook delivery |
| 11 | Audit | `@figentra/audit` | Immutable security/platform audit trail |
| 12 | Files | `@figentra/files` | Object metadata, upload/download policy and R2 integration |
| 13 | Integrations | `@figentra/integrations` | Integration catalog, installations, credentials and webhooks |
| 14 | Reporting | `@figentra/reporting` | Facts, report execution, exports and scheduled reporting |
| 15 | Search | `@figentra/search` | Search abstraction and projection/index management |
| 16 | Workflow | `@figentra/workflow` | Durable workflow definitions/execution facade |

### Workers

| # | Worker | Package |
|---|---|---|
| 01 | Gateway | `@figentra/api-gateway` |
| 02 | Application Registry | `@figentra/application-registry` |
| 03 | Infrastructure Orchestrator | `@figentra/infrastructure-orchestrator` |

### Applications

| # | Application | Package |
|---|---|---|
| 01 | Portal | `@figentra/portal` |
| 02 | Family | `@figentra/family` |
| 03 | Landing Page | `@figentra/landing-page` |

### Platform packages

| # | Package | Package name |
|---|---|---|
| 01 | Contracts | `@figentra/contracts` |
| 02 | Events | `@figentra/events` |
| 03 | Identity contracts | `@figentra/identity-contracts` |
| 04 | IAM contracts | `@figentra/iam-contracts` |
| 05 | Messaging | `@figentra/messaging` |
| 06 | Observability | `@figentra/observability` |
| 07 | Outbox | `@figentra/outbox` |
| 08 | Registry | `@figentra/registry` |
| 09 | SDK | `@figentra/sdk` |
| 10 | Security | `@figentra/security` |

### Shared Stackra dependencies

The exact published Stackra package names are recorded separately in `stackra/` and
MUST be treated as external dependencies rather than copied/reimplemented in Figentra.
The platform uses Stackra primitives where they already own the concern, especially
UI, query/server state, testing, container/discovery, dashboard and browser events.

## Universal component checklist

Every component specification MUST answer all of these questions before implementation:

1. What does it own? What can it read? What must it never own?
2. What are its entities, value objects, aggregates, relations and lifecycle states?
3. What are the database tables, columns, constraints, indexes, foreign keys and RLS rules?
4. What migrations are required and in what order?
5. What seed data is mandatory, deterministic and environment-specific?
6. What HTTP endpoints/controllers/OpenAPI schemas exist?
7. What commands, queries, domain events, integration events and audit events exist?
8. What synchronous dependencies exist and what async dependencies exist?
9. How are service-to-service calls authenticated and authorized?
10. Which middleware/guards/interceptors/pipes belong in the service and which belong at the gateway?
11. Where is authorization evaluated: gateway, service, repository/RLS, or multiple layers?
12. What is cached, where, with what key, TTL, invalidation and consistency model?
13. When is `EntityManager` allowed and when must repositories be used?
14. What transactions are required and where is the outbox written?
15. What retries, idempotency keys, deduplication and DLQs are required?
16. What telemetry, audit fields, correlation IDs and security events are emitted?
17. What i18n/localization content is owned by the component?
18. What configuration/env/secrets are required?
19. What unit, integration, contract, E2E, security and migration tests are required?
20. What operational runbooks and failure modes must be documented?
21. What comments/JSDoc/docblocks are required for public APIs and non-obvious domain rules?
22. What are the acceptance criteria and explicit non-goals?

## Boundary rules

- Gateway performs edge concerns; services remain independently secure.
- A service MUST authenticate protected requests even when they came through the gateway.
- Never trust tenant IDs, scope IDs, actor IDs or permissions supplied by a browser.
- Repositories are the normal persistence abstraction; `EntityManager` is reserved for
  transaction orchestration, cross-aggregate writes within one owned database, bulk work,
  and infrastructure-level operations where repository APIs are insufficient.
- No cross-service database access.
- No shared ORM entities between services.
- OpenAPI is the HTTP contract; SDKs consume contracts and do not expose internal repositories.
- Cloudflare Queues/Workflows are the initial asynchronous platform mechanisms. Redis is
  cache/coordination only. Kafka/NATS/gRPC are not introduced unless an ADR establishes
  a measured requirement.
- Every durable state transition that publishes an integration event uses a transactional outbox.
- RLS is defense in depth, not a replacement for application authorization.
- UI visibility is never a security boundary.
- Secrets never appear in manifests, browser runtime configuration or logs.

## Implementation order

1. Repository/tooling baseline.
2. Contracts, security, identity and messaging primitives.
3. Identity → Tenant → Scope → IAM → Policy → Approval.
4. Monetization → Entitlements → Usage.
5. Audit/Notifications/Files/Integrations.
6. Registry/Gateway/Workflow/Reporting/Search.
7. Portal and product applications.
8. Infrastructure automation, production hardening and disaster-recovery validation.



# 83. Canonical transport decision — final

Figentra uses multiple transports intentionally:

| Concern | Canonical mechanism | Why |
|---|---|---|
| Browser → Gateway | HTTPS | public request/response |
| Gateway → Worker | Cloudflare Service Binding | private edge-to-edge call |
| Gateway → Container | authenticated HTTPS | stable service API |
| Service → Service sync | HTTPS + OpenAPI + typed SDK | explicit request/response contract |
| Service → Service async | **NATS JetStream** | durable events/commands, replay and consumer groups |
| Worker/edge async | **Cloudflare Queues** | Cloudflare-native retries, buffering and DLQ |
| Cache/coordination | Redis | non-authoritative low-latency state |
| Multi-step durable process | Cloudflare Workflows | long-running orchestration |
| gRPC | Not default | introduce only by ADR for measured RPC need |
| Kafka | Deferred | introduce only for proven high-volume stream/analytics requirements |

NestJS `@nestjs/microservices` is used selectively as a NATS transport integration for
message producers/consumers. It is not the universal RPC abstraction.

All service event publication follows transactional outbox → relay → NATS JetStream.
Workers that need edge-native async processing use Cloudflare Queues instead of NATS.
