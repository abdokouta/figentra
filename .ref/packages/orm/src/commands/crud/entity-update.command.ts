/**
 * @file entity-update.command.ts
 * @module @stackra/nestjs-orm/commands/crud
 * @description Update an entity record by ID. Prompts for fields interactively
 *   or accepts a JSON patch via --data.
 */

import { IInjectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { ICommand, BaseCommand } from '@stackra/console';

/**
 * Update an entity record via CLI.
 *
 * @example
 * ```bash
 * stackra entity:update User abc123 --data '{"name":"Jane"}'
 * stackra entity:update Product xyz --interactive
 * ```
 */
@ICommand({
  name: 'entity:update',
  description: 'Update an entity record by ID',
  arguments: [
    { name: 'entity', description: 'Entity class name', required: true },
    { name: 'id', description: 'Record ID to update', required: true },
  ],
  options: [
    { name: '--data', short: '-d', description: 'JSON patch object', type: 'string' },
    {
      name: '--interactive',
      short: '-i',
      description: 'Prompt for each field',
      type: 'boolean',
      default: false,
    },
  ],
})
export class EntityUpdateCommand extends BaseCommand {
  public constructor(private readonly orm: MikroORM) {
    super();
  }

  public async handle(): Promise<number> {
    const entityName = this.argument<string>('entity');
    const id = this.argument<string>('id');
    const dataJson = this.option<string>('data');
    const interactive = this.option<boolean>('interactive') ?? false;
    const out = this.output as any;

    const metadata = (this.orm.getMetadata() as any).find(entityName);
    if (!metadata) {
      this.output.error(`Entity "${entityName}" not found.`);
      return 1;
    }

    // Find existing record
    const em = this.orm.em.fork();
    const record = await em.findOne(metadata.class, { id } as any);
    if (!record) {
      this.output.error(`${entityName} with ID "${id}" not found.`);
      return 1;
    }

    let patch: Record<string, unknown>;

    if (dataJson && !interactive) {
      try {
        patch = JSON.parse(dataJson);
      } catch {
        this.output.error('Invalid JSON in --data option.');
        return 1;
      }
    } else {
      // Interactive: show current values and prompt for new ones
      this.output.intro(`Update ${entityName} #${id}`);
      patch = await this.promptForUpdates(record, metadata);
    }

    if (Object.keys(patch).length === 0) {
      this.output.info('No changes provided. Record unchanged.');
      return 0;
    }

    const spinner = this.output.spinner();
    spinner.start(`Updating ${entityName} #${id}...`);

    try {
      em.assign(record as any, patch as any);
      await em.flush();
      spinner.stop('Updated', 0);

      out.pairs(
        Object.entries(patch).reduce(
          (acc, [k, v]) => {
            acc[k] = String(v);
            return acc;
          },
          {} as Record<string, string>
        )
      );
      this.output.success(`${entityName} #${id} updated.`);
      return 0;
    } catch (error: Error | any) {
      spinner.stop('Update failed', 1);
      this.output.error(error instanceof Error ? error.message : String(error));
      return 1;
    }
  }

  private async promptForUpdates(record: any, metadata: any): Promise<Record<string, unknown>> {
    const patch: Record<string, unknown> = {};
    const properties = metadata.properties ?? metadata.props ?? {};

    for (const [name, prop] of Object.entries(properties) as [string, any][]) {
      if (name === 'id' || name === 'createdAt' || name === 'updatedAt' || name === 'deletedAt')
        continue;
      if (prop.primary || prop.onCreate || prop.onUpdate) continue;

      const currentValue = record[name];
      const displayCurrent =
        currentValue !== null && currentValue !== undefined ? String(currentValue) : '(empty)';

      const newValue = await this.output.text(`${name} [current: ${displayCurrent}]`, {
        placeholder: 'Press Enter to keep current value',
        defaultValue: '',
      });

      if (newValue && newValue !== String(currentValue)) {
        const type = prop.type ?? 'string';
        patch[name] = type === 'number' || type === 'integer' ? Number(newValue) : newValue;
      }
    }

    return patch;
  }
}
