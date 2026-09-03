/**
 * @file coordinator.config.ts
 * @module @stackra/coordinator/config
 * @description Reference consumer template for the coordinator
 *   module's namespaced configuration factory.
 *
 * @example
 * ```typescript
 * import { ConfigModule } from '@stackra/config';
 * import { CoordinatorModule } from '@stackra/coordinator';
 * import { coordinatorConfig } from '../../config/coordinator.config';
 *
 * @Module({
 *   imports: [
 *     ConfigModule.forRoot({ isGlobal: true, load: [coordinatorConfig] }),
 *     CoordinatorModule.forRootAsync(coordinatorConfig.asProvider()),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */

import { env, registerAs } from "@stackra/config";
import { COORDINATOR_CONFIG } from "@stackra/contracts";

import type { ICoordinatorModuleOptions } from "@stackra/coordinator";

/**
 * Coordinator configuration namespace.
 */
export const coordinatorConfig = registerAs<ICoordinatorModuleOptions>(
  COORDINATOR_CONFIG,
  () => ({
    channelName: env("COORDINATOR_CHANNEL", "stackra-coordinator"),
    heartbeatMs: env.number("COORDINATOR_HEARTBEAT_MS", 1000),
    staleThresholdMs: env.number("COORDINATOR_STALE_THRESHOLD_MS", 3000),
    preferWebLocks: env.bool("COORDINATOR_PREFER_WEB_LOCKS", true),
    preferWebLocksElection: env.bool(
      "COORDINATOR_PREFER_WEB_LOCKS_ELECTION",
      true,
    ),
    preferVisibleLeader: env.bool("COORDINATOR_PREFER_VISIBLE_LEADER", true),
  }),
);
