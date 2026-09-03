/**
 * @file entity-create.command.ts
 * @module @stackra/nestjs-orm/commands/crud
 * @description Create a new entity record interactively.
 *   Reads entity schema from the ORM metadata and prompts for each required
 *   field if not provided via --data JSON. Supports interactive and non-interactive modes.
 */

import { IInjectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { ICommand, BaseCommand } from '@stackra/console';

/**
 * Create a new entity record via CLI.
 *
 * If no --data is provided, prompts interactively for each required field.
 * Reads the entity's property metadata to determine field types and validation.
 *
 * @example
 * ```bash
 * stackra entity:create User
 * stackra entity:create User --data '{"name":"John","email":"john@test.com"}'
 * stackra entity:create Product --interactive
 * ```
 */
@ICommand({
  name: 'entity:create',
  description: 'Create a new entity record (interactive or via JSON)',
  arguments: [
    {
      name: 'entity',
      description: 'Entity class name (e.g., User, Product, Order)',
      required: true,
    },
  ],
  options: [
    {
      name: '--data',
      short: '-d',
      description: 'JSON data object for non-interactive mode',
      type: 'string',
    },
    {
      name: '--interactive',
      short: '-i',
      description: 'Force interactive prompts for all fields',
      type: 'boolean',
      default: false,
    },
  ],
})
export class EntityCreateCommand extends BaseCommand {
  public constructor(private readonly orm: MikroORM) {
    super();
  }

  public async handle(): Promise<number> {
    const entityName = this.argument<string>('entity');
    const dataJson = this.option<string>('data');
    const interactive = this.option<boolean>('interactive') ?? false;
    const out = this.output as any;

    // Resolve entity metadata
    const metadata = (this.orm.getMetadata() as any).find(entityName);
    if (!metadata) {
      this.output.error(`Entity "${entityName}" not found in ORM metadata.`);
      out.info('Available entities:');
      const entities = this.orm.getMetadata().getAll() as any;
      out.list(
        entities.slice(0, 20).map((e: any) => e.className),
        { style: 'pointer' }
      );
      return 1;
    }

    let data: Record<string, unknown>;

    if (dataJson && !interactive) {
      // Non-interactive: parse JSON
      try {
        data = JSON.parse(dataJson);
      } catch {
        this.output.error('Invalid JSON provided in --data option.');
        return 1;
      }
    } else {
      // Interactive: prompt for each property
      this.output.intro(`Create ${entityName}`);
      data = await this.promptForFields(metadata);
    }

    // Create the entity
    const spinner = this.output.spinner();
    spinner.start(`Creating ${entityName}...`);

    try {
      const em = this.orm.em.fork();
      const entity = em.create(metadata.class, data as any);
      em.persist(entity);
      await em.flush();

      spinner.stop(`${entityName} created`, 0);

      out.newLine();
      out.separator(50, 'Created Record');
      out.pairs({
        Entity: entityName,
        ID: (entity as any).id ?? 'generated',
        ...this.extractDisplayFields(entity, metadata),
      });

      this.output.newLine();
      this.output.success(`${entityName} record created successfully.`);
      return 0;
    } catch (error: Error | any) {
      spinner.stop('Creation failed', 1);
      this.output.error(error instanceof Error ? error.message : String(error));
      return 1;
    }
  }

  /**
   * Prompt interactively for each writable property.
   */
  private async promptForFields(metadata: any): Promise<Record<string, unknown>> {
    const data: Record<string, unknown> = {};
    const properties = metadata.properties ?? metadata.props ?? [];

    for (const [name, prop] of Object.entries(properties) as [string, any][]) {
      // Skip auto-generated fields
      if (name === 'id' || name === 'createdAt' || name === 'updatedAt' || name === 'deletedAt')
        continue;
      if (prop.primary) continue;
      if (prop.onCreate || prop.onUpdate) continue;

      const type = prop.type ?? prop.columnTypes?.[0] ?? 'string';
      const required = !prop.nullable;
      const label = `${name}${required ? ' *' : ''} (${type})`;

      if (type === 'boolean' || type === 'bool') {
        data[name] = await this.output.confirm(label, { initialValue: false });
      } else if (prop.enum || prop.items) {
        const options = (prop.enum ?? prop.items ?? []).map((v: string) => ({
          value: v,
          label: v,
        }));
        if (options.length > 0) {
          data[name] = await this.output.select(label, options);
        } else {
          const value = await this.output.text(label, { placeholder: `Enter ${name}` });
          if (value) data[name] = value;
        }
      } else {
        const value = await this.output.text(label, {
          placeholder: `Enter ${name}`,
          validate: required ? (v: string) => (!v ? `${name} is required` : undefined) : undefined,
        });
        if (value) {
          data[name] = type === 'number' || type === 'integer' ? Number(value) : value;
        }
      }
    }

    return data;
  }

  /**
   * Extract displayable fields from created entity for summary.
   */
  private extractDisplayFields(entity: any, metadata: any): Record<string, string> {
    const fields: Record<string, string> = {};
    const props = Object.keys(metadata.properties ?? metadata.props ?? {}).slice(0, 5);
    for (const key of props) {
      if (key === 'id') continue;
      const value = entity[key];
      if (value !== undefined && value !== null) {
        fields[key] = String(value).slice(0, 50);
      }
    }
    return fields;
  }
}
