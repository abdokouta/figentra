/**
 * @file index.ts
 * @module @stackra/nestjs-orm/commands
 * @description Barrel export for all ORM CLI commands.
 *   Organized by namespace: migration, db, schema, make.
 *   Auto-discovered by @stackra/console when the ORM module is imported.
 */

// ============================================================================
// Migration Commands (migration:*)
// ============================================================================
export {
  MigrationCreateCommand,
  MigrationGenerateCommand,
  MigrationRunCommand,
  MigrationRollbackCommand,
  MigrationStatusCommand,
  MigrationFreshCommand,
} from './migration';

// ============================================================================
// Database Commands (db:*)
// ============================================================================
export { DbSeedCommand, DbWipeCommand } from './db';

// ============================================================================
// Schema Commands (schema:*)
// ============================================================================
export { SchemaUpdateCommand, SchemaDumpCommand } from './schema';

// ============================================================================
// Make Commands (make:*)
// ============================================================================
export { MakeEntityCommand, MakeSeederCommand, MakeFactoryCommand } from './make';

// ============================================================================
// CRUD Commands (entity:*) — generic, work with any registered entity
// ============================================================================
export {
  EntityCreateCommand,
  EntityListCommand,
  EntityShowCommand,
  EntityUpdateCommand,
  EntityDeleteCommand,
  EntityCountCommand,
} from './crud';
