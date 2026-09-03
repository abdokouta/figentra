# Gateway/Registry security testing

## DAST

Run the OWASP ZAP baseline against an approved non-production environment:

```bash
make security-dast BASE_URL=https://api.dev.figentra.com
```

Never point automated scanners at production without an explicit change window
and approval.

## Required security cases

- invalid/expired JWT
- wrong issuer
- wrong audience
- missing service identity
- forged identity headers
- privilege escalation
- cross-tenant access
- cross-scope access
- route cache poisoning
- registry registration without service principal
- registry registration without `registry:application:register`
- token exchange audience confusion
- replayed service token
- rate-limit bypass
- oversized manifest
- malformed route pattern
- upstream SSRF attempt
