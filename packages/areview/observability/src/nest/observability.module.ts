/**
 * @file observability.module.ts
 * @description Global NestJS observability module.
 */
import { Global, Module } from "@nestjs/common";
import type { DynamicModule } from "@nestjs/common";
import { createFigentraObservability } from "./observability.factory";
import type { FigentraObservabilityOptions } from "./interfaces/observability-options.interface";

/** Provides the shared NestJS Observe integration. */
@Global()
@Module({})
/** Public symbol `FigentraObservabilityModule`. */
export class FigentraObservabilityModule {
  /**
   * Configures Observe for one service.
   *
   * @param options - Service identity and telemetry settings.
   * @returns Dynamic Nest module.
   */
  static forRoot(options: FigentraObservabilityOptions): DynamicModule {
    const runtime = createFigentraObservability(options);
    return { module: FigentraObservabilityModule, imports: [runtime.module], exports: [runtime.module] };
  }
}
