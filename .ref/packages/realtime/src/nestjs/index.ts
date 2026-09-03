/**
 * @file index.ts
 * @module @stackra/realtime/nestjs
 * @description NestJS subpath for the realtime module.
 *   Provides NestRealtimeModule (gateway base class for WebSocket auth/presence).
 */

// ════════════════════════════════════════════════════════════════════════════════
// NestJS Module
// ════════════════════════════════════════════════════════════════════════════════
export { NestRealtimeModule } from './nest-realtime.module';

// ════════════════════════════════════════════════════════════════════════════════
// Re-export core
// ════════════════════════════════════════════════════════════════════════════════
export {
  RealtimeModule,
  RealtimeManager,
  RealtimeError,
  RealtimeConnectionError,
  REALTIME_MANAGER,
  REALTIME_CONFIG,
  REALTIME_EVENTS,
  defineConfig,
} from '../core';
export type { IRealtimeConnector, IRealtimeModuleOptions, RealtimeConnectionConfig } from '../core';
