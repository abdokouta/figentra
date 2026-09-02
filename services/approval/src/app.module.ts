/**
 * Root composition module for the Figentra approval service.
 *
 * Cross-cutting infrastructure belongs here; business behavior belongs in
 * bounded-context modules imported by this composition root.
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AcceptLanguageResolver, HeaderResolver, I18nModule } from 'nestjs-i18n';
import { ObservabilityModule } from "./infrastructure/observability.module";

@Module({
  controllers: [],
  imports: [
    ObservabilityModule,
    ConfigModule.forRoot({ isGlobal: true }),
    RegistryModule.forRootAsync({
      useFactory: () => ({
        application: "approval",
        displayName: "Approval Service",
        description: "Multi-party authorization workflows, change management, and human-in-the-loop approvals.",
        version: process.env.APP_VERSION ?? "0.0.0",
        registryUrl: process.env.REGISTRY_URL ?? "http://localhost:8787",
        registrationToken: process.env.REGISTRY_TOKEN,
        environment: (process.env.NODE_ENV as "development" | "staging" | "production") ?? "development",
        enabled: process.env.REGISTRY_ENABLED !== "false",
        failOnRegistrationError: false,
      }),
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        genReqId: (request) =>
          request.headers['x-request-id']?.toString() ?? crypto.randomUUID(),
      },
    }),
    I18nModule.forRoot({
      fallbackLanguage: process.env.FALLBACK_LANGUAGE ?? 'en',
      loaderOptions: {
        path: new URL('./i18n/', import.meta.url).pathname,
        watch: process.env.NODE_ENV !== 'production',
      },
      resolvers: [new HeaderResolver(['x-lang']), AcceptLanguageResolver],
    }),
  ],
})
/**
 * Public Figentra API symbol.
 */
export class AppModule { }
