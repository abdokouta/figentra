/** @file gateway.module.ts @description Gateway application module. */
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LoggerModule } from "nestjs-pino";
import { GatewayController } from "../controllers/gateway.controller.js";
import { GatewayHealthController } from "../controllers/gateway-health.controller.js";
import { AuthenticationGuard } from "../guards/authentication.guard.js";
import { GatewayJwtVerifierService } from "../security/jwt-verifier.service.js";
import { GatewayRegistryService } from "../services/registry.service.js";
import { GatewayIamService } from "../services/iam.service.js";
import { GatewayTokenExchangeService } from "../services/token-exchange.service.js";
import { GatewayUpstreamService } from "../services/upstream.service.js";
import { GatewayConfigModule } from "./gateway.config.module.js";

/** Root Gateway feature module. */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    GatewayConfigModule,
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? "info",
        redact: { paths: ["req.headers.authorization", "req.headers.cookie"], censor: "[REDACTED]" },
      },
    }),
  ],
  controllers: [GatewayHealthController, GatewayController],
  providers: [
    GatewayJwtVerifierService,
    GatewayRegistryService,
    GatewayIamService,
    GatewayTokenExchangeService,
    GatewayUpstreamService,
    AuthenticationGuard,
  ],
  exports: [GatewayRegistryService, GatewayIamService, GatewayTokenExchangeService],
})
export class GatewayModule {}
