# 15 — Runtime and Infrastructure

**Status: FOUNDATION**

## Language

Default: TypeScript.

Reasons:
- shared contracts
- frontend/backend alignment
- AI-assisted development
- Hono
- Node.js ecosystem
- Cloudflare support

Go is allowed when profiling or operational requirements justify it.

Laravel remains valid for existing PHP business systems but is not the default for new Figentra platform services.

## Hono

Use for:
- Workers
- edge APIs
- gateway
- webhooks
- lightweight services

## Node.js / containers

Use when:
- persistent process
- heavy runtime
- filesystem/native dependencies
- long-running workers
- larger libraries
- container workload

## Cloudflare

Workers for lightweight edge execution.

Containers for containerized workloads that benefit from Cloudflare's network/runtime.

Cloudflare is not automatically the answer for every service.

## AWS

ECS for long-running container services.

Lambda for suitable event-driven functions.

SQS/SNS/EventBridge for AWS-native messaging.

Kafka/MSK only for genuine streaming needs.

## Terraform

Infrastructure must be:
- declarative
- version controlled
- reviewed
- reproducible
- auditable

Application deployment can trigger controlled Terraform workflows through a deployment service/API. The application must not gain unrestricted infrastructure credentials.

## Database

PostgreSQL is the primary transactional database.

Supabase may provide managed PostgreSQL and associated infrastructure.

Supabase Auth is not the V1 authentication authority.

## Redis

Use for:
- cache
- rate limit
- ephemeral coordination

Never authoritative security state.

## Search

Start with PostgreSQL where adequate.

Use Meilisearch/OpenSearch when search requirements justify it.

Search indexes are derived data.

## Service deployment principle

Do not create 20 deployables on day one.

Use bounded modules and split only when justified.
