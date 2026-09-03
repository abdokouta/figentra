/**
 * @file metrics-collector.service.spec.ts
 * @module @stackra/http/__tests__/unit
 */

import { describe, expect, it } from "vitest";

import { MetricsCollectorService } from "../../src/core/services/metrics-collector.service";

describe("MetricsCollectorService", () => {
  it("records a request and returns metrics for the endpoint", () => {
    const collector = new MetricsCollectorService();
    collector.recordRequest({
      endpoint: "GET:/users",
      method: "GET",
      status: 200,
      duration: 100,
      success: true,
      timestamp: Date.now(),
    });

    const metrics = collector.getMetrics("GET:/users");
    expect(metrics?.totalRequests).toBe(1);
    expect(metrics?.successCount).toBe(1);
    expect(metrics?.failureCount).toBe(0);
  });

  it("increments failure counter for failed requests", () => {
    const collector = new MetricsCollectorService();
    collector.recordRequest({
      endpoint: "GET:/x",
      method: "GET",
      status: 500,
      duration: 50,
      success: false,
      timestamp: Date.now(),
    });
    const metrics = collector.getMetrics("GET:/x");
    expect(metrics?.failureCount).toBe(1);
    expect(metrics?.successCount).toBe(0);
  });

  it("tracks status code counts", () => {
    const collector = new MetricsCollectorService();
    collector.recordRequest({
      endpoint: "GET:/x",
      method: "GET",
      status: 200,
      duration: 10,
      success: true,
      timestamp: Date.now(),
    });
    collector.recordRequest({
      endpoint: "GET:/x",
      method: "GET",
      status: 200,
      duration: 20,
      success: true,
      timestamp: Date.now(),
    });
    collector.recordRequest({
      endpoint: "GET:/x",
      method: "GET",
      status: 500,
      duration: 30,
      success: false,
      timestamp: Date.now(),
    });
    const metrics = collector.getMetrics("GET:/x");
    expect(metrics?.statusCodes.get(200)).toBe(2);
    expect(metrics?.statusCodes.get(500)).toBe(1);
  });

  it("getPercentiles returns p50/p95/p99", () => {
    const collector = new MetricsCollectorService();
    // Record 100 requests with durations 1..100.
    for (let i = 1; i <= 100; i++) {
      collector.recordRequest({
        endpoint: "GET:/perc",
        method: "GET",
        status: 200,
        duration: i,
        success: true,
        timestamp: Date.now(),
      });
    }
    const perc = collector.getPercentiles("GET:/perc");
    expect(perc?.p50).toBeGreaterThanOrEqual(50);
    expect(perc?.p95).toBeGreaterThanOrEqual(95);
    expect(perc?.p99).toBeGreaterThanOrEqual(99);
  });

  it("getRealTimeStats returns aggregate stats", () => {
    const collector = new MetricsCollectorService();
    collector.recordRequest({
      endpoint: "GET:/a",
      method: "GET",
      status: 200,
      duration: 100,
      success: true,
      timestamp: Date.now(),
    });
    collector.recordRequest({
      endpoint: "GET:/b",
      method: "GET",
      status: 200,
      duration: 200,
      success: true,
      timestamp: Date.now(),
    });
    collector.recordRequest({
      endpoint: "GET:/a",
      method: "GET",
      status: 500,
      duration: 50,
      success: false,
      timestamp: Date.now(),
    });

    const stats = collector.getRealTimeStats();
    expect(stats.totalRequests).toBe(3);
    expect(stats.successRate).toBeCloseTo((2 / 3) * 100, 1);
    expect(stats.activeEndpoints).toBe(2);
  });

  it("reset() drops every endpoint's metrics", () => {
    const collector = new MetricsCollectorService();
    collector.recordRequest({
      endpoint: "GET:/x",
      method: "GET",
      status: 200,
      duration: 10,
      success: true,
      timestamp: Date.now(),
    });
    collector.reset();
    expect(collector.getAllMetrics()).toEqual([]);
  });
});
