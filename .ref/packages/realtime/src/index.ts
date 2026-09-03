export {
  RealtimeModule,
  RealtimeManager,
  RealtimeError,
  RealtimeConnectionError,
  REALTIME_MANAGER,
  REALTIME_CONFIG,
  REALTIME_EVENTS,
  defineConfig,
} from './core';
export type { IRealtimeConnector } from './core';
export { NestRealtimeModule } from './nestjs';
export { useChannel, usePresence, type UsePresenceResult, useRealtime } from './react';
