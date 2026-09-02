/**
 * @file num.spec.ts
 * @module @stackra/support/__tests__/unit
 * @description Happy-path coverage for the `Num` utility class.
 */

import { describe, expect, it } from "vitest";
import { Num } from "../../src/num";

describe("Num.abbreviate", () => {
  it("returns the original value under 1000", () => {
    expect(Num.abbreviate(0)).toBe("0");
    expect(Num.abbreviate(1)).toBe("1");
    expect(Num.abbreviate(999)).toBe("999");
  });

  it("appends K for thousands", () => {
    expect(Num.abbreviate(1000)).toBe("1K");
    expect(Num.abbreviate(1500)).toBe("1.5K");
    expect(Num.abbreviate(999_999)).toBe("1000K");
  });

  it("appends M for millions", () => {
    expect(Num.abbreviate(1_000_000)).toBe("1M");
    expect(Num.abbreviate(1_500_000)).toBe("1.5M");
  });

  it("appends B for billions", () => {
    expect(Num.abbreviate(1_500_000_000)).toBe("1.5B");
  });

  it("appends T for trillions", () => {
    expect(Num.abbreviate(1_500_000_000_000)).toBe("1.5T");
  });

  it("preserves the sign for negative numbers", () => {
    expect(Num.abbreviate(-1500)).toBe("-1.5K");
  });
});

describe("Num.currency", () => {
  it("formats with the default USD locale", () => {
    // Different Node versions may vary the spacing around $ — assert
    // shape rather than a byte-exact literal.
    const formatted = Num.currency(29.99, "USD");
    expect(formatted).toContain("29.99");
    expect(formatted).toContain("$");
  });

  it("respects the given currency code", () => {
    const formatted = Num.currency(29.99, "EUR");
    // Contains the € symbol or "EUR" fallback depending on Node ICU.
    expect(formatted).toMatch(/€|EUR/);
  });
});

describe("Num.fileSize", () => {
  it("formats bytes with unit-appropriate suffix", () => {
    // The exact suffix strings ("KB" vs "KiB") are implementation-
    // dependent — assert on the number + a unit.
    const kilobyte = Num.fileSize(1024);
    expect(kilobyte).toMatch(/1\s?K/);

    const megabyte = Num.fileSize(1_048_576);
    expect(megabyte).toMatch(/1\s?M/);
  });

  it("formats sub-KB values in bytes", () => {
    expect(Num.fileSize(500)).toMatch(/500/);
  });
});

describe("Num.ordinal", () => {
  it("produces English ordinal suffixes", () => {
    expect(Num.ordinal(1)).toBe("1st");
    expect(Num.ordinal(2)).toBe("2nd");
    expect(Num.ordinal(3)).toBe("3rd");
    expect(Num.ordinal(4)).toBe("4th");
    expect(Num.ordinal(11)).toBe("11th");
    expect(Num.ordinal(21)).toBe("21st");
    expect(Num.ordinal(22)).toBe("22nd");
    expect(Num.ordinal(23)).toBe("23rd");
  });
});
