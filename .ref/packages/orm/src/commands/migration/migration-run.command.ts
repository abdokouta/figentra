/**
 * @file migration-run.command.ts
 * @module @stackra/nestjs-orm/commands
 * @description Run pending migrations. Delegates to MikroORM's `Migrator.up()`.
 */

import { IInjectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { ICommand, BaseCommand } from '@stackra/console';

/**
 * Run all pending database migrations.
 *
 * @example
 * ```bash
 * stackra migration:run
 * stackra migration:run --to Migration20250601
 * ```
 */
@ICommand({
  name: 'migration:run',
  description: 'Run all pending database migrations',
  options: [
    {
      name: '--to',
      short: '-t',
      description: 'Run up to a specific migration name',
      type: 'string',
    },
  ],
})
export class MigrationRunCommand extends BaseCommand {
  public constructor(private readonly orm: MikroORM) {
    super();
  }

  public async handle(): Promise<number> {
    const to = this.option<string>('to');
    const out = this.output as any;

    const spinner = this.output.spinner();
    spinner.start('Running pending migrations...');

    try {
      const migrator = (this.orm as any).migrator;
      const pending = await (migrator as any).getPendingMigrations();

      if (pending.length === 0) {
        spinner.stop('Nothing to run', 0);
        this.output.info('All migrations are already applied.');
        return 0;
      }

      const executed = await migrator.up(to ? { to } : undefined);
      spinner.stop(`${executed.length} migration(s) applied`, 0);

      out.table(
        ['Migration', 'Status'],
        executed.map((m: any) => [m.name ?? m.fileName ?? String(m), '✓ applied'])
      );

      this.output.success('Database is up-to-date.');
      return 0;
    } catch (error: Error | any) {
      spinner.stop('Migration failed', 1);
      this.output.error(error instanceof Error ? error.message : String(error));
      return 1;
    }
  }
}
