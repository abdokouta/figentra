export const HEALTH_PATHS = { root: "health", liveness: "health/liveness", readiness: "health/readiness", startup: "health/startup" } as const;
export const DEFAULT_HEALTH_TIMEOUT_MS = 5_000;
