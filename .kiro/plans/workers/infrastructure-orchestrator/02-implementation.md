# Infrastructure Orchestrator — Implementation Contract

```text
workers/infrastructure-orchestrator/
├── src/index.ts
├── src/bootstrap/{app,config,bindings,shutdown}.ts
├── src/context/{request,principal,tenant,environment}.ts
├── src/domain/{operation,execution,deployment,reconciliation,artifact,resource,policy}.ts
├── src/application/{commands,queries,services}.ts
├── src/routes/{health,operations,deployments,reconcile,plans}.ts
├── src/iac/{terraform,plan,artifact,state,policy}.ts
├── src/providers/{cloudflare,aws,container,terraform}.ts
├── src/queue/{dispatch,handlers,retry,dlq}.ts
├── src/security/{auth,authorization,allowlist,secrets}.ts
├── src/persistence/{d1,repository,idempotency}.ts
└── src/observability/{logging,tracing,metrics}.ts
├── migrations/
├── test/{unit,integration,contract,e2e,security,load,recovery}/
├── wrangler.toml
└── package.json
```

Every command handler follows validate → authorize → idempotency → durable operation creation → enqueue. Every worker follows claim/lock → execute bounded action → persist outcome → acknowledge. Provider adapters normalize provider errors into stable orchestrator errors.

The Worker never executes untrusted shell text. Terraform execution occurs through an explicitly controlled runner/execution boundary with approved workspace, artifact digest, state backend, provider configuration and policy. The Worker API can request/track execution but cannot accept arbitrary executable input.

Graceful shutdown, request deadlines, queue acknowledgements, durable state transitions, secret redaction and structured telemetry are mandatory.