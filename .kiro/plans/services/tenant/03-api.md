# Tenant Service — API Contract

All routes are `/v1`, JSON, strictly schema-validated, authenticated by Identity and authorized by IAM. Tenant-scoped administrative mutations require idempotency keys.

## Tenants
`POST /v1/tenants` create; `GET /v1/tenants/:id`; `PATCH /v1/tenants/:id`; `POST /v1/tenants/:id/activate`; `POST /v1/tenants/:id/suspend`; `POST /v1/tenants/:id/archive`.

## Organizations
`GET/POST /v1/tenants/:tenantId/organizations`; `GET/PATCH/DELETE /v1/organizations/:id`.

## Memberships
`GET /v1/tenants/:tenantId/members`; `POST /v1/tenants/:tenantId/members`; `DELETE /v1/tenants/:tenantId/members/:membershipId`.

## Domains
`GET/POST /v1/tenants/:tenantId/domains`; `POST /v1/domains/:id/verify`; `DELETE /v1/domains/:id`.

## Settings
`GET /v1/tenants/:tenantId/settings`; `PATCH /v1/tenants/:tenantId/settings`.

## Contracts
DTOs include `CreateTenantDto`, `UpdateTenantDto`, lifecycle commands, organization/membership/domain/settings DTOs and pagination queries. Responses expose stable IDs/status/version/timestamps, never internal secrets.

Errors: `VALIDATION_FAILED`, `UNAUTHENTICATED`, `FORBIDDEN`, `TENANT_NOT_FOUND`, `INVALID_STATE_TRANSITION`, `MEMBERSHIP_CONFLICT`, `DOMAIN_CONFLICT`, `DOMAIN_VERIFICATION_FAILED`, `CONFLICT`, `RATE_LIMITED`, `DEPENDENCY_UNAVAILABLE`, `INTERNAL_ERROR`.

Tenant ID in a path is not proof of access; IAM authorization and membership/scope checks are mandatory.