# Registry — Manifest Contract

## Source of truth

The application source/build is authoritative for its manifest. The Registry accepts a signed/integrity-identified, versioned manifest and stores a projection.

## Allowed metadata

Application/version/environment identity; modules; services; routes; resources; actions; permissions; capabilities; events; consumers; workers; schedules; configuration schemas; integrations; webhooks; realtime channels; reports; search definitions; deployment/runtime metadata; compatibility; validated navigation/branding/theme tokens.

## Forbidden

Secrets, access tokens, private keys, credentials, SQL, executable JS/WASM, arbitrary HTML, arbitrary CSS, component implementations, filesystem paths containing secrets, arbitrary network destinations, business records and unbounded user content.

## Validation

Maximum document size; schema version; strict JSON schema; identifier normalization; enum validation; URL allowlists where applicable; tenant/application ownership; duplicate detection; dependency references; permission references; route collision detection; semantic validation; canonical serialization; SHA-256 hash.

## Publication

Validate → normalize → hash → authorize → idempotency check → transactionally persist publication and projections → invalidate/update KV aliases → emit publication result. Identical replay succeeds without duplication. Same version/different hash fails conflict.

## Evolution

Schema versions are explicit. Readers declare supported schema versions. Breaking changes require a new manifest schema/version and compatibility metadata. Old immutable publications remain readable for deployment reproducibility.