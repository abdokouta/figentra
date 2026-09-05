# Configuration and Registry Metadata

## Configuration classes

Required configuration covers environment, application identity, Registry endpoint/binding, route metadata cache TTL, token issuer/audience/JWKS policy, CORS policy reference, security headers, body/header/URL limits, rate-limit classes, upstream deadlines, retry classes, circuit thresholds, cache policy, logging level, tracing/sampling policy, public hosts, service bindings and authenticated HTTPS upstream credentials.

## Validation

Configuration is schema-validated at startup. Missing mandatory production configuration prevents readiness. Secrets are Worker secret bindings and are never represented as plaintext Registry metadata.

## Environment isolation

Development, staging and production use distinct Worker environments, bindings, Registry scopes, upstream credentials, hosts and security policy. No production origin or credential is available to development.

## Registry publication

Publish: gateway application ID, Worker runtime, version, environment, public hosts, route references, supported methods, authentication modes, capability metadata, health endpoints, realtime/streaming support, upstream transport classes, dependency metadata and observability metadata.

## Dynamic data

No arbitrary executable configuration, JavaScript, SQL, upstream URL, secret or provider credential may arrive through Registry metadata.
