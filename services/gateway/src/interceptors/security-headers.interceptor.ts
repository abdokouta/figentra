/** @file security-headers.interceptor.ts @description Final security response headers. */
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import type { FastifyReply } from "fastify";
import { Observable } from "rxjs";

/** Applies headers that must survive downstream controller responses. */
@Injectable()
export class SecurityHeadersInterceptor implements NestInterceptor {
  /** Applies immutable security headers before response serialization. */
  public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const reply = context.switchToHttp().getResponse<FastifyReply>();
    reply.header("x-content-type-options", "nosniff");
    reply.header("x-frame-options", "DENY");
    reply.header("referrer-policy", "no-referrer");
    return next.handle();
  }
}
