/**
 * @file migration-status.command.ts
 * @module @stackra/nestjs-orm/commands
 * @description Show status of all migrations. Delegates to MikroORM Migrator.
 */

import { IInjectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { ICommand, BaseCommand } from '@stackra/console';

/**
 * Show migration status — applied vs pending.
 *
 * @example
 * ```bash
 * stackra migration:status
 * ```
 */
@ICommand({
  name: 'migration:status',
  description: 'Show the status of all database migrations',
})
export class MigrationStatusCommand extends BaseCommand {
  public constructor(private readonly orm: MikroORM) {
    super();
  }

  public async handle(): Promise<void> {
    const out = this.output as any;
    const migrator = (this.orm as any).migrator;

    const executed = await migrator.getExecutedMigrations();
    const pending = await migrator.getPendingMigrations();

    const rows: string[][] = [];
    for (const m of executed) {
      rows.push([m.name ?? 'unknown', '✓ Applied', m.executedAt?.toISOString?.() ?? '-']);
    }
    for (const m of pending) {
      rows.push([(m as any).name ?? (m as any).fileName ?? 'unknown', '○ Pending', '-']);
    }

    if (rows.length === 0) {
      this.output.info('No migrations found.');
      return;
    }

    out.separator(60, 'Migration Status');
    out.table(['Migration', 'Status', 'Executed At'], rows);
    out.pairs({
      Applied: String(executed.length),
      Pending: String(pending.length),
      Total: String(executed.length + pending.length),
    });
  }
}
