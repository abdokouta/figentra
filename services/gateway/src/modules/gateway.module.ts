/**
 * @file gateway.module.ts
 * @description Gateway application module.
 *
 * The Gateway acts as the single entry-point for all external Figentra API traffic.
 * It authenticates requests, resolves upstream targets via the Application Registry,
 * enforces IAM policy, and proxies requests to the correct backend microservice.
 */
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LoggerModule } from "nestjs-pino";
import { RegistryModule } from "@figentra/registry-worker-sdk";
import { GatewayController } from "../controllers/gateway.controller";
import { GatewayHealthController } from "../controllers/gateway-health.controller";
import { AuthenticationGuard } from "../guards/authentication.guard";
import { GatewayJwtVerifierService } from "../security/jwt-verifier.service";
import { GatewayRegistryService } from "../services/registry.service";
import { GatewayIamService } from "../services/iam.service";
import { GatewayTokenExchangeService } from "../services/token-exchange.service";
import { GatewayUpstreamService } from "../services/upstream.service";
import { GatewayConfigModule } from "./gateway.config.module";

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
    RegistryModule.forRootAsync({
      useFactory: () => ({
        application: "gateway",
        displayName: "API Gateway",
        description: "Figentra public API Gateway — authenticates and routes all external traffic.",
        version: process.env.APP_VERSION ?? "0.0.0",
        registryUrl: process.env.REGISTRY_URL ?? "http://localhost:8787",
        registrationToken: process.env.REGISTRY_TOKEN,
        environment: (process.env.NODE_ENV as "development" | "staging" | "production") ?? "development",
        enabled: process.env.REGISTRY_ENABLED !== "false",
        failOnRegistrationError: false,
      }),
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
