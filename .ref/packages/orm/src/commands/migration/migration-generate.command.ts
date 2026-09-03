/**
 * @file migration-generate.command.ts
 * @module @stackra/nestjs-orm/commands
 * @description Generate a migration by diffing entity metadata against the current database schema.
 *   Delegates to MikroORM's `Migrator.createMigration()` (non-blank).
 */

import { IInjectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { ICommand, BaseCommand } from '@stackra/console';

/**
 * Generate a migration from entity changes.
 *
 * Delegates to MikroORM's `Migrator.createMigration()` which diffs the
 * current entity metadata against the database schema and produces SQL.
 *
 * @example
 * ```bash
 * stackra migration:generate
 * stackra migration:generate --dump
 * stackra migration:generate --initial
 * ```
 */
@ICommand({
  name: 'migration:generate',
  description: 'Generate a migration from entity metadata changes',
  options: [
    {
      name: '--initial',
      short: '-i',
      description: 'Generate initial migration (all entities)',
      type: 'boolean',
      default: false,
    },
    {
      name: '--dump',
      short: '-d',
      description: 'Print SQL to stdout only (no file)',
      type: 'boolean',
      default: false,
    },
    { name: '--name', short: '-n', description: 'Migration name suffix', type: 'string' },
  ],
})
export class MigrationGenerateCommand extends BaseCommand {
  public constructor(private readonly orm: MikroORM) {
    super();
  }

  public async handle(): Promise<number> {
    const initial = this.option<boolean>('initial') ?? false;
    const dump = this.option<boolean>('dump') ?? false;
    const name = this.option<string>('name');
    const out = this.output as any;

    const spinner = this.output.spinner();
    spinner.start('Comparing entities to database schema...');

    try {
      const migrator = (this.orm as any).migrator;

      if (initial) {
        const migration = await migrator.createInitialMigration(undefined);
        spinner.stop('Initial migration created', 0);
        this.output.success(`File: ${migration.fileName}`);
        return 0;
      }

      const migration = await migrator.createMigration(undefined, false, undefined, name);

      if (!migration.diff || migration.diff.up.length === 0) {
        spinner.stop('No schema changes detected', 0);
        this.output.info('Entity metadata matches the database schema — nothing to migrate.');
        return 0;
      }

      spinner.stop('Migration generated', 0);

      if (dump) {
        out.separator(60, 'Generated SQL (up)');
        for (const sql of migration.diff.up) {
          process.stdout.write(`  ${sql}\n`);
        }
        out.newLine();
      }

      this.output.success(`File: ${migration.fileName}`);
      out.pairs({
        'SQL statements': String(migration.diff.up.length),
        Class: migration.className,
      });

      return 0;
    } catch (error: Error | any) {
      spinner.stop('Generation failed', 1);
      this.output.error(error instanceof Error ? error.message : String(error));
      return 1;
    }
  }
}
