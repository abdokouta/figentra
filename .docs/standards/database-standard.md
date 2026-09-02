# Database Standard

PostgreSQL is the default service database. D1 is reserved for suitable
Cloudflare-native control-plane workloads.

MikroORM is the default Nest service ORM.

Use migrations as the authoritative schema history. Generated snapshots are
reference artifacts only.

Use transactions for atomic business mutations and outbox writes.
