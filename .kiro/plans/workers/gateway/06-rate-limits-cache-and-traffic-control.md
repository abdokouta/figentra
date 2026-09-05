# Rate Limits, Cache and Traffic Control

## Rate limiting

Use route/application/tenant/principal/IP dimensions as configured. Prefer Cloudflare-native distributed edge controls for edge limits. Fail behavior is explicit per class; security-sensitive admission fails closed.

Every limit defines window/token policy, burst, key, response status, `Retry-After`, metrics and bypass rules. No client can select a privileged rate-limit bucket.

## Concurrency

Bound expensive upstream concurrency and protect origins from stampedes. Streaming and long-running routes receive explicit concurrency/deadline policies.

## Caching

Only cache responses declared cache-safe by route metadata. Never cache authenticated tenant-sensitive mutable responses by default. Cache keys include all security-relevant dimensions required to prevent cross-user or cross-tenant leakage.

## Metadata cache

Registry route metadata may be cached at the edge with version/TTL and explicit invalidation or refresh. Stale metadata must not enable disabled routes or weaker security policy.

## Backpressure

Reject overload deterministically with 429/503 according to the condition. Emit saturation metrics. Do not retry an overloaded upstream blindly.
