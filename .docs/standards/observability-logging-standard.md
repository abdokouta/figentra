# Figentra Observability, Logging, and Telemetry Standard

## Runtime matrix

| Runtime | Logging | Technical telemetry | Container |
| --- | --- | --- | --- |
| NestJS | `nestjs-pino` / Pino | NestJS Observe | Nest DI |
| Cloudflare Worker | Hono structured logger + Pino | Worker runtime telemetry | Hono |
| Vite | `@stackra/logger` | application telemetry adapter | `@stackra/container` |
| Expo/native | `@stackra/logger` | application telemetry adapter | `@stackra/container` |

## Rules

- Structured logs only.
- No direct `console.*` in application runtime source.
- Request, correlation, and trace identifiers propagate across boundaries.
- Secrets and credentials are redacted.
- Production logs are emitted to stdout/runtime logging.
- Nest Observe is technical telemetry, not the audit ledger.
- Audit Service owns durable security/business audit records.
- No generic telemetry forwarding microservice.
- Cloudflare Workers must not use Node-only Pino transports.
- Browser/native code must not import server Pino directly.
