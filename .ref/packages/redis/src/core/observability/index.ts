/**
 * @file index.ts
 * @module @stackra/ts-redis/observability
 * @description Barrel export for Redis observability components.
 */

export { CommandInterceptor } from './command-interceptor.service';
export type { ICommandExecutedEvent } from './command-executed.event';
export type { ICommandFailedEvent } from './command-failed.event';
