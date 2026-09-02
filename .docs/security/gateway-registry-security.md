# Gateway + Registry Enterprise Security Contract

## Trust boundaries

```text
Internet
  -> Cloudflare WAF
  -> API Gateway
  -> Identity JWT verification
  -> Registry route discovery
  -> IAM authorization
  -> Identity token exchange
  -> service upstream
```

## Gateway

The Gateway must:

- reject missing/invalid bearer tokens;
- validate issuer and audience;
- rate limit by principal where available;
- resolve routes only from the Registry;
- never trust caller-supplied identity headers;
- exchange the caller token for a short-lived service token per target audience;
- enforce IAM permissions declared by the route;
- apply upstream timeout and circuit breaking;
- strip cookies and the caller Authorization header before forwarding;
- attach only platform-generated correlation/principal/tenant headers;
- never access service-owned databases.

## Registry

The Registry must:

- require a valid Identity JWT for all `/v1/*` operations;
- require a service principal for application registration;
- require `registry:application:register` permission;
- require a registration-specific JWT audience;
- validate the complete manifest with a schema;
- reject upstream URLs outside the approved service DNS suffix;
- reject HTTP, embedded credentials, localhost, and private/internal hosts;
- make registration keys unique and idempotent;
- persist an audit record for every mutation;
- keep D1 authoritative and KV cache-only;
- never make business authorization decisions.
