/**
 * @file schema-update.command.ts
 * @module @stackra/nestjs-orm/commands
 * @description Sync entity metadata directly to database schema (no migration file).
 *   Delegates to MikroORM SchemaGenerator.updateSchema().
 */

import { IInjectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { ICommand, BaseCommand } from '@stackra/console';

/**
 * Update the database schema to match entity metadata (without migrations).
 *
 * Useful for development. In production, use migration:generate + migration:run.
 *
 * @example
 * ```bash
 * stackra schema:update
 * stackra schema:update --dump
 * stackra schema:update --force
 * ```
 */
@ICommand({
  name: 'schema:update',
  description: 'Sync database schema to entity metadata (dev only, no migration file)',
  options: [
    {
      name: '--dump',
      short: '-d',
      description: 'Print SQL without executing',
      type: 'boolean',
      default: false,
    },
    {
      name: '--force',
      short: '-f',
      description: 'Execute without confirmation',
      type: 'boolean',
      default: false,
    },
  ],
})
export class SchemaUpdateCommand extends BaseCommand {
  public constructor(private readonly orm: MikroORM) {
    super();
  }

  public async handle(): Promise<number> {
    const dump = this.option<boolean>('dump') ?? false;
    const force = this.option<boolean>('force') ?? false;
    const out = this.output as any;

    const generator = (this.orm as any).schema;

    if (dump) {
      const sql = await generator.getUpdateSchemaSQL();
      if (!sql) {
        this.output.info('Schema is up-to-date — no changes needed.');
        return 0;
      }
      out.separator(60, 'Schema Update SQL');
      process.stdout.write(sql);
      out.newLine();
      return 0;
    }

    if (!force) {
      this.output.warning('This applies schema changes directly (no migration file).');
      const confirmed = await this.output.confirm('Continue?', { initialValue: false });
      if (!confirmed) {
        this.output.info('Cancelled.');
        return 0;
      }
    }

    const spinner = this.output.spinner();
    spinner.start('Updating database schema...');

    try {
      await generator.updateSchema();
      spinner.stop('Schema updated', 0);
      this.output.success('Database schema is now in sync with entity metadata.');
      return 0;
    } catch (error: Error | any) {
      spinner.stop('Update failed', 1);
      this.output.error(error instanceof Error ? error.message : String(error));
      return 1;
    }
  }
}
