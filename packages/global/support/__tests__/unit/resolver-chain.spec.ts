/**
 * @file resolver-chain.spec.ts
 * @module @stackra/support/__tests__/unit
 * @description ResolverChain — priority-ordered chain of resolvers that
 *   stops on the first non-undefined return.
 */

import { describe, expect, it } from "vitest";

import { ResolverChain } from "../../src/chains/resolver.chain";
import type { IResolver } from "../../src/interfaces";

function stubResolver<T>(
  handler: (key: string) => T | undefined,
): IResolver<T> {
  return {
    resolve: (key: string) => handler(key),
  };
}

describe("ResolverChain", () => {
  it("returns undefined when no resolver is registered", () => {
    const chain = new ResolverChain<string>();
    expect(chain.resolve("x")).toBeUndefined();
  });

  it("returns undefined when no resolver matches", () => {
    const chain = new ResolverChain<string>();
    chain.register(stubResolver(() => undefined));
    expect(chain.resolve("x")).toBeUndefined();
  });

  it("returns the first non-undefined value in priority order", () => {
    const chain = new ResolverChain<string>();
    chain.register(
      stubResolver(() => "second"),
      20,
    );
    chain.register(
      stubResolver(() => "first"),
      10,
    );
    expect(chain.resolve("k")).toBe("first");
  });

  it("respects priority — lower runs first", () => {
    const chain = new ResolverChain<string>();
    chain.register(
      stubResolver(() => "high-priority-value"),
      100,
    );
    chain.register(
      stubResolver((k) => (k === "match" ? "low-priority-value" : undefined)),
      1,
    );
    expect(chain.resolve("match")).toBe("low-priority-value");
    expect(chain.resolve("nomatch")).toBe("high-priority-value");
  });

  it("uses default priority = 50 when omitted", () => {
    const chain = new ResolverChain<string>();
    chain.register(
      stubResolver(() => "b"),
      100,
    );
    chain.register(stubResolver(() => "a")); // default 50
    expect(chain.resolve("k")).toBe("a");
  });

  it("forwards extra arguments to every resolver", () => {
    const seenArgs: unknown[][] = [];
    const chain = new ResolverChain<string>();
    chain.register({
      resolve: (key, ...args) => {
        seenArgs.push([key, ...args]);
        return undefined;
      },
    });
    chain.resolve("home", 1, "extra");
    expect(seenArgs[0]).toEqual(["home", 1, "extra"]);
  });

  it("re-sorts lazily on registration", () => {
    const chain = new ResolverChain<string>();
    chain.register(
      stubResolver(() => "hi"),
      100,
    );
    chain.resolve("x");
    // Second registration must trigger a re-sort.
    chain.register(
      stubResolver(() => "lo"),
      1,
    );
    expect(chain.resolve("k")).toBe("lo");
  });
});
