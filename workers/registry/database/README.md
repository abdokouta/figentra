# Registry D1 database

- `migrations/` is the **only executable schema source of truth**.
- `schema.sql` is a generated human-readable snapshot and MUST NOT be applied directly.
- Wrangler `migrations_dir` points to `database/migrations`.
- D1 is authoritative; KV is only a cache.
- Any schema change requires a new numbered migration and a refreshed snapshot.
