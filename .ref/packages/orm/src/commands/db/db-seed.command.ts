/**
 * @file db-seed.command.ts
 * @module @stackra/nestjs-orm/commands
 * @description Run database seeders. Delegates to MikroORM Seeder.
 */

import { IInjectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { ICommand, BaseCommand } from '@stackra/console';

/**
 * Run database seeders to populate data.
 *
 * @example
 * ```bash
 * stackra db:seed
 * stackra db:seed --class UserSeeder
 * ```
 */
@ICommand({
  name: 'db:seed',
  description: 'Run database seeders',
  options: [
    { name: '--class', short: '-c', description: 'Specific seeder class to run', type: 'string' },
  ],
})
export class DbSeedCommand extends BaseCommand {
  public constructor(private readonly orm: MikroORM) {
    super();
  }

  public async handle(): Promise<number> {
    const seederClass = this.option<string>('class') ?? 'DatabaseSeeder';

    const spinner = this.output.spinner();
    spinner.start(`Running ${seederClass}...`);

    try {
      await (this.orm as any).seeder.seedString(seederClass);
      spinner.stop(`${seederClass} complete`, 0);
      this.output.success('Database seeding finished.');
      return 0;
    } catch (error: Error | any) {
      spinner.stop('Seeding failed', 1);
      this.output.error(error instanceof Error ? error.message : String(error));
      return 1;
    }
  }
}
