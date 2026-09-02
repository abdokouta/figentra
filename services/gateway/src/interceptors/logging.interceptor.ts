/** @file logging.interceptor.ts @description Structured request logging. */
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Logger } from "nestjs-pino";
import { Observable, catchError, tap, throwError } from "rxjs";

/** Emits one structured completion/error record per HTTP request. */
@Injectable()
export class GatewayLoggingInterceptor implements NestInterceptor {
  /** Creates the interceptor with the shared Pino logger. */
  public constructor(private readonly logger: Logger) {}

  /** Records method, path, status and duration without sensitive headers. */
  public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ method: string; url: string }>();
    const reply = context.switchToHttp().getResponse<{ statusCode: number }>();
    const started = process.hrtime.bigint();
    return next.handle().pipe(
      tap(() => this.write(request.method, request.url, reply.statusCode, started)),
      catchError((error: unknown) => {
        this.write(request.method, request.url, reply.statusCode >= 400 ? reply.statusCode : 500, started, error);
        return throwError(() => error);
      }),
    );
  }

  /** Writes a redacted structured record. */
  private write(method: string, url: string, statusCode: number, started: bigint, error?: unknown): void {
    const durationMs = Number(process.hrtime.bigint() - started) / 1_000_000;
    const data = { method, url: url.split("?")[0], statusCode, durationMs: Math.round(durationMs * 100) / 100 };
    if (error) this.logger.error({ ...data, err: error }, "gateway.request.failed");
    else this.logger.info(data, "gateway.request.completed");
  }
}
