/**
 * @file locale.decorator.ts
 * @module @stackra/i18n/nestjs/decorators
 * @description Universal locale param decorator — extracts current locale from HTTP request or GraphQL context.
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

/**
 * Extract the resolved locale from the request context.
 * Works for both HTTP (set by i18n middleware) and GraphQL (from context).
 *
 * @example
 * ```typescript
 * @Get('greeting')
 * async greet(@Locale() locale: string) { ... }
 *
 * @Query(() => String)
 * async greeting(@Locale() locale: string) { ... }
 * ```
 */
export const Locale = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const type = ctx.getType<'http' | 'graphql' | 'ws'>();

  if (type === 'graphql') {
    const gqlCtx = GqlExecutionContext.create(ctx);
    const request = gqlCtx.getContext().req;
    return request?.locale ?? request?.headers?.['x-language'] ?? 'en';
  }

  const request = ctx.switchToHttp().getRequest();
  return request.locale ?? request.headers?.['x-language'] ?? request.query?.lang ?? 'en';
});
