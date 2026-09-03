/**
 * @file migration-create.command.ts
 * @module @stackra/nestjs-orm/commands
 * @description Create a new blank migration file using MikroORM's Migrator.
 *   Delegates entirely to `orm.getMigrator().createMigration()`.
 */

import { IInjectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { ICommand, BaseCommand } from '@stackra/console';

/**
 * Create a new blank database migration.
 *
 * Delegates to MikroORM's `Migrator.createMigration()` with `blank: true`.
 *
 * @example
 * ```bash
 * stackra migration:create
 * ```
 */
@ICommand({
  name: 'migration:create',
  description: 'Create a new blank migration file',
  options: [{ name: '--name', short: '-n', description: 'Migration name suffix', type: 'string' }],
})
export class MigrationCreateCommand extends BaseCommand {
  public constructor(private readonly orm: MikroORM) {
    super();
  }

  public async handle(): Promise<number> {
    const name = this.option<string>('name');
    const out = this.output as any;

    const spinner = this.output.spinner();
    spinner.start('Creating blank migration...');

    try {
      const migrator = (this.orm as any).migrator;
      const migration = await migrator.createMigration(undefined, true, undefined, name);

      spinner.stop('Migration created', 0);
      this.output.success(`File: ${migration.fileName}`);
      out.step(`Class: ${migration.className}`);

      return 0;
    } catch (error: Error | any) {
      spinner.stop('Failed', 1);
      this.output.error(error instanceof Error ? error.message : String(error));
      return 1;
    }
  }
}
