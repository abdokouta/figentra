/**
 * @file str.spec.ts
 * @module @stackra/support/__tests__/unit
 * @description Happy-path coverage for the most-used `Str` methods.
 *   Full-branch coverage (every method's edge cases) is a later
 *   wave — this floor locks correctness on the most-consumed
 *   conversions.
 */

import { describe, expect, it } from "vitest";
import { Str } from "../../src/str";

describe("Str — case conversion", () => {
  it("studly() converts kebab/snake/space-separated strings to PascalCase", () => {
    expect(Str.studly("hello-world")).toBe("HelloWorld");
    expect(Str.studly("foo_bar_baz")).toBe("FooBarBaz");
    expect(Str.studly("already Good")).toBe("AlreadyGood");
  });

  it("studly() caches results (identical input yields the same output)", () => {
    // Cache is internal — the observable contract is idempotence.
    const first = Str.studly("cache-me");
    const second = Str.studly("cache-me");
    expect(first).toBe(second);
    expect(first).toBe("CacheMe");
  });

  it("camel() converts kebab/snake/space-separated strings to camelCase", () => {
    expect(Str.camel("hello-world")).toBe("helloWorld");
    expect(Str.camel("foo_bar_baz")).toBe("fooBarBaz");
    expect(Str.camel("already Good")).toBe("alreadyGood");
  });

  it("snake() converts camelCase / PascalCase to snake_case", () => {
    expect(Str.snake("helloWorld")).toBe("hello_world");
    expect(Str.snake("HelloWorld")).toBe("hello_world");
  });

  it("kebab() converts camelCase / snake_case to kebab-case", () => {
    expect(Str.kebab("helloWorld")).toBe("hello-world");
    expect(Str.kebab("hello_world")).toBe("hello-world");
  });
});

describe("Str — searching", () => {
  it("contains() returns whether the needle appears in the haystack", () => {
    expect(Str.contains("foobar", "ob")).toBe(true);
    expect(Str.contains("foobar", "xyz")).toBe(false);
  });

  it("startsWith() checks the prefix", () => {
    expect(Str.startsWith("hello world", "hello")).toBe(true);
    expect(Str.startsWith("hello world", "world")).toBe(false);
  });

  it("endsWith() checks the suffix", () => {
    expect(Str.endsWith("hello world", "world")).toBe(true);
    expect(Str.endsWith("hello world", "hello")).toBe(false);
  });
});

describe("Str — slug", () => {
  it("slug() produces a URL-safe lowercase kebab", () => {
    expect(Str.slug("Hello World!")).toBe("hello-world");
    expect(Str.slug("A B  C   D")).toBe("a-b-c-d");
  });

  it("slug() strips punctuation", () => {
    expect(Str.slug("foo, bar & baz")).toBe("foo-bar-baz");
  });
});

describe("Str — plural / singular", () => {
  it("plural() handles regular and irregular words", () => {
    expect(Str.plural("dog")).toBe("dogs");
    expect(Str.plural("box")).toBe("boxes");
    expect(Str.plural("child")).toBe("children");
    expect(Str.plural("person")).toBe("people");
  });

  it("singular() reverses plural for regular + irregular forms", () => {
    expect(Str.singular("dogs")).toBe("dog");
    expect(Str.singular("boxes")).toBe("box");
    expect(Str.singular("children")).toBe("child");
    expect(Str.singular("people")).toBe("person");
  });
});
