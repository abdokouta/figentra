# @stackra/testing

The workspace's canonical Vitest preset + test-authoring toolkit. Ships one
shared Vitest configuration per runtime + framework-tier utilities (factories,
assertable proxies, matchers, container helpers) so every package, service,
worker, and app authors tests against the same discipline.

Locked by [`.kiro/steering/testing.md`](../../.kiro/steering/testing.md).

**One exception:** `apps/family` (React Native) stays on Jest — Metro +
`jest-expo` are still the RN reality. Every other target uses Vitest via this
preset.

## Contents

- [Installation](#installation)
- [Presets](#presets)
- [Core toolkit](#core-toolkit)
- [Runtime fixtures](#runtime-fixtures)
- [Matchers](#matchers)
- [Cross-references](#cross-references)

## Installation

Every workspace package pulls this via `workspace:*`:

```jsonc
// packages/<pkg>/package.json
{
  "devDependencies": {
    "@stackra/testing": "workspace:*",
  },
}
```

Every peer is OPTIONAL — install only what your subpaths use:

| Subpath                    | Adds required peers                                                             |
| -------------------------- | ------------------------------------------------------------------------------- |
| `@stackra/testing`         | none — pure runtime (ULID generator + factories + assertable proxies)           |
| `/preset` + `/preset/base` | `vitest`, `@vitest/coverage-v8`                                                 |
| `/preset/nest`             | `+ unplugin-swc`, `vite-tsconfig-paths`                                         |
| `/preset/worker`           | `+ @cloudflare/vitest-pool-workers`, `miniflare`                                |
| `/preset/react`            | `+ jsdom`, `@testing-library/*`                                                 |
| `/nest`                    | `+ @nestjs/{common,core,testing,platform-fastify}`, `fastify`, `supertest`      |
| `/worker`                  | `+ miniflare`                                                                   |
| `/database`                | `+ @electric-sql/pglite`, `@mikro-orm/core`                                     |
| `/react` + `/react/setup`  | `+ react`, `react-dom`, `@testing-library/{react,jest-dom,user-event}`, `jsdom` |
| `/matchers`                | none — auto-registers on import                                                 |
| `/setup`                   | none — side-effect setup for base preset                                        |

## Presets

### `@stackra/testing/preset`

Default export — a Vitest config that:

- Discovers `__tests__/**/*.test.{ts,tsx}` and `src/**/*.test.{ts,tsx}`.
- Uses `@vitest/coverage-v8` with sensible defaults.
- Passes with no tests (`passWithNoTests: true`).
- Registers `/setup` as a `setupFile` so custom matchers + time helpers
  auto-load.

```typescript
// packages/my-lib/vitest.config.ts
import preset from "@stackra/testing/preset";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  preset,
  defineConfig({
    test: {
      // per-package overrides here
    },
  }),
);
```

### `@stackra/testing/preset/nest`

Extends `/preset` with NestJS-friendly defaults:

- `unplugin-swc` — SWC-driven decorator-metadata transform (matches
  `nest build`).
- `vite-tsconfig-paths` — reads `tsconfig.json` `paths` for absolute imports.
- `globals: true` — Vitest `describe/it/expect` available without imports (Nest
  projects prefer this style).
- `oxc: false, esbuild: false` — turns off Vitest 4's default transforms so SWC
  owns emit (decorator metadata drops otherwise).

```typescript
// services/approval/vitest.config.ts
import preset from "@stackra/testing/preset/nest";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  preset,
  defineConfig({
    test: {
      // approval-service overrides
      include: ["__tests__/**/*.test.ts"],
    },
  }),
);
```

### `@stackra/testing/preset/worker`

For Cloudflare Worker packages. Exports:

- `createWorkerPreset({ wranglerConfigPath })` — factory taking a path to
  `wrangler.jsonc`, returns a preset with the `@cloudflare/vitest-pool-workers`
  pool + Miniflare wired against that wrangler config.
- `default` — bare preset with pool configured; consumers must provide
  wranglerConfigPath via merge.

```typescript
// workers/my-worker/vitest.config.ts
import { createWorkerPreset } from "@stackra/testing/preset/worker";
import { defineConfig, mergeConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const preset = createWorkerPreset({
  wranglerConfigPath: fileURLToPath(
    new URL("./wrangler.jsonc", import.meta.url),
  ),
});

export default mergeConfig(
  preset,
  defineConfig({
    test: {
      include: ["__tests__/**/*.test.ts"],
    },
  }),
);
```

Tests run inside `workerd` — the same runtime the worker deploys to.

### `@stackra/testing/preset/react`

For React SPAs + component packages:

- `environment: "jsdom"` — DOM primitives available.
- `setupFiles: ['@stackra/testing/react/setup']` — auto-registers
  `@testing-library/jest-dom` matchers + wires `afterEach(cleanup)`.

```typescript
// apps/portal/vitest.config.ts
import preset from "@stackra/testing/preset/react";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  preset,
  defineConfig({
    test: {
      include: ["src/**/*.test.{ts,tsx}"],
    },
  }),
);
```

## Core toolkit

### `createAssertableProxy<T>()`

Wraps any callable subject in a recording proxy — every call captured for later
assertion. Perfect for verifying downstream services get invoked with the right
args.

```typescript
import { createAssertableProxy } from "@stackra/testing";

interface IEmailService {
  send(to: string, template: string, data: unknown): Promise<void>;
}

const emailer = createAssertableProxy<IEmailService>();

// Wire the proxy into your subject-under-test
const user = new UserService(emailer);
await user.register("a@b.com");

// Assert
emailer.$.assertCalled(1);
emailer.$.assertCalledWith("send", "a@b.com", "welcome", expect.any(Object));

// Access recorded calls
const calls = emailer.$.getCalls(); // IRecordedCall[]
expect(calls[0].method).toBe("send");
expect(calls[0].args[0]).toBe("a@b.com");

// Reset for next test
emailer.$.reset();
```

Legacy API (`emailer.assertCalled(...)`, `emailer.getCalls()`,
`emailer.reset()`) works too — both surface types are supported.

### `defineFactory<T>()`

Build shape-consistent test data with deterministic randomness.

```typescript
import { defineFactory } from "@stackra/testing";

const userFactory = defineFactory<IUser>((faker, seq) => ({
  id: seq.ulid("usr"),
  email: faker.internet.email(),
  createdAt: faker.date.past(),
  role: "member",
}));

// Named variants
const adminFactory = userFactory.state("admin", () => ({ role: "admin" }));

// Usage
const user = userFactory.make(); // one User
const users = userFactory.times(5).make(); // five Users
const admin = adminFactory.make(); // one User w/ role: "admin"

// Overrides
const bob = userFactory.make({ email: "bob@example.com" });
```

Factories are seeded deterministically per test — same seed, same output across
runs.

### `createTestContainer()`

Lightweight DI container for wiring test subjects without a full Nest
`TestingModule`:

```typescript
import { createTestContainer } from "@stackra/testing";
import { EMAIL_SERVICE } from "@stackra/contracts";

const container = createTestContainer();
container.bind(EMAIL_SERVICE, emailer);
container.bind("USER_REPO", userRepo);

const userService = container.resolve(UserService);
```

Suits unit + fast integration tests. For NestJS-integrated tests (guards,
interceptors, pipes) use `/nest`'s `createTestingModule` instead.

### Time control

```typescript
import {
  freezeTime,
  travelTo,
  travelBy,
  restoreTime,
  now,
} from "@stackra/testing";

freezeTime("2026-09-03T14:00:00Z");
expect(now()).toEqual(new Date("2026-09-03T14:00:00Z"));

travelBy({ hours: 2 });
expect(now()).toEqual(new Date("2026-09-03T16:00:00Z"));

travelTo("2026-12-25T00:00:00Z");
// ...

restoreTime(); // auto-called via afterEach when /setup is loaded
```

Backed by Vitest's fake timers; `restoreTime()` fires automatically in
`afterEach` when either `/setup` or `/react/setup` is registered.

### `createUlidGenerator({ seed })`

Deterministic ULID sequences for reproducible tests:

```typescript
import { createUlidGenerator } from "@stackra/testing";

const ids = createUlidGenerator({ seed: 42 });
const a = ids.next(); // "01AAAAAAAA..."
const b = ids.next(); // "01AAAAAAAB..."
// same seed → same sequence every run
```

## Runtime fixtures

### `@stackra/testing/nest`

For NestJS integration tests.

```typescript
import { createNestTestContext } from "@stackra/testing/nest";

describe("POST /users", () => {
  const ctx = createNestTestContext({
    module: AppModule,
    overrides: (t) => t.overrideProvider(EMAIL_SERVICE).useValue(mockEmail),
  });

  it("creates a user", async () => {
    const app = await ctx.getFastifyApp();

    const res = await ctx
      .supertest(app)
      .post("/users")
      .send({ email: "a@b.com" })
      .expect(201);

    expect(res.body).toMatchObject({ id: expect.any(String) });
  });

  afterEach(() => ctx.close());
});
```

Exports:

- `createTestingModule(options)` — wraps `Test.createTestingModule` from
  `@nestjs/testing`.
- `buildFastifyTestApp(moduleRef)` — hoists to `NestFastifyApplication` with
  sane defaults.
- `supertestClient(app)` — supertest instance bound to the Fastify http server.
- `createOutboxHarness()` — assertable transactional-outbox recorder for
  services that publish domain events via outbox pattern (ADR-0059).
- `createNestTestContext({ module, overrides })` — the composed helper above.

### `@stackra/testing/worker`

For Cloudflare Worker tests.

```typescript
import {
  createWorkerFetch,
  createD1Fixture,
  createKvFixture,
  createDoHarness,
} from "@stackra/testing/worker";

// Miniflare-backed fetch handler
const fetch = createWorkerFetch({
  worker: import.meta.url + "/../src/index.ts",
  bindings: { API_TOKEN: "test" },
});

const res = await fetch("/health");
expect(res.status).toBe(200);

// D1 test database — per-test SQLite, resets between tests
const db = await createD1Fixture({
  schema: ["CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT)"],
});
await db.exec("INSERT INTO users VALUES ('1', 'a@b.com')");
expect(await db.first("SELECT * FROM users WHERE id = '1'")).toMatchObject({
  email: "a@b.com",
});

afterEach(() => db.reset());

// KV test namespace
const kv = createKvFixture();
await kv.put("session:abc", JSON.stringify({ userId: "1" }));
expect(await kv.get("session:abc")).toContain("userId");

// Durable Object harness
const room = createDoHarness("Room");
const stub = room.get(room.idFromName("general"));
const res2 = await stub.fetch("/join");
```

### `@stackra/testing/database`

For services using MikroORM + Postgres.

```typescript
import {
  createPGliteDatabase,
  withTransaction,
  createTestEntityManager,
} from "@stackra/testing/database";

// In-process Postgres via @electric-sql/pglite
const db = await createPGliteDatabase({
  schema: ["CREATE TABLE users (id UUID PRIMARY KEY, email TEXT)"],
  migrations: [/* MikroORM Migration classes */],
});

// Per-test transaction rollback — every test starts clean
beforeEach(() =>
  withTransaction(db, async (tx) => {
    // arrange + act + assert in the test itself
    // automatic rollback after the test regardless of pass/fail
  }),
);

// MikroORM EntityManager fork
const em = createTestEntityManager({ database: db, entities: [User] });
await em.persistAndFlush(new User({ email: "a@b.com" }));
```

### `@stackra/testing/react`

For React component tests.

```typescript
import { render, screen, userEvent, waitFor } from "@stackra/testing/react";

// Add /preset/react OR reference /react/setup in your setupFiles for
// jest-dom matchers + automatic cleanup

it("renders greeting", async () => {
  render(<Greeting name="Ada" />, {
    wrappers: [
      (children) => <ThemeProvider theme="dark">{children}</ThemeProvider>,
      (children) => <RouterProvider router={testRouter}>{children}</RouterProvider>,
    ],
  });

  expect(screen.getByRole("heading")).toHaveTextContent("Hello, Ada");

  await userEvent.click(screen.getByRole("button", { name: /greet/i }));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("greeted"));
});
```

`wrappers` folds outside-in — the first wrapper is outermost. `render` also
proxies as `render` alias.

Re-exports every commonly-used RTL helper: `screen`, `within`, `waitFor`,
`fireEvent`, `act`, `userEvent`.

## Matchers

Import `@stackra/testing/matchers` to register workspace custom matchers, or let
`/setup` (in the base preset) register them automatically.

### `toBeUlid()`

```typescript
expect("01H8VC4EXZ...").toBeUlid(); // pass
expect("01H8VC4EXZ...").toBeUlid("usr"); // asserts prefix
expect("not-a-ulid").toBeUlid(); // fails
```

### `toMatchZodSchema(schema)`

```typescript
import { z } from "zod";

const UserShape = z.object({ id: z.string(), email: z.string().email() });

expect(response.body).toMatchZodSchema(UserShape);
```

Runs the shape parse; failure formats the Zod error tree in the assertion
message.

### `toHaveBeenCalledWithinLast(callable, ms)`

```typescript
const spy = vi.fn();
spy();
expect(spy).toHaveBeenCalledWithinLast(100); // called within last 100ms
```

Handy for verifying "the event fired recently" without capturing exact
timestamps.

TypeScript augmentation lives in the same module — matchers autocomplete after
import.

## `@stackra/testing/setup`

Side-effect side entrypoint used by `/preset` and `/preset/nest` as a
`setupFile`:

```typescript
// vitest.config.ts (if not using our presets)
export default defineConfig({
  test: {
    setupFiles: ["@stackra/testing/setup"],
  },
});
```

What it does:

1. Calls `registerAllMatchers()` — makes `.toBeUlid()`, `.toMatchZodSchema()`,
   `.toHaveBeenCalledWithinLast()` available on every `expect(...)`.
2. Wires `afterEach(restoreTime)` — resets time-freezing between tests.

## `@stackra/testing/react/setup`

Side-effect side entrypoint used by `/preset/react` as a `setupFile`:

1. Imports `@testing-library/jest-dom/vitest` — registers DOM matchers
   (`.toBeInTheDocument()`, `.toHaveClass()`, etc.).
2. Wires `afterEach(cleanup)` — unmounts any leftover components.
3. Runs the base `/setup` above (matchers + time restore).

## Cross-references

- Steering rules —
  [`.kiro/steering/testing.md`](../../.kiro/steering/testing.md).
- Standardisation plan —
  [`.kiro/plans/2026-09-03-workspace-standardization.md`](../../.kiro/plans/2026-09-03-workspace-standardization.md).
- Container plan (upcoming testing-container refactor) —
  [`.kiro/plans/2026-09-03-container-package.md`](../../.kiro/plans/2026-09-03-container-package.md).

## License

MIT © Figentra L.L.C
