/**
 * @file make-factory.command.ts
 * @module @stackra/nestjs-orm/commands
 * @description Scaffold a new entity factory class from a stub template.
 */

import { IInjectable } from '@nestjs/common';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { ICommand, BaseCommand, StubRenderer } from '@stackra/console';
import { Str } from '@stackra/ts-support';

/**
 * Scaffold a new entity factory class.
 *
 * @example
 * ```bash
 * stackra make:factory User
 * stackra make:factory OrderItem --entity OrderItem
 * ```
 */
@ICommand({
  name: 'make:factory',
  description: 'Scaffold a new entity factory class',
  arguments: [
    { name: 'name', description: 'Factory class name (e.g., User → UserFactory)', required: true },
  ],
  options: [
    {
      name: '--entity',
      short: '-e',
      description: 'Entity class name (defaults to name)',
      type: 'string',
    },
    {
      name: '--path',
      short: '-p',
      description: 'Output directory',
      type: 'string',
      default: 'src/factories',
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
export class MakeFactoryCommand extends BaseCommand {
  public constructor(private readonly stubRenderer: StubRenderer) {
    super();
  }

  public async handle(): Promise<number> {
    const name = this.argument<string>('name');
    const entityName = this.option<string>('entity') ?? name;
    const outputPath = this.option<string>('path') ?? 'src/factories';
    const force = this.option<boolean>('force') ?? false;

    const className = name.endsWith('Factory') ? name : `${name}Factory`;
    const fileName = `${Str.kebab(className)}.ts`;
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
      stub: 'factory',
      packageRoot: ormPackageRoot,
      variables: {
        name,
        className,
        entityName,
        fileName,
        entityImportPath: `@/entities/${Str.kebab(entityName)}.entity`,
        moduleName: '@stackra/nestjs-orm',
      },
    });

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(filePath, content, 'utf-8');
    this.output.success(`Factory created: ${filePath}`);
    (this.output as any).pairs({ Class: className, Entity: entityName, File: fileName });

    return 0;
  }
}
