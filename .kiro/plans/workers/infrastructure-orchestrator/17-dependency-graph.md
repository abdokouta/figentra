# Infrastructure Orchestrator — Dependency Graph

```text
Client/Control Plane
        ↓
API Gateway
        ↓
Infrastructure Orchestrator
   ├── IAM / Identity trust
   ├── durable operation store
   ├── durable queue
   ├── controlled Terraform runner
   ├── approved provider adapters
   ├── Registry (deployment metadata)
   └── Audit (governance evidence)
```

Terraform runner/provider APIs are execution dependencies; Terraform state/provider control planes remain infrastructure authority. Registry is metadata publication, not execution authority. Workflow is not used as a substitute for infrastructure execution.

Compile-time dependencies must remain acyclic. Runtime dependencies are classified as hard (operation persistence/queue for async execution) or soft (Registry metadata publication, telemetry). No provider adapter may call an arbitrary service or endpoint. No business service may gain infrastructure credentials through this component.