/**
 * @file nest-config-module-options.interface.ts
 * @module @stackra/config/src/interfaces
 * @description INestConfigModuleOptions interface.
 */

/**
 * Extended options for the NestJS config adapter.
 */
export interface INestConfigModuleOptions extends IConfigModuleOptions {
  /** Enable expandable variables ${VAR} resolution in all config values. */
  expandVariables?: boolean;
  /** Redis pub/sub channel name for cluster-wide config hot reload. */
  pubsubChannel?: string;
}
