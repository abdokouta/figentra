# Registry — Configuration Contract

Required configuration is schema-validated at startup and separated by environment.

| Setting | Purpose | Secret |
|---|---|---|
| `REGISTRY_ENVIRONMENT` | environment identity | no |
| `REGISTRY_APPLICATION` | Worker identity | no |
| `D1_DATABASE_BINDING` | authoritative D1 binding | no |
| `KV_CACHE_BINDING` | disposable cache binding | no |
| `REGISTRY_ISSUER` | trusted token issuer | no |
| `REGISTRY_AUDIENCE` | token audience | no |
| `REGISTRY_JWKS_URL` | verification keys | no |
| `REGISTRY_MAX_MANIFEST_BYTES` | payload limit | no |
| `REGISTRY_RATE_LIMIT_POLICY` | edge policy reference | no |
| `REGISTRY_SCHEMA_VERSION` | supported manifest schema | no |

Secrets use Cloudflare secret bindings and are never committed. Production, staging and development bindings are isolated. Configuration validation rejects missing/invalid required values and readiness reports configuration failures safely without revealing secret values.

Operational tunables include D1/query timeouts, cache TTLs, pagination limits, publication limits, rate-limit thresholds and telemetry sampling. Defaults are explicit and environment-safe.