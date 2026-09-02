/**
 * @file client.helper.spec.ts
 * @description Unit tests for Registry client helper functions.
 */

import {
  buildRegistryUrl,
  buildRegistryHeaders,
  fetchWithRetry,
  RegistryClientError,
} from "../../src/helpers/client.helper";

describe("client.helper", () => {
  describe("buildRegistryUrl", () => {
    it("should strip trailing slashes and append path", () => {
      expect(buildRegistryUrl("http://localhost:8787/", "/v1/registrations")).toBe(
        "http://localhost:8787/v1/registrations",
      );
      expect(buildRegistryUrl("http://localhost:8787", "/v1/registrations")).toBe(
        "http://localhost:8787/v1/registrations",
      );
    });
  });

  describe("buildRegistryHeaders", () => {
    it("should include Content-Type and Accept by default", () => {
      const headers = buildRegistryHeaders();
      expect(headers["Content-Type"]).toBe("application/json");
      expect(headers["Accept"]).toBe("application/json");
      expect(headers["Authorization"]).toBeUndefined();
    });

    it("should include Authorization header when token provided", () => {
      const headers = buildRegistryHeaders("secret-token-123");
      expect(headers["Authorization"]).toBe("Bearer secret-token-123");
    });
  });

  describe("fetchWithRetry", () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("should return response on first successful attempt", async () => {
      fetchMock.mockResolvedValueOnce(new Response("ok", { status: 200 }));
      const response = await fetchWithRetry("http://localhost:8787/test", { method: "GET" }, 2, 5000);
      expect(response.status).toBe(200);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("should retry and succeed on subsequent attempt", async () => {
      fetchMock
        .mockRejectedValueOnce(new Error("network glitch"))
        .mockResolvedValueOnce(new Response("ok", { status: 200 }));

      const response = await fetchWithRetry("http://localhost:8787/test", { method: "GET" }, 2, 5000);
      expect(response.status).toBe(200);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("should throw RegistryClientError after all retries exhausted", async () => {
      fetchMock.mockRejectedValue(new Error("persistent failure"));

      await expect(
        fetchWithRetry("http://localhost:8787/test", { method: "GET" }, 2, 5000),
      ).rejects.toBeInstanceOf(RegistryClientError);
    });
  });
});
