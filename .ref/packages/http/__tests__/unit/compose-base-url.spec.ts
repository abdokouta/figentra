/**
 * @file compose-base-url.spec.ts
 * @module @stackra/http/__tests__/unit
 * @description Behavioural spec for `composeBaseURL(baseURL, apiPrefix, version)`.
 */

import { describe, expect, it } from "vitest";
import { composeBaseURL } from "../../src/core/utils/compose-base-url.util";

describe("composeBaseURL", () => {
  it("returns the base URL as-is when neither prefix nor version is set", () => {
    expect(composeBaseURL("https://api.example.com")).toBe(
      "https://api.example.com",
    );
  });

  it("appends prefix + version", () => {
    expect(composeBaseURL("https://api.example.com", "api", "v1")).toBe(
      "https://api.example.com/api/v1",
    );
  });

  it("normalises leading + trailing slashes in every segment", () => {
    expect(composeBaseURL("https://api.example.com/", "/api/", "/v2/")).toBe(
      "https://api.example.com/api/v2",
    );
  });

  it("appends only the version when prefix is empty", () => {
    expect(composeBaseURL("https://api.example.com", "", "v1")).toBe(
      "https://api.example.com/v1",
    );
  });

  it("appends only the prefix when version is empty", () => {
    expect(composeBaseURL("https://api.example.com", "api")).toBe(
      "https://api.example.com/api",
    );
  });

  it("returns undefined when baseURL is missing or whitespace", () => {
    expect(composeBaseURL()).toBeUndefined();
    expect(composeBaseURL("")).toBeUndefined();
    expect(composeBaseURL("   ")).toBeUndefined();
  });

  it("strips trailing slashes on the base URL before composing", () => {
    // Multiple trailing slashes normalise to one.
    expect(composeBaseURL("https://api.example.com///")).toBe(
      "https://api.example.com",
    );
  });
});
