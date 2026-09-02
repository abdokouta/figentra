/**
 * @file observability-runtime.type.ts
 * @description Runtime type returned by the Observe adapter.
 */
import type { DynamicModule } from "@nestjs/common";

/** Matched Observe module and instrumentation pair. */
export interface FigentraObservabilityRuntime {
  /** Dynamic Nest module containing Observe providers. */
  readonly module: DynamicModule;
  /** Instrumentation object supplied to NestFactory.create(). */
  readonly instrument: unknown;
}
