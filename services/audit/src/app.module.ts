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

import mikroOrmConfig from "./infrastructure/mikro-orm.config.js";
import { AuditEntry } from "./audit/domain/audit-entry.entity.js";
import { AuditService } from "./audit/application/audit.service.js";
import { AuditEventConsumer } from "./audit/application/audit-event.consumer.js";
import { AuditController } from "./audit/presentation/audit.controller.js";
import { HealthController } from "./infrastructure/health.controller.js";
import { DevtoolsModule, ObserveModule } from "./infrastructure/observability.js";

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
export class AppModule {}
