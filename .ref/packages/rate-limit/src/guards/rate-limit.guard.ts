/**
 * @file rate-limit.guard.ts
 * @module @stackra/nestjs-rate-limit/guards
 * @description NestJS route guard that enforces rate limiting based on
 *   `@RateLimit()` decorator metadata. Adds `X-RateLimit-*` response headers
 *   and throws 429 Too Many Requests when the bucket is exhausted.
 */

import {
  IInjectable,
  ICanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimiterManager } from '../services/rate-limiter-manager.service';
import { RATE_LIMIT_KEY } from '../decorators/rate-limit.decorator';
import { RATE_LIMIT_CONFIG } from '../constants';
import type { IRateLimitOptions } from '../decorators/rate-limit.decorator';
import type { IRateLimitConfig } from '../interfaces';

// ============================================================================
// Guard
// ============================================================================

/**
 * RateLimitGuard — enforces rate limiting on routes decorated with `@RateLimit()`.
 *
 * Resolution order for metadata:
 * 1. Method-level `@RateLimit()` (highest priority)
 * 2. Class-level `@RateLimit()` (fallback)
 * 3. No decorator = no rate limiting (guard passes)
 *
 * When rate limit is exceeded, throws HTTP 429 with `Retry-After` header.
 * When within limits, adds `X-RateLimit-Limit`, `X-RateLimit-Remaining`,
 * and `X-RateLimit-Reset` headers to the response.
 */
@IInjectable()
export class RateLimitGuard implements ICanActivate {
  /**
   * @param reflector - NestJS reflector for reading decorator metadata
   * @param rateLimiter - Rate limiter manager for token-bucket operations
   * @param config - Resolved rate limit module configuration
   */
  public constructor(
    private readonly reflector: Reflector,
    private readonly rateLimiter: RateLimiterManager,
    @Inject(RATE_LIMIT_CONFIG)
    private readonly config: IRateLimitConfig
  ) {}

  /**
   * Evaluate rate limit for the current request.
   * Supports both HTTP REST and GraphQL execution contexts.
   *
   * @param context - NestJS execution context
   * @returns true if request is allowed, throws 429 otherwise
   */
  public async canActivate(context: ExecutionContext): Promise<boolean> {
    let options = this.resolveOptions(context);

    // No @RateLimit decorator — check if global guard is configured
    if (!options) {
      const globalPolicy = this.config.globalGuard;
      if (!globalPolicy || typeof globalPolicy !== 'string') return true;
      options = { policy: globalPolicy };
    }

    // Explicit skip
    if (options.skip) return true;

    // Resolve limit, window, and key
    const { limit, window, key } = this.resolvePolicy(options);
    const request = this.extractRequest(context);
    const resolvedKey = this.interpolateKey(key, request);

    // Reserve a token with full info
    const result = await this.rateLimiter.reserveWithInfo(resolvedKey, limit, window);

    // Set response headers (HTTP only — GraphQL uses extensions)
    const contextType = context.getType<'http' | 'graphql' | 'ws'>();
    if (this.config.includeHeaders !== false && contextType === 'http') {
      const response = context.switchToHttp().getResponse();
      const headers = this.config.headers ?? {};

      response.setHeader(headers.limit ?? 'X-RateLimit-Limit', result.limit);
      response.setHeader(headers.remaining ?? 'X-RateLimit-Remaining', result.remaining);
      response.setHeader(headers.reset ?? 'X-RateLimit-Reset', result.resetAt);

      if (!result.allowed) {
        response.setHeader(headers.retryAfter ?? 'Retry-After', result.retryAfter);
      }
    }

    // Reject if bucket exhausted
    if (!result.allowed) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Rate limit exceeded. Retry in ${result.retryAfter} seconds.`,
          retryAfter: result.retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    return true;
  }

  // ==========================================================================
  // Private Helpers
  // ==========================================================================

  /**
   * Extract the request object from either HTTP or GraphQL context.
   *
   * @param context - NestJS execution context
   * @returns The request object (or equivalent for GraphQL)
   */
  private extractRequest(context: ExecutionContext): any {
    const contextType = context.getType<'http' | 'graphql' | 'ws'>();

    if (contextType === 'graphql') {
      try {
        // Dynamic import to avoid hard dependency on @nestjs/graphql
        const { GqlExecutionContext } = require('@nestjs/graphql');
        const gqlCtx = GqlExecutionContext.create(context);
        return gqlCtx.getContext().req ?? {};
      } catch {
        // @nestjs/graphql not installed — fall through to HTTP
        return context.switchToHttp().getRequest();
      }
    }

    return context.switchToHttp().getRequest();
  }

  /**
   * Resolve rate limit options from decorator metadata.
   * Method-level takes priority over class-level.
   *
   * @param context - NestJS execution context
   * @returns Rate limit options or undefined if no decorator present
   */
  private resolveOptions(context: ExecutionContext): IRateLimitOptions | undefined {
    return this.reflector.getAllAndOverride<IRateLimitOptions | undefined>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  }

  /**
   * Resolve the effective limit, window, and key from options.
   * If a policy name is provided, looks it up from config.
   *
   * @param options - Rate limit options from decorator
   * @returns Resolved policy with limit, window, and key
   */
  private resolvePolicy(options: IRateLimitOptions): {
    limit: number;
    window: number;
    key: string;
  } {
    if (options.policy) {
      const policy = this.rateLimiter.getPolicy(options.policy);
      if (!policy) {
        throw new Error(`Rate limit policy "${options.policy}" is not configured.`);
      }
      return policy;
    }

    return {
      limit: options.limit ?? 60,
      window: options.window ?? 60,
      key: options.key ?? 'ip:{ip}',
    };
  }

  /**
   * Interpolate placeholders in the key template from the request.
   *
   * Supported placeholders:
   * - {userId} — authenticated user ID (or 'guest')
   * - {ownerId} — tenant ID from request (or 'central')
   * - {ip} — client IP address
   * - {method} — HTTP method + path
   *
   * @param template - Key template with {placeholder} syntax
   * @param request - HTTP request object
   * @returns Resolved key string with placeholders replaced
   */
  private interpolateKey(template: string, request: any): string {
    const userId = request.user?.id ?? request.user?.sub ?? 'guest';
    const ownerId = scopeStore?.get()?.ownerId ?? request.headers?.['x-tenant-id'] ?? 'central';
    const ip = request.ip ?? request.connection?.remoteAddress ?? 'unknown';
    const method = `${request.method}:${request.path}`;

    return template
      .replace(/\{userId\}/g, String(userId))
      .replace(/\{ownerId\}/g, String(ownerId))
      .replace(/\{ip\}/g, String(ip))
      .replace(/\{method\}/g, method);
  }
}
