# Location Service — Security and Authorization

Location data can reveal sensitive movement patterns. Treat it as privacy-sensitive by default.

## Rules

- Tenant scope is mandatory for tenant-owned data.
- Actor/subject/device access is checked server-side.
- Clients cannot supply trusted tenant, role or permission claims.
- Service-to-service calls use typed contracts plus service identity.
- Tracking ingestion requires device identity and an authorized ingestion credential/context.
- Access to current/history location is separately permissioned from ordinary place search.
- Administrative access is audited.
- TLS is mandatory in deployed environments.
- Secrets come from Doppler; none are stored in source or `cloud.yaml`.

## Privacy

Retention is purpose-specific. Raw telemetry should have the shortest practical retention. Access logs are retained according to platform audit policy. Deletion requests must propagate to derived visit/current-state records according to the data-lifecycle contract.

## Threats

Mitigate tenant breakout, spoofed device identity, replayed telemetry, location scraping, provider credential leakage, excessive provider spend and malicious geofence creation.
