/**
 * @file migration-rollback.command.ts
 * @module @stackra/nestjs-orm/commands
 * @description Rollback migrations. Delegates to MikroORM's `Migrator.down()`.
 */

import { IInjectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { ICommand, BaseCommand } from '@stackra/console';

/**
 * Rollback the last migration or rollback to a specific point.
 *
 * @example
 * ```bash
 * stackra migration:rollback
 * stackra migration:rollback --all
 * stackra migration:rollback --to Migration20250101
 * ```
 */
@ICommand({
  name: 'migration:rollback',
  description: 'Rollback the last migration batch',
  options: [
    { name: '--to', short: '-t', description: 'Rollback to a specific migration', type: 'string' },
    {
      name: '--all',
      short: '-a',
      description: 'Rollback all migrations',
      type: 'boolean',
      default: false,
    },
  ],
})
export class MigrationRollbackCommand extends BaseCommand {
  public constructor(private readonly orm: MikroORM) {
    super();
  }

  public async handle(): Promise<number> {
    const to = this.option<string>('to');
    const all = this.option<boolean>('all') ?? false;
    const out = this.output as any;

    // Confirm destructive action
    const confirmed = await this.output.confirm(
      all ? 'Rollback ALL migrations? This is destructive.' : 'Rollback the last migration?',
      { initialValue: false }
    );
    if (!confirmed) {
      this.output.info('Rollback cancelled.');
      return 0;
    }

    const spinner = this.output.spinner();
    spinner.start('Rolling back...');

    try {
      const migrator = (this.orm as any).migrator;
      const opts = all ? { to: 0 as any } : to ? { to } : undefined;
      const rolled = await migrator.down(opts);

      if (rolled.length === 0) {
        spinner.stop('Nothing to rollback', 0);
        this.output.info('No migrations were rolled back.');
        return 0;
      }

      spinner.stop(`${rolled.length} migration(s) rolled back`, 0);
      out.table(
        ['Migration', 'Status'],
        rolled.map((m: any) => [m.name ?? m.fileName ?? String(m), '↩ reverted'])
      );

      this.output.success('Rollback complete.');
      return 0;
    } catch (error: Error | any) {
      spinner.stop('Rollback failed', 1);
      this.output.error(error instanceof Error ? error.message : String(error));
      return 1;
    }
  }
}
