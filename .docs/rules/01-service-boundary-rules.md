# Service Boundary Rules

A service should exist when it has:

- clear ownership
- clear data boundary
- clear API
- clear event contracts
- independent operational value

A service should NOT exist solely because a noun exists.

Example:

```text
Billing Account
Plan
Subscription
Invoice
```

may initially be one Monetization bounded context.

Likewise:

```text
Identity
Principal
Service Account
```

initially belong to Identity Platform.

Split later when deployment/ownership needs justify it.
