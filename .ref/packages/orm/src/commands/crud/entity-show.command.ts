/**
 * @file entity-show.command.ts
 * @module @stackra/nestjs-orm/commands/crud
 * @description Show a single entity record by ID with full field details.
 */

import { IInjectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { ICommand, BaseCommand } from '@stackra/console';

/**
 * Show a single entity record with all fields.
 *
 * @example
 * ```bash
 * stackra entity:show User 550e8400-e29b-41d4-a716-446655440000
 * stackra entity:show Product abc123 --json
 * ```
 */
@ICommand({
  name: 'entity:show',
  description: 'Show a single entity record by ID',
  arguments: [
    { name: 'entity', description: 'Entity class name', required: true },
    { name: 'id', description: 'Record ID (UUID or primary key)', required: true },
  ],
  options: [
    {
      name: '--json',
      short: '-j',
      description: 'Output as raw JSON',
      type: 'boolean',
      default: false,
    },
  ],
})
export class EntityShowCommand extends BaseCommand {
  public constructor(private readonly orm: MikroORM) {
    super();
  }

  public async handle(): Promise<number> {
    const entityName = this.argument<string>('entity');
    const id = this.argument<string>('id');
    const json = this.option<boolean>('json') ?? false;
    const out = this.output as any;

    const metadata = (this.orm.getMetadata() as any).find(entityName);
    if (!metadata) {
      this.output.error(`Entity "${entityName}" not found.`);
      return 1;
    }

    const spinner = this.output.spinner();
    spinner.start(`Fetching ${entityName} #${id}...`);

    try {
      const em = this.orm.em.fork();
      const record = await em.findOne(metadata.class, { id } as any);

      if (!record) {
        spinner.stop('Not found', 1);
        this.output.error(`${entityName} with ID "${id}" not found.`);
        return 1;
      }

      spinner.stop('Found', 0);

      if (json) {
        out.json(record);
        return 0;
      }

      // Display as key-value pairs
      out.separator(60, `${entityName} #${id}`);

      const fields = Object.keys(metadata.properties ?? metadata.props ?? {});
      const pairs: Record<string, string> = {};
      for (const field of fields) {
        const val = (record as any)[field];
        if (val === undefined) continue;
        if (val === null) {
          pairs[field] = '(null)';
          continue;
        }
        if (val instanceof Date) {
          pairs[field] = val.toISOString();
          continue;
        }
        pairs[field] = String(val).slice(0, 80);
      }
      out.pairs(pairs);

      return 0;
    } catch (error: Error | any) {
      spinner.stop('Failed', 1);
      this.output.error(error instanceof Error ? error.message : String(error));
      return 1;
    }
  }
}
