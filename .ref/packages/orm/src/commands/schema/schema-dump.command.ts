/**
 * @file schema-dump.command.ts
 * @module @stackra/nestjs-orm/commands
 * @description Dump the full SQL schema from entity metadata.
 *   Delegates to MikroORM SchemaGenerator.getCreateSchemaSQL().
 */

import { IInjectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { ICommand, BaseCommand } from '@stackra/console';

/**
 * Dump the full CREATE TABLE SQL from entity metadata.
 *
 * @example
 * ```bash
 * stackra schema:dump
 * stackra schema:dump --save schema.sql
 * ```
 */
@ICommand({
  name: 'schema:dump',
  description: 'Dump the full SQL schema from entity metadata',
  options: [
    { name: '--save', short: '-s', description: 'Save to file instead of stdout', type: 'string' },
  ],
})
export class SchemaDumpCommand extends BaseCommand {
  public constructor(private readonly orm: MikroORM) {
    super();
  }

  public async handle(): Promise<number> {
    const savePath = this.option<string>('save');

    try {
      const sql = await (this.orm as any).schema.getCreateSchemaSQL();

      if (savePath) {
        const { writeFileSync } = await import('fs');
        const { resolve } = await import('path');
        writeFileSync(resolve(process.cwd(), savePath), sql, 'utf-8');
        this.output.success(`Schema dumped to: ${savePath}`);
      } else {
        process.stdout.write(sql);
      }

      return 0;
    } catch (error: Error | any) {
      this.output.error(error instanceof Error ? error.message : String(error));
      return 1;
    }
  }
}
