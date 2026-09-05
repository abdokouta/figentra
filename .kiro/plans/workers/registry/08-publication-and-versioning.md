# Registry — Publication and Versioning

Publication is an immutable control-plane operation.

## Identity

`applicationId + environmentId + version + manifestHash` uniquely identifies a publication. Version must be immutable. A different hash for an existing version is rejected.

## State

`draft` is application-local and never treated as deployed authority. Registry records are `published`, `superseded`, `revoked` or `failed`. A published immutable revision remains queryable for reproducibility unless retention policy explicitly archives it.

## Concurrency

Idempotency key is mandatory for mutation. Repeated identical requests return the original result. Concurrent conflicting publications fail deterministically. Active-version changes use compare-and-set semantics.

## Compatibility

API, manifest and runtime consumers declare supported schema versions. Publication validates required compatibility metadata before activation. Deployment metadata identifies artifact digest and manifest hash so code and metadata cannot silently diverge.

## Cache

Successful publication invalidates mutable aliases and writes immutable revision keys. Failed publication does not invalidate a previously active version. Cache updates are never the authority.