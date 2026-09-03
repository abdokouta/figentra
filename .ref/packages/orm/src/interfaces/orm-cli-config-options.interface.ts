/**
 * @file orm-cli-config-options.interface.ts
 * @module @stackra/orm/src/interfaces
 * @description OrmCliConfigOptions interface.
 */

/**
 * Options for the CLI config factory.
 */
export interface OrmCliConfigOptions {
  /** The NestJS AppModule class (root module with OrmModule.forRoot()). */
  appModule: any;

  /** Optional: path for migration files. Default: './src/database/migrations' */
  migrationsPath?: string;

  /** Optional: path for seeder files. Default: './src/database/seeders' */
  seedersPath?: string;
}
