/**
 * @file nest-realtime.module.ts
 * @module @stackra/realtime/nestjs
 * @description NestJS realtime module — imports core and marks global.
 *   For the server-side WebSocket gateway, apps extend `RealtimeGateway`
 *   (which uses @nestjs/websockets and Socket.IO).
 */

import { Module, type IDynamicModule } from '@nestjs/common';
import { RealtimeModule } from '../core/realtime.module';
import type { IRealtimeModuleOptions } from '../core/interfaces';

/**
 * NestJS realtime module.
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     NestRealtimeModule.forRoot({
 *       default: 'main',
 *       connections: { main: { driver: 'socketio', url: 'wss://api.example.com' } },
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class NestRealtimeModule {
  public static forRoot(config: IRealtimeModuleOptions): IDynamicModule {
    return {
      module: NestRealtimeModule,
      global: true,
      imports: [RealtimeModule.forRoot(config)],
    };
  }
}
