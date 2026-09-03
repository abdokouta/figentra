/**
 * @file token-bucket.spec.ts
 * @module @stackra/http/__tests__/unit
 * @description Behavioural spec for `TokenBucketService`.
 */

import { describe, expect, it } from "vitest";
import type { IHttpRateLimitEndpointConfig } from "@stackra/contracts";

import { TokenBucketService } from "../../src/core/services/token-bucket.service";

const config: IHttpRateLimitEndpointConfig = {
  requestsPerWindow: 3, // capacity
  windowSizeMs: 1000,
  refillRate: 3, // 3 tokens/sec — one per ~333ms
};

describe("TokenBucketService — capacity", () => {
  it("allows up to `requestsPerWindow` consumes without waiting", async () => {
    const svc = new TokenBucketService();
    // Three consecutive consumes resolve immediately.
    await svc.consume("GET:/users", config);
    await svc.consume("GET:/users", config);
    await svc.consume("GET:/users", config);
    // The bucket is now empty — token count is < 1.
    expect(svc.getTokenCount("GET:/users")).toBeLessThan(1);
  });

  it("creates a bucket lazily on the first consume", async () => {
    const svc = new TokenBucketService();
    // Before any consume — no bucket for this endpoint.
    expect(svc.getTokenCount("GET:/new")).toBeNull();

    await svc.consume("GET:/new", config);
    // Now there's a bucket with (capacity - 1) tokens.
    expect(svc.getTokenCount("GET:/new")).toBeGreaterThanOrEqual(0);
  });
});

describe("TokenBucketService — per-endpoint isolation", () => {
  it("uses independent buckets per endpoint identifier", async () => {
    const svc = new TokenBucketService();
    // Drain the first endpoint.
    await svc.consume("GET:/a", config);
    await svc.consume("GET:/a", config);
    await svc.consume("GET:/a", config);

    // /b starts fresh, no wait.
    const start = Date.now();
    await svc.consume("GET:/b", config);
    expect(Date.now() - start).toBeLessThan(50);
  });
});

describe("TokenBucketService — introspection", () => {
  it("getWaitQueueSize() returns null before the bucket exists", () => {
    const svc = new TokenBucketService();
    expect(svc.getWaitQueueSize("GET:/x")).toBeNull();
  });

  it("getWaitQueueSize() returns 0 for a bucket with tokens available", async () => {
    const svc = new TokenBucketService();
    await svc.consume("GET:/y", config);
    expect(svc.getWaitQueueSize("GET:/y")).toBe(0);
  });

  it("clear() removes every bucket", async () => {
    const svc = new TokenBucketService();
    await svc.consume("GET:/z", config);
    expect(svc.getTokenCount("GET:/z")).not.toBeNull();

    svc.clear();
    expect(svc.getTokenCount("GET:/z")).toBeNull();
  });
});
