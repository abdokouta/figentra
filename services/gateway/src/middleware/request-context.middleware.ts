/** @file request-context.middleware.ts @description Distributed request context middleware. */
import { Injectable, type NestMiddleware } from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { randomUUID } from "node:crypto";
import { CORRELATION_ID_HEADER, REQUEST_ID_HEADER, TRACEPARENT_HEADER } from "../constants/gateway.constant";

/** Establishes safe request/correlation identifiers before authentication. */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  /** Adds request metadata and mirrors it to the response. */
  public use(request: FastifyRequest, reply: FastifyReply, next: () => void): void {
    const requestId = this.safeIdentifier(request.headers[REQUEST_ID_HEADER]) ?? randomUUID();
    const correlationId = this.safeIdentifier(request.headers[CORRELATION_ID_HEADER]) ?? requestId;
    const traceparent = this.safeHeader(request.headers[TRACEPARENT_HEADER]);
    request.headers[REQUEST_ID_HEADER] = requestId;
    request.headers[CORRELATION_ID_HEADER] = correlationId;
    if (traceparent) request.headers[TRACEPARENT_HEADER] = traceparent;
    reply.header(REQUEST_ID_HEADER, requestId);
    reply.header(CORRELATION_ID_HEADER, correlationId);
    if (traceparent) reply.header(TRACEPARENT_HEADER, traceparent);
    next();
  }

  /** Accepts only bounded printable identifiers. */
  private safeIdentifier(value: string | string[] | undefined): string | undefined {
    const candidate = Array.isArray(value) ? value[0] : value;
    if (!candidate || candidate.length > 128 || !/^[A-Za-z0-9._:-]+$/.test(candidate)) return undefined;
    return candidate;
  }

  /** Accepts a bounded traceparent value without interpreting it. */
  private safeHeader(value: string | string[] | undefined): string | undefined {
    const candidate = Array.isArray(value) ? value[0] : value;
    return candidate && candidate.length <= 256 && /^[\x20-\x7E]+$/.test(candidate) ? candidate : undefined;
  }
}
