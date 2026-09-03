/**
 * @file error-normalizer.interceptor.spec.ts
 * @module @stackra/http/__tests__/unit
 * @description Behavioural spec for `ErrorNormalizerInterceptor`.
 *   Verifies every branch of the `normalize` function that shapes
 *   raw errors into `IHttpError`.
 */

import { describe, expect, it, vi } from "vitest";
import { HttpMethod } from "@stackra/contracts";
import type { IHttpContext, IHttpNextFunction } from "@stackra/contracts";

import { ErrorNormalizerInterceptor } from "../../src/core/interceptors/error-normalizer.interceptor";

function makeContext(
  overrides: Partial<IHttpContext["request"]> = {},
): IHttpContext {
  return {
    request: {
      method: HttpMethod.GET,
      url: "/users",
      baseURL: "https://api.example.com",
      meta: {},
      ...overrides,
    },
    metadata: new Map(),
  };
}

describe("ErrorNormalizerInterceptor — passthrough on success", () => {
  it("returns the response unchanged when next() resolves", async () => {
    const interceptor = new ErrorNormalizerInterceptor();
    const response = {
      data: { ok: true },
      status: 200,
      statusText: "OK",
      headers: {},
    };
    const next: IHttpNextFunction = vi.fn().mockResolvedValue(response);

    const result = await interceptor.intercept(makeContext(), next);
    expect(result).toBe(response);
  });
});

describe("ErrorNormalizerInterceptor — axios errors", () => {
  it("normalises a timeout error (ECONNABORTED) to statusCode 0", async () => {
    const interceptor = new ErrorNormalizerInterceptor();
    const next: IHttpNextFunction = () =>
      Promise.reject({
        isAxiosError: true,
        code: "ECONNABORTED",
        message: "timeout",
      });

    await expect(
      interceptor.intercept(makeContext({ timeout: 5000 }), next),
    ).rejects.toMatchObject({
      isHttpError: true,
      statusCode: 0,
      message: "Request timeout after 5000ms",
    });
  });

  it("normalises a network error (no response) to statusCode 0", async () => {
    const interceptor = new ErrorNormalizerInterceptor();
    const next: IHttpNextFunction = () =>
      Promise.reject({ isAxiosError: true, message: "Network Error" });

    await expect(
      interceptor.intercept(makeContext(), next),
    ).rejects.toMatchObject({
      isHttpError: true,
      statusCode: 0,
      message: "Network Error",
    });
  });

  it("normalises a response error with `message` and `errors`", async () => {
    const interceptor = new ErrorNormalizerInterceptor();
    const next: IHttpNextFunction = () =>
      Promise.reject({
        isAxiosError: true,
        response: {
          data: {
            message: "Validation failed",
            errors: { email: ["invalid"] },
          },
          status: 422,
          statusText: "Unprocessable Entity",
          headers: { "content-type": "application/json" },
        },
      });

    await expect(
      interceptor.intercept(makeContext(), next),
    ).rejects.toMatchObject({
      isHttpError: true,
      statusCode: 422,
      message: "Validation failed",
      errors: { email: ["invalid"] },
    });
  });

  it("falls back to statusText when the response body has no message", async () => {
    const interceptor = new ErrorNormalizerInterceptor();
    const next: IHttpNextFunction = () =>
      Promise.reject({
        isAxiosError: true,
        response: {
          data: {},
          status: 500,
          statusText: "Internal Server Error",
          headers: {},
        },
      });

    await expect(
      interceptor.intercept(makeContext(), next),
    ).rejects.toMatchObject({
      message: "Internal Server Error",
      statusCode: 500,
    });
  });
});

describe("ErrorNormalizerInterceptor — abort + generic errors", () => {
  it("normalises AbortError (fetch cancellation) to statusCode 0", async () => {
    const interceptor = new ErrorNormalizerInterceptor();
    const abortError = Object.assign(new Error("Aborted"), {
      name: "AbortError",
    });
    const next: IHttpNextFunction = () => Promise.reject(abortError);

    await expect(
      interceptor.intercept(makeContext(), next),
    ).rejects.toMatchObject({
      isHttpError: true,
      statusCode: 0,
      message: "Aborted",
    });
  });

  it("normalises a generic Error to statusCode 0 + preserves the message", async () => {
    const interceptor = new ErrorNormalizerInterceptor();
    const next: IHttpNextFunction = () =>
      Promise.reject(new Error("some random failure"));

    await expect(
      interceptor.intercept(makeContext(), next),
    ).rejects.toMatchObject({
      isHttpError: true,
      statusCode: 0,
      message: "some random failure",
    });
  });

  it("normalises a non-Error thrown value with a default message", async () => {
    const interceptor = new ErrorNormalizerInterceptor();
    const next: IHttpNextFunction = () => Promise.reject("bare-string");

    await expect(
      interceptor.intercept(makeContext(), next),
    ).rejects.toMatchObject({
      isHttpError: true,
      statusCode: 0,
      message: "An unexpected error occurred",
    });
  });
});

describe("ErrorNormalizerInterceptor — already-normalized errors", () => {
  it("propagates an already-IHttpError without re-normalizing", async () => {
    const interceptor = new ErrorNormalizerInterceptor();
    const original = {
      isHttpError: true,
      message: "already normalised",
      statusCode: 418,
    };
    const next: IHttpNextFunction = () => Promise.reject(original);

    try {
      await interceptor.intercept(makeContext(), next);
    } catch (err) {
      // Reference-equal — never wrapped.
      expect(err).toBe(original);
    }
  });
});
