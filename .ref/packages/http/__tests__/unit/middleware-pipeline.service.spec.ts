/**
 * @file middleware-pipeline.service.spec.ts
 * @module @stackra/http/__tests__/unit
 */

import { describe, expect, it } from "vitest";
import type {
  IHttpMiddleware,
  IHttpNextFunction,
  IHttpContext,
} from "@stackra/contracts";

import { MiddlewarePipeline } from "../../src/core/services/middleware-pipeline.service";

function buildContext(): IHttpContext {
  return {
    request: {
      method: "GET" as const,
      url: "https://example.com/x",
      headers: {},
    },
    metadata: {} as never,
  } as IHttpContext;
}

describe("MiddlewarePipeline", () => {
  it("runs middlewares in order and finishes at the terminal handler", async () => {
    const pipeline = new MiddlewarePipeline();
    const log: string[] = [];

    const mw1: IHttpMiddleware = {
      handle: async (_ctx, next) => {
        log.push("mw1-before");
        const res = await next();
        log.push("mw1-after");
        return res;
      },
    };
    const mw2: IHttpMiddleware = {
      handle: async (_ctx, next) => {
        log.push("mw2-before");
        const res = await next();
        log.push("mw2-after");
        return res;
      },
    };

    const terminal: IHttpNextFunction = async () => {
      log.push("terminal");
      return { status: 200, body: null, headers: {} } as never;
    };

    const response = await pipeline.execute(
      [mw1, mw2],
      buildContext(),
      terminal,
    );
    expect(response.status).toBe(200);
    expect(log).toEqual([
      "mw1-before",
      "mw2-before",
      "terminal",
      "mw2-after",
      "mw1-after",
    ]);
  });

  it("supports short-circuit — middleware can return without calling next", async () => {
    const pipeline = new MiddlewarePipeline();
    const shortCircuit: IHttpMiddleware = {
      handle: async () => ({ status: 418, body: null, headers: {} }) as never,
    };
    const mw2: IHttpMiddleware = {
      handle: async (_ctx, next) => next(),
    };

    let terminalHit = false;
    const terminal: IHttpNextFunction = async () => {
      terminalHit = true;
      return { status: 200, body: null, headers: {} } as never;
    };

    const response = await pipeline.execute(
      [shortCircuit, mw2],
      buildContext(),
      terminal,
    );
    expect(response.status).toBe(418);
    expect(terminalHit).toBe(false);
  });

  it("empty middleware list runs the terminal directly", async () => {
    const pipeline = new MiddlewarePipeline();
    const terminal: IHttpNextFunction = async () =>
      ({ status: 204, body: null, headers: {} }) as never;

    const response = await pipeline.execute([], buildContext(), terminal);
    expect(response.status).toBe(204);
  });

  it("throws when next() is called twice by a middleware", async () => {
    const pipeline = new MiddlewarePipeline();
    const doubleNext: IHttpMiddleware = {
      handle: async (_ctx, next) => {
        await next();
        // Bug — call next twice.
        return next();
      },
    };
    const terminal: IHttpNextFunction = async () =>
      ({ status: 200, body: null, headers: {} }) as never;

    await expect(
      pipeline.execute([doubleNext], buildContext(), terminal),
    ).rejects.toThrow(/next\(\) called multiple times/);
  });
});
