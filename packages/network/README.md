# @stackra/network

Foundational network primitives for service-to-service communication.

This package intentionally does **not** contain service-specific API clients.
Use `@stackra/contracts` for shared request/response contracts and compose the
transport inside the consuming service or gateway.

Service-specific SDKs are only justified when a remote API has a stable public
consumer base or non-trivial client behavior that cannot reasonably live in the
consumer. Internal Figentra services should not accumulate a monolithic SDK.
