import { DefaultHealthService } from "../../src/core/services/health.service.js";

test("isolates failures and aggregates critical indicators", async () => {
  const service = new DefaultHealthService({ indicators: [
    { name: "db", probes: ["readiness"], critical: true, check: async () => { throw new Error("db down"); } },
    { name: "metrics", probes: ["readiness"], critical: false, check: () => ({ status: "down" as const }) },
  ] });
  const report = await service.check("readiness");
  expect(report.status).toBe("down");
  expect(report.checks.db.status).toBe("down");
  expect(report.checks.metrics.status).toBe("down");
});

test("returns unknown when a probe has no indicators", async () => {
  const report = await new DefaultHealthService().check("liveness");
  expect(report.status).toBe("unknown");
});
