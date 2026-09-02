/** @file security.middleware.ts @description HTTP security headers. */
import { Injectable, type NestMiddleware } from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";

/** Applies conservative security headers at the application boundary. */
@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  /** Writes headers that are safe for API responses. */
  public use(_request: FastifyRequest, reply: FastifyReply, next: () => void): void {
    reply.header("x-content-type-options", "nosniff");
    reply.header("x-frame-options", "DENY");
    reply.header("referrer-policy", "no-referrer");
    reply.header("permissions-policy", "camera=(), microphone=(), geolocation=()");
    reply.header("cross-origin-resource-policy", "same-origin");
    reply.header("cache-control", "no-store");
    next();
  }
}
