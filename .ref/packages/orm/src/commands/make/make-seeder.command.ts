/**
 * @file make-seeder.command.ts
 * @module @stackra/nestjs-orm/commands
 * @description Scaffold a new seeder class from a stub template.
 */

import { IInjectable } from '@nestjs/common';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { ICommand, BaseCommand } from '@stackra/console';
import { StubRenderer } from '@stackra/console';
import { Str } from '@stackra/ts-support';

/**
 * Scaffold a new database seeder class.
 *
 * @example
 * ```bash
 * stackra make:seeder UserSeeder
 * stackra make:seeder ProductSeeder --path src/seeders
 * ```
 */
@ICommand({
  name: 'make:seeder',
  description: 'Scaffold a new database seeder class',
  arguments: [
    {
      name: 'name',
      description: 'Seeder class name (PascalCase, e.g., UserSeeder)',
      required: true,
    },
  ],
  options: [
    {
      name: '--path',
      short: '-p',
      description: 'Output directory',
      type: 'string',
      default: 'src/seeders',
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
export class MakeSeederCommand extends BaseCommand {
  public constructor(private readonly stubRenderer: StubRenderer) {
    super();
  }

  public async handle(): Promise<number> {
    const name = this.argument<string>('name');
    const outputPath = this.option<string>('path') ?? 'src/seeders';
    const force = this.option<boolean>('force') ?? false;

    const fileName = `${Str.kebab(name)}.seeder.ts`;
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

    const ormPackageRoot = resolve(dirname(require.resolve('@stackra/nestjs-orm/package.json')));

    const { content } = this.stubRenderer.render({
      stub: 'seeder',
      packageRoot: ormPackageRoot,
      variables: { name, className: name, fileName },
    });

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(filePath, content, 'utf-8');
    this.output.success(`Seeder created: ${filePath}`);

    return 0;
  }
}
