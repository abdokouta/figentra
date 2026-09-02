/** @file cors.middleware.ts @description Explicit CORS policy. */
import { Injectable, type NestMiddleware } from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { GatewayConfig } from "../config/gateway.config";

/** Enforces the configured browser origin allow-list. */
@Injectable()
export class CorsMiddleware implements NestMiddleware {
  /** Creates the CORS policy from validated configuration. */
  public constructor(private readonly config: GatewayConfig) { }

  /** Handles CORS preflight and response headers. */
  public use(request: FastifyRequest, reply: FastifyReply, next: () => void): void {
    const origin = typeof request.headers.origin === "string" ? request.headers.origin : undefined;
    if (origin && this.config.corsOrigins.includes(origin)) {
      reply.header("access-control-allow-origin", origin);
      reply.header("vary", "Origin");
      reply.header("access-control-allow-credentials", "true");
      reply.header("access-control-allow-methods", "GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS");
      reply.header("access-control-allow-headers", "Authorization,Content-Type,Idempotency-Key,X-Request-ID,X-Correlation-ID,Traceparent");
      reply.header("access-control-max-age", "600");
    }
    if (request.method === "OPTIONS") {
      reply.status(204).send();
      return;
    }
    next();
  }
}
