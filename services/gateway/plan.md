# Gateway implementation plan

## Runtime boundary

- NestJS 12 + Fastify 5.
- Cloudflare is the edge protection layer; Gateway is the application boundary.
- Registry is the authoritative route source.
- Identity issues audience-bound downstream tokens.
- IAM is authoritative for permission decisions.
- Services remain responsible for final server-side authorization.

## Request pipeline

1. Request context middleware.
2. Security/CORS middleware.
3. Global authentication guard.
4. Global validation.
5. Registry route resolution.
6. IAM permission decision when the route declares a permission.
7. Identity downstream token exchange.
8. Authenticated upstream request.
9. Normalized response/error.
10. Structured logs and correlation headers.

## Non-negotiable rules

- Never trust inbound identity/tenant/permission headers.
- Never construct upstream URLs from arbitrary user input.
- Never forward the caller's bearer token directly as a service credential.
- Never retry unsafe mutations automatically.
- Never expose upstream stack traces or credentials.
- Health endpoints do not require user authentication.
