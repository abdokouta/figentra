/**
 * @file app.module.ts
 * @description Audit Service composition root.
 *
 * The Audit Service owns durable audit persistence and query use cases.
 * Technical logs and telemetry remain separate from this ledger.
 */
import { Module, Reflector } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { LoggerModule } from "nestjs-pino";
import { AcceptLanguageResolver, HeaderResolver, I18nModule } from "nestjs-i18n";
import {
  FIGENTRA_SERVICE_ID,
  IamAuthorizationGuard,
  IamRpcAuthorizationAdapter,
  ServiceIdentityGuard,
  ServiceIdentityVerifier,
} from "@figentra/security";
import { NatsMessagingAdapter } from "@figentra/messaging";
import { RegistryModule } from "@figentra/registry-worker-sdk";

import mikroOrmConfig from "./infrastructure/mikro-orm.config";
import { AuditEntry } from "./audit/domain/audit-entry.entity";
import { AuditService } from "./audit/application/audit.service";
import { AuditEventConsumer } from "./audit/application/audit-event.consumer";
import { AuditController } from "./audit/presentation/audit.controller";
import { HealthController } from "./infrastructure/health.controller";
import { DevtoolsModule, ObserveModule } from "./infrastructure/observability";

/**
 * Public application composition root.
 */
@Module({
  controllers: [HealthController, AuditController, AuditEventConsumer],
  providers: [
    AuditService,
    {
      provide: ServiceIdentityVerifier,
      useFactory: () => {
        const jwksUrl = process.env.SERVICE_IDENTITY_JWKS_URL;
        const issuer = process.env.SERVICE_IDENTITY_ISSUER;
        const audience = process.env.SERVICE_IDENTITY_AUDIENCE;

        if (!jwksUrl || !issuer || !audience) {
          throw new Error(
            "SERVICE_IDENTITY_JWKS_URL, SERVICE_IDENTITY_ISSUER and SERVICE_IDENTITY_AUDIENCE are required",
          );
        }

        return new ServiceIdentityVerifier({
          jwksUrl: new URL(jwksUrl),
          issuer,
          audience,
        });
      },
    },
    {
      provide: FIGENTRA_SERVICE_ID,
      useValue: "audit",
    },
    {
      provide: NatsMessagingAdapter,
      useFactory: () => {
        if (process.env.NATS_ENABLED === "false") {
          return {
            send: async () => {
              throw new Error("NATS is disabled");
            },
            publish: async () => undefined,
          } as unknown as NatsMessagingAdapter;
        }

        return new NatsMessagingAdapter({
          servers: (process.env.NATS_SERVERS ?? "nats://localhost:4222").split(","),
          name: "figentra-audit",
          queue: "figentra-audit",
          user: process.env.NATS_USER,
          pass: process.env.NATS_PASS,
          token: process.env.NATS_TOKEN,
          tls: process.env.NATS_TLS_CA
            ? {
              ca: process.env.NATS_TLS_CA,
              cert: process.env.NATS_TLS_CERT,
              key: process.env.NATS_TLS_KEY,
            }
            : undefined,
        });
      },
    },
    {
      provide: IamRpcAuthorizationAdapter,
      useFactory: (rpc: NatsMessagingAdapter) =>
        new IamRpcAuthorizationAdapter(rpc),
      inject: [NatsMessagingAdapter],
    },
    {
      provide: IamAuthorizationGuard,
      useFactory: (adapter: IamRpcAuthorizationAdapter) =>
        new IamAuthorizationGuard(new Reflector(), adapter),
      inject: [IamRpcAuthorizationAdapter],
    },
  ],
  imports: [
    ObserveModule,
    DevtoolsModule,
    ConfigModule.forRoot({ isGlobal: true }),
    RegistryModule.forRootAsync({
      useFactory: () => ({
        application: "audit",
        displayName: "Audit Service",
        description: "Durable audit log persistence and query service.",
        version: process.env.APP_VERSION ?? "0.0.0",
        registryUrl: process.env.REGISTRY_URL ?? "http://localhost:8787",
        registrationToken: process.env.REGISTRY_TOKEN,
        environment: (process.env.NODE_ENV as "development" | "staging" | "production") ?? "development",
        enabled: process.env.REGISTRY_ENABLED !== "false",
        failOnRegistrationError: false,
      }),
    }),
    MikroOrmModule.forRoot(mikroOrmConfig),
    MikroOrmModule.forFeature([AuditEntry]),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? "info",
        genReqId: (request) =>
          request.headers["x-request-id"]?.toString() ?? crypto.randomUUID(),
        redact: {
          paths: [
            "req.headers.authorization",
            "req.headers.cookie",
            "req.body.password",
            "req.body.access_token",
            "req.body.refresh_token",
            "req.body.client_secret",
          ],
          censor: "[REDACTED]",
        },
      },
    }),
    I18nModule.forRoot({
      fallbackLanguage: process.env.FALLBACK_LANGUAGE ?? "en",
      loaderOptions: {
        path: new URL("./i18n/", import.meta.url).pathname,
        watch: process.env.NODE_ENV !== "production",
      },
      resolvers: [new HeaderResolver(["x-lang"]), AcceptLanguageResolver],
    }),
  ],
})
/** Public symbol `AppModule`. */
export class AppModule { }
