# Figentra Identity JWKS and issuer standard

## V1 provider

Supabase Auth is the Figentra V1 authentication provider.

Supabase exposes the active asymmetric signing keys at:

```text
https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json
```

The issuer is:

```text
https://<project-ref>.supabase.co/auth/v1
```

The Gateway and every Nest service that directly verifies Identity JWTs must
validate all of:

1. signature against the JWKS;
2. `iss` against the exact environment issuer;
3. `aud` against the service's expected audience;
4. `sub` presence;
5. token expiry/not-before semantics;
6. required service identity claims for service-to-service tokens.

## Rotation

Supabase documents caching on its JWKS discovery endpoint. Services must use a
remote JWKS resolver with bounded caching rather than pinning a single public
key in source control. During emergency key revocation, the platform runbook
must include cache-busting/restart procedures for components that independently
cache the JWKS.

## No Clerk

Clerk is not part of the V1 identity architecture. Do not add Clerk provider
configuration, Clerk webhooks, or Clerk-specific claims to the platform.
