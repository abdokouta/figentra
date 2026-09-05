# Infrastructure Orchestrator — Configuration Contract

Required configuration is validated at startup; secrets are Worker/runner secret bindings only.

| Setting | Purpose | Secret |
|---|---|---|
| `INFRA_ENVIRONMENT` | runtime environment | no |
| `INFRA_APPLICATION` | Worker identity | no |
| `INFRA_STATE_STORE` | operation-state binding | no |
| `INFRA_QUEUE` | durable execution queue | no |
| `INFRA_REGISTRY_BINDING` | Registry metadata target | no |
| `INFRA_IDENTITY_ISSUER` | trusted identity issuer | no |
| `INFRA_IDENTITY_AUDIENCE` | token audience | no |
| `INFRA_JWKS_URL` | verification keys | no |
| `INFRA_OPERATION_TIMEOUT_MS` | execution deadline | no |
| `INFRA_MAX_ATTEMPTS` | bounded retries | no |
| `INFRA_PLAN_MAX_BYTES` | plan/artifact metadata limit | no |
| `INFRA_PROVIDER_POLICY` | allowlist policy version | no |
| `INFRA_TERRAFORM_RUNNER` | approved runner identity | no |

Provider credentials, state backend credentials and runner secrets are secret bindings and are isolated per environment. Configuration changes are reviewed, versioned and deployed through IaC. Missing security-critical configuration prevents privileged operations rather than silently applying unsafe defaults.