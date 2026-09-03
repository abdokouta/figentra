# Worker Code Organization Standard

Every production Hono Worker follows the same source layout.

```text
src/
├── index.ts                 # runtime entrypoint only
├── app.ts                   # Hono composition root
├── interfaces/              # one exported interface per *.interface.ts
├── types/                   # one exported type per *.type.ts
├── enums/                   # one exported enum per *.enum.ts
├── constants/               # one exported constant per *.constant.ts
├── schemas/                 # one exported validation schema per *.schema.ts
├── clients/                 # downstream clients
├── services/                # application/infrastructure services
├── middleware/              # Hono middleware
├── routes/                  # route composition/handlers when useful
├── validators/              # validation boundaries
└── utils/                   # non-domain pure helpers
```

Rules:

1. `index.ts` contains no business logic.
2. Every exported interface/type/enum/constant/schema gets its own file.
3. File names use the matching suffix: `.interface.ts`, `.type.ts`, `.enum.ts`,
   `.constant.ts`, `.schema.ts`.
4. Public exported symbols have TSDoc.
5. Comments explain security, ownership, invariants, or why—not obvious syntax.
6. Cloudflare bindings are generated with `wrangler types`; do not hand-copy
   provider types into application code.
7. D1 migrations are canonical; generated schema snapshots are never executable
   migration sources.
8. Workers do not execute arbitrary shell commands.
