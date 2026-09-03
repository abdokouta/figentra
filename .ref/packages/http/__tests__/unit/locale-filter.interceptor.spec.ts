/**
 * @file locale-filter.interceptor.spec.ts
 * @module @stackra/http/__tests__/unit
 * @description Behavioural spec for `LocaleFilterResponseInterceptor`
 *   and its extracted `sliceLocaleTree` helper.
 *
 *   Covers every branch:
 *   - Locale-map slicing (basic)
 *   - Non-locale-map passthrough (structural object)
 *   - Empty-object edge case
 *   - Array recursion
 *   - Missing locale service → passthrough
 *   - `skipLocaleFilter: true` opt-out
 *   - `skipLocale: true` opt-out (legacy)
 *   - Empty supported set → passthrough
 *   - Missing / falsy active locale → passthrough
 *   - Fallback chain: active → en → first non-null → null
 *   - Deep nested tree with mixed locale-map + structural nodes
 *   - Realistic response shape (nav-style)
 */

import { describe, expect, it, vi } from "vitest";
import { HttpMethod } from "@stackra/contracts";
import type {
  IHttpContext,
  IHttpNextFunction,
  IHttpResponse,
  II18nLocaleService,
} from "@stackra/contracts";

import {
  LocaleFilterResponseInterceptor,
  sliceLocaleTree,
} from "../../src/core/interceptors/locale-filter.interceptor";

function makeContext(
  overrides: Partial<IHttpContext["request"]> = {},
): IHttpContext {
  return {
    request: {
      method: HttpMethod.GET,
      url: "/api/v1/pages/home.json",
      baseURL: "https://landing.example.com",
      meta: {},
      ...overrides,
    },
    metadata: new Map(),
  };
}

function makeResponse(data: unknown): IHttpResponse {
  return { data, status: 200, statusText: "OK", headers: {} };
}

function makeLocaleService(
  overrides: Partial<II18nLocaleService> = {},
): II18nLocaleService {
  return {
    getLocale: vi.fn(() => "en"),
    getSupportedLocales: vi.fn(() => ["en", "ar", "ru"]),
    ...overrides,
  } as II18nLocaleService;
}

// ────────────────────────────────────────────────────────────────
// sliceLocaleTree — the pure helper
// ────────────────────────────────────────────────────────────────

describe("sliceLocaleTree — primitives", () => {
  const supported = new Set(["en", "ar", "ru"]);

  it("passes through null", () => {
    expect(sliceLocaleTree(null, "en", supported)).toBe(null);
  });

  it("passes through undefined", () => {
    expect(sliceLocaleTree(undefined, "en", supported)).toBe(undefined);
  });

  it("passes through strings", () => {
    expect(sliceLocaleTree("hello", "en", supported)).toBe("hello");
  });

  it("passes through numbers", () => {
    expect(sliceLocaleTree(42, "en", supported)).toBe(42);
  });

  it("passes through booleans", () => {
    expect(sliceLocaleTree(true, "en", supported)).toBe(true);
    expect(sliceLocaleTree(false, "en", supported)).toBe(false);
  });
});

describe("sliceLocaleTree — locale-map objects", () => {
  const supported = new Set(["en", "ar", "ru"]);

  it("slices a full locale map to the active locale", () => {
    const input = { en: "Hello", ar: "مرحبا", ru: "Привет" };
    expect(sliceLocaleTree(input, "en", supported)).toBe("Hello");
    expect(sliceLocaleTree(input, "ar", supported)).toBe("مرحبا");
    expect(sliceLocaleTree(input, "ru", supported)).toBe("Привет");
  });

  it("slices a partial locale map (missing keys treated as null)", () => {
    // Keys are all supported ({ en, ar } ⊆ { en, ar, ru }) → still a
    // locale map. Missing `ru` triggers the fallback chain when the
    // active locale is `ru`.
    const input = { en: "Hello", ar: "مرحبا" };
    expect(sliceLocaleTree(input, "en", supported)).toBe("Hello");
    expect(sliceLocaleTree(input, "ar", supported)).toBe("مرحبا");
    // Active locale ru missing → falls back to en.
    expect(sliceLocaleTree(input, "ru", supported)).toBe("Hello");
  });

  it("falls back to en when the active locale value is null", () => {
    const input = { en: "Hello", ar: null, ru: null };
    expect(sliceLocaleTree(input, "ar", supported)).toBe("Hello");
    expect(sliceLocaleTree(input, "ru", supported)).toBe("Hello");
  });

  it("falls back to the first non-null value when en is also null", () => {
    const input = { en: null, ar: "مرحبا", ru: null };
    expect(sliceLocaleTree(input, "ru", supported)).toBe("مرحبا");
  });

  it("returns null when every locale is null", () => {
    const input = { en: null, ar: null, ru: null };
    expect(sliceLocaleTree(input, "en", supported)).toBe(null);
  });
});

describe("sliceLocaleTree — structural objects", () => {
  const supported = new Set(["en", "ar", "ru"]);

  it("passes through empty objects untouched", () => {
    // Empty object short-circuits the isLocaleMap check.
    const input = {};
    expect(sliceLocaleTree(input, "en", supported)).toEqual({});
  });

  it("does not treat objects with non-locale keys as locale maps", () => {
    // `image` + `type` are NOT locale codes → structural object,
    // recurse into children.
    const input = { image: "hero.jpg", type: "banner" };
    expect(sliceLocaleTree(input, "en", supported)).toEqual({
      image: "hero.jpg",
      type: "banner",
    });
  });

  it("recurses into structural children", () => {
    const input = {
      hero: { title: { en: "Hello", ar: "مرحبا", ru: "Привет" } },
      footer: { copyright: { en: "© 2026", ar: "© 2026", ru: "© 2026" } },
    };
    expect(sliceLocaleTree(input, "ar", supported)).toEqual({
      hero: { title: "مرحبا" },
      footer: { copyright: "© 2026" },
    });
  });

  it("mixes structural + locale-map children correctly", () => {
    const input = {
      slug: "home",
      published_at: "2026-08-01",
      seo: {
        title: { en: "Figentra", ar: "فيغنترا", ru: "Фигентра" },
        canonical: "https://figentra.com/",
      },
      content: {
        hero: {
          title: { en: "Welcome", ar: "أهلاً", ru: "Добро пожаловать" },
        },
      },
    };
    expect(sliceLocaleTree(input, "ar", supported)).toEqual({
      slug: "home",
      published_at: "2026-08-01",
      seo: { title: "فيغنترا", canonical: "https://figentra.com/" },
      content: { hero: { title: "أهلاً" } },
    });
  });

  it("does not mutate the original input", () => {
    const input = {
      hero: { title: { en: "Hello", ar: "مرحبا", ru: "Привет" } },
    };
    const before = JSON.parse(JSON.stringify(input));
    sliceLocaleTree(input, "ar", supported);
    expect(input).toEqual(before);
  });
});

describe("sliceLocaleTree — arrays", () => {
  const supported = new Set(["en", "ar", "ru"]);

  it("recurses element-wise across an array of locale maps", () => {
    const input = [
      { en: "One", ar: "واحد", ru: "Один" },
      { en: "Two", ar: "اثنان", ru: "Два" },
    ];
    expect(sliceLocaleTree(input, "ar", supported)).toEqual(["واحد", "اثنان"]);
  });

  it("recurses element-wise across an array of structural objects", () => {
    const input = [
      { label: { en: "Home", ar: "الرئيسية", ru: "Главная" }, href: "/" },
      { label: { en: "About", ar: "عن", ru: "О" }, href: "/about" },
    ];
    expect(sliceLocaleTree(input, "en", supported)).toEqual([
      { label: "Home", href: "/" },
      { label: "About", href: "/about" },
    ]);
  });

  it("passes through empty arrays", () => {
    expect(sliceLocaleTree([], "en", supported)).toEqual([]);
  });
});

describe("sliceLocaleTree — supported-set corner cases", () => {
  it("with an empty supported set every object is structural", () => {
    // Vacuous truth would misclassify — the interceptor guards
    // against this, but the pure function is defensive too: an
    // empty supported set means no key matches → objects are
    // structural.
    const empty = new Set<string>();
    const input = { en: "Hello", ar: "مرحبا" };
    // `keys.every(k => empty.has(k))` is `false` (non-empty keys) →
    // structural → recurse (no-op since values are strings) →
    // preserved.
    expect(sliceLocaleTree(input, "en", empty)).toEqual({
      en: "Hello",
      ar: "مرحبا",
    });
  });

  it("supports a single-locale set (degenerate but valid)", () => {
    const single = new Set(["en"]);
    // `{ en }` — all keys ⊆ single → locale map → slice to en.
    expect(sliceLocaleTree({ en: "Hello" }, "en", single)).toBe("Hello");
    // `{ en, foo }` — `foo` ∉ single → structural.
    expect(sliceLocaleTree({ en: "Hello", foo: "bar" }, "en", single)).toEqual({
      en: "Hello",
      foo: "bar",
    });
  });
});

// ────────────────────────────────────────────────────────────────
// LocaleFilterResponseInterceptor — the wire behavior
// ────────────────────────────────────────────────────────────────

describe("LocaleFilterResponseInterceptor — pass-through paths", () => {
  it("returns the response unchanged when no locale service is bound", async () => {
    const interceptor = new LocaleFilterResponseInterceptor();
    const response = makeResponse({ title: { en: "Hi", ar: "مرحبا" } });
    const next: IHttpNextFunction = vi.fn().mockResolvedValue(response);

    const result = await interceptor.intercept(makeContext(), next);
    expect(result).toBe(response);
    // Data still holds the raw locale map.
    expect(result.data).toEqual({ title: { en: "Hi", ar: "مرحبا" } });
  });

  it("passes through when meta.skipLocaleFilter is true", async () => {
    const interceptor = new LocaleFilterResponseInterceptor(
      makeLocaleService(),
    );
    const response = makeResponse({
      title: { en: "Hi", ar: "مرحبا", ru: "Привет" },
    });
    const next: IHttpNextFunction = vi.fn().mockResolvedValue(response);

    const result = await interceptor.intercept(
      makeContext({ meta: { skipLocaleFilter: true } }),
      next,
    );
    expect(result.data).toEqual({
      title: { en: "Hi", ar: "مرحبا", ru: "Привет" },
    });
  });

  it("passes through when meta.skipLocale is true (legacy)", async () => {
    const interceptor = new LocaleFilterResponseInterceptor(
      makeLocaleService(),
    );
    const response = makeResponse({
      title: { en: "Hi", ar: "مرحبا", ru: "Привет" },
    });
    const next: IHttpNextFunction = vi.fn().mockResolvedValue(response);

    const result = await interceptor.intercept(
      makeContext({ meta: { skipLocale: true } }),
      next,
    );
    expect(result.data).toEqual({
      title: { en: "Hi", ar: "مرحبا", ru: "Привет" },
    });
  });

  it("passes through when the locale service returns an empty supported set", async () => {
    const interceptor = new LocaleFilterResponseInterceptor(
      makeLocaleService({ getSupportedLocales: () => [] }),
    );
    const response = makeResponse({ title: { en: "Hi", ar: "مرحبا" } });
    const next: IHttpNextFunction = vi.fn().mockResolvedValue(response);

    const result = await interceptor.intercept(makeContext(), next);
    expect(result.data).toEqual({ title: { en: "Hi", ar: "مرحبا" } });
  });

  it("passes through when the locale service returns an empty locale", async () => {
    const interceptor = new LocaleFilterResponseInterceptor(
      makeLocaleService({ getLocale: () => "" }),
    );
    const response = makeResponse({ title: { en: "Hi", ar: "مرحبا" } });
    const next: IHttpNextFunction = vi.fn().mockResolvedValue(response);

    const result = await interceptor.intercept(makeContext(), next);
    expect(result.data).toEqual({ title: { en: "Hi", ar: "مرحبا" } });
  });
});

describe("LocaleFilterResponseInterceptor — slice behavior", () => {
  it("slices to the active locale (en)", async () => {
    const interceptor = new LocaleFilterResponseInterceptor(
      makeLocaleService(),
    );
    const response = makeResponse({
      title: { en: "Hello", ar: "مرحبا", ru: "Привет" },
    });
    const next: IHttpNextFunction = vi.fn().mockResolvedValue(response);

    const result = await interceptor.intercept(makeContext(), next);
    expect(result.data).toEqual({ title: "Hello" });
  });

  it("slices to the active locale (ar)", async () => {
    const interceptor = new LocaleFilterResponseInterceptor(
      makeLocaleService({ getLocale: () => "ar" }),
    );
    const response = makeResponse({
      title: { en: "Hello", ar: "مرحبا", ru: "Привет" },
    });
    const next: IHttpNextFunction = vi.fn().mockResolvedValue(response);

    const result = await interceptor.intercept(makeContext(), next);
    expect(result.data).toEqual({ title: "مرحبا" });
  });

  it("slices a realistic page-content shape end-to-end", async () => {
    const interceptor = new LocaleFilterResponseInterceptor(
      makeLocaleService({ getLocale: () => "ru" }),
    );
    const response = makeResponse({
      slug: "home",
      published_at: "2026-08-01",
      seo: {
        title: { en: "Figentra", ar: "فيغنترا", ru: "Фигентра" },
        description: { en: "The company", ar: "الشركة", ru: "Компания" },
        canonical: "https://figentra.com/",
        og: { image: "/og/home.png", type: "website" },
      },
      content: {
        hero: {
          title: { en: "Welcome", ar: "أهلاً", ru: "Добро пожаловать" },
          subtitle: { en: "…", ar: "…", ru: "…" },
        },
        cards: [
          { label: { en: "One", ar: "واحد", ru: "Один" }, href: "/1" },
          { label: { en: "Two", ar: "اثنان", ru: "Два" }, href: "/2" },
        ],
      },
    });
    const next: IHttpNextFunction = vi.fn().mockResolvedValue(response);

    const result = await interceptor.intercept(makeContext(), next);
    expect(result.data).toEqual({
      slug: "home",
      published_at: "2026-08-01",
      seo: {
        title: "Фигентра",
        description: "Компания",
        canonical: "https://figentra.com/",
        og: { image: "/og/home.png", type: "website" },
      },
      content: {
        hero: { title: "Добро пожаловать", subtitle: "…" },
        cards: [
          { label: "Один", href: "/1" },
          { label: "Два", href: "/2" },
        ],
      },
    });
  });

  it("returns a new response object rather than mutating the original", async () => {
    const interceptor = new LocaleFilterResponseInterceptor(
      makeLocaleService(),
    );
    const originalData = { title: { en: "Hi", ar: "مرحبا", ru: "Привет" } };
    const response = makeResponse(originalData);
    const next: IHttpNextFunction = vi.fn().mockResolvedValue(response);

    const result = await interceptor.intercept(makeContext(), next);
    // Preserved on the original for reads later in the pipeline.
    expect(response.data).toBe(originalData);
    // Fresh data on the sliced response.
    expect(result.data).not.toBe(originalData);
  });

  it("handles null response data without throwing", async () => {
    const interceptor = new LocaleFilterResponseInterceptor(
      makeLocaleService(),
    );
    const response = makeResponse(null);
    const next: IHttpNextFunction = vi.fn().mockResolvedValue(response);

    const result = await interceptor.intercept(makeContext(), next);
    expect(result.data).toBe(null);
  });
});
