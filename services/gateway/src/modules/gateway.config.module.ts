/** @file gateway.config.module.ts @description Singleton Gateway configuration provider. */
import { Global, Module } from "@nestjs/common";
import { loadGatewayConfig, type GatewayConfig } from "../config/gateway.config.js";

/** Global provider for validated Gateway runtime configuration. */
@Global()
@Module({
  providers: [{ provide: "GATEWAY_CONFIG", useFactory: loadGatewayConfig }],
  exports: ["GATEWAY_CONFIG"],
})
export class GatewayConfigModule {}

/** Injection token for the validated Gateway configuration. */
export const GATEWAY_CONFIG = "GATEWAY_CONFIG" as const;

/** Type-only alias for the configuration provider. */
export type GatewayConfigProvider = GatewayConfig;
