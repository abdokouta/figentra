/**
 * @file migration-fresh.command.ts
 * @module @stackra/nestjs-orm/commands
 * @description Drop all tables and re-run all migrations.
 *   Delegates to MikroORM SchemaGenerator + Migrator.
 */

import { IInjectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { ICommand, BaseCommand } from '@stackra/console';

/**
 * Drop all tables and re-run all migrations from scratch.
 *
 * @example
 * ```bash
 * stackra migration:fresh
 * stackra migration:fresh --seed
 * stackra migration:fresh --force
 * ```
 */
@ICommand({
  name: 'migration:fresh',
  description: 'Drop all tables and re-run all migrations (destructive)',
  options: [
    {
      name: '--seed',
      short: '-s',
      description: 'Run seeders after migration',
      type: 'boolean',
      default: false,
    },
    {
      name: '--force',
      short: '-f',
      description: 'Skip confirmation prompt',
      type: 'boolean',
      default: false,
    },
  ],
})
export class MigrationFreshCommand extends BaseCommand {
  public constructor(private readonly orm: MikroORM) {
    super();
  }

  public async handle(): Promise<number> {
    const seed = this.option<boolean>('seed') ?? false;
    const force = this.option<boolean>('force') ?? false;
    const out = this.output as any;

    if (!force) {
      this.output.warning('This will DROP ALL TABLES and re-run all migrations.');
      const confirmed = await this.output.confirm('Are you sure?', { initialValue: false });
      if (!confirmed) {
        this.output.info('Cancelled.');
        return 0;
      }
    }

    try {
      const s1 = this.output.spinner();
      s1.start('Dropping schema...');
      await (this.orm as any).schema.dropSchema();
      s1.stop('Schema dropped', 0);

      const s2 = this.output.spinner();
      s2.start('Running all migrations...');
      const executed = await (this.orm as any).migrator.up();
      s2.stop(`${executed.length} migration(s) applied`, 0);

      if (seed) {
        const s3 = this.output.spinner();
        s3.start('Running seeders...');
        await (this.orm as any).seeder.seedString('DatabaseSeeder');
        s3.stop('Seeding complete', 0);
      }

      this.output.success('Database refreshed.');
      out.pairs({ Migrations: String(executed.length), Seeded: seed ? 'yes' : 'no' });
      return 0;
    } catch (error: Error | any) {
      this.output.error(error instanceof Error ? error.message : String(error));
      return 1;
    }
  }
}
