# Service Authentication Contract

## Requirements

Service credentials must produce a token with:

```text
issuer
subject = service principal
audience = target service
issued_at
expiry
token id where required
```

Target service verifies authentication and then performs IAM authorization.

No implicit trust based on network location.
