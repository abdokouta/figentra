/**
 * @file entity-list.command.ts
 * @module @stackra/nestjs-orm/commands/crud
 * @description List entity records with filtering, sorting, and pagination.
 */

import { IInjectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { ICommand, BaseCommand } from '@stackra/console';

/**
 * List records from any entity with pagination and filtering.
 *
 * @example
 * ```bash
 * stackra entity:list User
 * stackra entity:list Product --limit 20 --offset 0
 * stackra entity:list Order --where '{"status":"active"}'
 * stackra entity:list User --fields name,email,status
 * ```
 */
@ICommand({
  name: 'entity:list',
  description: 'List entity records with pagination',
  arguments: [{ name: 'entity', description: 'Entity class name', required: true }],
  options: [
    {
      name: '--limit',
      short: '-l',
      description: 'Max records to display',
      type: 'number',
      default: 25,
    },
    { name: '--offset', short: '-o', description: 'Skip N records', type: 'number', default: 0 },
    { name: '--where', short: '-w', description: 'JSON filter criteria', type: 'string' },
    {
      name: '--fields',
      short: '-f',
      description: 'Comma-separated field names to display',
      type: 'string',
    },
    { name: '--order', description: 'Sort field (prefix with - for DESC)', type: 'string' },
  ],
})
export class EntityListCommand extends BaseCommand {
  public constructor(private readonly orm: MikroORM) {
    super();
  }

  public async handle(): Promise<number> {
    const entityName = this.argument<string>('entity');
    const limit = this.option<number>('limit') ?? 25;
    const offset = this.option<number>('offset') ?? 0;
    const whereJson = this.option<string>('where');
    const fieldsStr = this.option<string>('fields');
    const orderStr = this.option<string>('order');
    const out = this.output as any;

    const metadata = (this.orm.getMetadata() as any).find(entityName);
    if (!metadata) {
      this.output.error(`Entity "${entityName}" not found.`);
      return 1;
    }

    const spinner = this.output.spinner();
    spinner.start(`Querying ${entityName}...`);

    try {
      const em = this.orm.em.fork();
      const where = whereJson ? JSON.parse(whereJson) : {};
      const orderBy = orderStr
        ? {
            [orderStr.startsWith('-') ? orderStr.slice(1) : orderStr]: orderStr.startsWith('-')
              ? 'DESC'
              : 'ASC',
          }
        : { id: 'ASC' };

      const [records, total] = await em.findAndCount(metadata.class, where as any, {
        limit,
        offset,
        orderBy: orderBy as any,
      });

      spinner.stop(`Found ${total} record(s)`, 0);

      if (records.length === 0) {
        this.output.info(`No ${entityName} records found.`);
        return 0;
      }

      // Determine columns
      const allFields = Object.keys(metadata.properties ?? metadata.props ?? {});
      const fields = fieldsStr ? fieldsStr.split(',').map((f) => f.trim()) : allFields.slice(0, 6);

      // Build table
      const rows = records.map((r: any) =>
        fields.map((f) => {
          const val = r[f];
          if (val === null || val === undefined) return '-';
          if (val instanceof Date) return val.toISOString().slice(0, 19);
          return String(val).slice(0, 40);
        })
      );

      out.table(fields, rows);

      out.pairs({
        Showing: `${records.length} of ${total}`,
        Offset: String(offset),
        Limit: String(limit),
      });

      return 0;
    } catch (error: Error | any) {
      spinner.stop('Query failed', 1);
      this.output.error(error instanceof Error ? error.message : String(error));
      return 1;
    }
  }
}
