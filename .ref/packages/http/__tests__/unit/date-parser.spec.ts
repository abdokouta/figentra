/**
 * @file date-parser.spec.ts
 * @module @stackra/http/__tests__/unit
 * @description Behavioural spec for `DateParser.parseDates` and
 *   `DateParser.serializeDates`.
 */

import { describe, expect, it } from "vitest";
import { DateParser } from "../../src/core/utils/date-parser.util";

describe("DateParser.parseDates", () => {
  it("converts ISO 8601 strings to Date objects", () => {
    const result = DateParser.parseDates({
      createdAt: "2026-01-15T10:30:00.000Z",
    });
    expect((result as { createdAt: Date }).createdAt).toBeInstanceOf(Date);
    expect((result as { createdAt: Date }).createdAt.toISOString()).toBe(
      "2026-01-15T10:30:00.000Z",
    );
  });

  it("handles ISO 8601 without milliseconds", () => {
    const result = DateParser.parseDates({ ts: "2026-01-15T10:30:00Z" });
    expect((result as { ts: Date }).ts).toBeInstanceOf(Date);
  });

  it("recurses into nested objects and arrays", () => {
    const result = DateParser.parseDates({
      user: {
        createdAt: "2026-01-15T10:30:00.000Z",
        events: [{ ts: "2026-02-01T00:00:00Z" }],
      },
    }) as { user: { createdAt: Date; events: Array<{ ts: Date }> } };
    expect(result.user.createdAt).toBeInstanceOf(Date);
    expect(result.user.events[0]?.ts).toBeInstanceOf(Date);
  });

  it("leaves non-ISO strings untouched", () => {
    expect(DateParser.parseDates({ note: "hello" })).toEqual({ note: "hello" });
  });

  it("leaves existing Date objects untouched", () => {
    const date = new Date("2026-01-15T10:30:00.000Z");
    const result = DateParser.parseDates({ ts: date });
    expect((result as { ts: Date }).ts).toBe(date);
  });

  it("handles null / undefined / primitives", () => {
    expect(DateParser.parseDates(null)).toBe(null);
    expect(DateParser.parseDates(undefined)).toBeUndefined();
    expect(DateParser.parseDates(42)).toBe(42);
    expect(DateParser.parseDates(true)).toBe(true);
  });
});

describe("DateParser.serializeDates", () => {
  it("converts Date objects to ISO 8601 strings", () => {
    const date = new Date("2026-01-15T10:30:00.000Z");
    const result = DateParser.serializeDates({ createdAt: date });
    expect((result as { createdAt: string }).createdAt).toBe(
      "2026-01-15T10:30:00.000Z",
    );
  });

  it("recurses into nested objects and arrays", () => {
    const result = DateParser.serializeDates({
      user: {
        createdAt: new Date("2026-01-15T10:30:00.000Z"),
        events: [{ ts: new Date("2026-02-01T00:00:00.000Z") }],
      },
    }) as { user: { createdAt: string; events: Array<{ ts: string }> } };
    expect(result.user.createdAt).toBe("2026-01-15T10:30:00.000Z");
    expect(result.user.events[0]?.ts).toBe("2026-02-01T00:00:00.000Z");
  });

  it("leaves non-Date values untouched", () => {
    expect(DateParser.serializeDates({ x: "not a date" })).toEqual({
      x: "not a date",
    });
    expect(DateParser.serializeDates(42)).toBe(42);
    expect(DateParser.serializeDates(null)).toBe(null);
  });

  it("round-trips with parseDates", () => {
    const iso = "2026-01-15T10:30:00.000Z";
    const parsed = DateParser.parseDates({ ts: iso }) as { ts: Date };
    const serialized = DateParser.serializeDates(parsed) as { ts: string };
    expect(serialized.ts).toBe(iso);
  });
});
