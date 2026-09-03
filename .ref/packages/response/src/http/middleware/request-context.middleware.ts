/**
 * @file request-context.middleware.ts
 * @module @stackra/nestjs-response/http/middleware
 * @description NestJS middleware that initializes the ResponseContext
 *   with request_id and start_time for each incoming HTTP request.
 *   Also extracts trace IDs from incoming headers for distributed tracing.
 */

import { IInjectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

/**
 * Middleware that initializes request context for response generation.
 *
 * Extracts trace identifiers from incoming request headers (X-Request-ID,
 * X-Trace-ID) and stores them for use by the response interceptor and filters.
 * If no request ID header is present, the ResponseContext generates one automatically.
 */
@IInjectable()
export class RequestContextMiddleware implements NestMiddleware {
  /**
   * Process the incoming request and initialize context.
   *
   * @param req - The incoming HTTP request
   * @param _res - The HTTP response (unused)
   * @param next - The next middleware function
   */
  public use(req: Request, _res: Response, next: NextFunction): void {
    // Extract trace headers if present
    const requestId = req.headers['x-request-id'] as string | undefined;
    const traceId = req.headers['x-trace-id'] as string | undefined;

    // Store on request for downstream access
    if (requestId) {
      (req as unknown as Record<string, unknown>)['requestId'] = requestId;
    }
    if (traceId) {
      (req as unknown as Record<string, unknown>)['traceId'] = traceId;
    }

    next();
  }
}
