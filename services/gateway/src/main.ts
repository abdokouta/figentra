/**
 * @file main.ts
 * @description Production bootstrap for the Figentra Gateway.
 */
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { Logger } from "nestjs-pino";
import { AppModule } from "./app.module.js";
import { GatewayExceptionFilter } from "./filters/gateway-exception.filter.js";
import { AuthenticationGuard } from "./guards/authentication.guard.js";
import { RequestContextInterceptor } from "./interceptors/request-context.interceptor.js";
import { SecurityHeadersInterceptor } from "./interceptors/security-headers.interceptor.js";
import { GatewayLoggingInterceptor } from "./interceptors/logging.interceptor.js";
import { loadGatewayConfig } from "./config/gateway.config.js";
import { createFigentraObservability } from "@figentra/observability/nest";
import { SERVICE_NAME, SERVICE_VERSION } from "./constants/service.constant.js";

/** Boots the Gateway with the complete application-boundary pipeline. */
async function bootstrap(): Promise<void> {
  const config = loadGatewayConfig();
  const { instrument } = createFigentraObservability({ serviceId: SERVICE_NAME, serviceVersion: SERVICE_VERSION });
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false, trustProxy: true, bodyLimit: 2 * 1024 * 1024 }),
    { bufferLogs: true, instrument },
  );
  app.useLogger(app.get(Logger));
  app.setGlobalPrefix("api");
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: false }));
  app.useGlobalFilters(new GatewayExceptionFilter());
  app.useGlobalInterceptors(new RequestContextInterceptor(), new SecurityHeadersInterceptor(), new GatewayLoggingInterceptor(app.get(Logger)));
  app.useGlobalGuards(app.get(AuthenticationGuard));
  const swagger = new DocumentBuilder()
    .setTitle("Figentra API Gateway")
    .setDescription("Public Figentra API application boundary.")
    .setVersion(SERVICE_VERSION)
    .addBearerAuth()
    .build();
  SwaggerModule.setup("api/docs", app, SwaggerModule.createDocument(app, swagger));
  app.enableShutdownHooks();
  await app.listen(config.port, "0.0.0.0");
}

await bootstrap();
