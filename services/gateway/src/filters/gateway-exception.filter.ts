/** @file gateway-exception.filter.ts @description Safe global HTTP error envelope. */
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { GatewayErrorCode } from "../errors/gateway.error";

/** Normalizes all Gateway errors without exposing upstream internals. */
@Catch()
export class GatewayExceptionFilter implements ExceptionFilter {
  /** Converts an exception into the platform error envelope. */
  public catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<FastifyRequest>();
    const reply = context.getResponse<FastifyReply>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const response = exception instanceof HttpException ? exception.getResponse() : undefined;
    const message = typeof response === "object" && response && "message" in response ? String((response as { message: unknown }).message) : "Request failed";
    const code = status === 401 ? GatewayErrorCode.AUTHENTICATION_REQUIRED : status === 403 ? GatewayErrorCode.AUTHORIZATION_DENIED : status === 400 ? GatewayErrorCode.INVALID_REQUEST : "GATEWAY_REQUEST_FAILED";
    const requestId = request.headers["x-request-id"];
    reply.status(status).send({ code, message, requestId: Array.isArray(requestId) ? requestId[0] : requestId });
  }
}
