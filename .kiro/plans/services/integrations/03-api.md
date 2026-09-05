# Integrations Service — API Contract

All routes `/v1`, JSON, schema validated, Identity-authenticated and IAM-authorized. Tenant scope is mandatory. Provider SDK types never cross the service boundary.

`GET/POST /v1/integrations`; `GET/PATCH/DELETE /v1/integrations/:id` — manage registered external providers/capabilities.

`GET/POST /v1/integrations/:integrationId/connections`; `GET/PATCH/DELETE /v1/connections/:id` — manage tenant connections and status.

`POST /v1/connections/:id/authorize`; `POST /v1/connections/:id/test`; `POST /v1/connections/:id/rotate-credentials`; `POST /v1/connections/:id/revoke`.

`POST /v1/connections/:id/sync`; `GET /v1/sync-jobs/:id`; `POST /v1/sync-jobs/:id/cancel`.

`GET/POST /v1/reconciliations`; `GET /v1/reconciliations/:id`.

`POST /v1/webhooks/:provider/:connection` — provider webhook ingress after signature validation.

DTOs define provider, connection, scopes, mapping, sync mode, cursor/checkpoint, webhook metadata and bounded filters. Secrets are references, not response fields.

Errors: `VALIDATION_FAILED`, `UNAUTHENTICATED`, `FORBIDDEN`, `INTEGRATION_NOT_FOUND`, `CONNECTION_NOT_FOUND`, `PROVIDER_UNAVAILABLE`, `AUTHORIZATION_FAILED`, `WEBHOOK_INVALID`, `SYNC_FAILED`, `RATE_LIMITED`, `CONFLICT`, `INTERNAL_ERROR`.

Outbound requests enforce allow-listed provider endpoints, timeout, response-size limits and SSRF protection.