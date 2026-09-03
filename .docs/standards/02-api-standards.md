# API Standards

## URL

Public APIs use:

```text
/v1/...
```

## Requests

Include:

- request ID
- correlation ID where needed
- idempotency key for non-idempotent retriable commands

## Responses

Use consistent error envelope:

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Resource not found",
    "request_id": "..."
  }
}
```

Do not expose internal stack traces.

## Errors

Stable machine-readable codes.

Human-readable messages may change.

## Pagination

Use cursor pagination for large/unstable collections.

## Timeouts

Every outbound request has a bounded timeout.

## Retries

Retry only safe/idempotent operations unless explicit idempotency is available.

## Versioning

Breaking changes require a new major API version.
