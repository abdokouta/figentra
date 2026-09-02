/**
 * @file uri.spec.ts
 * @module @stackra/support/__tests__/unit
 * @description Behavioural spec for the fluent `Uri` builder.
 */

import { describe, expect, it } from "vitest";
import { Uri } from "../../src/uri";

describe("Uri — construction + basic output", () => {
  it("returns the base URL unchanged when no path/query/fragment is added", () => {
    expect(Uri.of("https://example.com").toString()).toBe(
      "https://example.com",
    );
  });

  it("strips a trailing slash from the base URL", () => {
    expect(Uri.of("https://example.com/").toString()).toBe(
      "https://example.com",
    );
  });

  it("strips multiple trailing slashes from the base URL", () => {
    expect(Uri.of("https://example.com///").toString()).toBe(
      "https://example.com",
    );
  });
});

describe("Uri.path", () => {
  it("appends a single path segment", () => {
    expect(Uri.of("https://api.example.com").path("users").toString()).toBe(
      "https://api.example.com/users",
    );
  });

  it("chains multiple path segments with slashes", () => {
    expect(
      Uri.of("https://api.example.com")
        .path("v1")
        .path("users")
        .path("42")
        .toString(),
    ).toBe("https://api.example.com/v1/users/42");
  });

  it("normalises leading and trailing slashes on each segment", () => {
    expect(
      Uri.of("https://api.example.com").path("/v1/").path("/users/").toString(),
    ).toBe("https://api.example.com/v1/users");
  });

  it("skips empty segments", () => {
    expect(
      Uri.of("https://api.example.com").path("").path("v1").path("").toString(),
    ).toBe("https://api.example.com/v1");
  });
});

describe("Uri.query", () => {
  it("appends URL-encoded query parameters", () => {
    const built = Uri.of("https://api.example.com/search")
      .query({ q: "hello world", page: "1" })
      .toString();
    // Both keys + values are percent-encoded.
    expect(built).toBe("https://api.example.com/search?q=hello%20world&page=1");
  });

  it("merges multiple .query() calls — later keys overwrite earlier ones", () => {
    const built = Uri.of("https://api.example.com")
      .query({ page: "1", limit: "10" })
      .query({ page: "2" })
      .toString();
    expect(built).toBe("https://api.example.com?page=2&limit=10");
  });

  it("encodes special characters in both keys and values", () => {
    const built = Uri.of("https://api.example.com")
      .query({ "key with space": "value/with?symbols" })
      .toString();
    expect(built).toContain("key%20with%20space=");
    expect(built).toContain("=value%2Fwith%3Fsymbols");
  });
});

describe("Uri.fragment", () => {
  it("appends a fragment identifier", () => {
    expect(
      Uri.of("https://docs.example.com/guide")
        .fragment("installation")
        .toString(),
    ).toBe("https://docs.example.com/guide#installation");
  });

  it("URL-encodes special characters in the fragment", () => {
    expect(
      Uri.of("https://docs.example.com").fragment("h & r").toString(),
    ).toBe("https://docs.example.com#h%20%26%20r");
  });
});

describe("Uri — full composition", () => {
  it("composes base + path + query + fragment in the correct order", () => {
    const built = Uri.of("https://api.example.com")
      .path("v2")
      .path("users")
      .query({ active: "true" })
      .fragment("top")
      .toString();
    expect(built).toBe("https://api.example.com/v2/users?active=true#top");
  });
});
