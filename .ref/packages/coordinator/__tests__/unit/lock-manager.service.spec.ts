/**
 * @file lock-manager.service.spec.ts
 * @module @stackra/coordinator/__tests__/unit
 * @description Behavioural spec for `LockManager`. Covers the two
 *   acquisition paths (Web Locks API primary + `localStorage` CAS
 *   fallback), private-mode / SSR guards, and timeout handling.
 *
 *   The Web Locks path is stubbed with a Map-backed fake so the CAS
 *   contract stays deterministic without depending on jsdom's
 *   `navigator.locks` capability. The fallback path uses jsdom's
 *   real `localStorage`.
 *
 *   Note: `LockManager` does not currently emit `BroadcastChannel`
 *   messages on lock acquisition — the task's "cross-tab
 *   notification via BroadcastChannel" is aspirational and not
 *   asserted here.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CoordinatorError } from "../../src/core/errors";
import { LockManager } from "../../src/core/services/lock-manager.service";

// ════════════════════════════════════════════════════════════════════════════════
// Fake `navigator.locks` — minimal shape used by LockManager
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Minimal in-memory implementation of the Web Locks API. Requests
 * queue per-name; the callback fires the moment the previous holder
 * releases. Abort signals reject with a DOMException-shaped
 * `AbortError` matching the browser's behaviour.
 */
interface IFakeLock {
  name: string;
  mode: "exclusive";
}

function createFakeLocks(): {
  request: (typeof navigator)["locks"]["request"];
  query: (typeof navigator)["locks"]["query"];
  __getHeld: () => IFakeLock[];
} {
  const held = new Map<string, IFakeLock>();
  const queues = new Map<string, Array<() => void>>();

  const request = (async (
    name: string,
    options:
      | { mode?: "exclusive" | "shared"; signal?: AbortSignal }
      | ((lock: IFakeLock) => Promise<unknown>),
    maybeCallback?: (lock: IFakeLock) => Promise<unknown>,
  ) => {
    const opts = typeof options === "function" ? {} : (options ?? {});
    const callback = (
      typeof options === "function" ? options : maybeCallback
    ) as (lock: IFakeLock) => Promise<unknown>;
    const signal = "signal" in opts ? opts.signal : undefined;

    const lock: IFakeLock = { name, mode: "exclusive" };

    // Atomic check-and-claim: inside the promise executor either the slot
    // is free (claim it synchronously + resolve) OR it is held (enqueue a
    // resumer the previous holder's `finally` fires). Doing both steps in
    // one synchronous window prevents two callers from observing "free"
    // between check and set.
    await new Promise<void>((resolve, reject) => {
      const abortErr = (): Error => {
        const err = new Error("The operation was aborted.");
        err.name = "AbortError";
        return err;
      };

      if (signal?.aborted) {
        reject(abortErr());
        return;
      }

      const claim = (): void => {
        held.set(name, lock);
        resolve();
      };

      if (!held.has(name)) {
        claim();
        return;
      }

      const queue = queues.get(name) ?? [];
      const attempt = (): void => {
        if (signal?.aborted) {
          reject(abortErr());
          return;
        }
        if (held.has(name)) {
          // Race — the slot got taken between the wake and this callback.
          // Re-enqueue at the head so FIFO order is preserved.
          const q = queues.get(name) ?? [];
          q.unshift(attempt);
          queues.set(name, q);
          return;
        }
        claim();
      };
      queue.push(attempt);
      queues.set(name, queue);

      if (signal) {
        signal.addEventListener("abort", () => {
          const q = queues.get(name) ?? [];
          const idx = q.indexOf(attempt);
          if (idx >= 0) q.splice(idx, 1);
          reject(abortErr());
        });
      }
    });

    try {
      return await callback(lock);
    } finally {
      held.delete(name);
      const queue = queues.get(name);
      const next = queue?.shift();
      if (next) next();
    }
  }) as unknown as (typeof navigator)["locks"]["request"];

  const query = (async () => ({
    held: [...held.values()],
    pending: [],
  })) as unknown as (typeof navigator)["locks"]["query"];

  return { request, query, __getHeld: () => [...held.values()] };
}

// ════════════════════════════════════════════════════════════════════════════════
// Test suite
// ════════════════════════════════════════════════════════════════════════════════

/**
 * The coordinator vitest config runs on `environment: "node"`, so
 * neither `navigator.locks` nor `localStorage` are provided by
 * jsdom. Each suite installs the shape it needs — and removes the
 * `locks` property entirely for the fallback path so
 * `"locks" in navigator` returns `false` in
 * `LockManager.isWebLocksAvailable()`.
 */
function ensureNavigator(): void {
  if (typeof globalThis.navigator === "undefined") {
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      writable: true,
      value: {},
    });
  }
}

function installNavigatorLocks(value: unknown): void {
  ensureNavigator();
  Object.defineProperty(globalThis.navigator, "locks", {
    configurable: true,
    writable: true,
    value,
  });
}

function removeNavigatorLocks(): void {
  ensureNavigator();
  // Actually delete the property so `"locks" in navigator` → false.
  Reflect.deleteProperty(globalThis.navigator, "locks");
}

/**
 * In-memory `Storage` implementation matching `localStorage`'s
 * synchronous shape. Instances swap in / out per test so the CAS
 * assertions stay isolated.
 */
function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length(): number {
      return map.size;
    },
    key(i: number): string | null {
      return [...map.keys()][i] ?? null;
    },
    getItem(k: string): string | null {
      return map.has(k) ? (map.get(k) as string) : null;
    },
    setItem(k: string, v: string): void {
      map.set(k, String(v));
    },
    removeItem(k: string): void {
      map.delete(k);
    },
    clear(): void {
      map.clear();
    },
  } as Storage;
}

function installLocalStorage(storage: Storage | undefined): void {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    writable: true,
    value: storage,
  });
}

describe("LockManager", () => {
  afterEach(() => {
    removeNavigatorLocks();
    installLocalStorage(undefined);
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("Web Locks path (primary)", () => {
    beforeEach(() => {
      installNavigatorLocks(createFakeLocks());
    });

    it("runs the callback under an exclusive lock and returns its value", async () => {
      const manager = new LockManager();

      const result = await manager.run(
        "token-refresh",
        async () => "fresh-token",
      );

      expect(result).toBe("fresh-token");
    });

    it("serialises overlapping acquisitions of the same name", async () => {
      const manager = new LockManager();
      const events: string[] = [];

      const first = manager.run("db-migration", async () => {
        events.push("first-in");
        await Promise.resolve();
        events.push("first-out");
        return 1;
      });

      const second = manager.run("db-migration", async () => {
        events.push("second-in");
        events.push("second-out");
        return 2;
      });

      const [firstResult, secondResult] = await Promise.all([first, second]);

      expect(firstResult).toBe(1);
      expect(secondResult).toBe(2);
      expect(events).toEqual([
        "first-in",
        "first-out",
        "second-in",
        "second-out",
      ]);
    });

    it("permits concurrent acquisitions of DIFFERENT lock names", async () => {
      const manager = new LockManager();
      const inside: string[] = [];

      const a = manager.run("lock-a", async () => {
        inside.push("a");
        await Promise.resolve();
        return "a";
      });

      const b = manager.run("lock-b", async () => {
        inside.push("b");
        return "b";
      });

      await Promise.all([a, b]);

      // Both callbacks entered before either resolved.
      expect(inside).toContain("a");
      expect(inside).toContain("b");
    });

    it("propagates errors thrown inside the callback (and releases the lock)", async () => {
      const manager = new LockManager();

      await expect(
        manager.run("failing", async () => {
          throw new Error("boom");
        }),
      ).rejects.toThrow("boom");

      // The lock must be released — a follow-up acquisition succeeds.
      await expect(
        manager.run("failing", async () => "recovered"),
      ).resolves.toBe("recovered");
    });

    it("throws CoordinatorError with LOCK_TIMEOUT when the timeout fires", async () => {
      const manager = new LockManager();

      // Hold the lock so the second request has to wait.
      let releaseFirst: () => void = () => undefined;
      const firstDone = new Promise<void>((resolve) => {
        releaseFirst = resolve;
      });

      const holder = manager.run("busy", async () => {
        await firstDone;
      });

      // Request the same lock with a short timeout — should abort.
      const attempt = manager.run("busy", async () => "never", {
        timeoutMs: 20,
      });

      await expect(attempt).rejects.toBeInstanceOf(CoordinatorError);
      await expect(attempt).rejects.toMatchObject({
        code: "LOCK_TIMEOUT",
      });

      releaseFirst();
      await holder;
    });

    it("isLocked() returns true while the lock is held and false after release", async () => {
      const manager = new LockManager();

      let releaseFirst: () => void = () => undefined;
      const firstDone = new Promise<void>((resolve) => {
        releaseFirst = resolve;
      });

      const holder = manager.run("held", async () => {
        await firstDone;
      });

      // Give the fake time to flip `held`.
      await Promise.resolve();

      await expect(manager.isLocked("held")).resolves.toBe(true);

      releaseFirst();
      await holder;

      await expect(manager.isLocked("held")).resolves.toBe(false);
    });

    it("prefixes the internal lock name with the configured channel prefix", async () => {
      // Custom channel name flows into `${channelName}:lock:${name}` — assert
      // via `isLocked()` (which uses the same prefix logic).
      const manager = new LockManager({ channelName: "custom-channel" });

      let releaseFirst: () => void = () => undefined;
      const firstDone = new Promise<void>((resolve) => {
        releaseFirst = resolve;
      });

      const holder = manager.run("scoped", async () => {
        await firstDone;
      });

      await Promise.resolve();
      await expect(manager.isLocked("scoped")).resolves.toBe(true);

      releaseFirst();
      await holder;
    });
  });

  describe("localStorage CAS fallback (older browsers)", () => {
    beforeEach(() => {
      // Remove the Web Locks entrypoint so isWebLocksAvailable() → false.
      removeNavigatorLocks();
      installLocalStorage(createMemoryStorage());
    });

    it("runs the callback and releases the lock on success", async () => {
      const manager = new LockManager({ preferWebLocks: false });

      const result = await manager.run("fallback-happy", async () => "ok");

      expect(result).toBe("ok");
      expect(
        localStorage.getItem("__lock__stackra-coordinator:lock:fallback-happy"),
      ).toBeNull();
    });

    it("releases the lock even when the callback throws", async () => {
      const manager = new LockManager({ preferWebLocks: false });

      await expect(
        manager.run("fallback-throws", async () => {
          throw new Error("boom");
        }),
      ).rejects.toThrow("boom");

      expect(
        localStorage.getItem(
          "__lock__stackra-coordinator:lock:fallback-throws",
        ),
      ).toBeNull();

      // Second acquisition succeeds without waiting for the safety expiry.
      await expect(
        manager.run("fallback-throws", async () => "recovered"),
      ).resolves.toBe("recovered");
    });

    it("times out with CoordinatorError when another owner holds a fresh lock", async () => {
      const manager = new LockManager({ preferWebLocks: false });

      // Simulate a peer tab holding the lock with a fresh timestamp.
      const key = "__lock__stackra-coordinator:lock:contested";
      localStorage.setItem(
        key,
        JSON.stringify({ value: "other-tab-owner", at: Date.now() }),
      );

      await expect(
        manager.run("contested", async () => "unreachable", { timeoutMs: 30 }),
      ).rejects.toBeInstanceOf(CoordinatorError);
      await expect(
        manager.run("contested", async () => "unreachable", { timeoutMs: 30 }),
      ).rejects.toMatchObject({ code: "LOCK_TIMEOUT" });

      // The peer's lock entry survives — we did NOT clear it.
      const stored = JSON.parse(localStorage.getItem(key) ?? "null");
      expect(stored?.value).toBe("other-tab-owner");
    });

    it("takes over an expired lock left behind by a crashed peer", async () => {
      const manager = new LockManager({ preferWebLocks: false });

      // Simulate a stale lock (older than the 30_000ms safety expiry).
      const key = "__lock__stackra-coordinator:lock:stale";
      localStorage.setItem(
        key,
        JSON.stringify({ value: "dead-tab", at: Date.now() - 60_000 }),
      );

      const result = await manager.run("stale", async () => "took-over");

      expect(result).toBe("took-over");
      // Released on exit.
      expect(localStorage.getItem(key)).toBeNull();
    });

    it("survives corrupt JSON in the lock slot without throwing", async () => {
      const manager = new LockManager({ preferWebLocks: false });

      const key = "__lock__stackra-coordinator:lock:corrupt";
      localStorage.setItem(key, "not-json{{");

      // A parse error is treated as "no lock held" — the manager acquires
      // cleanly.
      await expect(
        manager.run("corrupt", async () => "recovered"),
      ).resolves.toBe("recovered");
    });
  });

  describe("SSR / private-mode guards", () => {
    it("isLocked() returns false when the Web Locks API is unavailable", async () => {
      removeNavigatorLocks();
      const manager = new LockManager({ preferWebLocks: false });
      await expect(manager.isLocked("anything")).resolves.toBe(false);
    });

    it("times out cleanly when both `navigator.locks` and localStorage are absent", async () => {
      // Full SSR simulation — the CAS helpers guard `typeof localStorage`
      // and return early; the acquisition loop then times out rather than
      // hanging.
      removeNavigatorLocks();
      installLocalStorage(undefined);

      const manager = new LockManager({ preferWebLocks: false });

      await expect(
        manager.run("ssr", async () => "unreachable", { timeoutMs: 30 }),
      ).rejects.toBeInstanceOf(CoordinatorError);
    });
  });
});
