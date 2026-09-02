/**
 * @file index.ts
 * @description Hono structured logging integration backed by Pino.
 *
 * The official Hono structured logger is runtime agnostic and accepts Pino as
 * its logger implementation. This avoids Node-only Pino transports in
 * Cloudflare Workers while retaining structured Pino logs.
 */
import { structuredLogger, type StructuredLoggerEnv } from "@hono/structured-logger";
import type { Context, MiddlewareHandler } from "hono";
import pino from "pino";

/**
 * Hono context variables added by the Figentra Worker logger.
 */
export interface WorkerLogVariables {
  /** Request-scoped Pino logger. */
  readonly logger: pino.Logger;
}

/**
 * Hono environment fragment required by the Worker logger middleware.
 */
export type WorkerLogEnv = StructuredLoggerEnv<pino.Logger>;

/**
 * Creates the standard Figentra Hono/Pino request logger.
 *
 * @returns Hono middleware that creates a request-scoped Pino child logger.
 */
export function createWorkerLogger(): MiddlewareHandler<WorkerLogEnv> {
  const rootLogger = pino({
    level: "info",
    browser: {
      asObject: true,
    },
  });

  return structuredLogger<WorkerLogEnv, pino.Logger>({
    createLogger: (context) =>
      rootLogger.child({
        requestId: context.req.header("x-request-id"),
        correlationId: context.req.header("x-correlation-id"),
      }),
    onResponse: (logger, context, elapsedMs) => {
      logger.info(
        {
          method: context.req.method,
          path: context.req.path,
          status: context.res.status,
          elapsedMs,
        },
        "request completed",
      );
    },
    onError: (logger, error, context, elapsedMs) => {
      logger.error(
        {
          err: error,
          method: context.req.method,
          path: context.req.path,
          elapsedMs,
        },
        "request failed",
      );
    },
  });
}

/**
 * Returns the request-scoped logger from a Hono context.
 *
 * @param context - Hono request context.
 * @returns Request-scoped Pino logger.
 */
export function getWorkerLogger<E extends { Variables: WorkerLogVariables } = { Variables: WorkerLogVariables }>(
  context: Context<E>,
): pino.Logger {
  return context.var.logger;
}
