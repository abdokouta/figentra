# Cline Rule: Cloudflare and AWS Boundaries

## Cloudflare owns the edge
Cloudflare owns DNS, WAF, CDN/static assets, public edge rate limiting, request normalization, Gateway routing, edge token prevalidation, and the Application Registry/edge control plane.

Canonical independent Cloudflare Workers:
- Gateway — Cloudflare Worker + Hono.
- Application Registry — Cloudflare Worker + Hono + D1, optional KV cache.
- Infrastructure Orchestrator — independent control-plane Worker.

Do not add a generic SDUI Worker. SDUI rendering is an application/package concern; page persistence, revisions and publication remain in the owning NestJS application/service.

## AWS owns business compute
Core Figentra business capabilities run as NestJS application modules on AWS ECS. Use PostgreSQL for authoritative relational state, Redis for cache/coordination, NATS JetStream for durable async messaging, S3 for object storage, AWS Secrets Manager for production secrets, and Terraform for infrastructure.

## Gateway is not business authority
Gateway performs edge admission and transport concerns. It never replaces service-side authentication, tenant validation, IAM authorization, commercial entitlement checks, domain validation, idempotency semantics, webhook signature verification, or business persistence.

## Registry is metadata only
Registry describes the application. Services own the truth. Registry may store versioned manifests for routes, capabilities, permissions, resources, events, navigation, widgets, dashboards, reports, search/realtime metadata and configuration schemas. It must never store executable code, SQL, secrets, provider credentials, or live business data.

Registry publication is asynchronous/idempotent and must not be a startup hard dependency for business services.

## SPA
Prefer Cloudflare Workers Static Assets for Figentra SPAs. The SPA calls the public Gateway; it does not call privileged ECS endpoints directly.

## Deployment
Keep development, staging and production isolated. Infrastructure changes are Terraform-managed and reviewed. Do not introduce AWS API Gateway, Vercel, Kubernetes, Kafka, Doppler, or another platform merely because it exists; add an ADR-backed dependency only when a concrete requirement justifies it.
