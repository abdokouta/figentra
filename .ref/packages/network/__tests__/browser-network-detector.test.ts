// @vitest-environment jsdom
/**
 * @file browser-network-detector.test.ts
 * @module @stackra/network/__tests__
 * @description Behavioural spec for `BrowserNetworkDetector`.
 *
 *   Covers the two paths the detector actually walks:
 *   - `navigator.onLine` reads (with Network Information API when
 *     available).
 *   - Subscription lifecycle — subscribe / notify on
 *     online-offline-change events / unsubscribe / destroy.
 *
 *   The Network Information API is not shipped by jsdom, so the
 *   `.connection` slot is stubbed per-suite. The `online` /
 *   `offline` window events are jsdom-native.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { BrowserNetworkDetector } from "../src/react/detectors/browser-network.detector";

// ════════════════════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Minimal EventTarget-backed connection object modelling the Network
 * Information API. Consumers stub the read-only `type` + `downlink`
 * fields; `dispatchEvent(new Event("change"))` fires the
 * detector's change listener.
 */
function createConnection(
  overrides: Partial<{ type: string; downlink: number }> = {},
): EventTarget & { type?: string; downlink?: number } {
  const target = new EventTarget() as EventTarget & {
    type?: string;
    downlink?: number;
  };
  target.type = overrides.type;
  target.downlink = overrides.downlink;
  return target;
}

function setNavigatorOnLine(value: boolean): void {
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    writable: true,
    value,
  });
}

function setNavigatorConnection(value: unknown): void {
  Object.defineProperty(navigator, "connection", {
    configurable: true,
    writable: true,
    value,
  });
}

// ════════════════════════════════════════════════════════════════════════════════
// Suite
// ════════════════════════════════════════════════════════════════════════════════

describe("BrowserNetworkDetector", () => {
  const originalOnLine = navigator.onLine;
  const originalConnection = (navigator as unknown as { connection?: unknown })
    .connection;

  afterEach(() => {
    setNavigatorOnLine(originalOnLine);
    setNavigatorConnection(originalConnection);
  });

  describe("isOnline()", () => {
    it("mirrors navigator.onLine when it is true", () => {
      setNavigatorOnLine(true);
      const detector = new BrowserNetworkDetector();
      try {
        expect(detector.isOnline()).toBe(true);
      } finally {
        detector.destroy();
      }
    });

    it("mirrors navigator.onLine when it is false", () => {
      setNavigatorOnLine(false);
      const detector = new BrowserNetworkDetector();
      try {
        expect(detector.isOnline()).toBe(false);
      } finally {
        detector.destroy();
      }
    });
  });

  describe("getStatus()", () => {
    beforeEach(() => {
      setNavigatorOnLine(true);
      setNavigatorConnection(undefined);
    });

    it("returns type='unknown' + no downlink when Network Information API is absent", async () => {
      const detector = new BrowserNetworkDetector();
      try {
        await expect(detector.getStatus()).resolves.toEqual({
          isOnline: true,
          type: "unknown",
          downlinkSpeed: undefined,
        });
      } finally {
        detector.destroy();
      }
    });

    it("maps connection.type=wifi + downlink through to the status", async () => {
      setNavigatorConnection(createConnection({ type: "wifi", downlink: 25 }));
      const detector = new BrowserNetworkDetector();
      try {
        await expect(detector.getStatus()).resolves.toEqual({
          isOnline: true,
          type: "wifi",
          downlinkSpeed: 25,
        });
      } finally {
        detector.destroy();
      }
    });

    it("maps connection.type=cellular through to the status", async () => {
      setNavigatorConnection(
        createConnection({ type: "cellular", downlink: 4 }),
      );
      const detector = new BrowserNetworkDetector();
      try {
        await expect(detector.getStatus()).resolves.toMatchObject({
          type: "cellular",
        });
      } finally {
        detector.destroy();
      }
    });

    it("maps connection.type=ethernet through to the status", async () => {
      setNavigatorConnection(createConnection({ type: "ethernet" }));
      const detector = new BrowserNetworkDetector();
      try {
        await expect(detector.getStatus()).resolves.toMatchObject({
          type: "ethernet",
        });
      } finally {
        detector.destroy();
      }
    });

    it("falls back to type='unknown' for unrecognised connection.type values", async () => {
      setNavigatorConnection(createConnection({ type: "satellite" }));
      const detector = new BrowserNetworkDetector();
      try {
        await expect(detector.getStatus()).resolves.toMatchObject({
          type: "unknown",
        });
      } finally {
        detector.destroy();
      }
    });
  });

  describe("subscribe()", () => {
    beforeEach(() => {
      setNavigatorOnLine(true);
      setNavigatorConnection(undefined);
    });

    it("fires the listener on the window's `offline` event", () => {
      const detector = new BrowserNetworkDetector();
      try {
        const seen: boolean[] = [];
        detector.subscribe((status) => seen.push(status.isOnline));

        setNavigatorOnLine(false);
        window.dispatchEvent(new Event("offline"));

        expect(seen).toEqual([false]);
      } finally {
        detector.destroy();
      }
    });

    it("fires the listener on the window's `online` event", () => {
      setNavigatorOnLine(false);
      const detector = new BrowserNetworkDetector();
      try {
        const seen: boolean[] = [];
        detector.subscribe((status) => seen.push(status.isOnline));

        setNavigatorOnLine(true);
        window.dispatchEvent(new Event("online"));

        expect(seen).toEqual([true]);
      } finally {
        detector.destroy();
      }
    });

    it("fires the listener on connection.change when the Network Information API is present", () => {
      const connection = createConnection({ type: "wifi", downlink: 10 });
      setNavigatorConnection(connection);
      const detector = new BrowserNetworkDetector();
      try {
        const types: string[] = [];
        detector.subscribe((status) => types.push(status.type));

        (connection as EventTarget & { type?: string }).type = "cellular";
        connection.dispatchEvent(new Event("change"));

        expect(types).toEqual(["cellular"]);
      } finally {
        detector.destroy();
      }
    });

    it("stops firing after the returned unsubscribe function is called", () => {
      const detector = new BrowserNetworkDetector();
      try {
        let hits = 0;
        const unsubscribe = detector.subscribe(() => hits++);
        window.dispatchEvent(new Event("offline"));
        expect(hits).toBe(1);

        unsubscribe();
        window.dispatchEvent(new Event("offline"));
        expect(hits).toBe(1); // Still 1 — no additional call.
      } finally {
        detector.destroy();
      }
    });

    it("does not crash the loop when a subscriber throws", () => {
      const detector = new BrowserNetworkDetector();
      try {
        const seen: boolean[] = [];
        detector.subscribe(() => {
          throw new Error("bang");
        });
        detector.subscribe((status) => seen.push(status.isOnline));

        setNavigatorOnLine(false);
        expect(() => window.dispatchEvent(new Event("offline"))).not.toThrow();
        expect(seen).toEqual([false]);
      } finally {
        detector.destroy();
      }
    });
  });

  describe("destroy()", () => {
    it("removes window listeners so later events do not fire subscribers", () => {
      const detector = new BrowserNetworkDetector();
      let hits = 0;
      detector.subscribe(() => hits++);

      detector.destroy();

      window.dispatchEvent(new Event("offline"));
      expect(hits).toBe(0);
    });
  });
});
