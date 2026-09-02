/** @file request-context.interceptor.ts @description Request context response correlation. */
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import type { FastifyReply } from "fastify";
import { Observable, tap } from "rxjs";
import { CORRELATION_ID_HEADER, REQUEST_ID_HEADER } from "../constants/gateway.constant.js";

/** Symbolic metadata key reserved for request-context integration. */
export const REQUEST_CONTEXT = Symbol("figentra.gateway.request-context");

/** Adds consistent request metadata to all HTTP responses. */
@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  /** Correlates response headers with the inbound request. */
  public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const reply = context.switchToHttp().getResponse<FastifyReply>();
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | string[] | undefined> }>();
    const requestId = Array.isArray(request.headers[REQUEST_ID_HEADER]) ? request.headers[REQUEST_ID_HEADER][0] : request.headers[REQUEST_ID_HEADER];
    const correlationId = Array.isArray(request.headers[CORRELATION_ID_HEADER]) ? request.headers[CORRELATION_ID_HEADER][0] : request.headers[CORRELATION_ID_HEADER];
    if (requestId) reply.header(REQUEST_ID_HEADER, requestId);
    if (correlationId) reply.header(CORRELATION_ID_HEADER, correlationId);
    return next.handle().pipe(tap(() => undefined));
  }
}
