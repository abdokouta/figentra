# Security Standard

- Deny by default.
- Authenticate before authorization.
- Authorize every protected boundary.
- Use machine identity for service-to-service communication.
- Never forward user tokens blindly.
- Validate JWT issuer, audience, signature and temporal claims.
- Scope authorization to the applicable dynamic scope.
- Use WAF and rate limits at the edge.
- Store secrets only in approved secret management.
- Audit identity, IAM, infrastructure and administrative mutations.
- Validate registered upstreams against SSRF rules.
