/**
 * @file arr.spec.ts
 * @module @stackra/support/__tests__/unit
 * @description Happy-path coverage for the `Arr` utility class.
 */

import { describe, expect, it } from "vitest";
import { Arr } from "../../src/arr";

describe("Arr.wrap", () => {
  it("wraps a scalar in a single-element array", () => {
    expect(Arr.wrap("x")).toEqual(["x"]);
    expect(Arr.wrap(42)).toEqual([42]);
  });

  it("returns arrays unchanged (same reference)", () => {
    const input = [1, 2, 3];
    expect(Arr.wrap(input)).toBe(input);
  });

  it("returns an empty array for null and undefined", () => {
    expect(Arr.wrap(null)).toEqual([]);
    expect(Arr.wrap(undefined)).toEqual([]);
  });
});

describe("Arr.flatten", () => {
  it("flattens one level by default", () => {
    expect(
      Arr.flatten([
        [1, 2],
        [3, 4],
      ]),
    ).toEqual([1, 2, 3, 4]);
  });

  it("flattens to the given depth", () => {
    expect(Arr.flatten([[1, [2, [3, [4]]]]], 3)).toEqual([1, 2, 3, [4]]);
  });

  it("preserves the input when depth is 0", () => {
    expect(Arr.flatten([[1, 2]], 0)).toEqual([[1, 2]]);
  });
});

describe("Arr.chunk", () => {
  it("splits an array into chunks of the given size", () => {
    expect(Arr.chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("returns a single chunk when the size is larger than the array", () => {
    expect(Arr.chunk([1, 2], 5)).toEqual([[1, 2]]);
  });

  it("returns an empty array when the input is empty", () => {
    expect(Arr.chunk([] as number[], 3)).toEqual([]);
  });
});

describe("Arr.pluck", () => {
  const users = [
    { id: 1, name: "Alice", role: "admin" },
    { id: 2, name: "Bob", role: "user" },
  ];

  it("plucks a single string property", () => {
    expect(Arr.pluck(users, "name")).toEqual(["Alice", "Bob"]);
  });

  it("plucks a numeric property", () => {
    expect(Arr.pluck(users, "id")).toEqual([1, 2]);
  });
});

describe("Arr.groupBy", () => {
  it("groups an array by a string key", () => {
    const items = [
      { category: "food", name: "pizza" },
      { category: "food", name: "burger" },
      { category: "drink", name: "coffee" },
    ];
    const grouped = Arr.groupBy(items, "category");
    expect(grouped.food).toHaveLength(2);
    expect(grouped.drink).toHaveLength(1);
    expect(grouped.food?.[0]?.name).toBe("pizza");
  });

  it("groups an array by a callback-derived key", () => {
    const numbers = [1, 2, 3, 4, 5, 6];
    const grouped = Arr.groupBy(numbers, (n) => (n % 2 === 0 ? "even" : "odd"));
    expect(grouped.even).toEqual([2, 4, 6]);
    expect(grouped.odd).toEqual([1, 3, 5]);
  });
});
