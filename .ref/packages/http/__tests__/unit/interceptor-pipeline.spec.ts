/**
 * @file interceptor-pipeline.spec.ts
 * @module @stackra/http/__tests__/unit
 * @description Behavioural spec for `InterceptorPipeline.execute`.
 */

import { describe, expect, it, vi } from "vitest";
import type {
  IHttpContext,
  IHttpInterceptor,
  IHttpNextFunction,
  IHttpResponse,
} from "@stackra/contracts";
import { HttpMethod } from "@stackra/contracts";

import { InterceptorPipeline } from "../../src/core/services/interceptor-pipeline.service";

// ────────────────────────────────────────────────────────────────────────
// Fixtures
// ────────────────────────────────────────────────────────────────────────

function makeContext(): IHttpContext {
  return {
    request: {
      method: HttpMethod.GET,
      url: "/api/users",
      baseURL: "https://api.example.com",
      meta: {},
    },
    metadata: new Map(),
  };
}

const response: IHttpResponse = {
  data: { ok: true },
  status: 200,
  statusText: "OK",
  headers: {},
};

// ────────────────────────────────────────────────────────────────────────
// Specs
// ────────────────────────────────────────────────────────────────────────

describe("InterceptorPipeline", () => {
  it("runs the terminal directly when no interceptors are registered", async () => {
    const pipeline = new InterceptorPipeline();
    const terminal: IHttpNextFunction = vi.fn().mockResolvedValue(response);

    const result = await pipeline.execute([], makeContext(), terminal);
    expect(result).toBe(response);
    expect(terminal).toHaveBeenCalledOnce();
  });

  it("runs interceptors in the order they were provided (pre-handler)", async () => {
    const order: string[] = [];

    const makeInterceptor = (id: string): IHttpInterceptor => ({
      async intercept(ctx, next) {
        order.push(`${id}-pre`);
        const res = await next(ctx);
        order.push(`${id}-post`);
        return res;
      },
    });

    const pipeline = new InterceptorPipeline();
    const terminal: IHttpNextFunction = async () => {
      order.push("terminal");
      return response;
    };

    await pipeline.execute(
      [makeInterceptor("a"), makeInterceptor("b"), makeInterceptor("c")],
      makeContext(),
      terminal,
    );

    // Onion-shape: a-pre → b-pre → c-pre → terminal → c-post → b-post → a-post.
    expect(order).toEqual([
      "a-pre",
      "b-pre",
      "c-pre",
      "terminal",
      "c-post",
      "b-post",
      "a-post",
    ]);
  });

  it("terminal receives the final context passed by the last interceptor", async () => {
    const pipeline = new InterceptorPipeline();
    const terminal: IHttpNextFunction = vi.fn().mockResolvedValue(response);
    const ctx = makeContext();

    await pipeline.execute([], ctx, terminal);
    expect(terminal).toHaveBeenCalledWith(ctx);
  });

  it("throws when an interceptor calls next() more than once", async () => {
    const badInterceptor: IHttpInterceptor = {
      async intercept(ctx, next) {
        // Second call — pipeline detects and throws.
        await next(ctx);
        return next(ctx);
      },
    };
    const pipeline = new InterceptorPipeline();
    const terminal: IHttpNextFunction = vi.fn().mockResolvedValue(response);

    await expect(
      pipeline.execute([badInterceptor], makeContext(), terminal),
    ).rejects.toThrow(/next\(\) called multiple times/);
  });

  it("propagates a rejection thrown by any interceptor", async () => {
    const failing: IHttpInterceptor = {
      async intercept() {
        throw new Error("interceptor failed");
      },
    };
    const pipeline = new InterceptorPipeline();
    const terminal: IHttpNextFunction = vi.fn();

    await expect(
      pipeline.execute([failing], makeContext(), terminal),
    ).rejects.toThrow("interceptor failed");
    // Terminal never called — the pre-handler threw.
    expect(terminal).not.toHaveBeenCalled();
  });

  it("propagates a rejection thrown by the terminal through the chain", async () => {
    const captured: string[] = [];
    const outer: IHttpInterceptor = {
      async intercept(ctx, next) {
        try {
          return await next(ctx);
        } catch (err) {
          captured.push((err as Error).message);
          throw err;
        }
      },
    };

    const pipeline = new InterceptorPipeline();
    const terminal: IHttpNextFunction = async () => {
      throw new Error("network dead");
    };

    await expect(
      pipeline.execute([outer], makeContext(), terminal),
    ).rejects.toThrow("network dead");
    expect(captured).toEqual(["network dead"]);
  });
});
