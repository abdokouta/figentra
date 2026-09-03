# Worker Plans

Data-plane worker plans. Workers process asynchronous ingestion, aggregation, scheduling, provider calls, retries/DLQs, reconciliation, indexing, and other bounded background workloads.

Workers must use explicit execution context and avoid process-global mutable tenant/request/credential state. Cloudflare Workers remain provider-native; Docker is used where a worker is container-deployed.

Current Kiro worker specifications: gateway, registry, and infrastructure-orchestrator. Additional data-plane workers are planned for audit, analytics, tracking, notifications, marketing, search, media, and other asynchronous capabilities as their service boundaries mature.
