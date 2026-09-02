# ADR-0061 — Service Identity and S2S Authentication

**Status:** Accepted

Every deployable service has a machine identity. S2S HTTP uses short-lived
asymmetric credentials with issuer, audience, expiry, signature and scope
validation through JWKS. Universal static shared secrets are prohibited.
Delegation and impersonation are explicit, bounded and auditable.
