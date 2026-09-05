# Registry — API Contract

## Public reads

`GET /v1/applications`; `GET /v1/applications/:application`; `GET /v1/applications/:application/versions`; `GET /v1/applications/:application/environments`; `GET /v1/applications/:application/manifest`; `GET /v1/applications/:application/capabilities`; `GET /v1/applications/:application/routes`; `GET /v1/applications/:application/services`; `GET /v1/discovery/resolve`.

## Protected writes

`POST /v1/applications`; `POST /v1/applications/:id/versions`; `POST /v1/applications/:id/environments`; `POST /v1/applications/:id/publications`; `POST /v1/applications/:id/reconcile`; publication status/read APIs.

All writes require authenticated service/application identity, IAM permission, tenant binding and idempotency key. Browser IDs never establish tenancy. Public reads expose sanitized metadata only.

## Contract rules

JSON, versioned `/v1`, strict schemas, bounded payloads, pagination for collections, stable error codes, ETag/cache headers for immutable metadata, `If-None-Match` support, request/correlation/trace headers and response `request-id`.

Publication responses include publication ID, application/environment/version, manifest hash, schema version, revision and status. Secrets, code and internal database details never appear in responses.