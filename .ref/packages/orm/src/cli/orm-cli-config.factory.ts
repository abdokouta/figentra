/**
 * @file orm-cli-config.factory.ts
 * @module @stackra/nestjs-orm/cli
 * @description Factory that builds a MikroORM config suitable for CLI usage
 *   (migrations, schema generation) by resolving entities from the EntityRegistry
 *   via NestJS application context.
 *
 *   This solves the timing problem: MikroORM CLI needs all entities at config time,
 *   but entities are scattered across feature modules registered via forFeature().
 *
 *   Usage: Applications create a `mikro-orm.config.ts` that uses this factory
 *   to build the config by bootstrapping a headless NestJS app context.
 */

import type { MikroORM } from '@mikro-orm/core';

/**
 * Bootstrap a headless NestJS application context and extract the MikroORM config.
 *
 * This is the recommended way to generate `mikro-orm.config.ts` for CLI tools.
 * It bootstraps the full NestJS module tree (without HTTP/WS listeners), which
 * means all forRoot() and forFeature() calls execute, all entities are registered,
 * and the resulting MikroORM instance has the complete picture.
 *
 * @param options - CLI config options including the AppModule
 * @returns The MikroORM instance (for CLI commands) or its config
 *
 * @example
 * ```typescript
 * // mikro-orm.config.ts (project root)
 * import { defineCliConfig } from '@stackra/nestjs-orm/cli';
 * import { AppModule } from './src/app.module';
 *
 * export default defineCliConfig({
 *   appModule: AppModule,
 *   migrationsPath: './src/database/migrations',
 * });
 * ```
 */
export async function defineCliConfig(options: OrmCliConfigOptions): Promise<MikroORM> {
  // Lazy import to avoid pulling NestJS into the main bundle
  const { NestFactory } = await import('@nestjs/core');
  const { MikroORM } = await import('@mikro-orm/core');

  // Bootstrap headless NestJS app (no HTTP listener)
  const app = await NestFactory.createApplicationContext(options.appModule, {
    logger: ['error'],
  });

  // Resolve the MikroORM instance — it has the complete entity list
  const orm = app.get(MikroORM);

  // Override migration/seeder paths if provided
  if (options.migrationsPath) {
    (orm.config as any).set('migrations', {
      ...(orm.config as any).get('migrations'),
      path: options.migrationsPath,
    });
  }
  if (options.seedersPath) {
    (orm.config as any).set('seeder', {
      ...(orm.config as any).get('seeder'),
      path: options.seedersPath,
    });
  }

  // Store app reference for cleanup
  (orm as any).__nestApp = app;

  return orm as any;
}

/**
 * Close the NestJS application context tied to a CLI ORM instance.
 * Call this after CLI operations complete.
 *
 * @param orm - The MikroORM instance returned by buildOrmCliConfig
 */
export async function closeOrmCliContext(orm: MikroORM): Promise<void> {
  const app = (orm as any).__nestApp;
  if (app) {
    await app.close();
  }
}
