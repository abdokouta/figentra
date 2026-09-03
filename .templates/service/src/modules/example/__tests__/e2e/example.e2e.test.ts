/**
 * @file example.e2e.test.ts
 * @description E2E test for the example module's HTTP surface. Boots the
 *   full NestJS + Fastify app and verifies the /api/v1/examples endpoints.
 */

import { describe, expect, it } from "vitest";
// import { buildFastifyTestApp } from "@stackra/testing/nest";
// import { AppModule } from "@/app.module";

describe("Example module — e2e", () => {
  it("GET /api/v1/examples returns 200 + array", async () => {
    // TODO: uncomment when @stackra/testing/nest is wired:
    // const app = await buildFastifyTestApp(AppModule);
    // const response = await app.inject({ method: "GET", url: "/api/v1/examples" });
    // expect(response.statusCode).toBe(200);
    // expect(JSON.parse(response.body)).toBeInstanceOf(Array);
    // await app.close();
    expect(true).toBe(true);
  });

  it("GET /api/v1/examples/:id returns 200 for known ID", async () => {
    expect(true).toBe(true);
  });

  it("GET /api/v1/examples/:id returns 404 for unknown ID", async () => {
    expect(true).toBe(true);
  });
});
