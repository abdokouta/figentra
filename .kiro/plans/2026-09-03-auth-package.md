---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
reviewed_by: null
reviewed_at: null
---

# Authentication plan — merged into `@stackra/identity`

**Status:** Superseded / migration record  
**Target package:** `@stackra/identity`

Authentication and identity are intentionally one Figentra platform bounded context. There is no standalone `@stackra/auth` package in the target architecture.

## Locked boundary

`@stackra/identity` owns:

- authentication orchestration;
- authentication-provider adapters;
- Supabase Auth integration for day-one human authentication;
- token verification and normalized token lifecycle;
- session and revocation metadata;
- service-account/service-identity authentication;
- identity/principal normalization;
- identity context propagation;
- impersonation/delegation controls.

`@stackra/iam` / Policy owns authorization decisions. It does not authenticate users.

Supabase owns provider authentication state. Figentra does not duplicate that provider state.

## Migration rule

Do not implement this file as a separate package. All implementation requirements from this historical auth boundary are incorporated into `.kiro/plans/2026-09-03-identity-package.md`.

## Cross-reference

See `.kiro/plans/00-master-platform-plan.md` and `.kiro/plans/2026-09-03-identity-package.md`.
