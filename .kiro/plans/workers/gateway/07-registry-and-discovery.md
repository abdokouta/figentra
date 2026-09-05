# Registry and Discovery

## Registry role

Application Registry is the authoritative metadata/index for applications, versions, environments, route metadata and related runtime metadata. It is not the source of business truth and is not called for every request when a validated local/edge metadata cache can safely serve the route.

## Registration

The Gateway publishes its application/runtime identity, version, environment, public hosts, routes, methods, capabilities, authentication modes, upstream classes, rate-limit classes, timeout/retry classes, streaming support, health endpoints and dependency metadata through the approved Registry integration.

## Discovery

At bootstrap and refresh, obtain signed/validated route metadata, verify schema/version/environment, compile an immutable in-memory route table, then atomically swap it. Never mutate the active route table partially.

## Failure

Initial bootstrap fails if no valid route configuration exists for protected traffic. Runtime Registry outage does not interrupt already-valid routes within their metadata validity period. Refresh failure retains the last valid configuration only within its declared TTL/expiry; expired security metadata causes protected routing to fail closed.

## Security

Registry responses are authenticated and schema-validated. Client input never selects arbitrary upstream destinations. Registry metadata cannot inject executable code, SQL, scripts or arbitrary URLs into the Worker.
