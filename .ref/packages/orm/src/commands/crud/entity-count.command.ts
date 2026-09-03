/**
 * @file entity-count.command.ts
 * @module @stackra/nestjs-orm/commands/crud
 * @description Count records for any entity with optional filter.
 */

import { IInjectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { ICommand, BaseCommand } from '@stackra/console';

/**
 * Count entity records.
 *
 * @example
 * ```bash
 * stackra entity:count User
 * stackra entity:count Order --where '{"status":"active"}'
 * ```
 */
@ICommand({
  name: 'entity:count',
  description: 'Count records for any entity',
  arguments: [{ name: 'entity', description: 'Entity class name', required: true }],
  options: [{ name: '--where', short: '-w', description: 'JSON filter criteria', type: 'string' }],
})
export class EntityCountCommand extends BaseCommand {
  public constructor(private readonly orm: MikroORM) {
    super();
  }

  public async handle(): Promise<number> {
    const entityName = this.argument<string>('entity');
    const whereJson = this.option<string>('where');
    const out = this.output as any;

    const metadata = (this.orm.getMetadata() as any).find(entityName);
    if (!metadata) {
      this.output.error(`Entity "${entityName}" not found.`);
      return 1;
    }

    const spinner = this.output.spinner();
    spinner.start(`Counting ${entityName} records...`);

    try {
      const em = this.orm.em.fork();
      const where = whereJson ? JSON.parse(whereJson) : {};
      const count = await em.count(metadata.class, where as any);

      spinner.stop('Done', 0);

      out.pairs({
        Entity: entityName,
        Filter: whereJson ?? '(none)',
        Count: String(count),
      });

      return 0;
    } catch (error: Error | any) {
      spinner.stop('Failed', 1);
      this.output.error(error instanceof Error ? error.message : String(error));
      return 1;
    }
  }
}
