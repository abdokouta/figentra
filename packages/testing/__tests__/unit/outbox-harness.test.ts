/**
 * @file outbox-harness.test.ts
 * @module @stackra/testing/__tests__/unit
 * @description Unit tests for `createOutboxHarness` — the in-memory
 *   transactional-outbox test harness. Covers the buffer/publish
 *   contract, `.pending`/`.all`, drain semantics on success + failure,
 *   `.assertPublished` (both bare + predicate), and `.reset`.
 *
 *   Imports the harness DIRECTLY from `src/nest/outbox-harness` — the
 *   `src/nest` barrel would transitively pull in NestJS optional peers
 *   that aren't installed for this suite.
 */

import { describe, expect, it } from "vitest";

import { createOutboxHarness } from "@/nest/outbox-harness";

const ULID_PATTERN = /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/;

describe("createOutboxHarness", () => {
  // ── .publish ─────────────────────────────────────────────────

  describe(".publish", () => {
    it("returns a row with an id + type + payload + createdAt + pending status", () => {
      const outbox = createOutboxHarness();
      const row = outbox.publish("user.created", { id: "u1" });

      expect(row.id).toMatch(ULID_PATTERN);
      expect(row.type).toBe("user.created");
      expect(row.payload).toEqual({ id: "u1" });
      expect(row.createdAt).toBeInstanceOf(Date);
      expect(row.status).toBe("pending");
      expect(row.error).toBeUndefined();
    });

    it("assigns unique ULIDs across sequential publications", () => {
      const outbox = createOutboxHarness();
      const a = outbox.publish("x", 1);
      const b = outbox.publish("x", 2);
      expect(a.id).not.toBe(b.id);
      expect(a.id).toMatch(ULID_PATTERN);
      expect(b.id).toMatch(ULID_PATTERN);
    });
  });

  // ── .pending / .all ──────────────────────────────────────────

  describe(".pending / .all", () => {
    it("pending returns only pending rows", async () => {
      const outbox = createOutboxHarness();
      outbox.publish("a", {});
      outbox.publish("b", {});
      outbox.publish("c", {});

      // Drain the first row via a matching handler.
      await outbox.drain((row) => {
        if (row.type !== "a") throw new Error("skip");
      });

      const pending = outbox.pending();
      const pendingTypes = pending.map((r) => r.type);
      expect(pendingTypes).not.toContain("a");
      // b + c both threw → status flipped to failed → NOT in pending.
      expect(pending).toHaveLength(0);
    });

    it("all returns every row regardless of status", async () => {
      const outbox = createOutboxHarness();
      outbox.publish("a", {});
      outbox.publish("b", {});

      await outbox.drain(() => {
        /* no-op → both flip to published */
      });

      expect(outbox.all()).toHaveLength(2);
      expect(outbox.all().every((r) => r.status === "published")).toBe(true);
    });

    it("pending returns a frozen array", () => {
      const outbox = createOutboxHarness();
      outbox.publish("a", {});
      const pending = outbox.pending();
      expect(Object.isFrozen(pending)).toBe(true);
    });

    it("all returns a frozen array copy", () => {
      const outbox = createOutboxHarness();
      outbox.publish("a", {});
      const all = outbox.all();
      expect(Object.isFrozen(all)).toBe(true);
    });
  });

  // ── .drain ───────────────────────────────────────────────────

  describe(".drain", () => {
    it("flips every successfully-handled row to published", async () => {
      const outbox = createOutboxHarness();
      outbox.publish("x", 1);
      outbox.publish("x", 2);

      await outbox.drain(() => {
        /* noop */
      });

      for (const row of outbox.all()) {
        expect(row.status).toBe("published");
      }
    });

    it("flips a throwing handler's row to failed and captures the error", async () => {
      const outbox = createOutboxHarness();
      outbox.publish("bad", {});

      await outbox.drain(() => {
        throw new Error("nope");
      });

      const [row] = outbox.all();
      expect(row).toBeDefined();
      expect(row!.status).toBe("failed");
      expect(row!.error).toBeInstanceOf(Error);
      expect(row!.error!.message).toBe("nope");
    });

    it("wraps non-Error throws into Error instances", async () => {
      const outbox = createOutboxHarness();
      outbox.publish("bad", {});

      await outbox.drain(() => {
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw "string thrown";
      });

      const [row] = outbox.all();
      expect(row!.error).toBeInstanceOf(Error);
      expect(row!.error!.message).toBe("string thrown");
    });

    it("supports async handlers", async () => {
      const outbox = createOutboxHarness();
      outbox.publish("async", { n: 1 });

      await outbox.drain(async (row) => {
        await Promise.resolve();
        expect(row.type).toBe("async");
      });

      expect(outbox.all()[0]!.status).toBe("published");
    });

    it("processes independently — one failure doesn't stop later successes", async () => {
      const outbox = createOutboxHarness();
      outbox.publish("a", 1);
      outbox.publish("b", 2);
      outbox.publish("c", 3);

      await outbox.drain((row) => {
        if (row.type === "b") throw new Error("skip b");
      });

      const rows = outbox.all();
      expect(rows.find((r) => r.type === "a")!.status).toBe("published");
      expect(rows.find((r) => r.type === "b")!.status).toBe("failed");
      expect(rows.find((r) => r.type === "c")!.status).toBe("published");
    });

    it("does NOT re-process rows that are already published/failed", async () => {
      const outbox = createOutboxHarness();
      outbox.publish("a", 1);
      await outbox.drain(() => {
        /* success */
      });

      let calls = 0;
      await outbox.drain(() => {
        calls++;
      });
      expect(calls).toBe(0);
    });
  });

  // ── .assertPublished ─────────────────────────────────────────

  describe(".assertPublished", () => {
    it("is silent when a row with matching type exists", () => {
      const outbox = createOutboxHarness();
      outbox.publish("user.created", {});
      expect(() => outbox.assertPublished("user.created")).not.toThrow();
    });

    it("throws with descriptive text when no row matches the type", () => {
      const outbox = createOutboxHarness();
      outbox.publish("user.created", {});
      expect(() => outbox.assertPublished("user.deleted")).toThrow(
        /Expected a row with type='user\.deleted'/,
      );
    });

    it("lists seen types in the failure message", () => {
      const outbox = createOutboxHarness();
      outbox.publish("a", {});
      outbox.publish("b", {});
      expect(() => outbox.assertPublished("c")).toThrow(/Seen types: a, b/);
    });

    it("says '(none)' when no rows have been published", () => {
      const outbox = createOutboxHarness();
      expect(() => outbox.assertPublished("anything")).toThrow(/Seen types: \(none\)/);
    });

    it("supports a matcher predicate", () => {
      const outbox = createOutboxHarness();
      outbox.publish("user.created", { id: "u1" });
      outbox.publish("user.created", { id: "u2" });

      expect(() =>
        outbox.assertPublished("user.created", (r) => (r.payload as { id: string }).id === "u2"),
      ).not.toThrow();

      expect(() =>
        outbox.assertPublished("user.created", (r) => (r.payload as { id: string }).id === "u3"),
      ).toThrow(/matching predicate/);
    });
  });

  // ── .reset ───────────────────────────────────────────────────

  describe(".reset", () => {
    it("clears every row (regardless of status)", async () => {
      const outbox = createOutboxHarness();
      outbox.publish("a", {});
      outbox.publish("b", {});
      await outbox.drain(() => {
        /* published */
      });

      outbox.reset();

      expect(outbox.all()).toEqual([]);
      expect(outbox.pending()).toEqual([]);
    });

    it("allows publish + assert to work again post-reset", () => {
      const outbox = createOutboxHarness();
      outbox.publish("a", {});
      outbox.reset();
      outbox.publish("b", {});

      expect(() => outbox.assertPublished("a")).toThrow();
      expect(() => outbox.assertPublished("b")).not.toThrow();
    });
  });
});
