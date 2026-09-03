/**
 * @file make-entity.command.ts
 * @module @stackra/nestjs-orm/commands
 * @description Scaffold a new entity class from a stub template.
 *   Uses the StubRenderer with the ORM package's `stubs/entity.ejs` template.
 */

import { IInjectable } from '@nestjs/common';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { ICommand, BaseCommand } from '@stackra/console';
import { StubRenderer } from '@stackra/console';
import { Str } from '@stackra/ts-support';

/**
 * Scaffold a new entity class.
 *
 * @example
 * ```bash
 * stackra make:entity User
 * stackra make:entity OrderItem --table order_items
 * stackra make:entity Product --timestamps --soft-deletes
 * ```
 */
@ICommand({
  name: 'make:entity',
  description: 'Scaffold a new entity class from template',
  arguments: [{ name: 'name', description: 'Entity class name (PascalCase)', required: true }],
  options: [
    { name: '--table', short: '-t', description: 'Custom table name', type: 'string' },
    {
      name: '--timestamps',
      description: 'Include @Timestamps() trait',
      type: 'boolean',
      default: true,
    },
    {
      name: '--soft-deletes',
      description: 'Include @SoftDeletes() trait',
      type: 'boolean',
      default: false,
    },
    {
      name: '--path',
      short: '-p',
      description: 'Output directory',
      type: 'string',
      default: 'src/entities',
    },
    {
      name: '--force',
      short: '-f',
      description: 'Overwrite if exists',
      type: 'boolean',
      default: false,
    },
  ],
})
export class MakeEntityCommand extends BaseCommand {
  public constructor(private readonly stubRenderer: StubRenderer) {
    super();
  }

  public async handle(): Promise<number> {
    const name = this.argument<string>('name');
    const table = this.option<string>('table') ?? Str.snake(name) + 's';
    const timestamps = this.option<boolean>('timestamps') ?? true;
    const softDeletes = this.option<boolean>('soft-deletes') ?? false;
    const outputPath = this.option<string>('path') ?? 'src/entities';
    const force = this.option<boolean>('force') ?? false;
    const out = this.output as any;

    const fileName = `${Str.kebab(name)}.entity.ts`;
    const dir = resolve(process.cwd(), outputPath);
    const filePath = join(dir, fileName);

    if (existsSync(filePath) && !force) {
      const confirmed = await this.output.confirm(`File "${fileName}" exists. Overwrite?`, {
        initialValue: false,
      });
      if (!confirmed) {
        this.output.info('Cancelled.');
        return 0;
      }
    }

    // Find ORM package root for stubs
    const ormPackageRoot = resolve(dirname(require.resolve('@stackra/nestjs-orm/package.json')));

    const { content } = this.stubRenderer.render({
      stub: 'entity',
      packageRoot: ormPackageRoot,
      variables: {
        name,
        className: name,
        tableName: table,
        fileName,
        timestamps,
        softDeletes,
      },
    });

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(filePath, content, 'utf-8');
    this.output.success(`Entity created: ${filePath}`);
    out.pairs({ Class: name, Table: table, File: fileName });

    return 0;
  }
}
