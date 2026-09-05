# IAM Service — API Contract

All APIs are `/v1`, JSON, schema-validated, authenticated through Identity and authorized by IAM itself for administration. Client-supplied principal/tenant context is never trusted.

## Roles
`GET/POST /v1/roles`; `GET/PATCH/DELETE /v1/roles/:id`; `POST /v1/roles/:id/assignments`; `DELETE /v1/assignments/:id`.

## Permissions
`GET /v1/permissions`. Permission keys are immutable and catalogued through controlled bootstrap/migration.

## Policies
`GET/POST /v1/policies`; `GET/PATCH /v1/policies/:id`; `POST /v1/policies/:id/publish`; `POST /v1/policies/:id/disable`.

## Grants
`GET/POST /v1/grants`; `POST /v1/grants/:id/revoke`.

## Authorization
`POST /v1/authorization/check`; `POST /v1/authorization/check-many`.

Request includes action, resource type/id, tenant, authenticated context, and bounded authorization attributes. Response includes `allow|deny`, stable reason code, policy version and decision metadata safe for the caller.

## Errors
`VALIDATION_FAILED`, `UNAUTHENTICATED`, `FORBIDDEN`, `ROLE_NOT_FOUND`, `POLICY_NOT_FOUND`, `GRANT_NOT_FOUND`, `CONFLICT`, `POLICY_INVALID`, `DECISION_DENIED`, `DEPENDENCY_UNAVAILABLE`, `RATE_LIMITED`, `INTERNAL_ERROR`.

## Semantics
Mutations support idempotency where repeated requests can create duplicate grants/roles. Authorization checks are deterministic and fail closed. No endpoint returns policy source containing secrets or executable content. OpenAPI is generated from the same schemas used by runtime validation.