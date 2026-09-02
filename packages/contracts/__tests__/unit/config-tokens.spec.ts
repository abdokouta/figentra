/**
 * @file config-tokens.spec.ts
 * @module @stackra/contracts/__tests__/unit
 * @description Verifies every config token exported by `@stackra/contracts`
 *   is a unique `symbol`, resolves through the global registry via
 *   `Symbol.for(...)` with the expected `@stackra/config/<TOKEN>` key,
 *   and does not collide with any other exported token in the package.
 *
 *   Using `Symbol.for(...)` (global registry) is deliberate: it gives
 *   every DI token a stable identity across module realms so that dual-
 *   instance loading of `@stackra/contracts` (pnpm phantom hoists,
 *   mixed ESM/CJS graphs, Vite dev-server hot reloads) does not split
 *   the container binding from the `@Inject(...)` lookup. The keys are
 *   namespaced (`@stackra/config/...`) to eliminate the risk of
 *   third-party registry-key collision.
 */

import { describe, expect, it } from "vitest";

import {
  CONFIGURATION_LOADER,
  CONFIGURATION_SERVICE_TOKEN,
  CONFIGURATION_TOKEN,
  VALIDATED_ENV_LOADER,
} from "@stackra/contracts";
import * as contracts from "@stackra/contracts";

describe("config tokens", () => {
  // Every entry pairs the exported token with the registry key its
  // `Symbol.for(...)` call is expected to resolve through.
  const CONFIG_TOKENS = {
    CONFIGURATION_TOKEN: {
      token: CONFIGURATION_TOKEN,
      key: "@stackra/config/CONFIGURATION_TOKEN",
    },
    CONFIGURATION_SERVICE_TOKEN: {
      token: CONFIGURATION_SERVICE_TOKEN,
      key: "@stackra/config/CONFIGURATION_SERVICE_TOKEN",
    },
    CONFIGURATION_LOADER: {
      token: CONFIGURATION_LOADER,
      key: "@stackra/config/CONFIGURATION_LOADER",
    },
    VALIDATED_ENV_LOADER: {
      token: VALIDATED_ENV_LOADER,
      key: "@stackra/config/VALIDATED_ENV_LOADER",
    },
  } as const;

  describe("shape", () => {
    it.each(Object.entries(CONFIG_TOKENS))(
      "`%s` is a symbol",
      (_name, { token }) => {
        expect(typeof token).toBe("symbol");
      },
    );

    it.each(Object.entries(CONFIG_TOKENS))(
      "`%s` uses Symbol.for(...) with a namespaced registry key",
      (_name, { token, key }) => {
        // `Symbol.keyFor` returns the registry key for a symbol created
        // via `Symbol.for(...)` and `undefined` for one created via a
        // plain `Symbol(...)`. Locking in the namespaced key guarantees
        // (a) dual-instance identity through the global registry and
        // (b) no accidental clash with a third-party registry key.
        expect(Symbol.keyFor(token as symbol)).toBe(key);
      },
    );

    it.each(Object.entries(CONFIG_TOKENS))(
      "`%s` round-trips through the global registry to the same identity",
      (_name, { token, key }) => {
        // Prove the identity guarantee: re-resolving the same key must
        // yield the exact same symbol instance. This is what makes the
        // token safe to inject across module realms.
        expect(Symbol.for(key)).toBe(token);
      },
    );
  });

  describe("uniqueness among themselves", () => {
    it("every config token is identity-distinct from every other", () => {
      const values = Object.values(CONFIG_TOKENS).map((entry) => entry.token);
      // A Set of symbols deduplicates by identity. Length preservation
      // proves no two tokens are the same symbol.
      expect(new Set(values).size).toBe(values.length);
    });
  });

  describe("uniqueness across the contracts public API", () => {
    // Documented aliases — pairs of barrel exports that intentionally
    // resolve to the same symbol identity. Every alias here has a
    // docblock on the aliased export in the source (search for
    // "Alias for {@link ...}" in `packages/frontend/contracts/src/`).
    //
    // Rules for adding an entry:
    // 1. Both names must be exported from the barrel.
    // 2. The aliasing declaration in source must be
    //    `export const <alias> = <canonical>;` — never a duplicate
    //    `Symbol.for(...)` call with the same key (that shape works
    //    at runtime but hides the alias intent from readers).
    // 3. The aliased export must carry an `Alias for {@link ...}`
    //    docblock so grep discovers it.
    const DOCUMENTED_ALIASES: readonly (readonly [string, string])[] = [
      // `DEFAULT_HTTP_CONNECTION_TOKEN` is the workspace-wide fixed
      // symbol every `HttpModule.forRoot()` registers as an alias
      // for the app's default connection — see http.tokens.ts.
      ["DEFAULT_HTTP_CONNECTION_TOKEN", "HTTP_CLIENT"],
    ] as const;

    it("every barrel symbol is identity-unique except for documented aliases", () => {
      // Collect every barrel export whose runtime value is a symbol.
      const exportsBySymbol = new Map<symbol, string[]>();
      for (const name of Object.keys(contracts)) {
        const value = (contracts as Record<string, unknown>)[name];
        if (typeof value !== "symbol") continue;
        const bucket = exportsBySymbol.get(value) ?? [];
        bucket.push(name);
        exportsBySymbol.set(value, bucket);
      }

      // Sanity: every config token is in the set exactly once.
      for (const { token } of Object.values(CONFIG_TOKENS)) {
        const names = exportsBySymbol.get(token) ?? [];
        expect(names.length).toBe(1);
      }

      // Every group of exports pointing at the same symbol must
      // match a documented alias entry (case-insensitive to alias
      // order, since `[a, b]` and `[b, a]` describe the same pair).
      const canonicalizeGroup = (names: readonly string[]): string =>
        [...names].sort().join("|");
      const documentedGroups = new Set(
        DOCUMENTED_ALIASES.map(([alias, canonical]) =>
          canonicalizeGroup([alias, canonical]),
        ),
      );

      const undocumentedDuplicates: string[][] = [];
      for (const names of exportsBySymbol.values()) {
        if (names.length <= 1) continue;
        if (!documentedGroups.has(canonicalizeGroup(names))) {
          undocumentedDuplicates.push(names);
        }
      }

      // Any undocumented duplicate = a real bug (two exports point
      // at the same symbol without a documented alias declaration).
      expect(undocumentedDuplicates).toEqual([]);
    });

    it("every documented alias round-trips to its canonical export", () => {
      // Guards against the alias registry drifting away from the
      // barrel — if an alias is removed from source, the runtime
      // lookup here returns `undefined` and the test fails.
      for (const [alias, canonical] of DOCUMENTED_ALIASES) {
        const aliasSymbol = (contracts as Record<string, unknown>)[alias];
        const canonicalSymbol = (contracts as Record<string, unknown>)[
          canonical
        ];
        expect(typeof aliasSymbol).toBe("symbol");
        expect(typeof canonicalSymbol).toBe("symbol");
        expect(aliasSymbol).toBe(canonicalSymbol);
      }
    });
  });
});
