/**
 * @file circuit-breaker.service.spec.ts
 * @module @stackra/http/__tests__/unit
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { CircuitBreakerState } from "@stackra/contracts";

import { CircuitBreakerService } from "../../src/core/services/circuit-breaker.service";

describe("CircuitBreakerService", () => {
  const buildConfig = () => ({
    default: "main",
    connections: {
      main: {
        baseURL: "https://example.com",
        circuitBreaker: {
          failureThreshold: 3,
          successThreshold: 2,
          timeout: 1000,
          halfOpenRequests: 1,
        },
      },
    },
  });

  it("starts in Closed state for a new endpoint", () => {
    const service = new CircuitBreakerService(buildConfig() as never);
    const breaker = service.getBreaker("GET:/users");
    expect(breaker.getState()).toBe(CircuitBreakerState.Closed);
    expect(breaker.getStats().isClosed).toBe(true);
  });

  it("transitions Closed → Open after failureThreshold consecutive failures", () => {
    const service = new CircuitBreakerService(buildConfig() as never);
    const breaker = service.getBreaker("GET:/users");
    breaker.recordFailure();
    breaker.recordFailure();
    breaker.recordFailure();
    expect(breaker.getState()).toBe(CircuitBreakerState.Open);
  });

  it("resets failure count on success in Closed state", () => {
    const service = new CircuitBreakerService(buildConfig() as never);
    const breaker = service.getBreaker("GET:/users");
    breaker.recordFailure();
    breaker.recordFailure();
    breaker.recordSuccess();
    breaker.recordFailure(); // Only 1 failure since success
    expect(breaker.getState()).toBe(CircuitBreakerState.Closed);
  });

  it("isOpen returns true while in Open state within cool-down", () => {
    const service = new CircuitBreakerService(buildConfig() as never);
    const breaker = service.getBreaker("GET:/users");
    breaker.recordFailure();
    breaker.recordFailure();
    breaker.recordFailure();
    expect(breaker.isOpen()).toBe(true);
  });

  it("transitions Open → HalfOpen after cool-down elapses", () => {
    vi.useFakeTimers();
    try {
      const service = new CircuitBreakerService(buildConfig() as never);
      const breaker = service.getBreaker("GET:/users");
      breaker.recordFailure();
      breaker.recordFailure();
      breaker.recordFailure();
      expect(breaker.getState()).toBe(CircuitBreakerState.Open);
      // Wait past the cool-down.
      vi.setSystemTime(Date.now() + 2000);
      // isOpen call triggers the state transition.
      breaker.isOpen();
      expect(breaker.getState()).toBe(CircuitBreakerState.HalfOpen);
    } finally {
      vi.useRealTimers();
    }
  });

  it("transitions HalfOpen → Closed after successThreshold successes", () => {
    vi.useFakeTimers();
    try {
      const service = new CircuitBreakerService(buildConfig() as never);
      const breaker = service.getBreaker("GET:/users");
      breaker.recordFailure();
      breaker.recordFailure();
      breaker.recordFailure();
      vi.setSystemTime(Date.now() + 2000);
      breaker.isOpen(); // transitions to HalfOpen
      breaker.recordSuccess();
      breaker.recordSuccess();
      expect(breaker.getState()).toBe(CircuitBreakerState.Closed);
    } finally {
      vi.useRealTimers();
    }
  });

  it("transitions HalfOpen → Open on any failure", () => {
    vi.useFakeTimers();
    try {
      const service = new CircuitBreakerService(buildConfig() as never);
      const breaker = service.getBreaker("GET:/users");
      breaker.recordFailure();
      breaker.recordFailure();
      breaker.recordFailure();
      vi.setSystemTime(Date.now() + 2000);
      breaker.isOpen();
      breaker.recordFailure();
      expect(breaker.getState()).toBe(CircuitBreakerState.Open);
    } finally {
      vi.useRealTimers();
    }
  });

  it("reset() returns breaker to Closed + zeroed counters", () => {
    const service = new CircuitBreakerService(buildConfig() as never);
    const breaker = service.getBreaker("GET:/users");
    breaker.recordFailure();
    breaker.recordFailure();
    breaker.recordFailure();
    breaker.reset();
    expect(breaker.getState()).toBe(CircuitBreakerState.Closed);
    expect(breaker.getStats().failureCount).toBe(0);
  });

  it("clear() drops every breaker", () => {
    const service = new CircuitBreakerService(buildConfig() as never);
    service.getBreaker("GET:/a");
    service.getBreaker("GET:/b");
    service.clear();
    expect(service.getState("GET:/a")).toBeNull();
    expect(service.getState("GET:/b")).toBeNull();
  });
});
