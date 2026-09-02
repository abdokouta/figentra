/**
 * @file main.ts
 * @description HTTP + internal NATS bootstrap for the identity service.
 *
 * @remarks
 * HTTP remains the primary operational interface. NATS is attached only for
 * internal RPC/events and is never exposed as a public network surface.
 */
import { NestFactory } from "@nestjs/core";
import { Logger } from "nestjs-pino";
import { FastifyAdapter } from "@nestjs/platform-fastify";
import { Transport, type MicroserviceOptions } from "@nestjs/microservices";
import { AppModule } from "./app.module.js";
import { ObserveInstrument } from "./infrastructure/observability.js";

/** Boots the identity service with Fastify HTTP and NATS transport. */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(
    AppModule,
    new FastifyAdapter({ logger: false, trustProxy: true }),
    {
      bufferLogs: true,
      instrument: ObserveInstrument,
      // Graph snapshots are explicit opt-in and remain disabled in production.
      snapshot: process.env.NEST_DEVTOOLS_SNAPSHOT === "true",
    },
  );
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options: {
      servers: (process.env.NATS_SERVERS ?? "nats://localhost:4222").split(","),
      queue: "figentra-identity",
      gracefulShutdown: true,
    },
  });
  await app.startAllMicroservices();
  // Route all Nest framework and application logs through Pino.
  app.useLogger(app.get(Logger));

  await app.listen(Number(process.env.PORT ?? 3000), process.env.HOST ?? "0.0.0.0");
}

void bootstrap();
