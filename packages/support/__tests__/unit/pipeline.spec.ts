/**
 * @file pipeline.spec.ts
 * @module @stackra/support/__tests__/unit
 */

import { describe, expect, it } from "vitest";

import { Pipeline } from "../../src/pipeline";

describe("Pipeline", () => {
  it("passes a value through each pipe in order", () => {
    const result = new Pipeline<string>()
      .send("hello")
      .through([
        (value, next) => next(value.toUpperCase()),
        (value, next) => next(value + "!"),
      ])
      .then((v) => v);
    expect(result).toBe("HELLO!");
  });

  it("returns the destination's return value", () => {
    const result = new Pipeline<number>()
      .send(2)
      .through([(v, next) => next(v * 2)])
      .then((v) => v + 100);
    expect(result).toBe(104);
  });

  it("supports short-circuit — a pipe can return without calling next", () => {
    const result = new Pipeline<string>()
      .send("in")
      .through([
        // Short-circuit here.
        (_value) => "SHORT",
        // Would run if not short-circuited.
        (value, next) => next(value + "-tail"),
      ])
      .then((v) => v);
    expect(result).toBe("SHORT");
  });

  it("empty pipes → destination sees the original value", () => {
    const result = new Pipeline<number>()
      .send(42)
      .through([])
      .then((v) => v);
    expect(result).toBe(42);
  });

  it("chains send/through/then fluently", () => {
    const pipeline = new Pipeline<string>();
    const chained = pipeline
      .send("x")
      .through([])
      .then((v) => v);
    expect(chained).toBe("x");
  });
});
