# Technology Decision Matrix

| Concern | Preferred V1 | Alternatives | Principle |
|---|---|---|---|
| Human authentication | Supabase Auth | Clerk, Entra, Auth0 | don't build auth |
| Identity DB | Supabase PostgreSQL | external PostgreSQL | Figentra canonical model |
| Authorization | Figentra IAM | Cedar/OPA/etc. engine | own authorization contract |
| Policy engine | Figentra IAM Policy model | Cedar, OPA, CEL | policy remains owned by Figentra IAM; external engines require an ADR |
| API runtime | Hono/TypeScript | Node, Go, Laravel | workload driven |
| Edge | Cloudflare Workers | AWS Lambda/API Gateway | lightweight edge |
| Containers | Cloudflare Containers / AWS ECS | Kubernetes | operational need |
| DB | Supabase PostgreSQL | external PostgreSQL | transactional source |
| Cache | Redis | provider KV | non-authoritative cache |
| Search | PostgreSQL/Meilisearch | OpenSearch | requirements driven |
| Messaging | NATS JetStream for service-to-service events; CF Queues for Worker background work | Kafka | durable S2S events use NATS; edge jobs use provider-native queues |
| Billing | Stripe/Paddle | others | provider adapter |
| Workflow | Cloudflare Workflows | Step Functions, Temporal | Worker-native durable orchestration; Terraform execution remains isolated in the runner |
| UI | Vite/React/HeroUI | — | explicit application UI |
| Routing | React Router 7 | — | application-owned routes |
| Data querying | internal Query package | — | avoid Refine overlap |
| IaC | Terraform | Pulumi | current standard |
