/**
 * @file transformer-chain.spec.ts
 * @module @stackra/support/__tests__/unit
 * @description TransformerChain — priority-ordered chain of
 *   transformers executed sequentially, each seeing the previous
 *   transformer's output.
 */

import { describe, expect, it } from "vitest";

import { TransformerChain } from "../../src/chains/transformer.chain";
import type { ITransformer } from "../../src/interfaces";

function stubTransformer<T, C>(
  handler: (input: T, ctx: C) => T,
): ITransformer<T, C> {
  return {
    transform: (input, ctx) => handler(input, ctx),
  };
}

describe("TransformerChain", () => {
  it("returns the input unchanged when no transformer is registered", () => {
    const chain = new TransformerChain<number, void>();
    expect(chain.run(5, undefined as unknown as void)).toBe(5);
  });

  it("runs each transformer sequentially in priority order", () => {
    const chain = new TransformerChain<number, void>();
    chain.register(
      stubTransformer<number, void>((n) => n * 2),
      20,
    );
    chain.register(
      stubTransformer<number, void>((n) => n + 3),
      10,
    );
    // Priority 10 runs first (add 3), then priority 20 (multiply by 2).
    // Input 5 → 5 + 3 = 8 → 8 * 2 = 16.
    expect(chain.run(5, undefined as unknown as void)).toBe(16);
  });

  it("uses default priority = 50 when omitted", () => {
    const chain = new TransformerChain<number, void>();
    chain.register(
      stubTransformer<number, void>((n) => n + 100),
      100,
    );
    chain.register(stubTransformer<number, void>((n) => n + 1)); // default 50
    // Priority 50 runs first (add 1), then 100 (add 100).
    // Input 5 → 6 → 106.
    expect(chain.run(5, undefined as unknown as void)).toBe(106);
  });

  it("forwards context to every transformer", () => {
    const seenCtx: string[] = [];
    const chain = new TransformerChain<number, string>();
    chain.register({
      transform: (n, ctx) => {
        seenCtx.push(ctx);
        return n;
      },
    });
    chain.run(0, "hello");
    expect(seenCtx).toEqual(["hello"]);
  });

  it("getOrdered() returns transformers in priority order", () => {
    const chain = new TransformerChain<number, void>();
    const a = stubTransformer<number, void>((n) => n + 1);
    const b = stubTransformer<number, void>((n) => n + 2);
    chain.register(a, 20);
    chain.register(b, 10);
    expect(chain.getOrdered()).toEqual([b, a]);
  });

  it("re-sorts lazily on registration", () => {
    const chain = new TransformerChain<number, void>();
    chain.register(
      stubTransformer<number, void>((n) => n * 10),
      100,
    );
    // Trigger a first run — chain is sorted.
    chain.run(1, undefined as unknown as void);
    // Register a higher-priority (lower value) transformer — must trigger re-sort.
    chain.register(
      stubTransformer<number, void>((n) => n + 5),
      1,
    );
    expect(chain.run(1, undefined as unknown as void)).toBe((1 + 5) * 10);
  });
});
