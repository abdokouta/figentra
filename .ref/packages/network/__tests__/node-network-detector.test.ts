/**
 * @file node-network-detector.test.ts
 * @module @stackra/network/__tests__
 * @description Behavioural spec for `NodeNetworkDetector`.
 *
 *   The detector polls DNS resolution on a configurable host at a
 *   configurable interval. Tests stub the `dns.lookup` callback via
 *   `vi.mock` so no real network I/O fires; fake timers drive the
 *   poll cadence deterministically.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── Stub `dns.lookup` at module boundary — the detector performs a
//    dynamic `import('dns')`, so we replace the exported module with a
//    controllable lookup fn. `mockLookup` is redefined per test.
const dnsLookupCalls: Array<{ host: string }> = [];
let dnsShouldFail = false;
vi.mock("dns", () => {
  return {
    default: {
      lookup: (host: string, cb: (err: Error | null) => void) => {
        dnsLookupCalls.push({ host });
        if (dnsShouldFail) cb(new Error("ENOTFOUND"));
        else cb(null);
      },
    },
    lookup: (host: string, cb: (err: Error | null) => void) => {
      dnsLookupCalls.push({ host });
      if (dnsShouldFail) cb(new Error("ENOTFOUND"));
      else cb(null);
    },
  };
});

import { NodeNetworkDetector } from "../src/core/detectors/node-network.detector";

// ════════════════════════════════════════════════════════════════════════════════
// Suite
// ════════════════════════════════════════════════════════════════════════════════

describe("NodeNetworkDetector", () => {
  beforeEach(() => {
    dnsLookupCalls.length = 0;
    dnsShouldFail = false;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getStatus()", () => {
    it("returns { isOnline: true, type: 'ethernet' } when DNS lookup succeeds", async () => {
      const detector = new NodeNetworkDetector({ pollIntervalMs: 60_000 });
      try {
        await expect(detector.getStatus()).resolves.toEqual({
          isOnline: true,
          type: "ethernet",
        });
      } finally {
        detector.destroy();
      }
    });

    it("returns { isOnline: false } when the DNS lookup fails", async () => {
      dnsShouldFail = true;
      const detector = new NodeNetworkDetector({ pollIntervalMs: 60_000 });
      try {
        await expect(detector.getStatus()).resolves.toMatchObject({
          isOnline: false,
        });
      } finally {
        detector.destroy();
      }
    });

    it("uses the configured dnsHost", async () => {
      const detector = new NodeNetworkDetector({
        pollIntervalMs: 60_000,
        dnsHost: "cloudflare.com",
      });
      try {
        await detector.getStatus();
        expect(dnsLookupCalls.map((c) => c.host)).toContain("cloudflare.com");
      } finally {
        detector.destroy();
      }
    });

    it("defaults dnsHost to 'dns.google' when unset", async () => {
      const detector = new NodeNetworkDetector();
      try {
        await detector.getStatus();
        expect(dnsLookupCalls.map((c) => c.host)).toContain("dns.google");
      } finally {
        detector.destroy();
      }
    });
  });

  describe("isOnline()", () => {
    it("returns the last known state without triggering a lookup", async () => {
      const detector = new NodeNetworkDetector({ pollIntervalMs: 60_000 });
      try {
        // Seed via getStatus().
        await detector.getStatus();
        dnsLookupCalls.length = 0;

        expect(detector.isOnline()).toBe(true);
        expect(dnsLookupCalls).toHaveLength(0);
      } finally {
        detector.destroy();
      }
    });

    it("reports offline once a poll cycle fails", async () => {
      const detector = new NodeNetworkDetector({ pollIntervalMs: 10 });
      try {
        // Initial call to seed the state.
        await detector.getStatus();
        expect(detector.isOnline()).toBe(true);

        // Force the next poll to fail then advance the timer + drain
        // pending microtasks so the async DNS callback resolves.
        dnsShouldFail = true;
        await vi.advanceTimersByTimeAsync(15);
        await vi.runOnlyPendingTimersAsync();

        expect(detector.isOnline()).toBe(false);
      } finally {
        detector.destroy();
      }
    });
  });

  describe("subscribe()", () => {
    it("fires the callback only on state transitions", async () => {
      const detector = new NodeNetworkDetector({ pollIntervalMs: 10 });
      try {
        const seen: boolean[] = [];
        detector.subscribe((status) => seen.push(status.isOnline));

        // Poll #1 — success matches the initial `lastOnline=true`, no fire.
        await vi.advanceTimersByTimeAsync(15);
        await vi.runOnlyPendingTimersAsync();
        expect(seen).toEqual([]);

        // Poll #2 — flip to failing → fires with false.
        dnsShouldFail = true;
        await vi.advanceTimersByTimeAsync(15);
        await vi.runOnlyPendingTimersAsync();
        expect(seen).toEqual([false]);

        // Poll #3 — flip back to succeeding → fires with true.
        dnsShouldFail = false;
        await vi.advanceTimersByTimeAsync(15);
        await vi.runOnlyPendingTimersAsync();
        expect(seen).toEqual([false, true]);
      } finally {
        detector.destroy();
      }
    });

    it("stops firing after the unsubscribe function is called", async () => {
      const detector = new NodeNetworkDetector({ pollIntervalMs: 10 });
      try {
        let hits = 0;
        const unsub = detector.subscribe(() => hits++);

        dnsShouldFail = true;
        await vi.advanceTimersByTimeAsync(15);
        await vi.runOnlyPendingTimersAsync();
        expect(hits).toBe(1);

        unsub();
        dnsShouldFail = false;
        await vi.advanceTimersByTimeAsync(15);
        await vi.runOnlyPendingTimersAsync();
        expect(hits).toBe(1);
      } finally {
        detector.destroy();
      }
    });
  });

  describe("destroy()", () => {
    it("stops the poll timer so later ticks fire no listeners", async () => {
      const detector = new NodeNetworkDetector({ pollIntervalMs: 10 });
      let hits = 0;
      detector.subscribe(() => hits++);

      detector.destroy();

      dnsShouldFail = true;
      await vi.advanceTimersByTimeAsync(100);
      await vi.runOnlyPendingTimersAsync();
      expect(hits).toBe(0);
    });
  });
});
