# Cline Rule: Implementation Context

## Current target architecture
Figentra is being built module-first. The preferred initial backend shape is one modular NestJS application with independently scalable `api`, `worker`, and `scheduler` runtimes. The canonical domain ownership model remains the 14 capabilities documented in the platform architecture.

This does not prohibit future service extraction. It prohibits premature service proliferation.

## Runtime infrastructure
- Edge: Cloudflare DNS/WAF/CDN.
- Gateway: Cloudflare Worker + Hono.
- Registry: Cloudflare Worker + Hono + D1, optional KV cache.
- Infrastructure Orchestrator: independent Cloudflare control-plane Worker.
- Backend compute: AWS ECS.
- Database: PostgreSQL.
- Cache/coordination: Redis.
- Durable messaging: NATS JetStream.
- Object storage: S3.
- Secrets: AWS Secrets Manager.
- Infrastructure as code: Terraform.
- Telemetry contract: OpenTelemetry.

Do not introduce AWS API Gateway, Vercel, Kubernetes, Kafka, Doppler, or another overlapping platform without an ADR and a concrete requirement.

## Module/runtime example
```text
apps/figentra/
  src/
    modules/
      identity/
      tenant/
      iam/
      monetization/
      usage/
      workflow/
      notifications/
      audit/
      files/
      integrations/
      search/
      reporting/
      analytics/
      marketing/
    runtime/
      api/
      worker/
      scheduler/
```

A module may register HTTP controllers, NATS consumers, jobs and schedules. The runtime executes those registrations. The runtime does not own the business behavior.

## Cross-boundary communication
Within the modular application, use explicit module contracts and events. If/when a module becomes an independently deployed service, use the existing cross-service contracts and HTTPS/OpenAPI or NATS semantics rather than importing implementation code.

## Agent objective
Optimize for the simplest architecture that satisfies enterprise requirements. Enterprise quality means strong boundaries, security, reliability, observability, auditability, migrations, testing and operational discipline—not maximum number of services.
