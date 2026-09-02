/**
 * @file observability.factory.ts
 * @description Creates the shared NestJS Observe integration.
 */
import { createObserveModule } from "@nestjs/observe";
import type { FigentraObservabilityOptions } from "./interfaces/observability-options.interface";
import type { FigentraObservabilityRuntime } from "./types/observability-runtime.type";
import { GIT_SHA_ENV, OBSERVE_APP_KEY_ENV, OBSERVE_APP_SECRET_ENV, OBSERVE_DEBUG_ENV, OBSERVE_ENDPOINT_ENV } from "./constants/observability.constant";

/**
 * Creates a matched Observe module and instrumentation instance.
 *
 * @param options - Service identity and telemetry settings.
 * @returns Observe module and instrumentation pair.
 */
export const createFigentraObservability = (options: FigentraObservabilityOptions): FigentraObservabilityRuntime => {
  const { ObserveModule, ObserveInstrument } = createObserveModule({
    sourceContext: { linesOfContext: 5, maxFrames: 5, sourceMaps: false },
  });
  return {
    module: ObserveModule.forRoot({
      appKey: process.env[OBSERVE_APP_KEY_ENV] ?? "",
      appSecret: process.env[OBSERVE_APP_SECRET_ENV] ?? "",
      serviceId: options.serviceId,
      serviceVersion: options.serviceVersion || process.env[GIT_SHA_ENV] || "unknown",
      endpoint: options.endpoint ?? process.env[OBSERVE_ENDPOINT_ENV],
      debug: options.debug ?? process.env[OBSERVE_DEBUG_ENV] === "true",
    }),
    instrument: ObserveInstrument,
  };
};
