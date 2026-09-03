/**
 * @file index.ts
 * @module @stackra/nestjs-orm/cli
 * @description Barrel export for CLI utilities.
 */

export { defineCliConfig, closeOrmCliContext } from './orm-cli-config.factory';
export type { OrmCliConfigOptions } from './orm-cli-config.factory';
