/**
 * @file db-wipe.command.ts
 * @module @stackra/nestjs-orm/commands
 * @description Drop all tables from the database. Delegates to MikroORM SchemaGenerator.
 */

import { IInjectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { ICommand, BaseCommand } from '@stackra/console';

/**
 * Drop all database tables (destructive).
 *
 * @example
 * ```bash
 * stackra db:wipe
 * stackra db:wipe --force
 * ```
 */
@ICommand({
  name: 'db:wipe',
  description: 'Drop all tables from the database (destructive)',
  options: [
    {
      name: '--force',
      short: '-f',
      description: 'Skip confirmation',
      type: 'boolean',
      default: false,
    },
  ],
})
export class DbWipeCommand extends BaseCommand {
  public constructor(private readonly orm: MikroORM) {
    super();
  }

  public async handle(): Promise<number> {
    const force = this.option<boolean>('force') ?? false;

    if (!force) {
      this.output.warning('This will DROP ALL TABLES. All data will be lost.');
      const confirmed = await this.output.confirm('Continue?', { initialValue: false });
      if (!confirmed) {
        this.output.info('Cancelled.');
        return 0;
      }
    }

    const spinner = this.output.spinner();
    spinner.start('Dropping all tables...');

    try {
      await (this.orm as any).schema.dropSchema();
      spinner.stop('All tables dropped', 0);
      this.output.success('Database wiped.');
      return 0;
    } catch (error: Error | any) {
      spinner.stop('Failed', 1);
      this.output.error(error instanceof Error ? error.message : String(error));
      return 1;
    }
  }
}
