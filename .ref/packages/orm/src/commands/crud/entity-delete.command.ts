/**
 * @file entity-delete.command.ts
 * @module @stackra/nestjs-orm/commands/crud
 * @description Delete an entity record by ID (soft-delete or force-delete).
 */

import { IInjectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { ICommand, BaseCommand } from '@stackra/console';

/**
 * Delete an entity record.
 *
 * @example
 * ```bash
 * stackra entity:delete User abc123
 * stackra entity:delete User abc123 --hard
 * stackra entity:delete User abc123 --force
 * ```
 */
@ICommand({
  name: 'entity:delete',
  description: 'Delete an entity record by ID',
  arguments: [
    { name: 'entity', description: 'Entity class name', required: true },
    { name: 'id', description: 'Record ID to delete', required: true },
  ],
  options: [
    {
      name: '--hard',
      description: 'Permanently delete (skip soft-delete)',
      type: 'boolean',
      default: false,
    },
    {
      name: '--force',
      short: '-f',
      description: 'Skip confirmation prompt',
      type: 'boolean',
      default: false,
    },
  ],
})
export class EntityDeleteCommand extends BaseCommand {
  public constructor(private readonly orm: MikroORM) {
    super();
  }

  public async handle(): Promise<number> {
    const entityName = this.argument<string>('entity');
    const id = this.argument<string>('id');
    const hard = this.option<boolean>('hard') ?? false;
    const force = this.option<boolean>('force') ?? false;
    const out = this.output as any;

    const metadata = (this.orm.getMetadata() as any).find(entityName);
    if (!metadata) {
      this.output.error(`Entity "${entityName}" not found.`);
      return 1;
    }

    const em = this.orm.em.fork();
    const record = await em.findOne(metadata.class, { id } as any);
    if (!record) {
      this.output.error(`${entityName} with ID "${id}" not found.`);
      return 1;
    }

    // Show record summary before deletion
    out.pairs({
      Entity: entityName,
      ID: id,
      Action: hard ? 'PERMANENT DELETE' : 'soft-delete',
    });

    if (!force) {
      const action = hard ? 'PERMANENTLY DELETE' : 'soft-delete';
      this.output.warning(
        `This will ${action} the record. This cannot be undone${hard ? '' : ' without a restore'}.`
      );
      const confirmed = await this.output.confirm('Continue?', { initialValue: false });
      if (!confirmed) {
        this.output.info('Cancelled.');
        return 0;
      }
    }

    const spinner = this.output.spinner();
    spinner.start(`Deleting ${entityName} #${id}...`);

    try {
      if (hard) {
        em.remove(record as any);
      } else {
        // Soft-delete: set deletedAt
        (record as any).deletedAt = new Date();
      }
      await em.flush();

      spinner.stop('Deleted', 0);
      this.output.success(`${entityName} #${id} ${hard ? 'permanently deleted' : 'soft-deleted'}.`);
      return 0;
    } catch (error: Error | any) {
      spinner.stop('Delete failed', 1);
      this.output.error(error instanceof Error ? error.message : String(error));
      return 1;
    }
  }
}
