# Database Standards

## Ownership

One service owns a table/model.

No cross-service writes.

## IDs

Use opaque stable IDs.

Do not expose internal sequential IDs where they create security concerns.

## Migrations

- version controlled
- forward tested
- rollback strategy
- production-safe

## Transactions

Keep transaction boundaries local to a service.

## RLS

Use RLS as defense in depth for appropriate tenant/scope data.

Do not treat RLS as a replacement for IAM.

## Secrets

Never store authentication secrets as ordinary plaintext fields.
