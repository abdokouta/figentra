/**
 * @file html-string.spec.ts
 * @module @stackra/support/__tests__/unit
 * @description HtmlString — marker class for trusted, pre-sanitized
 *   HTML content. This class only WRAPS; it does not sanitize.
 */

import { describe, expect, it } from "vitest";

import { HtmlString } from "../../src/html-string";

describe("HtmlString", () => {
  it("wraps a raw HTML string", () => {
    const html = new HtmlString("<strong>Hello</strong>");
    expect(html.toHtml()).toBe("<strong>Hello</strong>");
  });

  it("toString() returns the raw HTML unchanged", () => {
    const html = new HtmlString("<em>text</em>");
    expect(html.toString()).toBe("<em>text</em>");
  });

  it("plays nicely with template literals via toString coercion", () => {
    const html = new HtmlString("<br/>");
    expect(`output: ${html}`).toBe("output: <br/>");
  });

  it("isEmpty() returns true for zero-length content", () => {
    expect(new HtmlString("").isEmpty()).toBe(true);
    expect(new HtmlString("<p></p>").isEmpty()).toBe(false);
  });

  it("isNotEmpty() is the opposite of isEmpty()", () => {
    expect(new HtmlString("").isNotEmpty()).toBe(false);
    expect(new HtmlString("<p>hi</p>").isNotEmpty()).toBe(true);
  });

  it("length getter returns the character count", () => {
    expect(new HtmlString("").length).toBe(0);
    expect(new HtmlString("<br/>").length).toBe(5);
    expect(new HtmlString("<strong>Hello</strong>").length).toBe(22);
  });

  it("does NOT sanitize the content it wraps — pass-through only", () => {
    // Same string in and out — the class marks content as safe but
    // does no processing.
    const scripty = "<script>alert('x')</script>";
    expect(new HtmlString(scripty).toHtml()).toBe(scripty);
  });

  it("is comparable via toString for use in equality checks against strings", () => {
    const html = new HtmlString("<span>hi</span>");
    expect(String(html)).toBe("<span>hi</span>");
    expect(html.toString()).toBe(String(html));
  });
});
