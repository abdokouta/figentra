---
authored_by: kiro
status: canonical-index
runtime: cloudflare-worker
---

# API Gateway

The API Gateway is an independent Cloudflare Worker + Hono edge application. It is not a NestJS business service.

The complete implementation contract lives in `.kiro/plans/workers/gateway/`.

## Canonical plan set

See:

- `README.md`
- `01-architecture.md`
- `02-implementation.md`
- `03-routing-and-upstreams.md`
- `04-request-response-pipeline.md`
- `05-authentication-and-security.md`
- `06-rate-limits-cache-and-traffic-control.md`
- `07-registry-and-discovery.md`
- `08-realtime-streaming-and-files.md`
- `09-observability.md`
- `10-resilience-and-failure.md`
- `11-api-and-error-contract.md`
- `12-configuration-and-registry.md`
- `13-testing.md`
- `14-deployment-and-operations.md`
- `15-service-boundary-and-redundancy.md`
- `16-definition-of-done.md`

The old flat file is retained only as an index to prevent competing sources of truth.
