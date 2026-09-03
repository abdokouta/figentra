# API Contract Standard

APIs define explicit request/response/error contracts.

Use stable resource/action semantics and explicit API versions. Breaking changes
require a new major/versioned contract.

Every API operation documents:

- authentication
- authorization
- scope requirements
- request
- response
- errors
- idempotency
- rate limit
- observability
