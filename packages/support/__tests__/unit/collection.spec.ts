/**
 * @file collection.spec.ts
 * @module @stackra/support/__tests__/unit
 */

import { describe, expect, it } from "vitest";

import { collect } from "../../src/collection";

describe("collect()", () => {
  it("wraps an array into a Collection-like object with chainable ops", () => {
    const c = collect([1, 2, 3, 4]);
    expect(typeof c.filter).toBe("function");
    expect(typeof c.map).toBe("function");
    expect(typeof c.sum).toBe("function");
  });

  it(".sum() sums all items", () => {
    expect(collect([1, 2, 3, 4]).sum()).toBe(10);
  });

  it(".filter() narrows the collection", () => {
    const evens = collect([1, 2, 3, 4])
      .filter((n) => n % 2 === 0)
      .all();
    expect(evens).toEqual([2, 4]);
  });

  it(".map() transforms each item", () => {
    const doubled = collect([1, 2, 3])
      .map((n) => n * 2)
      .all();
    expect(doubled).toEqual([2, 4, 6]);
  });

  it(".pluck() extracts one property from every item", () => {
    const names = collect([
      { name: "a", age: 1 },
      { name: "b", age: 2 },
    ])
      .pluck("name")
      .all();
    expect(names).toEqual(["a", "b"]);
  });
});
