export class HealthConfigurationError extends Error {
  constructor(message: string) { super(message); this.name = "HealthConfigurationError"; }
}
export class HealthTimeoutError extends Error {
  constructor(public readonly indicator: string, public readonly timeoutMs: number) { super(`Health indicator '${indicator}' timed out after ${timeoutMs}ms`); this.name = "HealthTimeoutError"; }
}
