/**
 * @file create-lazy-http-client.spec.ts
 * @module @stackra/http/test/unit
 * @description `createLazyHttpClient(resolve)` returns a Proxy that
 *   defers the underlying `resolve()` call until first method call,
 *   forwards both unary and streaming methods, and caches the
 *   resolved concrete `IHttpClient`. Closes
 *   `.kiro/backlog-frontend-2026-07-27.md` §2.20.
 */

import { describe, expect, it, vi } from "vitest";

import type {
  IHttpClient,
  IHttpResponse,
  IHttpStream,
} from "@stackra/contracts";

import { createLazyHttpClient } from "../../src/core/utils/create-lazy-http-client.util";

/**
 * Build a minimal concrete `IHttpClient` for tests. Only the methods
 * exercised in each test need be implemented — the rest throw so
 * accidental calls surface immediately.
 */
function makeStubClient(overrides: Partial<IHttpClient> = {}): IHttpClient {
  const unimplemented = (name: string) => {
    return () => {
      throw new Error(`stub.${name} not implemented for this test`);
    };
  };
  return {
    get: unimplemented("get"),
    post: unimplemented("post"),
    put: unimplemented("put"),
    patch: unimplemented("patch"),
    delete: unimplemented("delete"),
    request: unimplemented("request"),
    stream: unimplemented("stream"),
    sse: unimplemented("sse"),
    ...overrides,
  } as IHttpClient;
}

describe("createLazyHttpClient", () => {
  it("does NOT call the resolver at construction time", () => {
    const resolve = vi.fn<() => Promise<IHttpClient>>(async () =>
      makeStubClient(),
    );
    createLazyHttpClient(resolve);
    expect(resolve).not.toHaveBeenCalled();
  });

  it("resolves + forwards a unary method on first call", async () => {
    const response: IHttpResponse<{ ok: true }> = {
      data: { ok: true },
      status: 200,
      statusText: "OK",
      headers: {},
      config: { url: "/login" },
    } as unknown as IHttpResponse<{ ok: true }>;

    const post = vi.fn().mockResolvedValue(response);
    const resolve = vi.fn<() => Promise<IHttpClient>>(async () =>
      makeStubClient({ post: post as unknown as IHttpClient["post"] }),
    );

    const lazy = createLazyHttpClient(resolve);
    const result = await lazy.post<{ ok: true }>("/login", { email: "a@b" });

    expect(result).toBe(response);
    expect(post).toHaveBeenCalledExactlyOnceWith("/login", { email: "a@b" });
    expect(resolve).toHaveBeenCalledTimes(1);
  });

  it("caches the concrete client across repeated calls", async () => {
    const get = vi.fn().mockResolvedValue({} as IHttpResponse);
    const resolve = vi.fn<() => Promise<IHttpClient>>(async () =>
      makeStubClient({ get: get as unknown as IHttpClient["get"] }),
    );
    const lazy = createLazyHttpClient(resolve);

    await lazy.get("/one");
    await lazy.get("/two");
    await lazy.get("/three");

    // Single resolve, three forwarded calls.
    expect(resolve).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledTimes(3);
  });

  it("shares a single resolve across concurrent first-uses (race safety)", async () => {
    const post = vi.fn().mockResolvedValue({} as IHttpResponse);
    const resolve = vi.fn<() => Promise<IHttpClient>>(
      async () =>
        new Promise((r) =>
          setTimeout(
            () =>
              r(
                makeStubClient({
                  post: post as unknown as IHttpClient["post"],
                }),
              ),
            10,
          ),
        ),
    );
    const lazy = createLazyHttpClient(resolve);

    // Fire multiple calls before the underlying promise settles.
    await Promise.all([lazy.post("/a"), lazy.post("/b"), lazy.post("/c")]);

    // Only one resolve, three forwarded calls.
    expect(resolve).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledTimes(3);
  });

  it("forwards the streaming methods and lazy-iterates the concrete stream", async () => {
    // Concrete stream that yields two decoded values, then ends.
    const concreteStream: IHttpStream<number> = {
      [Symbol.asyncIterator](): AsyncIterator<number> {
        let n = 0;
        return {
          async next(): Promise<IteratorResult<number>> {
            if (n < 2) {
              n += 1;
              return { value: n, done: false };
            }
            return { value: undefined as unknown as number, done: true };
          },
        };
      },
      cancel: vi.fn(),
    };

    const stream = vi.fn().mockReturnValue(concreteStream);
    const resolve = vi.fn<() => Promise<IHttpClient>>(async () =>
      makeStubClient({ stream: stream as unknown as IHttpClient["stream"] }),
    );

    const lazy = createLazyHttpClient(resolve);
    const lazyStream = lazy.stream<number>("/events");

    // No resolve until iteration begins.
    expect(resolve).not.toHaveBeenCalled();

    const values: number[] = [];
    for await (const value of lazyStream) {
      values.push(value);
    }

    expect(values).toEqual([1, 2]);
    expect(resolve).toHaveBeenCalledTimes(1);
    expect(stream).toHaveBeenCalledExactlyOnceWith("/events");
  });

  it("cancel() before the stream resolves cancels the concrete stream once it arrives", async () => {
    const cancel = vi.fn();
    const concreteStream: IHttpStream<number> = {
      [Symbol.asyncIterator](): AsyncIterator<number> {
        return {
          async next(): Promise<IteratorResult<number>> {
            return { value: 1, done: false };
          },
        };
      },
      cancel,
    };
    const resolve = vi.fn<() => Promise<IHttpClient>>(async () =>
      makeStubClient({
        stream: (() => concreteStream) as unknown as IHttpClient["stream"],
      }),
    );
    const lazy = createLazyHttpClient(resolve);
    const lazyStream = lazy.stream("/events");

    // Cancel before iteration — nothing to cancel yet.
    lazyStream.cancel();
    expect(cancel).not.toHaveBeenCalled();
    expect(resolve).not.toHaveBeenCalled();

    // Now start iterating — the concrete stream resolves, sees the
    // pending cancellation, cancels the concrete stream, and ends.
    const iterator = lazyStream[Symbol.asyncIterator]();
    const first = await iterator.next();
    expect(first.done).toBe(true);
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("returns undefined for non-IHttpClient property reads (no Proxy leaks)", () => {
    const lazy = createLazyHttpClient(async () => makeStubClient());
    // Non-method properties should not appear on the surface.
    expect((lazy as unknown as { foo?: unknown }).foo).toBeUndefined();
    // Symbol keys likewise — the Proxy short-circuits non-strings.
    expect(
      (lazy as unknown as Record<symbol, unknown>)[Symbol.iterator],
    ).toBeUndefined();
  });
});
