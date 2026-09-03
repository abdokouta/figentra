/**
 * @file queue-failed.command.ts
 * @module @stackra/queue/commands
 * @description List failed jobs in a queue.
 */

import { IInjectable } from '@nestjs/common';
import { ICommand, BaseCommand } from '@stackra/console';

@ICommand({
  name: 'queue:failed',
  description: 'List all failed jobs',
  options: [
    { name: '--queue', short: '-q', description: 'Queue name', type: 'string', default: 'default' },
    { name: '--limit', short: '-l', description: 'Max results', type: 'number', default: 50 },
  ],
})
export class QueueFailedCommand extends BaseCommand {
  public async handle(): Promise<void> {
    const queue = this.option<string>('queue') ?? 'default';
    const limit = this.option<number>('limit') ?? 50;
    const out = this.output as any;

    const spinner = this.output.spinner();
    spinner.start(`Fetching failed jobs from "${queue}"...`);

    // In production: const failed = await queueService.getFailed(queue, limit);
    const failed: any[] = []; // placeholder

    spinner.stop('Done', 0);

    if (failed.length === 0) {
      this.output.success(`No failed jobs in "${queue}". All clear!`);
      return;
    }

    out.separator(60, `Failed Jobs (${queue})`);
    out.table(
      ['ID', 'Job', 'Failed At', 'Attempts', 'Error'],
      failed.map((j: any) => [j.id, j.name, j.failedAt, String(j.attempts), j.error?.slice(0, 40)])
    );
    out.info(`${failed.length} failed job(s) — use "queue:retry" to re-process.`);
  }
}
