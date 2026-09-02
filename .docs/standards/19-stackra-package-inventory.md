# Stackra Package Inventory

This is the canonical package-boundary target requested for the Stackra foundation. A name being listed here does not mean an implementation package has been created; it is an explicit gap until the package has real source, tests, exports, and consumers.

| Package | Current state | Contract source currently lives in |
|---|---|---|
| cache | **gap** | `packages/contracts/src/interfaces/cache`, `tokens/cache` |
| config | **gap** | `packages/contracts/src/interfaces/config`, `types/config`, `tokens/configuration*` |
| console | **gap** | `packages/contracts/src/interfaces/console`, `tokens/console*` |
| container | **implemented** | `packages/container` |
| contracts | **implemented** | interfaces/types/enums/events + DI tokens/zones |
| decorators | **gap** | container currently owns decorator runtime |
| error | **gap** | contract tokens/interfaces exist; runtime package not yet present |
| events | **implemented** | `packages/events` + contracts event vocabulary |
| http | **gap** | `packages/contracts/src/interfaces/http`, `tokens/http*` |
| i18n | **gap** | `packages/contracts/src/interfaces/i18n`, `tokens/i18n*` |
| logger | **gap** | `packages/contracts/src/interfaces/logger`, `tokens/logger*` |
| network | **gap** | `packages/contracts/src/interfaces/network`, `tokens/network*` |
| pipeline | **gap** | `packages/contracts/src/interfaces/pipeline` |
| query | **gap** | `packages/contracts/src/interfaces/query`, `tokens/query*` |
| queue | **implemented** | `packages/queue` |
| realtime | **gap** | `packages/contracts/src/interfaces/realtime`, `tokens/realtime*` |
| scheduler | **gap** | `packages/contracts/src/interfaces/scheduler`, `tokens/scheduler*` |
| state | **gap** | `packages/contracts/src/interfaces/state`, `tokens/state*` |
| storage | **gap** | `packages/contracts/src/interfaces/storage`, `tokens/storage*` |
| support | **implemented** | `packages/support` |
| testing | **implemented** | `packages/testing` |
| ui | **gap** | `packages/contracts/src/interfaces/ui`, `tokens/ui*` |
| vite | **gap** | Vite app/tooling currently lives in applications, no standalone package |
| zones | **contract layer** | `packages/contracts/src/zones` |

## Contracts boundary

`@stackra/contracts` is the zero-runtime vocabulary package. It contains the contract primitives that must remain framework-agnostic: interfaces, types, enums, events, DI tokens, and zone identifiers. It must not absorb implementations for cache, HTTP, logging, UI, storage, etc.

The `tokens/` and `zones/` directories are intentionally retained because they are contract vocabulary, not implementations. Runtime behavior belongs in the corresponding foundation package when that package is introduced.

## Enterprise rule

Do not create empty placeholder packages merely to make this inventory green. Each standalone package becomes **implemented** only when it has:

1. a real runtime/type surface;
2. a package.json with catalog/workspace dependencies only;
3. explicit exports;
4. unit/integration tests;
5. documentation and ownership;
6. at least one real consumer or a documented platform bootstrap role.

- `@figentra/workflows`: provider-neutral durable workflow DSL/discovery + Cloudflare, Temporal, Vercel and custom adapters.
- `@figentra/queue`: provider-neutral queue contracts + Cloudflare Queues, SQS, Redis, BullMQ and custom adapters.
- `@figentra/state-machines`: typed domain state machines and guarded transitions; no durable runtime.
