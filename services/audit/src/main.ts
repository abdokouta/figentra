/**
 * HTTP entrypoint for the Figentra audit service.
 *
 * Fastify is Nest's HTTP adapter for low-overhead request handling. Hono is
 * reserved for edge Workers; Nest owns substantial domain/application logic.
 */
import 'reflect-metadata';

import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { type MicroserviceOptions } from '@nestjs/microservices';
import { createNatsMicroserviceOptions } from '@figentra/messaging';
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

  const natsOptions = createNatsMicroserviceOptions({
    servers: (process.env.NATS_SERVERS ?? "nats://localhost:4222").split(","),
    name: "figentra-audit-consumer",
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

  app.connectMicroservice<MicroserviceOptions>(natsOptions);
  await app.startAllMicroservices();

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
}

await bootstrap();
