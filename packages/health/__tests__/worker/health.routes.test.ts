import { defineHealthRoutes } from "../../src/worker/health.routes.js";

test("defines stable probe routes", () => {
  expect(defineHealthRoutes({ path: "/ops/health" }).map((route) => route.path)).toEqual([
    "/ops/health", "/ops/health/liveness", "/ops/health/readiness", "/ops/health/startup",
  ]);
});
