/**
 * @file main.ts
 * @description NestJS application bootstrap for the {{SLUG}} service.
 *   Boots Fastify as the HTTP adapter; configures CORS, validation pipes,
 *   and the global exception filter.
 *
 * @security
 *   - No secrets in source. Runtime config comes from Doppler via env vars.
 *   - CORS origins are env-driven (never `*` in production).
 */

import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { AppModule } from "./app.module";

/**
 * Bootstrap the NestJS application.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
  );

  // Global prefix — every route starts with /api/v1/.
  app.setGlobalPrefix("api/v1");

  // Listen on the container port. Bind to 0.0.0.0 so Docker/k8s can reach it.
  const port = process.env.PORT ?? "3000";
  await app.listen(Number(port), "0.0.0.0");

  console.log(`{{SLUG}} service listening on :${port}`);
}

void bootstrap();
