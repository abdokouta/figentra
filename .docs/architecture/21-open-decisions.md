# 21 — Open Decisions

## Security

1. Principal physical schema.
2. Credential physical schema.
3. Secret manager.
4. OAuth issuer architecture.
5. JWT signing algorithm.
6. JWKS/key rotation.
7. Token exchange protocol.
8. Service-to-service trust combination.
9. mTLS requirements.
10. Delegation model.
11. Impersonation model.

## Authorization

12. Permission naming convention.
13. Role inheritance.
14. Explicit deny semantics.
15. Policy engine.
16. Scope inheritance.
17. Authorization API.
18. Decision explanation contract.
19. Cache invalidation.
20. authorization consistency model.

## Context

21. Tenant schema.
22. Supabase Auth Organization ↔ Tenant mapping.
23. Dynamic Scope graph/model.
24. Cross-tenant access.

## Commercial

25. Billing hierarchy.
26. Entitlement model.
27. Metering architecture.
28. Stripe/Paddle ownership and reconciliation.

## Platform

29. Application Registry manifest.
30. Decorator/scanner implementation.
31. Domain/certificate architecture.
32. App Store model.
33. Feature flag provider.
34. Workflow engine.
35. Event transport matrix.
36. Search engine.
37. Facts/Reporting architecture.
38. Deployment/Terraform runner.
39. Cloudflare vs AWS service placement.
40. Observability provider.
41. Whether centralized webhook ingress remains one Worker or is split by
    provider/domain.
42. Whether the Registry Worker needs D1 only or D1 + KV caching at production
    scale.

## Process

Each decision must become an ADR before being treated as final.
