/** @file request-context.middleware.test.ts @description Request context middleware tests. */
import { describe, expect, it, vi } from "vitest";
import { RequestContextMiddleware } from "../../src/middleware/request-context.middleware";

describe("RequestContextMiddleware", () => {
  it("creates and mirrors bounded request identifiers", () => {
    const request = { headers: {} } as any;
    const reply = { header: vi.fn() } as any;
    const next = vi.fn();
    new RequestContextMiddleware().use(request, reply, next);
    expect(request.headers["x-request-id"]).toMatch(/^[A-Za-z0-9-]+$/);
    expect(reply.header).toHaveBeenCalledWith("x-request-id", request.headers["x-request-id"]);
    expect(next).toHaveBeenCalledOnce();
  });
});
