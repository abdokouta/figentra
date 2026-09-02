/**
 * HTTP entrypoint for the Figentra notifications service.
 *
 * Fastify is Nest's HTTP adapter for low-overhead request handling. Hono is
 * reserved for edge Workers; Nest owns substantial domain/application logic.
 */
import 'reflect-metadata';

import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module.js';
import { ObserveInstrument } from './infrastructure/observability.js';

/**
 * Bootstraps the HTTP application and applies platform-wide invariants.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false, trustProxy: true }),
    {
      bufferLogs: true,
      instrument: ObserveInstrument,
      // Devtools snapshots are explicit opt-in; never collect them in production by default.
      snapshot: process.env.NEST_DEVTOOLS_SNAPSHOT === "true",
    },
  );

  // Use the shared Pino logger so every request carries correlation metadata.
  app.useLogger(app.get(Logger));

  // Version the public service contract at the HTTP boundary.
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // Reject unknown input fields and avoid implicit coercion.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  // Allow the container runtime to drain requests during termination.
  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
}

await bootstrap();
